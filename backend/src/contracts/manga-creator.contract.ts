import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

// Schemas
export const MangaCreatorSchema = z.object({
  manga_id: z.string().uuid(),
  creator_id: z.string().uuid(),
  role: z.enum(['author', 'artist', 'both']),
  created_at: z.date(),
});

export const AddCreatorToMangaSchema = z.object({
  creator_id: z.string().uuid(),
  role: z.enum(['author', 'artist', 'both']).default('author'),
});

export const UpdateMangaCreatorRoleSchema = z.object({
  role: z.enum(['author', 'artist', 'both']),
});

export const AddMultipleCreatorsSchema = z.object({
  creators: z.array(z.object({
    creator_id: z.string().uuid(),
    role: z.enum(['author', 'artist', 'both']).default('author'),
  })).min(1),
});

// Contract
export const mangaCreatorContract = c.router({
  getCreatorsByManga: {
    method: 'GET',
    path: '/api/mangas/:mangaId/creators',
    pathParams: z.object({
      mangaId: z.string().uuid(),
    }),
    responses: {
      200: z.array(MangaCreatorSchema),
      404: z.object({ message: z.string() }),
    },
    summary: 'Get all creators for a manga',
  },

  addCreatorToManga: {
    method: 'POST',
    path: '/api/mangas/:mangaId/creators',
    pathParams: z.object({
      mangaId: z.string().uuid(),
    }),
    body: AddCreatorToMangaSchema,
    responses: {
      201: MangaCreatorSchema,
      400: z.object({ message: z.string() }),
      404: z.object({ message: z.string() }),
      409: z.object({ message: z.string() }), // Creator already assigned
    },
    summary: 'Add creator to manga',
  },

  addMultipleCreators: {
    method: 'POST',
    path: '/api/mangas/:mangaId/creators/bulk',
    pathParams: z.object({
      mangaId: z.string().uuid(),
    }),
    body: AddMultipleCreatorsSchema,
    responses: {
      201: z.object({
        added: z.number().int(),
        creators: z.array(MangaCreatorSchema),
      }),
      400: z.object({ message: z.string() }),
      404: z.object({ message: z.string() }),
    },
    summary: 'Add multiple creators to manga',
  },

  updateCreatorRole: {
    method: 'PUT',
    path: '/api/mangas/:mangaId/creators/:creatorId',
    pathParams: z.object({
      mangaId: z.string().uuid(),
      creatorId: z.string().uuid(),
    }),
    body: UpdateMangaCreatorRoleSchema,
    responses: {
      200: MangaCreatorSchema,
      404: z.object({ message: z.string() }),
      400: z.object({ message: z.string() }),
    },
    summary: 'Update creator role for manga',
  },

  removeCreatorFromManga: {
    method: 'DELETE',
    path: '/api/mangas/:mangaId/creators/:creatorId',
    pathParams: z.object({
      mangaId: z.string().uuid(),
      creatorId: z.string().uuid(),
    }),
    responses: {
      204: z.void(),
      404: z.object({ message: z.string() }),
    },
    summary: 'Remove creator from manga',
  },
});
