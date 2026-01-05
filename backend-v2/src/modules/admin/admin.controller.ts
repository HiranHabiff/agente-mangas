import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateLookupDto, CreateSiteDto, CreateTagDto } from './dto/create-lookup.dto';
import { UpdateLookupDto, UpdateSiteDto, UpdateTagDto } from './dto/update-lookup.dto';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== GENRES ====================
  @Get('genres')
  @ApiOperation({ summary: 'Listar todos os gêneros' })
  findAllGenres() {
    return this.adminService.findAllGenres();
  }

  @Post('genres')
  @ApiOperation({ summary: 'Criar gênero' })
  createGenre(@Body() dto: CreateLookupDto) {
    return this.adminService.createGenre(dto);
  }

  @Patch('genres/:id')
  @ApiOperation({ summary: 'Atualizar gênero' })
  @ApiParam({ name: 'id', description: 'UUID do gênero' })
  updateGenre(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLookupDto) {
    return this.adminService.updateGenre(id, dto);
  }

  @Delete('genres/:id')
  @ApiOperation({ summary: 'Excluir gênero' })
  @ApiParam({ name: 'id', description: 'UUID do gênero' })
  @ApiResponse({ status: 409, description: 'Gênero em uso' })
  deleteGenre(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteGenre(id);
  }

  // ==================== THEMES ====================
  @Get('themes')
  @ApiOperation({ summary: 'Listar todos os temas' })
  findAllThemes() {
    return this.adminService.findAllThemes();
  }

  @Post('themes')
  @ApiOperation({ summary: 'Criar tema' })
  createTheme(@Body() dto: CreateLookupDto) {
    return this.adminService.createTheme(dto);
  }

  @Patch('themes/:id')
  @ApiOperation({ summary: 'Atualizar tema' })
  @ApiParam({ name: 'id', description: 'UUID do tema' })
  updateTheme(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLookupDto) {
    return this.adminService.updateTheme(id, dto);
  }

  @Delete('themes/:id')
  @ApiOperation({ summary: 'Excluir tema' })
  @ApiParam({ name: 'id', description: 'UUID do tema' })
  @ApiResponse({ status: 409, description: 'Tema em uso' })
  deleteTheme(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteTheme(id);
  }

  // ==================== TAGS ====================
  @Get('tags')
  @ApiOperation({ summary: 'Listar todas as tags' })
  findAllTags() {
    return this.adminService.findAllTags();
  }

  @Post('tags')
  @ApiOperation({ summary: 'Criar tag' })
  createTag(@Body() dto: CreateTagDto) {
    return this.adminService.createTag(dto);
  }

  @Patch('tags/:id')
  @ApiOperation({ summary: 'Atualizar tag' })
  @ApiParam({ name: 'id', description: 'UUID da tag' })
  updateTag(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTagDto) {
    return this.adminService.updateTag(id, dto);
  }

  @Delete('tags/:id')
  @ApiOperation({ summary: 'Excluir tag' })
  @ApiParam({ name: 'id', description: 'UUID da tag' })
  @ApiResponse({ status: 409, description: 'Tag em uso' })
  deleteTag(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteTag(id);
  }

  // ==================== STATUS ====================
  @Get('status')
  @ApiOperation({ summary: 'Listar todos os status de publicação' })
  findAllStatus() {
    return this.adminService.findAllStatus();
  }

  @Post('status')
  @ApiOperation({ summary: 'Criar status' })
  createStatus(@Body() dto: CreateLookupDto) {
    return this.adminService.createStatus(dto);
  }

  @Patch('status/:id')
  @ApiOperation({ summary: 'Atualizar status' })
  @ApiParam({ name: 'id', description: 'UUID do status' })
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLookupDto) {
    return this.adminService.updateStatus(id, dto);
  }

  @Delete('status/:id')
  @ApiOperation({ summary: 'Excluir status' })
  @ApiParam({ name: 'id', description: 'UUID do status' })
  @ApiResponse({ status: 409, description: 'Status em uso' })
  deleteStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteStatus(id);
  }

  // ==================== TYPES ====================
  @Get('types')
  @ApiOperation({ summary: 'Listar todos os tipos' })
  findAllTypes() {
    return this.adminService.findAllTypes();
  }

  @Post('types')
  @ApiOperation({ summary: 'Criar tipo' })
  createType(@Body() dto: CreateLookupDto) {
    return this.adminService.createType(dto);
  }

  @Patch('types/:id')
  @ApiOperation({ summary: 'Atualizar tipo' })
  @ApiParam({ name: 'id', description: 'UUID do tipo' })
  updateType(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLookupDto) {
    return this.adminService.updateType(id, dto);
  }

  @Delete('types/:id')
  @ApiOperation({ summary: 'Excluir tipo' })
  @ApiParam({ name: 'id', description: 'UUID do tipo' })
  @ApiResponse({ status: 409, description: 'Tipo em uso' })
  deleteType(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteType(id);
  }

  // ==================== RATINGS ====================
  @Get('ratings')
  @ApiOperation({ summary: 'Listar todos os content ratings' })
  findAllRatings() {
    return this.adminService.findAllRatings();
  }

  @Post('ratings')
  @ApiOperation({ summary: 'Criar rating' })
  createRating(@Body() dto: CreateLookupDto) {
    return this.adminService.createRating(dto);
  }

  @Patch('ratings/:id')
  @ApiOperation({ summary: 'Atualizar rating' })
  @ApiParam({ name: 'id', description: 'UUID do rating' })
  updateRating(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLookupDto) {
    return this.adminService.updateRating(id, dto);
  }

  @Delete('ratings/:id')
  @ApiOperation({ summary: 'Excluir rating' })
  @ApiParam({ name: 'id', description: 'UUID do rating' })
  @ApiResponse({ status: 409, description: 'Rating em uso' })
  deleteRating(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteRating(id);
  }

  // ==================== DEMOGRAPHICS ====================
  @Get('demographics')
  @ApiOperation({ summary: 'Listar todos os demográficos' })
  findAllDemographics() {
    return this.adminService.findAllDemographics();
  }

  @Post('demographics')
  @ApiOperation({ summary: 'Criar demográfico' })
  createDemographic(@Body() dto: CreateLookupDto) {
    return this.adminService.createDemographic(dto);
  }

  @Patch('demographics/:id')
  @ApiOperation({ summary: 'Atualizar demográfico' })
  @ApiParam({ name: 'id', description: 'UUID do demográfico' })
  updateDemographic(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLookupDto) {
    return this.adminService.updateDemographic(id, dto);
  }

  @Delete('demographics/:id')
  @ApiOperation({ summary: 'Excluir demográfico' })
  @ApiParam({ name: 'id', description: 'UUID do demográfico' })
  @ApiResponse({ status: 409, description: 'Demográfico em uso' })
  deleteDemographic(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteDemographic(id);
  }

  // ==================== SITES ====================
  @Get('sites')
  @ApiOperation({ summary: 'Listar todos os sites' })
  findAllSites() {
    return this.adminService.findAllSites();
  }

  @Post('sites')
  @ApiOperation({ summary: 'Criar site' })
  createSite(@Body() dto: CreateSiteDto) {
    return this.adminService.createSite(dto);
  }

  @Patch('sites/:id')
  @ApiOperation({ summary: 'Atualizar site' })
  @ApiParam({ name: 'id', description: 'UUID do site' })
  updateSite(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSiteDto) {
    return this.adminService.updateSite(id, dto);
  }

  @Delete('sites/:id')
  @ApiOperation({ summary: 'Excluir site' })
  @ApiParam({ name: 'id', description: 'UUID do site' })
  @ApiResponse({ status: 409, description: 'Site em uso' })
  deleteSite(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteSite(id);
  }

  // ==================== WARNINGS ====================
  @Get('warnings')
  @ApiOperation({ summary: 'Listar todos os warnings' })
  findAllWarnings() {
    return this.adminService.findAllWarnings();
  }

  @Post('warnings')
  @ApiOperation({ summary: 'Criar warning' })
  createWarning(@Body() dto: CreateLookupDto) {
    return this.adminService.createWarning(dto);
  }

  @Patch('warnings/:id')
  @ApiOperation({ summary: 'Atualizar warning' })
  @ApiParam({ name: 'id', description: 'UUID do warning' })
  updateWarning(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLookupDto) {
    return this.adminService.updateWarning(id, dto);
  }

  @Delete('warnings/:id')
  @ApiOperation({ summary: 'Excluir warning' })
  @ApiParam({ name: 'id', description: 'UUID do warning' })
  @ApiResponse({ status: 409, description: 'Warning em uso' })
  deleteWarning(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteWarning(id);
  }

  // ==================== CHARACTERS ====================
  @Get('characters')
  @ApiOperation({ summary: 'Listar todos os tipos de personagens' })
  findAllCharacters() {
    return this.adminService.findAllCharacters();
  }

  @Post('characters')
  @ApiOperation({ summary: 'Criar tipo de personagem' })
  createCharacter(@Body() dto: CreateLookupDto) {
    return this.adminService.createCharacter(dto);
  }

  @Patch('characters/:id')
  @ApiOperation({ summary: 'Atualizar tipo de personagem' })
  @ApiParam({ name: 'id', description: 'UUID do tipo de personagem' })
  updateCharacter(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLookupDto) {
    return this.adminService.updateCharacter(id, dto);
  }

  @Delete('characters/:id')
  @ApiOperation({ summary: 'Excluir tipo de personagem' })
  @ApiParam({ name: 'id', description: 'UUID do tipo de personagem' })
  @ApiResponse({ status: 409, description: 'Tipo de personagem em uso' })
  deleteCharacter(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteCharacter(id);
  }
}
