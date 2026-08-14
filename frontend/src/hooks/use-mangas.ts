import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMangas, getManga, createManga, updateManga, deleteManga, updateChapter, updateImage, updateStatus, getFilterOptions, getStats, getSites, getReadingSessions, getReadingStats } from '@/lib/api';
import type { CreateMangaData } from '@/lib/api';
import type { MangaFilters } from '@/types/manga';

export function useMangas(filters: MangaFilters = {}) {
  return useQuery({
    queryKey: ['mangas', filters],
    queryFn: () => getMangas(filters),
  });
}

export function useInfiniteMangas(filters: Omit<MangaFilters, 'offset'> = {}) {
  return useInfiniteQuery({
    queryKey: ['mangas-infinite', filters],
    queryFn: ({ pageParam = 0 }) => getMangas({ ...filters, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasMore) return undefined;
      return lastPage.pagination.offset + lastPage.pagination.limit;
    },
  });
}

export function useManga(id: string) {
  return useQuery({
    queryKey: ['manga', id],
    queryFn: () => getManga(id),
    enabled: !!id,
  });
}

export function useCreateManga() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMangaData) => createManga(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mangas'] });
      queryClient.invalidateQueries({ queryKey: ['mangas-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useUpdateManga() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateManga>[1] }) =>
      updateManga(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['manga', id] });
      queryClient.invalidateQueries({ queryKey: ['mangas'] });
    },
  });
}

export function useDeleteManga() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteManga,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mangas'] });
    },
  });
}

export function useUpdateChapter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, chapter }: { id: string; chapter: number }) =>
      updateChapter(id, chapter),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['manga', id] });
      queryClient.invalidateQueries({ queryKey: ['mangas-infinite'] });
    },
  });
}

export function useFilterOptions() {
  return useQuery({
    queryKey: ['filterOptions'],
    queryFn: getFilterOptions,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
  });
}

export function useSites() {
  return useQuery({
    queryKey: ['sites'],
    queryFn: getSites,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, imageUrl }: { id: string; imageUrl: string }) =>
      updateImage(id, imageUrl),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['manga', id] });
      queryClient.invalidateQueries({ queryKey: ['mangas-infinite'] });
    },
  });
}

export function useUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['manga', id] });
      queryClient.invalidateQueries({ queryKey: ['mangas-infinite'] });
    },
  });
}

export function useReadingSessions(id: string, limit = 50) {
  return useQuery({
    queryKey: ['manga-sessions', id, limit],
    queryFn: () => getReadingSessions(id, limit),
    enabled: !!id,
  });
}

export function useReadingStats(id: string) {
  return useQuery({
    queryKey: ['manga-stats', id],
    queryFn: () => getReadingStats(id),
    enabled: !!id,
  });
}
