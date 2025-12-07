import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Manga } from '../../database/models/manga.model';
import { MangaName } from '../../database/models/manga-name.model';
import { Tag } from '../../database/models/tag.model';
import { MangaTag } from '../../database/models/manga-tag.model';
import { Creator } from '../../database/models/creator.model';
import { MangaCreator } from '../../database/models/manga-creator.model';
import { MangaController } from './manga.controller';
import { MangaService } from './manga.service';
import { MangaRepository } from './manga.repository';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Manga,
      MangaName,
      Tag,
      MangaTag,
      Creator,
      MangaCreator,
    ]),
  ],
  controllers: [MangaController],
  providers: [MangaService, MangaRepository],
  exports: [MangaService, MangaRepository],
})
export class MangaModule {}
