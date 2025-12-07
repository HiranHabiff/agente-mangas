# 🚀 Manga Agent REST API

**Base URL:** `http://localhost:3000`

API REST completa para gerenciar sua coleção de mangás.

---

## 📚 Endpoints Disponíveis

### Health Check

#### GET `/health`
Verifica se a API está funcionando.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-06T04:06:04.123Z"
}
```

---

## 📖 Mangás

### GET `/api/mangas`
Lista todos os mangás com filtros opcionais.

**Query Parameters:**
- `query` (string) - Busca por título
- `status` (string) - Filtrar por status: `reading`, `completed`, `paused`, `dropped`, `plan_to_read` (separar por vírgula)
- `tags` (string) - Filtrar por tags (separar por vírgula)
- `minRating` (number) - Rating mínimo (0-10)
- `limit` (number) - Limite de resultados (default: 50)
- `offset` (number) - Offset para paginação (default: 0)

**Exemplo:**
```bash
curl "http://localhost:3000/api/mangas?status=reading&limit=10"
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid-here",
      "primary_title": "Solo Leveling",
      "url": "https://...",
      "image_filename": "uuid.jpg",
      "last_chapter_read": 195,
      "status": "reading",
      "rating": 9.5,
      "created_at": "2025-12-06T00:00:00.000Z",
      "updated_at": "2025-12-06T00:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 859,
    "hasMore": true
  }
}
```

---

### GET `/api/mangas/:id`
Obtém detalhes de um mangá específico.

**Exemplo:**
```bash
curl "http://localhost:3000/api/mangas/550e8400-e29b-41d4-a716-446655440000"
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "primary_title": "Solo Leveling",
  "alternative_names": ["나 혼자만 레벨업", "Only I Level Up"],
  "url": "https://...",
  "image_filename": "550e8400.jpg",
  "image_url": "https://...",
  "last_chapter_read": 195,
  "total_chapters": 200,
  "rating": 9.5,
  "status": "reading",
  "synopsis": "...",
  "user_notes": "Great manhwa!",
  "tags": ["Action", "Fantasy", "Leveling"],
  "created_at": "2025-12-06T00:00:00.000Z",
  "updated_at": "2025-12-06T00:00:00.000Z",
  "last_read_at": "2025-12-06T00:00:00.000Z"
}
```

---

### POST `/api/mangas`
Cria um novo mangá.

**Body:**
```json
{
  "primary_title": "Berserk",
  "alternative_names": ["ベルセルク"],
  "url": "https://...",
  "image_url": "https://...",
  "status": "reading",
  "rating": 10,
  "synopsis": "Epic dark fantasy manga...",
  "tags": ["Dark Fantasy", "Seinen"]
}
```

**Response:** `201 Created`
```json
{
  "id": "new-uuid",
  "primary_title": "Berserk",
  "status": "reading",
  ...
}
```

---

### PATCH `/api/mangas/:id`
Atualiza um mangá existente.

**Body (todos os campos são opcionais):**
```json
{
  "rating": 9.5,
  "status": "completed",
  "user_notes": "Finished reading!",
  "add_names": ["New Alternative Name"],
  "remove_names": ["Old Name"],
  "add_tags": ["New Genre"],
  "remove_tags": ["Old Genre"]
}
```

**Response:** `200 OK`

---

### DELETE `/api/mangas/:id`
Deleta um mangá (soft delete por padrão).

**Query Parameters:**
- `permanent` (boolean) - Se `true`, deleta permanentemente

**Exemplo:**
```bash
curl -X DELETE "http://localhost:3000/api/mangas/uuid-here?permanent=false"
```

**Response:** `204 No Content`

---

## 📊 Estatísticas

### GET `/api/stats`
Retorna estatísticas gerais da coleção.

**Response:**
```json
{
  "total": 2940,
  "reading": 859,
  "completed": 450,
  "paused": 120,
  "dropped": 80,
  "plan_to_read": 1431,
  "with_covers": 768,
  "avg_rating": 7.85,
  "avg_chapters_read": 45.2
}
```

---

### GET `/api/stats/top-read`
Lista os mangás mais lidos.

**Query Parameters:**
- `limit` (number) - Quantidade de resultados (default: 10)

**Response:**
```json
[
  {
    "id": "uuid",
    "primary_title": "Martial Peak",
    "last_chapter_read": 1377,
    "status": "reading"
  },
  ...
]
```

---

### GET `/api/stats/recently-updated`
Lista os mangás atualizados recentemente.

**Query Parameters:**
- `limit` (number) - Quantidade de resultados (default: 10)

**Response:**
```json
[
  {
    "id": "uuid",
    "primary_title": "Solo Leveling",
    "updated_at": "2025-12-06T00:00:00.000Z"
  },
  ...
]
```

---

## 📖 Progresso de Leitura

### POST `/api/mangas/:id/chapters`
Atualiza o progresso de leitura.

**Body:**
```json
{
  "chapterNumber": 196,
  "createSession": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "primary_title": "Solo Leveling",
  "last_chapter_read": 196,
  "updated_at": "2025-12-06T04:10:00.000Z"
}
```

---

### GET `/api/mangas/:id/history`
Retorna histórico de leitura.

**Query Parameters:**
- `limit` (number) - Quantidade de sessões (default: 50)

**Response:**
```json
[
  {
    "id": "session-uuid",
    "manga_id": "manga-uuid",
    "chapter_number": 195,
    "started_at": "2025-12-05T20:00:00.000Z",
    "duration_minutes": 15,
    "notes": "Great chapter!"
  },
  ...
]
```

---

## 🖼️ Imagens

### POST `/api/mangas/:id/image`
Baixa uma imagem de URL e salva localmente.

**Body:**
```json
{
  "imageUrl": "https://example.com/cover.jpg"
}
```

**Response:**
```json
{
  "filename": "550e8400-uuid.jpg",
  "url": "/images/550e8400-uuid.jpg"
}
```

---

### GET `/images/:filename`
Retorna a imagem estática.

**Exemplo:**
```
http://localhost:3000/images/550e8400-uuid.jpg
```

---

## 🔔 Lembretes

### GET `/api/reminders`
Lista todos os lembretes ativos.

**Response:**
```json
[
  {
    "id": "reminder-uuid",
    "manga_id": "manga-uuid",
    "manga_title": "Solo Leveling",
    "reminder_type": "scheduled",
    "message": "Check for new chapter",
    "scheduled_for": "2025-12-07T12:00:00.000Z",
    "is_active": true,
    "is_recurring": false
  },
  ...
]
```

---

### POST `/api/reminders`
Cria um novo lembrete.

**Body:**
```json
{
  "manga_id": "uuid",
  "reminder_type": "scheduled",
  "message": "Check for updates",
  "scheduled_for": "2025-12-10T12:00:00.000Z",
  "is_recurring": true,
  "recurrence_days": 7
}
```

**Response:** `201 Created`

---

### DELETE `/api/reminders/:id`
Deleta um lembrete.

**Response:** `204 No Content`

---

## 🏷️ Tags

### GET `/api/tags`
Lista todas as tags com contagem de uso.

**Response:**
```json
[
  {
    "id": "tag-uuid",
    "name": "Action",
    "category": "genre",
    "color": "#FF5733",
    "usage_count": 450
  },
  ...
]
```

---

### GET `/api/tags/popular`
Lista as tags mais populares.

**Query Parameters:**
- `limit` (number) - Quantidade de tags (default: 20)

**Response:**
```json
[
  {
    "id": "tag-uuid",
    "name": "Action",
    "usage_count": 450
  },
  {
    "id": "tag-uuid",
    "name": "Fantasy",
    "usage_count": 380
  },
  ...
]
```

---

## 🔧 Exemplos de Uso

### Buscar mangás de ação que estou lendo

```bash
curl "http://localhost:3000/api/mangas?status=reading&tags=Action&limit=10"
```

### Ver estatísticas da coleção

```bash
curl "http://localhost:3000/api/stats"
```

### Atualizar progresso de leitura

```bash
curl -X POST "http://localhost:3000/api/mangas/uuid-here/chapters" \
  -H "Content-Type: application/json" \
  -d '{"chapterNumber": 200, "createSession": true}'
```

### Top 20 mangás mais lidos

```bash
curl "http://localhost:3000/api/stats/top-read?limit=20"
```

---

## 🐛 Tratamento de Erros

Todos os erros retornam JSON estruturado:

**400 Bad Request:**
```json
{
  "error": "Validation error",
  "details": {
    "rating": "Must be between 0 and 10"
  }
}
```

**404 Not Found:**
```json
{
  "error": "Manga not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

---

## 🚀 Começar a Usar

**1. Iniciar servidor:**
```bash
cd backend
npm run api:watch
```

**2. Testar health check:**
```bash
curl http://localhost:3000/health
```

**3. Ver estatísticas:**
```bash
curl http://localhost:3000/api/stats
```

**4. Listar mangás:**
```bash
curl http://localhost:3000/api/mangas?limit=5
```

---

## 📝 Notas

- Todas as datas estão em formato ISO 8601
- IDs são UUIDs v4
- Paginação via `limit` e `offset`
- Filtros podem ser combinados
- Soft delete preserva dados (use `permanent=true` para deletar permanentemente)
- Imagens são servidas estaticamente em `/images/`

---

**Servidor rodando em:** `http://localhost:3000`  
**Última atualização:** 2025-12-06
