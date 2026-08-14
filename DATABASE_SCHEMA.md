# Database Schema - Manga Manager

**Database:** PostgreSQL
**Name:** `manga_db`
**User:** `manga_user`
**Container:** `manga-postgres`

---

## Overview

Sistema de gerenciamento de mangás com suporte a:
- Catálogo de mangás com metadados completos
- Sistema de tags, gêneros e temas
- Rastreamento de leitura
- Sistema de lembretes
- Suporte a múltiplos idiomas (PT/EN)

---

## Entity Relationship Diagram (Simplified)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   mangas    │────<│ manga_tags   │>────│    tags     │
│             │     └──────────────┘     └─────────────┘
│             │     ┌──────────────┐     ┌─────────────┐
│             │────<│ manga_genres │>────│   genres    │
│             │     └──────────────┘     └─────────────┘
│             │     ┌──────────────┐     ┌─────────────┐
│             │────<│ manga_themes │>────│   themes    │
│             │     └──────────────┘     └─────────────┘
│             │     ┌──────────────┐     ┌─────────────┐
│             │────<│manga_creators│>────│  creators   │
│             │     └──────────────┘     └─────────────┘
│             │     ┌──────────────┐     ┌─────────────┐
│             │────<│manga_publish.│>────│ publishers  │
│             │     └──────────────┘     └─────────────┘
│             │     ┌──────────────┐     ┌─────────────┐
│             │────<│manga_charact.│>────│ characters  │
│             │     └──────────────┘     └─────────────┘
│             │     ┌──────────────┐     ┌─────────────┐
│             │────<│manga_warnings│>────│  warnings   │
│             │     └──────────────┘     └─────────────┘
│             │     ┌──────────────┐
│             │────<│ manga_names  │ (alternative titles)
│             │     └──────────────┘
│             │     ┌──────────────┐     ┌─────────────┐
│             │────<│ manga_links  │>───>│   sites     │ (optional FK)
│             │     └──────────────┘     └─────────────┘
│             │     ┌──────────────┐
│             │────<│reading_sess. │ (reading history)
│             │     └──────────────┘
│             │     ┌──────────────┐
│             │────<│  reminders   │ (notifications)
│             │     └──────────────┘
│             │
│             │────>┌─────────────┐ (FK: status_id)
│             │     │   status    │
│             │────>├─────────────┤ (FK: type_id)
│             │     │   types     │
│             │────>├─────────────┤ (FK: rating_id)
│             │     │   ratings   │
│             │────>├─────────────┤ (FK: demographic_id)
│             │     │ demographic │
└─────────────┘     └─────────────┘

