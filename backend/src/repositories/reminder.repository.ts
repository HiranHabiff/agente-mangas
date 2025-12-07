import { query } from '../config/database.js';
import type { Reminder, CreateReminderInput } from '../models/manga.model.js';
import { logger } from '../utils/logger.js';

// ============================================
// REMINDER REPOSITORY
// ============================================

export class ReminderRepository {
  // Create a new reminder
  async create(input: CreateReminderInput): Promise<Reminder> {
    const result = await query<Reminder>(
      `INSERT INTO reminders (
        manga_id, reminder_type, message, scheduled_for, is_recurring, recurrence_days
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        input.manga_id,
        input.reminder_type || 'update',
        input.message || null,
        input.scheduled_for || null,
        input.is_recurring || false,
        input.recurrence_days || null,
      ]
    );

    logger.info('Reminder created', { reminderId: result.rows[0].id });
    return result.rows[0];
  }

  // Find reminder by ID
  async findById(id: string): Promise<Reminder | null> {
    const result = await query<Reminder>(
      'SELECT * FROM reminders WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  // Get all reminders for a manga
  async findByMangaId(mangaId: string): Promise<Reminder[]> {
    const result = await query<Reminder>(
      `SELECT * FROM reminders
       WHERE manga_id = $1
       ORDER BY scheduled_for ASC NULLS LAST, created_at DESC`,
      [mangaId]
    );
    return result.rows;
  }

  // Get active reminders
  async findActive(): Promise<Reminder[]> {
    const result = await query<Reminder>(
      `SELECT * FROM reminders
       WHERE is_active = true
       ORDER BY scheduled_for ASC NULLS LAST`
    );
    return result.rows;
  }

  // Get reminders due before a certain date
  async findDueBefore(date: Date): Promise<Reminder[]> {
    const result = await query<Reminder>(
      `SELECT * FROM reminders
       WHERE is_active = true
         AND scheduled_for IS NOT NULL
         AND scheduled_for <= $1
       ORDER BY scheduled_for ASC`,
      [date]
    );
    return result.rows;
  }

  // Update reminder
  async update(id: string, updates: Partial<Reminder>): Promise<Reminder> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.reminder_type !== undefined) {
      fields.push(`reminder_type = $${paramIndex++}`);
      values.push(updates.reminder_type);
    }
    if (updates.message !== undefined) {
      fields.push(`message = $${paramIndex++}`);
      values.push(updates.message);
    }
    if (updates.scheduled_for !== undefined) {
      fields.push(`scheduled_for = $${paramIndex++}`);
      values.push(updates.scheduled_for);
    }
    if (updates.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(updates.is_active);
    }
    if (updates.is_recurring !== undefined) {
      fields.push(`is_recurring = $${paramIndex++}`);
      values.push(updates.is_recurring);
    }
    if (updates.recurrence_days !== undefined) {
      fields.push(`recurrence_days = $${paramIndex++}`);
      values.push(updates.recurrence_days);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const result = await query<Reminder>(
      `UPDATE reminders SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Reminder not found');
    }

    logger.info('Reminder updated', { reminderId: id });
    return result.rows[0];
  }

  // Mark reminder as triggered
  async markTriggered(id: string): Promise<void> {
    await query(
      'UPDATE reminders SET last_triggered_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
    logger.info('Reminder marked as triggered', { reminderId: id });
  }

  // Deactivate reminder
  async deactivate(id: string): Promise<void> {
    await query(
      'UPDATE reminders SET is_active = false WHERE id = $1',
      [id]
    );
    logger.info('Reminder deactivated', { reminderId: id });
  }

  // Delete reminder
  async delete(id: string): Promise<void> {
    await query('DELETE FROM reminders WHERE id = $1', [id]);
    logger.info('Reminder deleted', { reminderId: id });
  }
}

export const reminderRepository = new ReminderRepository();
