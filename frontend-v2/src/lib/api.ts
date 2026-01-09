import type { MangaListResponse, MangaDetail, FilterOptions, Stats, MangaFilters, Tag } from '@/types/manga';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3011/api';

// Transform snake_case keys to camelCase
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Transform camelCase keys to snake_case
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function transformKeys<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map(item => transformKeys(item)) as T;
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = snakeToCamel(key);
      acc[camelKey] = transformKeys(obj[key]);
      return acc;
    }, {} as any) as T;
  }
  return obj;
}

function transformKeysToSnake<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map(item => transformKeysToSnake(item)) as T;
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = camelToSnake(key);
      acc[snakeKey] = transformKeysToSnake(obj[key]);
      return acc;
    }, {} as any) as T;
  }
  return obj;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${res.status}`);
  }

  return res.json();
}

// Mangas
export async function getMangas(filters: MangaFilters = {}): Promise<MangaListResponse> {
  const params = new URLSearchParams();

  if (filters.query) params.set('query', filters.query);
  if (filters.status?.length) params.set('status', filters.status.join(','));
  if (filters.genres?.length) params.set('genres', filters.genres.join(','));
  if (filters.themes?.length) params.set('themes', filters.themes.join(','));
  if (filters.tags?.length) params.set('tags', filters.tags.join(','));
  if (filters.types?.length) params.set('types', filters.types.join(','));
  if (filters.ratings?.length) params.set('ratings', filters.ratings.join(','));
  if (filters.demographics?.length) params.set('demographics', filters.demographics.join(','));
  if (filters.minRating !== undefined) params.set('minRating', String(filters.minRating));
  if (filters.withCovers) params.set('withCovers', 'true');
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.offset) params.set('offset', String(filters.offset));

  const queryString = params.toString();
  return fetchApi<MangaListResponse>(`/mangas${queryString ? `?${queryString}` : ''}`);
}

export async function getManga(id: string): Promise<MangaDetail> {
  return fetchApi<MangaDetail>(`/mangas/${id}`);
}

export interface CreateMangaData {
  primaryTitle: string;
  synopsis?: string;
  imageUrl?: string;
  url?: string;
  rating?: number;
  totalChapters?: number;
  status?: string;
  userNotes?: string;
  statusId?: string;
  typeId?: string;
  ratingId?: string;
  demographicId?: string;
  genreIds?: string[];
  themeIds?: string[];
  tagIds?: string[];
  alternativeNames?: string[];
  links?: { url: string; siteId?: string; label?: string; isPrimary?: boolean }[];
}

export async function createManga(data: CreateMangaData): Promise<MangaDetail> {
  return fetchApi<MangaDetail>('/mangas', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateManga(id: string, data: Partial<MangaDetail>): Promise<MangaDetail> {
  return fetchApi<MangaDetail>(`/mangas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteManga(id: string): Promise<void> {
  await fetchApi(`/mangas/${id}`, { method: 'DELETE' });
}

export async function updateChapter(id: string, chapter: number): Promise<void> {
  await fetchApi(`/mangas/${id}/chapter?chapter=${chapter}`, { method: 'PATCH' });
}

export async function updateImage(id: string, imageUrl: string): Promise<{ filename: string }> {
  return fetchApi(`/mangas/${id}/image`, {
    method: 'PATCH',
    body: JSON.stringify({ imageUrl }),
  });
}

export async function updateStatus(id: string, status: string): Promise<void> {
  await fetchApi(`/mangas/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export interface ReadingSession {
  id: string;
  chapterNumber: number;
  startedAt: string | null;
  durationMinutes: number | null;
  notes: string | null;
  createdAt: string;
}

export interface ReadingStats {
  totalSessions: number;
  totalChaptersRead: number;
  totalTimeMinutes: number;
  avgTimePerChapter: number | null;
  firstReadAt: string | null;
  lastReadAt: string | null;
}

export async function getReadingSessions(id: string, limit = 50): Promise<ReadingSession[]> {
  return fetchApi<ReadingSession[]>(`/mangas/${id}/sessions?limit=${limit}`);
}

export async function getReadingStats(id: string): Promise<ReadingStats> {
  return fetchApi<ReadingStats>(`/mangas/${id}/stats`);
}

// Tags (for filters)
export async function getFilterOptions(): Promise<FilterOptions> {
  return fetchApi<FilterOptions>('/tags');
}

export async function getPopularTags(limit = 10): Promise<{ genres: Tag[]; themes: Tag[]; tags: Tag[] }> {
  return fetchApi(`/tags/popular?limit=${limit}`);
}

// Stats
export async function getStats(): Promise<Stats> {
  return fetchApi<Stats>('/stats');
}

export async function getRecentlyUpdated(limit = 10): Promise<Partial<MangaDetail>[]> {
  return fetchApi(`/stats/recently-updated?limit=${limit}`);
}

export async function getTopRated(limit = 10): Promise<Partial<MangaDetail>[]> {
  return fetchApi(`/stats/top-rated?limit=${limit}`);
}

// Sites
export interface Site {
  id: string;
  name: string;
  url: string;
  image?: string | null;
  language?: string | null;
  active?: boolean;
}

export async function getSites(): Promise<Site[]> {
  return fetchApi<Site[]>('/tags/sites');
}

// Admin CRUD
export async function getAdminItems(table: string): Promise<Tag[]> {
  const data = await fetchApi<any[]>(`/admin/${table}`);
  return transformKeys<Tag[]>(data);
}

export async function createAdminItem(table: string, data: Partial<Tag>): Promise<Tag> {
  const snakeData = transformKeysToSnake(data);
  const result = await fetchApi<any>(`/admin/${table}`, {
    method: 'POST',
    body: JSON.stringify(snakeData),
  });
  return transformKeys<Tag>(result);
}

export async function updateAdminItem(table: string, id: string, data: Partial<Tag>): Promise<Tag> {
  const snakeData = transformKeysToSnake(data);
  const result = await fetchApi<any>(`/admin/${table}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(snakeData),
  });
  return transformKeys<Tag>(result);
}

