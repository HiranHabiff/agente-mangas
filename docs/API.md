# Manga Agent - API Documentation

## Visão Geral

Este documento descreve todas as ferramentas (tools) disponíveis no servidor MCP do Manga Agent.

## Autenticação

Não há autenticação necessária quando usando via MCP local. Para uso em produção, configure variáveis de ambiente apropriadas.

---

## Ferramentas CRUD de Mangás

### `create_manga`

Cria um novo mangá no banco de dados.

**Parâmetros:**

```typescript
{
  primary_title: string;          // Obrigatório
  alternative_names?: string[];   // Nomes alternativos
  url?: string;                   // URL onde ler o mangá
  image_url?: string;             // URL da capa
  synopsis?: string;              // Sinopse/descrição
  tags?: string[];                // Tags/gêneros
  status?: 'reading' | 'completed' | 'paused' | 'dropped' | 'plan_to_read';
  rating?: number;                // 0-10
  total_chapters?: number;        // Total de capítulos (se conhecido)
}
```

**Exemplo:**

```javascript
{
  "primary_title": "Solo Leveling",
  "alternative_names": ["Na Honjaman Level Up", "Only I Level Up"],
  "url": "https://mangadex.org/title/...",
  "image_url": "https://example.com/cover.jpg",
  "synopsis": "Um caçador de rank E se torna o mais forte...",
  "tags": ["Action", "Fantasy", "Leveling"],
  "status": "reading",
  "rating": 9.5,
  "total_chapters": 179
}
```

**Resposta:**

```
✓ Manga created successfully!

ID: 550e8400-e29b-41d4-a716-446655440000
Title: Solo Leveling
Status: reading
URL: https://mangadex.org/title/...
```

---

### `search_manga`

Busca mangás por texto, tags, status ou rating.

**Parâmetros:**

```typescript
{
  query?: string;                 // Busca em títulos e sinopse
  search_type?: 'title' | 'semantic' | 'all';  // Tipo de busca
  tags?: string[];                // Filtrar por tags
  status?: string[];              // Filtrar por status
  min_rating?: number;            // Rating mínimo (0-10)
  limit?: number;                 // Máximo de resultados (padrão: 20)
  offset?: number;                // Paginação (padrão: 0)
}
```

**Exemplo:**

```javascript
{
  "query": "leveling",
  "tags": ["Action", "Fantasy"],
  "status": ["reading"],
  "min_rating": 8.0,
  "limit": 10
}
```

**Resposta:**

```
Found 15 manga(s) (showing 10):

1. Solo Leveling (reading)
  ID: 550e8400-e29b-41d4-a716-446655440000
  Chapter: 120/179
  Rating: 9.5/10
  Tags: Action, Fantasy, Leveling

2. The Beginning After The End (reading)
  ID: 660e9500-f39c-52e5-b827-557766551111
  Chapter: 156/200
  Rating: 9.2/10
  Tags: Action, Fantasy, Reincarnation

...
```

---

### `get_manga`

Obtém detalhes completos de um mangá específico.

**Parâmetros:**

```typescript
{
  manga_id: string;  // UUID do mangá
}
```

**Exemplo:**

```javascript
{
  "manga_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Resposta:**

```
📚 Solo Leveling

ID: 550e8400-e29b-41d4-a716-446655440000
Status: reading
Rating: 9.5
Progress: Chapter 120/179
URL: https://mangadex.org/title/...
Reading Sessions: 45
Last Read: 2025-12-05

Alternative Names:
  • Na Honjaman Level Up
  • Only I Level Up

Tags: Action, Fantasy, Leveling, System

