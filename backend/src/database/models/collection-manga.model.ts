import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  CreatedAt,
  Index,
} from 'sequelize-typescript';
import { Collection } from './collection.model';
import { Manga } from './manga.model';

@Table({
  tableName: 'collection_mangas',
  timestamps: true,
  updatedAt: false,
  underscored: true,
})
export class CollectionManga extends Model<CollectionManga> {
  @ForeignKey(() => Collection)
  @Index
  @Column({
    type: DataType.UUID,
    primaryKey: true,
  })
  collection_id: string;

  @ForeignKey(() => Manga)
  @Index
  @Column({
    type: DataType.UUID,
    primaryKey: true,
  })
  manga_id: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  position: number;

  @CreatedAt
  created_at: Date;
}
