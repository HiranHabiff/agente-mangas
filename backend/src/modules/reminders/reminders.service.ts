import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReminderDto, UpdateReminderDto } from './dto';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(private prisma: PrismaService) {}

  async findAll() {
    const reminders = await this.prisma.reminders.findMany({
      where: { is_active: true },
      include: {
        mangas: {
          select: {
            id: true,
            primary_title: true,
            image_url: true,
            image_filename: true,
            last_chapter_read: true,
            total_chapters: true,
          },
        },
      },
      orderBy: { scheduled_for: 'asc' },
    });

    return reminders.map((r) => this.transformReminder(r));
  }

  async findByManga(mangaId: string) {
    const reminders = await this.prisma.reminders.findMany({
      where: { manga_id: mangaId },
      orderBy: { scheduled_for: 'asc' },
    });

    return reminders.map((r) => this.transformReminder(r));
  }

  async findOne(id: string) {
    const reminder = await this.prisma.reminders.findUnique({
      where: { id },
      include: {
        mangas: {
          select: {
            id: true,
            primary_title: true,
            image_url: true,
            image_filename: true,
          },
        },
      },
    });

    if (!reminder) {
      throw new NotFoundException(`Reminder with ID ${id} not found`);
    }

    return this.transformReminder(reminder);
  }

  async create(dto: CreateReminderDto) {
    const reminder = await this.prisma.reminders.create({
      data: {
        manga_id: dto.mangaId,
        reminder_type: dto.reminderType || 'update',
        message: dto.message,
        scheduled_for: new Date(dto.scheduledFor),
        is_recurring: dto.isRecurring || false,
        recurrence_days: dto.recurrenceDays,
        is_active: true,
      },
      include: {
        mangas: {
          select: {
            id: true,
            primary_title: true,
          },
        },
      },
    });

    return this.transformReminder(reminder);
  }

  async update(id: string, dto: UpdateReminderDto) {
    await this.findOne(id);

    const reminder = await this.prisma.reminders.update({
      where: { id },
      data: {
        ...(dto.reminderType && { reminder_type: dto.reminderType }),
        ...(dto.message !== undefined && { message: dto.message }),
        ...(dto.scheduledFor && { scheduled_for: new Date(dto.scheduledFor) }),
        ...(dto.isRecurring !== undefined && { is_recurring: dto.isRecurring }),
        ...(dto.recurrenceDays !== undefined && { recurrence_days: dto.recurrenceDays }),
        ...(dto.isActive !== undefined && { is_active: dto.isActive }),
        updated_at: new Date(),
      },
      include: {
        mangas: {
          select: {
            id: true,
            primary_title: true,
          },
        },
      },
    });

    return this.transformReminder(reminder);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.reminders.delete({ where: { id } });
  }

  async getTriggeredReminders() {
    const now = new Date();

    const reminders = await this.prisma.reminders.findMany({
      where: {
        is_active: true,
        scheduled_for: { lte: now },
        OR: [
          { last_triggered_at: null },
          { last_triggered_at: { lt: now } },
        ],
      },
      include: {
        mangas: {
          select: {
            id: true,
            primary_title: true,
            image_url: true,
            image_filename: true,
            last_chapter_read: true,
            total_chapters: true,
          },
        },
      },
    });

    return reminders.map((r) => this.transformReminder(r));
  }

  async dismissReminder(id: string) {
    const reminder = await this.prisma.reminders.findUnique({
      where: { id },
    });

    if (!reminder) {
      throw new NotFoundException(`Reminder with ID ${id} not found`);
    }

    if (reminder.is_recurring && reminder.recurrence_days) {
      // Se é recorrente, atualiza para próxima data
      const nextDate = new Date(reminder.scheduled_for!);
      nextDate.setDate(nextDate.getDate() + reminder.recurrence_days);

      await this.prisma.reminders.update({
        where: { id },
        data: {
          scheduled_for: nextDate,
          last_triggered_at: new Date(),
          updated_at: new Date(),
        },
      });
    } else {
      // Se não é recorrente, desativa
      await this.prisma.reminders.update({
        where: { id },
        data: {
          is_active: false,
          last_triggered_at: new Date(),
          updated_at: new Date(),
        },
      });
    }

    return { success: true };
  }

  // Cron job que roda a cada minuto para verificar reminders
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    const triggeredReminders = await this.getTriggeredReminders();

    if (triggeredReminders.length > 0) {
      this.logger.log(`Found ${triggeredReminders.length} triggered reminders`);
      // Os reminders são retornados via API, não enviamos notificações push
      // O frontend faz polling ou usa a API para verificar
    }
  }

  private transformReminder(reminder: any) {
    return {
      id: reminder.id,
      mangaId: reminder.manga_id,
      reminderType: reminder.reminder_type,
      message: reminder.message,
      scheduledFor: reminder.scheduled_for?.toISOString(),
      isActive: reminder.is_active,
      isRecurring: reminder.is_recurring,
      recurrenceDays: reminder.recurrence_days,
      lastTriggeredAt: reminder.last_triggered_at?.toISOString(),
      createdAt: reminder.created_at?.toISOString(),
      updatedAt: reminder.updated_at?.toISOString(),
      ...(reminder.mangas && {
        manga: {
          id: reminder.mangas.id,
          primaryTitle: reminder.mangas.primary_title,
          imageUrl: reminder.mangas.image_url,
          imageFilename: reminder.mangas.image_filename,
          lastChapterRead: reminder.mangas.last_chapter_read,
          totalChapters: reminder.mangas.total_chapters,
        },
      }),
    };
  }
}
