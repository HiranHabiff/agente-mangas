# Plano de Refatoração - Sistema Agente Mangás

**Data:** 2025-12-06
**Objetivo:** Modernizar stack e adicionar novas funcionalidades
**Prazo Estimado:** 2-3 semanas

---

## 📋 Stack Atual vs Nova Stack

### Backend

| Atual | Nova | Motivo |
|-------|------|--------|
| Express puro | Express + **ts-rest** | Contratos type-safe entre frontend/backend |
| Queries SQL diretas | **Sequelize** ORM | Migrations, models tipados, relacionamentos automáticos |
| Sem migrations | **Sequelize Migrations** | Versionamento do schema, rollback, CI/CD |
| Pool PostgreSQL direto | Pool via Sequelize | Conexão gerenciada, retry, health checks |
| Validação manual | Zod + ts-rest contracts | Validação automática em ambos os lados |

### Frontend

| Atual | Nova | Motivo |
|-------|------|--------|
| useState/useEffect | **React Query (TanStack Query)** | Cache, invalidação automática, loading states |
| Formulários manuais | **React Hook Form** | Validação, performance, menos re-renders |
| Sem DnD | **React DnD** (react-dnd) | Organizar mangás por drag and drop |
| Fetch/Axios direto | Axios + React Query | Retry, cache, deduplicação de requests |

---

## 🏗️ Arquitetura Proposta

### Backend (Nova Estrutura)

```
backend/
├── src/
│   ├── contracts/              ← NOVO: ts-rest contracts
│   │   ├── manga.contract.ts
│   │   ├── tag.contract.ts
│   │   ├── ai.contract.ts
│   │   └── index.ts
│   │
│   ├── models/                 ← REFATORADO: Sequelize models
│   │   ├── Manga.model.ts
│   │   ├── MangaName.model.ts
│   │   ├── Tag.model.ts
│   │   ├── MangaTag.model.ts
│   │   ├── Reminder.model.ts
│   │   ├── ReadingSession.model.ts
│   │   ├── Creator.model.ts
│   │   ├── Publisher.model.ts     ← NOVO
│   │   ├── Genre.model.ts         ← NOVO
│   │   ├── Theme.model.ts         ← NOVO
│   │   └── index.ts
│   │
│   ├── migrations/             ← NOVO: Sequelize migrations
│   │   ├── 20250106-create-mangas.ts
│   │   ├── 20250106-create-manga-names.ts
│   │   ├── 20250106-create-tags.ts
│   │   └── ...
│   │
│   ├── seeders/                ← NOVO: Seeds para desenvolvimento
│   │   ├── 20250106-seed-genres.ts
│   │   ├── 20250106-seed-themes.ts
│   │   └── 20250106-seed-tags.ts
│   │
│   ├── repositories/           ← REFATORADO: Usar Sequelize
│   │   ├── manga.repository.ts
│   │   ├── tag.repository.ts
│   │   └── ...
│   │
│   ├── services/               (mantém estrutura atual)
│   │
│   ├── api/
│   │   ├── server.ts           ← REFATORADO: ts-rest
│   │   ├── routes/             ← NOVO
│   │   │   ├── manga.routes.ts
│   │   │   ├── tag.routes.ts
│   │   │   └── ai.routes.ts
│   │   └── middlewares/
│   │
│   ├── config/
│   │   ├── database.ts         ← REFATORADO: Sequelize config
│   │   ├── sequelize.ts        ← NOVO
│   │   └── ...
│   │
│   └── mcp/                    (mantém estrutura atual)
│
├── .sequelizerc                ← NOVO
└── package.json                (atualizado)
```

