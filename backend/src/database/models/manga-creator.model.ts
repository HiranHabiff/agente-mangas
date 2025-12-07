import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  CreatedAt,
  Index,
} from 'sequelize-typescript';
import { Manga } from './manga.model';
import { Creator } from './creator.model';

export type CreatorRole = 'author' | 'artist' | 'both';

@Table({
  tableName: 'manga_creators',
  timestamps: true,
  updatedAt: false,
  underscored: true,
})
export class MangaCreator extends Model<MangaCreator> {
  @ForeignKey(() => Manga)
  @Index
  @Column({
    type: DataType.UUID,
    primaryKey: true,
  })
  declare manga_id: string;

  @ForeignKey(() => Creator)
  @Index
  @Column({
    type: DataType.UUID,
    primaryKey: true,
  })
  declare creator_id: string;

  @Column({
    type: DataType.ENUM('author', 'artist', 'both'),
    defaultValue: 'author',
  })
  declare role: CreatorRole;

  @CreatedAt
  declare created_at: Date;
}
