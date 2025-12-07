# Plano de Refatoração - Sistema Agente Mangás

**Última Atualização:** 2025-12-07
**Status Atual:** Sistema base funcional com Docker, PostgreSQL, API REST e MCP Server
**Objetivo:** Adicionar novas funcionalidades e melhorar arquitetura

---

## 📊 Status do Projeto Atual

### ✅ Implementado

**Infraestrutura:**
- ✅ Docker Compose com 4 serviços (backend, frontend, postgres, pgadmin)
- ✅ Hot reload para desenvolvimento
- ✅ PostgreSQL 15 + pgvector (embeddings 768 dimensões)
- ✅ Volumes persistentes em `storage/`
- ✅ Variáveis de ambiente centralizadas (`.env` raiz)

**Backend:**
- ✅ Node.js 22 + TypeScript + Express
- ✅ API REST completa (`/api/*`)
- ✅ MCP Server funcional
- ✅ Integração Gemini AI (gemini-2.5-flash + gemini-embedding-001)
- ✅ Repositories (manga, tag, reminder, session)
- ✅ Services (manga, ai, image, reminder)
- ✅ Winston logger
- ✅ 2,942 mangás migrados e funcionais

**Frontend:**
- ✅ React 19 + TypeScript + Vite
- ✅ Chakra UI 3.30.0
- ✅ React Router DOM 7.10.1
- ✅ Componentes (Dashboard, MangaList, MangaCard, Chat)
- ✅ Axios para chamadas API
- ✅ Interface responsiva

**Banco de Dados:**
- ✅ Schema completo (mangas, manga_names, tags, manga_tags, reminders, reading_sessions, creators)
- ✅ Extensões: uuid-ossp, pg_trgm, pgvector
- ✅ Soft deletes
- ✅ Triggers e funções
- ✅ Full-text search
- ✅ Busca vetorial semântica

---

## 🎯 Roadmap de Melhorias

### 🔴 Prioridade Alta (1-2 semanas)

#### 1. React Query + TanStack Query
**Objetivo:** Melhorar gerenciamento de estado e cache no frontend

**Benefícios:**
- Cache automático de queries
- Invalidação inteligente
- Loading/error states prontos
- Retry automático
- Deduplicação de requests

**Pacotes:**
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

**Implementação:**
```typescript
// frontend/src/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      gcTime: 1000 * 60 * 30,   // 30 min
      refetchOnWindowFocus: false,
    },
  },
});

export function QueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Hooks personalizados:**
```typescript
// frontend/src/hooks/useManga.ts
export function useMangas(filters: MangaFilters) {
  return useQuery({
    queryKey: ['mangas', filters],
    queryFn: () => api.getMangas(filters),
  });
}

export function useCreateManga() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createManga,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mangas'] });
    },
  });
}
```

---

#### 2. React Hook Form
**Objetivo:** Melhorar performance e validação de formulários

**Benefícios:**
- Menos re-renders
- Validação integrada com Zod
- Mensagens de erro automáticas
- Melhor UX

**Pacotes:**
```bash
npm install react-hook-form @hookform/resolvers
```

**Implementação:**
```typescript
// frontend/src/components/forms/MangaForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const mangaSchema = z.object({
  primary_title: z.string().min(1, 'Título obrigatório'),
  status: z.enum(['reading', 'completed', 'plan_to_read', 'on_hold', 'dropped']),
  last_chapter_read: z.number().int().min(0),
  rating: z.number().min(0).max(10).optional(),
});

type MangaFormData = z.infer<typeof mangaSchema>;

