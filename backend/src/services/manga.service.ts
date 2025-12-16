import { mangaRepository } from '../repositories/manga.repository.js';
import { sessionRepository } from '../repositories/session.repository.js';
import { pool } from '../config/database.js';
import { imageService } from './image.service.js';
import type {
  Manga,
  MangaComplete,
  CreateMangaInput,
  UpdateMangaInput,
  SearchMangaInput,
  TrackChapterInput,
  PaginatedResult,
  MangaRecommendation,
} from '../models/manga.model.js';
import { logger } from '../utils/logger.js';

// ============================================
// MANGA SERVICE
// ============================================

export class MangaService {
  // Create a new manga
  async createManga(input: CreateMangaInput): Promise<Manga> {
    logger.info('Creating manga', { title: input.primary_title });

    // Validate input
    if (!input.primary_title || input.primary_title.trim().length === 0) {
      throw new Error('Primary title is required');
    }

    if (input.rating !== undefined && (input.rating < 0 || input.rating > 10)) {
      throw new Error('Rating must be between 0 and 10');
    }

    const manga = await mangaRepository.create(input);

    // Generate embedding automatically in background
    if (manga.id) {
      setImmediate(async () => {
        try {
          const { AIService } = await import('./ai.service.js');
          const aiService = new AIService();
          await aiService.generateMangaEmbedding(manga.id);
          logger.info('Embedding generated for new manga', { mangaId: manga.id });
        } catch (error) {
          logger.error('Failed to generate embedding for new manga', { mangaId: manga.id, error });
        }
      });
    }

    return manga;
  }

  // Get manga by ID
  async getMangaById(id: string): Promise<Manga | null> {
    return await mangaRepository.findById(id);
  }

  // Get complete manga with all details
  async getCompleteMangaById(id: string): Promise<MangaComplete | null> {
    return await mangaRepository.findCompleteById(id);
  }

  // Search mangas
  async searchMangas(input: SearchMangaInput): Promise<PaginatedResult<MangaComplete>> {
    logger.info('Searching mangas', { query: input.query, filters: input });
    return await mangaRepository.search(input);
  }

  // Update manga
  async updateManga(id: string, input: UpdateMangaInput): Promise<Manga> {
    logger.info('Updating manga', { mangaId: id });

    // Validate rating if provided
    if (input.rating !== undefined && (input.rating < 0 || input.rating > 10)) {
      throw new Error('Rating must be between 0 and 10');
    }

    // Check if manga exists
    const existing = await mangaRepository.findById(id);
    if (!existing) {
      throw new Error('Manga not found');
    }

    const updated = await mangaRepository.update(id, input);

    // Regenerate embedding if relevant fields changed
    const embeddingFields = ['primary_title', 'alternative_names', 'synopsis', 'genres', 'themes', 'author', 'publisher'];
    const hasRelevantChanges = embeddingFields.some(field => input[field as keyof UpdateMangaInput] !== undefined);

    if (hasRelevantChanges) {
      setImmediate(async () => {
        try {
          const { AIService } = await import('./ai.service.js');
          const aiService = new AIService();
          await aiService.generateMangaEmbedding(id);
          logger.info('Embedding regenerated for updated manga', { mangaId: id });
        } catch (error) {
          logger.error('Failed to regenerate embedding for updated manga', { mangaId: id, error });
        }
      });
    }

    return updated;
  }

  // Delete manga
  async deleteManga(id: string, permanent: boolean = false): Promise<void> {
    logger.info('Deleting manga', { mangaId: id, permanent });

    const existing = await mangaRepository.findById(id);
    if (!existing) {
      throw new Error('Manga not found');
    }

    // If permanent deletion, also delete the image file
    if (permanent && existing.image_filename) {
      logger.info('Deleting associated image file', {
        mangaId: id,
        filename: existing.image_filename
      });
      imageService.deleteImage(existing.image_filename);
    }

    await mangaRepository.delete(id, permanent);
  }

  // Get mangas with alternative names
  async getMangasWithAlternativeNames(limit: number = 10): Promise<MangaComplete[]> {
    logger.info('Getting mangas with alternative names', { limit });
    return await mangaRepository.findWithAlternativeNames(limit);
  }

  // Track chapter progress
  async trackChapter(input: TrackChapterInput): Promise<Manga> {
    logger.info('Tracking chapter', {
      mangaId: input.manga_id,
      chapter: input.chapter_number,
    });

    // Validate chapter number
    if (input.chapter_number < 0) {
      throw new Error('Chapter number must be non-negative');
    }

    // Update last chapter read
    const manga = await mangaRepository.updateChapter(
      input.manga_id,
      input.chapter_number
    );

    // Create reading session if requested
    if (input.create_session !== false) {
      await sessionRepository.create(
        input.manga_id,
        input.chapter_number,
        input.duration_minutes,
        input.notes
      );
    }

    // Auto-update status if completed
    if (manga.total_chapters && input.chapter_number >= manga.total_chapters) {
      await mangaRepository.update(input.manga_id, { status: 'completed' });
      logger.info('Manga marked as completed', { mangaId: input.manga_id });
    }

    return manga;
  }