Synopsis:
Um caçador de rank E se torna o mais forte...
```

---

### `update_manga`

Atualiza informações de um mangá existente.

**Parâmetros:**

```typescript
{
  manga_id: string;
  updates: {
    primary_title?: string;
    add_names?: string[];       // Adicionar nomes alternativos
    remove_names?: string[];    // Remover nomes alternativos
    url?: string;
    synopsis?: string;
    user_notes?: string;
    status?: string;
    rating?: number;
    total_chapters?: number;
    add_tags?: string[];        // Adicionar tags
    remove_tags?: string[];     // Remover tags
  }
}
```

**Exemplo:**

```javascript
{
  "manga_id": "550e8400-e29b-41d4-a716-446655440000",
  "updates": {
    "rating": 10,
    "add_tags": ["Overpowered MC"],
    "user_notes": "Uma obra-prima!"
  }
}
```

---

### `delete_manga`

Deleta um mangá (soft delete por padrão).

**Parâmetros:**

```typescript
{
  manga_id: string;
  permanent?: boolean;  // false = soft delete, true = permanente
}
```

**Exemplo:**

```javascript
{
  "manga_id": "550e8400-e29b-41d4-a716-446655440000",
  "permanent": false
}
```

---

## Ferramentas de Rastreamento de Capítulos

### `track_chapter`

Atualiza o último capítulo lido e cria uma sessão de leitura.

**Parâmetros:**

```typescript
{
  manga_id: string;
  chapter_number: number;
  create_session?: boolean;      // Criar sessão de leitura (padrão: true)
  duration_minutes?: number;     // Tempo gasto lendo
  notes?: string;                // Notas sobre a leitura
}
```

**Exemplo:**

```javascript
{
  "manga_id": "550e8400-e29b-41d4-a716-446655440000",
  "chapter_number": 121,
  "duration_minutes": 15,
  "notes": "Excelente capítulo!"
}
```

**Resposta:**

```
✓ Chapter tracked successfully!

Manga: Solo Leveling
Chapter: 121
Progress: 121/179 (67%)
Status: reading
```

---

### `get_manga_stats`

Obtém estatísticas de leitura de um mangá.

**Parâmetros:**

```typescript
{
  manga_id: string;
}
```

**Resposta:**

```
📊 Reading Statistics

Progress: 121/179 (67.6%)
Status: reading
Rating: 9.5

Reading Activity:
• Total sessions: 45
• Chapters read: 121
• Total time: 675 minutes (11.3 hours)
• Average time per chapter: 15 minutes
```

---

## Ferramentas de Lembretes

### `set_reminder`

Cria um lembrete para um mangá.

**Parâmetros:**

```typescript
{
  manga_id: string;
  reminder_type?: 'update' | 'scheduled' | 'custom';
  scheduled_for?: string;        // ISO 8601 date-time
  message?: string;
  is_recurring?: boolean;
  recurrence_days?: number;      // Dias entre recorrências
}
```

**Exemplo:**

```javascript
{
  "manga_id": "550e8400-e29b-41d4-a716-446655440000",
  "reminder_type": "update",
  "scheduled_for": "2025-12-15T10:00:00Z",
  "message": "Verificar novos capítulos de Solo Leveling",
  "is_recurring": true,
  "recurrence_days": 7
}
```

---

### `list_reminders`

Lista lembretes ativos.

**Parâmetros:**

```typescript
{
  manga_id?: string;  // Opcional: filtrar por mangá
}
```

---

### `delete_reminder`

Deleta um lembrete.

**Parâmetros:**

```typescript
{
  reminder_id: string;
}
```

---

## Ferramentas de Imagens

### `download_image`

Baixa e armazena uma imagem de capa.

**Parâmetros:**

```typescript
{
  manga_id: string;
  image_url: string;
}
```

**Exemplo:**

```javascript
{
  "manga_id": "550e8400-e29b-41d4-a716-446655440000",
  "image_url": "https://example.com/cover.jpg"
}
```

**Resposta:**

```
✓ Image downloaded successfully!

