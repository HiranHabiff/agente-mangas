import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const [
      totalMangas,
      readingCount,
      completedCount,
      pausedCount,
      droppedCount,
      planToReadCount,
      avgRating,
      totalChaptersRead,
      mangasWithRating,
    ] = await Promise.all([
      this.prisma.mangas.count({ where: { deleted_at: null } }),
      this.prisma.mangas.count({ where: { deleted_at: null, status: 'reading' } }),
      this.prisma.mangas.count({ where: { deleted_at: null, status: 'completed' } }),
      this.prisma.mangas.count({ where: { deleted_at: null, status: 'paused' } }),
      this.prisma.mangas.count({ where: { deleted_at: null, status: 'dropped' } }),
      this.prisma.mangas.count({ where: { deleted_at: null, status: 'plan_to_read' } }),
      this.prisma.mangas.aggregate({
        where: { deleted_at: null, rating: { not: null } },
        _avg: { rating: true },
      }),
      this.prisma.mangas.aggregate({
        where: { deleted_at: null },
        _sum: { last_chapter_read: true },
      }),
      this.prisma.mangas.count({ where: { deleted_at: null, rating: { not: null } } }),
    ]);

    return {
      total: totalMangas,
      byStatus: {
        reading: readingCount,
        completed: completedCount,
        paused: pausedCount,
        dropped: droppedCount,
        planToRead: planToReadCount,
      },
      averageRating: avgRating._avg.rating ? Number(avgRating._avg.rating) : null,
      totalChaptersRead: totalChaptersRead._sum.last_chapter_read || 0,
      mangasWithRating,
    };
  }

  async getRecentlyUpdated(limit: number = 10) {
    const mangas = await this.prisma.mangas.findMany({
      where: { deleted_at: null },
      orderBy: { updated_at: 'desc' },
      take: limit,
      select: {
        id: true,
        primary_title: true,
        image_url: true,
        image_filename: true,
        status: true,
        last_chapter_read: true,
        updated_at: true,
      },
    });

    return mangas.map((m) => ({
      id: m.id,
      primaryTitle: m.primary_title,
      imageUrl: m.image_url,
      imageFilename: m.image_filename,
      status: m.status,
      lastChapterRead: m.last_chapter_read,
      updatedAt: m.updated_at,
    }));
  }

  async getRecentlyRead(limit: number = 10) {
    const mangas = await this.prisma.mangas.findMany({
      where: {
        deleted_at: null,
        last_read_at: { not: null },
      },
      orderBy: { last_read_at: 'desc' },
      take: limit,
      select: {
        id: true,
        primary_title: true,
        image_url: true,
        image_filename: true,
        status: true,
        last_chapter_read: true,
        last_read_at: true,
      },
    });

    return mangas.map((m) => ({
      id: m.id,
      primaryTitle: m.primary_title,
      imageUrl: m.image_url,
      imageFilename: m.image_filename,
      status: m.status,
      lastChapterRead: m.last_chapter_read,
      lastReadAt: m.last_read_at,
    }));
  }

  async getTopRated(limit: number = 10) {
    const mangas = await this.prisma.mangas.findMany({
      where: {
        deleted_at: null,
        rating: { not: null },
      },
      orderBy: { rating: 'desc' },
      take: limit,
      select: {
        id: true,
        primary_title: true,
        image_url: true,
        image_filename: true,
        status: true,
        rating: true,
      },
    });

    return mangas.map((m) => ({
      id: m.id,
      primaryTitle: m.primary_title,
      imageUrl: m.image_url,
      imageFilename: m.image_filename,
      status: m.status,
      rating: m.rating ? Number(m.rating) : null,
    }));
  }

  async getMostRead(limit: number = 10) {
    const mangas = await this.prisma.mangas.findMany({
      where: {
        deleted_at: null,
        last_chapter_read: { gt: 0 },
      },
      orderBy: { last_chapter_read: 'desc' },
      take: limit,
      select: {
        id: true,
        primary_title: true,
        image_url: true,
        image_filename: true,
        status: true,
        last_chapter_read: true,
        total_chapters: true,
      },
    });

    return mangas.map((m) => ({
      id: m.id,
      primaryTitle: m.primary_title,
      imageUrl: m.image_url,
      imageFilename: m.image_filename,
      status: m.status,
      lastChapterRead: m.last_chapter_read,
      totalChapters: m.total_chapters,
    }));
  }

  async getGenreDistribution() {
    const genres = await this.prisma.genres.findMany({
      include: {
        _count: { select: { manga_genres: true } },
      },
      orderBy: { manga_genres: { _count: 'desc' } },
    });

    return genres.map((g) => ({
      id: g.id,
      name: g.name,
      nameEnglish: g.name_english,
      color: g.color,
      count: g._count.manga_genres,
    }));
  }

  async getStatusDistribution() {
    const statusCounts = await this.prisma.mangas.groupBy({
      by: ['status'],
      where: { deleted_at: null },
      _count: true,
    });

    return statusCounts.map((s) => ({
      status: s.status,
      count: s._count,
    }));
  }

  async getTypeDistribution() {
    const types = await this.prisma.types.findMany({
      include: {
        _count: { select: { mangas: true } },
      },
      orderBy: { mangas: { _count: 'desc' } },
    });

    return types.map((t) => ({
      id: t.id,
      name: t.name,
      nameEnglish: t.name_english,
      color: t.color,
      count: t._count.mangas,
    }));
  }

  async getRatingDistribution() {
    // Distribui os ratings em faixas: 0-2, 2-4, 4-6, 6-8, 8-10
    const mangas = await this.prisma.mangas.findMany({
      where: {
        deleted_at: null,
        rating: { not: null },
      },
      select: { rating: true },
    });

    const distribution = {
      '0-2': 0,
      '2-4': 0,
      '4-6': 0,
      '6-8': 0,
      '8-10': 0,
    };

    mangas.forEach((m) => {
      const rating = Number(m.rating);
      if (rating < 2) distribution['0-2']++;
      else if (rating < 4) distribution['2-4']++;
      else if (rating < 6) distribution['4-6']++;
      else if (rating < 8) distribution['6-8']++;
      else distribution['8-10']++;
    });

    return Object.entries(distribution).map(([range, count]) => ({
      range,
      count,
    }));
  }
}
