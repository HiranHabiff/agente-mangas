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
import { MangaCreator } from './manga-creator.model';

@Table({
  tableName: 'creators',
  timestamps: true,
  underscored: true,
})
export class Creator extends Model<Creator> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Unique
  @Index
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare biography: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  declare image_url: string;

  @BelongsToMany(() => Manga, () => MangaCreator)
  declare mangas: Manga[];
}
