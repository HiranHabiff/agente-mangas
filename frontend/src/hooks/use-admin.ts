import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminItems, createAdminItem, updateAdminItem, deleteAdminItem } from '@/lib/api';
import type { Tag } from '@/types/manga';

export function useAdminItems(table: string) {
  return useQuery({
    queryKey: ['admin', table],
    queryFn: () => getAdminItems(table),
  });
}

export function useCreateAdminItem(table: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Tag>) => createAdminItem(table, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', table] });
      queryClient.invalidateQueries({ queryKey: ['filterOptions'] });
    },
  });
}

export function useUpdateAdminItem(table: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tag> }) =>
      updateAdminItem(table, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', table] });
      queryClient.invalidateQueries({ queryKey: ['filterOptions'] });
    },
  });
}

export function useDeleteAdminItem(table: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAdminItem(table, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', table] });
      queryClient.invalidateQueries({ queryKey: ['filterOptions'] });
    },
  });
}
