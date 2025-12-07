import { getChatModel } from '../config/gemini';
import { mangaCrudTools } from '../mcp/tools/manga-crud';
import { chapterTrackingTools } from '../mcp/tools/chapter-tracking';
import { reminderTools } from '../mcp/tools/reminders';
import { imageTools } from '../mcp/tools/images';
import { aiAssistantTools } from '../mcp/tools/ai-assistant';
import { tagTools } from '../mcp/tools/tags';
import { mangaScraperTools } from '../mcp/tools/manga-scraper';
import { mangaService } from './manga.service';
import { sqlQueryTool, DATABASE_SCHEMA } from '../tools/sql-query.tool';
import { logger } from '../utils/logger';

// ============================================
// CHAT SERVICE - AI-Powered Command Execution
// ============================================

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolExecuted?: string;
}

interface ChatResponse {
  response: string;
  toolExecuted?: string;
  data?: any;
}

interface ChatSession {
  messages: ChatMessage[];
  lastActivity: Date;
}

export class ChatService {
  private tools = {
    ...mangaCrudTools,
    ...chapterTrackingTools,
    ...reminderTools,
    ...imageTools,
    ...aiAssistantTools,
    ...tagTools,
    ...mangaScraperTools,
  };

  // In-memory chat sessions (in production, use Redis or database)
  private sessions: Map<string, ChatSession> = new Map();
  private readonly MAX_HISTORY = 10; // Keep last 10 messages
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  // Get or create chat session
  private getSession(sessionId: string): ChatSession {
    let session = this.sessions.get(sessionId);

    if (!session || Date.now() - session.lastActivity.getTime() > this.SESSION_TIMEOUT) {
      session = {
        messages: [],
        lastActivity: new Date(),
      };
      this.sessions.set(sessionId, session);
    }

    return session;
  }

  // Add message to session history
  private addToHistory(sessionId: string, role: 'user' | 'assistant', content: string, toolExecuted?: string) {
    const session = this.getSession(sessionId);
    
    session.messages.push({
      role,
      content,
      timestamp: new Date(),
      toolExecuted,
    });

    // Keep only last N messages
    if (session.messages.length > this.MAX_HISTORY) {
      session.messages = session.messages.slice(-this.MAX_HISTORY);
    }

    session.lastActivity = new Date();
  }

  // Get conversation history for context
  private getConversationHistory(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session || session.messages.length === 0) {
      return '';
    }

