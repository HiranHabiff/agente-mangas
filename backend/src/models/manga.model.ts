// ============================================
// TypeScript Models and Interfaces
// ============================================

export type MangaStatus = 'reading' | 'completed' | 'paused' | 'dropped' | 'plan_to_read';
export type ReminderType = 'update' | 'scheduled' | 'custom';
export type CreatorRole = 'author' | 'artist' | 'both';
export type TagCategory = 'genre' | 'demographic' | 'theme' | 'custom';

// Main Manga Interface
export interface Manga {
  id: string;
  primary_title: string;
  url?: string;
  image_filename?: string;
  image_url?: string;
  last_chapter_read: number;
  total_chapters?: number;
  rating?: number;
  status: MangaStatus;
  synopsis?: string;
  user_notes?: string;
  embedding?: number[];
  legacy_id?: number;
  legacy_parent_id?: number;
  created_at: Date;
  updated_at: Date;
  last_read_at?: Date;
  deleted_at?: Date;
}

// Manga with additional data (from view)
export interface MangaComplete extends Manga {
  alternative_names: string[];
  tags: string[];
  reading_session_count: number;
}

// Alternative Manga Name
export interface MangaName {
  id: string;
  manga_id: string;
  name: string;
  language: string;
  is_official: boolean;
  created_at: Date;
}

// Tag
export interface Tag {
  id: string;
  name: string;
  category?: TagCategory;
  color?: string;
  created_at: Date;
}

// Manga Tag (junction table)
export interface MangaTag {
  manga_id: string;
  tag_id: string;
  created_at: Date;
}

// Reminder
export interface Reminder {
  id: string;
  manga_id: string;
  reminder_type: ReminderType;
  message?: string;
  scheduled_for?: Date;
  is_active: boolean;
  is_recurring: boolean;
  recurrence_days?: number;
  last_triggered_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Reading Session
export interface ReadingSession {
  id: string;
  manga_id: string;
  chapter_number: number;
  started_at: Date;
  duration_minutes?: number;
  notes?: string;
  created_at: Date;
}

// Creator (Author/Artist)
export interface Creator {
  id: string;
  name: string;
  role: CreatorRole;
  created_at: Date;
}

// Manga Creator (junction table)
export interface MangaCreator {
  manga_id: string;
  creator_id: string;
  created_at: Date;
}

// ============================================
// Input/Update DTOs
// ============================================

export interface CreateMangaInput {
  primary_title: string;
  alternative_names?: string[];
  url?: string;
  image_url?: string;
  synopsis?: string;
  tags?: string[];
  status?: MangaStatus;
  rating?: number;
  total_chapters?: number;
}

export interface UpdateMangaInput {
  primary_title?: string;
  add_names?: string[];
  remove_names?: string[];
  url?: string;
  image_url?: string;
  synopsis?: string;
  user_notes?: string;
  status?: MangaStatus;
  rating?: number;
  last_chapter_read?: number;
  total_chapters?: number;
  add_tags?: string[];
  remove_tags?: string[];
}

export interface SearchMangaInput {
  query?: string;
  search_type?: 'title' | 'semantic' | 'all';
  tags?: string[];
  status?: MangaStatus[];
  min_rating?: number;
  with_covers?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface CreateReminderInput {
  manga_id: string;
  reminder_type?: ReminderType;
  message?: string;
  scheduled_for?: Date;
  is_recurring?: boolean;
  recurrence_days?: number;
}

export interface TrackChapterInput {
  manga_id: string;
  chapter_number: number;
  create_session?: boolean;
  duration_minutes?: number;
  notes?: string;
}

// ============================================
// Database Result Types
// ============================================

export interface DatabaseManga {
  id: string;
  primary_title: string;
  url: string | null;
  image_filename: string | null;
  image_url: string | null;
  last_chapter_read: number;
  total_chapters: number | null;
  rating: string | null; // PostgreSQL NUMERIC returns as string
  status: string;
  synopsis: string | null;
  user_notes: string | null;
  embedding: string | null; // Vector as string
  legacy_id: number | null;
  legacy_parent_id: number | null;
  created_at: string;
  updated_at: string;
  last_read_at: string | null;
  deleted_at: string | null;
}

// ============================================
// Helper Types
// ============================================

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface MangaRecommendation {
  manga: Manga;
  similarity_score: number;
  reason: string;
}

export interface ReadingHabitAnalysis {
  total_mangas: number;
  total_chapters_read: number;
  total_reading_time_minutes: number;
  favorite_genres: { genre: string; count: number }[];
  most_read_mangas: { manga: Manga; chapters_read: number }[];
  reading_streak_days: number;
  average_chapters_per_session: number;
}
