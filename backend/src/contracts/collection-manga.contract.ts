import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

// Schemas
export const CollectionMangaSchema = z.object({
  collection_id: z.string().uuid(),
  manga_id: z.string().uuid(),
  position: z.number().int().nullable(),
  created_at: z.date(),
});

export const AddMangaToCollectionSchema = z.object({
  manga_id: z.string().uuid(),
  position: z.number().int().min(0).nullable().optional(),
});

export const AddMultipleMangasSchema = z.object({
  manga_ids: z.array(z.string().uuid()).min(1),
});

export const UpdateMangaPositionSchema = z.object({
  position: z.number().int().min(0),
});

export const ReorderMangasSchema = z.object({
  manga_ids: z.array(z.string().uuid()).min(1),
});

// Contract
export const collectionMangaContract = c.router({
  getMangasByCollection: {
    method: 'GET',
    path: '/api/collections/:collectionId/mangas',
    pathParams: z.object({
      collectionId: z.string().uuid(),
    }),
    query: z.object({
      sort_by_position: z.boolean().default(true),
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
    }),
    responses: {
      200: z.object({
        data: z.array(CollectionMangaSchema),
        total: z.number().int(),
        limit: z.number().int(),
        offset: z.number().int(),
      }),
      404: z.object({ message: z.string() }),
    },
    summary: 'Get all mangas in a collection',
  },

  addMangaToCollection: {
    method: 'POST',
    path: '/api/collections/:collectionId/mangas',
    pathParams: z.object({
      collectionId: z.string().uuid(),
    }),
    body: AddMangaToCollectionSchema,
    responses: {
      201: CollectionMangaSchema,
      400: z.object({ message: z.string() }),
      404: z.object({ message: z.string() }),
      409: z.object({ message: z.string() }), // Manga already in collection
    },
    summary: 'Add manga to collection',
  },

  addMultipleMangas: {
    method: 'POST',
    path: '/api/collections/:collectionId/mangas/bulk',
    pathParams: z.object({
      collectionId: z.string().uuid(),
    }),
    body: AddMultipleMangasSchema,
    responses: {
      201: z.object({
        added: z.number().int(),
        mangas: z.array(CollectionMangaSchema),
      }),
      400: z.object({ message: z.string() }),
      404: z.object({ message: z.string() }),
    },
    summary: 'Add multiple mangas to collection',
  },

  updateMangaPosition: {
    method: 'PUT',
    path: '/api/collections/:collectionId/mangas/:mangaId/position',
    pathParams: z.object({
      collectionId: z.string().uuid(),
      mangaId: z.string().uuid(),
    }),
    body: UpdateMangaPositionSchema,
    responses: {
      200: CollectionMangaSchema,
      404: z.object({ message: z.string() }),
      400: z.object({ message: z.string() }),
    },
    summary: 'Update manga position in collection',
  },

  reorderMangas: {
    method: 'POST',
    path: '/api/collections/:collectionId/mangas/reorder',
    pathParams: z.object({
      collectionId: z.string().uuid(),
    }),
    body: ReorderMangasSchema,
    responses: {
      200: z.object({
        updated: z.number().int(),
        message: z.string(),
      }),
      404: z.object({ message: z.string() }),
      400: z.object({ message: z.string() }),
    },
    summary: 'Reorder all mangas in collection',
  },

  removeMangaFromCollection: {
    method: 'DELETE',
    path: '/api/collections/:collectionId/mangas/:mangaId',
    pathParams: z.object({
      collectionId: z.string().uuid(),
      mangaId: z.string().uuid(),
    }),
    responses: {
      204: z.void(),
      404: z.object({ message: z.string() }),
    },
    summary: 'Remove manga from collection',
  },

  getCollectionsByManga: {
    method: 'GET',
    path: '/api/mangas/:mangaId/collections',
    pathParams: z.object({
      mangaId: z.string().uuid(),
    }),
    responses: {
      200: z.array(CollectionMangaSchema),
      404: z.object({ message: z.string() }),
    },
    summary: 'Get all collections that contain a manga',
  },
});
