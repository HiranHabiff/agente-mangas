import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Manga } from '../../database/models/manga.model';
import { MangaName } from '../../database/models/manga-name.model';
import { Tag } from '../../database/models/tag.model';
import { Creator } from '../../database/models/creator.model';
import { z } from 'zod';
import { MangaFiltersSchema } from '../../contracts/manga.contract';

@Injectable()
export class MangaRepository {
  constructor(
    @InjectModel(Manga)
    private readonly mangaModel: typeof Manga,
  ) {}

  async findAll(filters: z.infer<typeof MangaFiltersSchema>) {
    const {
      query,
      status,
      min_rating,
      max_rating,
      with_covers,
      tags,
      creators,
      sort_by = 'updated_at',
      sort_order = 'desc',
      limit = 50,
      offset = 0,
    } = filters;

    const where: any = {};
    const include: any[] = [];

    // Text search
    if (query) {
      where[Op.or] = [
        { primary_title: { [Op.iLike]: `%${query}%` } },
        { '$alternative_names.name$': { [Op.iLike]: `%${query}%` } },
      ];
      include.push({
        model: MangaName,
        as: 'alternative_names',
        attributes: ['name', 'language'],
        required: false,
      });
    } else {
      include.push({
        model: MangaName,
        as: 'alternative_names',
        attributes: ['name', 'language'],
        required: false,
      });
    }

    // Status filter
    if (status && status.length > 0) {
      where.status = { [Op.in]: status };
    }

    // Rating filter
    if (min_rating !== undefined) {
      where.rating = { ...where.rating, [Op.gte]: min_rating };
    }
    if (max_rating !== undefined) {
      where.rating = { ...where.rating, [Op.lte]: max_rating };
    }

    // With covers filter
    if (with_covers !== undefined) {
      where.image_filename = with_covers
        ? { [Op.ne]: null }
        : { [Op.eq]: null };
    }

    // Tags filter
    if (tags && tags.length > 0) {
      include.push({
        model: Tag,
        as: 'tags',
        attributes: ['id', 'name', 'type'],
        where: { id: { [Op.in]: tags } },
        through: { attributes: [] },
        required: true,
      });
    } else {
      include.push({
        model: Tag,
        as: 'tags',
        attributes: ['id', 'name', 'type'],
        through: { attributes: [] },
        required: false,
      });
    }

    // Creators filter
    if (creators && creators.length > 0) {
      include.push({
        model: Creator,
        as: 'creators',
        attributes: ['id', 'name'],
        where: { id: { [Op.in]: creators } },
        through: { attributes: ['role'] },
        required: true,
      });
    } else {
      include.push({
        model: Creator,
        as: 'creators',
        attributes: ['id', 'name'],
        through: { attributes: ['role'] },
        required: false,
      });
    }

    const { rows, count } = await this.mangaModel.findAndCountAll({
      where,
      include,
      order: [[sort_by, sort_order.toUpperCase()]],
      limit,
      offset,
      distinct: true,
    });

    return {
      data: rows,
      total: count,
      limit,
      offset,
    };
  }

  async findById(id: string, paranoid = true) {
    return this.mangaModel.findByPk(id, {
      include: [
        {
          model: MangaName,
          as: 'alternative_names',
          attributes: ['id', 'name', 'language'],
        },
        {
          model: Tag,
          as: 'tags',
          attributes: ['id', 'name', 'type', 'color'],
          through: { attributes: [] },
        },
        {
          model: Creator,
          as: 'creators',
          attributes: ['id', 'name', 'image_url'],
          through: { attributes: ['role'] },
        },
      ],
      paranoid,
    });
  }

  async create(data: Partial<Manga>) {
    return this.mangaModel.create(data as any);
  }

  async update(id: string, data: Partial<Manga>) {
    const manga = await this.findById(id);
    if (!manga) return null;

    await manga.update(data as any);
    return this.findById(id);
  }

  async delete(id: string) {
    const manga = await this.findById(id);
    if (!manga) return false;

    await manga.destroy();
    return true;
  }

  async restore(id: string) {
    const manga = await this.findById(id, false);
    if (!manga || !manga.deleted_at) return null;

    await manga.restore();
    return this.findById(id);
  }

  async count() {
    return this.mangaModel.count();
  }

  async countByStatus() {
    const results = await this.mangaModel.findAll({
      attributes: [
        'status',
        [this.mangaModel.sequelize!.fn('COUNT', '*'), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    return results.reduce((acc: any, curr: any) => {
      acc[curr.status] = parseInt(curr.count, 10);
      return acc;
    }, {});
  }
}
