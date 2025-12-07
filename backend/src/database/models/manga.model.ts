import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  HasMany,
  BelongsToMany,
  Index,
} from 'sequelize-typescript';
import { MangaName } from './manga-name.model';
import { Tag } from './tag.model';
import { MangaTag } from './manga-tag.model';
import { Creator } from './creator.model';
import { MangaCreator } from './manga-creator.model';
import { Reminder } from './reminder.model';
import { ReadingSession } from './reading-session.model';
import { Collection } from './collection.model';
import { CollectionManga } from './collection-manga.model';

export type MangaStatus =
  | 'reading'
  | 'completed'
  | 'plan_to_read'
  | 'on_hold'
  | 'dropped';

@Table({
  tableName: 'mangas',
  timestamps: true,
  paranoid: true, // Soft delete
  underscored: true,
})
export class Manga extends Model<Manga> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Index
  @Column({
    type: DataType.STRING(750),
    allowNull: false,
  })
  primary_title: string;

  @Index
  @Column({
    type: DataType.ENUM('reading', 'completed', 'plan_to_read', 'on_hold', 'dropped'),
    defaultValue: 'plan_to_read',
  })
  status: MangaStatus;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  last_chapter_read: number;

  @Column({
    type: DataType.DECIMAL(3, 1),
    allowNull: true,
  })
  rating: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  synopsis: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  image_filename: string;

  @Column({
    type: DataType.STRING(1000),
    allowNull: true,
  })
  image_url: string;

  @Column({
    type: DataType.STRING(1000),
    allowNull: true,
  })
  source_url: string;

  @Column({
    type: 'vector(768)',
    allowNull: true,
  })
  embedding: number[];

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    unique: true,
  })
  legacy_id: number;

  @Index
  @CreatedAt
  created_at: Date;

  @Index
  @UpdatedAt
  updated_at: Date;

  @DeletedAt
  deleted_at: Date;

  // Relationships
  @HasMany(() => MangaName)
  alternative_names: MangaName[];

  @BelongsToMany(() => Tag, () => MangaTag)
  tags: Tag[];

  @BelongsToMany(() => Creator, () => MangaCreator)
  creators: Creator[];

  @HasMany(() => Reminder)
  reminders: Reminder[];

  @HasMany(() => ReadingSession)
  reading_sessions: ReadingSession[];

  @BelongsToMany(() => Collection, () => CollectionManga)
  collections: Collection[];
}
