# Regras de Importacao - Dados Kenmei

Este documento define as regras para importar/atualizar mangas a partir dos arquivos JSON em `data-items/`.

---

## 1. REGRA PRINCIPAL: Deteccao de Duplicatas

**Objetivo:** Evitar duplicatas e atualizar obras existentes.

**Estrategia de Busca (case-insensitive):**

1. Busca exata (ILIKE) por `title` em `mangas.primary_title` E `manga_names.name`
2. Busca exata (ILIKE) por `alternativeTitles[]` em `mangas.primary_title` E `manga_names.name`
3. **Se encontrar match** -> ATUALIZAR obra existente
4. **Se nao encontrar** -> CRIAR nova obra

```sql
-- Exemplo de busca completa (case-insensitive)
SELECT DISTINCT m.id FROM mangas m
LEFT JOIN manga_names mn ON m.id = mn.manga_id
WHERE
  -- Busca exata pelo titulo principal (case-insensitive)
  LOWER(m.primary_title) = LOWER($title)
  OR LOWER(mn.name) = LOWER($title)
  -- Busca exata pelos titulos alternativos (case-insensitive)
  OR LOWER(m.primary_title) = ANY(SELECT LOWER(unnest($alternativeTitles)))
  OR LOWER(mn.name) = ANY(SELECT LOWER(unnest($alternativeTitles)));
```

---

## 2. Mapeamento: JSON -> Banco de Dados

### 2.1 Campos Diretos -> `mangas`

| Campo JSON | Campo DB | Regra de Atualizacao |
|------------|----------|----------------------|
| `title` | `primary_title` | Obrigatorio, nao atualizar se existir |
| `description` | `synopsis` | Atualizar se NULL ou novo for mais longo |
| `score` | `rating` | Atualizar sempre (converter para NUMERIC) |
| `chaptersCount` | `total_chapters` | Atualizar se novo > atual |
| `url` | `url` | Manter existente (preferencia do usuario) |

### 2.2 Campos FK -> `mangas` (Lookup Tables)

| Campo JSON | Campo DB | Tabela Lookup | Matching |
|------------|----------|---------------|----------|
| `publicationStatus` | `status_id` | `status` | Por `name_english` |
| `contentType` | `type_id` | `types` | Por `name_english` |
| `contentRating` | `rating_id` | `ratings` | Por `name_english` |

```sql
-- Exemplo: buscar status_id (case-insensitive)
SELECT id FROM status WHERE LOWER(name_english) = LOWER('Releasing');
```

### 2.3 Imagens -> `cover`

**Regra:** Somente processar imagem se o manga NAO tiver imagem existente (`image_url` IS NULL).

**Prioridade de selecao (quando aplicavel):**
1. `cover.webp.small` (preferencial)
2. `cover.jpeg.small` (fallback)
3. `cover.webp.large` (se small nao existir)
4. `cover.jpeg.large` (ultimo recurso)

**Acao (somente para novos ou sem imagem):**
- Salvar URL em `mangas.image_url`
- Download posterior salva em `mangas.image_filename`

---

## 3. Relacionamentos Many-to-Many

### 3.1 `classifications[]` -> Multiplas Tabelas

```javascript
classifications.forEach(c => {
  switch(c.category) {
    case 'genre':      // -> manga_genres
    case 'theme':      // -> manga_themes
    case 'character':  // -> manga_characters
    case 'content_warning': // -> manga_warnings
  }
});
```

| Categoria JSON | Tabela Junction | Tabela Lookup | Matching |
|----------------|-----------------|---------------|----------|
| `genre` | `manga_genres` | `genres` | `name_english` |
| `theme` | `manga_themes` | `themes` | `name_english` |
| `character` | `manga_characters` | `characters` | `name_english` |
| `content_warning` | `manga_warnings` | `warnings` | `name_english` |

**Regra:** Adicionar novos (ON CONFLICT DO NOTHING), NAO remover existentes.

### 3.2 `alternativeTitles[]` -> `manga_names`

```sql
INSERT INTO manga_names (manga_id, name, language, is_official)
VALUES ($manga_id, $title, 'unknown', false)
ON CONFLICT (manga_id, name) DO NOTHING;
```

**Tambem adicionar:**
- `titleEN` -> language: `'en'`, is_official: `true`
- `titleENJP` -> language: `'ja-romaji'`, is_official: `true`

### 3.3 `mangaSources[]` -> `manga_links`

| Campo JSON | Campo DB | Observacao |
|------------|----------|------------|
| `name` | `site_id` | Buscar em `sites` por `name` |
| `seriesURL` | `url` | URL direta do manga |
| `siteActive` | `is_active` | Se o site esta ativo |
| `deprecated` | `is_active` | Se `true`, `is_active = false` |

