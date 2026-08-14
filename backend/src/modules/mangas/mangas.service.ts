import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ImageService } from './image.service';
import { CreateMangaDto } from './dto/create-manga.dto';
import { UpdateMangaDto } from './dto/update-manga.dto';
import { FilterMangaDto } from './dto/filter-manga.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class MangasService {
  constructor(
    private prisma: PrismaService,
    private imageService: ImageService,
  ) {}

  /**
   * Extrai o hostname de uma URL
   */
  private extractHostname(url: string): string | null {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch {
      return null;
    }
  }

  /**
   * Gera um nome amigável a partir do hostname
   * Ex: "mangadex.org" -> "MangaDex"
   */
  private generateSiteName(hostname: string): string {
    // Remove www. e extensão
    let name = hostname.replace(/^www\./, '').split('.')[0];
    // Capitaliza primeira letra
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  /**
   * Encontra ou cria um site baseado na URL
   * Retorna o ID do site
   */
  private async findOrCreateSiteFromUrl(url: string): Promise<string | null> {
    const hostname = this.extractHostname(url);
    if (!hostname) return null;

    // Busca site existente pelo hostname (url contém o hostname)
    const existingSite = await this.prisma.sites.findFirst({
      where: {
        OR: [
          { url: { contains: hostname } },
          { url: { contains: hostname.replace(/^www\./, '') } },
        ],
      },
    });

    if (existingSite) {
      return existingSite.id;
    }

    // Cria novo site
    const newSite = await this.prisma.sites.create({
      data: {
        name: this.generateSiteName(hostname),
        url: `https://${hostname}`,
        image: '',
        language: 'en',
        active: true,
      },
    });

    return newSite.id;
  }

  async findAll(filters: FilterMangaDto) {
    const {
      query,
      status,
      genres,
      themes,
      tags,
      types,
      ratings,
      demographics,
      minRating,
      withCovers,
      sortBy = 'updated_at',
      sortOrder = 'desc',
      limit = 20,
      offset = 0,
    } = filters;

    const where: Prisma.mangasWhereInput = {
      deleted_at: null,
    };

    // Busca por título
    if (query) {
      where.OR = [
        { primary_title: { contains: query, mode: 'insensitive' } },
        { manga_names: { some: { name: { contains: query, mode: 'insensitive' } } } },
      ];
    }

    // Filtro por status
    if (status && status.length > 0) {
      where.status = { in: status };
    }

    // Filtro por gêneros
    if (genres && genres.length > 0) {
      where.manga_genres = {
        some: { genre_id: { in: genres } },
      };
    }

    // Filtro por temas
    if (themes && themes.length > 0) {
      where.manga_themes = {
        some: { theme_id: { in: themes } },
      };
    }

    // Filtro por tags
    if (tags && tags.length > 0) {
      where.manga_tags = {
        some: { tag_id: { in: tags } },
      };
    }

    // Filtro por tipos (manga, manhwa, etc)
    if (types && types.length > 0) {
      where.type_id = { in: types };
    }

    // Filtro por classificação de conteúdo
    if (ratings && ratings.length > 0) {
      where.rating_id = { in: ratings };
    }

    // Filtro por demografia
    if (demographics && demographics.length > 0) {
      where.demographic_id = { in: demographics };
    }

    // Filtro por rating mínimo
    if (minRating !== undefined) {
      where.rating = { gte: minRating };
    }

    // Filtro por capa
    if (withCovers) {
      where.OR = [
        { image_url: { not: null } },
        { image_filename: { not: null } },
      ];
    }

    // Ordenação
    type SortField = 'primary_title' | 'rating' | 'last_read_at' | 'updated_at' | 'created_at' | 'last_chapter_read';
    const validSortFields: SortField[] = ['primary_title', 'rating', 'last_read_at', 'updated_at', 'created_at', 'last_chapter_read'];

    // Campos que podem ter NULL e precisam de tratamento especial
    const nullableFields = ['last_read_at', 'rating', 'last_chapter_read'];

    let orderBy: Prisma.mangasOrderByWithRelationInput;
    if (validSortFields.includes(sortBy as SortField)) {
      // Para campos nullable, coloca NULLs por último em DESC e primeiro em ASC
      if (nullableFields.includes(sortBy)) {
        orderBy = { [sortBy]: { sort: sortOrder, nulls: sortOrder === 'desc' ? 'last' : 'first' } };
      } else {
        orderBy = { [sortBy]: sortOrder };
      }
    } else {
      orderBy = { updated_at: 'desc' };
    }

    const [data, total] = await Promise.all([
      this.prisma.mangas.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          manga_genres: { include: { genres: true } },
          manga_themes: { include: { themes: true } },
          manga_tags: { include: { tags: true } },
          statusRef: true,
          typeRef: true,
          ratingRef: true,
          demographic: true,
        },
      }),
      this.prisma.mangas.count({ where }),
    ]);

    return {
      data: data.map(this.transformManga),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + data.length < total,
      },
    };
  }

  async findOne(id: string) {
    const manga = await this.prisma.mangas.findUnique({
      where: { id, deleted_at: null },
      include: {
        manga_genres: { include: { genres: true } },
        manga_themes: { include: { themes: true } },
        manga_tags: { include: { tags: true } },
        manga_names: true,
        manga_links: { include: { sites: true } },
        statusRef: true,
        typeRef: true,
        ratingRef: true,
        demographic: true,
      },
    });

    if (!manga) {
      throw new NotFoundException(`Manga with ID ${id} not found`);
    }

    return this.transformMangaDetail(manga);
  }

  async create(createMangaDto: CreateMangaDto) {
    const {
      primaryTitle,
      url,
      imageUrl,
      synopsis,
      totalChapters,
      lastChapterRead,
      rating,
      status,
      userNotes,
      statusId,
      typeId,
      ratingId,
      demographicId,
      genreIds,
      themeIds,
      tagIds,
      alternativeNames,
      links,
    } = createMangaDto;

    const manga = await this.prisma.mangas.create({
      data: {
        primary_title: primaryTitle,
        url,
        image_url: imageUrl,
        synopsis,
        total_chapters: totalChapters,
        last_chapter_read: lastChapterRead,
        rating,
        status: status || 'plan_to_read',
        user_notes: userNotes,
        status_id: statusId,
        type_id: typeId,
        rating_id: ratingId,
        demographic_id: demographicId,
        manga_genres: genreIds?.length
          ? { create: genreIds.map((id) => ({ genre_id: id })) }
          : undefined,
        manga_themes: themeIds?.length
          ? { create: themeIds.map((id) => ({ theme_id: id })) }
          : undefined,
        manga_tags: tagIds?.length
          ? { create: tagIds.map((id) => ({ tag_id: id })) }
          : undefined,
        manga_names: alternativeNames?.length
          ? { create: alternativeNames.map((name) => ({ name })) }
          : undefined,
      },
    });

    // Download da imagem para o storage local se URL foi fornecida
    if (imageUrl) {
      try {
        await this.imageService.downloadImage(manga.id, imageUrl);
      } catch (error) {
        // Se falhar o download, apenas loga o erro mas não impede a criação
        console.error(`Failed to download image for manga ${manga.id}:`, error);
      }
    }

    // Cria links se fornecidos
    if (links?.length) {
      for (const link of links) {
        const siteId = link.siteId || (await this.findOrCreateSiteFromUrl(link.url));
        await this.prisma.manga_links.create({
          data: {
            manga_id: manga.id,
            url: link.url,
            site_id: siteId,
            label: link.label,
            is_primary: link.isPrimary ?? false,
            is_active: true,
          },
        });
      }
    }

    // Busca novamente para retornar com links e imagem atualizada
    return this.findOne(manga.id);
  }

  async update(id: string, updateMangaDto: UpdateMangaDto) {
    // Verifica se existe
    await this.findOne(id);

    const {
      primaryTitle,
      url,
      imageUrl,
      synopsis,
      totalChapters,
      lastChapterRead,
      rating,
      status,
      userNotes,
      statusId,
      typeId,
      ratingId,
      demographicId,
      genreIds,
      themeIds,
      tagIds,
      alternativeNames,
      links,
    } = updateMangaDto;

    // Atualiza relações se fornecidas
    if (genreIds !== undefined) {
      await this.prisma.manga_genres.deleteMany({ where: { manga_id: id } });
      if (genreIds.length > 0) {
        await this.prisma.manga_genres.createMany({
          data: genreIds.map((genreId) => ({ manga_id: id, genre_id: genreId })),
        });
      }
    }

    if (themeIds !== undefined) {
      await this.prisma.manga_themes.deleteMany({ where: { manga_id: id } });
      if (themeIds.length > 0) {
        await this.prisma.manga_themes.createMany({
          data: themeIds.map((themeId) => ({ manga_id: id, theme_id: themeId })),
        });
      }
    }

    if (tagIds !== undefined) {
      await this.prisma.manga_tags.deleteMany({ where: { manga_id: id } });
      if (tagIds.length > 0) {
        await this.prisma.manga_tags.createMany({
          data: tagIds.map((tagId) => ({ manga_id: id, tag_id: tagId })),
        });
      }
    }

    if (alternativeNames !== undefined) {
      await this.prisma.manga_names.deleteMany({ where: { manga_id: id } });
      if (alternativeNames.length > 0) {
        await this.prisma.manga_names.createMany({
          data: alternativeNames.map((name) => ({ manga_id: id, name })),
        });
      }
    }

    // Atualiza links se fornecidos
    if (links !== undefined) {
      await this.prisma.manga_links.deleteMany({ where: { manga_id: id } });
      if (links.length > 0) {
        // Processa cada link para encontrar/criar o site automaticamente
        for (const link of links) {
          // Se não tem siteId, tenta encontrar/criar baseado na URL
          const siteId = link.siteId || (await this.findOrCreateSiteFromUrl(link.url));

          await this.prisma.manga_links.create({
            data: {
              manga_id: id,
              url: link.url,
              site_id: siteId,
              label: link.label,
              is_primary: link.isPrimary ?? false,
              is_active: true,
            },
          });
        }
      }
    }

    const manga = await this.prisma.mangas.update({
      where: { id },
      data: {
        ...(primaryTitle !== undefined && { primary_title: primaryTitle }),
        ...(url !== undefined && { url }),
        ...(imageUrl !== undefined && { image_url: imageUrl }),
        ...(synopsis !== undefined && { synopsis }),
        ...(totalChapters !== undefined && { total_chapters: totalChapters }),
        ...(lastChapterRead !== undefined && { last_chapter_read: lastChapterRead }),
        ...(rating !== undefined && { rating }),
        ...(status !== undefined && { status }),
        ...(userNotes !== undefined && { user_notes: userNotes }),
        ...(statusId !== undefined && { status_id: statusId }),
        ...(typeId !== undefined && { type_id: typeId }),
        ...(ratingId !== undefined && { rating_id: ratingId }),
        ...(demographicId !== undefined && { demographic_id: demographicId }),
        updated_at: new Date(),
      },
      include: {
        manga_genres: { include: { genres: true } },
        manga_themes: { include: { themes: true } },
        manga_tags: { include: { tags: true } },
        manga_names: true,
        manga_links: { include: { sites: true } },
        statusRef: true,
        typeRef: true,
        ratingRef: true,
        demographic: true,
      },
    });

    return this.transformMangaDetail(manga);
  }

  async remove(id: string) {
    // Verifica se existe
    const manga = await this.prisma.mangas.findUnique({
      where: { id },
    });

    if (!manga) {
      throw new NotFoundException(`Manga with ID ${id} not found`);
    }

    // Deleta a imagem do storage se existir
    this.imageService.deleteImage(id);

    // Deleta registros relacionados (cascade não está configurado para todos)
    await this.prisma.$transaction([
      this.prisma.manga_genres.deleteMany({ where: { manga_id: id } }),
      this.prisma.manga_themes.deleteMany({ where: { manga_id: id } }),
      this.prisma.manga_tags.deleteMany({ where: { manga_id: id } }),
      this.prisma.manga_names.deleteMany({ where: { manga_id: id } }),
      this.prisma.manga_links.deleteMany({ where: { manga_id: id } }),
      this.prisma.mangas.delete({ where: { id } }),
    ]);

    return { message: 'Manga deleted successfully' };
  }

  async updateChapter(id: string, chapter: number) {
    await this.findOne(id);

    const manga = await this.prisma.mangas.update({
      where: { id },
      data: {
        last_chapter_read: chapter,
        last_read_at: new Date(),
      },
    });

    // Cria sessão de leitura
    await this.prisma.reading_sessions.create({
      data: {
        manga_id: id,
        chapter_number: chapter,
      },
    });

    return this.transformManga(manga);
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);

    const validStatuses = ['reading', 'completed', 'paused', 'dropped', 'plan_to_read'];
    if (!validStatuses.includes(status)) {
      throw new NotFoundException(`Invalid status: ${status}`);
    }

    const manga = await this.prisma.mangas.update({
      where: { id },
      data: {
        status,
        updated_at: new Date(),
      },
    });

    return this.transformManga(manga);
  }

  async getReadingSessions(mangaId: string, limit: number = 50) {
    await this.findOne(mangaId);

    const sessions = await this.prisma.reading_sessions.findMany({
      where: { manga_id: mangaId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    return sessions.map((session) => ({
      id: session.id,
      chapterNumber: session.chapter_number,
      startedAt: session.started_at,
      durationMinutes: session.duration_minutes,
      notes: session.notes,
      createdAt: session.created_at,
    }));
  }

  async getReadingStats(mangaId: string) {
    await this.findOne(mangaId);

    const stats = await this.prisma.$queryRaw<
      {
        total_sessions: bigint;
        total_chapters_read: bigint;
        total_time_minutes: bigint | null;
        avg_time_per_chapter: number | null;
        first_read_at: Date | null;
        last_read_at: Date | null;
      }[]
    >`
      SELECT
        COUNT(*) as total_sessions,
        COUNT(DISTINCT chapter_number) as total_chapters_read,
        SUM(duration_minutes) as total_time_minutes,
        AVG(duration_minutes)::float as avg_time_per_chapter,
        MIN(created_at) as first_read_at,
        MAX(created_at) as last_read_at
      FROM reading_sessions
      WHERE manga_id = ${mangaId}::uuid
    `;

    const result = stats[0] || {};
    return {
      totalSessions: Number(result.total_sessions) || 0,
      totalChaptersRead: Number(result.total_chapters_read) || 0,
      totalTimeMinutes: Number(result.total_time_minutes) || 0,
      avgTimePerChapter: result.avg_time_per_chapter || null,
      firstReadAt: result.first_read_at,
      lastReadAt: result.last_read_at,
    };
  }

  private transformManga(manga: any) {
    return {
      id: manga.id,
      primaryTitle: manga.primary_title,
      url: manga.url,
      imageUrl: manga.image_url,
      imageFilename: manga.image_filename,
      synopsis: manga.synopsis,
      rating: manga.rating ? Number(manga.rating) : null,
      totalChapters: manga.total_chapters,
      lastChapterRead: manga.last_chapter_read,
      status: manga.status,
      userNotes: manga.user_notes,
      createdAt: manga.created_at,
      updatedAt: manga.updated_at,
      lastReadAt: manga.last_read_at,
      genres: manga.manga_genres?.map((mg: any) => ({
        id: mg.genres.id,
        name: mg.genres.name,
        nameEnglish: mg.genres.name_english,
        color: mg.genres.color,
      })) || [],
      themes: manga.manga_themes?.map((mt: any) => ({
        id: mt.themes.id,
        name: mt.themes.name,
        nameEnglish: mt.themes.name_english,
        color: mt.themes.color,
      })) || [],
      tags: manga.manga_tags?.map((mt: any) => ({
        id: mt.tags.id,
        name: mt.tags.name,
        nameEnglish: mt.tags.name_english,
        color: mt.tags.color,
      })) || [],
      statusRef: manga.statusRef ? {
        id: manga.statusRef.id,
        name: manga.statusRef.name,
        nameEnglish: manga.statusRef.name_english,
        color: manga.statusRef.color,
      } : null,
      type: manga.typeRef ? {
        id: manga.typeRef.id,
        name: manga.typeRef.name,
        nameEnglish: manga.typeRef.name_english,
        color: manga.typeRef.color,
      } : null,
      contentRating: manga.ratingRef ? {
        id: manga.ratingRef.id,
        name: manga.ratingRef.name,
        nameEnglish: manga.ratingRef.name_english,
        color: manga.ratingRef.color,
      } : null,
      demographic: manga.demographic ? {
        id: manga.demographic.id,
        name: manga.demographic.name,
        nameEnglish: manga.demographic.name_english,
        color: manga.demographic.color,
      } : null,
    };
  }

  private transformMangaDetail(manga: any) {
    const base = this.transformManga(manga);
    return {
      ...base,
      alternativeNames: manga.manga_names?.map((mn: any) => ({
        id: mn.id,
        name: mn.name,
        language: mn.language,
        isOfficial: mn.is_official,
      })) || [],
      links: manga.manga_links?.map((ml: any) => ({
        id: ml.id,
        url: ml.url,
        label: ml.label,
        isPrimary: ml.is_primary,
        isActive: ml.is_active,
        site: ml.sites ? {
          id: ml.sites.id,
          name: ml.sites.name,
          url: ml.sites.url,
          image: ml.sites.image,
        } : null,
      })) || [],
    };
  }
}
