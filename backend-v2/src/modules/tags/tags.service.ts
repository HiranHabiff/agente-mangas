import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async findAllGenres() {
    const genres = await this.prisma.genres.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { manga_genres: true } },
      },
    });

    return genres.map((g) => ({
      id: g.id,
      name: g.name,
      nameEnglish: g.name_english,
      color: g.color,
      description: g.description,
      count: g._count.manga_genres,
    }));
  }

  async findAllThemes() {
    const themes = await this.prisma.themes.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { manga_themes: true } },
      },
    });

    return themes.map((t) => ({
      id: t.id,
      name: t.name,
      nameEnglish: t.name_english,
      color: t.color,
      description: t.description,
      count: t._count.manga_themes,
    }));
  }

  async findAllTags() {
    const tags = await this.prisma.tags.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { manga_tags: true } },
      },
    });

    return tags.map((t) => ({
      id: t.id,
      name: t.name,
      nameEnglish: t.name_english,
      category: t.category,
      color: t.color,
      count: t._count.manga_tags,
    }));
  }

  async findAllStatus() {
    const statuses = await this.prisma.status.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { mangas: true } },
      },
    });

    return statuses.map((s) => ({
      id: s.id,
      name: s.name,
      nameEnglish: s.name_english,
      color: s.color,
      description: s.description,
      count: s._count.mangas,
    }));
  }

  async findAllTypes() {
    const types = await this.prisma.types.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { mangas: true } },
      },
    });

    return types.map((t) => ({
      id: t.id,
      name: t.name,
      nameEnglish: t.name_english,
      color: t.color,
      description: t.description,
      count: t._count.mangas,
    }));
  }

  async findAllRatings() {
    const ratings = await this.prisma.ratings.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { mangas: true } },
      },
    });

    return ratings.map((r) => ({
      id: r.id,
      name: r.name,
      nameEnglish: r.name_english,
      color: r.color,
      description: r.description,
      count: r._count.mangas,
    }));
  }

  async findAllDemographics() {
    const demographics = await this.prisma.demographic.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { mangas: true } },
      },
    });

    return demographics.map((d) => ({
      id: d.id,
      name: d.name,
      nameEnglish: d.name_english,
      color: d.color,
      description: d.description,
      count: d._count.mangas,
    }));
  }

  async findAllSites() {
    const sites = await this.prisma.sites.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { manga_links: true } },
      },
    });

    return sites.map((s) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      image: s.image,
      language: s.language,
      active: s.active,
      description: s.description,
      count: s._count.manga_links,
    }));
  }

  async findAllWarnings() {
    const warnings = await this.prisma.warnings.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { manga_warnings: true } },
      },
    });

    return warnings.map((w) => ({
      id: w.id,
      name: w.name,
      nameEnglish: w.name_english,
      color: w.color,
      description: w.description,
      count: w._count.manga_warnings,
    }));
  }

  async findAllCharacters() {
    const characters = await this.prisma.characters.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { manga_characters: true } },
      },
    });

    return characters.map((c) => ({
      id: c.id,
      name: c.name,
      nameEnglish: c.name_english,
      color: c.color,
      description: c.description,
      count: c._count.manga_characters,
    }));
  }

  // Retorna todas as tags agrupadas para uso nos filtros
  async findAllForFilters() {
    const [genres, themes, tags, status, types, ratings, demographics] = await Promise.all([
      this.findAllGenres(),
      this.findAllThemes(),
      this.findAllTags(),
      this.findAllStatus(),
      this.findAllTypes(),
      this.findAllRatings(),
      this.findAllDemographics(),
    ]);

    return {
      genres,
      themes,
      tags,
      status,
      types,
      ratings,
      demographics,
    };
  }

  // Tags mais usadas
  async findPopular(limit: number = 10) {
    const [genres, themes, tags] = await Promise.all([
      this.prisma.genres.findMany({
        include: { _count: { select: { manga_genres: true } } },
        orderBy: { manga_genres: { _count: 'desc' } },
        take: limit,
      }),
      this.prisma.themes.findMany({
        include: { _count: { select: { manga_themes: true } } },
        orderBy: { manga_themes: { _count: 'desc' } },
        take: limit,
      }),
      this.prisma.tags.findMany({
        include: { _count: { select: { manga_tags: true } } },
        orderBy: { manga_tags: { _count: 'desc' } },
        take: limit,
      }),
    ]);

    return {
      genres: genres.map((g) => ({
        id: g.id,
        name: g.name,
        nameEnglish: g.name_english,
        color: g.color,
        count: g._count.manga_genres,
      })),
      themes: themes.map((t) => ({
        id: t.id,
        name: t.name,
        nameEnglish: t.name_english,
        color: t.color,
        count: t._count.manga_themes,
      })),
      tags: tags.map((t) => ({
        id: t.id,
        name: t.name,
        nameEnglish: t.name_english,
        color: t.color,
        count: t._count.manga_tags,
      })),
    };
  }
}
