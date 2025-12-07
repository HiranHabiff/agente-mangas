import { mangaService } from '../../services/manga.service.js';
import type {
  CreateMangaInput,
  UpdateMangaInput,
  SearchMangaInput,
} from '../../models/manga.model.js';
import { logger } from '../../utils/logger.js';

// ============================================
// MANGA CRUD TOOLS
// ============================================

export const mangaCrudTools = {
  async create_manga(input: CreateMangaInput) {
    try {
      const manga = await mangaService.createManga(input);

      return {
        content: [
          {
            type: 'text',
            text: `✓ Manga created successfully!\n\nID: ${manga.id}\nTitle: ${manga.primary_title}\nStatus: ${manga.status}\nURL: ${manga.url || 'Not provided'}`,
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error('MCP create_manga error', { error });
      return {
        content: [
          {
            type: 'text',
            text: `✗ Error creating manga: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },

  async search_manga(input: SearchMangaInput) {
    try {
      const result = await mangaService.searchMangas(input);

      if (result.data.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No mangas found matching your criteria.',
            },
          ],
          isError: false,
        };
      }

      // Format results
      const mangaList = result.data
        .map((manga, index) => {
          const altNames = manga.alternative_names?.length
            ? `\n  Alt names: ${manga.alternative_names.join(', ')}`
            : '';
          const tags = manga.tags?.length
            ? `\n  Tags: ${manga.tags.join(', ')}`
            : '';
          const rating = manga.rating ? `\n  Rating: ${manga.rating}/10` : '';

          return `${index + 1}. ${manga.primary_title} (${manga.status})
  ID: ${manga.id}
  Chapter: ${manga.last_chapter_read}${manga.total_chapters ? `/${manga.total_chapters}` : ''}${rating}${altNames}${tags}`;
        })
        .join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `Found ${result.total} manga(s) (showing ${result.data.length}):\n\n${mangaList}\n\n${result.hasMore ? `More results available (offset: ${result.offset + result.limit})` : 'End of results'}`,
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error('MCP search_manga error', { error });
      return {
        content: [
          {
            type: 'text',
            text: `✗ Error searching mangas: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },

  async get_manga(input: { manga_id: string }) {
    try {
      const manga = await mangaService.getCompleteMangaById(input.manga_id);

      if (!manga) {
        return {
          content: [
            {
              type: 'text',
              text: '✗ Manga not found',
            },
          ],
          isError: true,
        };
      }

      const altNames = manga.alternative_names?.length
        ? `\n\nAlternative Names:\n${manga.alternative_names.map(n => `  • ${n}`).join('\n')}`
        : '';

      const tags = manga.tags?.length
        ? `\n\nTags: ${manga.tags.join(', ')}`
        : '';

      const synopsis = manga.synopsis
        ? `\n\nSynopsis:\n${manga.synopsis}`
        : '';

      const notes = manga.user_notes
        ? `\n\nNotes:\n${manga.user_notes}`
        : '';

      const text = `📚 ${manga.primary_title}

ID: ${manga.id}
Status: ${manga.status}
Rating: ${manga.rating || 'Not rated'}
Progress: Chapter ${manga.last_chapter_read}${manga.total_chapters ? `/${manga.total_chapters}` : ''}
URL: ${manga.url || 'Not provided'}
Reading Sessions: ${manga.reading_session_count}
Last Read: ${manga.last_read_at ? new Date(manga.last_read_at).toLocaleDateString() : 'Never'}${altNames}${tags}${synopsis}${notes}`;

      return {
        content: [{ type: 'text', text }],
        isError: false,
      };
    } catch (error) {
      logger.error('MCP get_manga error', { error });
      return {
        content: [
          {
            type: 'text',
            text: `✗ Error fetching manga: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },

  async update_manga(input: { manga_id: string; updates: UpdateMangaInput }) {
    try {
      const manga = await mangaService.updateManga(input.manga_id, input.updates);

      return {
        content: [
          {
            type: 'text',
            text: `✓ Manga updated successfully!\n\nTitle: ${manga.primary_title}\nStatus: ${manga.status}`,
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error('MCP update_manga error', { error });
      return {
        content: [
          {
            type: 'text',
            text: `✗ Error updating manga: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },

  async delete_manga(input: { manga_id: string; permanent?: boolean }) {
    try {
      await mangaService.deleteManga(input.manga_id, input.permanent);

      return {
        content: [
          {
            type: 'text',
            text: `✓ Manga ${input.permanent ? 'permanently ' : ''}deleted successfully`,
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error('MCP delete_manga error', { error });
      return {
        content: [
          {
            type: 'text',
            text: `✗ Error deleting manga: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
};
