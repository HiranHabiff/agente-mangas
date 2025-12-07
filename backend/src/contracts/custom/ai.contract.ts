import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

// Schemas
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.date(),
});

export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(5000),
  context: z.object({
    manga_id: z.string().uuid().optional(),
    conversation_id: z.string().uuid().optional(),
  }).optional(),
});

export const ChatResponseSchema = z.object({
  message: z.string(),
  conversation_id: z.string().uuid(),
  suggestions: z.array(z.string()).optional(),
});

export const SemanticSearchSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(50).default(10),
  min_similarity: z.number().min(0).max(1).default(0.7),
  include_synopsis: z.boolean().default(true),
});

export const SemanticSearchResultSchema = z.object({
  manga_id: z.string().uuid(),
  primary_title: z.string(),
  synopsis: z.string().nullable(),
  similarity: z.number(),
  image_filename: z.string().nullable(),
});

export const GenerateEmbeddingSchema = z.object({
  text: z.string().min(1).max(10000),
});

export const EmbeddingResponseSchema = z.object({
  embedding: z.array(z.number()),
  dimension: z.number().int(),
});

export const RecommendationRequestSchema = z.object({
  manga_id: z.string().uuid().optional(),
  based_on_tags: z.array(z.string().uuid()).optional(),
  limit: z.number().int().min(1).max(20).default(5),
});

export const RecommendationSchema = z.object({
  manga_id: z.string().uuid(),
  primary_title: z.string(),
  synopsis: z.string().nullable(),
  score: z.number(),
  reason: z.string(),
  image_filename: z.string().nullable(),
});

// Contract
export const aiContract = c.router({
  chat: {
    method: 'POST',
    path: '/api/ai/chat',
    body: ChatRequestSchema,
    responses: {
      200: ChatResponseSchema,
      400: z.object({ message: z.string() }),
      500: z.object({ message: z.string() }),
    },
    summary: 'Chat with AI assistant about mangas',
  },

  semanticSearch: {
    method: 'POST',
    path: '/api/ai/search/semantic',
    body: SemanticSearchSchema,
    responses: {
      200: z.object({
        results: z.array(SemanticSearchResultSchema),
        total: z.number().int(),
      }),
      400: z.object({ message: z.string() }),
      500: z.object({ message: z.string() }),
    },
    summary: 'Search mangas by semantic similarity',
  },

  generateEmbedding: {
    method: 'POST',
    path: '/api/ai/embeddings/generate',
    body: GenerateEmbeddingSchema,
    responses: {
      200: EmbeddingResponseSchema,
      400: z.object({ message: z.string() }),
      500: z.object({ message: z.string() }),
    },
    summary: 'Generate embedding for text',
  },

  regenerateMangaEmbedding: {
    method: 'POST',
    path: '/api/ai/mangas/:mangaId/regenerate-embedding',
    pathParams: z.object({
      mangaId: z.string().uuid(),
    }),
    body: z.object({}), // Empty body for POST endpoint
    responses: {
      200: z.object({
        manga_id: z.string().uuid(),
        embedding_updated: z.boolean(),
        dimension: z.number().int(),
      }),
      404: z.object({ message: z.string() }),
      500: z.object({ message: z.string() }),
    },
    summary: 'Regenerate embedding for a manga',
  },

  getRecommendations: {
    method: 'POST',
    path: '/api/ai/recommendations',
    body: RecommendationRequestSchema,
    responses: {
      200: z.object({
        recommendations: z.array(RecommendationSchema),
        total: z.number().int(),
      }),
      400: z.object({ message: z.string() }),
      404: z.object({ message: z.string() }),
      500: z.object({ message: z.string() }),
    },
    summary: 'Get AI-powered manga recommendations',
  },

  analyzeReadingPattern: {
    method: 'GET',
    path: '/api/ai/analyze/reading-pattern',
    responses: {
      200: z.object({
        favorite_genres: z.array(z.string()),
        reading_frequency: z.string(),
        average_rating: z.number(),
        completion_rate: z.number(),
        insights: z.array(z.string()),
      }),
      500: z.object({ message: z.string() }),
    },
    summary: 'Analyze user reading patterns with AI',
  },
});
