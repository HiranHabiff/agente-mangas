import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

// Schemas
export const TagSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(['genre', 'demographic', 'theme', 'format', 'custom']),
  description: z.string().nullable(),
  color: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreateTagSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['genre', 'demographic', 'theme', 'format', 'custom']).default('custom'),
  description: z.string().max(500).nullable().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).nullable().optional(), // Hex color
});

export const UpdateTagSchema = CreateTagSchema.partial();

export const TagFiltersSchema = z.object({
  type: z.enum(['genre', 'demographic', 'theme', 'format', 'custom']).optional(),
  query: z.string().optional(),
  sort_by: z.enum(['name', 'type', 'created_at']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

export const TagListResponseSchema = z.object({
  data: z.array(TagSchema),
  total: z.number().int(),
});

// Contract
export const tagContract = c.router({
  getAll: {
    method: 'GET',
    path: '/api/tags',
    query: TagFiltersSchema,
    responses: {
      200: TagListResponseSchema,
    },
    summary: 'Get all tags with filters',
  },

  getById: {
    method: 'GET',
    path: '/api/tags/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      200: TagSchema,
      404: z.object({ message: z.string() }),
    },
    summary: 'Get tag by ID',
  },

  create: {
    method: 'POST',
    path: '/api/tags',
    body: CreateTagSchema,
    responses: {
      201: TagSchema,
      400: z.object({ message: z.string(), errors: z.any().optional() }),
      409: z.object({ message: z.string() }), // Tag name already exists
    },
    summary: 'Create a new tag',
  },

  update: {
    method: 'PUT',
    path: '/api/tags/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    body: UpdateTagSchema,
    responses: {
      200: TagSchema,
      404: z.object({ message: z.string() }),
      400: z.object({ message: z.string(), errors: z.any().optional() }),
      409: z.object({ message: z.string() }),
    },
    summary: 'Update tag',
  },

  delete: {
    method: 'DELETE',
    path: '/api/tags/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      204: z.void(),
      404: z.object({ message: z.string() }),
    },
    summary: 'Delete tag',
  },

  getByType: {
    method: 'GET',
    path: '/api/tags/type/:type',
    pathParams: z.object({
      type: z.enum(['genre', 'demographic', 'theme', 'format', 'custom']),
    }),
    responses: {
      200: z.array(TagSchema),
    },
    summary: 'Get tags by type',
  },
});
