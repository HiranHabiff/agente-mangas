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
  CreatedAt,
} from 'sequelize-typescript';
import { Manga } from './manga.model';

@Table({
  tableName: 'reading_sessions',
  timestamps: true,
  updatedAt: false,
  underscored: true,
})
export class ReadingSession extends Model<ReadingSession> {
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

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare chapter_number: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare duration_minutes: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string;

  @Index
  @CreatedAt
  declare created_at: Date;

  @BelongsTo(() => Manga)
  declare manga: Manga;
}
