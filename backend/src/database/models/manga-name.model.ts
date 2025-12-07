import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  Index,
} from 'sequelize-typescript';
import { Manga } from './manga.model';

@Table({
  tableName: 'manga_names',
  timestamps: false,
  underscored: true,
})
export class MangaName extends Model<MangaName> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => Manga)
  @Index
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  manga_id: string;

  @Index
  @Column({
    type: DataType.STRING(750),
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING(10),
    allowNull: true,
  })
  language: string;

  @BelongsTo(() => Manga)
  manga: Manga;
}
