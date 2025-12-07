import { mangaService } from '../../services/manga.service.js';
import type { TrackChapterInput } from '../../models/manga.model.js';
import { logger } from '../../utils/logger.js';

// ============================================
// CHAPTER TRACKING TOOLS
// ============================================

export const chapterTrackingTools = {
  async track_chapter(input: TrackChapterInput) {
    try {
      const manga = await mangaService.trackChapter(input);

      const progressText = manga.total_chapters
        ? `${manga.last_chapter_read}/${manga.total_chapters} (${Math.round((manga.last_chapter_read / manga.total_chapters) * 100)}%)`
        : `${manga.last_chapter_read}`;

      return {
        content: [
          {
            type: 'text',
            text: `✓ Chapter tracked successfully!\n\nManga: ${manga.primary_title}\nChapter: ${input.chapter_number}\nProgress: ${progressText}\nStatus: ${manga.status}`,
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error('MCP track_chapter error', { error });
      return {
        content: [
          {
            type: 'text',
            text: `✗ Error tracking chapter: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },

  async get_manga_stats(input: { manga_id: string }) {
    try {
      const stats = await mangaService.getMangaStats(input.manga_id);

      const progressText = stats.total_chapters
        ? `${stats.current_chapter}/${stats.total_chapters} (${stats.progress_percentage?.toFixed(1)}%)`
        : `${stats.current_chapter} chapters`;

      const avgTimeText = stats.average_time_per_chapter > 0
        ? `\nAverage time per chapter: ${Math.round(stats.average_time_per_chapter)} minutes`
        : '';

      return {
        content: [
          {
            type: 'text',
            text: `📊 Reading Statistics

Progress: ${progressText}
Status: ${stats.status}
Rating: ${stats.rating || 'Not rated'}

Reading Activity:
• Total sessions: ${stats.total_sessions}
• Chapters read: ${stats.total_chapters_read}
• Total time: ${Math.round(stats.total_reading_time_minutes)} minutes (${(stats.total_reading_time_minutes / 60).toFixed(1)} hours)${avgTimeText}`,
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error('MCP get_manga_stats error', { error });
      return {
        content: [
          {
            type: 'text',
            text: `✗ Error fetching stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
};
