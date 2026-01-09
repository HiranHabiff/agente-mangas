import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { MangasModule } from './modules/mangas/mangas.module';
import { TagsModule } from './modules/tags/tags.module';
import { StatsModule } from './modules/stats/stats.module';
import { DuplicatesModule } from './modules/duplicates/duplicates.module';
import { AdminModule } from './modules/admin/admin.module';
import { ListsModule } from './modules/lists/lists.module';
import { RemindersModule } from './modules/reminders/reminders.module';
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
    ScheduleModule.forRoot(),
    PrismaModule,
    MangasModule,
    TagsModule,
    StatsModule,
    DuplicatesModule,
    AdminModule,
    ListsModule,
    RemindersModule,
  ],
})
export class AppModule {}
