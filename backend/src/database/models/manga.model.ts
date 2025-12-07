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
  declare id: string;

  @Index
  @Column({
    type: DataType.STRING(750),
    allowNull: false,
  })
  declare primary_title: string;

  @Index
  @Column({
    type: DataType.ENUM('reading', 'completed', 'plan_to_read', 'on_hold', 'dropped'),
    defaultValue: 'plan_to_read',
  })
  declare status: MangaStatus;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare last_chapter_read: number;

  @Column({
    type: DataType.DECIMAL(3, 1),
    allowNull: true,
  })
  declare rating: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare synopsis: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  declare image_filename: string;

  @Column({
    type: DataType.STRING(1000),
    allowNull: true,
  })
  declare image_url: string;

  @Column({
    type: DataType.STRING(1000),
    allowNull: true,
  })
  declare source_url: string;

  @Column({
    type: 'vector(768)',
    allowNull: true,
  })
  declare embedding: number[];

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    unique: true,
  })
  declare legacy_id: number;

  @Index
  @CreatedAt
  declare created_at: Date;

  @Index
  @UpdatedAt
  declare updated_at: Date;

  @DeletedAt
  declare deleted_at: Date;

  // Relationships
  @HasMany(() => MangaName)
  declare alternative_names: MangaName[];

  @BelongsToMany(() => Tag, () => MangaTag)
  declare tags: Tag[];

  @BelongsToMany(() => Creator, () => MangaCreator)
  declare creators: Creator[];

  @HasMany(() => Reminder)
  declare reminders: Reminder[];

  @HasMany(() => ReadingSession)
  declare reading_sessions: ReadingSession[];

  @BelongsToMany(() => Collection, () => CollectionManga)
  declare collections: Collection[];
}
