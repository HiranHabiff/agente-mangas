# Migração para NestJS - Progresso

**Data de Início:** 2025-12-07
**Branch:** backend
**Status:** Em Progresso (Fase 1 Completa)

---

## ✅ Fase 1: Setup Base e Models (COMPLETO)

### Instalado:
- `@nestjs/core` `@nestjs/common` `@nestjs/platform-express`
- `@nestjs/config` - Configuração global
- `@nestjs/swagger` - Documentação automática
- `@nestjs/sequelize` - Integração Sequelize
- `sequelize` `sequelize-typescript` - ORM e decorators
- `@ts-rest/core` `@ts-rest/nest` - Contracts type-safe
- `class-validator` `class-transformer` - Validação DTOs
- `reflect-metadata` `rxjs` - Dependências NestJS

### Estrutura Criada:

```
backend/src/
├── main.ts                    ✅ Bootstrap NestJS + Swagger
├── app.module.ts              ✅ Módulo raiz
├── database/
│   ├── database.module.ts     ✅ Configuração Sequelize
│   ├── config.js              ✅ Config para migrations
│   ├── models/                ✅ 10 models criados
│   │   ├── manga.model.ts
│   │   ├── manga-name.model.ts
│   │   ├── tag.model.ts
│   │   ├── manga-tag.model.ts
│   │   ├── creator.model.ts
│   │   ├── manga-creator.model.ts
│   │   ├── reminder.model.ts
│   │   ├── reading-session.model.ts
│   │   ├── collection.model.ts
│   │   └── collection-manga.model.ts
│   ├── migrations/            🔄 A criar
│   └── seeders/               🔄 A criar
└── modules/                   🔄 A criar
    ├── manga/
    ├── tag/
    ├── ai/
    ├── stats/
    ├── collection/
    └── health/
```

### Models Implementados:

1. **Manga** - Tabela principal
   - UUID primary key
   - Status (enum)
   - Embeddings (vector 768)
   - Soft delete (paranoid)
   - Relações: names, tags, creators, reminders, sessions, collections

2. **MangaName** - Nomes alternativos
   - Múltiplos idiomas
   - Relação com Manga

3. **Tag** - Tags/Categorias
   - Tipo (genre, demographic, theme, format, custom)
   - Cor customizada
   - Relação N:N com Manga

4. **MangaTag** - Tabela pivot
   - Relação manga ↔ tag

5. **Creator** - Autores/Artistas
   - Nome único
   - Biografia
   - Relação N:N com Manga

6. **MangaCreator** - Tabela pivot
   - Role (author, artist, both)

7. **Reminder** - Lembretes
   - Data/hora
   - Status enviado
   - Relação com Manga

8. **ReadingSession** - Histórico de leitura
   - Capítulo
   - Duração
   - Notas
   - Timestamp

9. **Collection** - Coleções customizadas
   - Nome, descrição
   - Pública/privada
   - Cor
   - Relação N:N com Manga

10. **CollectionManga** - Tabela pivot
    - Posição (ordenação)

### Configuração:

- **Swagger:** `/api/docs`
- **CORS:** Configurado para frontend
- **Validation Pipe:** Global com transformação
- **Database:** PostgreSQL com pool connection
- **Logging:** Condicional (dev/prod)

---

## ✅ Fase 2: Contracts ts-rest (COMPLETO)

### Estrutura Criada:

#### Entity Contracts (10 contracts - 1 por tabela)
```
src/contracts/
├── manga.contract.ts           ✅ CRUD + restore + filters
├── manga-name.contract.ts      ✅ Alternative names management
├── tag.contract.ts             ✅ CRUD + by type + conflicts
├── manga-tag.contract.ts       ✅ Add/remove tags + bulk operations
├── creator.contract.ts         ✅ CRUD + search
├── manga-creator.contract.ts   ✅ Add/remove creators + role update
├── reminder.contract.ts        ✅ CRUD + pending + mark as sent
├── reading-session.contract.ts ✅ CRUD + stats + by manga
├── collection.contract.ts      ✅ CRUD + public collections
├── collection-manga.contract.ts✅ Add/remove + reorder + position
└── index.ts                    ✅ Export all contracts
```

