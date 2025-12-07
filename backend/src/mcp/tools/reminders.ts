import { reminderService } from '../../services/reminder.service.js';
import type { CreateReminderInput } from '../../models/manga.model.js';
import { logger } from '../../utils/logger.js';

// ============================================
// REMINDER TOOLS
// ============================================

export const reminderTools = {
  async set_reminder(input: CreateReminderInput) {
    try {
      const reminder = await reminderService.createReminder(input);

      const scheduleText = reminder.scheduled_for
        ? `\nScheduled for: ${new Date(reminder.scheduled_for).toLocaleString()}`
        : '';

      const recurringText = reminder.is_recurring
        ? `\nRecurs every ${reminder.recurrence_days} days`
        : '';

      return {
        content: [
          {
            type: 'text',
            text: `✓ Reminder created!\n\nType: ${reminder.reminder_type}${scheduleText}${recurringText}\nMessage: ${reminder.message || 'Default reminder'}`,
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error('MCP set_reminder error', { error });
      return {
        content: [
          {
            type: 'text',
            text: `✗ Error creating reminder: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },

  async list_reminders(input: { manga_id?: string }) {
    try {
      const reminders = input.manga_id
        ? await reminderService.getRemindersByMangaId(input.manga_id)
        : await reminderService.getActiveReminders();

      if (reminders.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No active reminders found.',
            },
          ],
          isError: false,
        };
      }

      const reminderList = reminders
        .map((reminder, index) => {
          const scheduleText = reminder.scheduled_for
            ? `  Scheduled: ${new Date(reminder.scheduled_for).toLocaleString()}`
            : '  Scheduled: Not set';

          const recurringText = reminder.is_recurring
            ? `\n  Recurring: Every ${reminder.recurrence_days} days`
            : '';

          const message = reminder.message
            ? `\n  Message: ${reminder.message}`
            : '';

          return `${index + 1}. ${reminder.reminder_type} reminder
  ID: ${reminder.id}
${scheduleText}${recurringText}${message}`;
        })
        .join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `⏰ Active Reminders (${reminders.length}):\n\n${reminderList}`,
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error('MCP list_reminders error', { error });
      return {
        content: [
          {
            type: 'text',
            text: `✗ Error listing reminders: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },

  async delete_reminder(input: { reminder_id: string }) {
    try {
      await reminderService.deleteReminder(input.reminder_id);

      return {
        content: [
          {
            type: 'text',
            text: '✓ Reminder deleted successfully',
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error('MCP delete_reminder error', { error });
      return {
        content: [
          {
            type: 'text',
            text: `✗ Error deleting reminder: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
};
