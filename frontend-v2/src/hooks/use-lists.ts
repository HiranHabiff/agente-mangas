'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLists,
  getList,
  createList,
  updateList,
  deleteList,
  addMangaToList,
  removeMangaFromList,
  getMangaLists,
} from '@/lib/api';
import type { CreateListData, AddMangaToListData } from '@/lib/api';

export function useLists() {
  return useQuery({
    queryKey: ['lists'],
    queryFn: getLists,
  });
}

export function useList(id: string) {
  return useQuery({
    queryKey: ['list', id],
    queryFn: () => getList(id),
    enabled: !!id,
  });
}

export function useMangaLists(mangaId: string) {
  return useQuery({
    queryKey: ['manga-lists', mangaId],
    queryFn: () => getMangaLists(mangaId),
    enabled: !!mangaId,
  });
}

export function useCreateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateListData) => createList(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

export function useUpdateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateListData> }) =>
      updateList(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      queryClient.invalidateQueries({ queryKey: ['list', id] });
    },
  });
}

export function useDeleteList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteList(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

export function useAddMangaToList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, data }: { listId: string; data: AddMangaToListData }) =>
      addMangaToList(listId, data),
    onSuccess: (_, { listId, data }) => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      queryClient.invalidateQueries({ queryKey: ['list', listId] });
      queryClient.invalidateQueries({ queryKey: ['manga-lists', data.mangaId] });
    },
  });
}

export function useRemoveMangaFromList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, mangaId }: { listId: string; mangaId: string }) =>
      removeMangaFromList(listId, mangaId),
    onSuccess: (_, { listId, mangaId }) => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      queryClient.invalidateQueries({ queryKey: ['list', listId] });
      queryClient.invalidateQueries({ queryKey: ['manga-lists', mangaId] });
    },
  });
}