### Frontend (Nova Estrutura)

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts           ← REFATORADO: ts-rest client
│   │   ├── hooks/              ← NOVO: React Query hooks
│   │   │   ├── useManga.ts
│   │   │   ├── useMangaMutation.ts
│   │   │   ├── useTags.ts
│   │   │   └── useChat.ts
│   │   └── contracts/          ← COMPARTILHADO do backend
│   │
│   ├── components/
│   │   ├── forms/              ← NOVO: React Hook Form
│   │   │   ├── MangaForm.tsx
│   │   │   ├── TagSelectField.tsx
│   │   │   └── ImageUploadField.tsx
│   │   │
│   │   ├── dnd/                ← NOVO: React DnD
│   │   │   ├── MangaBoard.tsx
│   │   │   ├── MangaColumn.tsx
│   │   │   ├── DraggableMangaCard.tsx
│   │   │   └── DropZone.tsx
│   │   │
│   │   └── search/
│   │       └── AdvancedFilterPanel.tsx (atual)
│   │
│   ├── pages/
│   │   ├── MangaBoardPage.tsx  ← NOVO: Kanban board
│   │   └── ...
│   │
│   ├── providers/
│   │   └── QueryProvider.tsx   ← NOVO: React Query config
│   │
│   └── utils/
│       ├── queryKeys.ts        ← NOVO: Query key factory
│       └── formSchemas.ts      ← NOVO: Zod schemas para forms
│
└── package.json                (atualizado)
```

---

## 📦 Fase 1: Configuração Base (Dia 1-2)

### 1.1 Instalar Dependências

**Backend:**
```bash
cd backend
npm install --save sequelize pg sequelize-typescript
npm install --save @ts-rest/core @ts-rest/express
npm install --save-dev sequelize-cli @types/sequelize
```

**Frontend:**
```bash
cd frontend
npm install --save @tanstack/react-query @tanstack/react-query-devtools
npm install --save react-hook-form @hookform/resolvers
npm install --save react-dnd react-dnd-html5-backend
npm install --save @ts-rest/core @ts-rest/react-query
```

### 1.2 Configurar Sequelize

**Arquivo:** `backend/.sequelizerc`

```javascript
const path = require('path');

module.exports = {
  'config': path.resolve('src', 'config', 'sequelize.config.js'),
  'models-path': path.resolve('src', 'models'),
  'seeders-path': path.resolve('src', 'seeders'),
  'migrations-path': path.resolve('src', 'migrations')
};
```

**Arquivo:** `backend/src/config/sequelize.ts`

```typescript
import { Sequelize } from 'sequelize-typescript';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

export const sequelize = new Sequelize({
  dialect: 'postgres',
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  username: config.database.user,
  password: config.database.password,
  models: [__dirname + '/../models'],
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
});

export async function initDatabase() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected via Sequelize');

    // Sync models in development (use migrations in production)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      logger.info('Models synced');
    }
  } catch (error) {
    logger.error('Failed to connect to database', { error });
    throw error;
  }
}
```

### 1.3 Configurar React Query

**Arquivo:** `frontend/src/providers/QueryProvider.tsx`

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 30,   // 30 minutos (antes cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

## 📦 Fase 2: Contracts (Dia 3-4)

### 2.1 Criar Contracts com ts-rest

**Arquivo:** `backend/src/contracts/manga.contract.ts`

```typescript
import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

// Schemas Zod
const MangaSchema = z.object({
  id: z.string().uuid(),
  primary_title: z.string(),
  alternative_names: z.array(z.string()).optional(),
  status: z.enum(['reading', 'completed', 'plan_to_read', 'on_hold', 'dropped']),
  last_chapter_read: z.number().int().min(0),
  rating: z.number().min(0).max(10).optional(),
  synopsis: z.string().optional(),
  image_filename: z.string().optional(),
  tags: z.array(z.string()).optional(),
  genres: z.array(z.string()).optional(),
  themes: z.array(z.string()).optional(),
  creators: z.array(z.object({
    name: z.string(),
    role: z.enum(['author', 'artist']),
  })).optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

const CreateMangaSchema = MangaSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
}).partial();

const UpdateMangaSchema = CreateMangaSchema.partial();

