import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { MangaService } from '../services/manga.service.js';
import { ImageService } from '../services/image.service.js';
import { ReminderService } from '../services/reminder.service.js';
import { AIService } from '../services/ai.service.js';
import { chatService } from '../services/chat.service.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { CreateMangaInput, UpdateMangaInput, MangaStatus } from '../models/manga.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Serve images from storage/images directory
// In Docker, storage is mounted at /app/storage
const imagesPath = process.env.IMAGES_PATH || '/app/storage/images';
app.use('/images', express.static(imagesPath));
logger.info(`Serving images from: ${imagesPath}`);

// Services
const mangaService = new MangaService();
const imageService = new ImageService();
const reminderService = new ReminderService();
const aiService = new AIService();

// Error handling middleware
const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('API Error:', err);

  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }

  return res.status(500).json({ error: 'Internal server error', message: err.message });
};

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== MANGA ROUTES ====================

// Get all mangas with filters
app.get('/api/mangas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      query, 
      status, 
      tags, 
      minRating, 
      with_covers,
      sort_by,
      sort_order,
      limit = '50', 
      offset = '0'
    } = req.query;

    const searchInput: any = {
      query: query as string || '',
      search_type: 'title',
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    if (status) searchInput.status = (status as string).split(',') as MangaStatus[];
    if (tags) searchInput.tags = (tags as string).split(',');
    if (minRating) searchInput.min_rating = parseFloat(minRating as string);
    if (with_covers === 'true') searchInput.with_covers = true;
    if (sort_by) searchInput.sort_by = sort_by as string;
    if (sort_order) searchInput.sort_order = sort_order as string;

    const result = await mangaService.searchMangas(searchInput);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get single manga by ID
app.get('/api/mangas/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const manga = await mangaService.getMangaById(req.params.id);
    if (!manga) {
      throw new NotFoundError('Manga not found');
    }
    res.json(manga);
  } catch (error) {
    next(error);
  }
});

// Create new manga
app.post('/api/mangas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: CreateMangaInput = req.body;
    const manga = await mangaService.createManga(input);
    res.status(201).json(manga);
  } catch (error) {
    next(error);
  }
});

// Update manga
app.patch('/api/mangas/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates: UpdateMangaInput = req.body;
    const manga = await mangaService.updateManga(req.params.id, updates);
    res.json(manga);
  } catch (error) {
    next(error);
  }
});

// Delete manga
app.delete('/api/mangas/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const permanent = req.query.permanent === 'true';
    await mangaService.deleteManga(req.params.id, permanent);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Track chapter progress
app.post('/api/mangas/:id/chapters', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chapterNumber, createSession } = req.body;
    const manga = await mangaService.trackChapter({
      manga_id: req.params.id,
      chapter_number: chapterNumber,
      create_session: createSession,
    });
    res.json(manga);
  } catch (error) {
    next(error);
  }
});

// Get reading history
app.get('/api/mangas/:id/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    // TODO: Implement getReadingHistory in MangaService
    res.json({ message: 'Reading history endpoint not yet implemented', limit });
  } catch (error) {
    next(error);
  }
});

// Download image for manga
app.post('/api/mangas/:id/image', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      throw new ValidationError('imageUrl is required');
    }
    const filename = await imageService.downloadImage(imageUrl, req.params.id);
    res.json({ filename, url: `/images/${filename}` });
  } catch (error) {
    next(error);
  }
});

// ==================== STATISTICS ROUTES ====================

app.get('/api/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await mangaService.getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

app.get('/api/stats/top-read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const mangas = await mangaService.getTopRead(limit);
    res.json(mangas);
  } catch (error) {
    next(error);
  }
});

app.get('/api/stats/recently-updated', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const mangas = await mangaService.getRecentlyUpdated(limit);
    res.json(mangas);
  } catch (error) {
    next(error);
  }
});

// ==================== REMINDERS ROUTES ====================

app.get('/api/reminders', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const reminders = await reminderService.getActiveReminders();
    res.json(reminders);
  } catch (error) {
    next(error);
  }
});

app.post('/api/reminders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reminder = await reminderService.createReminder(req.body);
    res.status(201).json(reminder);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/reminders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await reminderService.deleteReminder(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ==================== TAGS ROUTES ====================

app.get('/api/tags', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tags = await mangaService.listTags();
    res.json(tags);
  } catch (error) {
    next(error);
  }
});

app.get('/api/tags/popular', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const tags = await mangaService.getPopularTags(limit);
    res.json(tags);
  } catch (error) {
    next(error);
  }
});

// ==================== AI CHAT ROUTES ====================

// Chat with AI (with MCP tool execution and conversation history)
app.post('/api/ai/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message || typeof message !== 'string') {
      throw new ValidationError('Message is required');
    }

    const chatSessionId = sessionId || 'default';
    logger.info('AI chat request', { message, sessionId: chatSessionId });

    // Get context: recent mangas and user stats
    const recentMangas = await mangaService.searchMangas({
      limit: 10,
      offset: 0,
    });

    const context = {
      totalMangas: recentMangas.total,
      recentMangas: (recentMangas.data || []).slice(0, 5).map((m: any) => ({
        id: m.id,
        title: m.primary_title,
        status: m.status,
        lastChapter: m.last_chapter_read,
        totalChapters: m.total_chapters,
        rating: m.rating,
      })),
    };

    // Use chat service with MCP tools and conversation history
    const result = await chatService.processMessage(message, chatSessionId, context);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Analyze reading habits
app.get('/api/ai/analyze', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const analysis = await aiService.analyzeReadingHabits(days);
    res.json(analysis);
  } catch (error) {
    next(error);
  }
});

// ==================== MANGA SCRAPER ROUTES ====================

// Search manga info on the web
app.post('/api/scraper/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mangaName, translate = true } = req.body;

    if (!mangaName) {
      throw new ValidationError('mangaName is required');
    }

    const { searchAndScrapeManga } = await import('../mcp/tools/manga-scraper.js');
    const results = await searchAndScrapeManga(mangaName, translate);

    res.json({
      success: true,
      resultsFound: results.length,
      results: results
    });
  } catch (error) {
    next(error);
  }
});

// Scrape specific manga URL
app.post('/api/scraper/url', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, translate = true } = req.body;

    if (!url) {
      throw new ValidationError('url is required');
    }

    const { scrapeMangaPage, translateMangaInfo } = await import('../mcp/tools/manga-scraper.js');
    let info = await scrapeMangaPage(url);

    if (translate && info.title) {
      info = await translateMangaInfo(info);
    }

    res.json({
      success: !!info.title,
      info: info
    });
  } catch (error) {
    next(error);
  }
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 API Server running on http://localhost:${PORT}`);
  logger.info(`📊 Stats: http://localhost:${PORT}/api/stats`);
  logger.info(`📚 Mangas: http://localhost:${PORT}/api/mangas`);
  logger.info(`🤖 AI Chat: http://localhost:${PORT}/api/ai/chat`);
  logger.info(`🔍 Scraper: http://localhost:${PORT}/api/scraper/search`);
});

export default app;
