import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLookupDto, CreateSiteDto, CreateTagDto } from './dto/create-lookup.dto';
import { UpdateLookupDto, UpdateSiteDto, UpdateTagDto } from './dto/update-lookup.dto';

type LookupTable = 'genres' | 'themes' | 'status' | 'types' | 'ratings' | 'demographic' | 'warnings' | 'characters';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ==================== GENRES ====================
  async findAllGenres() {
    return this.prisma.genres.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { manga_genres: true } } },
    });
  }

  async createGenre(dto: CreateLookupDto) {
    return this.prisma.genres.create({
      data: {
        name: dto.name,
        name_english: dto.nameEnglish,
        color: dto.color,
        description: dto.description,
      },
    });
  }

  async updateGenre(id: string, dto: UpdateLookupDto) {
    await this.ensureExists('genres', id);
    return this.prisma.genres.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.nameEnglish !== undefined && { name_english: dto.nameEnglish }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async deleteGenre(id: string) {
    await this.ensureNotInUse('genres', id, 'manga_genres', 'genre_id');
    await this.prisma.genres.delete({ where: { id } });
    return { message: 'Genre deleted successfully' };
  }

  // ==================== THEMES ====================
  async findAllThemes() {
    return this.prisma.themes.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { manga_themes: true } } },
    });
  }

  async createTheme(dto: CreateLookupDto) {
    return this.prisma.themes.create({
      data: {
        name: dto.name,
        name_english: dto.nameEnglish,
        color: dto.color,
        description: dto.description,
      },
    });
  }

  async updateTheme(id: string, dto: UpdateLookupDto) {
    await this.ensureExists('themes', id);
    return this.prisma.themes.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.nameEnglish !== undefined && { name_english: dto.nameEnglish }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async deleteTheme(id: string) {
    await this.ensureNotInUse('themes', id, 'manga_themes', 'theme_id');
    await this.prisma.themes.delete({ where: { id } });
    return { message: 'Theme deleted successfully' };
  }

  // ==================== TAGS ====================
  async findAllTags() {
    return this.prisma.tags.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { manga_tags: true } } },
    });
  }

  async createTag(dto: CreateTagDto) {
    return this.prisma.tags.create({
      data: {
        name: dto.name,
        name_english: dto.nameEnglish,
        color: dto.color,
        category: dto.category,
      },
    });
  }

  async updateTag(id: string, dto: UpdateTagDto) {
    await this.ensureExists('tags', id);
    return this.prisma.tags.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.nameEnglish !== undefined && { name_english: dto.nameEnglish }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.category !== undefined && { category: dto.category }),
      },
    });
  }

  async deleteTag(id: string) {
    await this.ensureNotInUse('tags', id, 'manga_tags', 'tag_id');
    await this.prisma.tags.delete({ where: { id } });
    return { message: 'Tag deleted successfully' };
  }

  // ==================== STATUS ====================
  async findAllStatus() {
    return this.prisma.status.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { mangas: true } } },
    });
  }

  async createStatus(dto: CreateLookupDto) {
    return this.prisma.status.create({
      data: {
        name: dto.name,
        name_english: dto.nameEnglish,
        color: dto.color,
        description: dto.description,
      },
    });
  }

  async updateStatus(id: string, dto: UpdateLookupDto) {
    await this.ensureExists('status', id);
    return this.prisma.status.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.nameEnglish !== undefined && { name_english: dto.nameEnglish }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async deleteStatus(id: string) {
    await this.ensureStatusNotInUse(id);
    await this.prisma.status.delete({ where: { id } });
    return { message: 'Status deleted successfully' };
  }

  // ==================== TYPES ====================
  async findAllTypes() {
    return this.prisma.types.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { mangas: true } } },
    });
  }

  async createType(dto: CreateLookupDto) {
    return this.prisma.types.create({
      data: {
        name: dto.name,
        name_english: dto.nameEnglish,
        color: dto.color,
        description: dto.description,
      },
    });
  }

  async updateType(id: string, dto: UpdateLookupDto) {
    await this.ensureExists('types', id);
    return this.prisma.types.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.nameEnglish !== undefined && { name_english: dto.nameEnglish }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async deleteType(id: string) {
    await this.ensureTypeNotInUse(id);
    await this.prisma.types.delete({ where: { id } });
    return { message: 'Type deleted successfully' };
  }

  // ==================== RATINGS ====================
  async findAllRatings() {
    return this.prisma.ratings.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { mangas: true } } },
    });
  }

  async createRating(dto: CreateLookupDto) {
    return this.prisma.ratings.create({
      data: {
        name: dto.name,
        name_english: dto.nameEnglish,
        color: dto.color,
        description: dto.description,
      },
    });
  }

  async updateRating(id: string, dto: UpdateLookupDto) {
    await this.ensureExists('ratings', id);
    return this.prisma.ratings.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.nameEnglish !== undefined && { name_english: dto.nameEnglish }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async deleteRating(id: string) {
    await this.ensureRatingNotInUse(id);
    await this.prisma.ratings.delete({ where: { id } });
    return { message: 'Rating deleted successfully' };
  }

  // ==================== DEMOGRAPHICS ====================
  async findAllDemographics() {
    return this.prisma.demographic.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { mangas: true } } },
    });
  }

  async createDemographic(dto: CreateLookupDto) {
    return this.prisma.demographic.create({
      data: {
        name: dto.name,
        name_english: dto.nameEnglish,
        color: dto.color,
        description: dto.description,
      },
    });
  }

  async updateDemographic(id: string, dto: UpdateLookupDto) {
    await this.ensureExists('demographic', id);
    return this.prisma.demographic.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.nameEnglish !== undefined && { name_english: dto.nameEnglish }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async deleteDemographic(id: string) {
    await this.ensureDemographicNotInUse(id);
    await this.prisma.demographic.delete({ where: { id } });
    return { message: 'Demographic deleted successfully' };
  }

  // ==================== SITES ====================
  async findAllSites() {
    return this.prisma.sites.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { manga_links: true } } },
    });
  }

  async createSite(dto: CreateSiteDto) {
    return this.prisma.sites.create({
      data: {
        name: dto.name,
        url: dto.url,
        image: dto.image,
        language: dto.language,
        description: dto.description,
      },
    });
  }

  async updateSite(id: string, dto: UpdateSiteDto) {
    await this.ensureExists('sites', id);
    return this.prisma.sites.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.url !== undefined && { url: dto.url }),
        ...(dto.image !== undefined && { image: dto.image }),
        ...(dto.language !== undefined && { language: dto.language }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async deleteSite(id: string) {
    await this.ensureNotInUse('sites', id, 'manga_links', 'site_id');
    await this.prisma.sites.delete({ where: { id } });
    return { message: 'Site deleted successfully' };
  }

  // ==================== WARNINGS ====================
  async findAllWarnings() {
    return this.prisma.warnings.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { manga_warnings: true } } },
    });
  }

  async createWarning(dto: CreateLookupDto) {
    return this.prisma.warnings.create({
      data: {
        name: dto.name,
        name_english: dto.nameEnglish,
        color: dto.color,
        description: dto.description,
      },
    });
  }

  async updateWarning(id: string, dto: UpdateLookupDto) {
    await this.ensureExists('warnings', id);
    return this.prisma.warnings.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.nameEnglish !== undefined && { name_english: dto.nameEnglish }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async deleteWarning(id: string) {
    await this.ensureNotInUse('warnings', id, 'manga_warnings', 'warning_id');
    await this.prisma.warnings.delete({ where: { id } });
    return { message: 'Warning deleted successfully' };
  }

  // ==================== CHARACTERS ====================
  async findAllCharacters() {
    return this.prisma.characters.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { manga_characters: true } } },
    });
  }

  async createCharacter(dto: CreateLookupDto) {
    return this.prisma.characters.create({
      data: {
        name: dto.name,
        name_english: dto.nameEnglish,
        color: dto.color,
        description: dto.description,
      },
    });
  }

  async updateCharacter(id: string, dto: UpdateLookupDto) {
    await this.ensureExists('characters', id);
    return this.prisma.characters.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.nameEnglish !== undefined && { name_english: dto.nameEnglish }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async deleteCharacter(id: string) {
    await this.ensureNotInUse('characters', id, 'manga_characters', 'character_id');
    await this.prisma.characters.delete({ where: { id } });
    return { message: 'Character deleted successfully' };
  }

  // ==================== HELPERS ====================
  private async ensureExists(table: string, id: string) {
    const prismaAny = this.prisma as any;
    const record = await prismaAny[table].findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundException(`${table} with ID ${id} not found`);
    }
    return record;
  }

  private async ensureNotInUse(table: string, id: string, junctionTable: string, foreignKey: string) {
    const prismaAny = this.prisma as any;
    const count = await prismaAny[junctionTable].count({
      where: { [foreignKey]: id },
    });
    if (count > 0) {
      throw new ConflictException(`Cannot delete: ${table} is in use by ${count} manga(s)`);
    }
  }

  private async ensureStatusNotInUse(id: string) {
    const count = await this.prisma.mangas.count({
      where: { status_id: id },
    });
    if (count > 0) {
      throw new ConflictException(`Cannot delete: status is in use by ${count} manga(s)`);
    }
  }

  private async ensureTypeNotInUse(id: string) {
    const count = await this.prisma.mangas.count({
      where: { type_id: id },
    });
    if (count > 0) {
      throw new ConflictException(`Cannot delete: type is in use by ${count} manga(s)`);
    }
  }

  private async ensureRatingNotInUse(id: string) {
    const count = await this.prisma.mangas.count({
      where: { rating_id: id },
    });
    if (count > 0) {
      throw new ConflictException(`Cannot delete: rating is in use by ${count} manga(s)`);
    }
  }

  private async ensureDemographicNotInUse(id: string) {
    const count = await this.prisma.mangas.count({
      where: { demographic_id: id },
    });
    if (count > 0) {
      throw new ConflictException(`Cannot delete: demographic is in use by ${count} manga(s)`);
    }
  }
}
