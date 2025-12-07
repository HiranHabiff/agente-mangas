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
  id: string;

  @ForeignKey(() => Manga)
  @Index
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  manga_id: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  chapter_number: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  duration_minutes: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes: string;

  @Index
  @CreatedAt
  created_at: Date;

  @BelongsTo(() => Manga)
  manga: Manga;
}
