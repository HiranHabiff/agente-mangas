# Manga Agent — Gerenciador de Mangás

Sistema de catalogação e acompanhamento de leitura de mangás: coleção com filtros,
progresso por capítulo, listas de leitura, lembretes, detecção de duplicatas e
administração das tabelas de apoio (gêneros, temas, tags, sites…).

[![Node.js](https://img.shields.io/badge/Node.js-22-green.svg)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-e0234e.svg)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646cff.svg)](https://vite.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

---

## Stack

### Backend — [`backend/`](backend/)
- **NestJS 11** + TypeScript
- **Prisma 5** como ORM
- **PostgreSQL 15 + pgvector** (extensão disponível para embeddings)
- **Swagger** em `/docs`

### Frontend — [`frontend/`](frontend/)
- **React 19** + TypeScript
- **Vite 7** (build e dev server)
- **React Router 7** (SPA, sem SSR)
- **Tailwind CSS v4** + **shadcn/ui** (Radix)
- **TanStack Query** para dados

### Infra
- Docker + Docker Compose (3 serviços)
- nginx serve os estáticos do frontend em produção

---

## Estrutura

```
agente-mangas/
├── backend/                  # API NestJS + Prisma
│   ├── prisma/schema.prisma  # Schema do banco
│   ├── src/
│   │   ├── modules/          # mangas, lists, reminders, admin,
│   │   │                     # tags, stats, duplicates, health
│   │   ├── prisma/           # PrismaService
│   │   └── config/
│   └── Dockerfile            # Multi-stage (dev/prod)
│
├── frontend/                 # SPA React + Vite
│   ├── src/
│   │   ├── pages/            # Uma page por rota
│   │   ├── components/       # layout, manga, filters, admin, ui (shadcn)
│   │   ├── hooks/            # use-mangas, use-lists, use-admin, use-reminders
│   │   ├── lib/api.ts        # Cliente HTTP
│   │   └── globals.css       # Tokens de tema
│   ├── e2e/                  # Bateria e2e (29 testes, Chrome headless)
│   ├── Dockerfile            # Multi-stage (dev/prod com nginx)
│   └── nginx.conf            # SPA fallback
│
├── storage/                  # Dados persistentes (não versionado)
│   ├── images/               # Capas dos mangás
│   └── postgres/db/          # Volume do PostgreSQL
│
├── docker-compose.yml
├── .env.example
├── DOCKER-SETUP.md
└── DATABASE_SCHEMA.md
```

---

## Instalação

```bash
git clone https://github.com/HiranHabiff/agente-mangas.git
cd agente-mangas

cp .env.example .env    # ajuste DB_PASSWORD

docker compose up -d
```

Aguarde ~30s. Verifique com `docker compose ps` — os três devem estar `Up`
(o postgres com `healthy`).

---

## Serviços e portas

| Serviço | Porta | Container | Descrição |
|---|---|---|---|
| **Frontend** | 3013 | `manga-frontend` | SPA React + Vite |
| **Backend** | 3011 | `manga-backend` | API NestJS + Prisma |
| **PostgreSQL** | 5432 | `manga-postgres` | Banco com pgvector |

- Interface: http://localhost:3013
- API: http://localhost:3011/api
- Swagger: http://localhost:3011/docs
- Capas: http://localhost:3011/images/`<arquivo>`

---

## Telas

| Rota | O que faz |
|---|---|
| `/` | Dashboard: estatísticas, lembretes disparados, listas |
| `/mangas` | Coleção com busca, filtros (status, gêneros, temas, tags, tipos, ratings, demografia), ordenação e scroll infinito |
| `/mangas/:id` | Detalhe: progresso, status, abas de sinopse/nomes/links/notas/histórico |
| `/mangas/:id/edit` | Edição completa em abas |
| `/lists` e `/lists/:id` | Listas de leitura |
| `/duplicates` | Detecção e merge de duplicatas |
| `/admin` e `/admin/:table` | CRUD das tabelas de apoio |

---

## API

Prefixo global `/api`. Principais grupos:

```bash
GET    /api/mangas                 # lista com filtros e paginação
GET    /api/mangas/:id             # detalhe
POST   /api/mangas                 # criar (apenas primaryTitle é obrigatório)
PATCH  /api/mangas/:id             # atualizar
DELETE /api/mangas/:id             # remover

GET    /api/lists                  # listas de leitura
POST   /api/lists/:id/mangas       # adicionar mangá à lista
DELETE /api/lists/:id/mangas/:mid  # remover da lista

GET    /api/reminders              # lembretes
POST   /api/reminders

GET    /api/stats                  # totais, por status, média de nota
GET    /api/tags/genres            # opções de filtro
GET    /api/admin/:table           # CRUD das tabelas de apoio
GET    /api/duplicates             # grupos de duplicatas
```

Exemplos:

```bash
curl http://localhost:3011/api/stats
curl "http://localhost:3011/api/mangas?limit=5&sortBy=updated_at&sortOrder=desc"
```

A lista completa e navegável está no Swagger: http://localhost:3011/docs

---

## Desenvolvimento

Hot reload está ativo nos dois serviços — edite `backend/src/` ou `frontend/src/`
e a mudança é aplicada sozinha.

Para rodar fora do Docker:

```bash
cd backend  && npm install && npm run start:dev   # :3011
cd frontend && npm install && npm run dev         # :3013
```

### Testes

O frontend tem uma bateria e2e que dirige um Chrome headless e confere cada
resultado na API:

```bash
cd frontend
npm run e2e     # 29 testes: CRUD de mangás, listas, lembretes, admin e filtros
```

Detalhes e o que ainda não é coberto: [frontend/e2e/README.md](frontend/e2e/README.md)

### Comandos úteis

```bash
docker compose up -d              # subir
docker compose down               # parar
docker compose logs -f backend    # logs de um serviço
docker compose up -d --build      # reconstruir após mudança de dependências
docker compose down -v            # CUIDADO: apaga os volumes

docker compose exec postgres psql -U manga_user -d manga_db
docker compose exec backend npx prisma studio
```

---

## Banco de dados

Schema gerenciado pelo Prisma em [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma).
Descrição das tabelas e relações: [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).

```bash
docker compose exec backend npx prisma migrate dev    # criar migração
docker compose exec backend npx prisma generate       # regenerar o client
```

---

## Troubleshooting

**Containers não sobem** — veja `docker compose logs` e confira as portas:

```bash
netstat -ano | findstr "3011 3013 5432"     # Windows
lsof -i :3011 -i :3013 -i :5432             # Linux/Mac
```

**Frontend recarrega sozinho durante a navegação** — não monte `./storage` no
serviço do frontend. O watcher do Vite varre a raiz do projeto e as milhares de
imagens fazem ele disparar full-reload. O frontend não lê `storage/`: as capas
vêm do backend em `:3011/images/`.

**Capas não aparecem** — confira se o arquivo existe e se o backend serve:

```bash
ls storage/images/
curl -I http://localhost:3011/images/<arquivo>.jpg
```

**PostgreSQL não conecta** — `docker compose ps` deve mostrar `healthy`:

```bash
docker compose exec postgres pg_isready -U manga_user
```

Mais detalhes: [DOCKER-SETUP.md](DOCKER-SETUP.md)

---

## Produção

1. `NODE_ENV=production` e senha forte em `DB_PASSWORD`
2. Backend: estágio `production` do Dockerfile (`npm run build` + `node dist/main`)
3. Frontend: estágio `production` serve os estáticos por nginx —
   `VITE_API_URL` precisa ser passada como `--build-arg`, pois é embutida no bundle
4. HTTPS na frente (nginx/Caddy) e backup automático do PostgreSQL

---

## Autor

**Hiran Habiff** — [@HiranHabiff](https://github.com/HiranHabiff)

Issues: [github.com/HiranHabiff/agente-mangas/issues](https://github.com/HiranHabiff/agente-mangas/issues)
