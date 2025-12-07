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
  tableName: 'reminders',
  timestamps: true,
  underscored: true,
})
export class Reminder extends Model<Reminder> {
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
    type: DataType.STRING(255),
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  message: string;

  @Index
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  remind_at: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_sent: boolean;

  @BelongsTo(() => Manga)
  manga: Manga;
}
