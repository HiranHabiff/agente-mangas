# 🐳 Docker Setup — Agente Mangás

Guia de operação do stack com Docker Compose. Para visão geral do projeto,
veja o [README.md](README.md).

---

## Pré-requisitos

- **Docker Desktop** rodando ([Windows](https://docs.docker.com/desktop/install/windows-install/) · [Mac](https://docs.docker.com/desktop/install/mac-install/) · [Linux](https://docs.docker.com/desktop/install/linux-install/))
- **Git**

---

## Quick Start

```bash
git clone https://github.com/HiranHabiff/agente-mangas.git
cd agente-mangas

cp .env.example .env      # ajuste ao menos DB_PASSWORD

docker compose up -d
```

O que acontece:

1. PostgreSQL sobe e cria o banco (com healthcheck)
2. Backend NestJS é construído e sobe na **3011**, só depois que o postgres fica `healthy`
3. Frontend Vite é construído e sobe na **3013**

Acompanhe a subida:

```bash
docker compose logs -f
docker compose logs -f backend
```

---

## Serviços

| Serviço | Container | Porta | Imagem/Build |
|---|---|---|---|
| `postgres` | `manga-postgres` | 5432 | `ankane/pgvector:latest` |
| `backend` | `manga-backend` | 3011 | build de `./backend` |
| `frontend` | `manga-frontend` | 3013 | build de `./frontend` |

Endereços:

- Interface: http://localhost:3013
- API: http://localhost:3011/api
- Swagger: http://localhost:3011/docs
- Capas: http://localhost:3011/images/`<arquivo>`

---

## Variáveis de ambiente

Ficam no `.env` da raiz (não versionado). O compose lê de lá.

| Variável | Padrão | Usada por |
|---|---|---|
| `DB_NAME` | `manga_db` | postgres + `DATABASE_URL` |
| `DB_USER` | `manga_user` | postgres + `DATABASE_URL` |
| `DB_PASSWORD` | `manga123` | postgres + `DATABASE_URL` |
| `DB_PORT` | `5432` | mapeamento de porta do postgres |
| `NODE_ENV` | `development` | backend e frontend |
| `IMAGES_PATH` | `/app/storage/images` | backend (onde grava/serve as capas) |
| `VITE_API_URL` | `http://localhost:3011/api` | frontend, **em tempo de build** |

`DATABASE_URL` não é definida no `.env` — o compose monta a string a partir de
`DB_USER`/`DB_PASSWORD`/`DB_NAME`.

> `VITE_*` é embutida no bundle durante o build. Em produção passe como
> `--build-arg`; definir em runtime não tem efeito.

---

## Volumes

| Volume/mount | Para quê |
|---|---|
| `./storage/postgres/db` | dados do PostgreSQL (bind mount) |
| `./storage` → `/app/storage` no backend | capas dos mangás |
| `./backend/src`, `./frontend/src` | hot reload |
| `backend-node-modules`, `frontend-node-modules` | named volumes, evitam conflito entre o `node_modules` do host e o do container |

> **Não monte `./storage` no serviço do frontend.** O watcher do Vite varre a
> raiz do projeto; com as dezenas de milhares de imagens ali dentro ele dispara
> full-reload no meio da navegação e a primeira carga de cada rota vai a ~13s.
> O frontend não lê `storage/` — as capas vêm do backend.

---

## Comandos

```bash
# ciclo de vida
docker compose up -d
docker compose down
docker compose restart backend
docker compose ps

# logs
docker compose logs -f
docker compose logs --tail 50 backend

# reconstruir (após mudar dependências ou Dockerfile)
docker compose up -d --build
docker compose up -d --force-recreate frontend

# shell
docker compose exec backend sh
docker compose exec postgres psql -U manga_user -d manga_db

# CUIDADO: remove os volumes nomeados
docker compose down -v
```

---

## Banco de dados

```bash
# console
docker compose exec postgres psql -U manga_user -d manga_db

# tabelas
docker compose exec postgres psql -U manga_user -d manga_db -c "\dt"

# Prisma
docker compose exec backend npx prisma migrate dev
docker compose exec backend npx prisma generate
docker compose exec backend npx prisma studio
```

### Backup e restore

```bash
# dump
docker exec manga-postgres pg_dump -U manga_user manga_db > base-dados.sql

# restore
docker exec -i manga-postgres psql -U manga_user -d manga_db < base-dados.sql
```

`base-dados.sql` está no `.gitignore` — é um dump local, não vai para o repositório.

---

## Produção

Os dois Dockerfiles são multi-stage. O estágio `development` é o default.

```bash
# backend: compila e roda dist/main
docker build --target production -t manga-backend ./backend

# frontend: build estático servido por nginx (com SPA fallback)
docker build --target production \
  --build-arg VITE_API_URL=https://api.exemplo.com/api \
  -t manga-frontend ./frontend
```

Checklist:

1. `NODE_ENV=production` e `DB_PASSWORD` forte
2. `VITE_API_URL` correta no `--build-arg` do frontend
3. HTTPS na frente (nginx/Caddy)
4. Backup automático do PostgreSQL

---

## Troubleshooting

### Porta em uso

```bash
netstat -ano | findstr "3011 3013 5432"     # Windows
lsof -i :3011 -i :3013 -i :5432             # Linux/Mac
```

### Backend não conecta no banco

O `depends_on` já espera o healthcheck. Se ainda falhar:

```bash
docker compose ps                                   # postgres deve estar healthy
docker compose exec postgres pg_isready -U manga_user
docker compose logs postgres
```

### Hot reload parou

```bash
docker compose down
docker compose up -d --build
docker compose exec backend ls -la /app/src         # o mount deve estar lá
```

### Frontend recarrega sozinho durante a navegação

Alguém remontou `./storage` no serviço do frontend. Remova o mount e recrie:

```bash
docker compose up -d --force-recreate frontend
```

### Capas não aparecem

```bash
ls storage/images/
curl -I http://localhost:3011/images/<arquivo>.jpg
docker compose logs backend | grep -i image
```

### Começar do zero

```bash
docker compose down -v
docker compose up -d --build
```

> `down -v` apaga os named volumes (`node_modules`). Os dados do PostgreSQL
> ficam em `./storage/postgres/db`, que é bind mount e **não** é removido —
> para zerar o banco também, apague essa pasta manualmente.
