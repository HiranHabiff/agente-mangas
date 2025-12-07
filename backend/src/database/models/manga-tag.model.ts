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
import { Tag } from './tag.model';

@Table({
  tableName: 'manga_tags',
  timestamps: true,
  updatedAt: false,
  underscored: true,
})
export class MangaTag extends Model<MangaTag> {
  @ForeignKey(() => Manga)
  @Index
  @Column({
    type: DataType.UUID,
    primaryKey: true,
  })
  declare manga_id: string;

  @ForeignKey(() => Tag)
  @Index
  @Column({
    type: DataType.UUID,
    primaryKey: true,
  })
  declare tag_id: string;

  @CreatedAt
  declare created_at: Date;
}
