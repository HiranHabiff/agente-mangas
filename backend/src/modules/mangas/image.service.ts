import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createWriteStream, existsSync, mkdirSync, unlinkSync, readdirSync } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { resolve, extname } from 'path';

@Injectable()
export class ImageService {
  private imagesPath: string;

  constructor(private prisma: PrismaService) {
    this.imagesPath = resolve(process.cwd(), '../storage/images');
    this.ensureDirectories();
  }

  async downloadImage(mangaId: string, imageUrl: string): Promise<string> {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    const extension =
      this.getExtensionFromContentType(contentType) ||
      this.getExtensionFromUrl(imageUrl) ||
      '.jpg';

    const filename = `${mangaId}${extension}`;
    const filepath = resolve(this.imagesPath, filename);

    if (response.body) {
      const stream = createWriteStream(filepath);
      await pipeline(Readable.fromWeb(response.body as any), stream);

      await this.prisma.mangas.update({
        where: { id: mangaId },
        data: {
          image_filename: filename,
          image_url: imageUrl,
        },
      });

      return filename;
    } else {
      throw new Error('Response body is null');
    }
  }

  private ensureDirectories(): void {
    if (!existsSync(this.imagesPath)) {
      mkdirSync(this.imagesPath, { recursive: true });
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

  /**
   * Deleta a imagem de um mangá do storage
   * Procura por qualquer arquivo que comece com o mangaId
   */
  deleteImage(mangaId: string): boolean {
    try {
      // Procura por arquivos que começam com o mangaId (pode ter diferentes extensões)
      const files = readdirSync(this.imagesPath);
      const mangaFiles = files.filter((f) => f.startsWith(mangaId));

      for (const file of mangaFiles) {
        const filepath = resolve(this.imagesPath, file);
        if (existsSync(filepath)) {
          unlinkSync(filepath);
        }
      }

      return mangaFiles.length > 0;
    } catch {
      return false;
    }
  }
}
