'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { MangaHero } from '@/components/manga/manga-hero';
import { MangaTabs } from '@/components/manga/manga-tabs';
import { ReadingHistory } from '@/components/manga/reading-history';
import { useManga, useUpdateChapter, useUpdateStatus, useUpdateManga, useDeleteManga, useReadingSessions, useReadingStats } from '@/hooks/use-mangas';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MangaDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: manga, isLoading, error } = useManga(id);
  const { data: sessions = [], isLoading: sessionsLoading } = useReadingSessions(id);
  const { data: stats, isLoading: statsLoading } = useReadingStats(id);

  const updateChapter = useUpdateChapter();
  const updateStatus = useUpdateStatus();
  const updateManga = useUpdateManga();
  const deleteManga = useDeleteManga();

  const handleChapterChange = (chapter: number) => {
    updateChapter.mutate(
      { id, chapter },
      {
        onSuccess: () => {
          toast.success(`Chapter updated to ${chapter}`);
        },
        onError: (error) => {
          toast.error('Failed to update chapter');
          console.error(error);
        },
      }
    );
  };

  const handleStatusChange = (status: string) => {
    updateStatus.mutate(
      { id, status },
      {
        onSuccess: () => {
          toast.success('Status updated');
        },
        onError: (error) => {
          toast.error('Failed to update status');
          console.error(error);
        },
      }
    );
  };

  const handleNotesChange = (notes: string) => {
    updateManga.mutate(
      { id, data: { userNotes: notes } },
      {
        onSuccess: () => {
          toast.success('Notes saved');
        },
        onError: (error) => {
          toast.error('Failed to save notes');
          console.error(error);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this manga?')) return;

    deleteManga.mutate(id, {
      onSuccess: () => {
        toast.success('Manga deleted');
        router.push('/mangas');
      },
      onError: (error) => {
        toast.error('Failed to delete manga');
        console.error(error);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !manga) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Manga not found</p>
        </CardContent>
      </Card>
    );
  }

  const isPending = updateChapter.isPending || updateStatus.isPending;

  const readingHistoryContent = (
    <ReadingHistory
      sessions={sessions}
      stats={stats || {
        totalSessions: 0,
        totalChaptersRead: 0,
        totalTimeMinutes: 0,
        avgTimePerChapter: null,
        firstReadAt: null,
        lastReadAt: null,
      }}
      isLoading={sessionsLoading || statsLoading}
    />
  );

  return (
    <div className="space-y-6">
      <MangaHero
        manga={manga}
        onChapterChange={handleChapterChange}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        isPending={isPending}
      />

      <MangaTabs
        manga={manga}
        onNotesChange={handleNotesChange}
        readingHistory={readingHistoryContent}
      />
    </div>
  );
}