const SearchFiltersSchema = z.object({
  query: z.string().optional(),
  status: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  genres: z.array(z.string()).optional(),
  minRating: z.number().optional(),
  with_covers: z.boolean().optional(),
  sort_by: z.enum(['updated_at', 'created_at', 'primary_title', 'rating', 'last_chapter_read']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

// Contract
export const mangaContract = c.router({
  // GET /api/mangas
  getMangas: {
    method: 'GET',
    path: '/api/mangas',
    query: SearchFiltersSchema,
    responses: {
      200: z.object({
        data: z.array(MangaSchema),
        total: z.number(),
        limit: z.number(),
        offset: z.number(),
      }),
    },
    summary: 'List all mangas with filters',
  },

  // GET /api/mangas/:id
  getManga: {
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

  // POST /api/mangas
  createManga: {
    method: 'POST',
    path: '/api/mangas',
    body: CreateMangaSchema,
    responses: {
      201: MangaSchema,
      400: z.object({ message: z.string(), errors: z.any().optional() }),
    },
    summary: 'Create a new manga',
  },

  // PUT /api/mangas/:id
  updateManga: {
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

  // DELETE /api/mangas/:id
  deleteManga: {
    method: 'DELETE',
    path: '/api/mangas/:id',
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      204: z.void(),
      404: z.object({ message: z.string() }),
    },
    summary: 'Delete manga',
  },
});
```

**Arquivo:** `backend/src/contracts/index.ts`

```typescript
import { initContract } from '@ts-rest/core';
import { mangaContract } from './manga.contract.js';
import { tagContract } from './tag.contract.js';
import { aiContract } from './ai.contract.js';

const c = initContract();

export const apiContract = c.router({
  manga: mangaContract,
  tag: tagContract,
  ai: aiContract,
});

export type ApiContract = typeof apiContract;
```

### 2.2 Implementar Routes com ts-rest

**Arquivo:** `backend/src/api/routes/manga.routes.ts`

```typescript
import { createExpressEndpoints } from '@ts-rest/express';
import { mangaContract } from '../../contracts/manga.contract.js';
import { mangaService } from '../../services/manga.service.js';

export const mangaRouter = createExpressEndpoints(mangaContract, {
  getMangas: async ({ query }) => {
    const result = await mangaService.searchMangas(query);
    return {
      status: 200,
      body: result,
    };
  },

  getManga: async ({ params }) => {
    const manga = await mangaService.getMangaById(params.id);

    if (!manga) {
      return {
        status: 404,
        body: { message: 'Manga not found' },
      };
    }

    return {
      status: 200,
      body: manga,
    };
  },

  createManga: async ({ body }) => {
    const manga = await mangaService.createManga(body);
    return {
      status: 201,
      body: manga,
    };
  },

  updateManga: async ({ params, body }) => {
    const manga = await mangaService.updateManga(params.id, body);

    if (!manga) {
      return {
        status: 404,
        body: { message: 'Manga not found' },
      };
    }

    return {
      status: 200,
      body: manga,
    };
  },

  deleteManga: async ({ params }) => {
    await mangaService.deleteManga(params.id);
    return {
      status: 204,
      body: undefined,
    };
  },
});
```

---

## 📦 Fase 3: Models com Sequelize (Dia 5-7)

### 3.1 Criar Model Base

**Arquivo:** `backend/src/models/Manga.model.ts`

```typescript
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';
import { MangaName } from './MangaName.model.js';
import { Tag } from './Tag.model.js';
import { MangaTag } from './MangaTag.model.js';
import { Genre } from './Genre.model.js';
import { MangaGenre } from './MangaGenre.model.js';

@Table({
  tableName: 'mangas',
  timestamps: true,
  paranoid: true, // Soft delete
})
export class Manga extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({
    type: DataType.STRING(750),
    allowNull: false,
  })
  primary_title!: string;

  @Column({
    type: DataType.ENUM('reading', 'completed', 'plan_to_read', 'on_hold', 'dropped'),
    defaultValue: 'plan_to_read',
  })
  status!: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  last_chapter_read!: number;

  @Column({
    type: DataType.DECIMAL(3, 1),
    allowNull: true,
  })
  rating?: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  synopsis?: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  image_filename?: string;

  @Column({
    type: DataType.STRING(1000),
    allowNull: true,
  })
  image_url?: string;

  // Vector embedding (768 dimensions)
  @Column({
    type: DataType.ARRAY(DataType.FLOAT),
    allowNull: true,
  })
  embedding?: number[];

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  legacy_id?: number;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  @DeletedAt
  deleted_at?: Date;

  // Relationships
  @HasMany(() => MangaName)
  alternative_names!: MangaName[];

  @BelongsToMany(() => Tag, () => MangaTag)
  tags!: Tag[];

  @BelongsToMany(() => Genre, () => MangaGenre)
  genres!: Genre[];
}
```

### 3.2 Criar Migration

**Arquivo:** `backend/src/migrations/20250106-create-mangas.ts`

```typescript
import { QueryInterface, DataTypes } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('mangas', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      primary_title: {
        type: DataTypes.STRING(750),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('reading', 'completed', 'plan_to_read', 'on_hold', 'dropped'),
        defaultValue: 'plan_to_read',
      },
      last_chapter_read: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      rating: {
        type: DataTypes.DECIMAL(3, 1),
        allowNull: true,
      },
      synopsis: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      image_filename: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      image_url: {
        type: DataTypes.STRING(1000),
        allowNull: true,
      },
      embedding: {
        type: DataTypes.ARRAY(DataTypes.FLOAT),
        allowNull: true,
      },
      legacy_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });

    // Indexes
    await queryInterface.addIndex('mangas', ['primary_title']);
    await queryInterface.addIndex('mangas', ['status']);
    await queryInterface.addIndex('mangas', ['updated_at']);
    await queryInterface.addIndex('mangas', ['legacy_id']);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('mangas');
  },
};
```

### 3.3 Atualizar Repository

**Arquivo:** `backend/src/repositories/manga.repository.ts` (REFATORADO)

```typescript
import { Op } from 'sequelize';
import { Manga } from '../models/Manga.model.js';
import { MangaName } from '../models/MangaName.model.js';
import { Tag } from '../models/Tag.model.js';
import { Genre } from '../models/Genre.model.js';
import { SearchMangaInput } from '../contracts/manga.contract.js';