export function MangaForm({ onSubmit, initialData }) {
  const { register, handleSubmit, formState: { errors } } = useForm<MangaFormData>({
    resolver: zodResolver(mangaSchema),
    defaultValues: initialData,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormControl isInvalid={!!errors.primary_title}>
        <FormLabel>Título</FormLabel>
        <Input {...register('primary_title')} />
        <FormErrorMessage>{errors.primary_title?.message}</FormErrorMessage>
      </FormControl>
      {/* ... */}
    </form>
  );
}
```

---

#### 3. Sistema de Kanban Board (React DnD)
**Objetivo:** Organizar mangás visualmente por status com drag and drop

**Benefícios:**
- UX superior para organização
- Mudança rápida de status
- Visualização clara do progresso

**Pacotes:**
```bash
npm install react-dnd react-dnd-html5-backend
```

**Estrutura:**
```
frontend/src/components/kanban/
├── KanbanBoard.tsx       # Container principal
├── KanbanColumn.tsx      # Coluna (status)
├── DraggableMangaCard.tsx # Card arrastável
└── DropZone.tsx          # Zona de drop
```

**Implementação:**
```typescript
// KanbanColumn.tsx
import { useDrop } from 'react-dnd';

export function KanbanColumn({ status, mangas, onDrop }) {
  const [{ isOver }, drop] = useDrop({
    accept: 'MANGA_CARD',
    drop: (item: { id: string }) => onDrop(item.id, status),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  return (
    <Box ref={drop} bg={isOver ? 'blue.100' : 'gray.50'}>
      <Heading>{status} ({mangas.length})</Heading>
      {mangas.map(manga => <DraggableMangaCard key={manga.id} manga={manga} />)}
    </Box>
  );
}
```

---

### 🟡 Prioridade Média (2-3 semanas)

#### 4. Dashboard de Estatísticas
**Objetivo:** Visualizar dados e progresso

**Features:**
- Gráfico de mangás por status (pie chart)
- Gráfico de leitura mensal (line chart)
- Top 10 tags/gêneros
- Média de rating
- Streak de leitura

**Pacotes:**
```bash
npm install recharts
```

**Componentes:**
```typescript
// Dashboard.tsx
import { PieChart, LineChart, BarChart } from 'recharts';

export function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats,
  });

  return (
    <Grid templateColumns="repeat(2, 1fr)" gap={6}>
      <Card>
        <Heading>Mangás por Status</Heading>
        <PieChart data={stats.byStatus} />
      </Card>
      <Card>
        <Heading>Leitura Mensal</Heading>
        <LineChart data={stats.readingHistory} />
      </Card>
    </Grid>
  );
}
```

**Backend Endpoint:**
```typescript
// GET /api/stats/dashboard
router.get('/stats/dashboard', async (req, res) => {
  const byStatus = await db.query(`
    SELECT status, COUNT(*) as count FROM mangas GROUP BY status
  `);

  const readingHistory = await db.query(`
    SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as count
    FROM reading_sessions
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `);

  res.json({ byStatus, readingHistory });
});
```

---

#### 5. Sistema de Coleções
**Objetivo:** Organizar mangás em coleções customizadas

**Features:**
- Criar coleções ("Favoritos", "Ação", "Quero Ler Depois")
- Adicionar/remover mangás
- Compartilhar coleções (link público)

**Schema:**
```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE collection_mangas (
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  manga_id UUID REFERENCES mangas(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  position INTEGER,
  PRIMARY KEY (collection_id, manga_id)
);
```

**API:**
```typescript
// POST /api/collections
// GET /api/collections
// GET /api/collections/:id
// POST /api/collections/:id/mangas
// DELETE /api/collections/:id/mangas/:mangaId
```

---

#### 6. Histórico de Leitura Detalhado
**Objetivo:** Rastrear progresso granular

**Features:**
- Registrar data/hora de cada capítulo
- Tempo de leitura
- Gráfico de progresso
- Estimativa de conclusão

**Schema:**
```sql
CREATE TABLE chapter_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manga_id UUID REFERENCES mangas(id),
  chapter_number INTEGER NOT NULL,
  read_at TIMESTAMP DEFAULT NOW(),
  reading_duration_minutes INTEGER,
  notes TEXT
);

