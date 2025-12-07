# MCP Server Setup Guide

## O que é MCP?

MCP (Model Context Protocol) é um protocolo que permite que modelos de IA (como Claude/Gemini) se conectem diretamente a fontes de dados e executem operações através de "ferramentas" (tools).

## Configuração do Servidor MCP

### 1. Instalar Dependências

```bash
cd backend
npm install
```

### 2. Compilar TypeScript

```bash
npm run build
```

### 3. Configurar Variáveis de Ambiente

Edite `backend/.env` com suas credenciais:

```env
DB_PASSWORD=sua_senha_postgres
GEMINI_API_KEY=sua_api_key_gemini
```

### 4. Iniciar PostgreSQL

```bash
cd docker
docker-compose up -d
```

### 5. Testar o Servidor MCP

```bash
cd backend
npm run mcp
```

## Integração com Claude Desktop

### Configuração

1. Localize o arquivo de configuração do Claude Desktop:
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. Adicione a configuração do servidor MCP:

```json
{
  "mcpServers": {
    "manga-agent": {
      "command": "node",
      "args": [
        "f:\\wamp\\www\\_agenteMangas\\backend\\dist\\mcp\\server.js"
      ],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_NAME": "manga_db",
        "DB_USER": "manga_user",
        "DB_PASSWORD": "YOUR_PASSWORD_HERE",
        "GEMINI_API_KEY": "YOUR_GEMINI_API_KEY_HERE",
        "NODE_ENV": "production"
      }
    }
  }
}
```

3. **IMPORTANTE**: Substitua:
   - `YOUR_PASSWORD_HERE` pela senha do PostgreSQL
   - `YOUR_GEMINI_API_KEY_HERE` pela sua chave da API Gemini
   - O caminho do arquivo `.js` se necessário

4. Reinicie o Claude Desktop

### Verificação

Após reiniciar o Claude Desktop, você pode testar enviando mensagens como:

```
"Liste todos os mangás que estou lendo"
"Adicione um novo mangá chamado One Piece"
"Qual capítulo eu parei em Naruto?"
```

O Claude terá acesso a todas as ferramentas MCP disponíveis!

## Ferramentas Disponíveis

O servidor MCP expõe as seguintes ferramentas:

### CRUD de Mangás
- `create_manga` - Criar novo mangá
- `search_manga` - Buscar mangás
- `get_manga` - Obter detalhes de um mangá
- `update_manga` - Atualizar mangá
- `delete_manga` - Deletar mangá

### Rastreamento de Capítulos
- `track_chapter` - Atualizar último capítulo lido
- `get_manga_stats` - Estatísticas de leitura

### Lembretes
- `set_reminder` - Criar lembrete
- `list_reminders` - Listar lembretes
- `delete_reminder` - Deletar lembrete

### Imagens
- `download_image` - Baixar capa do mangá

### IA e Recomendações
- `get_recommendations` - Recomendações de mangás
- `analyze_reading_habits` - Análise de hábitos
- `extract_tags` - Extrair tags de sinopse

### Tags
- `list_tags` - Listar todas as tags
- `get_popular_tags` - Tags mais usadas

## Uso Programático

Você também pode usar o servidor MCP programaticamente:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const client = new Client({
  name: 'manga-agent-client',
  version: '1.0.0',
});

// Conectar ao servidor
await client.connect(transport);

// Listar ferramentas disponíveis
const tools = await client.listTools();

// Executar uma ferramenta
const result = await client.callTool('create_manga', {
  primary_title: 'One Piece',
  url: 'https://...',
});
```

## Troubleshooting

### Erro: "Database connection failed"

- Verifique se o PostgreSQL está rodando: `docker ps`
- Teste a conexão: `cd backend && npm run dev`

### Erro: "GEMINI_API_KEY not found"

- Verifique se a API key está configurada corretamente em `.env` ou na configuração do Claude Desktop

### Servidor MCP não aparece no Claude

- Reinicie o Claude Desktop completamente
- Verifique os logs do Claude Desktop
- Certifique-se de que o caminho para o `server.js` está correto

### Ferramentas não funcionam

- Verifique se o banco de dados está acessível
- Olhe os logs em `backend/logs/` para mais detalhes

## Logs

Os logs do servidor MCP ficam em:
- `backend/logs/error.log` - Apenas erros
- `backend/logs/combined.log` - Todos os logs

## Desenvolvimento

Para desenvolvimento local (com hot-reload):

```bash
cd backend
npm run dev
```

Para executar apenas o MCP server:

```bash
npm run mcp
```

## Próximos Passos

1. Migre seus dados existentes: `npm run migrate:legacy`
2. Importe as imagens: `npm run import:images`
3. Gere embeddings para busca semântica: Execute via ferramentas MCP
