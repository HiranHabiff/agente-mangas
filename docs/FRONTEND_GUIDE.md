# 🎨 Frontend React - Manga Agent

## ✅ Sistema Completo Funcionando!

**Frontend:** http://localhost:5173  
**API Backend:** http://localhost:3000

---

## 🚀 Como Usar

### 1. Iniciar os Servidores

**Terminal 1 - Backend API:**
```powershell
cd F:\wamp\www\_agenteMangas\backend
npm run api:watch
```

**Terminal 2 - Frontend:**
```powershell
cd F:\wamp\www\_agenteMangas\frontend
npm run dev
```

### 2. Acessar a Aplicação

Abra o navegador em: **http://localhost:5173**

---

## 📱 Funcionalidades

### Dashboard
- 📊 Estatísticas gerais da coleção
- 📈 Total de mangás por status
- 🏆 Top 10 mangás mais lidos
- ⭐ Rating médio
- 🖼️ Quantidade com capas

### Mangás
- 📚 Grid responsivo de mangás
- 🔍 Busca por título
- 🎯 Filtros por status (Lendo, Completo, Pausado, etc.)
- 🏷️ Filtros por tags
- ⭐ Filtro por rating mínimo
- ✏️ Editar mangá
- 🗑️ Deletar mangá
- 🔗 Abrir URL externa
- 📖 Visualizar progresso de leitura

---

## 🎨 Componentes Criados

### Layout (`src/components/Layout.tsx`)
- Header com navegação
- Toggle dark/light mode
- Container responsivo

### Dashboard (`src/components/dashboard/Dashboard.tsx`)
- Cards de estatísticas
- Lista dos top 10 mais lidos
- Ícones coloridos por categoria

### MangaList (`src/components/manga/MangaList.tsx`)
- Grid responsivo (1-5 colunas)
- Loading states
- Error handling
- Integração com API

### MangaCard (`src/components/manga/MangaCard.tsx`)
- Capa do mangá
- Badge de status
- Botões de ação (Edit, Delete, Open URL)
- Progresso de leitura (progress bar)
- Rating display
- Hover effects

### FilterPanel (`src/components/search/FilterPanel.tsx`)
- Campo de busca
- Filtros de status (multi-select)
- Input de tags
- Rating mínimo (number input)
- Botão limpar filtros

---

## 🔌 API Integration

### Services (`src/services/api.ts`)

**Manga Endpoints:**
```typescript
mangaApi.list({ query, status, tags, minRating, limit, offset })
mangaApi.getById(id)
mangaApi.create(input)
mangaApi.update(id, input)
mangaApi.delete(id, permanent)
mangaApi.trackChapter(id, chapterNumber, createSession)
mangaApi.getHistory(id, limit)
mangaApi.downloadImage(id, imageUrl)
```

**Stats Endpoints:**
```typescript
statsApi.getStats()
statsApi.getTopRead(limit)
statsApi.getRecentlyUpdated(limit)
```

**Tags Endpoints:**
```typescript
tagsApi.list()
tagsApi.getPopular(limit)
```

---

## 🎨 Tema e Estilos

