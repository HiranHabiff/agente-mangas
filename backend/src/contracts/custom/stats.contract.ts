import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

// Schemas
export const MangaStatsSchema = z.object({
  total: z.number().int(),
  by_status: z.object({
    reading: z.number().int(),
    completed: z.number().int(),
    plan_to_read: z.number().int(),
    on_hold: z.number().int(),
    dropped: z.number().int(),
  }),
  with_covers: z.number().int(),
  without_covers: z.number().int(),
  average_rating: z.number().nullable(),
  total_chapters_read: z.number().int(),
});

export const TagStatsSchema = z.object({
  tag_id: z.string().uuid(),
  tag_name: z.string(),
  tag_type: z.string(),
  manga_count: z.number().int(),
  percentage: z.number(),
});

export const ReadingStatsSchema = z.object({
  total_sessions: z.number().int(),
  total_chapters_read: z.number().int(),
  total_duration_minutes: z.number().int(),
  average_duration_per_session: z.number(),
  sessions_last_7_days: z.number().int(),
  sessions_last_30_days: z.number().int(),
  chapters_last_7_days: z.number().int(),
  chapters_last_30_days: z.number().int(),
});

export const MonthlyReadingSchema = z.object({
  month: z.string(), // YYYY-MM format
  sessions: z.number().int(),
  chapters: z.number().int(),
  duration_minutes: z.number().int(),
});

export const DashboardStatsSchema = z.object({
  manga_stats: MangaStatsSchema,
  reading_stats: ReadingStatsSchema,
  top_tags: z.array(TagStatsSchema),
  monthly_reading: z.array(MonthlyReadingSchema),
  recent_activity: z.array(z.object({
    type: z.enum(['session', 'manga_added', 'manga_updated', 'reminder']),
    description: z.string(),
    timestamp: z.date(),
    manga_id: z.string().uuid().nullable(),
  })),
});

export const CreatorStatsSchema = z.object({
  creator_id: z.string().uuid(),
  creator_name: z.string(),
  manga_count: z.number().int(),
  total_chapters_read: z.number().int(),
  average_rating: z.number().nullable(),
});

// Contract
export const statsContract = c.router({
  getDashboard: {
    method: 'GET',
    path: '/api/stats/dashboard',
    responses: {
      200: DashboardStatsSchema,
      500: z.object({ message: z.string() }),
    },
    summary: 'Get complete dashboard statistics',
  },

  getMangaStats: {
    method: 'GET',
    path: '/api/stats/mangas',
    responses: {
      200: MangaStatsSchema,
      500: z.object({ message: z.string() }),
    },
    summary: 'Get manga statistics',
  },

  getReadingStats: {
    method: 'GET',
    path: '/api/stats/reading',
    query: z.object({
      from_date: z.string().datetime().optional(),
      to_date: z.string().datetime().optional(),
    }),
    responses: {
      200: ReadingStatsSchema,
      400: z.object({ message: z.string() }),
      500: z.object({ message: z.string() }),
    },
    summary: 'Get reading statistics',
  },

  getTopTags: {
    method: 'GET',
    path: '/api/stats/tags/top',
    query: z.object({
      limit: z.number().int().min(1).max(50).default(10),
      type: z.enum(['genre', 'demographic', 'theme', 'format', 'custom']).optional(),
    }),
    responses: {
      200: z.array(TagStatsSchema),
      500: z.object({ message: z.string() }),
    },
    summary: 'Get top used tags',
  },

  getTopCreators: {
    method: 'GET',
    path: '/api/stats/creators/top',
    query: z.object({
      limit: z.number().int().min(1).max(50).default(10),
      sort_by: z.enum(['manga_count', 'chapters_read', 'average_rating']).default('manga_count'),
    }),
    responses: {
      200: z.array(CreatorStatsSchema),
      500: z.object({ message: z.string() }),
    },
    summary: 'Get top creators by manga count',
  },

  getMonthlyReading: {
    method: 'GET',
    path: '/api/stats/reading/monthly',
    query: z.object({
      months: z.number().int().min(1).max(24).default(12),
    }),
    responses: {
      200: z.array(MonthlyReadingSchema),
      500: z.object({ message: z.string() }),
    },
    summary: 'Get monthly reading statistics',
  },

  getCompletionRate: {
    method: 'GET',
    path: '/api/stats/completion-rate',
    responses: {
      200: z.object({
        total_mangas: z.number().int(),
        completed: z.number().int(),
        dropped: z.number().int(),
        completion_rate: z.number(),
        drop_rate: z.number(),
        average_chapters_before_drop: z.number().nullable(),
      }),
      500: z.object({ message: z.string() }),
    },
    summary: 'Get manga completion and drop rates',
  },

  getRatingDistribution: {
    method: 'GET',
    path: '/api/stats/ratings/distribution',
    responses: {
      200: z.object({
        distribution: z.array(z.object({
          rating: z.number(),
          count: z.number().int(),
          percentage: z.number(),
        })),
        average: z.number(),
        median: z.number(),
        total_rated: z.number().int(),
      }),
      500: z.object({ message: z.string() }),
    },
    summary: 'Get rating distribution statistics',
  },
});