export class MangaRepository {
  async findAll(filters: SearchMangaInput) {
    const {
      query,
      status,
      tags,
      genres,
      minRating,
      with_covers,
      sort_by = 'updated_at',
      sort_order = 'desc',
      limit = 50,
      offset = 0,
    } = filters;

    const where: any = {};

    // Text search
    if (query) {
      where[Op.or] = [
        { primary_title: { [Op.iLike]: `%${query}%` } },
        { '$alternative_names.name$': { [Op.iLike]: `%${query}%` } },
      ];
    }

    // Status filter
    if (status && status.length > 0) {
      where.status = { [Op.in]: status };
    }

    // Rating filter
    if (minRating !== undefined) {
      where.rating = { [Op.gte]: minRating };
    }

    // With covers filter
    if (with_covers) {
      where.image_filename = { [Op.ne]: null };
    }

    const { rows, count } = await Manga.findAndCountAll({
      where,
      include: [
        {
          model: MangaName,
          as: 'alternative_names',
          required: false,
          attributes: ['name'],
        },
        {
          model: Tag,
          as: 'tags',
          required: tags && tags.length > 0,
          where: tags && tags.length > 0 ? { name: { [Op.in]: tags } } : undefined,
          attributes: ['name'],
          through: { attributes: [] },
        },
        {
          model: Genre,
          as: 'genres',
          required: genres && genres.length > 0,
          where: genres && genres.length > 0 ? { name: { [Op.in]: genres } } : undefined,
          attributes: ['name'],
          through: { attributes: [] },
        },
      ],
      order: [[sort_by, sort_order.toUpperCase()]],
      limit,
      offset,
      distinct: true,
    });

    return {
      data: rows,
      total: count,
      limit,
      offset,
    };
  }

  async findById(id: string) {
    return Manga.findByPk(id, {
      include: [
        { model: MangaName, as: 'alternative_names' },
        { model: Tag, as: 'tags' },
        { model: Genre, as: 'genres' },
      ],
    });
  }

  async create(data: Partial<Manga>) {
    return Manga.create(data);
  }

  async update(id: string, data: Partial<Manga>) {
    const manga = await this.findById(id);
    if (!manga) return null;

    await manga.update(data);
    return manga;
  }

  async delete(id: string) {
    const manga = await this.findById(id);
    if (!manga) return false;

    await manga.destroy(); // Soft delete
    return true;
  }
}
```

---

## 📦 Fase 4: Frontend com React Query (Dia 8-10)

### 4.1 Criar ts-rest Client

**Arquivo:** `frontend/src/api/client.ts`

```typescript
import { initClient } from '@ts-rest/core';
import type { ApiContract } from '../../../backend/src/contracts/index.js';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = initClient<ApiContract>(baseUrl, {
  baseHeaders: {
    'Content-Type': 'application/json',
  },
});
```

### 4.2 Criar React Query Hooks

**Arquivo:** `frontend/src/api/hooks/useManga.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { mangaKeys } from '../../utils/queryKeys';

// GET /api/mangas
export function useMangas(filters: any) {
  return useQuery({
    queryKey: mangaKeys.list(filters),
    queryFn: async () => {
      const { body } = await apiClient.manga.getMangas({
        query: filters,
      });
      return body;
    },
  });
}

