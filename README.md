# Manga Agent - Sistema de Gerenciamento de Mangás com IA

Sistema completo de gerenciamento de mangás com Inteligência Artificial, chat conversacional e busca semântica usando Gemini AI.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)

---

## Características Principais

- 🤖 **Chat com IA**: Converse com o assistente sobre seus mangás usando linguagem natural
- 🔍 **Busca Semântica**: Encontre mangás por similaridade de sinopse usando embeddings vetoriais
- 📚 **Múltiplos Títulos**: Suporte nativo para nomes alternativos em diferentes idiomas
- 📊 **Tracking de Progresso**: Acompanhe capítulos lidos e histórico de leitura
- ⏰ **Sistema de Lembretes**: Notificações para novos capítulos e updates
- 🏷️ **Tags Inteligentes**: Categorização por gênero, demografia e temas
- 🎨 **Interface Moderna**: Frontend React 19 + Chakra UI 3
- 🐳 **Docker Completo**: Setup com hot reload e persistência de dados
- 🔌 **MCP Server**: Protocolo de comunicação com agentes de IA

---

## Stack Tecnológica

### Backend
- **Runtime**: Node.js 22 + TypeScript
- **API REST**: Express.js
- **IA**: Google Gemini (gemini-2.5-flash + gemini-embedding-001)
- **Banco de Dados**: PostgreSQL 15 + pgvector (embeddings vetoriais 768 dimensões)
- **Logging**: Winston
- **MCP**: Model Context Protocol Server

### Frontend
- **Framework**: React 19
- **UI Library**: Chakra UI 3.30.0
- **Build Tool**: Vite
- **Linguagem**: TypeScript

### Infraestrutura
- **Containerização**: Docker + Docker Compose
- **Servidor Web**: Nginx (produção)
- **Extensões PostgreSQL**: uuid-ossp, pg_trgm, pgvector
- **Hot Reload**: Desenvolvimento com recarga automática

---

## Estrutura do Projeto

```
agente-mangas/
├── backend/              # Backend Node.js + API REST + MCP Server
│   ├── src/
│   │   ├── api/         # Express REST endpoints
│   │   ├── mcp/         # MCP Server e ferramentas
│   │   ├── services/    # Lógica de negócio e IA
│   │   ├── repositories/# Camada de acesso a dados
│   │   ├── models/      # Modelos de dados
│   │   └── config/      # Configurações e env
│   └── Dockerfile       # Multi-stage build (dev/prod)
│
├── frontend/            # Frontend React SPA
│   ├── src/
│   │   ├── components/  # Componentes reutilizáveis
│   │   ├── pages/       # Páginas da aplicação
│   │   ├── services/    # Cliente API
│   │   └── theme/       # Tema customizado Chakra UI
│   ├── Dockerfile       # Multi-stage build
│   └── nginx.conf       # Config Nginx para produção
│
├── storage/             # Dados persistentes (não versionado)
│   ├── images/          # Capas dos mangás
│   ├── postgres/        # Dados PostgreSQL
│   │   ├── db/          # Volume do banco
│   │   └── init.sql     # Schema inicial
│   └── temp/            # Arquivos temporários
│
├── docs/                # Documentação técnica
│   ├── API.md           # Documentação API REST
│   ├── MCP_SETUP.md     # Setup MCP Server
│   └── FRONTEND_GUIDE.md# Guia do frontend
│
├── docker-compose.yml   # Orquestração de 4 serviços
├── .env.example         # Template de variáveis
├── .gitignore           # Arquivos ignorados
├── DOCKER-SETUP.md      # Guia completo Docker
└── README.md            # Este arquivo
```

---

## Pré-requisitos

