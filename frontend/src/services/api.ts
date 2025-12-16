import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import type { 
  Manga, 
  MangaComplete, 
  CreateMangaInput, 
  UpdateMangaInput,
  Stats,
  Tag,
  Reminder,
  PaginatedResponse
} from '../types/manga';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Manga endpoints
export const mangaApi = {
  // List mangas with filters
  list: async (params?: {
    query?: string;
    status?: string | string[];
    tags?: string | string[];
    minRating?: number;
    min_rating?: number;
    with_covers?: boolean;
    sort_by?: string;
    sort_order?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<MangaComplete>> => {
    // Converter arrays para strings separadas por vírgula
    const queryParams: any = { ...params };
    if (Array.isArray(queryParams.status)) {
      queryParams.status = queryParams.status.join(',');
    }
    if (Array.isArray(queryParams.tags)) {
      queryParams.tags = queryParams.tags.join(',');
    }
    // Normalizar min_rating
    if (queryParams.min_rating) {
      queryParams.minRating = queryParams.min_rating;
      delete queryParams.min_rating;
    }
    
    const { data } = await api.get(API_ENDPOINTS.mangas, { params: queryParams });
    return data;
  },

  // Get single manga
  getById: async (id: string): Promise<MangaComplete> => {
    const { data } = await api.get(API_ENDPOINTS.mangaById(id));
    return data;
  },

  // Create manga
  create: async (input: CreateMangaInput): Promise<Manga> => {
    const { data } = await api.post(API_ENDPOINTS.mangas, input);
    return data;
  },

  // Update manga
  update: async (id: string, input: UpdateMangaInput): Promise<Manga> => {
    const { data } = await api.patch(API_ENDPOINTS.mangaById(id), input);
    return data;
  },

  // Delete manga
  delete: async (id: string, permanent: boolean = false): Promise<void> => {
    await api.delete(API_ENDPOINTS.mangaById(id), {
      params: { permanent },
    });
  },

  // Track chapter
  trackChapter: async (id: string, chapterNumber: number, createSession: boolean = true): Promise<Manga> => {
    const { data } = await api.post(API_ENDPOINTS.updateChapter(id), {
      chapterNumber,
      createSession,
    });
    return data;
  },

  // Get reading history
  getHistory: async (id: string, limit: number = 50): Promise<any[]> => {
    const { data } = await api.get(API_ENDPOINTS.mangaHistory(id), {
      params: { limit },
    });
    return data;
  },

  // Download image
  downloadImage: async (id: string, imageUrl: string): Promise<{ filename: string; url: string }> => {
    const { data } = await api.post(API_ENDPOINTS.downloadImage(id), { imageUrl });
    return data;
  },

  // Get tags
  getTags: async (): Promise<Tag[]> => {
    const { data } = await api.get(API_ENDPOINTS.tags);
    return data;
  },
};

// Stats endpoints
export const statsApi = {
  getStats: async (): Promise<Stats> => {
    const { data } = await api.get(API_ENDPOINTS.stats);
    return data;
  },

  getTopRead: async (limit: number = 10): Promise<Manga[]> => {
    const { data } = await api.get(API_ENDPOINTS.topRead, {
      params: { limit },
    });
    return data;
  },

  getRecentlyUpdated: async (limit: number = 10): Promise<Manga[]> => {
    const { data } = await api.get(API_ENDPOINTS.recentlyUpdated, {
      params: { limit },
    });
    return data;
  },
};

// Tags endpoints
export const tagsApi = {
  list: async (): Promise<Tag[]> => {
    const { data } = await api.get(API_ENDPOINTS.tags);
    return data;
  },

  getPopular: async (limit: number = 20): Promise<Tag[]> => {
    const { data } = await api.get(API_ENDPOINTS.popularTags, {
      params: { limit },
    });
    return data;
  },
};

// Reminders endpoints
export const remindersApi = {
  list: async (): Promise<Reminder[]> => {
    const { data } = await api.get(API_ENDPOINTS.reminders);
    return data;
  },

  create: async (reminder: Partial<Reminder>): Promise<Reminder> => {
    const { data } = await api.post(API_ENDPOINTS.reminders, reminder);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(API_ENDPOINTS.reminderById(id));
  },
};

// Duplicates endpoints
export const duplicatesApi = {
  list: async (): Promise<{
    total_groups: number;
    total_duplicates: number;
    groups: { group: MangaComplete[]; similarity: string }[];
  }> => {
    const { data } = await api.get(API_ENDPOINTS.duplicates);
    return data;
  },

  // Merge mangas: keep target, delete sources
  merge: async (targetId: string, sourceIds: string[]): Promise<{
    success: boolean;
    message: string;
    manga: MangaComplete;
  }> => {
    const { data } = await api.post(`${API_ENDPOINTS.duplicates}/merge`, {
      targetId,
      sourceIds,
    });
    return data;
  },

  // Delete multiple mangas
  deleteMultiple: async (ids: string[], permanent: boolean = true): Promise<{
    success: boolean;
    message: string;
    deletedCount: number;
  }> => {
    const { data } = await api.post(`${API_ENDPOINTS.duplicates}/delete-multiple`, {
      ids,
      permanent,
    });
    return data;
  },
};

export default api;
