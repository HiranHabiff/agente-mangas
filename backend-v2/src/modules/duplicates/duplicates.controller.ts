import { Controller, Get, Post, Body, Query, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { DuplicatesService } from './duplicates.service';
import { MergeDuplicatesDto } from './dto/merge-duplicates.dto';

@ApiTags('Duplicates')
@Controller('duplicates')
export class DuplicatesController {
  constructor(private readonly duplicatesService: DuplicatesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar possíveis duplicatas' })
  @ApiQuery({ name: 'threshold', required: false, type: Number, description: 'Threshold de similaridade (0-1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite de resultados' })
  @ApiResponse({ status: 200, description: 'Lista de possíveis duplicatas' })
  findPotentialDuplicates(
    @Query('threshold') threshold?: number,
    @Query('limit') limit?: number,
  ) {
    return this.duplicatesService.findPotentialDuplicates(
      threshold || 0.6,
      limit || 10,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar duplicatas para um mangá específico' })
  @ApiParam({ name: 'id', description: 'UUID do mangá' })
  @ApiQuery({ name: 'threshold', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de duplicatas' })
  findDuplicatesFor(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('threshold') threshold?: number,
  ) {
    return this.duplicatesService.findDuplicatesFor(id, threshold || 0.5);
  }

  @Post('merge')
  @ApiOperation({ summary: 'Mesclar dois mangás duplicados' })
  @ApiResponse({ status: 200, description: 'Mangás mesclados com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro na mesclagem' })
  merge(@Body() dto: MergeDuplicatesDto) {
    return this.duplicatesService.mergeDuplicates(dto.primaryId, dto.secondaryId);
  }

  @Post('ignore')
  @ApiOperation({ summary: 'Ignorar duplicata (não são duplicados)' })
  @ApiResponse({ status: 200, description: 'Duplicata ignorada' })
  ignore(@Body() dto: MergeDuplicatesDto) {
    return this.duplicatesService.ignoreDuplicate(dto.primaryId, dto.secondaryId);
  }
}
