import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  BelongsToMany,
  Index,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Manga } from './manga.model';
import { CollectionManga } from './collection-manga.model';

@Table({
  tableName: 'collections',
  timestamps: true,
  underscored: true,
})
export class Collection extends Model<Collection> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Index
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_public: boolean;

  @Column({
    type: DataType.STRING(7),
    allowNull: true,
  })
  color: string;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;

  @BelongsToMany(() => Manga, () => CollectionManga)
  mangas: Manga[];
}
