'use client';

import { useRouter } from 'next/navigation';
import { Star, Plus, Bell, List, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MangaImage } from '@/components/ui/manga-image';
import { AddReminderModal } from './add-reminder-modal';
import { AddToListModal } from './add-to-list-modal';
import { useUpdateChapter } from '@/hooks/use-mangas';
import { cn } from '@/lib/utils';
import type { Manga } from '@/types/manga';

interface MangaCardProps {
  manga: Manga;
  className?: string;
}

const statusColors: Record<string, string> = {
  reading: 'bg-blue-500',
  completed: 'bg-green-500',
  paused: 'bg-yellow-500',
  dropped: 'bg-red-500',
  plan_to_read: 'bg-purple-500',
};

const statusLabels: Record<string, string> = {
  reading: 'Reading',
  completed: 'Completed',
  paused: 'Paused',
  dropped: 'Dropped',
  plan_to_read: 'Plan to Read',
};

export function MangaCard({ manga, className }: MangaCardProps) {
  const router = useRouter();
  const updateChapter = useUpdateChapter();

  const progress = manga.totalChapters && manga.lastChapterRead
    ? Math.round((manga.lastChapterRead / manga.totalChapters) * 100)
    : null;

  const handleCardClick = () => {
    router.push(`/mangas/${manga.id}`);
  };

  const handleIncrementChapter = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateChapter.mutate({
      id: manga.id,
      chapter: (manga.lastChapterRead || 0) + 1,
    });
  };

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        'group overflow-hidden transition-all py-0 gap-0 rounded-md bg-transparent border-0 shadow-none cursor-pointer h-full',
        className
      )}
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-muted rounded-md">
        <MangaImage
          src={manga.imageUrl}
          filename={manga.imageFilename}
          alt={manga.primaryTitle}
          className="group-hover:scale-105 transition-transform"
        />

        {/* Status badge */}
        {manga.status && (
          <Badge
            className={cn(
              'absolute top-2 left-2 text-xs text-white z-20',
              statusColors[manga.status] || 'bg-gray-500'
            )}
          >
            {statusLabels[manga.status] || manga.status}
          </Badge>
        )}

        {/* Rating */}
        {manga.rating != null && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 rounded px-1.5 py-0.5 z-20">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-white font-medium">
              {manga.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
          <div
            className="flex flex-col gap-2 p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5 text-xs"
              onClick={handleIncrementChapter}
              disabled={updateChapter.isPending}
            >
              {updateChapter.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Ch. {manga.lastChapterRead || 0}
            </Button>

            <AddReminderModal
              mangaId={manga.id}
              mangaTitle={manga.primaryTitle}
              trigger={
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1.5 text-xs"
                >
                  <Bell className="h-3.5 w-3.5" />
                  Lembrete
                </Button>
              }
            />

            <AddToListModal
              mangaId={manga.id}
              mangaTitle={manga.primaryTitle}
              trigger={
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1.5 text-xs"
                >
                  <List className="h-3.5 w-3.5" />
                  Add to List
                </Button>
              }
            />
          </div>
        </div>

        {/* Progress bar */}
        {progress !== null && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50 z-20">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      <CardContent className="!px-2 py-1.5">
        <h3 className="font-medium text-sm line-clamp-1" title={manga.primaryTitle}>
          {manga.primaryTitle}
        </h3>

        <div className="flex items-center justify-between text-xs text-muted-foreground mt-0.5">
          <span>
            Ch. {manga.lastChapterRead || 0}
            {manga.totalChapters && ` / ${manga.totalChapters}`}
          </span>
          {manga.type && (
            <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
              {manga.type.name}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