### Cores do Status
- 🟢 **Lendo:** Verde (#48bb78)
- 🟣 **Completo:** Roxo (#667eea)
- 🟠 **Pausado:** Laranja (#f6ad55)
- 🔴 **Abandonado:** Vermelho (#fc8181)
- 🔵 **Planos:** Azul claro (#90cdf4)

### Dark/Light Mode
- Totalmente suportado
- Toggle no header
- Cores adaptativas

### Responsividade
- **Mobile (< 480px):** 1 coluna
- **Tablet (480-768px):** 2 colunas
- **Desktop (768-1024px):** 3 colunas
- **Large (1024-1280px):** 4 colunas
- **XL (> 1280px):** 5 colunas

---

## 📦 Dependências Instaladas

```json
{
  "dependencies": {
    "@chakra-ui/react": "^3.x",
    "@emotion/react": "^11.x",
    "@emotion/styled": "^11.x",
    "framer-motion": "^11.x",
    "axios": "^1.x",
    "react": "^19.x",
    "react-dom": "^19.x",
    "react-icons": "^5.x"
  }
}
```

---

## 🗂️ Estrutura de Arquivos

```
frontend/
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   └── Dashboard.tsx          # Dashboard com estatísticas
│   │   ├── manga/
│   │   │   ├── MangaCard.tsx          # Card individual de mangá
│   │   │   └── MangaList.tsx          # Grid de mangás
│   │   ├── search/
│   │   │   └── FilterPanel.tsx        # Painel de filtros
│   │   └── Layout.tsx                 # Layout principal
│   ├── services/
│   │   └── api.ts                     # Cliente HTTP (Axios)
│   ├── types/
│   │   └── manga.ts                   # TypeScript types
│   ├── config/
│   │   └── api.ts                     # Configuração API
│   ├── theme/
│   │   └── index.ts                   # Tema Chakra UI
│   ├── App.tsx
│   └── main.tsx
├── .env                                # Variáveis de ambiente
└── package.json
```

---

## 🔧 Configuração

### .env
```env
VITE_API_URL=http://localhost:3000
```

### vite.config.ts
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})
```

---

## 🎯 Próximos Passos (Opcional)

### Funcionalidades Adicionais

1. **Modal de Detalhes**
   - Ver todos os dados do mangá
   - Histórico de leitura
   - Nomes alternativos
   - Tags completas

2. **Modal de Edição**
   - Formulário completo
   - Upload de capa
   - Gerenciar nomes alternativos
   - Adicionar/remover tags

3. **Atualizar Capítulo**
   - Modal para marcar progresso
   - Input de número do capítulo
   - Criar sessão de leitura

4. **Sistema de Lembretes**
   - Listar lembretes ativos
   - Criar novos lembretes
   - Notificações

5. **Busca Avançada**
   - Autocomplete de tags
   - Filtro por rating range
   - Ordenação customizada
   - Salvamento de filtros

6. **Gráficos e Visualizações**
   - Chart.js ou Recharts
   - Gráfico de status (pie chart)
   - Histórico de leitura (line chart)
   - Mangás por rating (bar chart)

7. **Importação em Massa**
   - Upload de arquivo
   - Preview antes de importar
   - Progress tracking

---

## 🐛 Debug

### Verificar se API está rodando
```powershell
curl http://localhost:3000/health
```

### Verificar se Frontend está rodando
```
http://localhost:5173
```

### Logs do Backend
```powershell
cd F:\wamp\www\_agenteMangas\backend
Get-Content logs\combined.log -Tail 50
```

### Recompilar após mudanças
```powershell
# Backend (se necessário)
cd backend
npm run build

# Frontend (hot reload automático)
# Salve os arquivos e Vite recarrega automaticamente
```

---

## 🎉 Status Atual

✅ **Backend API:** Funcionando (porta 3000)  
✅ **Frontend React:** Funcionando (porta 5173)  
✅ **Banco de Dados:** 2.940 mangás importados  
✅ **Imagens:** 768 capas disponíveis  
✅ **Integração:** API ↔ Frontend conectados  

---

## 📸 Screenshots (Conceitual)

### Dashboard
```
┌─────────────────────────────────────────┐
│  📚 Manga Agent                         │
│  [Dashboard] [Mangás] 🌙                │
└─────────────────────────────────────────┘
┌────────┬────────┬────────┬────────┐
│ Total  │ Lendo  │Completo│Pausado │
│ 2,940  │  859   │  450   │  120   │
└────────┴────────┴────────┴────────┘

Top 10 Mais Lidos
1. Martial Peak - 1,377 caps
2. I Have Nine... - 529 caps
3. Magic Emperor - 483 caps
...
```

### Mangás (Grid)
```
┌─────────┬─────────┬─────────┬─────────┐
│  [Capa] │ [Capa]  │ [Capa]  │ [Capa]  │
│  Solo   │ Eleceed │  Nano   │ Tower   │
│ Leveling│   🟢    │ Machine │  of God │
│   🟢    │ Cap: 379│   🟢    │   🟣    │
│Cap: 195 │         │ Cap: 254│Cap: 150 │
└─────────┴─────────┴─────────┴─────────┘
```

---

**Última atualização:** 2025-12-06 01:18  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para uso!
