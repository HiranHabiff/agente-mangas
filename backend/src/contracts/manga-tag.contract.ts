import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

// Schemas
export const MangaTagSchema = z.object({
  manga_id: z.string().uuid(),
  tag_id: z.string().uuid(),
  created_at: z.date(),
});

export const AddTagToMangaSchema = z.object({
  tag_id: z.string().uuid(),
});

export const AddMultipleTagsSchema = z.object({
  tag_ids: z.array(z.string().uuid()).min(1),
});

// Contract
export const mangaTagContract = c.router({
  getTagsByManga: {
    method: 'GET',
    path: '/api/mangas/:mangaId/tags',
    pathParams: z.object({
      mangaId: z.string().uuid(),
    }),
    responses: {
      200: z.array(MangaTagSchema),
      404: z.object({ message: z.string() }),
    },
    summary: 'Get all tags for a manga',
  },

  addTagToManga: {
    method: 'POST',
    path: '/api/mangas/:mangaId/tags',
    pathParams: z.object({
      mangaId: z.string().uuid(),
    }),
    body: AddTagToMangaSchema,
    responses: {
      201: MangaTagSchema,
      400: z.object({ message: z.string() }),
      404: z.object({ message: z.string() }),
      409: z.object({ message: z.string() }), // Tag already assigned
    },
    summary: 'Add tag to manga',
  },

  addMultipleTags: {
    method: 'POST',
    path: '/api/mangas/:mangaId/tags/bulk',
    pathParams: z.object({
      mangaId: z.string().uuid(),
    }),
    body: AddMultipleTagsSchema,
    responses: {
      201: z.object({
        added: z.number().int(),
        tags: z.array(MangaTagSchema),
      }),
      400: z.object({ message: z.string() }),
      404: z.object({ message: z.string() }),
    },
    summary: 'Add multiple tags to manga',
  },

  removeTagFromManga: {
    method: 'DELETE',
    path: '/api/mangas/:mangaId/tags/:tagId',
    pathParams: z.object({
      mangaId: z.string().uuid(),
      tagId: z.string().uuid(),
    }),
    responses: {
      204: z.void(),
      404: z.object({ message: z.string() }),
    },
    summary: 'Remove tag from manga',
  },
});
