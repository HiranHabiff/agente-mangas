import { aiService } from '../../services/ai.service.js';
import { mangaService } from '../../services/manga.service.js';
import { logger } from '../../utils/logger.js';

// ============================================
// AI-POWERED TOOLS
// ============================================

export const aiAssistantTools = {
  async get_recommendations(input: {
    based_on_manga_id?: string;
    based_on_tags?: string[];
    limit?: number;
  }) {
    try {
      const limit = input.limit || 10;

      if (input.based_on_manga_id) {
        const recommendations = await mangaService.getRecommendations(
          input.based_on_manga_id,
          limit
        );

        if (recommendations.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No recommendations found. Try adding more mangas or tags.',
              },
            ],
            isError: false,
          };
        }

        const recList = recommendations
          .map((rec, index) => {
            const manga = rec.manga;
            const rating = manga.rating ? ` • ${manga.rating}/10` : '';
            return `${index + 1}. ${manga.primary_title} (${manga.status})${rating}
   ID: ${manga.id}
   Reason: ${rec.reason}`;
          })
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `🎯 Recommendations:\n\n${recList}`,
            },
          ],
          isError: false,
        };
      } else if (input.based_on_tags && input.based_on_tags.length > 0) {
        const mangas = await mangaService.getRecommendationsByTags(
          input.based_on_tags,
          limit
        );

        if (mangas.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No mangas found with tags: ${input.based_on_tags.join(', ')}`,
              },
            ],
            isError: false,
          };
        }

        const mangaList = mangas
          .map((manga, index) => {
            const rating = manga.rating ? ` • ${manga.rating}/10` : '';
            return `${index + 1}. ${manga.primary_title} (${manga.status})${rating}
   ID: ${manga.id}`;
          })
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `🎯 Mangas with tags [${input.based_on_tags.join(', ')}]:\n\n${mangaList}`,
            },
          ],
          isError: false,
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: '✗ Please provide either based_on_manga_id or based_on_tags',
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      logger.error('MCP get_recommendations error', { error });
      return {
        content: [
          {
            type: 'text',
            text: `✗ Error getting recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },

  async analyze_reading_habits(input: { time_period_days?: number }) {
    try {
      const analysis = await aiService.analyzeReadingHabits(
        input.time_period_days || 30
      );

      const genreList = analysis.favorite_genres
        .slice(0, 5)
        .map(g => `  • ${g.genre}: ${g.count} mangas`)
        .join('\n');

      const mostReadList = analysis.most_read_mangas
        .map(m => `  • ${m.manga.primary_title}: ${m.chapters_read} chapters`)
        .join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `📈 Reading Habits Analysis (Last ${input.time_period_days || 30} days)

Overview:
• Total mangas: ${analysis.total_mangas}
• Chapters read: ${analysis.total_chapters_read}
• Time spent: ${Math.round(analysis.total_reading_time_minutes)} minutes (${(analysis.total_reading_time_minutes / 60).toFixed(1)} hours)
• Avg chapters/session: ${analysis.average_chapters_per_session.toFixed(1)}

Favorite Genres:
${genreList || '  No data yet'}

Most Read:
${mostReadList || '  No data yet'}`,
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error('MCP analyze_reading_habits error', { error });
      return {
        content: [
          {
            type: 'text',
            text: `✗ Error analyzing habits: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },

  async extract_tags(input: { synopsis: string }) {
    try {
      const tags = await aiService.extractTagsFromSynopsis(input.synopsis);

      if (tags.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No tags could be extracted from the synopsis.',
            },
          ],
          isError: false,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `🏷️ Extracted Tags:\n\n${tags.join(', ')}`,
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error('MCP extract_tags error', { error });
      return {
        content: [
          {
            type: 'text',
            text: `✗ Error extracting tags: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
};
