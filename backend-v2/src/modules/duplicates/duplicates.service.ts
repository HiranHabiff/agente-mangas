import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ImageService } from '../mangas/image.service';

interface DuplicateGroup {
  id: string;
  primaryTitle: string;
  imageUrl: string | null;
  imageFilename: string | null;
  status: string | null;
  similarity: number;
}

@Injectable()
export class DuplicatesService {
  constructor(
    private prisma: PrismaService,
    private imageService: ImageService,
  ) {}

  // Busca duplicatas usando primary_title E nomes alternativos
  // Baseado na v1: agrupa por nomes normalizados (LOWER/TRIM)
  async findPotentialDuplicates(threshold: number = 0.6, limit: number = 50) {
    // Query baseada na v1: busca nomes duplicados (exatos após normalização)
    // Junta primary_title e alternative names em uma única lista
    const duplicateGroups = await this.prisma.$queryRaw<
      {
        matching_name: string;
        manga_ids: string[];
      }[]
    >`
      WITH all_names AS (
        -- Primary titles
        SELECT m.id as manga_id, LOWER(TRIM(m.primary_title)) as name
        FROM mangas m
        WHERE m.deleted_at IS NULL
        UNION
        -- Alternative names
        SELECT mn.manga_id, LOWER(TRIM(mn.name)) as name
        FROM manga_names mn
        JOIN mangas m ON mn.manga_id = m.id
        WHERE m.deleted_at IS NULL
      ),
      duplicate_names AS (
        SELECT name, ARRAY_AGG(DISTINCT manga_id) as manga_ids
        FROM all_names
        WHERE name IS NOT NULL AND name != ''
        GROUP BY name
        HAVING COUNT(DISTINCT manga_id) > 1
      )
      SELECT name as matching_name, manga_ids
      FROM duplicate_names
      ORDER BY name
      LIMIT ${limit}
    `;

    if (duplicateGroups.length === 0) {
      return [];
    }

    // Coleta todos os IDs únicos de mangás
    const allMangaIds = new Set<string>();
    for (const group of duplicateGroups) {
      for (const id of group.manga_ids) {
        allMangaIds.add(id);
      }
    }

    // Busca todos os mangás de uma vez com contagens
    const mangas = await this.prisma.mangas.findMany({
      where: {
        id: { in: Array.from(allMangaIds) },
        deleted_at: null,
      },
      select: {
        id: true,
        primary_title: true,
        image_url: true,
        image_filename: true,
        status: true,
        last_chapter_read: true,
        total_chapters: true,
        rating: true,
        _count: {
          select: {
            manga_names: true,
            manga_links: true,
          },
        },
      },
    });

    const mangaMap = new Map(mangas.map((m) => [m.id, m]));

    // Monta os grupos de duplicatas
    const results: {
      similarity: number;
      matchingName: string;
      mangas: {
        id: string;
        primaryTitle: string;
        imageUrl: string | null;
        imageFilename: string | null;
        status: string | null;
        lastChapterRead: number | null;
        totalChapters: number | null;
        rating: number | null;
        namesCount: number;
        linksCount: number;
      }[];
    }[] = [];

    // Deduplica por conjunto de IDs (mesmo grupo pode aparecer com nomes diferentes)
    const seenGroups = new Set<string>();

    for (const group of duplicateGroups) {
      const groupMangas = group.manga_ids
        .map((id) => mangaMap.get(id))
        .filter((m): m is NonNullable<typeof m> => m !== undefined);

      if (groupMangas.length < 2) continue;

      // Cria chave única para o grupo (IDs ordenados)
      const groupKey = [...groupMangas.map((m) => m.id)].sort().join('-');
      if (seenGroups.has(groupKey)) continue;
      seenGroups.add(groupKey);

      // Ordena: mangás com capítulos lidos primeiro, depois por rating
      groupMangas.sort((a, b) => {
        const chaptersA = a.last_chapter_read || 0;
        const chaptersB = b.last_chapter_read || 0;
        if (chaptersA !== chaptersB) return chaptersB - chaptersA;
        const ratingA = Number(a.rating) || 0;
        const ratingB = Number(b.rating) || 0;
        return ratingB - ratingA;
      });

      // Calcula similaridade real entre os títulos principais
      // (o matching_name é o nome exato que causou a duplicata)
      results.push({
        similarity: 1.0, // Match exato por nome
        matchingName: group.matching_name,
        mangas: groupMangas.map((m) => ({
          id: m.id,
          primaryTitle: m.primary_title,
          imageUrl: m.image_url,
          imageFilename: m.image_filename,
          status: m.status,
          lastChapterRead: m.last_chapter_read,
          totalChapters: m.total_chapters,
          rating: m.rating ? Number(m.rating) : null,
          namesCount: m._count.manga_names,
          linksCount: m._count.manga_links,
        })),
      });
    }

    // Ordena: grupos com mangás lidos primeiro
    results.sort((a, b) => {
      const mangaA = mangaMap.get(a.mangas[0]?.id);
      const mangaB = mangaMap.get(b.mangas[0]?.id);
      const chaptersA = mangaA?.last_chapter_read || 0;
      const chaptersB = mangaB?.last_chapter_read || 0;
      return chaptersB - chaptersA;
    });

    return results.slice(0, limit);
  }

