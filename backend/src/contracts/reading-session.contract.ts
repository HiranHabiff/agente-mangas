import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

// Schemas
export const ReadingSessionSchema = z.object({
  id: z.string().uuid(),
  manga_id: z.string().uuid(),
  chapter_number: z.number().int(),
  duration_minutes: z.number().int().nullable(),
  notes: z.string().nullable(),
  created_at: z.date(),
});

export const CreateReadingSessionSchema = z.object({
  manga_id: z.string().uuid(),
  chapter_number: z.number().int().min(0),
  duration_minutes: z.number().int().min(0).max(1440).nullable().optional(), // Max 24h
  notes: z.string().max(2000).nullable().optional(),
});

export const UpdateReadingSessionSchema = z.object({
  chapter_number: z.number().int().min(0).optional(),
  duration_minutes: z.number().int().min(0).max(1440).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const ReadingSessionFiltersSchema = z.object({
  manga_id: z.string().uuid().optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  min_chapter: z.number().int().optional(),
  max_chapter: z.number().int().optional(),
  sort_by: z.enum(['created_at', 'chapter_number']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export const ReadingSessionListResponseSchema = z.object({
  data: z.array(ReadingSessionSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});

export const SessionStatsSchema = z.object({
  total_sessions: z.number().int(),
  total_chapters_read: z.number().int(),
  total_duration_minutes: z.number().int(),
  average_duration_minutes: z.number(),
  sessions_by_manga: z.array(z.object({
    manga_id: z.string().uuid(),
    manga_title: z.string(),
    sessions_count: z.number().int(),
    chapters_read: z.number().int(),
  })),
});

// Contract
export const readingSessionContract = c.router({
  getAll: {
    method: 'GET',
    path: '/api/reading-sessions',
    query: ReadingSessionFiltersSchema,
    responses: {
      200: ReadingSessionListResponseSchema,
    },
    summary: 'Get all reading sessions with filters',
  },

  getById: {
    method: 'GET',
    path: '/api/reading-sessions/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      200: ReadingSessionSchema,
      404: z.object({ message: z.string() }),
    },
    summary: 'Get reading session by ID',
  },

  getByMangaId: {
    method: 'GET',
    path: '/api/mangas/:mangaId/reading-sessions',
    pathParams: z.object({
      mangaId: z.string().uuid(),
    }),
    query: z.object({
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
    }),
    responses: {
      200: ReadingSessionListResponseSchema,
      404: z.object({ message: z.string() }),
    },
    summary: 'Get all reading sessions for a manga',
  },

  create: {
    method: 'POST',
    path: '/api/reading-sessions',
    body: CreateReadingSessionSchema,
    responses: {
      201: ReadingSessionSchema,
      400: z.object({ message: z.string(), errors: z.any().optional() }),
      404: z.object({ message: z.string() }),
    },
    summary: 'Record a new reading session',
  },

  update: {
    method: 'PUT',
    path: '/api/reading-sessions/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    body: UpdateReadingSessionSchema,
    responses: {
      200: ReadingSessionSchema,
      404: z.object({ message: z.string() }),
      400: z.object({ message: z.string(), errors: z.any().optional() }),
    },
    summary: 'Update reading session',
  },

  delete: {
    method: 'DELETE',
    path: '/api/reading-sessions/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      204: z.void(),
      404: z.object({ message: z.string() }),
    },
    summary: 'Delete reading session',
  },

  getStats: {
    method: 'GET',
    path: '/api/reading-sessions/stats',
    query: z.object({
      from_date: z.string().datetime().optional(),
      to_date: z.string().datetime().optional(),
    }),
    responses: {
      200: SessionStatsSchema,
    },
    summary: 'Get reading statistics',
  },
});