// GET /api/mangas/:id
export function useManga(id: string) {
  return useQuery({
    queryKey: mangaKeys.detail(id),
    queryFn: async () => {
      const { body } = await apiClient.manga.getManga({
        params: { id },
      });
      return body;
    },
    enabled: !!id,
  });
}

// POST /api/mangas
export function useCreateManga() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { body } = await apiClient.manga.createManga({
        body: data,
      });
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mangaKeys.lists() });
    },
  });
}

// PUT /api/mangas/:id
export function useUpdateManga() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { body } = await apiClient.manga.updateManga({
        params: { id },
        body: data,
      });
      return body;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: mangaKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: mangaKeys.lists() });
    },
  });
}

// DELETE /api/mangas/:id
export function useDeleteManga() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.manga.deleteManga({
        params: { id },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mangaKeys.lists() });
    },
  });
}
```

**Arquivo:** `frontend/src/utils/queryKeys.ts`

```typescript
export const mangaKeys = {
  all: ['manga'] as const,
  lists: () => [...mangaKeys.all, 'list'] as const,
  list: (filters: any) => [...mangaKeys.lists(), filters] as const,
  details: () => [...mangaKeys.all, 'detail'] as const,
  detail: (id: string) => [...mangaKeys.details(), id] as const,
};

export const tagKeys = {
  all: ['tag'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  list: (filters: any) => [...tagKeys.lists(), filters] as const,
};

export const aiKeys = {
  all: ['ai'] as const,
  chat: (sessionId: string) => [...aiKeys.all, 'chat', sessionId] as const,
};
```

### 4.3 Atualizar Componente com React Query

**Arquivo:** `frontend/src/pages/MangaListPage.tsx` (REFATORADO)

```typescript
import { useState } from 'react';
import { Box, Spinner, Text } from '@chakra-ui/react';
import { useMangas } from '../api/hooks/useManga';
import { MangaCard } from '../components/manga/MangaCard';
import { AdvancedFilterPanel } from '../components/search/AdvancedFilterPanel';

export function MangaListPage() {
  const [filters, setFilters] = useState({});

  const { data, isLoading, isError, error } = useMangas(filters);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={10}>
        <Spinner size="xl" />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box p={4}>
        <Text color="red.500">Erro ao carregar mangás: {error.message}</Text>
      </Box>
    );
  }

  return (
    <Box>
      <AdvancedFilterPanel onFiltersChange={setFilters} />

      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={4} p={4}>
        {data?.data.map((manga) => (
          <MangaCard key={manga.id} manga={manga} />
        ))}
      </Box>
    </Box>
  );
}
```

---

## 📦 Fase 5: React Hook Form (Dia 11-12)

### 5.1 Criar Schema de Validação

**Arquivo:** `frontend/src/utils/formSchemas.ts`

```typescript
import { z } from 'zod';

export const createMangaSchema = z.object({
  primary_title: z.string().min(1, 'Título é obrigatório'),
  alternative_names: z.array(z.string()).optional(),
  status: z.enum(['reading', 'completed', 'plan_to_read', 'on_hold', 'dropped']),
  last_chapter_read: z.number().int().min(0).default(0),
  rating: z.number().min(0).max(10).optional(),
  synopsis: z.string().optional(),
  tags: z.array(z.string()).optional(),
  genres: z.array(z.string()).optional(),
});

