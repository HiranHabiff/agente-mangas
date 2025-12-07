import { query } from '../config/database';
import { logger } from '../utils/logger';

// ============================================
// SQL QUERY TOOL - Dynamic Database Queries
// ============================================

export const DATABASE_SCHEMA = `
# MANGA DATABASE SCHEMA

## Tables:

### mangas
- id (uuid, PK)
- primary_title (text, NOT NULL)
- url (text, nullable)
- image_filename (text, nullable)
- image_url (text, nullable)
- last_chapter_read (integer, default 0)
- total_chapters (integer, nullable)
- rating (numeric, nullable, 0-10)
- status (text, NOT NULL) - Values: 'reading', 'completed', 'paused', 'dropped', 'plan_to_read'
- synopsis (text, nullable)
- user_notes (text, nullable)
- legacy_id (integer, nullable)
- embedding (vector(768), nullable)
- created_at (timestamptz)
- updated_at (timestamptz)
- last_read_at (timestamptz, nullable)
- deleted_at (timestamptz, nullable) - soft delete

### manga_names (alternative names)
- id (uuid, PK)
- manga_id (uuid, FK -> mangas.id)
- name (text, NOT NULL)
- created_at (timestamptz)

### tags
- id (uuid, PK)
- name (text, UNIQUE, NOT NULL)
- created_at (timestamptz)

### manga_tags (many-to-many)
- manga_id (uuid, FK -> mangas.id)
- tag_id (uuid, FK -> tags.id)
- created_at (timestamptz)

### reading_sessions
- id (uuid, PK)
- manga_id (uuid, FK -> mangas.id)
- chapter_number (integer, NOT NULL)
- session_start (timestamptz, NOT NULL)
- session_end (timestamptz, nullable)
- created_at (timestamptz)

### reminders
- id (uuid, PK)
- manga_id (uuid, FK -> mangas.id)
- reminder_type (text, NOT NULL) - Values: 'check_updates', 'read_next', 'custom'
- message (text, nullable)
- scheduled_for (timestamptz, nullable)
- is_active (boolean, default true)
- triggered_at (timestamptz, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)

## Views:

### v_manga_complete
Complete manga information with aggregated alternative names and tags as arrays.
Columns: id, primary_title, url, image_filename, image_url, last_chapter_read, 
         total_chapters, rating, status, synopsis, user_notes, legacy_id,
         created_at, updated_at, last_read_at, alternative_names (text[]), tags (text[])

## Common Queries Examples:

1. Get mangas with alternative names:
   SELECT m.*, array_agg(mn.name) as alt_names 
   FROM mangas m 
   JOIN manga_names mn ON m.id = mn.manga_id 
   GROUP BY m.id

2. Get mangas by tag:
   SELECT m.* FROM mangas m
   JOIN manga_tags mt ON m.id = mt.manga_id
   JOIN tags t ON mt.tag_id = t.id
   WHERE t.name = 'action'

3. Get reading statistics:
   SELECT status, COUNT(*) FROM mangas WHERE deleted_at IS NULL GROUP BY status

4. Get most read mangas:
   SELECT m.primary_title, COUNT(rs.id) as sessions
   FROM mangas m
   JOIN reading_sessions rs ON m.id = rs.manga_id
   GROUP BY m.id, m.primary_title
   ORDER BY sessions DESC
   LIMIT 10
`;

interface QueryResult {
  success: boolean;
  data?: any[];
  rowCount?: number;
  error?: string;
  executedQuery?: string;
}

export class SQLQueryTool {
  // Execute a SELECT query
  async executeQuery(sql: string): Promise<QueryResult> {
    try {
      // Security: Only allow SELECT queries
      const normalizedSQL = sql.trim().toLowerCase();
      
      if (!normalizedSQL.startsWith('select')) {
        return {
          success: false,
          error: 'Only SELECT queries are allowed for security reasons',
        };
      }

      // Check for dangerous keywords
      const dangerousPatterns = [
        /\bdrop\b/i,
        /\bdelete\b/i,
        /\btruncate\b/i,
        /\binsert\b/i,
        /\bupdate\b/i,
        /\balter\b/i,
        /\bcreate\b/i,
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(sql)) {
          return {
            success: false,
            error: `Query contains forbidden keyword: ${pattern.source}`,
          };
        }
      }

      logger.info('Executing dynamic SQL query', { sql: sql.substring(0, 200) });

      const result = await query(sql);

      return {
        success: true,
        data: result.rows,
        rowCount: result.rowCount || 0,
        executedQuery: sql,
      };
    } catch (error) {
      logger.error('SQL query execution error', { error, sql });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executedQuery: sql,
      };
    }
  }

  // Get database schema
  getSchema(): string {
    return DATABASE_SCHEMA;
  }
}

export const sqlQueryTool = new SQLQueryTool();
