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
  declare id: string;

  @ForeignKey(() => Manga)
  @Index
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare manga_id: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare message: string;

  @Index
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare remind_at: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare is_sent: boolean;

  @BelongsTo(() => Manga)
  declare manga: Manga;
}
