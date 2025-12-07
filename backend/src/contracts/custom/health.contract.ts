import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

// Schemas
export const HealthStatusSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.date(),
  uptime: z.number(),
  version: z.string(),
});

export const DatabaseHealthSchema = z.object({
  status: z.enum(['connected', 'disconnected', 'error']),
  response_time_ms: z.number(),
  connection_pool: z.object({
    total: z.number().int(),
    active: z.number().int(),
    idle: z.number().int(),
  }).optional(),
});

export const DetailedHealthSchema = HealthStatusSchema.extend({
  services: z.object({
    database: DatabaseHealthSchema,
    ai: z.object({
      status: z.enum(['available', 'unavailable']),
      last_request: z.date().nullable(),
    }),
  }),
  system: z.object({
    memory: z.object({
      used: z.number(),
      total: z.number(),
      percentage: z.number(),
    }),
    cpu: z.object({
      usage: z.number(),
    }).optional(),
  }),
});

// Contract
export const healthContract = c.router({
  check: {
    method: 'GET',
    path: '/health',
    responses: {
      200: HealthStatusSchema,
      503: HealthStatusSchema,
    },
    summary: 'Basic health check',
  },

  detailed: {
    method: 'GET',
    path: '/health/detailed',
    responses: {
      200: DetailedHealthSchema,
      503: DetailedHealthSchema,
    },
    summary: 'Detailed health check with all services',
  },

  database: {
    method: 'GET',
    path: '/health/database',
    responses: {
      200: DatabaseHealthSchema,
      503: DatabaseHealthSchema,
    },
    summary: 'Database health check',
  },

  readiness: {
    method: 'GET',
    path: '/health/readiness',
    responses: {
      200: z.object({
        ready: z.boolean(),
        services: z.object({
          database: z.boolean(),
          ai: z.boolean(),
        }),
      }),
      503: z.object({
        ready: z.boolean(),
        services: z.object({
          database: z.boolean(),
          ai: z.boolean(),
        }),
        message: z.string(),
      }),
    },
    summary: 'Readiness probe for Kubernetes/Docker',
  },

  liveness: {
    method: 'GET',
    path: '/health/liveness',
    responses: {
      200: z.object({
        alive: z.boolean(),
        uptime: z.number(),
      }),
    },
    summary: 'Liveness probe for Kubernetes/Docker',
  },
});
