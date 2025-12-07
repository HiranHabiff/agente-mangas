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
  declare id: string;

  @ForeignKey(() => Manga)
  @Index
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare manga_id: string;

  @Index
  @Column({
    type: DataType.STRING(750),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(10),
    allowNull: true,
  })
  declare language: string;

  @BelongsTo(() => Manga)
  declare manga: Manga;
}