export type CreateMangaFormData = z.infer<typeof createMangaSchema>;
```

### 5.2 Criar Componente de Formulário

**Arquivo:** `frontend/src/components/forms/MangaForm.tsx`

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  Select,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react';
import { createMangaSchema, CreateMangaFormData } from '../../utils/formSchemas';
import { useCreateManga, useUpdateManga } from '../../api/hooks/useManga';

interface MangaFormProps {
  initialData?: CreateMangaFormData;
  mangaId?: string;
  onSuccess?: () => void;
}

export function MangaForm({ initialData, mangaId, onSuccess }: MangaFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateMangaFormData>({
    resolver: zodResolver(createMangaSchema),
    defaultValues: initialData,
  });

  const createManga = useCreateManga();
  const updateManga = useUpdateManga();

  const onSubmit = async (data: CreateMangaFormData) => {
    try {
      if (mangaId) {
        await updateManga.mutateAsync({ id: mangaId, data });
      } else {
        await createManga.mutateAsync(data);
      }
      onSuccess?.();
    } catch (error) {
      console.error('Failed to save manga:', error);
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)} p={4}>
      <FormControl isInvalid={!!errors.primary_title} mb={4}>
        <FormLabel>Título</FormLabel>
        <Input {...register('primary_title')} />
        <FormErrorMessage>{errors.primary_title?.message}</FormErrorMessage>
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Status</FormLabel>
        <Select {...register('status')}>
          <option value="plan_to_read">Pretendo Ler</option>
          <option value="reading">Lendo</option>
          <option value="completed">Completo</option>
          <option value="on_hold">Pausado</option>
          <option value="dropped">Dropado</option>
        </Select>
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Último Capítulo Lido</FormLabel>
        <NumberInput defaultValue={0} min={0}>
          <NumberInputField {...register('last_chapter_read', { valueAsNumber: true })} />
        </NumberInput>
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Sinopse</FormLabel>
        <Textarea {...register('synopsis')} rows={5} />
      </FormControl>

      <Button type="submit" colorScheme="blue" isLoading={isSubmitting}>
        {mangaId ? 'Atualizar' : 'Criar'}
      </Button>
    </Box>
  );
}
```

---

## 📦 Fase 6: React DnD - Kanban Board (Dia 13-15)

### 6.1 Configurar DnD Provider

**Arquivo:** `frontend/src/App.tsx` (ATUALIZAR)

```typescript
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { QueryProvider } from './providers/QueryProvider';
import { ChakraProvider } from '@chakra-ui/react';

export function App() {
  return (
    <ChakraProvider>
      <QueryProvider>
        <DndProvider backend={HTML5Backend}>
          {/* Routes */}
        </DndProvider>
      </QueryProvider>
    </ChakraProvider>
  );
}
```

### 6.2 Criar Kanban Board

**Arquivo:** `frontend/src/components/dnd/MangaBoard.tsx`

```typescript
import { Box, Heading, SimpleGrid } from '@chakra-ui/react';
import { useMangas, useUpdateManga } from '../../api/hooks/useManga';
import { MangaColumn } from './MangaColumn';
import { MangaStatus } from '../../types';

const COLUMNS: { status: MangaStatus; title: string; color: string }[] = [
  { status: 'plan_to_read', title: 'Pretendo Ler', color: 'gray.200' },
  { status: 'reading', title: 'Lendo', color: 'blue.200' },
  { status: 'on_hold', title: 'Pausado', color: 'yellow.200' },
  { status: 'completed', title: 'Completo', color: 'green.200' },
  { status: 'dropped', title: 'Dropado', color: 'red.200' },
];

export function MangaBoard() {
  const { data } = useMangas({});
  const updateManga = useUpdateManga();

  const handleDrop = async (mangaId: string, newStatus: MangaStatus) => {
    await updateManga.mutateAsync({
      id: mangaId,
      data: { status: newStatus },
    });
  };

  const getMangasByStatus = (status: MangaStatus) => {
    return data?.data.filter((m) => m.status === status) || [];
  };

  return (
    <Box p={4}>
      <Heading mb={6}>Meus Mangás - Kanban</Heading>

      <SimpleGrid columns={5} spacing={4}>
        {COLUMNS.map((column) => (
          <MangaColumn
            key={column.status}
            status={column.status}
            title={column.title}
            color={column.color}
            mangas={getMangasByStatus(column.status)}
            onDrop={handleDrop}
          />
        ))}
      </SimpleGrid>
    </Box>
  );
}
```

**Arquivo:** `frontend/src/components/dnd/MangaColumn.tsx`

```typescript
import { Box, Heading, VStack } from '@chakra-ui/react';
import { useDrop } from 'react-dnd';
import { DraggableMangaCard } from './DraggableMangaCard';
import { Manga, MangaStatus } from '../../types';

interface MangaColumnProps {
  status: MangaStatus;
  title: string;
  color: string;
  mangas: Manga[];
  onDrop: (mangaId: string, newStatus: MangaStatus) => void;
}

export function MangaColumn({ status, title, color, mangas, onDrop }: MangaColumnProps) {
  const [{ isOver }, drop] = useDrop({
    accept: 'MANGA_CARD',
    drop: (item: { id: string }) => onDrop(item.id, status),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <Box
      ref={drop}
      bg={isOver ? color : 'gray.50'}
      p={4}
      borderRadius="md"
      minH="500px"
      transition="background 0.2s"
    >
      <Heading size="md" mb={4}>
        {title} ({mangas.length})
      </Heading>

      <VStack spacing={3} align="stretch">
        {mangas.map((manga) => (
          <DraggableMangaCard key={manga.id} manga={manga} />
        ))}
      </VStack>
    </Box>
  );
}
```

