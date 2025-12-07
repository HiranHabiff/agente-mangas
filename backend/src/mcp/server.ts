#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { validateEnv, config } from '../config/env.js';
import { testConnection } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { toolSchemas } from './schemas/tool-schemas.js';
import { mangaCrudTools } from './tools/manga-crud.js';
import { chapterTrackingTools } from './tools/chapter-tracking.js';
import { reminderTools } from './tools/reminders.js';
import { imageTools } from './tools/images.js';
import { aiAssistantTools } from './tools/ai-assistant.js';
import { tagTools } from './tools/tags.js';
import { mangaScraperTools } from './tools/manga-scraper.js';

// ============================================
// MANGA AGENT MCP SERVER
// ============================================

class MangaMCPServer {
  private server: Server;
  private tools: Record<string, Function>;

  constructor() {
    this.server = new Server(
      {
        name: config.mcp.serverName,
        version: config.mcp.serverVersion,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Combine all tools
    this.tools = {
      // CRUD
      ...mangaCrudTools,
      // Chapter tracking
      ...chapterTrackingTools,
      // Reminders
      ...reminderTools,
      // Images
      ...imageTools,
      // AI-powered
      ...aiAssistantTools,
      // Tags
      ...tagTools,
      // Web scraping
      ...mangaScraperTools,
    };

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Object.values(toolSchemas).map(schema => ({
          name: schema.name,
          description: schema.description,
          inputSchema: schema.inputSchema,
        })),
      };
    });

    // Execute tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      logger.info('MCP tool called', { toolName: name, args });

      try {
        const toolFunction = this.tools[name];

        if (!toolFunction) {
          return {
            content: [
              {
                type: 'text',
                text: `Unknown tool: ${name}`,
              },
            ],
            isError: true,
          };
        }

        // Execute the tool
        const result = await toolFunction(args || {});
        return result;
      } catch (error) {
        logger.error('MCP tool execution error', {
          toolName: name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });

    // Error handler
    this.server.onerror = (error) => {
      logger.error('MCP Server error', { error });
    };

    // Process error handler
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async start() {
    try {
      // Validate environment
      validateEnv();

      // Test database connection
      const dbConnected = await testConnection();
      if (!dbConnected) {
        throw new Error('Database connection failed');
      }

      // Create stdio transport
      const transport = new StdioServerTransport();

      // Connect server to transport
      await this.server.connect(transport);

      logger.info('MCP Server started successfully', {
        name: config.mcp.serverName,
        version: config.mcp.serverVersion,
        toolCount: Object.keys(this.tools).length,
      });

      logger.info('Available tools:', {
        tools: Object.keys(this.tools),
      });
    } catch (error) {
      logger.error('Failed to start MCP server', { error });
      process.exit(1);
    }
  }
}

// Start the server
const mcpServer = new MangaMCPServer();
mcpServer.start().catch((error) => {
  logger.error('Fatal error starting MCP server', { error });
  process.exit(1);
});
