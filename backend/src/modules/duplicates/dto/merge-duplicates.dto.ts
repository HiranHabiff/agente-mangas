import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class MergeDuplicatesDto {
  @ApiProperty({ description: 'ID do mangá principal (será mantido)' })
  @IsUUID()
  primaryId: string;

  @ApiProperty({ description: 'ID do mangá secundário (será mesclado e excluído)' })
  @IsUUID()
  secondaryId: string;
}
