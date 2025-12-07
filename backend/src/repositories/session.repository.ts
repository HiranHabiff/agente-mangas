import { query } from '../config/database';
import type { ReadingSession } from '../models/manga.model';
import { logger } from '../utils/logger';

// ============================================
// READING SESSION REPOSITORY
// ============================================

export class SessionRepository {
  // Create a new reading session
  async create(
    mangaId: string,
    chapterNumber: number,
    durationMinutes?: number,
    notes?: string
  ): Promise<ReadingSession> {
    const result = await query<ReadingSession>(
      `INSERT INTO reading_sessions (manga_id, chapter_number, duration_minutes, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [mangaId, chapterNumber, durationMinutes || null, notes || null]
    );

    logger.info('Reading session created', {
      sessionId: result.rows[0].id,
      mangaId,
      chapter: chapterNumber,
    });

    return result.rows[0];
  }

  // Get sessions for a manga
  async findByMangaId(mangaId: string, limit: number = 50): Promise<ReadingSession[]> {
    const result = await query<ReadingSession>(
      `SELECT * FROM reading_sessions
       WHERE manga_id = $1
       ORDER BY started_at DESC
       LIMIT $2`,
      [mangaId, limit]
    );
    return result.rows;
  }

  // Get recent sessions across all mangas
  async findRecent(limit: number = 20): Promise<ReadingSession[]> {
    const result = await query<ReadingSession>(
      `SELECT * FROM reading_sessions
       ORDER BY started_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  // Get session statistics for a manga
  async getStatsByMangaId(mangaId: string): Promise<{
    total_sessions: number;
    total_chapters_read: number;
    total_time_minutes: number;
    average_time_per_chapter: number;
  }> {
    const result = await query(
      `SELECT
        COUNT(*) as total_sessions,
        COUNT(DISTINCT chapter_number) as total_chapters_read,
        COALESCE(SUM(duration_minutes), 0) as total_time_minutes,
        COALESCE(AVG(duration_minutes), 0) as average_time_per_chapter
       FROM reading_sessions
       WHERE manga_id = $1`,
      [mangaId]
    );

    return {
      total_sessions: parseInt(result.rows[0].total_sessions, 10),
      total_chapters_read: parseInt(result.rows[0].total_chapters_read, 10),
      total_time_minutes: parseInt(result.rows[0].total_time_minutes, 10),
      average_time_per_chapter: parseFloat(result.rows[0].average_time_per_chapter),
    };
  }

  // Get overall reading statistics
  async getOverallStats(timePeriodDays?: number): Promise<{
    total_sessions: number;
    total_mangas: number;
    total_chapters_read: number;
    total_time_minutes: number;
  }> {
    let timeCondition = '';
    const params: any[] = [];

    if (timePeriodDays) {
      timeCondition = `WHERE started_at >= CURRENT_TIMESTAMP - INTERVAL '${timePeriodDays} days'`;
    }

    const result = await query(
      `SELECT
        COUNT(*) as total_sessions,
        COUNT(DISTINCT manga_id) as total_mangas,
        COUNT(*) as total_chapters_read,
        COALESCE(SUM(duration_minutes), 0) as total_time_minutes
       FROM reading_sessions
       ${timeCondition}`,
      params
    );

    return {
      total_sessions: parseInt(result.rows[0].total_sessions, 10),
      total_mangas: parseInt(result.rows[0].total_mangas, 10),
      total_chapters_read: parseInt(result.rows[0].total_chapters_read, 10),
      total_time_minutes: parseInt(result.rows[0].total_time_minutes, 10),
    };
  }

  // Delete session
  async delete(id: string): Promise<void> {
    await query('DELETE FROM reading_sessions WHERE id = $1', [id]);
    logger.info('Reading session deleted', { sessionId: id });
  }
}

export const sessionRepository = new SessionRepository();
