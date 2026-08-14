import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TagsService } from './tags.service';

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as tags para filtros' })
  @ApiResponse({ status: 200, description: 'Todas as tags agrupadas' })
  findAllForFilters() {
    return this.tagsService.findAllForFilters();
  }

  @Get('popular')
  @ApiOperation({ summary: 'Tags mais usadas' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite de resultados' })
  @ApiResponse({ status: 200, description: 'Tags mais populares' })
  findPopular(@Query('limit') limit?: number) {
    return this.tagsService.findPopular(limit || 10);
  }

  @Get('genres')
  @ApiOperation({ summary: 'Listar gêneros' })
  @ApiResponse({ status: 200, description: 'Lista de gêneros' })
  findAllGenres() {
    return this.tagsService.findAllGenres();
  }

  @Get('themes')
  @ApiOperation({ summary: 'Listar temas' })
  @ApiResponse({ status: 200, description: 'Lista de temas' })
  findAllThemes() {
    return this.tagsService.findAllThemes();
  }

  @Get('tags')
  @ApiOperation({ summary: 'Listar tags' })
  @ApiResponse({ status: 200, description: 'Lista de tags' })
  findAllTags() {
    return this.tagsService.findAllTags();
  }

  @Get('status')
  @ApiOperation({ summary: 'Listar status de publicação' })
  @ApiResponse({ status: 200, description: 'Lista de status' })
  findAllStatus() {
    return this.tagsService.findAllStatus();
  }

  @Get('types')
  @ApiOperation({ summary: 'Listar tipos (manga, manhwa, etc)' })
  @ApiResponse({ status: 200, description: 'Lista de tipos' })
  findAllTypes() {
    return this.tagsService.findAllTypes();
  }

  @Get('ratings')
  @ApiOperation({ summary: 'Listar content ratings' })
  @ApiResponse({ status: 200, description: 'Lista de ratings' })
  findAllRatings() {
    return this.tagsService.findAllRatings();
  }

  @Get('demographics')
  @ApiOperation({ summary: 'Listar demográficos' })
  @ApiResponse({ status: 200, description: 'Lista de demográficos' })
  findAllDemographics() {
    return this.tagsService.findAllDemographics();
  }

  @Get('sites')
  @ApiOperation({ summary: 'Listar sites' })
  @ApiResponse({ status: 200, description: 'Lista de sites' })
  findAllSites() {
    return this.tagsService.findAllSites();
  }

  @Get('warnings')
  @ApiOperation({ summary: 'Listar warnings' })
  @ApiResponse({ status: 200, description: 'Lista de warnings' })
  findAllWarnings() {
    return this.tagsService.findAllWarnings();
  }

  @Get('characters')
  @ApiOperation({ summary: 'Listar tipos de personagens' })
  @ApiResponse({ status: 200, description: 'Lista de tipos de personagens' })
  findAllCharacters() {
    return this.tagsService.findAllCharacters();
  }
}
