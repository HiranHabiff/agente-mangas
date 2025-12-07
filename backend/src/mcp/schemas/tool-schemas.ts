// ============================================
// MCP TOOL SCHEMAS
// JSON Schemas for all MCP tools
// ============================================

export const toolSchemas = {
  // ============================================
  // MANGA CRUD TOOLS
  // ============================================

  create_manga: {
    name: 'create_manga',
    description: 'Create a new manga entry in the database',
    inputSchema: {
      type: 'object',
      properties: {
        primary_title: {
          type: 'string',
          description: 'Main title of the manga (required)',
        },
        alternative_names: {
          type: 'array',
          items: { type: 'string' },
          description: 'Alternative names/titles for this manga (e.g., English, Japanese)',
        },
        url: {
          type: 'string',
          format: 'uri',
          description: 'URL where the manga can be read',
        },
        image_url: {
          type: 'string',
          format: 'uri',
          description: 'URL of the manga cover image',
        },
        synopsis: {
          type: 'string',
          description: 'Synopsis/description of the manga',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags/genres (e.g., Action, Fantasy, Isekai)',
        },
        status: {
          type: 'string',
          enum: ['reading', 'completed', 'paused', 'dropped', 'plan_to_read'],
          description: 'Current reading status',
        },
        rating: {
          type: 'number',
          minimum: 0,
          maximum: 10,
          description: 'Rating from 0 to 10',
        },
        total_chapters: {
          type: 'number',
          description: 'Total number of chapters (if known)',
        },
      },
      required: ['primary_title'],
    },
  },

  search_manga: {
    name: 'search_manga',
    description: 'Search mangas by title, tags, status, or rating. Supports full-text and semantic search.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search text (searches in titles, alternative names, and synopsis)',
        },
        search_type: {
          type: 'string',
          enum: ['title', 'semantic', 'all'],
          description: 'Type of search: title (text matching), semantic (AI-powered), or all',
          default: 'all',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags (e.g., ["Action", "Fantasy"])',
        },
        status: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['reading', 'completed', 'paused', 'dropped', 'plan_to_read'],
          },
          description: 'Filter by reading status',
        },
        min_rating: {
          type: 'number',
          minimum: 0,
          maximum: 10,
          description: 'Minimum rating (0-10)',
        },
        limit: {
          type: 'number',
          default: 20,
          description: 'Maximum number of results',
        },
        offset: {
          type: 'number',
          default: 0,
          description: 'Number of results to skip (for pagination)',
        },
      },
    },
  },

  get_manga: {
    name: 'get_manga',
    description: 'Get detailed information about a specific manga by ID',
    inputSchema: {
      type: 'object',
      properties: {
        manga_id: {
          type: 'string',
          format: 'uuid',
          description: 'UUID of the manga',
        },
      },
      required: ['manga_id'],
    },
  },

  update_manga: {
    name: 'update_manga',
    description: 'Update an existing manga',
    inputSchema: {
      type: 'object',
      properties: {
        manga_id: {
          type: 'string',
          format: 'uuid',
          description: 'UUID of the manga to update',
        },
        updates: {
          type: 'object',
          properties: {
            primary_title: { type: 'string' },
            add_names: {
              type: 'array',
              items: { type: 'string' },
              description: 'Alternative names to add',
            },
            remove_names: {
              type: 'array',
              items: { type: 'string' },
              description: 'Alternative names to remove',
            },
            url: { type: 'string' },
            synopsis: { type: 'string' },
            user_notes: { type: 'string' },
            status: {
              type: 'string',
              enum: ['reading', 'completed', 'paused', 'dropped', 'plan_to_read'],
            },
            rating: {
              type: 'number',
              minimum: 0,
              maximum: 10,
            },
            total_chapters: { type: 'number' },
            add_tags: {
              type: 'array',
              items: { type: 'string' },
            },
            remove_tags: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
      required: ['manga_id', 'updates'],
    },
  },

  delete_manga: {
    name: 'delete_manga',
    description: 'Delete a manga (soft delete by default, can be recovered)',
    inputSchema: {
      type: 'object',
      properties: {
        manga_id: {
          type: 'string',
          format: 'uuid',
          description: 'UUID of the manga to delete',
        },
        permanent: {
          type: 'boolean',
          default: false,
          description: 'If true, permanently delete (cannot be recovered)',
        },
      },
      required: ['manga_id'],
    },
  },

  // ============================================
  // CHAPTER TRACKING TOOLS
  // ============================================

  track_chapter: {
    name: 'track_chapter',
    description: 'Update the last chapter read for a manga and create a reading session',
    inputSchema: {
      type: 'object',
      properties: {
        manga_id: {
          type: 'string',
          format: 'uuid',
          description: 'UUID of the manga',
        },
        chapter_number: {
          type: 'number',
          minimum: 0,
          description: 'Chapter number that was read',
        },
        create_session: {
          type: 'boolean',
          default: true,
          description: 'Whether to create a reading session record',
        },
        duration_minutes: {
          type: 'number',
          description: 'How long the reading took (in minutes)',
        },
        notes: {
          type: 'string',
          description: 'Notes about this reading session',
        },
      },
      required: ['manga_id', 'chapter_number'],
    },
  },

  get_manga_stats: {
    name: 'get_manga_stats',
    description: 'Get reading statistics for a specific manga',
    inputSchema: {
      type: 'object',
      properties: {
        manga_id: {
          type: 'string',
          format: 'uuid',
          description: 'UUID of the manga',
        },
      },
      required: ['manga_id'],
    },
  },

  // ============================================
  // REMINDER TOOLS
  // ============================================

  set_reminder: {
    name: 'set_reminder',
    description: 'Set a reminder for manga updates',
    inputSchema: {
      type: 'object',
      properties: {
        manga_id: {
          type: 'string',
          format: 'uuid',
          description: 'UUID of the manga',
        },
        reminder_type: {
          type: 'string',
          enum: ['update', 'scheduled', 'custom'],
          default: 'update',
          description: 'Type of reminder',
        },
        scheduled_for: {
          type: 'string',
          format: 'date-time',
          description: 'When to trigger the reminder (ISO 8601 format)',
        },
        message: {
          type: 'string',
          description: 'Custom message for the reminder',
        },
        is_recurring: {
          type: 'boolean',
          default: false,
          description: 'Whether this reminder repeats',
        },
        recurrence_days: {
          type: 'number',
          description: 'Days between recurrences (if recurring)',
        },
      },
      required: ['manga_id'],
    },
  },

  list_reminders: {
    name: 'list_reminders',
    description: 'List all active reminders or reminders for a specific manga',
    inputSchema: {
      type: 'object',
      properties: {
        manga_id: {
          type: 'string',
          format: 'uuid',
          description: 'UUID of manga (optional, leave empty for all reminders)',
        },
      },
    },
  },

  delete_reminder: {
    name: 'delete_reminder',
    description: 'Delete a reminder',
    inputSchema: {
      type: 'object',
      properties: {
        reminder_id: {
          type: 'string',
          format: 'uuid',
          description: 'UUID of the reminder to delete',
        },
      },
      required: ['reminder_id'],
    },
  },

  // ============================================
  // IMAGE TOOLS
  // ============================================

  download_image: {
    name: 'download_image',
    description: 'Download and store manga cover image from URL',
    inputSchema: {
      type: 'object',
      properties: {
        manga_id: {
          type: 'string',
          format: 'uuid',
          description: 'UUID of the manga',
        },
        image_url: {
          type: 'string',
          format: 'uri',
          description: 'URL of the image to download',
        },
      },
      required: ['manga_id', 'image_url'],
    },
  },

  // ============================================
  // AI-POWERED TOOLS
  // ============================================

  get_recommendations: {
    name: 'get_recommendations',
    description: 'Get AI-powered manga recommendations based on a manga or tags',
    inputSchema: {
      type: 'object',
      properties: {
        based_on_manga_id: {
          type: 'string',
          format: 'uuid',
          description: 'UUID of manga to base recommendations on',
        },
        based_on_tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to base recommendations on',
        },
        limit: {
          type: 'number',
          default: 10,
          description: 'Maximum number of recommendations',
        },
      },
    },
  },

  analyze_reading_habits: {
    name: 'analyze_reading_habits',
    description: 'Analyze user reading patterns and provide insights',
    inputSchema: {
      type: 'object',
      properties: {
        time_period_days: {
          type: 'number',
          default: 30,
          description: 'Number of days to analyze',
        },
      },
    },
  },

  extract_tags: {
    name: 'extract_tags',
    description: 'Use AI to extract tags/genres from manga synopsis',
    inputSchema: {
      type: 'object',
      properties: {
        synopsis: {
          type: 'string',
          description: 'Manga synopsis to analyze',
        },
      },
      required: ['synopsis'],
    },
  },

  // ============================================
  // TAG TOOLS
  // ============================================

  list_tags: {
    name: 'list_tags',
    description: 'List all available tags/genres',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category (genre, demographic, theme, custom)',
        },
      },
    },
  },

  get_popular_tags: {
    name: 'get_popular_tags',
    description: 'Get most used tags',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          default: 20,
          description: 'Maximum number of tags to return',
        },
      },
    },
  },

  // ============================================
  // MANGA SCRAPER TOOLS
  // ============================================

  search_manga_info: {
    name: 'search_manga_info',
    description: 'Search for manga information on the web (Google -> MyAnimeList, AniList, etc.), scrape content, and translate to Portuguese. Returns structured manga data including title, synopsis, genres, rating, chapters, and more.',
    inputSchema: {
      type: 'object',
      properties: {
        mangaName: {
          type: 'string',
          description: 'Name of the manga to search for (in English or original language)',
        },
        translate: {
          type: 'boolean',
          default: true,
          description: 'Whether to translate all information to Portuguese (default: true)',
        },
      },
      required: ['mangaName'],
    },
  },

  scrape_manga_url: {
    name: 'scrape_manga_url',
    description: 'Scrape manga information from a specific URL (supports MyAnimeList, AniList, MangaDex, and generic sites). Extracts title, synopsis, genres, rating, chapters, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          format: 'uri',
          description: 'URL of the manga page to scrape',
        },
        translate: {
          type: 'boolean',
          default: true,
          description: 'Whether to translate extracted information to Portuguese (default: true)',
        },
      },
      required: ['url'],
    },
  },
} as const;

export type ToolName = keyof typeof toolSchemas;