**Arquivo:** `frontend/src/components/dnd/DraggableMangaCard.tsx`

```typescript
import { Box, Image, Text } from '@chakra-ui/react';
import { useDrag } from 'react-dnd';
import { Manga } from '../../types';

interface DraggableMangaCardProps {
  manga: Manga;
}

export function DraggableMangaCard({ manga }: DraggableMangaCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'MANGA_CARD',
    item: { id: manga.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <Box
      ref={drag}
      opacity={isDragging ? 0.5 : 1}
      bg="white"
      p={3}
      borderRadius="md"
      boxShadow="sm"
      cursor="grab"
      _active={{ cursor: 'grabbing' }}
    >
      {manga.image_filename && (
        <Image
          src={`/storage/images/${manga.image_filename}`}
          alt={manga.primary_title}
          borderRadius="md"
          mb={2}
        />
      )}

      <Text fontWeight="bold" fontSize="sm" noOfLines={2}>
        {manga.primary_title}
      </Text>

      <Text fontSize="xs" color="gray.600">
        Cap. {manga.last_chapter_read || 0}
      </Text>
    </Box>
  );
}
```

---

## 🎨 Novas Funcionalidades Propostas

### 1. Dashboard de Estatísticas (Dia 16-17)

**Recursos:**
- Gráfico de mangás por status (pie chart)
- Gráfico de leitura mensal (line chart)
- Top 10 tags mais usadas
- Média de capítulos lidos
- Streak de leitura (dias consecutivos)

**Tecnologias:**
- **recharts** ou **victory** para gráficos
- React Query para buscar dados

### 2. Sistema de Coleções (Dia 18-19)

**Recursos:**
- Criar coleções customizadas (ex: "Mangás de Ação", "Favoritos")
- Adicionar/remover mangás de coleções
- Compartilhar coleções via link

**Estrutura de Banco:**
```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  user_id UUID,
  is_public BOOLEAN DEFAULT false
);

CREATE TABLE collection_mangas (
  collection_id UUID REFERENCES collections(id),
  manga_id UUID REFERENCES mangas(id),
  added_at TIMESTAMP
);
```

### 3. Histórico de Leitura Detalhado (Dia 20-21)

**Recursos:**
- Registrar data/hora de cada capítulo lido
- Gráfico de progresso ao longo do tempo
- Estimativa de conclusão baseada em ritmo

**Tabela:**
```sql
CREATE TABLE reading_history (
  id UUID PRIMARY KEY,
  manga_id UUID REFERENCES mangas(id),
  chapter_number INTEGER,
  read_at TIMESTAMP,
  reading_duration_minutes INTEGER
);
```

### 4. Busca Semântica com Gemini (Dia 22-23)

**Recursos:**
- "Mostre mangás parecidos com Solo Leveling"
- Busca por sinopse/descrição
- Recomendações baseadas em hábitos

**Dependências:**
- Embeddings já implementados
- Sequelize suporta queries vetoriais via raw SQL

### 5. Notificações e Lembretes (Dia 24-25)

**Recursos:**
- Notificação push quando novo capítulo disponível
- Lembrete semanal de mangás não lidos
- Notificação de mangás pausados há X dias

**Tecnologias:**
- **Web Push API**
- **node-cron** para agendamento backend

### 6. Import/Export (Dia 26-27)

**Recursos:**
- Exportar coleção para JSON/CSV
- Importar de MyAnimeList, AniList
- Backup automático

---

## 🔄 Checklist de Migração

### Backend

- [ ] Instalar dependências (Sequelize, ts-rest)
- [ ] Configurar Sequelize (.sequelizerc, config)
- [ ] Criar contracts (manga, tag, ai)
- [ ] Criar models (Manga, MangaName, Tag, etc.)
- [ ] Criar migrations (schema inicial)
- [ ] Criar seeders (genres, themes, tags)
- [ ] Refatorar repositories (usar Sequelize)
- [ ] Refatorar routes (ts-rest)
- [ ] Atualizar server.ts (ts-rest middleware)
- [ ] Migrar dados existentes (script de migração)
- [ ] Testar endpoints