#### Custom Contracts (3 contracts - features especiais)
```
src/contracts/custom/
├── ai.contract.ts       ✅ Chat, semantic search, embeddings, recommendations
├── stats.contract.ts    ✅ Dashboard, reading stats, top tags/creators
├── health.contract.ts   ✅ Health checks, readiness, liveness probes
└── index.ts (included in main)
```

### Schemas Zod Criados (total: 70+):

**Manga Contract:**
- MangaSchema, CreateMangaSchema, UpdateMangaSchema
- MangaFiltersSchema, MangaListResponseSchema

**Tag Contract:**
- TagSchema, CreateTagSchema, UpdateTagSchema
- TagFiltersSchema, TagListResponseSchema

**MangaTag Contract:**
- MangaTagSchema, AddTagToMangaSchema, AddMultipleTagsSchema

**Creator Contract:**
- CreatorSchema, CreateCreatorSchema, UpdateCreatorSchema
- CreatorFiltersSchema, CreatorListResponseSchema

**MangaCreator Contract:**
- MangaCreatorSchema, AddCreatorToMangaSchema
- UpdateMangaCreatorRoleSchema, AddMultipleCreatorsSchema

**Reminder Contract:**
- ReminderSchema, CreateReminderSchema, UpdateReminderSchema
- ReminderFiltersSchema, ReminderListResponseSchema

**ReadingSession Contract:**
- ReadingSessionSchema, CreateReadingSessionSchema
- ReadingSessionFiltersSchema, ReadingStatsSchema

**Collection Contract:**
- CollectionSchema, CreateCollectionSchema
- CollectionWithMangasSchema, CollectionListResponseSchema

**CollectionManga Contract:**
- CollectionMangaSchema, AddMangaToCollectionSchema
- ReorderMangasSchema, UpdateMangaPositionSchema

**AI Contract:**
- ChatMessageSchema, ChatRequestSchema, ChatResponseSchema
- SemanticSearchSchema, GenerateEmbeddingSchema
- RecommendationSchema, EmbeddingResponseSchema

**Stats Contract:**
- DashboardStatsSchema, MangaStatsSchema, ReadingStatsSchema
- MonthlyReadingSchema, TagStatsSchema, CreatorStatsSchema

**Health Contract:**
- HealthStatusSchema, DatabaseHealthSchema, DetailedHealthSchema

### Features dos Contracts:

✅ **Type-safety completo** - Tipos compartilhados frontend/backend
✅ **Validação com Zod** - Validação automática de requests/responses
✅ **Documentação automática** - Integração com Swagger
✅ **Error handling** - Status codes claros (400, 404, 409, 500)
✅ **Paginação** - limit/offset em listagens
✅ **Filtros avançados** - Query params tipados
✅ **Bulk operations** - Add múltiplos tags/creators
✅ **Soft delete support** - Restore endpoint para Manga
✅ **UUID validation** - Validação de IDs
✅ **Date/DateTime** - Formato ISO 8601
✅ **Regex validation** - Cores hex, language codes
✅ **Business rules** - Conflict detection (409)

---

## 🔄 Fase 3: DTOs e Validation (PRÓXIMO)

### A Criar:

#### class-validator DTOs (um a um dos schemas Zod)
```
src/modules/manga/dto/
├── create-manga.dto.ts
├── update-manga.dto.ts
├── manga-filters.dto.ts
└── manga-response.dto.ts
```

*Nota: Como estamos usando ts-rest, os DTOs podem ser gerados automaticamente dos schemas Zod, mas vamos criar DTOs NestJS para melhor integração com Swagger decorators.*

---

## 🔄 Fase 4: Modules (DEPOIS DOS DTOS)

### Estrutura de cada módulo:



## 🔄 Fase 3: Modules (PRÓXIMO)

### Estrutura de cada módulo:

```
src/modules/manga/
├── manga.module.ts        # Definição do módulo
├── manga.controller.ts    # Controller NestJS
├── manga.service.ts       # Business logic
├── manga.repository.ts    # Database access
├── dto/                   # DTOs de validação
│   ├── create-manga.dto.ts
│   ├── update-manga.dto.ts
│   └── ...
└── interfaces/            # Tipos TypeScript
    └── manga.interface.ts
```

