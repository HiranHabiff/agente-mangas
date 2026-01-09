import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';

export class AddMangaToListDto {
  @ApiProperty({ description: 'ID do mangá' })
  @IsUUID()
  mangaId: string;

  @ApiPropertyOptional({ description: 'Ordem do mangá na lista' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Notas sobre o mangá nesta lista' })
  @IsOptional()
  @IsString()
  notes?: string;
}
