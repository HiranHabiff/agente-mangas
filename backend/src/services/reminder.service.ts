import { reminderRepository } from '../repositories/reminder.repository.js';
import { mangaRepository } from '../repositories/manga.repository.js';
import type { Reminder, CreateReminderInput } from '../models/manga.model.js';
import { logger } from '../utils/logger.js';

// ============================================
// REMINDER SERVICE
// ============================================

export class ReminderService {
  // Create a new reminder
  async createReminder(input: CreateReminderInput): Promise<Reminder> {
    logger.info('Creating reminder', { mangaId: input.manga_id });

    // Validate manga exists
    const manga = await mangaRepository.findById(input.manga_id);
    if (!manga) {
      throw new Error('Manga not found');
    }

    // Validate scheduled_for is in the future if provided
    if (input.scheduled_for && input.scheduled_for < new Date()) {
      throw new Error('Scheduled time must be in the future');
    }

    return await reminderRepository.create(input);
  }

  // Get reminder by ID
  async getReminderById(id: string): Promise<Reminder | null> {
    return await reminderRepository.findById(id);
  }

  // Get all reminders for a manga
  async getRemindersByMangaId(mangaId: string): Promise<Reminder[]> {
    return await reminderRepository.findByMangaId(mangaId);
  }

  // Get all active reminders
  async getActiveReminders(): Promise<Reminder[]> {
    return await reminderRepository.findActive();
  }

  // Get reminders that are due
  async getDueReminders(): Promise<Reminder[]> {
    return await reminderRepository.findDueBefore(new Date());
  }

  // Update reminder
  async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder> {
    const existing = await reminderRepository.findById(id);
    if (!existing) {
      throw new Error('Reminder not found');
    }

    // Validate scheduled_for if being updated
    if (updates.scheduled_for && updates.scheduled_for < new Date()) {
      throw new Error('Scheduled time must be in the future');
    }

    return await reminderRepository.update(id, updates);
  }

  // Process a reminder (mark as triggered)
  async processReminder(id: string): Promise<void> {
    const reminder = await reminderRepository.findById(id);
    if (!reminder) {
      throw new Error('Reminder not found');
    }

    await reminderRepository.markTriggered(id);

    // If recurring, schedule next occurrence
    if (reminder.is_recurring && reminder.recurrence_days) {
      const nextSchedule = new Date();
      nextSchedule.setDate(nextSchedule.getDate() + reminder.recurrence_days);

      await reminderRepository.update(id, {
        scheduled_for: nextSchedule,
      });

      logger.info('Recurring reminder rescheduled', {
        reminderId: id,
        nextSchedule,
      });
    } else {
      // Deactivate one-time reminder
      await reminderRepository.deactivate(id);
      logger.info('One-time reminder deactivated', { reminderId: id });
    }
  }

  // Deactivate reminder
  async deactivateReminder(id: string): Promise<void> {
    const existing = await reminderRepository.findById(id);
    if (!existing) {
      throw new Error('Reminder not found');
    }

    await reminderRepository.deactivate(id);
  }

  // Delete reminder
  async deleteReminder(id: string): Promise<void> {
    const existing = await reminderRepository.findById(id);
    if (!existing) {
      throw new Error('Reminder not found');
    }

    await reminderRepository.delete(id);
  }

  // Check and process due reminders (cron job)
  async checkDueReminders(): Promise<{ processed: number; errors: number }> {
    logger.info('Checking for due reminders');

    const dueReminders = await this.getDueReminders();
    let processed = 0;
    let errors = 0;

    for (const reminder of dueReminders) {
      try {
        await this.processReminder(reminder.id);
        processed++;

        // Here you could trigger actual notification
        // e.g., send email, push notification, etc.
        await this.sendNotification(reminder);
      } catch (error) {
        errors++;
        logger.error('Error processing reminder', {
          reminderId: reminder.id,
          error,
        });
      }
    }

    logger.info('Due reminders processed', { processed, errors });
    return { processed, errors };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async sendNotification(reminder: Reminder): Promise<void> {
    // TODO: Implement actual notification system
    // For now, just log
    const manga = await mangaRepository.findById(reminder.manga_id);

    logger.info('Reminder notification', {
      reminderId: reminder.id,
      mangaTitle: manga?.primary_title,
      message: reminder.message || `Time to check for updates on ${manga?.primary_title}`,
    });

    // Future implementations could:
    // - Send email
    // - Push notification
    // - Webhook
    // - Discord/Telegram bot message
  }
}

export const reminderService = new ReminderService();