Filename: 550e8400-e29b-41d4-a716-446655440000.jpg
Manga ID: 550e8400-e29b-41d4-a716-446655440000
```

---

## Ferramentas com IA

### `get_recommendations`

Obtém recomendações de mangás usando IA.

**Parâmetros:**

```typescript
{
  based_on_manga_id?: string;    // Baseado em um mangá específico
  based_on_tags?: string[];      // Baseado em tags
  limit?: number;                // Máximo de recomendações (padrão: 10)
}
```

**Exemplo 1 - Por Mangá:**

```javascript
{
  "based_on_manga_id": "550e8400-e29b-41d4-a716-446655440000",
  "limit": 5
}
```

**Exemplo 2 - Por Tags:**

```javascript
{
  "based_on_tags": ["Action", "Fantasy", "Leveling"],
  "limit": 10
}
```

---

### `analyze_reading_habits`

Analisa hábitos de leitura usando IA.

**Parâmetros:**

```typescript
{
  time_period_days?: number;  // Período em dias (padrão: 30)
}
```

**Resposta:**

```
📈 Reading Habits Analysis (Last 30 days)

Overview:
• Total mangas: 15
• Chapters read: 245
• Time spent: 3675 minutes (61.3 hours)
• Avg chapters/session: 5.4

Favorite Genres:
  • Action: 12 mangas
  • Fantasy: 10 mangas
  • Isekai: 7 mangas

Most Read:
  • Solo Leveling: 45 chapters
  • Tower of God: 38 chapters
```

---

### `extract_tags`

Extrai tags/gêneros de uma sinopse usando IA.

**Parâmetros:**

```typescript
{
  synopsis: string;
}
```

**Exemplo:**

```javascript
{
  "synopsis": "Um caçador de rank E obtém um sistema misterioso que lhe permite nivelar infinitamente, tornando-se o caçador mais forte do mundo."
}
```

**Resposta:**

```
🏷️ Extracted Tags:

Action, Fantasy, Leveling, System, Overpowered MC
```

---

## Ferramentas de Tags

### `list_tags`

Lista todas as tags disponíveis.

**Parâmetros:**

```typescript
{
  category?: string;  // Filtrar por categoria (genre, demographic, theme)
}
```

**Resposta:**

```
🏷️ Available Tags (25):

GENRE:
  Ação, Aventura, Comédia, Drama, Fantasia, Romance

DEMOGRAPHIC:
  Seinen, Shounen, Shoujo, Josei

THEME:
  Reencarnação, Revenge, Sistema, Cultivação, Tower
```

---

### `get_popular_tags`

Obtém as tags mais usadas.

**Parâmetros:**

```typescript
{
  limit?: number;  // Máximo de tags (padrão: 20)
}
```

**Resposta:**

```
🔥 Popular Tags:

1. Action (145 mangas)
2. Fantasy (132 mangas)
3. Isekai (87 mangas)
4. Adventure (76 mangas)
5. Shounen (65 mangas)
```

---

## Códigos de Erro

- `400` - Requisição inválida (parâmetros incorretos)
- `404` - Recurso não encontrado
- `500` - Erro interno do servidor
- `503` - Serviço externo indisponível (Gemini AI)

## Limites

- **Busca**: Máximo 100 resultados por chamada
- **Recomendações**: Máximo 50 por chamada
- **Embeddings**: 1 requisição/segundo (rate limit do Gemini)

## Exemplos de Uso com Linguagem Natural

Quando usando com Claude Desktop, você pode interagir naturalmente:

```
"Adicione o mangá Tower of God com rating 9"
"Qual capítulo eu parei em Solo Leveling?"
"Mostre todos os mangás de ação que estou lendo"
"Marque que li o capítulo 50 de One Piece"
"Crie um lembrete para verificar updates de Berserk na próxima semana"
"Recomende mangás parecidos com Solo Leveling"
"Analise meus hábitos de leitura do último mês"
```

O Claude interpretará seus comandos e executará as ferramentas apropriadas!