  // Get manga recommendations based on another manga
  async getRecommendations(
    mangaId: string,
    limit: number = 10
  ): Promise<MangaRecommendation[]> {
    logger.info('Getting recommendations', { baseMangaId: mangaId });

    const baseManga = await mangaRepository.findById(mangaId);
    if (!baseManga) {
      throw new Error('Base manga not found');
    }

    // Get similar mangas using vector similarity
    const similarMangas = await mangaRepository.findSimilar(mangaId, limit);

    return similarMangas.map((manga) => ({
      manga,
      similarity_score: 0.8, // Placeholder - actual score would come from vector distance
      reason: 'Similar themes and style',
    }));
  }

  // Get recommendations based on tags
  async getRecommendationsByTags(
    tags: string[],
    limit: number = 10
  ): Promise<Manga[]> {
    logger.info('Getting recommendations by tags', { tags });

    const result = await mangaRepository.search({
      tags,
      limit,
      offset: 0,
    });

    return result.data;
  }

  // Get manga statistics
  async getMangaStats(mangaId: string): Promise<any> {
    const stats = await sessionRepository.getStatsByMangaId(mangaId);
    const manga = await mangaRepository.findById(mangaId);

    if (!manga) {
      throw new Error('Manga not found');
    }

    return {
      ...stats,
      current_chapter: manga.last_chapter_read,
      total_chapters: manga.total_chapters,
      progress_percentage: manga.total_chapters
        ? (manga.last_chapter_read / manga.total_chapters) * 100
        : null,
      status: manga.status,
      rating: manga.rating,
    };
  }

  // Get all mangas (for admin/export)
  async getAllMangas(): Promise<Manga[]> {
    return await mangaRepository.findAll();
  }

  // Find potential duplicate mangas
  async findDuplicates(): Promise<{ group: MangaComplete[], similarity: string }[]> {
    logger.info('Finding duplicate mangas');
    return await mangaRepository.findDuplicates();
  }

  // Merge multiple mangas into one (keep the target, delete the others)
  async mergeMangas(targetId: string, sourceIds: string[]): Promise<MangaComplete> {
    logger.info('Merging mangas', { targetId, sourceIds });

    // Get target manga
    const target = await mangaRepository.findCompleteById(targetId);
    if (!target) {
      throw new Error('Target manga not found');
    }

    // Collect data from all sources to merge
    const allTags = new Set<string>(target.tags || []);
    const allNames = new Set<string>(target.alternative_names || []);
    let highestChapter = target.last_chapter_read || 0;
    let highestRating = target.rating ? Number(target.rating) : 0;
    let bestSynopsis = target.synopsis || '';
    let totalChapters = target.total_chapters || 0;
    const userNotes: string[] = target.user_notes ? [target.user_notes] : [];

    // Process each source manga
    for (const sourceId of sourceIds) {
      if (sourceId === targetId) continue;

      const source = await mangaRepository.findCompleteById(sourceId);
      if (!source) {
        logger.warn('Source manga not found, skipping', { sourceId });
        continue;
      }

      // Collect tags
      if (source.tags) {
        source.tags.forEach(tag => allTags.add(tag));
      }

      // Collect alternative names (including primary title of source)
      allNames.add(source.primary_title);
      if (source.alternative_names) {
        source.alternative_names.forEach(name => allNames.add(name));
      }

      // Keep highest chapter read
      if (source.last_chapter_read && source.last_chapter_read > highestChapter) {
        highestChapter = source.last_chapter_read;
      }

      // Keep highest rating
      if (source.rating && Number(source.rating) > highestRating) {
        highestRating = Number(source.rating);
      }

      // Keep longest synopsis
      if (source.synopsis && source.synopsis.length > bestSynopsis.length) {
        bestSynopsis = source.synopsis;
      }

      // Keep highest total chapters
      if (source.total_chapters && source.total_chapters > totalChapters) {
        totalChapters = source.total_chapters;
      }

      // Collect user notes
      if (source.user_notes) {
        userNotes.push(`[De ${source.primary_title}]: ${source.user_notes}`);
      }

      // Delete source manga (permanent) and its image
      if (source.image_filename) {
        imageService.deleteImage(source.image_filename);
      }
      await mangaRepository.delete(sourceId, true);
      logger.info('Source manga deleted', { sourceId, title: source.primary_title });
    }

    // Remove target's primary title from alternative names if present
    allNames.delete(target.primary_title);

    // Get current tags and names for comparison
    const currentTags = new Set(target.tags || []);
    const currentNames = new Set(target.alternative_names || []);

    // Calculate tags and names to add
    const tagsToAdd = [...allTags].filter(t => !currentTags.has(t));
    const namesToAdd = [...allNames].filter(n => !currentNames.has(n));

    // Update target manga with merged data
    const updateData: UpdateMangaInput = {};

    if (tagsToAdd.length > 0) {
      updateData.add_tags = tagsToAdd;
    }

    if (namesToAdd.length > 0) {
      updateData.add_names = namesToAdd;
    }

    if (highestChapter > (target.last_chapter_read || 0)) {
      updateData.last_chapter_read = highestChapter;
    }

    if (highestRating > (target.rating ? Number(target.rating) : 0)) {
      updateData.rating = highestRating;
    }

    if (bestSynopsis.length > (target.synopsis?.length || 0)) {
      updateData.synopsis = bestSynopsis;
    }

    if (totalChapters > (target.total_chapters || 0)) {
      updateData.total_chapters = totalChapters;
    }

    if (userNotes.length > 1) {
      updateData.user_notes = userNotes.join('\n\n');
    }

    // Apply updates if any
    if (Object.keys(updateData).length > 0) {
      await mangaRepository.update(targetId, updateData);
    }

    // Always update the updated_at timestamp after merge
    await mangaRepository.touchUpdatedAt(targetId);

    // Return updated target
    const mergedManga = await mangaRepository.findCompleteById(targetId);
    logger.info('Manga merge completed', {
      targetId,
      mergedCount: sourceIds.length,
      finalTags: mergedManga?.tags?.length || 0,
      finalNames: mergedManga?.alternative_names?.length || 0
    });

    return mergedManga!;
  }