CREATE INDEX idx_chapter_reads_manga ON chapter_reads(manga_id);
CREATE INDEX idx_chapter_reads_date ON chapter_reads(read_at);
```

**Backend Service:**
```typescript
class ReadingHistoryService {
  async recordChapterRead(mangaId: string, chapter: number, duration?: number) {
    await db.query(`
      INSERT INTO chapter_reads (manga_id, chapter_number, reading_duration_minutes)
      VALUES ($1, $2, $3)
    `, [mangaId, chapter, duration]);

    // Update last_chapter_read in mangas table
    await db.query(`
      UPDATE mangas SET last_chapter_read = $1 WHERE id = $2
    `, [chapter, mangaId]);
  }

  async getReadingHistory(mangaId: string) {
    return db.query(`
      SELECT * FROM chapter_reads WHERE manga_id = $1 ORDER BY chapter_number
    `, [mangaId]);
  }
}
```

---

### 🟢 Prioridade Baixa (3-4 semanas)

#### 7. Busca Semântica Avançada
**Objetivo:** Melhorar busca por similaridade

**Features:**
- "Mostre mangás parecidos com Solo Leveling"
- Busca por descrição natural
- Recomendações baseadas em histórico

**Implementação:**
```typescript
// Service já tem embeddings, basta melhorar a query
async function semanticSearch(query: string, limit = 10) {
  const embedding = await generateEmbedding(query);

  const results = await db.query(`
    SELECT
      m.*,
      1 - (m.embedding <=> $1::vector) AS similarity
    FROM mangas m
    WHERE m.embedding IS NOT NULL
    ORDER BY m.embedding <=> $1::vector
    LIMIT $2
  `, [embedding, limit]);

  return results.rows;
}
```

**Frontend:**
```typescript
// SearchBar com modo semântico
<SearchBar
  onSearch={(query, mode) => {
    if (mode === 'semantic') {
      api.semanticSearch(query);
    } else {
      api.textSearch(query);
    }
  }}
/>
```

---

#### 8. Notificações Push
**Objetivo:** Avisar sobre novos capítulos e lembretes

**Features:**
- Notificação push (Web Push API)
- Lembretes semanais
- Alertas de mangás pausados

**Implementação:**
```typescript
// Backend: node-cron
import cron from 'node-cron';

// Executar toda segunda às 9h
cron.schedule('0 9 * * 1', async () => {
  const staleMangas = await db.query(`
    SELECT * FROM mangas
    WHERE status = 'on_hold'
    AND updated_at < NOW() - INTERVAL '30 days'
  `);

  // Enviar notificações
  await sendPushNotifications(staleMangas);
});
```

**Frontend:**
```typescript
// Solicitar permissão para notificações
async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY,
    });
  }
}
```

---

#### 9. Import/Export
**Objetivo:** Portabilidade de dados

**Features:**
- Exportar para JSON/CSV
- Importar de MyAnimeList/AniList
- Backup automático

**Endpoints:**
```typescript
// GET /api/export/json
router.get('/export/json', async (req, res) => {
  const mangas = await mangaService.getAllMangas();
  res.json({ version: '1.0', mangas });
});

// POST /api/import/mal
router.post('/import/mal', async (req, res) => {
  const { username } = req.body;
  const malData = await fetchMALData(username);
  await importFromMAL(malData);
  res.json({ imported: malData.length });
});
```

---

## 🛠️ Considerações Técnicas

### Migração vs Refatoração Incremental

**Decisão:** Refatoração incremental (não adotar Sequelize agora)

**Motivos:**
1. Sistema atual funciona bem com queries diretas
2. 2,942 mangás já migrados e estáveis
3. Sequelize adiciona overhead desnecessário
4. Melhor focar em features que trazem valor ao usuário

**Alternativa:**
- Manter estrutura atual (repositories + queries SQL diretas)
- Adicionar TypeScript strict types para queries
- Usar Zod para validação de dados

---

### Performance

**Otimizações necessárias:**
1. **Paginação:** Adicionar limit/offset em todas as listagens
2. **Índices:** Verificar índices em queries lentas
3. **Cache:** React Query já resolve cache no frontend
4. **Lazy Loading:** Imagens com loading lazy
5. **Code Splitting:** Dividir bundle do frontend por rotas

**Monitoramento:**
```typescript
// Adicionar middleware de timing
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${duration}ms`);
  });
  next();
});
```

