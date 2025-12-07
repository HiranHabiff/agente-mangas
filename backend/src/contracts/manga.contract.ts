import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

// Schemas
export const MangaSchema = z.object({
  id: z.string().uuid(),
  primary_title: z.string(),
  status: z.enum(['reading', 'completed', 'plan_to_read', 'on_hold', 'dropped']),
  last_chapter_read: z.number().int().min(0),
  rating: z.number().min(0).max(10).nullable(),
  synopsis: z.string().nullable(),
  image_filename: z.string().nullable(),
  image_url: z.string().url().nullable(),
  source_url: z.string().url().nullable(),
  legacy_id: z.number().int().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
  deleted_at: z.date().nullable(),
});

export const CreateMangaSchema = z.object({
  primary_title: z.string().min(1, 'Title is required').max(750),
  status: z.enum(['reading', 'completed', 'plan_to_read', 'on_hold', 'dropped']).default('plan_to_read'),
  last_chapter_read: z.number().int().min(0).default(0),
  rating: z.number().min(0).max(10).nullable().optional(),
  synopsis: z.string().max(10000).nullable().optional(),
  image_filename: z.string().max(500).nullable().optional(),
  image_url: z.string().url().max(1000).nullable().optional(),
  source_url: z.string().url().max(1000).nullable().optional(),
});

export const UpdateMangaSchema = CreateMangaSchema.partial();

export const MangaFiltersSchema = z.object({
  query: z.string().optional(),
  status: z.array(z.enum(['reading', 'completed', 'plan_to_read', 'on_hold', 'dropped'])).optional(),
  min_rating: z.number().min(0).max(10).optional(),
  max_rating: z.number().min(0).max(10).optional(),
  with_covers: z.boolean().optional(),
  tags: z.array(z.string().uuid()).optional(),
  creators: z.array(z.string().uuid()).optional(),
  sort_by: z.enum(['primary_title', 'rating', 'last_chapter_read', 'created_at', 'updated_at']).optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export const MangaListResponseSchema = z.object({
  data: z.array(MangaSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});

// Contract
export const mangaContract = c.router({
  getAll: {
    method: 'GET',
    path: '/api/mangas',
    query: MangaFiltersSchema,
    responses: {
      200: MangaListResponseSchema,
    },
    summary: 'Get all mangas with filters',
  },

  getById: {
    method: 'GET',
    path: '/api/mangas/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      200: MangaSchema,
      404: z.object({ message: z.string() }),
    },
    summary: 'Get manga by ID',
  },

  create: {
    method: 'POST',
    path: '/api/mangas',
    body: CreateMangaSchema,
    responses: {
      201: MangaSchema,
      400: z.object({ message: z.string(), errors: z.any().optional() }),
    },
    summary: 'Create a new manga',
  },

  update: {
    method: 'PUT',
    path: '/api/mangas/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    body: UpdateMangaSchema,
    responses: {
      200: MangaSchema,
      404: z.object({ message: z.string() }),
      400: z.object({ message: z.string(), errors: z.any().optional() }),
    },
    summary: 'Update manga',
  },

  delete: {
    method: 'DELETE',
    path: '/api/mangas/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      204: z.void(),
      404: z.object({ message: z.string() }),
    },
    summary: 'Delete manga (soft delete)',
  },

  restore: {
    method: 'POST',
    path: '/api/mangas/:id/restore',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      200: MangaSchema,
      404: z.object({ message: z.string() }),
    },
    summary: 'Restore soft-deleted manga',
  },
});
