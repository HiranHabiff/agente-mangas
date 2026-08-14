export interface Tag {
  id: string;
  name: string;
  nameEnglish?: string | null;
  color?: string | null;
  description?: string | null;
  count?: number;
}

export interface Manga {
  id: string;
  primaryTitle: string;
  url?: string | null;
  imageUrl?: string | null;
  imageFilename?: string | null;
  synopsis?: string | null;
  rating?: number | null;
  totalChapters?: number | null;
  lastChapterRead?: number | null;
  status?: string | null;
  userNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  lastReadAt?: string | null;
  genres: Tag[];
  themes: Tag[];
  tags: Tag[];
  statusRef?: Tag | null;
  type?: Tag | null;
  contentRating?: Tag | null;
  demographic?: Tag | null;
}

export interface MangaDetail extends Manga {
  alternativeNames: {
    id: string;
    name: string;
    language?: string | null;
    isOfficial?: boolean;
  }[];
  links: {
    id: string;
    url: string;
    label?: string | null;
    isPrimary?: boolean;
    isActive?: boolean;
    site?: {
      id: string;
      name: string;
      url: string;
      image: string;
    } | null;
  }[];
}

export interface MangaListResponse {
  data: Manga[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface FilterOptions {
  genres: Tag[];
  themes: Tag[];
  tags: Tag[];
  status: Tag[];
  types: Tag[];
  ratings: Tag[];
  demographics: Tag[];
}

export interface MangaFilters {
  query?: string;
  status?: string[];
  genres?: string[];
  themes?: string[];
  tags?: string[];
  types?: string[];
  ratings?: string[];
  demographics?: string[];
  minRating?: number;
  withCovers?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface Stats {
  total: number;
  byStatus: {
    reading: number;
    completed: number;
    paused: number;
    dropped: number;
    planToRead: number;
  };
  averageRating: number | null;
  totalChaptersRead: number;
  mangasWithRating: number;
}
