import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

// Schemas
export const ReminderSchema = z.object({
  id: z.string().uuid(),
  manga_id: z.string().uuid(),
  title: z.string(),
  message: z.string().nullable(),
  remind_at: z.date(),
  is_sent: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreateReminderSchema = z.object({
  manga_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  message: z.string().max(1000).nullable().optional(),
  remind_at: z.string().datetime(), // ISO 8601 format
});

export const UpdateReminderSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  message: z.string().max(1000).nullable().optional(),
  remind_at: z.string().datetime().optional(),
  is_sent: z.boolean().optional(),
});

export const ReminderFiltersSchema = z.object({
  manga_id: z.string().uuid().optional(),
  is_sent: z.boolean().optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  sort_by: z.enum(['remind_at', 'created_at']).default('remind_at'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export const ReminderListResponseSchema = z.object({
  data: z.array(ReminderSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});

// Contract
export const reminderContract = c.router({
  getAll: {
    method: 'GET',
    path: '/api/reminders',
    query: ReminderFiltersSchema,
    responses: {
      200: ReminderListResponseSchema,
    },
    summary: 'Get all reminders with filters',
  },

  getById: {
    method: 'GET',
    path: '/api/reminders/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      200: ReminderSchema,
      404: z.object({ message: z.string() }),
    },
    summary: 'Get reminder by ID',
  },

  getByMangaId: {
    method: 'GET',
    path: '/api/mangas/:mangaId/reminders',
    pathParams: z.object({
      mangaId: z.string().uuid(),
    }),
    responses: {
      200: z.array(ReminderSchema),
      404: z.object({ message: z.string() }),
    },
    summary: 'Get all reminders for a manga',
  },

  create: {
    method: 'POST',
    path: '/api/reminders',
    body: CreateReminderSchema,
    responses: {
      201: ReminderSchema,
      400: z.object({ message: z.string(), errors: z.any().optional() }),
      404: z.object({ message: z.string() }),
    },
    summary: 'Create a new reminder',
  },

  update: {
    method: 'PUT',
    path: '/api/reminders/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    body: UpdateReminderSchema,
    responses: {
      200: ReminderSchema,
      404: z.object({ message: z.string() }),
      400: z.object({ message: z.string(), errors: z.any().optional() }),
    },
    summary: 'Update reminder',
  },

  markAsSent: {
    method: 'POST',
    path: '/api/reminders/:id/mark-sent',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      200: ReminderSchema,
      404: z.object({ message: z.string() }),
    },
    summary: 'Mark reminder as sent',
  },

  delete: {
    method: 'DELETE',
    path: '/api/reminders/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      204: z.void(),
      404: z.object({ message: z.string() }),
    },
    summary: 'Delete reminder',
  },

  getPending: {
    method: 'GET',
    path: '/api/reminders/pending',
    responses: {
      200: z.array(ReminderSchema),
    },
    summary: 'Get all pending (unsent) reminders',
  },
});