  // Busca duplicatas para um mangá específico
  async findDuplicatesFor(mangaId: string, threshold: number = 0.5) {
    const manga = await this.prisma.mangas.findUnique({
      where: { id: mangaId },
      select: { primary_title: true },
    });

    if (!manga) {
      throw new BadRequestException(`Manga ${mangaId} not found`);
    }

    const duplicates = await this.prisma.$queryRaw<
      {
        id: string;
        primary_title: string;
        image_url: string | null;
        image_filename: string | null;
        status: string | null;
        similarity: number;
      }[]
    >`
      SELECT
        m.id,
        m.primary_title,
        m.image_url,
        m.image_filename,
        m.status,
        similarity(m.primary_title, ${manga.primary_title}) as similarity
      FROM mangas m
      WHERE m.id != ${mangaId}::uuid
        AND m.deleted_at IS NULL
        AND similarity(m.primary_title, ${manga.primary_title}) > ${threshold}
      ORDER BY similarity DESC
      LIMIT 20
    `;

    return duplicates.map((d) => ({
      id: d.id,
      primaryTitle: d.primary_title,
      imageUrl: d.image_url,
      imageFilename: d.image_filename,
      status: d.status,
      similarity: d.similarity,
    }));
  }

  // Mescla dois mangás, mantendo o principal e transferindo dados do secundário
  async mergeDuplicates(primaryId: string, secondaryId: string) {
    if (primaryId === secondaryId) {
      throw new BadRequestException('Cannot merge a manga with itself');
    }

    const [primary, secondary] = await Promise.all([
      this.prisma.mangas.findUnique({
        where: { id: primaryId },
        include: {
          manga_genres: true,
          manga_themes: true,
          manga_tags: true,
          manga_names: true,
          manga_links: true,
        },
      }),
      this.prisma.mangas.findUnique({
        where: { id: secondaryId },
        include: {
          manga_genres: true,
          manga_themes: true,
          manga_tags: true,
          manga_names: true,
          manga_links: true,
        },
      }),
    ]);

    if (!primary || !secondary) {
      throw new BadRequestException('One or both mangas not found');
    }

    // Usa transação para garantir consistência
    await this.prisma.$transaction(async (tx) => {
      // Transfere gêneros que não existem no principal
      const existingGenreIds = new Set(primary.manga_genres.map((g) => g.genre_id));
      const newGenres = secondary.manga_genres.filter((g) => !existingGenreIds.has(g.genre_id));
      if (newGenres.length > 0) {
        await tx.manga_genres.createMany({
          data: newGenres.map((g) => ({ manga_id: primaryId, genre_id: g.genre_id })),
          skipDuplicates: true,
        });
      }

      // Transfere temas
      const existingThemeIds = new Set(primary.manga_themes.map((t) => t.theme_id));
      const newThemes = secondary.manga_themes.filter((t) => !existingThemeIds.has(t.theme_id));
      if (newThemes.length > 0) {
        await tx.manga_themes.createMany({
          data: newThemes.map((t) => ({ manga_id: primaryId, theme_id: t.theme_id })),
          skipDuplicates: true,
        });
      }

      // Transfere tags
      const existingTagIds = new Set(primary.manga_tags.map((t) => t.tag_id));
      const newTags = secondary.manga_tags.filter((t) => !existingTagIds.has(t.tag_id));
      if (newTags.length > 0) {
        await tx.manga_tags.createMany({
          data: newTags.map((t) => ({ manga_id: primaryId, tag_id: t.tag_id })),
          skipDuplicates: true,
        });
      }

      // Transfere nomes alternativos (adiciona título principal do secundário como alternativo)
      const existingNames = new Set(primary.manga_names.map((n) => n.name.toLowerCase()));
      const namesToAdd = [
        ...secondary.manga_names.filter((n) => !existingNames.has(n.name.toLowerCase())),
      ];

      // Adiciona o título principal do secundário como nome alternativo
      if (!existingNames.has(secondary.primary_title.toLowerCase())) {
        namesToAdd.push({ name: secondary.primary_title } as any);
      }

      if (namesToAdd.length > 0) {
        await tx.manga_names.createMany({
          data: namesToAdd.map((n) => ({ manga_id: primaryId, name: n.name })),
          skipDuplicates: true,
        });
      }

      // Transfere links
      const existingUrls = new Set(primary.manga_links.map((l) => l.url));
      const newLinks = secondary.manga_links.filter((l) => !existingUrls.has(l.url));
      if (newLinks.length > 0) {
        await tx.manga_links.createMany({
          data: newLinks.map((l) => ({
            manga_id: primaryId,
            site_id: l.site_id,
            url: l.url,
            label: l.label,
            is_primary: false,
            is_active: l.is_active,
          })),
          skipDuplicates: true,
        });
      }

      // Atualiza campos vazios do principal com dados do secundário
      const updates: any = {};
      let imageTransferred = false;

      if (!primary.synopsis && secondary.synopsis) updates.synopsis = secondary.synopsis;
      if (!primary.image_url && secondary.image_url) updates.image_url = secondary.image_url;
      if (!primary.image_filename && secondary.image_filename) {
        updates.image_filename = secondary.image_filename;
        imageTransferred = true; // Imagem será usada pelo primário
      }
      if (!primary.rating && secondary.rating) updates.rating = secondary.rating;
      if (!primary.total_chapters && secondary.total_chapters) updates.total_chapters = secondary.total_chapters;

      // Mantém o maior número de capítulos lidos
      if ((secondary.last_chapter_read || 0) > (primary.last_chapter_read || 0)) {
        updates.last_chapter_read = secondary.last_chapter_read;
      }

      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date();
        await tx.mangas.update({
          where: { id: primaryId },
          data: updates,
        });
      }

      // Soft delete do secundário
      await tx.mangas.update({
        where: { id: secondaryId },
        data: { deleted_at: new Date() },
      });

      // Deleta a imagem do secundário do storage (apenas se não foi transferida)
      if (!imageTransferred && secondary.image_filename) {
        this.imageService.deleteImage(secondaryId);
      }
    });

    return {
      message: 'Mangas merged successfully',
      primaryId,
      secondaryId,
    };
  }

  // Marca como não duplicata (ignora)
  async ignoreDuplicate(id1: string, id2: string) {
    // Por enquanto apenas retorna sucesso
    // Futuramente pode salvar em uma tabela de "não duplicatas"
    return {
      message: 'Duplicate ignored',
      ids: [id1, id2],
    };
  }
}
