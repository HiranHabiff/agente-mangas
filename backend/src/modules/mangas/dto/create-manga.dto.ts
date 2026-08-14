import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, Min, Max, IsUrl } from 'class-validator';

export class CreateMangaDto {
  @ApiProperty({ description: 'Título principal do mangá' })
  @IsString()
  primaryTitle: string;

  @ApiPropertyOptional({ description: 'URL do mangá' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({ description: 'URL da imagem de capa' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Sinopse' })
  @IsOptional()
  @IsString()
  synopsis?: string;

  @ApiPropertyOptional({ description: 'Total de capítulos' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalChapters?: number;

  @ApiPropertyOptional({ description: 'Último capítulo lido' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lastChapterRead?: number;

  @ApiPropertyOptional({ description: 'Nota (0-10)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  rating?: number;

  @ApiPropertyOptional({ description: 'Status de leitura', default: 'plan_to_read' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Notas do usuário' })
  @IsOptional()
  @IsString()
  userNotes?: string;

  @ApiPropertyOptional({ description: 'ID do status de publicação' })
  @IsOptional()
  @IsString()
  statusId?: string;

  @ApiPropertyOptional({ description: 'ID do tipo' })
  @IsOptional()
  @IsString()
  typeId?: string;

  @ApiPropertyOptional({ description: 'ID do rating de conteúdo' })
  @IsOptional()
  @IsString()
  ratingId?: string;

  @ApiPropertyOptional({ description: 'ID do demográfico' })
  @IsOptional()
  @IsString()
  demographicId?: string;

  @ApiPropertyOptional({ description: 'IDs dos gêneros', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genreIds?: string[];

  @ApiPropertyOptional({ description: 'IDs dos temas', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  themeIds?: string[];

  @ApiPropertyOptional({ description: 'IDs das tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];

  @ApiPropertyOptional({ description: 'Nomes alternativos', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alternativeNames?: string[];

  @ApiPropertyOptional({ description: 'Links externos' })
  @IsOptional()
  @IsArray()
  links?: {
    url: string;
    siteId?: string;
    label?: string;
    isPrimary?: boolean;
  }[];
}
