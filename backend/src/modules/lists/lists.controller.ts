import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ListsService } from './lists.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { AddMangaToListDto } from './dto/add-manga-to-list.dto';

@ApiTags('Lists')
@Controller('lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as listas de leitura' })
  @ApiResponse({ status: 200, description: 'Lista de listas de leitura' })
  findAll() {
    return this.listsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar lista por ID com mangás' })
  @ApiParam({ name: 'id', description: 'UUID da lista' })
  @ApiResponse({ status: 200, description: 'Detalhes da lista com mangás' })
  @ApiResponse({ status: 404, description: 'Lista não encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.listsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar nova lista de leitura' })
  @ApiResponse({ status: 201, description: 'Lista criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(@Body() createListDto: CreateListDto) {
    return this.listsService.create(createListDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar lista de leitura' })
  @ApiParam({ name: 'id', description: 'UUID da lista' })
  @ApiResponse({ status: 200, description: 'Lista atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Lista não encontrada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateListDto: UpdateListDto,
  ) {
    return this.listsService.update(id, updateListDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir lista de leitura' })
  @ApiParam({ name: 'id', description: 'UUID da lista' })
  @ApiResponse({ status: 200, description: 'Lista excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Lista não encontrada' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.listsService.remove(id);
  }

  @Post(':id/mangas')
  @ApiOperation({ summary: 'Adicionar mangá à lista' })
  @ApiParam({ name: 'id', description: 'UUID da lista' })
  @ApiResponse({ status: 201, description: 'Mangá adicionado à lista' })
  @ApiResponse({ status: 404, description: 'Lista ou mangá não encontrado' })
  @ApiResponse({ status: 409, description: 'Mangá já está na lista' })
  addManga(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addMangaDto: AddMangaToListDto,
  ) {
    return this.listsService.addMangaToList(id, addMangaDto);
  }

  @Delete(':id/mangas/:mangaId')
  @ApiOperation({ summary: 'Remover mangá da lista' })
  @ApiParam({ name: 'id', description: 'UUID da lista' })
  @ApiParam({ name: 'mangaId', description: 'UUID do mangá' })
  @ApiResponse({ status: 200, description: 'Mangá removido da lista' })
  @ApiResponse({ status: 404, description: 'Mangá não está na lista' })
  removeManga(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('mangaId', ParseUUIDPipe) mangaId: string,
  ) {
    return this.listsService.removeMangaFromList(id, mangaId);
  }

  @Get('manga/:mangaId')
  @ApiOperation({ summary: 'Buscar listas que contém um mangá' })
  @ApiParam({ name: 'mangaId', description: 'UUID do mangá' })
  @ApiResponse({ status: 200, description: 'Listas que contém o mangá' })
  getMangaLists(@Param('mangaId', ParseUUIDPipe) mangaId: string) {
    return this.listsService.getMangaLists(mangaId);
  }
}
