# 🐳 Docker Setup - Agente Mangás

Guia completo para executar o projeto com Docker Compose.

---

## 📋 Pré-requisitos

- **Docker Desktop** instalado e rodando
  - Windows: https://docs.docker.com/desktop/install/windows-install/
  - Mac: https://docs.docker.com/desktop/install/mac-install/
  - Linux: https://docs.docker.com/desktop/install/linux-install/

- **Git** (para clonar o repositório)

---

## 🚀 Quick Start

### 1. Clone o Repositório

```bash
git clone <repo-url>
cd _agenteMangas
```

### 2. Configure as Variáveis de Ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure:

```env
# Mínimo necessário
DB_PASSWORD=sua_senha_segura
GEMINI_API_KEY=sua_chave_gemini  # Opcional para desenvolvimento
```

### 3. Inicie os Serviços

```bash
docker-compose up -d
```

**O que vai acontecer:**
1. ✅ PostgreSQL será iniciado e criará o banco de dados
2. ✅ Backend API será construído e iniciado na porta 3000
3. ✅ Frontend React será construído e iniciado na porta 5173
4. ✅ pgAdmin será iniciado na porta 5050 (opcional)

### 4. Aguarde a Inicialização

```bash
# Ver logs em tempo real
docker-compose logs -f

# Ver apenas logs do backend
docker-compose logs -f backend

# Ver apenas logs do frontend
docker-compose logs -f frontend
```

### 5. Acesse as Aplicações

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **pgAdmin:** http://localhost:5050
  - Email: `admin@manga.local`
  - Senha: (definida em `.env`)

---

## 📂 Estrutura do Projeto

```
_agenteMangas/
├── backend/
│   ├── src/                     # Código fonte do backend
│   ├── Dockerfile               # Dockerfile do backend
│   └── package.json
│
├── frontend/
│   ├── src/                     # Código fonte do frontend
│   ├── Dockerfile               # Dockerfile do frontend
│   ├── nginx.conf               # Config Nginx (produção)
│   └── package.json
│
├── storage/
│   ├── images/                  # Imagens dos mangás
│   └── postgres/
│       ├── db/                  # Volume do PostgreSQL
│       └── init.sql             # Script de inicialização do banco
│
├── docker-compose.yml           # Orquestração dos serviços
├── .env                         # Variáveis de ambiente (NÃO versionar)
└── .env.example                 # Template de variáveis
```

---

## 🔧 Comandos Úteis

### Gerenciamento de Serviços

```bash
# Iniciar todos os serviços
docker-compose up -d

# Parar todos os serviços
docker-compose stop

# Parar e remover containers
docker-compose down

# Parar, remover e limpar volumes
docker-compose down -v

# Reiniciar um serviço específico
docker-compose restart backend
docker-compose restart frontend
docker-compose restart postgres
```

### Logs e Debug

```bash
# Ver logs de todos os serviços
docker-compose logs

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Ver últimas 100 linhas
docker-compose logs --tail=100 backend
```

### Rebuild e Atualização

```bash
# Rebuild de um serviço (após mudanças no Dockerfile)
docker-compose build backend
docker-compose build frontend

# Rebuild e restart
docker-compose up -d --build backend

# Rebuild completo (todos os serviços)
docker-compose build --no-cache
docker-compose up -d
```

### Acesso aos Containers

```bash
# Abrir shell no container do backend
docker-compose exec backend sh

# Abrir shell no container do frontend
docker-compose exec frontend sh

# Abrir psql no PostgreSQL
docker-compose exec postgres psql -U manga_user -d manga_db

# Executar comando npm no backend
docker-compose exec backend npm run build

# Executar comando npm no frontend
docker-compose exec frontend npm run build
```

### Banco de Dados

```bash
# Backup do banco
docker-compose exec postgres pg_dump -U manga_user manga_db > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U manga_user -d manga_db < backup.sql

# Ver tabelas
docker-compose exec postgres psql -U manga_user -d manga_db -c "\dt"

# Executar query
docker-compose exec postgres psql -U manga_user -d manga_db -c "SELECT COUNT(*) FROM mangas;"
```

---

## 🌐 Variáveis de Ambiente

### Principais Variáveis

| Variável | Descrição | Padrão | Obrigatória |
|----------|-----------|--------|-------------|
| `DB_NAME` | Nome do banco PostgreSQL | `manga_db` | ✅ |
| `DB_USER` | Usuário do banco | `manga_user` | ✅ |
| `DB_PASSWORD` | Senha do banco | - | ✅ |
| `DB_PORT` | Porta externa do PostgreSQL | `5432` | ❌ |
| `BACKEND_PORT` | Porta externa do backend | `3000` | ❌ |
| `FRONTEND_PORT` | Porta externa do frontend | `5173` | ❌ |
| `GEMINI_API_KEY` | Chave API do Gemini | - | ❌ |
| `VITE_API_URL` | URL do backend para o frontend | `http://localhost:3000` | ❌ |
| `NODE_ENV` | Ambiente (`development`/`production`) | `development` | ❌ |

### Obter Gemini API Key

1. Acesse: https://makersuite.google.com/app/apikey
2. Crie uma nova API key
3. Adicione no `.env`: `GEMINI_API_KEY=sua_chave_aqui`

