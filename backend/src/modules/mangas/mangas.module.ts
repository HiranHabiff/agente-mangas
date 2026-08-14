import { Module } from '@nestjs/common';
import { MangasController } from './mangas.controller';
import { MangasService } from './mangas.service';
import { ImageService } from './image.service';

@Module({
  controllers: [MangasController],
  providers: [MangasService, ImageService],
  exports: [MangasService, ImageService],
})
export class MangasModule {}
