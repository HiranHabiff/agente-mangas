import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getReminders,
  getTriggeredReminders,
  getMangaReminders,
  createReminder,
  updateReminder,
  dismissReminder,
  deleteReminder,
  type CreateReminderData,
} from '@/lib/api';

export function useReminders() {
  return useQuery({
    queryKey: ['reminders'],
    queryFn: getReminders,
  });
}

export function useTriggeredReminders() {
  return useQuery({
    queryKey: ['reminders', 'triggered'],
    queryFn: getTriggeredReminders,
    refetchInterval: 60000, // Refetch a cada minuto
  });
}

export function useMangaReminders(mangaId: string) {
  return useQuery({
    queryKey: ['reminders', 'manga', mangaId],
    queryFn: () => getMangaReminders(mangaId),
    enabled: !!mangaId,
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReminderData) => createReminder(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['reminders', 'manga', variables.mangaId] });
    },
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateReminderData> & { isActive?: boolean } }) =>
      updateReminder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useDismissReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dismissReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}
