import { Link } from 'react-router-dom';
import { ArrowLeft, Star, MoreVertical, Pencil, Image, Search, Trash2, List, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MangaImage } from '@/components/ui/manga-image';
import { MangaProgress } from './manga-progress';
import { AddToListModal } from './add-to-list-modal';
import { AddReminderModal } from './add-reminder-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MangaDetail } from '@/types/manga';
import type { ReactNode } from 'react';

const statusOptions = [
  { value: 'reading', label: 'Reading', color: 'bg-blue-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'paused', label: 'Paused', color: 'bg-yellow-500' },
  { value: 'dropped', label: 'Dropped', color: 'bg-red-500' },
  { value: 'plan_to_read', label: 'Plan to Read', color: 'bg-purple-500' },
];

interface MangaHeroProps {
  manga: MangaDetail;
  onChapterChange: (chapter: number) => void;
  onStatusChange: (status: string) => void;
  onDelete?: () => void;
  isPending?: boolean;
  children?: ReactNode;
}

export function MangaHero({
  manga,
  onChapterChange,
  onStatusChange,
  onDelete,
  isPending = false,
  children,
}: MangaHeroProps) {
  const currentStatus = statusOptions.find((s) => s.value === manga.status) || statusOptions[4];

  const handleMarkComplete = () => {
    onStatusChange('completed');
    if (manga.totalChapters) {
      onChapterChange(manga.totalChapters);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link to="/mangas">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Link to={`/mangas/${manga.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/mangas/${manga.id}/edit`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit manga
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/mangas/${manga.id}/edit?tab=image`}>
                  <Image className="h-4 w-4 mr-2" />
                  Update cover
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/duplicates?manga=${manga.id}`}>
                  <Search className="h-4 w-4 mr-2" />
                  Find duplicates
                </Link>
              </DropdownMenuItem>
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete manga
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Hero Content */}
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        {/* Cover Image + Progress */}
        <div className="flex flex-col gap-4 mx-auto md:mx-0 max-w-[280px] w-full">
          {/* Cover Image */}
          <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted shadow-lg">
            <MangaImage
              src={manga.imageUrl}
              filename={manga.imageFilename}
              alt={manga.primaryTitle}
            />
          </div>

          {/* Progress Widget - abaixo da imagem */}
          <div className="bg-muted/30 rounded-lg p-4 border">
            <MangaProgress
              lastChapterRead={manga.lastChapterRead}
              totalChapters={manga.totalChapters}
              isPending={isPending}
              onChapterChange={onChapterChange}
              onMarkComplete={handleMarkComplete}
            />
          </div>
        </div>

        {/* Info */}
        <div className="space-y-4">
          {/* Title & Rating */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                {manga.primaryTitle}
              </h1>
              {manga.alternativeNames && manga.alternativeNames.length > 0 && (
                <p className="text-muted-foreground text-sm">
                  {manga.alternativeNames.slice(0, 2).map((n) => n.name).join(' • ')}
                </p>
              )}
            </div>

            {manga.rating != null && (
              <div className="flex items-center gap-1.5 shrink-0 bg-muted/50 px-3 py-1.5 rounded-lg">
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                <span className="text-lg font-semibold">{manga.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Status & Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={manga.status || 'plan_to_read'} onValueChange={onStatusChange}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${status.color}`} />
                      {status.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <AddToListModal
              mangaId={manga.id}
              mangaTitle={manga.primaryTitle}
              trigger={
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <List className="h-4 w-4" />
                  Add to List
                </Button>
              }
            />

            <AddReminderModal
              mangaId={manga.id}
              mangaTitle={manga.primaryTitle}
              trigger={
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <Bell className="h-4 w-4" />
                  Reminder
                </Button>
              }
            />

            {manga.type && (
              <Badge variant="secondary">{manga.type.name}</Badge>
            )}
            {manga.demographic && (
              <Badge variant="secondary">{manga.demographic.name}</Badge>
            )}
            {manga.contentRating && (
              <Badge variant="outline">{manga.contentRating.name}</Badge>
            )}
          </div>

          {/* Tabs Content */}
          {children}
        </div>
      </div>
    </div>
  );
}
