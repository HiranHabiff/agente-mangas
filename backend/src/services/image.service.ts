import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { resolve, extname } from 'path';
import { mangaRepository } from '../repositories/manga.repository.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

// ============================================
// IMAGE SERVICE
// ============================================

export class ImageService {
  private imagesPath: string;
  private tempPath: string;

  constructor() {
    // Resolve absolute paths
    this.imagesPath = resolve(process.cwd(), config.storage.imagesPath);
    this.tempPath = resolve(process.cwd(), config.storage.tempPath);

    // Ensure directories exist
    this.ensureDirectories();
  }

  // Download image from URL and save locally
  async downloadImage(mangaId: string, imageUrl: string): Promise<string> {
    logger.info('Downloading image', { mangaId, imageUrl });

    try {
      // Fetch image
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      // Get content type to determine extension
      const contentType = response.headers.get('content-type');
      const extension = this.getExtensionFromContentType(contentType) ||
                        this.getExtensionFromUrl(imageUrl) ||
                        '.jpg';

      // Generate filename
      const filename = `${mangaId}${extension}`;
      const filepath = resolve(this.imagesPath, filename);

      // Download and save
      if (response.body) {
        const stream = createWriteStream(filepath);
        await pipeline(Readable.fromWeb(response.body as any), stream);

        logger.info('Image downloaded successfully', {
          mangaId,
          filename,
          size: (await this.getFileSize(filepath)) + ' bytes',
        });

        // Update manga record with filename
        await mangaRepository.updateImageFilename(mangaId, filename);

        return filename;
      } else {
        throw new Error('Response body is null');
      }
    } catch (error) {
      logger.error('Error downloading image', {
        mangaId,
        imageUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error(`Failed to download image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Download image to temp directory
  async downloadToTemp(imageUrl: string, filename?: string): Promise<string> {
    logger.info('Downloading image to temp', { imageUrl });

    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const extension = this.getExtensionFromContentType(
        response.headers.get('content-type')
      ) || this.getExtensionFromUrl(imageUrl) || '.jpg';

      const tempFilename = filename || `temp-${Date.now()}${extension}`;
      const filepath = resolve(this.tempPath, tempFilename);

      if (response.body) {
        const stream = createWriteStream(filepath);
        await pipeline(Readable.fromWeb(response.body as any), stream);

        logger.info('Image downloaded to temp', { filename: tempFilename });
        return filepath;
      } else {
        throw new Error('Response body is null');
      }
    } catch (error) {
      logger.error('Error downloading to temp', { imageUrl, error });
      throw error;
    }
  }

  // Get image path for a manga
  getImagePath(filename: string): string {
    return resolve(this.imagesPath, filename);
  }

  // Check if image exists
  imageExists(filename: string): boolean {
    const filepath = this.getImagePath(filename);
    return existsSync(filepath);
  }

  // Get image URL for frontend
  getImageUrl(filename: string): string {
    // This would be adjusted based on your serving strategy
    // For now, returns relative path
    return `/images/${filename}`;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private ensureDirectories(): void {
    if (!existsSync(this.imagesPath)) {
      mkdirSync(this.imagesPath, { recursive: true });
      logger.info('Images directory created', { path: this.imagesPath });
    }

    if (!existsSync(this.tempPath)) {
      mkdirSync(this.tempPath, { recursive: true });
      logger.info('Temp directory created', { path: this.tempPath });
    }
  }

  private getExtensionFromContentType(contentType: string | null): string | null {
    if (!contentType) return null;

    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/bmp': '.bmp',
      'image/svg+xml': '.svg',
    };

    return mimeToExt[contentType.toLowerCase()] || null;
  }

  private getExtensionFromUrl(url: string): string | null {
    try {
      const pathname = new URL(url).pathname;
      const ext = extname(pathname).toLowerCase();
      return ext || null;
    } catch {
      return null;
    }
  }

  private async getFileSize(filepath: string): Promise<number> {
    try {
      const fs = await import('fs/promises');
      const stats = await fs.stat(filepath);
      return stats.size;
    } catch {
      return 0;
    }
  }
}

export const imageService = new ImageService();