export async function deleteAdminItem(table: string, id: string): Promise<void> {
  await fetchApi(`/admin/${table}/${id}`, { method: 'DELETE' });
}

// Reading Lists
export interface ReadingList {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  isPublic: boolean;
  sortOrder: number;
  mangaCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingListDetail extends ReadingList {
  mangas: {
    id: string;
    primaryTitle: string;
    imageUrl?: string | null;
    imageFilename?: string | null;
    status: string;
    lastChapterRead: number;
    totalChapters?: number | null;
    rating?: number | null;
    addedAt: string;
    notes?: string | null;
    sortOrder: number;
    type?: { id: string; name: string; color?: string } | null;
    genres: { id: string; name: string; color?: string }[];
  }[];
}

export interface CreateListData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isPublic?: boolean;
  sortOrder?: number;
}

export interface AddMangaToListData {
  mangaId: string;
  sortOrder?: number;
  notes?: string;
}

export async function getLists(): Promise<ReadingList[]> {
  return fetchApi<ReadingList[]>('/lists');
}

export async function getList(id: string): Promise<ReadingListDetail> {
  return fetchApi<ReadingListDetail>(`/lists/${id}`);
}

export async function createList(data: CreateListData): Promise<ReadingList> {
  return fetchApi<ReadingList>('/lists', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateList(id: string, data: Partial<CreateListData>): Promise<ReadingList> {
  return fetchApi<ReadingList>(`/lists/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteList(id: string): Promise<void> {
  await fetchApi(`/lists/${id}`, { method: 'DELETE' });
}

export async function addMangaToList(listId: string, data: AddMangaToListData): Promise<void> {
  await fetchApi(`/lists/${listId}/mangas`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function removeMangaFromList(listId: string, mangaId: string): Promise<void> {
  await fetchApi(`/lists/${listId}/mangas/${mangaId}`, { method: 'DELETE' });
}

export interface MangaListInfo {
  id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  addedAt: string;
  notes?: string | null;
}

export async function getMangaLists(mangaId: string): Promise<MangaListInfo[]> {
  return fetchApi<MangaListInfo[]>(`/lists/manga/${mangaId}`);
}

// Reminders
export interface Reminder {
  id: string;
  mangaId: string;
  reminderType: string;
  message?: string | null;
  scheduledFor: string;
  isActive: boolean;
  isRecurring: boolean;
  recurrenceDays?: number | null;
  lastTriggeredAt?: string | null;
  createdAt: string;
  updatedAt: string;
  manga?: {
    id: string;
    primaryTitle: string;
    imageUrl?: string | null;
    imageFilename?: string | null;
    lastChapterRead?: number;
    totalChapters?: number | null;
  };
}

export interface CreateReminderData {
  mangaId: string;
  reminderType?: string;
  message?: string;
  scheduledFor: string;
  isRecurring?: boolean;
  recurrenceDays?: number;
}

export async function getReminders(): Promise<Reminder[]> {
  return fetchApi<Reminder[]>('/reminders');
}

export async function getTriggeredReminders(): Promise<Reminder[]> {
  return fetchApi<Reminder[]>('/reminders/triggered');
}

export async function getMangaReminders(mangaId: string): Promise<Reminder[]> {
  return fetchApi<Reminder[]>(`/reminders/manga/${mangaId}`);
}

export async function getReminder(id: string): Promise<Reminder> {
  return fetchApi<Reminder>(`/reminders/${id}`);
}

export async function createReminder(data: CreateReminderData): Promise<Reminder> {
  return fetchApi<Reminder>('/reminders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateReminder(id: string, data: Partial<CreateReminderData> & { isActive?: boolean }): Promise<Reminder> {
  return fetchApi<Reminder>(`/reminders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function dismissReminder(id: string): Promise<{ success: boolean }> {
  return fetchApi<{ success: boolean }>(`/reminders/${id}/dismiss`, {
    method: 'POST',
  });
}

export async function deleteReminder(id: string): Promise<void> {
  await fetchApi(`/reminders/${id}`, { method: 'DELETE' });
}
