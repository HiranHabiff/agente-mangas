export type MangaStatus = 'reading' | 'completed' | 'paused' | 'dropped' | 'plan_to_read';

export interface Manga {
  id: string;
  primary_title: string;
  url: string | null;
  image_filename: string | null;
  image_url: string | null;
  last_chapter_read: number;
  total_chapters: number | null;
  rating: number | null;
  status: MangaStatus;
  synopsis: string | null;
  user_notes: string | null;
  legacy_id: number | null;
  created_at: string;
  updated_at: string;
  last_read_at: string | null;
  deleted_at: string | null;
}

export interface MangaComplete extends Manga {
  alternative_names: string[];
  tags: string[];
}

export interface CreateMangaInput {
  primary_title: string;
  alternative_names?: string[];
  url?: string;
  image_url?: string;
  status?: MangaStatus;
  rating?: number;
  synopsis?: string;
  user_notes?: string;
  tags?: string[];
}

export interface UpdateMangaInput {
  primary_title?: string;
  add_names?: string[];
  remove_names?: string[];
  url?: string;
  status?: MangaStatus;
  rating?: number;
  synopsis?: string;
  user_notes?: string;
  add_tags?: string[];
  remove_tags?: string[];
}

export interface Stats {
  total: string;
  reading: string;
  completed: string;
  paused: string;
  dropped: string;
  plan_to_read: string;
  with_covers: string;
  avg_rating: string | null;
  avg_chapters_read: string | null;
}

export interface Tag {
  id: string;
  name: string;
  category: string | null;
  color: string | null;
  usage_count?: number;
}

export interface Reminder {
  id: string;
  manga_id: string;
  manga_title?: string;
  reminder_type: 'update' | 'scheduled' | 'custom';
  message: string;
  scheduled_for: string;
  is_active: boolean;
  is_recurring: boolean;
  recurrence_days: number | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore?: boolean;
  };
}
