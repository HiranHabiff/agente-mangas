import { validateEnv } from './config/env.js';
import { testConnection, closePool } from './config/database.js';
import { testGeminiConnection } from './config/gemini.js';
import { logger } from './utils/logger.js';

async function main() {
  try {
    logger.info('Starting Manga Agent Backend...');

    // Validate environment variables
    logger.info('Validating environment variables...');
    validateEnv();

    // Test database connection
    logger.info('Testing database connection...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }

    // Test Gemini API connection
    logger.info('Testing Gemini API connection...');
    const geminiConnected = await testGeminiConnection();
    if (!geminiConnected) {
      logger.warn('Failed to connect to Gemini API - continuing without AI features');
    }

    logger.info('✓ Manga Agent Backend initialized successfully!');
    logger.info('Ready to start MCP server or API server');

  } catch (error) {
    logger.error('Failed to start backend', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  await closePool();
  process.exit(0);
});

// Run main function
main();
