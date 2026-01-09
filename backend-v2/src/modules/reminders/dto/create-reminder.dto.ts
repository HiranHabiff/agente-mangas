import { IsString, IsOptional, IsBoolean, IsInt, IsDateString, IsUUID } from 'class-validator';

export class CreateReminderDto {
  @IsUUID()
  mangaId: string;

  @IsOptional()
  @IsString()
  reminderType?: string = 'update';

  @IsOptional()
  @IsString()
  message?: string;

  @IsDateString()
  scheduledFor: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean = false;

  @IsOptional()
  @IsInt()
  recurrenceDays?: number;
}
