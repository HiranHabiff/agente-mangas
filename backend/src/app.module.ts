import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { DatabaseModule } from './database/database.module';
import { MangaModule } from './modules/manga/manga.module';
import { TagModule } from './modules/tag/tag.module';
import { AiModule } from './modules/ai/ai.module';
import { StatsModule } from './modules/stats/stats.module';
import { CollectionModule } from './modules/collection/collection.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),

    // Database
    DatabaseModule,

    // Feature Modules
    MangaModule,
    TagModule,
    AiModule,
    StatsModule,
    CollectionModule,
    HealthModule,
  ],
})
export class AppModule {}
