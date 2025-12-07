import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Manga } from './models/manga.model';
import { MangaName } from './models/manga-name.model';
import { Tag } from './models/tag.model';
import { MangaTag } from './models/manga-tag.model';
import { Creator } from './models/creator.model';
import { MangaCreator } from './models/manga-creator.model';
import { Reminder } from './models/reminder.model';
import { ReadingSession } from './models/reading-session.model';
import { Collection } from './models/collection.model';
import { CollectionManga } from './models/collection-manga.model';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        models: [
          Manga,
          MangaName,
          Tag,
          MangaTag,
          Creator,
          MangaCreator,
          Reminder,
          ReadingSession,
          Collection,
          CollectionManga,
        ],
        autoLoadModels: true,
        synchronize: false, // Use migrations in production
        logging: configService.get('NODE_ENV') === 'development' ? console.log : false,
        pool: {
          max: 10,
          min: 2,
          acquire: 30000,
          idle: 10000,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
