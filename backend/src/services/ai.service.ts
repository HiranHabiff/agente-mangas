import { getChatModel, generateEmbedding as geminiGenerateEmbedding } from '../config/gemini';
import { mangaRepository } from '../repositories/manga.repository';
import { sessionRepository } from '../repositories/session.repository';
import { tagRepository } from '../repositories/tag.repository';
import type { ReadingHabitAnalysis } from '../models/manga.model';
import { logger } from '../utils/logger';

// ============================================
// AI SERVICE (Gemini Integration)
// ============================================

export class AIService {
  // Generate embedding for text
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for embedding generation');
    }

    logger.info('Generating embedding', { textLength: text.length });
    return await geminiGenerateEmbedding(text);
  }

  // Generate and store embedding for a manga
  async generateMangaEmbedding(mangaId: string): Promise<void> {
    const manga = await mangaRepository.findCompleteById(mangaId);
    if (!manga) {
      throw new Error('Manga not found');
    }

    // Create text from manga data for embedding
    const embeddingText = this.createEmbeddingText(manga);

    if (embeddingText.trim().length === 0) {
      logger.warn('No text available for embedding', { mangaId });
      return;
    }

    const embedding = await this.generateEmbedding(embeddingText);
    await mangaRepository.updateEmbedding(mangaId, embedding);

    logger.info('Manga embedding generated and stored', { mangaId });
  }

  // Generate embeddings for all mangas (batch)
  async generateAllEmbeddings(): Promise<void> {
    const mangas = await mangaRepository.findAll();
    logger.info('Generating embeddings for all mangas', { count: mangas.length });

    let processed = 0;
    let failed = 0;

    for (const manga of mangas) {
      try {
        await this.generateMangaEmbedding(manga.id);
        processed++;

        // Rate limiting - wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        failed++;
        logger.error('Failed to generate embedding', {
          mangaId: manga.id,
          title: manga.primary_title,
          error,
        });
      }
    }

    logger.info('Batch embedding generation complete', {
      total: mangas.length,
      processed,
      failed,
    });
  }

  // Chat with AI about mangas
  async chat(message: string, context?: any): Promise<string> {
    logger.info('AI chat request', { messageLength: message.length });

    try {
      const model = getChatModel();

      // Build context if provided
      let prompt = message;
      if (context) {
        prompt = `Context: ${JSON.stringify(context, null, 2)}\n\nUser: ${message}`;
      }

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      logger.info('AI chat response generated', { responseLength: response.length });
      return response;
    } catch (error) {
      logger.error('AI chat error', { error });
      throw new Error('Failed to generate AI response');
    }
  }

  // Analyze reading habits using AI
  async analyzeReadingHabits(timePeriodDays: number = 30): Promise<ReadingHabitAnalysis> {
    logger.info('Analyzing reading habits', { timePeriodDays });

    // Get statistics
    const stats = await sessionRepository.getOverallStats(timePeriodDays);

    // Get popular tags
    const popularTags = await tagRepository.getPopularTags(10);

    // Get most read mangas
    const recentSessions = await sessionRepository.findRecent(100);
    const mangaReadCount = new Map<string, number>();

    for (const session of recentSessions) {
      const count = mangaReadCount.get(session.manga_id) || 0;
      mangaReadCount.set(session.manga_id, count + 1);
    }

    const sortedMangas = Array.from(mangaReadCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const mostReadMangas = await Promise.all(
      sortedMangas.map(async ([mangaId, count]) => {
        const manga = await mangaRepository.findById(mangaId);
        return manga ? { manga, chapters_read: count } : null;
      })
    );

    const filteredMostRead = mostReadMangas.filter(
      (item): item is { manga: any; chapters_read: number } => item !== null
    );

    return {
      total_mangas: stats.total_mangas,
      total_chapters_read: stats.total_chapters_read,
      total_reading_time_minutes: stats.total_time_minutes,
      favorite_genres: popularTags.map(tag => ({
        genre: tag.name,
        count: tag.usage_count,
      })),
      most_read_mangas: filteredMostRead,
      reading_streak_days: 0, // TODO: Calculate actual streak
      average_chapters_per_session:
        stats.total_sessions > 0
          ? stats.total_chapters_read / stats.total_sessions
          : 0,
    };
  }

  // Extract tags from synopsis using AI
  async extractTagsFromSynopsis(synopsis: string): Promise<string[]> {
    if (!synopsis || synopsis.trim().length === 0) {
      return [];
    }

    try {
      const model = getChatModel();
      const prompt = `
Analyze the following manga synopsis and extract relevant tags/genres.
Return ONLY a JSON array of tags (e.g., ["Action", "Fantasy", "Isekai"]).
Do not include any other text or explanation.

Synopsis: ${synopsis}
      `;

      const result = await model.generateContent(prompt);
      const response = result.response.text().trim();

      // Parse JSON response
      const tags = JSON.parse(response);

      if (Array.isArray(tags)) {
        logger.info('Tags extracted from synopsis', {
          count: tags.length,
          tags,
        });
        return tags;
      }

      return [];
    } catch (error) {
      logger.error('Failed to extract tags', { error });
      return [];
    }
  }

  // Get AI-powered manga summary
  async summarizeManga(mangaId: string): Promise<string> {
    const manga = await mangaRepository.findCompleteById(mangaId);
    if (!manga) {
      throw new Error('Manga not found');
    }

    const model = getChatModel();
    const prompt = `
Summarize this manga in 2-3 sentences:

Title: ${manga.primary_title}
Alternative Names: ${manga.alternative_names?.join(', ') || 'None'}
Synopsis: ${manga.synopsis || 'No synopsis available'}
Tags: ${manga.tags?.join(', ') || 'None'}
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private createEmbeddingText(manga: any): string {
    const parts: string[] = [];

    // Add primary title
    if (manga.primary_title) {
      parts.push(`Title: ${manga.primary_title}`);
    }

    // Add alternative names
    if (manga.alternative_names && manga.alternative_names.length > 0) {
      parts.push(`Alternative Names: ${manga.alternative_names.join(', ')}`);
    }

    // Add synopsis
    if (manga.synopsis) {
      parts.push(`Synopsis: ${manga.synopsis}`);
    }

    // Add genres
    if (manga.genres && manga.genres.length > 0) {
      parts.push(`Genres: ${manga.genres.join(', ')}`);
    }

    // Add themes
    if (manga.themes && manga.themes.length > 0) {
      parts.push(`Themes: ${manga.themes.join(', ')}`);
    }

    // Add author
    if (manga.author) {
      parts.push(`Author: ${manga.author}`);
    }

    // Add publisher
    if (manga.publisher) {
      parts.push(`Publisher: ${manga.publisher}`);
    }

    // Add user notes
    if (manga.user_notes) {
      parts.push(`Notes: ${manga.user_notes}`);
    }

    return parts.join('\n\n');
  }
}

export const aiService = new AIService();
