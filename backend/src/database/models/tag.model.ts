import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  BelongsToMany,
  Index,
  Unique,
} from 'sequelize-typescript';
import { Manga } from './manga.model';
import { MangaTag } from './manga-tag.model';

export type TagType = 'genre' | 'demographic' | 'theme' | 'format' | 'custom';

@Table({
  tableName: 'tags',
  timestamps: true,
  underscored: true,
})
export class Tag extends Model<Tag> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Unique
  @Index
  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.ENUM('genre', 'demographic', 'theme', 'format', 'custom'),
    defaultValue: 'custom',
  })
  type: TagType;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  description: string;

  @Column({
    type: DataType.STRING(7),
    allowNull: true,
  })
  color: string;

  @BelongsToMany(() => Manga, () => MangaTag)
  mangas: Manga[];
}
