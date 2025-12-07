import { imageService } from '../../services/image.service';
import { logger } from '../../utils/logger';

// ============================================
// IMAGE TOOLS
// ============================================

export const imageTools = {
  async download_image(input: { manga_id: string; image_url: string }) {
    try {
      const filename = await imageService.downloadImage(input.manga_id, input.image_url);

      return {
        content: [
          {
            type: 'text',
            text: `✓ Image downloaded successfully!\n\nFilename: ${filename}\nManga ID: ${input.manga_id}`,
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error('MCP download_image error', { error });
      return {
        content: [
          {
            type: 'text',
            text: `✗ Error downloading image: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
};
