import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

// Schemas
export const CollectionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  is_public: z.boolean(),
  color: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreateCollectionSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).nullable().optional(),
  is_public: z.boolean().default(false),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).nullable().optional(), // Hex color
});

export const UpdateCollectionSchema = CreateCollectionSchema.partial();

export const CollectionFiltersSchema = z.object({
  query: z.string().optional(),
  is_public: z.boolean().optional(),
  sort_by: z.enum(['name', 'created_at', 'updated_at']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export const CollectionListResponseSchema = z.object({
  data: z.array(CollectionSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});

export const CollectionWithMangasSchema = CollectionSchema.extend({
  manga_count: z.number().int(),
});

// Contract
export const collectionContract = c.router({
  getAll: {
    method: 'GET',
    path: '/api/collections',
    query: CollectionFiltersSchema,
    responses: {
      200: CollectionListResponseSchema,
    },
    summary: 'Get all collections with filters',
  },

  getById: {
    method: 'GET',
    path: '/api/collections/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      200: CollectionWithMangasSchema,
      404: z.object({ message: z.string() }),
    },
    summary: 'Get collection by ID with manga count',
  },

  create: {
    method: 'POST',
    path: '/api/collections',
    body: CreateCollectionSchema,
    responses: {
      201: CollectionSchema,
      400: z.object({ message: z.string(), errors: z.any().optional() }),
    },
    summary: 'Create a new collection',
  },

  update: {
    method: 'PUT',
    path: '/api/collections/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    body: UpdateCollectionSchema,
    responses: {
      200: CollectionSchema,
      404: z.object({ message: z.string() }),
      400: z.object({ message: z.string(), errors: z.any().optional() }),
    },
    summary: 'Update collection',
  },

  delete: {
    method: 'DELETE',
    path: '/api/collections/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      204: z.void(),
      404: z.object({ message: z.string() }),
    },
    summary: 'Delete collection',
  },

  getPublic: {
    method: 'GET',
    path: '/api/collections/public',
    query: z.object({
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
    }),
    responses: {
      200: CollectionListResponseSchema,
    },
    summary: 'Get all public collections',
  },
});
