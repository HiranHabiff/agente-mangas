import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { MangasModule } from './modules/mangas/mangas.module';
import { TagsModule } from './modules/tags/tags.module';
import { StatsModule } from './modules/stats/stats.module';
import { DuplicatesModule } from './modules/duplicates/duplicates.module';
import { AdminModule } from './modules/admin/admin.module';
import configuration from './config/configuration';

// Determina o caminho das imagens baseado no ambiente
const imagesPath = process.env.IMAGES_PATH || join(__dirname, '..', '..', 'storage', 'images');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ServeStaticModule.forRoot({
      rootPath: imagesPath,
      serveRoot: '/images',
      serveStaticOptions: {
        index: false,
      },
    }),
    PrismaModule,
    MangasModule,
    TagsModule,
    StatsModule,
    DuplicatesModule,
    AdminModule,
  ],
})
export class AppModule {}
