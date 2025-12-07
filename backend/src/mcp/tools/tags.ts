import { tagRepository } from '../../repositories/tag.repository.js';
import { logger } from '../../utils/logger.js';

// ============================================
// TAG TOOLS
// ============================================

export const tagTools = {
  async list_tags(input: { category?: string }) {
    try {
      const tags = input.category
        ? await tagRepository.findByCategory(input.category)
        : await tagRepository.findAll();

      if (tags.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No tags found.',
            },
          ],
          isError: false,
        };
      }

      // Group by category
      const grouped = tags.reduce((acc, tag) => {
        const category = tag.category || 'uncategorized';
        if (!acc[category]) acc[category] = [];
        acc[category].push(tag.name);
        return acc;
      }, {} as Record<string, string[]>);

      const groupedText = Object.entries(grouped)
        .map(([category, tagNames]) => {
          return `${category.toUpperCase()}:\n  ${tagNames.join(', ')}`;
        })
        .join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `🏷️ Available Tags (${tags.length}):\n\n${groupedText}`,
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error('MCP list_tags error', { error });
      return {
        content: [
          {
            type: 'text',
            text: `✗ Error listing tags: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },

  async get_popular_tags(input: { limit?: number }) {
    try {
      const tags = await tagRepository.getPopularTags(input.limit || 20);

      if (tags.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No tags found.',
            },
          ],
          isError: false,
        };
      }

      const tagList = tags
        .map((tag, index) => {
          return `${index + 1}. ${tag.name} (${tag.usage_count} mangas)`;
        })
        .join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `🔥 Popular Tags:\n\n${tagList}`,
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error('MCP get_popular_tags error', { error });
      return {
        content: [
          {
            type: 'text',
            text: `✗ Error fetching popular tags: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
};