  // Delete multiple mangas
  async deleteMultiple(ids: string[], permanent: boolean = false): Promise<number> {
    logger.info('Deleting multiple mangas', { count: ids.length, permanent });

    let deleted = 0;
    for (const id of ids) {
      try {
        await this.deleteManga(id, permanent);
        deleted++;
      } catch (error) {
        logger.error('Error deleting manga in batch', { mangaId: id, error });
      }
    }

    return deleted;
  }

  // Batch update mangas (for migration)
  async batchCreate(mangas: CreateMangaInput[]): Promise<Manga[]> {
    logger.info('Batch creating mangas', { count: mangas.length });

    const created: Manga[] = [];
    for (const mangaInput of mangas) {
      try {
        const manga = await mangaRepository.create(mangaInput);
        created.push(manga);
      } catch (error) {
        logger.error('Error in batch create', {
          title: mangaInput.primary_title,
          error,
        });
      }
    }

    return created;
  }

  // Get general statistics
  async getStats(): Promise<any> {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'reading') as reading,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'paused') as paused,
        COUNT(*) FILTER (WHERE status = 'dropped') as dropped,
        COUNT(*) FILTER (WHERE status = 'plan_to_read') as plan_to_read,
        COUNT(*) FILTER (WHERE image_filename IS NOT NULL) as with_covers,
        ROUND(AVG(rating), 2) as avg_rating,
        ROUND(AVG(last_chapter_read), 2) as avg_chapters_read
      FROM mangas
      WHERE deleted_at IS NULL
    `);

    return result.rows[0];
  }

  // Get top read mangas
  async getTopRead(limit: number = 10): Promise<Manga[]> {
    const result = await pool.query(
      `SELECT * FROM mangas 
       WHERE deleted_at IS NULL AND last_chapter_read > 0
       ORDER BY last_chapter_read DESC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  // Get recently updated mangas
  async getRecentlyUpdated(limit: number = 10): Promise<Manga[]> {
    const result = await pool.query(
      `SELECT * FROM mangas 
       WHERE deleted_at IS NULL
       ORDER BY updated_at DESC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  // List all tags
  async listTags(): Promise<any[]> {
    const result = await pool.query(`
      SELECT t.*, COUNT(mt.manga_id) as usage_count
      FROM tags t
      LEFT JOIN manga_tags mt ON t.id = mt.tag_id
      GROUP BY t.id
      ORDER BY t.name
    `);
    return result.rows;
  }

  // Get popular tags
  async getPopularTags(limit: number = 20): Promise<any[]> {
    const result = await pool.query(
      `SELECT t.*, COUNT(mt.manga_id) as usage_count
       FROM tags t
       LEFT JOIN manga_tags mt ON t.id = mt.tag_id
       GROUP BY t.id
       ORDER BY usage_count DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }
}

export const mangaService = new MangaService();
