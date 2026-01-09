import { PartialType } from '@nestjs/mapped-types';
import { CreateReminderDto } from './create-reminder.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateReminderDto extends PartialType(CreateReminderDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
