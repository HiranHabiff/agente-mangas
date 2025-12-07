import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

// Schemas
export const MangaNameSchema = z.object({
  id: z.string().uuid(),
  manga_id: z.string().uuid(),
  name: z.string(),
  language: z.string().nullable(),
});

export const CreateMangaNameSchema = z.object({
  manga_id: z.string().uuid(),
  name: z.string().min(1).max(750),
  language: z.string().length(2).nullable().optional(), // ISO 639-1 (en, pt, ja, etc)
});

export const UpdateMangaNameSchema = z.object({
  name: z.string().min(1).max(750).optional(),
  language: z.string().length(2).nullable().optional(),
});

// Contract
export const mangaNameContract = c.router({
  getByMangaId: {
    method: 'GET',
    path: '/api/mangas/:mangaId/names',
    pathParams: z.object({
      mangaId: z.string().uuid(),
    }),
    responses: {
      200: z.array(MangaNameSchema),
      404: z.object({ message: z.string() }),
    },
    summary: 'Get all alternative names for a manga',
  },

  create: {
    method: 'POST',
    path: '/api/manga-names',
    body: CreateMangaNameSchema,
    responses: {
      201: MangaNameSchema,
      400: z.object({ message: z.string(), errors: z.any().optional() }),
    },
    summary: 'Add alternative name to manga',
  },

  update: {
    method: 'PUT',
    path: '/api/manga-names/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    body: UpdateMangaNameSchema,
    responses: {
      200: MangaNameSchema,
      404: z.object({ message: z.string() }),
      400: z.object({ message: z.string(), errors: z.any().optional() }),
    },
    summary: 'Update alternative name',
  },

  delete: {
    method: 'DELETE',
    path: '/api/manga-names/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      204: z.void(),
      404: z.object({ message: z.string() }),
    },
    summary: 'Delete alternative name',
  },
});
