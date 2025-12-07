import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './env';
import { logger } from '../utils/logger';

// Initialize Gemini AI
export const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

// Get chat model (gemini-1.5-pro)
export function getChatModel() {
  return genAI.getGenerativeModel({
    model: config.gemini.model,
  });
}

// Get embedding model (gemini-embedding-001)
export function getEmbeddingModel() {
  return genAI.getGenerativeModel({
    model: config.gemini.embeddingModel,
  });
}

// Generate embedding for text
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = getEmbeddingModel();
    const result = await model.embedContent(text);

    logger.debug('Embedding generated', {
      textLength: text.length,
      embeddingDimension: result.embedding.values.length,
    });

    return result.embedding.values;
  } catch (error) {
    logger.error('Error generating embedding', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Test Gemini API connection
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const model = getChatModel();
    const result = await model.generateContent('Hello');
    const response = result.response.text();

    logger.info('Gemini API connection successful', {
      model: config.gemini.model,
      responseLength: response.length,
    });

    return true;
  } catch (error) {
    logger.error('Gemini API connection failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}
