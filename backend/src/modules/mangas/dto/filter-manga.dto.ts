import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsArray, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class FilterMangaDto {
  @ApiPropertyOptional({ description: 'Busca por título' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Filtrar por status (reading, completed, etc)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  status?: string[];

  @ApiPropertyOptional({ description: 'Filtrar por IDs de gêneros' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  genres?: string[];

  @ApiPropertyOptional({ description: 'Filtrar por IDs de temas' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  themes?: string[];

  @ApiPropertyOptional({ description: 'Filtrar por IDs de tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  tags?: string[];

  @ApiPropertyOptional({ description: 'Filtrar por IDs de tipos (manga, manhwa, etc)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  types?: string[];

  @ApiPropertyOptional({ description: 'Filtrar por IDs de classificação de conteúdo' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  ratings?: string[];

  @ApiPropertyOptional({ description: 'Filtrar por IDs de demografia' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  demographics?: string[];

  @ApiPropertyOptional({ description: 'Nota mínima (0-10)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  @Type(() => Number)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Apenas com capa' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  withCovers?: boolean;

  @ApiPropertyOptional({
    description: 'Ordenar por',
    enum: ['primary_title', 'rating', 'last_read_at', 'updated_at', 'created_at', 'last_chapter_read']
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Ordem', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Limite de resultados', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Offset para paginação', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}