```

---

## Tables

### Core Tables

#### `mangas`
Main table storing manga information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | Primary key |
| `primary_title` | VARCHAR(750) | NO | | Main title |
| `url` | TEXT | YES | | Source URL |
| `image_filename` | VARCHAR(500) | YES | | Local image path |
| `image_url` | TEXT | YES | | Remote image URL |
| `last_chapter_read` | INTEGER | YES | 0 | Current reading progress |
| `total_chapters` | INTEGER | YES | | Total available chapters |
| `rating` | NUMERIC | YES | | User rating |
| `status` | VARCHAR(50) | YES | 'reading' | Reading status |
| `synopsis` | TEXT | YES | | Description/summary |
| `user_notes` | TEXT | YES | | Personal notes |
| `embedding` | VECTOR | YES | | AI embedding for search |
| `legacy_id` | INTEGER | YES | | Migration reference |
| `legacy_parent_id` | INTEGER | YES | | Parent manga reference |
| `created_at` | TIMESTAMPTZ | YES | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMPTZ | YES | CURRENT_TIMESTAMP | |
| `last_read_at` | TIMESTAMPTZ | YES | | Last reading timestamp |
| `deleted_at` | TIMESTAMPTZ | YES | | Soft delete |
| `status_id` | UUID | YES | | → status.id (publication status) |
| `type_id` | UUID | YES | | → types.id (Manga/Manhwa/Manhua) |
| `rating_id` | UUID | YES | | → ratings.id (content rating) |
| `demographic_id` | UUID | YES | | → demographic.id (target audience) |

**Indexes:** primary_title (trigram), synopsis (trigram), status, rating, last_read_at, legacy_id, status_id, type_id, rating_id, demographic_id

---

### Lookup Tables (with bilingual support)

All lookup tables follow this pattern:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(100) | Display name (PT-BR) |
| `name_english` | VARCHAR(100) | English name for API matching |
| `color` | VARCHAR(7) | Hex color for UI badges |
| `description` | TEXT | Optional description |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `status`
Publication status of works.

| name | name_english | color | description |
|------|--------------|-------|-------------|
| Finished | Finished | #28a745 | Obra finalizada/completa |
| Releasing | Releasing | #007bff | Em publicação ativa |
| On Hiatus | On Hiatus | #ffc107 | Publicação em hiato/pausa |
| Cancelled | Cancelled | #dc3545 | Publicação cancelada |

#### `types`
Asian comic types by country of origin.

| name | name_english | color | description |
|------|--------------|-------|-------------|
| Manga | Manga | #e74c3c | Quadrinhos japoneses (Japão) |
| Manhwa | Manhwa | #3498db | Quadrinhos coreanos (Coreia do Sul) |
| Manhua | Manhua | #2ecc71 | Quadrinhos chineses (China) |

#### `ratings`
Content rating/classification.

| name | name_english | color | description |
|------|--------------|-------|-------------|
| Safe | Safe | #28a745 | Conteúdo seguro para todas as idades |
| Erotica | Erotica | #fd7e14 | Conteúdo erótico (18+) |
| Pornographic | Pornographic | #dc3545 | Conteúdo pornográfico explícito (18+) |

#### `demographic`
Target audience.

| name | name_english | color | description |
|------|--------------|-------|-------------|
| Seinen | Seinen | #6c757d | Público-alvo: homens adultos (18+) |
| Shounen | Shounen | #ff6b6b | Público-alvo: meninos adolescentes |
| Shoujo | Shoujo | #ff69b4 | Público-alvo: meninas adolescentes |
| Josei | Josei | #9b59b6 | Público-alvo: mulheres adultas (18+) |

#### `characters`
Protagonist types.

| name | name_english | color |
|------|--------------|-------|
| Male Protagonist | Male Protagonist | #3498db |
| Female Protagonist | Female Protagonist | #e91e63 |

#### `warnings`
Content warnings/triggers.

| name | name_english | color |
|------|--------------|-------|
| Gore | Gore | #dc3545 |
| Torture | Torture | #dc3545 |
| Suicide | Suicide | #6c757d |

#### `genres` (24 records)
Literary genres. Examples:

| name | name_english | color |
|------|--------------|-------|
| Ação | Action | #e74c3c |
| Aventura | Adventure | #f39c12 |
| Comédia | Comedy | #f1c40f |
| Drama | Drama | #9b59b6 |
| Fantasia | Fantasy | #8e44ad |
| Horror | Horror | #2c3e50 |
| Romance | Romance | #e91e63 |

#### `themes` (36 records)
Thematic elements. Examples:

| name | name_english | color |
|------|--------------|-------|
| Artes Marciais | Martial Arts | #ff9800 |
| Isekai | Isekai | #17a2b8 |
| Reencarnação | Reincarnation | #3f51b5 |
| Vingança | Revenge | #e83e8c |
| Villainess | Villainess | #e91e63 |

#### `tags` (148 records)
General classification tags. Includes genres, themes, and metadata.

| Column | Type | Description |
|--------|------|-------------|
| `category` | VARCHAR(50) | Optional category grouping |

#### `sites`
Manga source websites. **Does not have `name_english`.**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(100) | Site name |
| `url` | VARCHAR(255) | Base URL |
| `image` | VARCHAR(255) | Logo path |
| `language` | VARCHAR(50) | Primary language |
| `active` | BOOLEAN | Is available for scraping |
| `description` | TEXT | Site description |

---

### Junction Tables (Many-to-Many)

#### `manga_tags`
```sql
manga_id  UUID → mangas.id (ON DELETE CASCADE)
tag_id    UUID → tags.id (ON DELETE CASCADE)
PRIMARY KEY (manga_id, tag_id)
```

#### `manga_genres`
```sql
manga_id  UUID → mangas.id (ON DELETE CASCADE)
genre_id  UUID → genres.id (ON DELETE CASCADE)
PRIMARY KEY (manga_id, genre_id)
```

#### `manga_themes`
```sql
manga_id  UUID → mangas.id (ON DELETE CASCADE)
theme_id  UUID → themes.id (ON DELETE CASCADE)
PRIMARY KEY (manga_id, theme_id)
```

#### `manga_creators`
```sql
manga_id    UUID → mangas.id (ON DELETE CASCADE)
creator_id  UUID → creators.id (ON DELETE CASCADE)
PRIMARY KEY (manga_id, creator_id)
```

#### `manga_publishers`
```sql
manga_id       UUID → mangas.id (ON DELETE CASCADE)
publisher_id   UUID → publishers.id (ON DELETE CASCADE)
publication_date DATE
PRIMARY KEY (manga_id, publisher_id)
```

#### `manga_characters`
```sql
manga_id      UUID → mangas.id (ON DELETE CASCADE)
character_id  UUID → characters.id (ON DELETE CASCADE)
PRIMARY KEY (manga_id, character_id)
```
Relates mangas with protagonist types (Male/Female Protagonist).

#### `manga_warnings`
```sql
manga_id    UUID → mangas.id (ON DELETE CASCADE)
warning_id  UUID → warnings.id (ON DELETE CASCADE)
PRIMARY KEY (manga_id, warning_id)
```
Relates mangas with content warnings (Gore, Torture, Suicide).

---

### Supporting Tables

#### `manga_names`
Alternative titles/names for mangas.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `manga_id` | UUID | → mangas.id |
| `name` | VARCHAR(750) | Alternative title |
| `language` | VARCHAR(10) | Language code (default: 'pt-BR') |
| `is_official` | BOOLEAN | Is official title |

**Index:** name (trigram for fuzzy search)

#### `manga_links`
Alternative URLs/links for reading the manga.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `manga_id` | UUID | → mangas.id (CASCADE) |
| `site_id` | UUID | → sites.id (SET NULL, optional) |
| `url` | TEXT | Direct URL to the manga |
| `label` | VARCHAR(100) | Custom label (e.g., "Extra Chapters", "Colored Version") |
| `is_primary` | BOOLEAN | Is the primary/preferred link |
| `is_active` | BOOLEAN | Is the link still working |
| `last_checked_at` | TIMESTAMPTZ | Last time the link was verified |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Indexes:** manga_id, site_id, is_primary, is_active

#### `creators`
Authors and artists.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(200) | Creator name |
| `role` | VARCHAR(50) | 'author', 'artist', etc |

**Unique:** (name, role)

#### `publishers`
Publishing companies.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(200) | Publisher name |
| `country` | VARCHAR(100) | Country of origin |
| `website` | TEXT | Official website |

#### `reading_sessions`
History of reading sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `manga_id` | UUID | → mangas.id |
| `chapter_number` | INTEGER | Chapter read |
| `started_at` | TIMESTAMPTZ | Session start |
| `duration_minutes` | INTEGER | Reading duration |
| `notes` | TEXT | Session notes |

#### `reminders`
Reminder system for manga updates.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `manga_id` | UUID | → mangas.id |
| `reminder_type` | VARCHAR(50) | 'update', 'continue', etc |
| `message` | TEXT | Custom message |
| `scheduled_for` | TIMESTAMPTZ | When to trigger |
| `is_active` | BOOLEAN | Is enabled |
| `is_recurring` | BOOLEAN | Repeats |
| `recurrence_days` | INTEGER | Days between recurrence |
| `last_triggered_at` | TIMESTAMPTZ | Last trigger time |

---

## Views

#### `v_manga_complete`
Complete manga information with aggregated arrays.

Returns: id, primary_title, url, image_filename, image_url, last_chapter_read, total_chapters, rating, status, synopsis, user_notes, created_at, updated_at, last_read_at, alternative_names[], tags[], genres[], themes[], creators[], publishers[]

#### `v_active_reminders`
Active reminders with manga titles.

Returns: id, manga_id, manga_title, reminder_type, message, scheduled_for, is_recurring, recurrence_days

#### `v_tags_with_count`
Tags with manga usage count.

Returns: id, name, name_english, color, category, manga_count (ordered by manga_count DESC)

---

## Extensions

- `uuid-ossp` - UUID generation
- `pg_trgm` - Trigram fuzzy search
- `vector` - AI embeddings (pgvector)

---

## Connection

```javascript
// Node.js / Backend
const config = {
  host: 'localhost',
  port: 5432,
  database: 'manga_db',
  user: 'manga_user',
  password: 'manga123'
};
```

```bash
# Docker
docker exec -it manga-postgres psql -U manga_user -d manga_db
```

---

## Statistics

Contagens reais do banco de desenvolvimento:

| Table | Records |
|-------|---------|
| manga_names | 202.391 |
| manga_genres | 92.286 |
| manga_links | 45.489 |
| mangas | 35.232 |
| manga_tags | 10.150 |
| reading_sessions | 3.727 |
| tags | 148 |
| sites | 129 |
| themes | 32 |
| genres | 17 |
| reminders | 14 |
| reading_lists | 4 |
| status | 4 |
| demographic | 4 |
| types | 3 |
| ratings | 3 |
| warnings | 3 |
| characters | 2 |

---

## Listas de leitura

Recurso adicionado depois da primeira versão deste documento.

### `reading_lists`

Coleções nomeadas criadas pelo usuário.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK, `uuid_generate_v4()` |
| `name` | varchar(100) | nome da lista |
| `description` | text | opcional |
| `color` | varchar(7) | cor de destaque em hex, opcional |
| `icon` | varchar(50) | opcional |
| `is_public` | boolean | default `false` |
| `sort_order` | int | default `0` |
| `created_at` / `updated_at` | timestamptz | default `now()` |

Índices: `idx_reading_lists_name`, `idx_reading_lists_sort_order`.

### `manga_reading_lists`

Junção N:N entre `mangas` e `reading_lists`.

| Coluna | Tipo | Notas |
|---|---|---|
| `manga_id` | uuid | FK → `mangas.id`, `ON DELETE CASCADE` |
| `list_id` | uuid | FK → `reading_lists.id`, `ON DELETE CASCADE` |
| `sort_order` | int | default `0` |
| `notes` | text | opcional |
| `added_at` | timestamptz | default `now()` |

PK composta `(manga_id, list_id)`. Índices em cada uma das FKs.

A definição canônica de todas as tabelas está em
[`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) — este documento é
uma visão de apoio e pode ficar atrás dele.

---

*Last updated: 2026-08-14 (contagens reais + listas de leitura)*