### Módulos a criar:

1. **MangaModule**
   - CRUD completo
   - Busca (texto + semântica)
   - Upload de imagens
   - Gerenciar tags/creators

2. **TagModule**
   - CRUD tags
   - Listar por tipo
   - Estatísticas de uso

3. **AiModule**
   - Chat com Gemini
   - Recomendações
   - Geração de embeddings

4. **StatsModule**
   - Dashboard
   - Gráficos
   - Métricas

5. **CollectionModule**
   - CRUD coleções
   - Adicionar/remover mangás
   - Compartilhamento público

6. **HealthModule**
   - Health check
   - Status do banco
   - Métricas de performance

---

## 🔄 Fase 4: Migrations

### Migrations necessárias:

1. `create-mangas.migration.ts`
2. `create-manga-names.migration.ts`
3. `create-tags.migration.ts`
4. `create-manga-tags.migration.ts`
5. `create-creators.migration.ts`
6. `create-manga-creators.migration.ts`
7. `create-reminders.migration.ts`
8. `create-reading-sessions.migration.ts`
9. `create-collections.migration.ts`
10. `create-collection-mangas.migration.ts`

### Seeders:

1. `seed-genres.seeder.ts` - Gêneros padrão
2. `seed-demographics.seeder.ts` - Demografia padrão
3. `seed-themes.seeder.ts` - Temas padrão

---

## 🔄 Fase 5: Docker Update

### Dockerfile

Atualizar para build NestJS:
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
CMD ["node", "dist/main.js"]
```

### docker-compose.yml

Atualizar comando:
```yaml
backend:
  command: npm run start:dev
```

---

## 📊 Checklist Geral

### Fase 1: ✅ Setup Base (COMPLETO)
- [x] Instalar NestJS e dependências
- [x] Criar estrutura base (main.ts, app.module.ts)
- [x] Configurar Sequelize
- [x] Criar 10 models com relações
- [x] Configurar Swagger
- [x] Setup validação global

### Fase 2: Contracts e DTOs
- [ ] Criar contracts ts-rest
- [ ] Criar DTOs para cada módulo
- [ ] Adicionar validações com class-validator

### Fase 3: Modules
- [ ] MangaModule (controller + service + repository)
- [ ] TagModule
- [ ] AiModule (integrar Gemini)
- [ ] StatsModule
- [ ] CollectionModule
- [ ] HealthModule

### Fase 4: Migrations
- [ ] Criar 10 migrations
- [ ] Criar seeders
- [ ] Testar migração de dados existentes

### Fase 5: Docker
- [ ] Atualizar Dockerfile
- [ ] Atualizar docker-compose.yml
- [ ] Atualizar scripts package.json
- [ ] Testar build e deploy

### Fase 6: Testes
- [ ] Configurar Jest
- [ ] Testes unitários
- [ ] Testes e2e
- [ ] Testar endpoints via Swagger

---

## 🎯 Próximos Passos Imediatos

1. Criar contracts ts-rest para Manga
2. Criar DTOs de validação
3. Criar MangaModule completo
4. Testar primeiro endpoint

---

## 📝 Observações

### Vantagens do NestJS sobre Express puro:

1. **Modularidade:** Cada feature é um módulo isolado
2. **Injeção de Dependência:** DI nativo, testável
3. **Decorators:** Código limpo e declarativo
4. **Swagger:** Documentação automática
5. **Validação:** class-validator integrado
6. **TypeScript:** First-class citizen
7. **ts-rest:** Contracts type-safe compartilhados

### Decisões Arquiteturais:

1. **Sequelize:** Mantido (models + migrations)
2. **ts-rest:** Adicionado para contracts
3. **Repository Pattern:** Camada de acesso a dados
4. **Service Layer:** Business logic isolada
5. **DTO Pattern:** Validação e transformação

---

**Última Atualização:** 2025-12-07 23:30
**Próxima Fase:** Contracts e DTOs
