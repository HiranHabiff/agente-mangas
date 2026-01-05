import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';

export class CreateLookupDto {
  @ApiProperty({ description: 'Nome do item' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Nome em inglês' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameEnglish?: string;

  @ApiPropertyOptional({ description: 'Cor (hex)', example: '#FF5733' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color (e.g., #FF5733)' })
  color?: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateSiteDto {
  @ApiProperty({ description: 'Nome do site' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'URL do site' })
  @IsString()
  @MaxLength(255)
  url: string;

  @ApiProperty({ description: 'URL da imagem/logo' })
  @IsString()
  @MaxLength(255)
  image: string;

  @ApiProperty({ description: 'Idioma do site' })
  @IsString()
  @MaxLength(50)
  language: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateTagDto extends CreateLookupDto {
  @ApiPropertyOptional({ description: 'Categoria da tag' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;
}
