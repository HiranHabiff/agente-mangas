import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MangaRepository } from './manga.repository';
import { z } from 'zod';
import {
  CreateMangaSchema,
  UpdateMangaSchema,
  MangaFiltersSchema,
} from '../../contracts/manga.contract';

@Injectable()
export class MangaService {
  constructor(private readonly mangaRepository: MangaRepository) {}

  async findAll(filters: z.infer<typeof MangaFiltersSchema>) {
    return this.mangaRepository.findAll(filters);
  }

  async findById(id: string) {
    const manga = await this.mangaRepository.findById(id);
    if (!manga) {
      throw new NotFoundException(`Manga with ID ${id} not found`);
    }
    return manga;
  }

  async create(data: z.infer<typeof CreateMangaSchema>) {
    try {
      // Convert null to undefined for Sequelize compatibility
      const cleanData = {
        ...data,
        rating: data.rating ?? undefined,
        synopsis: data.synopsis ?? undefined,
        image_filename: data.image_filename ?? undefined,
        image_url: data.image_url ?? undefined,
        source_url: data.source_url ?? undefined,
      };
      return await this.mangaRepository.create(cleanData);
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to create manga: ${error.message}`,
      );
    }
  }

  async update(id: string, data: z.infer<typeof UpdateMangaSchema>) {
    // Convert null to undefined for Sequelize compatibility
    const cleanData = {
      ...data,
      rating: data.rating ?? undefined,
      synopsis: data.synopsis ?? undefined,
      image_filename: data.image_filename ?? undefined,
      image_url: data.image_url ?? undefined,
      source_url: data.source_url ?? undefined,
    };
    const manga = await this.mangaRepository.update(id, cleanData);
    if (!manga) {
      throw new NotFoundException(`Manga with ID ${id} not found`);
    }
    return manga;
  }

  async delete(id: string) {
    const deleted = await this.mangaRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Manga with ID ${id} not found`);
    }
  }

  async restore(id: string) {
    const manga = await this.mangaRepository.restore(id);
    if (!manga) {
      throw new NotFoundException(
        `Manga with ID ${id} not found or not deleted`,
      );
    }
    return manga;
  }

  async getStats() {
    const [total, byStatus] = await Promise.all([
      this.mangaRepository.count(),
      this.mangaRepository.countByStatus(),
    ]);

    return {
      total,
      by_status: {
        reading: byStatus.reading || 0,
        completed: byStatus.completed || 0,
        plan_to_read: byStatus.plan_to_read || 0,
        on_hold: byStatus.on_hold || 0,
        dropped: byStatus.dropped || 0,
      },
    };
  }
}