### Frontend

- [ ] Instalar dependências (React Query, React Hook Form, React DnD)
- [ ] Configurar React Query provider
- [ ] Criar ts-rest client
- [ ] Criar query keys factory
- [ ] Criar hooks (useMangas, useTags, useChat)
- [ ] Criar form schemas (Zod)
- [ ] Refatorar componentes (usar React Query)
- [ ] Criar MangaForm (React Hook Form)
- [ ] Criar Kanban Board (React DnD)
- [ ] Testar todas as features

---

## 📊 Cronograma Detalhado

| Fase | Dias | Descrição | Status |
|------|------|-----------|--------|
| **Fase 1** | 1-2 | Configuração base (instalação, configs) | ⏳ Pendente |
| **Fase 2** | 3-4 | Contracts ts-rest (schemas, routes) | ⏳ Pendente |
| **Fase 3** | 5-7 | Models Sequelize (models, migrations) | ⏳ Pendente |
| **Fase 4** | 8-10 | React Query hooks (queries, mutations) | ⏳ Pendente |
| **Fase 5** | 11-12 | React Hook Form (formulários) | ⏳ Pendente |
| **Fase 6** | 13-15 | React DnD (Kanban board) | ⏳ Pendente |
| **Fase 7** | 16-17 | Dashboard de estatísticas | ⏳ Pendente |
| **Fase 8** | 18-19 | Sistema de coleções | ⏳ Pendente |
| **Fase 9** | 20-21 | Histórico de leitura | ⏳ Pendente |
| **Fase 10** | 22-23 | Busca semântica com Gemini | ⏳ Pendente |
| **Fase 11** | 24-25 | Notificações e lembretes | ⏳ Pendente |
| **Fase 12** | 26-27 | Import/Export | ⏳ Pendente |

---

## 🚀 Comandos Úteis

### Sequelize

```bash
# Criar migration
npx sequelize-cli migration:generate --name create-mangas

# Executar migrations
npx sequelize-cli db:migrate

# Rollback
npx sequelize-cli db:migrate:undo

# Criar seeder
npx sequelize-cli seed:generate --name seed-genres

# Executar seeders
npx sequelize-cli db:seed:all
```

### Desenvolvimento

```bash
# Backend
cd backend
npm run dev          # API + MCP
npm run build        # Compilar TypeScript
npm run migrate      # Executar migrations

# Frontend
cd frontend
npm run dev          # Vite dev server
npm run build        # Build produção
```

---

## ⚠️ Considerações Importantes

### 1. Migração de Dados Existentes

**Problema:** 2.940 mangás já estão no banco PostgreSQL sem Sequelize.

**Solução:**
1. Criar migrations que **não criam tabelas**, apenas adicionam colunas/índices
2. OU: Exportar dados existentes, recriar schema com Sequelize, reimportar

**Script de Migração:**
```typescript
// backend/src/migrations/20250106-migrate-existing-data.ts
export default {
  async up(queryInterface: QueryInterface) {
    // Apenas adicionar colunas novas se necessário
    // Não dropar tabelas existentes
  },
  async down(queryInterface: QueryInterface) {
    // Reverter mudanças
  },
};
```

### 2. Compatibilidade MCP

**MCP Server deve continuar funcionando:**
- Repositories atualizados devem manter mesma interface
- Services não mudam (usam repositories)
- MCP tools não mudam

### 3. Performance

**Sequelize pode adicionar overhead:**
- Usar `raw: true` em queries pesadas
- Usar `attributes` para selecionar apenas campos necessários
- Adicionar índices via migrations

### 4. TypeScript

**Garantir tipos corretos:**
- Models do Sequelize já são tipados
- Contracts do ts-rest garantem tipos compartilhados
- Frontend recebe tipos automáticos via ts-rest client

---

## 📝 Próximos Passos Imediatos

1. **Decidir sobre migração de dados:**
   - Opção A: Manter dados atuais, adicionar Sequelize gradualmente
   - Opção B: Exportar, recriar schema, reimportar

2. **Começar Fase 1:**
   - Instalar dependências
   - Configurar Sequelize
   - Testar conexão

3. **Criar primeiro contract:**
   - Começar com `manga.contract.ts`
   - Implementar 1 rota (GET /api/mangas)
   - Testar no frontend

---

**Última atualização:** 2025-12-06 01:00 BRT
