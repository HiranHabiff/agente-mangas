import { Module } from '@nestjs/common';
import { DuplicatesController } from './duplicates.controller';
import { DuplicatesService } from './duplicates.service';
import { MangasModule } from '../mangas/mangas.module';

@Module({
  imports: [MangasModule],
  controllers: [DuplicatesController],
  providers: [DuplicatesService],
  exports: [DuplicatesService],
})
export class DuplicatesModule {}