    return session.messages
      .map(msg => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`)
      .join('\n\n');
  }

  // Main chat method with tool execution
  async processMessage(message: string, sessionId: string = 'default', context?: any): Promise<ChatResponse> {
    logger.info('Processing chat message', { message, sessionId });

    // Add user message to history
    this.addToHistory(sessionId, 'user', message);

    try {
      // Check if query needs custom SQL (complex queries)
      if (this.needsCustomQuery(message)) {
        return await this.handleCustomQuery(message, sessionId);
      }

      // Check if user wants to list mangas with alternative names
      if (this.isListAlternativeNamesQuery(message)) {
        const limit = this.extractLimit(message) || 10;
        const mangas = await mangaService.getMangasWithAlternativeNames(limit);

        const result = {
          response: mangas.length === 0 
            ? 'Não encontrei mangás com nomes alternativos cadastrados.'
            : `📚 **Mangás com Nomes Alternativos** (${mangas.length} encontrados):\n\n${mangas.map((m, index) => {
                const altNames = m.alternative_names.length > 0 
                  ? m.alternative_names.map(n => `  • ${n}`).join('\n')
                  : '  • Nenhum nome alternativo';
                return `${index + 1}. **${m.primary_title}**\n${altNames}`;
              }).join('\n\n')}`,
          toolExecuted: 'list_mangas_with_alt_names',
          data: mangas,
        };

        this.addToHistory(sessionId, 'assistant', result.response, result.toolExecuted);
        return result;
      }

      // Check if user wants to search/list multiple mangas
      if (this.isSearchListQuery(message)) {
        const searchTerm = this.extractSearchTerm(message);
        const limit = this.extractLimit(message) || 50;
        
        if (searchTerm) {
          const searchResult = await mangaService.searchMangas({
            query: searchTerm,
            limit,
          });

          const result = {
            response: searchResult.data.length === 0 
              ? `Não encontrei mangás com "${searchTerm}" no título.`
              : `📚 **Mangás encontrados com "${searchTerm}"** (${searchResult.data.length} de ${searchResult.total}):\n\n${searchResult.data.map((m, index) => {
                  const altNames = (m.alternative_names && m.alternative_names.length > 0)
                    ? `\n   Nomes alternativos: ${m.alternative_names.join(', ')}`
                    : '';
                  const tags = (m.tags && m.tags.length > 0)
                    ? `\n   Tags: ${m.tags.join(', ')}`
                    : '';
                  return `${index + 1}. **${m.primary_title}**${altNames}\n   Status: ${m.status || 'Não definido'} • Capítulos: ${m.last_chapter_read || 0}${tags}`;
                }).join('\n\n')}`,
            toolExecuted: 'search_manga',
            data: searchResult.data,
          };

          this.addToHistory(sessionId, 'assistant', result.response, result.toolExecuted);
          return result;
        }
      }

      // Check if user is asking about a specific manga by name
      const mangaQuery = await this.extractMangaTitle(message);
      if (mangaQuery) {
        const searchResult = await mangaService.searchMangas({
          query: mangaQuery,
          search_type: 'title',
          limit: 1,
        });

        if (searchResult.data.length > 0) {
          const manga = searchResult.data[0];
          
          // Get complete manga details
          const completeManga = await mangaService.getCompleteMangaById(manga.id);
          
          if (completeManga) {
            const altNames = completeManga.alternative_names || [];
            const tags = completeManga.tags || [];
            
            const info = `📚 **${completeManga.primary_title}**

**Nomes Alternativos:**
${altNames.length > 0 ? altNames.map(n => `• ${n}`).join('\n') : '• Nenhum nome alternativo cadastrado'}

**Status:** ${completeManga.status}
**Capítulos:** ${completeManga.last_chapter_read}${completeManga.total_chapters ? `/${completeManga.total_chapters}` : ''}
**Avaliação:** ${completeManga.rating ? `${completeManga.rating}/10` : 'Não avaliado'}
**Tags:** ${tags.length > 0 ? tags.join(', ') : 'Nenhuma'}
${completeManga.synopsis ? `\n**Sinopse:** ${completeManga.synopsis}` : ''}
${completeManga.user_notes ? `\n**Notas:** ${completeManga.user_notes}` : ''}`;

            const result = {
              response: info,
              toolExecuted: 'get_manga_info',
              data: completeManga,
            };

            this.addToHistory(sessionId, 'assistant', result.response, result.toolExecuted);
            return result;
          }
        }
      }

      // First, use AI to understand intent and extract parameters
      const conversationHistory = this.getConversationHistory(sessionId);
      const intent = await this.analyzeIntent(message, context, conversationHistory);

      logger.info('Intent analyzed', { intent });

      // If a tool should be executed
      if (intent.tool && this.tools[intent.tool as keyof typeof this.tools]) {
        const tool = this.tools[intent.tool as keyof typeof this.tools];
        const result = await tool(intent.parameters || {});

        // Format the response
        const toolResponse = result.content[0].text;
        
        const response = {
          response: toolResponse,
          toolExecuted: intent.tool,
          data: (result as any).data || null,
        };

        this.addToHistory(sessionId, 'assistant', toolResponse, intent.tool);
        return response;
      }

      // If no tool, just chat
      const chatResponse = intent.response || await this.simpleChat(message, context, conversationHistory);
      const result = { response: chatResponse };
      
      this.addToHistory(sessionId, 'assistant', chatResponse);
      return result;
    } catch (error) {
      logger.error('Chat processing error', { 
        error,
        message,
        sessionId,
        stack: error instanceof Error ? error.stack : undefined,
        details: error instanceof Error ? error.message : String(error)
      });
      const errorResponse = 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente reformular ou ser mais específico.';
      this.addToHistory(sessionId, 'assistant', errorResponse);
      return { response: errorResponse };
    }
  }

  // Check if query needs custom SQL
  private needsCustomQuery(message: string): boolean {
    const complexPatterns = [
      /últimos?\s+(?:mangás?\s+)?lidos?/i,
      /(?:liste?|mostre)\s+(?:os?\s+)?últimos?\s+(?:mangás?\s+)?lidos?/i,
      /recente(?:s|mente)\s+lidos?/i,
      /lidos?\s+recente/i,
      /quantos?\s+mangás?/i,
      /média\s+de/i,
      /top\s+\d+/i,
      /mais\s+lidos?/i,
      /menos\s+lidos?/i,
      /estatísticas?/i,
      /agrupa[dr]/i,
      /compare?/i,
      /(?:liste?|mostre)\s+(?:todos?|apenas)\s+(?:os?\s+)?mangás?\s+(?:que|com|onde)/i,
    ];

    return complexPatterns.some(pattern => pattern.test(message));
  }

  // Handle custom SQL query generation
  private async handleCustomQuery(message: string, sessionId: string): Promise<ChatResponse> {
    try {
      const model = getChatModel();

      const prompt = `Você é um especialista em SQL PostgreSQL. Com base no schema do banco de dados e na pergunta do usuário, gere uma query SQL SELECT válida.

${DATABASE_SCHEMA}

REGRAS IMPORTANTES:
1. Use APENAS comandos SELECT
2. Use a view v_manga_complete quando possível (tem alternative_names, tags e image_filename)
3. Para "últimos lidos", use: SELECT * FROM v_manga_complete WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT 10
4. Para ordenar por leitura recente, use updated_at DESC
5. Use LIMIT para limitar resultados (padrão: 10 para listagens)
6. Sempre adicione WHERE deleted_at IS NULL para excluir mangás deletados
7. Retorne TODAS as colunas da view v_manga_complete para que o frontend possa renderizar os cards
8. Retorne apenas a query SQL, sem explicações

EXEMPLOS:
- "últimos lidos" → SELECT * FROM v_manga_complete WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT 10
- "top 5 com maior rating" → SELECT * FROM v_manga_complete WHERE deleted_at IS NULL ORDER BY rating DESC NULLS LAST LIMIT 5
- "mangás de ação" → SELECT * FROM v_manga_complete WHERE deleted_at IS NULL AND 'Ação' = ANY(tags) LIMIT 10

PERGUNTA DO USUÁRIO:
${message}

RESPONDA APENAS COM A QUERY SQL:`;

      const aiResponse = await model.generateContent(prompt);
      let sqlQuery = aiResponse.response.text().trim();

      // Clean up the response
      sqlQuery = sqlQuery.replace(/```sql\n?/g, '').replace(/```\n?/g, '').trim();

      logger.info('Generated SQL query', { query: sqlQuery });

      // Execute the query
      const queryResult = await sqlQueryTool.executeQuery(sqlQuery);

      if (!queryResult.success) {
        return {
          response: `❌ Erro ao executar query: ${queryResult.error}\n\nQuery gerada:\n\`\`\`sql\n${queryResult.executedQuery}\n\`\`\``,
          toolExecuted: 'sql_query',
        };
      }

      // Format the results
      const formattedResults = this.formatQueryResults(queryResult.data || [], message);

      const result = {
        response: formattedResults,
        toolExecuted: 'sql_query',
        data: queryResult.data,
      };

      this.addToHistory(sessionId, 'assistant', result.response, result.toolExecuted);
      return result;
    } catch (error) {
      logger.error('Custom query error', { error });
      const errorResult = {
        response: 'Desculpe, não consegui processar essa consulta complexa. Tente reformular ou ser mais específico.',
        toolExecuted: 'sql_query',
      };
      this.addToHistory(sessionId, 'assistant', errorResult.response, errorResult.toolExecuted);
      return errorResult;
    }
  }

  // Format query results for display
  private formatQueryResults(data: any[], originalMessage: string): string {
    if (data.length === 0) {
      return 'Nenhum resultado encontrado.';
    }

    // If it's a simple count or aggregate
    if (data.length === 1 && Object.keys(data[0]).length <= 2) {
      return Object.entries(data[0])
        .map(([key, value]) => `**${key}:** ${value}`)
        .join('\n');
    }

    // If it's manga list
    if (data[0].primary_title) {
      return data.map((manga, index) => {
        let result = `${index + 1}. **${manga.primary_title}**`;
        
        if (manga.alternative_names || manga.alt_names) {
          const altNames = manga.alternative_names || manga.alt_names;
          if (Array.isArray(altNames) && altNames.length > 0) {
            result += `\n   Nomes: ${altNames.join(', ')}`;
          }
        }
        
        if (manga.status) result += `\n   Status: ${manga.status}`;
        if (manga.rating) result += ` • Rating: ${manga.rating}/10`;
        if (manga.last_chapter_read !== undefined) {
          result += `\n   Capítulos: ${manga.last_chapter_read}${manga.total_chapters ? `/${manga.total_chapters}` : ''}`;
        }
        if (manga.tags && Array.isArray(manga.tags)) {
          result += `\n   Tags: ${manga.tags.join(', ')}`;
        }
        
        return result;
      }).join('\n\n');
    }

    // Generic table format
    const keys = Object.keys(data[0]);
    return data.map((row, index) => {
      const values = keys.map(key => `**${key}:** ${row[key]}`).join(' • ');
      return `${index + 1}. ${values}`;
    }).join('\n');
  }

  // Check if query is asking for list of mangas with alternative names
  private isListAlternativeNamesQuery(message: string): boolean {
    const patterns = [
      /liste?\s+(?:\d+\s+)?mangás?\s+(?:que\s+)?(?:possuam?|com|tenham?)\s+nomes?\s+alternativos?/i,
      /(?:mostre|exiba)\s+mangás?\s+(?:que\s+)?(?:possuam?|com|tenham?)\s+nomes?\s+alternativos?/i,
      /quais\s+mangás?\s+(?:possuem|tem|têm)\s+nomes?\s+alternativos?/i,
    ];

    return patterns.some(pattern => pattern.test(message));
  }

  // Check if user wants to search/list multiple mangas
  private isSearchListQuery(message: string): boolean {
    const lowerMsg = message.toLowerCase();
    
    // Simpler keyword-based detection to avoid UTF-8 issues
    const hasSearchKeywords = (
      (lowerMsg.includes('traga') || lowerMsg.includes('liste') || lowerMsg.includes('mostre') || lowerMsg.includes('busque')) &&
      (lowerMsg.includes('todos') || lowerMsg.includes('todas'))
    );
    
    const hasQueryKeywords = (
      (lowerMsg.includes('query') || lowerMsg.includes('busca') || lowerMsg.includes('pesquisa')) &&
      (lowerMsg.includes('traga') || lowerMsg.includes('liste'))
    );

    return hasSearchKeywords || hasQueryKeywords;
  }

  // Extract search term from search/list query
  private extractSearchTerm(message: string): string | null {
    // Try patterns that extract specific terms
    const patterns = [
      // "mangás com o nome X" or "mangás com nome X"
      /mang.+(?:com|que).+(?:nome|t.tulo)\s+["']?([^"'?!.,\s]+)["']?/i,
      // "traga todos os mangás com X"
      /traga\s+todos?.+mang.+\s+com.+\s+([A-Za-z0-9]+)/i,
      // "buscar/listar X"
      /(?:busca|lista|mostre?|procure?).+\s+([A-Za-z0-9]+)$/i,
      // Quoted terms
      /["']([^"']+)["']/,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1] && match[1].length > 1) {
        return match[1].trim();
      }
    }

    return null;
  }

  // Extract limit from message
  private extractLimit(message: string): number | null {
    const match = message.match(/(\d+)\s+mangás?/i);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return null;
  }

  // Extract manga title from message
  private async extractMangaTitle(message: string): Promise<string | null> {
    const patterns = [
      /(?:informações|info|detalhes|dados|nomes?)(?: sobre| de| do| da)?\s+(?:o mangá|mangá)?\s*["']?([^"'?!.]+)["']?/i,
      /(?:quais|mostre|liste)(?: os)? nomes? (?:alternativos?|cadastrados?)?(?: (?:de|do|da|para))?\s+["']?([^"'?!.]+)["']?/i,
      /["']([^"']+)["']/,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  // Analyze user intent using Gemini AI
  private async analyzeIntent(message: string, context?: any, conversationHistory?: string): Promise<any> {
    const model = getChatModel();

    const systemPrompt = `Você é um assistente inteligente de mangás. Analise a mensagem do usuário e determine:
1. Se é necessário executar uma ferramenta (tool)
2. Quais parâmetros extrair da mensagem
3. Ou se é apenas uma conversa geral

FERRAMENTAS DISPONÍVEIS:

**CRUD de Mangás:**
- create_manga: Criar novo mangá
  Parâmetros: primary_title (obrigatório), url, image_url, synopsis, tags[], status, rating, alternative_names[]
  IMPORTANTE: Extraia TODOS os dados do texto do usuário, incluindo:
    * Título: primeira linha ou texto destacado
    * Tags: palavras após o título ou palavras-chave (Ação, Gore, Horror, etc)
    * Sinopse: parágrafo longo descritivo
    * Status: "OnGoing" → "reading", "Completed" → "completed", "Dropped" → "dropped"
    * Rating/Rate: número de 0-10
    * URL de imagem: links que terminam em .jpg, .png, .webp
    * URL da página: outros links HTTP
    * Alternative names: após "Alternative:" ou nomes separados por /
    * Author/Artist: capture mas não use (não há campo para isso ainda)
  Exemplo: "Adicione o mangá One Piece"
  Exemplo completo: Cole TODOS os dados de uma página de mangá e a IA vai organizar automaticamente
  
- search_manga: Buscar mangás
  Parâmetros: query, search_type (title/semantic/all), tags[], status[], limit
  Exemplo: "Liste mangás de ação", "Busque mangás com tag shounen"
  
- get_manga: Obter informações completas de um mangá específico
  Parâmetros: manga_id (obrigatório)
  Exemplo: "Mostre informações de One Piece", "Quais nomes alternativos de Naruto?"
  
- update_manga: Atualizar mangá
  Parâmetros: manga_id, updates {
    primary_title: string,
    add_names: string[] (adicionar nomes alternativos),
    remove_names: string[] (remover nomes alternativos),
    url: string,
    synopsis: string,
    user_notes: string,
    status: string,
    rating: number (0-10),
    total_chapters: number,
    add_tags: string[] (adicionar tags),
    remove_tags: string[] (remover tags)
  }
  Exemplo: "Atualize o status de Naruto para completed"
  Exemplo: "Adicione os nomes alternativos 'Naruto Shippuden' e 'Naruto Part II' ao mangá Naruto"
  IMPORTANTE: Para adicionar nomes alternativos, use add_names (NÃO alternative_names!)
  
- delete_manga: Deletar mangá
  Parâmetros: manga_id, permanent
  Exemplo: "Delete o mangá com ID xxx"

**Rastreamento de Capítulos:**
- track_chapter: Registrar capítulo lido
  Parâmetros: manga_id, chapter_number, create_session
  Exemplo: "Li até o capítulo 50 de One Piece"
  
- get_manga_stats: Ver estatísticas de leitura
  Parâmetros: manga_id
  Exemplo: "Qual meu progresso em Naruto?"

**Lembretes:**
- set_reminder: Criar lembrete
  Parâmetros: manga_id, reminder_type (check_updates/read_next/custom), message, scheduled_for
  Exemplo: "Crie um lembrete para ler Bleach amanhã"

**Imagens:**
- download_image: Baixar imagem de capa
  Parâmetros: manga_id, image_url
  Exemplo: "Baixe a capa de One Piece de https://..."

**IA Assistente:**
- get_recommendations: Recomendações
  Parâmetros: based_on_manga_id ou based_on_tags[], limit
  Exemplo: "Recomende mangás similares a Solo Leveling"
  
- analyze_reading_habits: Análise de hábitos
  Parâmetros: time_period_days
  Exemplo: "Analise meus hábitos de leitura"

**Tags:**
- get_popular_tags: Tags populares
  Parâmetros: limit

**Web Scraping (NOVO):**
- search_manga_info: Buscar informações de mangá na web (Google -> MyAnimeList/AniList -> Tradução PT)
  Parâmetros: mangaName (obrigatório), translate (opcional, padrão: true)
  Exemplo: "Busque informações sobre Chainsaw Man na web"
  Exemplo: "Pesquise dados de Jujutsu Kaisen online"
  Exemplo: "Procure informações de Solo Leveling em inglês"
  
- scrape_manga_url: Extrair informações de URL específica de mangá
  Parâmetros: url (obrigatório), translate (opcional, padrão: true)
  Exemplo: "Extraia dados de https://myanimelist.net/manga/116778/Jujutsu_Kaisen"

RESPONDA EM JSON:
{
  "tool": "nome_da_tool" ou null,
  "parameters": {objeto com parâmetros} ou null,
  "response": "resposta em texto se não precisar de tool"
}

CONTEXTO ATUAL:
${context ? JSON.stringify(context, null, 2) : 'Nenhum contexto disponível'}

${conversationHistory ? `HISTÓRICO DA CONVERSA:\n${conversationHistory}\n\n` : ''}

MENSAGEM DO USUÁRIO:
${message}`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();

    // Try to parse JSON from response
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                        responseText.match(/```\n([\s\S]*?)\n```/) ||
                        responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonText = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonText);
      }

      // Try to parse the whole response
      return JSON.parse(responseText);
    } catch (e) {
      logger.warn('Failed to parse intent JSON', { responseText });
      return { tool: null, response: responseText };
    }
  }

  // Simple chat without tool execution
  private async simpleChat(message: string, context?: any, conversationHistory?: string): Promise<string> {
    const model = getChatModel();
    
    const prompt = `Você é um assistente amigável de gerenciamento de mangás.
    
CONTEXTO:
${context ? JSON.stringify(context, null, 2) : 'Nenhum'}

${conversationHistory ? `HISTÓRICO DA CONVERSA:\n${conversationHistory}\n\n` : ''}

USUÁRIO: ${message}

Responda de forma útil e amigável. Se o usuário está pedindo para fazer algo, explique como pode ajudar com as ferramentas disponíveis.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}

export const chatService = new ChatService();
