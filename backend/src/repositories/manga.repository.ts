import { query, getClient } from '../config/database';
import type {
  Manga,
  MangaComplete,
  DatabaseManga,
  CreateMangaInput,
  UpdateMangaInput,
  SearchMangaInput,
  PaginatedResult,
} from '../models/manga.model';
import { logger } from '../utils/logger';

// ============================================
// MANGA REPOSITORY
// ============================================

export class MangaRepository {
  // Create a new manga
  async create(input: CreateMangaInput): Promise<Manga> {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Insert manga
      const insertMangaQuery = `
        INSERT INTO mangas (
          primary_title, url, image_url, synopsis, status, rating, total_chapters
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const result = await client.query<DatabaseManga>(insertMangaQuery, [
        input.primary_title,
        input.url || null,
        input.image_url || null,
        input.synopsis || null,
        input.status || 'plan_to_read',
        input.rating || null,
        input.total_chapters || null,
      ]);

      const manga = this.mapDatabaseManga(result.rows[0]);

      // Insert alternative names if provided
      if (input.alternative_names && input.alternative_names.length > 0) {
        const insertNamesQuery = `
          INSERT INTO manga_names (manga_id, name)
          VALUES ${input.alternative_names.map((_, i) => `($1, $${i + 2})`).join(', ')}
        `;
        await client.query(insertNamesQuery, [
          manga.id,
          ...input.alternative_names,
        ]);
      }

      // Insert tags if provided
      if (input.tags && input.tags.length > 0) {
        await this.addTags(client, manga.id, input.tags);
      }

      await client.query('COMMIT');
      logger.info('Manga created', { mangaId: manga.id, title: manga.primary_title });

      return manga;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating manga', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  // Find manga by ID
  async findById(id: string): Promise<Manga | null> {
    const result = await query<DatabaseManga>(
      'SELECT * FROM mangas WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );

    if (result.rows.length === 0) return null;
    return this.mapDatabaseManga(result.rows[0]);
  }

  // Find manga by legacy ID (for migration)
  async findByLegacyId(legacyId: number): Promise<Manga | null> {
    const result = await query<DatabaseManga>(
      'SELECT * FROM mangas WHERE legacy_id = $1 AND deleted_at IS NULL',
      [legacyId]
    );

    if (result.rows.length === 0) return null;
    return this.mapDatabaseManga(result.rows[0]);
  }

  // Get complete manga view (with alternative names, tags, etc.)
  async findCompleteById(id: string): Promise<MangaComplete | null> {
    const result = await query(
      'SELECT * FROM v_manga_complete WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) return null;
    return result.rows[0] as MangaComplete;
  }

  // Search mangas
  async search(input: SearchMangaInput): Promise<PaginatedResult<MangaComplete>> {
    const limit = input.limit || 20;
    const offset = input.offset || 0;

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Text search (title or synopsis)
    if (input.query) {
      whereConditions.push(`(
        m.primary_title ILIKE $${paramIndex} OR
        m.synopsis ILIKE $${paramIndex} OR
        EXISTS (
          SELECT 1 FROM manga_names mn
          WHERE mn.manga_id = m.id AND mn.name ILIKE $${paramIndex}
        )
      )`);
      queryParams.push(`%${input.query}%`);
      paramIndex++;
    }

    // Filter by status
    if (input.status && input.status.length > 0) {
      whereConditions.push(`m.status = ANY($${paramIndex})`);
      queryParams.push(input.status);
      paramIndex++;
    }

    // Filter by minimum rating
    if (input.min_rating !== undefined) {
      whereConditions.push(`m.rating >= $${paramIndex}`);
      queryParams.push(input.min_rating);
      paramIndex++;
    }

    // Filter by tags
    if (input.tags && input.tags.length > 0) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM manga_tags mt
        JOIN tags t ON mt.tag_id = t.id
        WHERE mt.manga_id = m.id AND t.name = ANY($${paramIndex})
      )`);
      queryParams.push(input.tags);
      paramIndex++;
    }

    // Filter only with covers
    if (input.with_covers) {
      whereConditions.push(`m.image_filename IS NOT NULL`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Determine sort column and order
    const sortBy = input.sort_by || 'updated_at';
    const sortOrder = input.sort_order || 'desc';
    
    // Validate sort column to prevent SQL injection
    const allowedSortColumns = ['updated_at', 'created_at', 'primary_title', 'rating', 'last_chapter_read'];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'updated_at';
    const orderDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Count total results
    const countQuery = `
      SELECT COUNT(*) as total
      FROM mangas m
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated results
    const searchQuery = `
      SELECT * FROM v_manga_complete m
      ${whereClause}
      ORDER BY m.${sortColumn} ${orderDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const result = await query(
      searchQuery,
      [...queryParams, limit, offset]
    );

    return {
      data: result.rows as MangaComplete[],
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  // Update manga
  async update(id: string, input: UpdateMangaInput): Promise<Manga> {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Build dynamic update query
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.primary_title !== undefined) {
        updates.push(`primary_title = $${paramIndex++}`);
        values.push(input.primary_title);
      }
      if (input.url !== undefined) {
        updates.push(`url = $${paramIndex++}`);
        values.push(input.url);
      }
      if (input.image_url !== undefined) {
        updates.push(`image_url = $${paramIndex++}`);
        values.push(input.image_url);
      }
      if (input.synopsis !== undefined) {
        updates.push(`synopsis = $${paramIndex++}`);
        values.push(input.synopsis);
      }
      if (input.user_notes !== undefined) {
        updates.push(`user_notes = $${paramIndex++}`);
        values.push(input.user_notes);
      }
      if (input.status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(input.status);
      }
      if (input.rating !== undefined) {
        updates.push(`rating = $${paramIndex++}`);
        values.push(input.rating);
      }
      if (input.total_chapters !== undefined) {
        updates.push(`total_chapters = $${paramIndex++}`);
        values.push(input.total_chapters);
      }

      if (updates.length > 0) {
        const updateQuery = `
          UPDATE mangas
          SET ${updates.join(', ')}
          WHERE id = $${paramIndex} AND deleted_at IS NULL
          RETURNING *
        `;
        values.push(id);

        const result = await client.query<DatabaseManga>(updateQuery, values);
        if (result.rows.length === 0) {
          throw new Error('Manga not found');
        }
      }

      // Handle alternative names
      if (input.add_names && input.add_names.length > 0) {
        const insertNamesQuery = `
          INSERT INTO manga_names (manga_id, name)
          VALUES ${input.add_names.map((_, i) => `($1, $${i + 2})`).join(', ')}
          ON CONFLICT (manga_id, name) DO NOTHING
        `;
        await client.query(insertNamesQuery, [id, ...input.add_names]);
      }

      if (input.remove_names && input.remove_names.length > 0) {
        await client.query(
          'DELETE FROM manga_names WHERE manga_id = $1 AND name = ANY($2)',
          [id, input.remove_names]
        );
      }

      // Handle tags
      if (input.add_tags && input.add_tags.length > 0) {
        await this.addTags(client, id, input.add_tags);
      }

      if (input.remove_tags && input.remove_tags.length > 0) {
        await this.removeTags(client, id, input.remove_tags);
      }

      await client.query('COMMIT');

      const manga = await this.findById(id);
      if (!manga) throw new Error('Manga not found after update');

      logger.info('Manga updated', { mangaId: id });
      return manga;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error updating manga', { error, mangaId: id });
      throw error;
    } finally {
      client.release();
    }
  }

  // Soft delete manga
  async delete(id: string, permanent: boolean = false): Promise<void> {
    if (permanent) {
      await query('DELETE FROM mangas WHERE id = $1', [id]);
      logger.info('Manga permanently deleted', { mangaId: id });
    } else {
      await query(
        'UPDATE mangas SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );
      logger.info('Manga soft deleted', { mangaId: id });
    }
  }

  // Update last chapter read
  async updateChapter(id: string, chapterNumber: number): Promise<Manga> {
    const result = await query<DatabaseManga>(
      `UPDATE mangas
       SET last_chapter_read = $1, last_read_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [chapterNumber, id]
    );

    if (result.rows.length === 0) {
      throw new Error('Manga not found');
    }

    logger.info('Chapter updated', { mangaId: id, chapter: chapterNumber });
    return this.mapDatabaseManga(result.rows[0]);
  }

  // Update image filename
  async updateImageFilename(id: string, filename: string): Promise<void> {
    await query(
      'UPDATE mangas SET image_filename = $1 WHERE id = $2',
      [filename, id]
    );
  }

  // Update embedding
  async updateEmbedding(id: string, embedding: number[]): Promise<void> {
    await query(
      'UPDATE mangas SET embedding = $1 WHERE id = $2',
      [JSON.stringify(embedding), id]
    );
  }

  // Find similar mangas using vector similarity
  async findSimilar(mangaId: string, limit: number = 10): Promise<Manga[]> {
    const result = await query<DatabaseManga>(
      `SELECT m.*
       FROM mangas m
       WHERE m.id != $1
         AND m.deleted_at IS NULL
         AND m.embedding IS NOT NULL
       ORDER BY m.embedding <=> (
         SELECT embedding FROM mangas WHERE id = $1
       )
       LIMIT $2`,
      [mangaId, limit]
    );

    return result.rows.map(row => this.mapDatabaseManga(row));
  }

  // Get all mangas (for migration/admin)
  async findAll(): Promise<Manga[]> {
    const result = await query<DatabaseManga>(
      'SELECT * FROM mangas WHERE deleted_at IS NULL ORDER BY updated_at DESC'
    );
    return result.rows.map(row => this.mapDatabaseManga(row));
  }

  // Find mangas with alternative names
  async findWithAlternativeNames(limit: number = 10): Promise<MangaComplete[]> {
    const queryText = `
      SELECT DISTINCT m.*
      FROM v_manga_complete m
      WHERE EXISTS (
        SELECT 1 FROM manga_names mn WHERE mn.manga_id = m.id
      )
      ORDER BY m.primary_title
      LIMIT $1
    `;

    const result = await query(queryText, [limit]);
    return result.rows;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async addTags(client: any, mangaId: string, tagNames: string[]): Promise<void> {
    // Ensure tags exist
    for (const tagName of tagNames) {
      await client.query(
        'INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [tagName]
      );
    }

    // Link tags to manga
    const linkQuery = `
      INSERT INTO manga_tags (manga_id, tag_id)
      SELECT $1, id FROM tags WHERE name = ANY($2)
      ON CONFLICT DO NOTHING
    `;
    await client.query(linkQuery, [mangaId, tagNames]);
  }

  private async removeTags(client: any, mangaId: string, tagNames: string[]): Promise<void> {
    await client.query(
      `DELETE FROM manga_tags
       WHERE manga_id = $1 AND tag_id IN (
         SELECT id FROM tags WHERE name = ANY($2)
       )`,
      [mangaId, tagNames]
    );
  }

  private mapDatabaseManga(dbManga: DatabaseManga): Manga {
    return {
      id: dbManga.id,
      primary_title: dbManga.primary_title,
      url: dbManga.url || undefined,
      image_filename: dbManga.image_filename || undefined,
      image_url: dbManga.image_url || undefined,
      last_chapter_read: dbManga.last_chapter_read,
      total_chapters: dbManga.total_chapters || undefined,
      rating: dbManga.rating ? parseFloat(dbManga.rating) : undefined,
      status: dbManga.status as any,
      synopsis: dbManga.synopsis || undefined,
      user_notes: dbManga.user_notes || undefined,
      embedding: dbManga.embedding ? JSON.parse(dbManga.embedding) : undefined,
      legacy_id: dbManga.legacy_id || undefined,
      legacy_parent_id: dbManga.legacy_parent_id || undefined,
      created_at: new Date(dbManga.created_at),
      updated_at: new Date(dbManga.updated_at),
      last_read_at: dbManga.last_read_at ? new Date(dbManga.last_read_at) : undefined,
      deleted_at: dbManga.deleted_at ? new Date(dbManga.deleted_at) : undefined,
    };
  }
}

export const mangaRepository = new MangaRepository();
