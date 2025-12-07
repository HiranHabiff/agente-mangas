import { query } from '../config/database.js';
import type { Tag } from '../models/manga.model.js';
import { logger } from '../utils/logger.js';

// ============================================
// TAG REPOSITORY
// ============================================

export class TagRepository {
  // Create a new tag
  async create(name: string, category?: string, color?: string): Promise<Tag> {
    const result = await query<Tag>(
      `INSERT INTO tags (name, category, color)
       VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE SET category = $2, color = $3
       RETURNING *`,
      [name, category || null, color || null]
    );

    logger.info('Tag created/updated', { tagName: name });
    return result.rows[0];
  }

  // Find tag by ID
  async findById(id: string): Promise<Tag | null> {
    const result = await query<Tag>(
      'SELECT * FROM tags WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  // Find tag by name
  async findByName(name: string): Promise<Tag | null> {
    const result = await query<Tag>(
      'SELECT * FROM tags WHERE name = $1',
      [name]
    );

    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  // Get all tags
  async findAll(): Promise<Tag[]> {
    const result = await query<Tag>(
      'SELECT * FROM tags ORDER BY category, name'
    );
    return result.rows;
  }

  // Get tags by category
  async findByCategory(category: string): Promise<Tag[]> {
    const result = await query<Tag>(
      'SELECT * FROM tags WHERE category = $1 ORDER BY name',
      [category]
    );
    return result.rows;
  }

  // Get popular tags (most used)
  async getPopularTags(limit: number = 20): Promise<Array<Tag & { usage_count: number }>> {
    const result = await query(
      `SELECT t.*, COUNT(mt.manga_id) as usage_count
       FROM tags t
       LEFT JOIN manga_tags mt ON t.id = mt.tag_id
       GROUP BY t.id
       ORDER BY usage_count DESC, t.name
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  // Search tags by name
  async search(query_text: string, limit: number = 10): Promise<Tag[]> {
    const result = await query<Tag>(
      `SELECT * FROM tags
       WHERE name ILIKE $1
       ORDER BY name
       LIMIT $2`,
      [`%${query_text}%`, limit]
    );
    return result.rows;
  }

  // Delete tag
  async delete(id: string): Promise<void> {
    await query('DELETE FROM tags WHERE id = $1', [id]);
    logger.info('Tag deleted', { tagId: id });
  }

  // Update tag
  async update(id: string, updates: { name?: string; category?: string; color?: string }): Promise<Tag> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.category !== undefined) {
      fields.push(`category = $${paramIndex++}`);
      values.push(updates.category);
    }
    if (updates.color !== undefined) {
      fields.push(`color = $${paramIndex++}`);
      values.push(updates.color);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const result = await query<Tag>(
      `UPDATE tags SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Tag not found');
    }

    logger.info('Tag updated', { tagId: id });
    return result.rows[0];
  }
}

export const tagRepository = new TagRepository();
