import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { MangasService } from './mangas.service';
import { ImageService } from './image.service';
import { CreateMangaDto } from './dto/create-manga.dto';
import { UpdateMangaDto } from './dto/update-manga.dto';
import { FilterMangaDto } from './dto/filter-manga.dto';

@ApiTags('Mangas')
@Controller('mangas')
export class MangasController {
  constructor(
    private readonly mangasService: MangasService,
    private readonly imageService: ImageService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar mangás com filtros e paginação' })
  @ApiResponse({ status: 200, description: 'Lista de mangás' })
  findAll(@Query() filters: FilterMangaDto) {
    return this.mangasService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar mangá por ID' })
  @ApiParam({ name: 'id', description: 'UUID do mangá' })
  @ApiResponse({ status: 200, description: 'Detalhes do mangá' })
  @ApiResponse({ status: 404, description: 'Mangá não encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.mangasService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo mangá' })
  @ApiResponse({ status: 201, description: 'Mangá criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(@Body() createMangaDto: CreateMangaDto) {
    return this.mangasService.create(createMangaDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar mangá' })
  @ApiParam({ name: 'id', description: 'UUID do mangá' })
  @ApiResponse({ status: 200, description: 'Mangá atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Mangá não encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMangaDto: UpdateMangaDto,
  ) {
    return this.mangasService.update(id, updateMangaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir mangá (soft delete)' })
  @ApiParam({ name: 'id', description: 'UUID do mangá' })
  @ApiResponse({ status: 200, description: 'Mangá excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Mangá não encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.mangasService.remove(id);
  }

  @Patch(':id/chapter')
  @ApiOperation({ summary: 'Atualizar último capítulo lido' })
  @ApiParam({ name: 'id', description: 'UUID do mangá' })
  @ApiQuery({ name: 'chapter', description: 'Número do capítulo', type: Number })
  @ApiResponse({ status: 200, description: 'Capítulo atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Mangá não encontrado' })
  updateChapter(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('chapter') chapter: number,
  ) {
    return this.mangasService.updateChapter(id, chapter);
  }

  @Patch(':id/image')
  @ApiOperation({ summary: 'Atualizar imagem de capa via URL' })
  @ApiParam({ name: 'id', description: 'UUID do mangá' })
  @ApiBody({ schema: { type: 'object', properties: { imageUrl: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Imagem atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Mangá não encontrado' })
  async updateImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('imageUrl') imageUrl: string,
  ) {
    const filename = await this.imageService.downloadImage(id, imageUrl);
    return { filename, message: 'Image updated successfully' };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status de leitura rapidamente' })
  @ApiParam({ name: 'id', description: 'UUID do mangá' })
  @ApiBody({ schema: { type: 'object', properties: { status: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Mangá não encontrado' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
  ) {
    return this.mangasService.updateStatus(id, status);
  }

  @Get(':id/sessions')
  @ApiOperation({ summary: 'Buscar histórico de sessões de leitura' })
  @ApiParam({ name: 'id', description: 'UUID do mangá' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite de resultados' })
  @ApiResponse({ status: 200, description: 'Lista de sessões de leitura' })
  @ApiResponse({ status: 404, description: 'Mangá não encontrado' })
  getSessions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: number,
  ) {
    return this.mangasService.getReadingSessions(id, limit || 50);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Buscar estatísticas de leitura do mangá' })
  @ApiParam({ name: 'id', description: 'UUID do mangá' })
  @ApiResponse({ status: 200, description: 'Estatísticas de leitura' })
  @ApiResponse({ status: 404, description: 'Mangá não encontrado' })
  getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.mangasService.getReadingStats(id);
  }
}
