import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { AddMangaToListDto } from './dto/add-manga-to-list.dto';

@Injectable()
export class ListsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const lists = await this.prisma.reading_lists.findMany({
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { manga_reading_lists: true },
        },
      },
    });

    return lists.map(this.transformList);
  }

  async findOne(id: string) {
    const list = await this.prisma.reading_lists.findUnique({
      where: { id },
      include: {
        manga_reading_lists: {
          include: {
            mangas: {
              include: {
                manga_genres: { include: { genres: true } },
                typeRef: true,
                ratingRef: true,
              },
            },
          },
          orderBy: { sort_order: 'asc' },
        },
        _count: {
          select: { manga_reading_lists: true },
        },
      },
    });

    if (!list) {
      throw new NotFoundException(`List with ID ${id} not found`);
    }

    return this.transformListDetail(list);
  }

  async create(createListDto: CreateListDto) {
    const { name, description, color, icon, isPublic, sortOrder } = createListDto;

    const list = await this.prisma.reading_lists.create({
      data: {
        name,
        description,
        color,
        icon,
        is_public: isPublic ?? false,
        sort_order: sortOrder ?? 0,
      },
      include: {
        _count: {
          select: { manga_reading_lists: true },
        },
      },
    });

    return this.transformList(list);
  }

  async update(id: string, updateListDto: UpdateListDto) {
    await this.findOne(id);

    const { name, description, color, icon, isPublic, sortOrder } = updateListDto;

    const list = await this.prisma.reading_lists.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
        ...(isPublic !== undefined && { is_public: isPublic }),
        ...(sortOrder !== undefined && { sort_order: sortOrder }),
        updated_at: new Date(),
      },
      include: {
        _count: {
          select: { manga_reading_lists: true },
        },
      },
    });

    return this.transformList(list);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.reading_lists.delete({
      where: { id },
    });

    return { message: 'List deleted successfully' };
  }

  async addMangaToList(listId: string, addMangaDto: AddMangaToListDto) {
    const { mangaId, sortOrder, notes } = addMangaDto;

    // Verifica se a lista existe
    await this.findOne(listId);

    // Verifica se o mangá existe
    const manga = await this.prisma.mangas.findUnique({
      where: { id: mangaId },
    });

    if (!manga) {
      throw new NotFoundException(`Manga with ID ${mangaId} not found`);
    }

    // Verifica se já está na lista
    const existing = await this.prisma.manga_reading_lists.findUnique({
      where: {
        manga_id_list_id: {
          manga_id: mangaId,
          list_id: listId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Manga already exists in this list');
    }

    await this.prisma.manga_reading_lists.create({
      data: {
        manga_id: mangaId,
        list_id: listId,
        sort_order: sortOrder ?? 0,
        notes,
      },
    });

    return { message: 'Manga added to list successfully' };
  }

  async removeMangaFromList(listId: string, mangaId: string) {
    const existing = await this.prisma.manga_reading_lists.findUnique({
      where: {
        manga_id_list_id: {
          manga_id: mangaId,
          list_id: listId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Manga is not in this list');
    }

    await this.prisma.manga_reading_lists.delete({
      where: {
        manga_id_list_id: {
          manga_id: mangaId,
          list_id: listId,
        },
      },
    });

    return { message: 'Manga removed from list successfully' };
  }

  async getMangaLists(mangaId: string) {
    const lists = await this.prisma.manga_reading_lists.findMany({
      where: { manga_id: mangaId },
      include: {
        reading_lists: true,
      },
    });

    return lists.map((item) => ({
      id: item.reading_lists.id,
      name: item.reading_lists.name,
      color: item.reading_lists.color,
      icon: item.reading_lists.icon,
      addedAt: item.added_at,
      notes: item.notes,
    }));
  }

  private transformList(list: any) {
    return {
      id: list.id,
      name: list.name,
      description: list.description,
      color: list.color,
      icon: list.icon,
      isPublic: list.is_public,
      sortOrder: list.sort_order,
      mangaCount: list._count?.manga_reading_lists ?? 0,
      createdAt: list.created_at,
      updatedAt: list.updated_at,
    };
  }

  private transformListDetail(list: any) {
    const base = this.transformList(list);
    return {
      ...base,
      mangas: list.manga_reading_lists?.map((item: any) => ({
        id: item.mangas.id,
        primaryTitle: item.mangas.primary_title,
        imageUrl: item.mangas.image_url,
        imageFilename: item.mangas.image_filename,
        status: item.mangas.status,
        lastChapterRead: item.mangas.last_chapter_read,
        totalChapters: item.mangas.total_chapters,
        rating: item.mangas.rating ? Number(item.mangas.rating) : null,
        addedAt: item.added_at,
        notes: item.notes,
        sortOrder: item.sort_order,
        type: item.mangas.typeRef
          ? {
              id: item.mangas.typeRef.id,
              name: item.mangas.typeRef.name,
              color: item.mangas.typeRef.color,
            }
          : null,
        genres:
          item.mangas.manga_genres?.map((mg: any) => ({
            id: mg.genres.id,
            name: mg.genres.name,
            color: mg.genres.color,
          })) || [],
      })) || [],
    };
  }
}
