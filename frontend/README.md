# Frontend — React + Vite

Port do frontend anterior (Next.js App Router) para React puro com Vite e React Router.
Mesma identidade visual, mesmos componentes, mesmas funcionalidades — sem Next.js.

## Stack

| Camada | antes (Next.js) | agora |
| --- | --- | --- |
| Build / dev server | `next dev` / `next build` | Vite 7 |
| Roteamento | file-system (`app/`) | React Router 7 (`src/App.tsx`) |
| Imagens | `next/image` (`unoptimized`) | `<img>` nativo |
| Fontes | `next/font/google` | `@fontsource-variable/geist` (auto-hospedadas) |
| Env vars | `NEXT_PUBLIC_*` | `VITE_*` |
| Produção | server Node standalone | estáticos servidos por nginx |

Inalterados na migração: Tailwind v4, `globals.css` (tokens de tema), os 24 componentes
shadcn/ui, Radix, TanStack Query, sonner, lucide-react, os hooks e os types.

## Rodando

```bash
npm install
npm run dev      # http://localhost:3013
```

Build de produção:

```bash
npm run build    # gera dist/
npm run preview  # serve dist/ localmente
```

## Variáveis de ambiente

Definidas em `.env` (commitado) e sobrescrevíveis por `.env.local` (ignorado pelo git):

| Variável | Padrão | Uso |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3011/api` | base da API do `backend` |

`VITE_*` é embutida no bundle em tempo de build — para produção, passe o valor no build
(`--build-arg VITE_API_URL=...`), não em runtime.

## Docker

```bash
# desenvolvimento (HMR, faz parte do docker-compose da raiz)
docker compose up frontend

# produção (nginx)
docker build --target production --build-arg VITE_API_URL=https://api.exemplo.com/api -t manga-frontend .
docker run -p 3013:3013 manga-frontend
```

O `nginx.conf` faz o SPA fallback (`try_files ... /index.html`), necessário para que as rotas
do React Router funcionem em reload direto e deep link.

## Estrutura

```
src/
  main.tsx              entrypoint (createRoot, fontes, globals.css)
  App.tsx               Providers + BrowserRouter + RootLayout + rotas
  globals.css           tokens de tema (idêntico ao v2 + vars das fontes)
  pages/                uma page por rota (ex-`app/**/page.tsx`)
  components/           layout, manga, filters, admin, ui (shadcn) — sem alteração
  hooks/                use-mangas, use-lists, use-admin, use-reminders — sem alteração
  lib/                  api.ts, utils.ts
  types/                manga.ts
```

## Rotas

| Rota | Page | Origem no v2 |
| --- | --- | --- |
| `/` | `dashboard-page.tsx` | `app/page.tsx` |
| `/mangas` | `mangas-page.tsx` | `app/mangas/page.tsx` |
| `/mangas/:id` | `manga-detail-page.tsx` | `app/mangas/[id]/page.tsx` |
| `/mangas/:id/edit` | `manga-edit-page.tsx` | `app/mangas/[id]/edit/page.tsx` |
| `/lists` | `lists-page.tsx` | `app/lists/page.tsx` |
| `/lists/:id` | `list-detail-page.tsx` | `app/lists/[id]/page.tsx` |
| `/duplicates` | `duplicates-page.tsx` | `app/duplicates/page.tsx` |
| `/admin` | `admin-page.tsx` | `app/admin/page.tsx` |
| `/admin/sites` | `admin-sites-page.tsx` | `app/admin/sites/page.tsx` |
| `/admin/:table` | `admin-table-page.tsx` | `app/admin/[table]/page.tsx` |
| `*` | `not-found-page.tsx` | 404 padrão do Next |

## Testes

```bash
npm run e2e   # 29 testes em Chrome headless, com o backend e o front no ar
```

Cada teste age pela UI e confere o resultado na API. Ver [e2e/README.md](e2e/README.md)
para pré-requisitos, o que cada suíte cobre e o que ficou de fora.

## Notas da migração

- `MangaImage` reproduz o `<Image fill unoptimized>` do Next com
  `absolute inset-0 h-full w-full object-cover` + `loading="lazy"`. Como o v2 já usava
  `unoptimized`, não há perda de otimização.
- A diretiva `'use client'` foi removida de todos os arquivos: sem RSC, ela não tem efeito
  e o Rollup emite warning se mantida.
- O `metadata` do `layout.tsx` virou `<title>` / `<meta name="description">` no `index.html`.
  Não há meta dinâmica por página (o v2 também não tinha).
- `react-grab` continua carregado só em dev, injetado via `import.meta.env.DEV` no `main.tsx`.