---

### TypeScript Strictness

**Melhorias:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Tipos compartilhados:**
```typescript
// shared/types.ts (compartilhado entre backend e frontend)
export interface Manga {
  id: string;
  primary_title: string;
  status: MangaStatus;
  last_chapter_read: number;
  rating?: number;
  synopsis?: string;
  image_filename?: string;
  tags?: Tag[];
  created_at: Date;
  updated_at: Date;
}

export type MangaStatus = 'reading' | 'completed' | 'plan_to_read' | 'on_hold' | 'dropped';
```

---

## 📋 Checklist de Implementação

### Fase 1: React Query (3-5 dias)
- [ ] Instalar `@tanstack/react-query`
- [ ] Criar `QueryProvider`
- [ ] Criar hooks customizados (`useManga`, `useMangas`, `useTags`)
- [ ] Refatorar componentes existentes
- [ ] Adicionar React Query Devtools
- [ ] Testar invalidação de cache

### Fase 2: React Hook Form (2-3 dias)
- [ ] Instalar `react-hook-form` e `@hookform/resolvers`
- [ ] Criar schemas Zod para formulários
- [ ] Criar `MangaForm` component
- [ ] Criar `TagForm` component
- [ ] Adicionar validação de imagens
- [ ] Testar todos os formulários

### Fase 3: Kanban Board (4-6 dias)
- [ ] Instalar `react-dnd` e `react-dnd-html5-backend`
- [ ] Criar estrutura de componentes
- [ ] Implementar drag and drop
- [ ] Adicionar animações
- [ ] Persistir mudanças no backend
- [ ] Testar UX em diferentes telas

### Fase 4: Dashboard (3-5 dias)
- [ ] Instalar `recharts`
- [ ] Criar endpoint `/api/stats/dashboard`
- [ ] Criar componentes de gráficos
- [ ] Implementar filtros de período
- [ ] Adicionar export de estatísticas

### Fase 5: Coleções (5-7 dias)
- [ ] Criar migrations para tabelas
- [ ] Implementar API endpoints
- [ ] Criar frontend de coleções
- [ ] Adicionar compartilhamento público
- [ ] Testar permissões

### Fase 6: Histórico Detalhado (3-4 dias)
- [ ] Criar migration `chapter_reads`
- [ ] Implementar service de tracking
- [ ] Criar gráfico de progresso
- [ ] Adicionar estimativa de conclusão

---

## 🎯 Priorização Recomendada

**Ordem sugerida de implementação:**

1. **React Query** (máximo ROI) - Melhora toda a experiência
2. **React Hook Form** - Pequeno esforço, grande melhoria
3. **Kanban Board** - Feature visual de alto impacto
4. **Dashboard** - Engajamento do usuário
5. **Coleções** - Organização avançada
6. **Histórico Detalhado** - Analytics pessoal
7. **Busca Semântica Avançada** - Já temos base
8. **Notificações** - Retenção de usuário
9. **Import/Export** - Portabilidade

---

## 📊 Métricas de Sucesso

**Após implementação, medir:**
- Tempo de carregamento de páginas
- Número de re-renders (React DevTools)
- Tamanho do bundle final
- Satisfação do usuário (feedback)
- Bugs encontrados

---

## 🚀 Comandos Úteis

```bash
# Desenvolvimento
docker-compose up -d
docker-compose logs -f backend
docker-compose exec backend npm install <pacote>

# Frontend
cd frontend
npm install @tanstack/react-query
npm run dev

# Backend
cd backend
npm install
npm run dev

# Testes
npm test
npm run test:watch
```

---

**Última atualização:** 2025-12-07
**Status:** Pronto para iniciar Fase 1 (React Query)
