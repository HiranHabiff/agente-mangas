import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { StatsService } from './stats.service';

@ApiTags('Stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  @ApiOperation({ summary: 'Estatísticas gerais' })
  @ApiResponse({ status: 200, description: 'Visão geral das estatísticas' })
  getOverview() {
    return this.statsService.getOverview();
  }

  @Get('recently-updated')
  @ApiOperation({ summary: 'Mangás atualizados recentemente' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de mangás recentes' })
  getRecentlyUpdated(@Query('limit') limit?: number) {
    return this.statsService.getRecentlyUpdated(limit || 10);
  }

  @Get('recently-read')
  @ApiOperation({ summary: 'Mangás lidos recentemente' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de mangás lidos recentemente' })
  getRecentlyRead(@Query('limit') limit?: number) {
    return this.statsService.getRecentlyRead(limit || 10);
  }

  @Get('top-rated')
  @ApiOperation({ summary: 'Mangás mais bem avaliados' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de mangás top rated' })
  getTopRated(@Query('limit') limit?: number) {
    return this.statsService.getTopRated(limit || 10);
  }

  @Get('most-read')
  @ApiOperation({ summary: 'Mangás com mais capítulos lidos' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de mangás mais lidos' })
  getMostRead(@Query('limit') limit?: number) {
    return this.statsService.getMostRead(limit || 10);
  }

  @Get('genres')
  @ApiOperation({ summary: 'Distribuição por gênero' })
  @ApiResponse({ status: 200, description: 'Contagem por gênero' })
  getGenreDistribution() {
    return this.statsService.getGenreDistribution();
  }

  @Get('status')
  @ApiOperation({ summary: 'Distribuição por status' })
  @ApiResponse({ status: 200, description: 'Contagem por status' })
  getStatusDistribution() {
    return this.statsService.getStatusDistribution();
  }

  @Get('types')
  @ApiOperation({ summary: 'Distribuição por tipo' })
  @ApiResponse({ status: 200, description: 'Contagem por tipo' })
  getTypeDistribution() {
    return this.statsService.getTypeDistribution();
  }

  @Get('ratings')
  @ApiOperation({ summary: 'Distribuição de ratings' })
  @ApiResponse({ status: 200, description: 'Distribuição por faixa de rating' })
  getRatingDistribution() {
    return this.statsService.getRatingDistribution();
  }
}