```sql
INSERT INTO manga_links (manga_id, site_id, url, is_primary, is_active)
VALUES ($manga_id, $site_id, $seriesURL, $isFirst, $siteActive AND NOT $deprecated)
ON CONFLICT (manga_id, url) DO UPDATE SET is_active = EXCLUDED.is_active;
```

---

## 4. Campos Ignorados

| Campo JSON | Motivo |
|------------|--------|
| `id` | ID interno do Kenmei |
| `slug` | Redundante com URL |
| `malID` | MyAnimeList ID, nao mapeado |
| `scoreDistribution` | Usamos apenas `score` final |
| `usersTracking` | Estatistica do Kenmei |
| `topListings` | Rankings externos |

---

## 5. Fluxo de Processamento

```
PARA CADA arquivo JSON em data-items/:

  1. LER JSON
     - Extrair objeto `data`
     - Validar campos obrigatorios (title)

  2. BUSCAR MANGA EXISTENTE (case-insensitive)
     a. LOWER(primary_title) = LOWER(JSON.title) OU LOWER(manga_names.name) = LOWER(JSON.title)
     b. LOWER(primary_title) IN LOWER(JSON.alternativeTitles) OU LOWER(manga_names.name) IN LOWER(JSON.alternativeTitles)

  3. SE ENCONTROU (manga_id existente):
     - UPDATE mangas (aplicar regras da secao 2.1)
     - Preservar dados do usuario (url, user_notes, last_chapter_read)

  4. SE NAO ENCONTROU:
     - INSERT INTO mangas RETURNING id
     - Usar manga_id retornado

  5. PROCESSAR RELACIONAMENTOS:
     - INSERT manga_names (alternativeTitles + titleEN + titleENJP)
     - INSERT manga_genres (classifications[genre])
     - INSERT manga_themes (classifications[theme])
     - INSERT manga_characters (classifications[character])
     - INSERT manga_warnings (classifications[content_warning])
     - INSERT manga_links (mangaSources)

  6. ATUALIZAR FKs:
     - UPDATE mangas SET status_id, type_id, rating_id
```

---

## 6. Regras de Atualizacao

| Campo | Quando Atualizar |
|-------|------------------|
| `synopsis` | Se atual for NULL ou novo for mais longo |
| `rating` | Sempre (score do Kenmei e confiavel) |
| `total_chapters` | Se novo > atual |
| `image_url` | Se atual for NULL |
| `status_id` | Sempre |
| `type_id` | Sempre |
| `rating_id` | Sempre |
| `url` | NUNCA (preferencia do usuario) |
| `user_notes` | NUNCA (dados do usuario) |
| `last_chapter_read` | NUNCA (progresso do usuario) |

---

## 7. Cache de Lookup Tables

Carregar em memoria antes do processamento para evitar queries repetidas:

```sql
SELECT id, name_english FROM status;
SELECT id, name_english FROM types;
SELECT id, name_english FROM ratings;
SELECT id, name_english FROM genres;
SELECT id, name_english FROM themes;
SELECT id, name_english FROM characters;
SELECT id, name_english FROM warnings;
SELECT id, name FROM sites;
```

---

## 8. Tratamento de Erros

| Erro | Acao |
|------|------|
| JSON invalido | Log erro, pular arquivo |
| Manga sem titulo | Log erro, pular arquivo |
| FK nao encontrada | Log warning, continuar sem FK |
| Duplicate key | Ignorar (ON CONFLICT DO NOTHING) |
| Erro de conexao | Retry com backoff exponencial |

---

## 9. Estrutura do JSON (Referencia)

```javascript
{
  "data": {
    // Identificadores
    "id": 2254,
    "slug": "one-piece",
    "url": "https://www.kenmei.co/series/one-piece",
    "malID": 13,

    // Informacoes basicas
    "title": "One Piece",
    "titleEN": "One Piece",
    "titleENJP": null,
    "description": "Descricao completa...",
    "alternativeTitles": ["ワンピース", "원피스", ...],

    // Classificacao
    "contentType": "Manga",           // -> types
    "contentRating": "Safe",          // -> ratings
    "publicationStatus": "Releasing", // -> status

    // Estatisticas
    "score": "9.04",
    "chaptersCount": 1134,

    // Classificacoes detalhadas
    "classifications": [
      { "category": "genre", "name": "Action" },
      { "category": "theme", "name": "Delinquents" },
      { "category": "character", "name": "Male Protagonist" },
      { "category": "content_warning", "name": "Gore" }
    ],

    // Imagens
    "cover": {
      "webp": { "large": "url", "small": "url" },
      "jpeg": { "large": "url", "small": "url" }
    },

    // Fontes de leitura
    "mangaSources": [
      {
        "name": "MangaDex",
        "seriesURL": "https://mangadex.org/title/...",
        "siteActive": true,
        "deprecated": false,
        "chaptersCount": 1134
      }
    ]
  }
}
```

---

*Ultima atualizacao: 2026-01-04*
