import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

export const config = {
  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'manga_db',
    user: process.env.DB_USER || 'manga_user',
    password: process.env.DB_PASSWORD || '',
  },

  // Gemini AI
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-2.5-flash',
    embeddingModel: 'gemini-embedding-001',
  },

  // Google Custom Search
  googleSearch: {
    apiKey: process.env.GOOGLE_SEARCH_API_KEY || process.env.GEMINI_API_KEY || '',
    searchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID || '',
  },

  // Application
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
  },

  // Storage
  storage: {
    basePath: process.env.STORAGE_PATH || '../storage',
    imagesPath: process.env.IMAGES_PATH || '../storage/images',
    tempPath: process.env.TEMP_PATH || '../storage/temp',
  },

  // MCP
  mcp: {
    serverName: process.env.MCP_SERVER_NAME || 'manga-agent-mcp',
    serverVersion: process.env.MCP_SERVER_VERSION || '1.0.0',
  },
} as const;

// Validate required environment variables
export function validateEnv(): void {
  const required = [
    'DB_PASSWORD',
    'GEMINI_API_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file.'
    );
  }
}
