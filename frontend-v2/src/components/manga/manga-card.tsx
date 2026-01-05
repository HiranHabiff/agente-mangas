'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MangaImage } from '@/components/ui/manga-image';
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

  const progress = manga.totalChapters && manga.lastChapterRead
    ? Math.round((manga.lastChapterRead / manga.totalChapters) * 100)
    : null;

  return (
    <Link href={`/mangas/${manga.id}`} className="block h-full">
      <Card className={cn('group overflow-hidden transition-all py-0 gap-0 rounded-md bg-transparent border-0 shadow-none', className)}>
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
                'absolute top-2 left-2 text-xs text-white',
                statusColors[manga.status] || 'bg-gray-500'
              )}
            >
              {statusLabels[manga.status] || manga.status}
            </Badge>
          )}

          {/* Rating */}
          {manga.rating != null && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 rounded px-1.5 py-0.5">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-xs text-white font-medium">
                {manga.rating.toFixed(1)}
              </span>
            </div>
          )}

          {/* Progress bar */}
          {progress !== null && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
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
    </Link>
  );
}
