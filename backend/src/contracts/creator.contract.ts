import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

// Schemas
export const CreatorSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  biography: z.string().nullable(),
  image_url: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreateCreatorSchema = z.object({
  name: z.string().min(1).max(255),
  biography: z.string().max(5000).nullable().optional(),
  image_url: z.string().url().max(500).nullable().optional(),
});

export const UpdateCreatorSchema = CreateCreatorSchema.partial();

export const CreatorFiltersSchema = z.object({
  query: z.string().optional(),
  sort_by: z.enum(['name', 'created_at']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export const CreatorListResponseSchema = z.object({
  data: z.array(CreatorSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});

// Contract
export const creatorContract = c.router({
  getAll: {
    method: 'GET',
    path: '/api/creators',
    query: CreatorFiltersSchema,
    responses: {
      200: CreatorListResponseSchema,
    },
    summary: 'Get all creators with filters',
  },

  getById: {
    method: 'GET',
    path: '/api/creators/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      200: CreatorSchema,
      404: z.object({ message: z.string() }),
    },
    summary: 'Get creator by ID',
  },

  create: {
    method: 'POST',
    path: '/api/creators',
    body: CreateCreatorSchema,
    responses: {
      201: CreatorSchema,
      400: z.object({ message: z.string(), errors: z.any().optional() }),
      409: z.object({ message: z.string() }), // Creator name already exists
    },
    summary: 'Create a new creator',
  },

  update: {
    method: 'PUT',
    path: '/api/creators/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    body: UpdateCreatorSchema,
    responses: {
      200: CreatorSchema,
      404: z.object({ message: z.string() }),
      400: z.object({ message: z.string(), errors: z.any().optional() }),
      409: z.object({ message: z.string() }),
    },
    summary: 'Update creator',
  },

  delete: {
    method: 'DELETE',
    path: '/api/creators/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      204: z.void(),
      404: z.object({ message: z.string() }),
    },
    summary: 'Delete creator',
  },
});
