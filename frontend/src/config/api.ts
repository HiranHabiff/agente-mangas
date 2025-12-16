// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  // Mangas
  mangas: '/api/mangas',
  mangaById: (id: string) => `/api/mangas/${id}`,
  updateChapter: (id: string) => `/api/mangas/${id}/chapters`,
  mangaHistory: (id: string) => `/api/mangas/${id}/history`,
  downloadImage: (id: string) => `/api/mangas/${id}/image`,
  
  // Stats
  stats: '/api/stats',
  topRead: '/api/stats/top-read',
  recentlyUpdated: '/api/stats/recently-updated',
  
  // Tags
  tags: '/api/tags',
  popularTags: '/api/tags/popular',

  // Duplicates
  duplicates: '/api/duplicates',

  // Reminders
  reminders: '/api/reminders',
  reminderById: (id: string) => `/api/reminders/${id}`,
  
  // Health
  health: '/health',
} as const;

// Image URL helper
export const getImageUrl = (filename: string | null) => {
  if (!filename) return '/placeholder.png';
  return `${API_BASE_URL}/images/${filename}`;
};