**Nota:** A API key é opcional para desenvolvimento básico. Necessária apenas para:
- Busca semântica
- Recomendações por IA
- Geração de embeddings

---

## 🔄 Hot Reload (Desenvolvimento)

### Backend

Mudanças em `backend/src/**/*.ts` serão detectadas automaticamente e o servidor será reiniciado.

**Volume mapeado:**
```yaml
- ./backend/src:/app/src:ro
```

### Frontend

Mudanças em `frontend/src/**/*` acionarão o HMR (Hot Module Replacement) do Vite.

**Volume mapeado:**
```yaml
- ./frontend/src:/app/src:ro
```

---

## 🚨 Troubleshooting

### Erro: "Cannot connect to Docker daemon"

**Solução:** Inicie o Docker Desktop

```bash
# Windows
# Abra Docker Desktop pelo menu Iniciar

# Ou via PowerShell
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

### Erro: "Port already in use"

**Problema:** Porta 3000, 5173 ou 5432 já está em uso.

**Solução:** Altere as portas no `.env`:

```env
BACKEND_PORT=3001
FRONTEND_PORT=5174
DB_PORT=5433
```

### Backend não conecta ao banco

**Verificar:**

1. PostgreSQL está rodando?
   ```bash
   docker-compose ps postgres
   ```

2. Health check passou?
   ```bash
   docker-compose logs postgres | grep "ready"
   ```

3. Variáveis corretas?
   ```bash
   docker-compose exec backend env | grep DB_
   ```

### Frontend mostra erro de CORS

**Problema:** Backend não está aceitando requests do frontend.

**Solução:** Verifique se `VITE_API_URL` está correto no `.env`:

```env
VITE_API_URL=http://localhost:3000
```

### Banco de dados vazio após reiniciar

**Problema:** Volume do PostgreSQL foi removido.

**Verificar:**
```bash
# Volume existe?
docker volume ls | grep manga

# Dados existem?
ls -la storage/postgres/db/
```

**Solução:**
- Não use `docker-compose down -v` (remove volumes)
- Use apenas `docker-compose down` ou `docker-compose stop`

### Erro: "No space left on device"

**Problema:** Docker consumiu todo o espaço em disco.

**Solução:**
```bash
# Limpar containers parados
docker container prune -f

# Limpar imagens não usadas
docker image prune -a -f

# Limpar volumes não usados (CUIDADO!)
docker volume prune -f

# Limpar tudo (MUITO CUIDADO!)
docker system prune -a --volumes -f
```

---

## 📊 Monitoramento

### Ver Status dos Serviços

```bash
docker-compose ps
```

**Saída esperada:**
```
NAME                STATUS              PORTS
manga-postgres      Up (healthy)        0.0.0.0:5432->5432/tcp
manga-backend       Up                  0.0.0.0:3000->3000/tcp
manga-frontend      Up                  0.0.0.0:5173->5173/tcp
manga-pgadmin       Up                  0.0.0.0:5050->80/tcp
```

### Ver Uso de Recursos

```bash
docker stats
```

### Health Checks

```bash
# PostgreSQL
curl http://localhost:5432

# Backend API
curl http://localhost:3000/health

# Frontend
curl http://localhost:5173
```

---

## 🏭 Deploy para Produção

### 1. Alterar NODE_ENV

```env
NODE_ENV=production
```

### 2. Configurar Senhas Fortes

```env
DB_PASSWORD=senha_muito_forte_aqui
PGADMIN_PASSWORD=senha_muito_forte_aqui
```

### 3. Alterar VITE_API_URL

```env
VITE_API_URL=https://seu-dominio.com/api
```

### 4. Rebuild para Produção

```bash
docker-compose build --no-cache
docker-compose up -d
```

**Diferenças em Produção:**

| Aspecto | Development | Production |
|---------|-------------|------------|
| **Backend** | `npm run dev` (tsx watch) | `node dist/server.js` |
| **Frontend** | Vite dev server | Nginx servindo build estático |
| **Logs** | Verbose | Menos verbose |
| **Source Maps** | Habilitados | Desabilitados |
| **Hot Reload** | Sim | Não |

---

## 📝 Backup e Restore

### Backup Automático

Criar script `backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U manga_user manga_db > "backups/backup_$DATE.sql"
echo "Backup criado: backups/backup_$DATE.sql"
```

### Restore

```bash
docker-compose exec -T postgres psql -U manga_user -d manga_db < backups/backup_20250106.sql
```

---

## 🔐 Segurança

### Checklist de Segurança

- [ ] Alterar senhas padrão do `.env`
- [ ] Não commitar `.env` no Git
- [ ] Usar HTTPS em produção
- [ ] Configurar firewall (permitir apenas portas necessárias)
- [ ] Fazer backups regulares
- [ ] Atualizar imagens Docker regularmente
- [ ] Validar inputs no backend
- [ ] Sanitizar dados antes de armazenar

---

## 📚 Referências

- **Docker Compose:** https://docs.docker.com/compose/
- **PostgreSQL no Docker:** https://hub.docker.com/_/postgres
- **Vite:** https://vitejs.dev/
- **Node.js:** https://nodejs.org/

---

**Última atualização:** 2025-12-06