- **Docker** e **Docker Compose** instalados
- **Gemini API Key** - [Obter gratuitamente aqui](https://makersuite.google.com/app/apikey)
- (Opcional) **Node.js 22+** para desenvolvimento local sem Docker

---

## Instalação Rápida

### 1. Clone o Repositório

```bash
git clone https://github.com/HiranHabiff/agente-mangas.git
cd agente-mangas
```

### 2. Configure as Variáveis de Ambiente

```bash
# Copie o template
cp .env.example .env

# Edite o arquivo .env
nano .env  # ou use seu editor preferido
```

**Variáveis obrigatórias:**
```env
GEMINI_API_KEY=sua_chave_api_gemini_aqui
DB_PASSWORD=senha_forte_postgresql
PGADMIN_PASSWORD=senha_pgadmin
```

### 3. Inicie Todos os Serviços

```bash
docker-compose up -d
```

Aguarde ~30 segundos para todos os containers iniciarem.

### 4. Verifique o Status

```bash
docker-compose ps
```

Todos os serviços devem estar com status `Up` (saudável).

### 5. Acesse a Aplicação

- **Frontend (Interface Principal)**: http://localhost:5173
- **API REST (Backend)**: http://localhost:3000/api
- **pgAdmin (Gerenciador DB)**: http://localhost:5050

**Credenciais pgAdmin:**
- Email: `admin@manga.com`
- Senha: (valor de `PGADMIN_PASSWORD` no .env)

---

## Serviços e Portas

| Serviço | Porta | Container | Descrição |
|---------|-------|-----------|-----------|
| **Frontend** | 5173 | `manga-frontend` | Interface React com Chakra UI |
| **Backend** | 3000 | `manga-backend` | API REST + MCP Server + IA |
| **PostgreSQL** | 5432 | `manga-postgres` | Banco de dados com pgvector |
| **pgAdmin** | 5050 | `manga-pgadmin` | Interface web para PostgreSQL |

---

## Como Usar

### 1. Interface Web (Frontend)

Acesse http://localhost:5173 e você verá:

- **Dashboard**: Estatísticas e visão geral dos mangás
- **Lista de Mangás**: Todos os mangás cadastrados com filtros
- **Busca**: Buscar por nome, tags, sinopse
- **Chat IA**: Converse com o assistente sobre seus mangás
- **Detalhes**: Informações completas de cada mangá

### 2. API REST

A API REST está disponível em `http://localhost:3000/api`

**Endpoints principais:**

```bash
# Listar todos os mangás
GET /api/mangas

# Buscar por nome
GET /api/mangas/search?q=naruto

# Detalhes de um mangá
GET /api/mangas/:id

# Estatísticas
GET /api/stats

# Tags disponíveis
GET /api/tags

# Busca semântica (embeddings)
POST /api/mangas/semantic-search
```

**Exemplo de uso:**

```bash
# Listar mangás
curl http://localhost:3000/api/mangas | jq

# Estatísticas
curl http://localhost:3000/api/stats | jq
```

### 3. Chat com IA

No frontend, acesse a página de **Chat** e converse naturalmente:

```
Você: "Quais mangás de ação eu tenho?"
IA: "Você tem 15 mangás de ação, incluindo..."

Você: "Recomende algo parecido com Tower of God"
IA: [Usa busca semântica e recomenda títulos similares]

Você: "Marque que li até o capítulo 50 de Naruto"
IA: "Atualizado! Você está no capítulo 50 de Naruto."
```

### 4. MCP Server (Integração com Agentes)

O backend expõe um **MCP Server** que permite integração com agentes de IA.

Para configurar, consulte: [docs/MCP_SETUP.md](docs/MCP_SETUP.md)

**Ferramentas disponíveis via MCP:**
- `list_mangas` - Listar mangás
- `search_manga` - Buscar mangás
- `get_manga_details` - Detalhes de um mangá
- `update_reading_progress` - Atualizar progresso
- `add_tag` - Adicionar tags
- `create_reminder` - Criar lembretes
- `ai_recommend` - Recomendações com IA
- `semantic_search` - Busca por similaridade

---

## Comandos Úteis

### Gerenciamento de Containers

```bash
# Iniciar todos os serviços
docker-compose up -d

# Parar todos os serviços
docker-compose down

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend

# Reiniciar um serviço
docker-compose restart backend

# Reconstruir após mudanças
docker-compose up -d --build

# Parar e remover volumes (CUIDADO: apaga dados)
docker-compose down -v
```

### Acessar Containers

```bash
# Shell do backend
docker-compose exec backend sh

# Shell do PostgreSQL
docker-compose exec postgres psql -U manga_user -d manga_db

# Ver estrutura do banco
docker-compose exec postgres psql -U manga_user -d manga_db -c "\dt"

# Query SQL
docker-compose exec postgres psql -U manga_user -d manga_db -c "SELECT COUNT(*) FROM mangas;"
```

### Desenvolvimento

```bash
# Ver código em tempo real (hot reload está ativo)
# Edite arquivos em backend/src/ ou frontend/src/
# As mudanças são detectadas automaticamente

# Ver variáveis de ambiente do backend
docker-compose exec backend printenv | grep -E "DB|GEMINI|PORT"

# Verificar saúde do PostgreSQL
docker-compose exec postgres pg_isready -U manga_user
```

---

## Banco de Dados

### Schema Principal

**Tabelas:**
- `mangas` - Informações principais (título, sinopse, status, rating, embedding)
- `manga_names` - Títulos alternativos em múltiplos idiomas
- `tags` - Categorias (gênero, demografia, temas)
- `manga_tags` - Relação N:N entre mangás e tags
- `reminders` - Sistema de notificações
- `reading_sessions` - Histórico de leitura
- `creators` - Autores e artistas

**Recursos:**
- ✅ Chaves primárias UUID
- ✅ Full-text search com `pg_trgm`
- ✅ Busca vetorial com `pgvector` (768 dimensões)
- ✅ Soft deletes (deleted_at)
- ✅ Timestamps automáticos
- ✅ Triggers e funções
- ✅ Índices otimizados

### Acessar via pgAdmin

1. Acesse http://localhost:5050
2. Login: `admin@manga.com` / senha do .env
3. **Add Server** →
   - Name: `Manga DB`
   - Host: `postgres`
   - Port: `5432`
   - Username: `manga_user`
   - Password: (valor de `DB_PASSWORD`)

---

## Troubleshooting

### Containers não iniciam

```bash
# Ver logs de erro
docker-compose logs

# Verificar portas em uso (Windows)
netstat -ano | findstr "3000 5173 5432 5050"

# Verificar portas (Linux/Mac)
lsof -i :3000,5173,5432,5050

# Reiniciar do zero
docker-compose down -v
docker-compose up -d
```

### Erro "GEMINI_API_KEY not found"

Certifique-se de que:
1. Arquivo `.env` existe na raiz do projeto
2. Variável `GEMINI_API_KEY` está preenchida
3. Não há espaços extras: `GEMINI_API_KEY=sua_chave`
4. Reinicie os containers: `docker-compose restart backend`

### PostgreSQL não conecta

```bash
# Verificar saúde
docker-compose ps

# Deve mostrar "healthy" para postgres
# Se não, ver logs:
docker-compose logs postgres

# Testar conexão manual
docker-compose exec postgres psql -U manga_user -d manga_db -c "SELECT 1;"
```

### Hot reload não funciona

```bash
# Reconstruir containers
docker-compose down
docker-compose up -d --build

# Verificar se volumes estão mapeados
docker-compose exec backend ls -la /app/src
```

### Imagens não aparecem

```bash
# Verificar se a pasta existe
ls -la storage/images/

# Testar acesso direto
curl http://localhost:3000/images/nome-do-arquivo.jpg

# Ver logs do backend
docker-compose logs backend | grep images
```

**Mais soluções:** [DOCKER-SETUP.md](DOCKER-SETUP.md)

---

## Produção

Para deploy em produção:

1. **Altere o ambiente:**
   ```env
   NODE_ENV=production
   ```

2. **Configure senhas fortes:**
   ```env
   DB_PASSWORD=senha_muito_forte_e_aleatoria
   PGADMIN_PASSWORD=outra_senha_forte
   ```

3. **Use HTTPS** com certificado SSL (Nginx/Caddy)

4. **Configure backup automático** do PostgreSQL

5. **Desative pgAdmin** (comente no docker-compose.yml)

6. **Consulte a seção de produção:** [DOCKER-SETUP.md](DOCKER-SETUP.md)

---

## Documentação Técnica

- **[DOCKER-SETUP.md](DOCKER-SETUP.md)** - Guia completo de Docker e configuração
- **[docs/API.md](docs/API.md)** - Documentação da API REST
- **[docs/MCP_SETUP.md](docs/MCP_SETUP.md)** - Configuração do MCP Server
- **[docs/FRONTEND_GUIDE.md](docs/FRONTEND_GUIDE.md)** - Guia de desenvolvimento frontend

---

## Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature: `git checkout -b feature/MinhaFeature`
3. Commit suas mudanças: `git commit -m 'feat: adiciona MinhaFeature'`
4. Push para a branch: `git push origin feature/MinhaFeature`
5. Abra um Pull Request

---

## Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## Autor

**Hiran Habiff**

- GitHub: [@HiranHabiff](https://github.com/HiranHabiff)
- Projeto: [agente-mangas](https://github.com/HiranHabiff/agente-mangas)

---

## Suporte

- **Issues**: [GitHub Issues](https://github.com/HiranHabiff/agente-mangas/issues)
- **Documentação**: [docs/](docs/)
- **Status**: 🟢 Em desenvolvimento ativo

---

**Desenvolvido com TypeScript, React, Gemini AI e Docker** 🚀
