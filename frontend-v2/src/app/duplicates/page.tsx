'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MangaImage } from '@/components/ui/manga-image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Merge,
  Check,
  Trash2,
  Loader2,
  Star,
  BookOpen,
  AlertTriangle,
  Link2,
  FileText,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface MangaItem {
  id: string;
  primaryTitle: string;
  imageUrl: string | null;
  imageFilename: string | null;
  status: string | null;
  lastChapterRead: number | null;
  totalChapters: number | null;
  rating: number | null;
  namesCount: number;
  linksCount: number;
}

interface DuplicateGroup {
  similarity: number;
  matchingName?: string;
  mangas: MangaItem[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

async function getDuplicates(): Promise<DuplicateGroup[]> {
  const res = await fetch(`${API_URL}/duplicates`);
  if (!res.ok) throw new Error('Failed to fetch duplicates');
  return res.json();
}

async function mergeDuplicates(primaryId: string, secondaryId: string) {
  const res = await fetch(`${API_URL}/duplicates/merge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ primaryId, secondaryId }),
  });
  if (!res.ok) throw new Error('Failed to merge');
  return res.json();
}

async function deleteManga(id: string) {
  const res = await fetch(`${API_URL}/mangas/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete');
}

type DialogType = 'keep' | 'delete' | 'deleteGroup' | null;

interface DialogState {
  type: DialogType;
  groupIndex: number | null;
  manga: MangaItem | null;
  keepId: string | null;
  deleteIds: string[];
}

const statusLabels: Record<string, string> = {
  reading: 'Reading',
  completed: 'Completed',
  paused: 'Paused',
  dropped: 'Dropped',
  plan_to_read: 'Plan to Read',
};

const statusColors: Record<string, string> = {
  reading: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  completed: 'bg-green-500/10 text-green-600 border-green-500/20',
  paused: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  dropped: 'bg-red-500/10 text-red-600 border-red-500/20',
  plan_to_read: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

export default function DuplicatesPage() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [dialogState, setDialogState] = useState<DialogState>({
    type: null,
    groupIndex: null,
    manga: null,
    keepId: null,
    deleteIds: [],
  });
  const [pendingAction, setPendingAction] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['duplicates'],
    queryFn: getDuplicates,
    refetchOnWindowFocus: false,
  });

  // Sincroniza dados com estado local
  useEffect(() => {
    if (data) setGroups(data);
  }, [data]);

  const mergeMutation = useMutation({
    mutationFn: async ({ keepId, deleteIds }: { keepId: string; deleteIds: string[] }) => {
      for (const deleteId of deleteIds) {
        await mergeDuplicates(keepId, deleteId);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteManga,
  });

  const closeDialog = useCallback(() => {
    setDialogState({
      type: null,
      groupIndex: null,
      manga: null,
      keepId: null,
      deleteIds: [],
    });
    setPendingAction(false);
  }, []);

  // Remove grupo do estado local
  const removeGroup = useCallback((groupIndex: number) => {
    setGroups((prev) => prev.filter((_, i) => i !== groupIndex));
  }, []);

  // Remove manga de um grupo (se sobrar 1, remove o grupo)
  const removeMangaFromGroup = useCallback((groupIndex: number, mangaId: string) => {
    setGroups((prev) => {
      const newGroups = [...prev];
      const group = newGroups[groupIndex];
      if (!group) return prev;

      const newMangas = group.mangas.filter((m) => m.id !== mangaId);
      if (newMangas.length <= 1) {
        return prev.filter((_, i) => i !== groupIndex);
      }

      newGroups[groupIndex] = { ...group, mangas: newMangas };
      return newGroups;
    });
  }, []);

  // Handler para "Keep" - abre dialog
  const handleKeepClick = (groupIndex: number, manga: MangaItem) => {
    const group = groups[groupIndex];
    const deleteIds = group.mangas.filter((m) => m.id !== manga.id).map((m) => m.id);
    setDialogState({
      type: 'keep',
      groupIndex,
      manga,
      keepId: manga.id,
      deleteIds,
    });
  };

  // Handler para "Delete" individual - abre dialog
  const handleDeleteClick = (groupIndex: number, manga: MangaItem) => {
    setDialogState({
      type: 'delete',
      groupIndex,
      manga,
      keepId: null,
      deleteIds: [manga.id],
    });
  };

  // Handler para "Delete Group" - abre dialog
  const handleDeleteGroupClick = (groupIndex: number) => {
    const group = groups[groupIndex];
    setDialogState({
      type: 'deleteGroup',
      groupIndex,
      manga: null,
      keepId: null,
      deleteIds: group.mangas.map((m) => m.id),
    });
  };

  // Confirma ação do dialog
  const confirmAction = async () => {
    const { type, groupIndex, keepId, deleteIds } = dialogState;
    if (groupIndex === null) return;

    setPendingAction(true);

    try {
      if (type === 'keep' && keepId) {
        await mergeMutation.mutateAsync({ keepId, deleteIds });
        removeGroup(groupIndex);
      } else if (type === 'delete' && deleteIds.length === 1) {
        await deleteMutation.mutateAsync(deleteIds[0]);
        removeMangaFromGroup(groupIndex, deleteIds[0]);
      } else if (type === 'deleteGroup') {
        for (const id of deleteIds) {
          await deleteMutation.mutateAsync(id);
        }
        removeGroup(groupIndex);
      }
    } catch (error) {
      console.error('Action failed:', error);
    }

    closeDialog();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Duplicate Detection</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mangas with matching titles or alternative names
          </p>
        </div>
        {groups.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-normal">
              {groups.length} groups
            </Badge>
            <Badge variant="outline" className="font-normal">
              {groups.reduce((acc, g) => acc + g.mangas.length, 0)} mangas
            </Badge>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">
              Failed to load duplicates. Make sure the backend is running.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && groups.length === 0 ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px]" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        /* Empty state */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Merge className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">No duplicates found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your library is clean! No duplicate mangas detected.
            </p>
          </CardContent>
        </Card>
      ) : (
        /* Groups list */
        <div className="space-y-6">
          {groups.map((group, groupIndex) => (
            <Card key={group.mangas.map((m) => m.id).sort().join('-')} className="overflow-hidden">
              {/* Group header */}
              <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b">
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant="destructive" className="shrink-0 text-xs">
                    {group.mangas.length} duplicates
                  </Badge>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
                    <span className="shrink-0">Match:</span>
                    <span className="font-medium text-foreground truncate" title={group.matchingName}>
                      {group.matchingName || 'Exact title'}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 h-8"
                  onClick={() => handleDeleteGroupClick(groupIndex)}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Delete All
                </Button>
              </div>

              {/* Manga items - horizontal layout */}
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.mangas.map((manga, idx) => (
                    <div
                      key={manga.id}
                      className={`flex gap-4 p-3 rounded-lg border transition-all ${
                        idx === 0
                          ? 'border-primary/30 bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                      }`}
                    >
                      {/* Cover - larger */}
                      <div className="relative w-24 h-36 rounded-md overflow-hidden bg-muted shrink-0 ring-1 ring-border shadow-sm">
                        <MangaImage
                          src={manga.imageUrl}
                          filename={manga.imageFilename}
                          alt={manga.primaryTitle}
                          sizes="96px"
                        />
                        {idx === 0 && (
                          <div className="absolute top-1 right-1">
                            <div className="bg-amber-500 text-white rounded-full p-1 shadow-sm">
                              <Star className="h-3 w-3 fill-current" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        {/* Title with link */}
                        <div className="flex items-start gap-1.5">
                          <h3 className="font-medium leading-tight line-clamp-2 text-sm flex-1">
                            {manga.primaryTitle}
                          </h3>
                          <Link
                            href={`/mangas/${manga.id}`}
                            target="_blank"
                            className="shrink-0 text-muted-foreground hover:text-primary transition-colors p-0.5"
                            title="Open in new tab"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>

                        {/* Status */}
                        {manga.status && (
                          <Badge
                            variant="outline"
                            className={`text-xs font-normal mt-1.5 w-fit ${statusColors[manga.status] || ''}`}
                          >
                            {statusLabels[manga.status] || manga.status}
                          </Badge>
                        )}

                        {/* Stats */}
                        <div className="mt-auto pt-2 space-y-1">
                          {/* Chapters */}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>
                              Ch. {manga.lastChapterRead || 0}
                              {manga.totalChapters ? ` / ${manga.totalChapters}` : ''}
                            </span>
                            {manga.rating && (
                              <>
                                <span className="text-border">•</span>
                                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                <span>{manga.rating.toFixed(1)}</span>
                              </>
                            )}
                          </div>

                          {/* Names & Links */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5" />
                              <span>{manga.namesCount} names</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Link2 className="h-3.5 w-3.5" />
                              <span>{manga.linksCount} links</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t">
                          <Button
                            size="sm"
                            variant={idx === 0 ? 'default' : 'secondary'}
                            className="h-8 text-xs flex-1"
                            onClick={() => handleKeepClick(groupIndex, manga)}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Keep This
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteClick(groupIndex, manga)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Load more */}
          {groups.length >= 10 && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={() => refetch()}>
                <ChevronRight className="h-4 w-4 mr-2" />
                Load More Groups
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={dialogState.type !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogState.type === 'keep' && 'Keep and Merge'}
              {dialogState.type === 'delete' && 'Delete Manga'}
              {dialogState.type === 'deleteGroup' && 'Delete All Duplicates'}
            </DialogTitle>
            <DialogDescription>
              {dialogState.type === 'keep' && (
                <>
                  Keep <span className="font-medium text-foreground">{dialogState.manga?.primaryTitle}</span> and
                  merge {dialogState.deleteIds.length} duplicate(s) into it. The duplicates will be removed but
                  their data (alternative names, links, etc.) will be preserved.
                </>
              )}
              {dialogState.type === 'delete' && (
                <>
                  Are you sure you want to delete{' '}
                  <span className="font-medium text-foreground">{dialogState.manga?.primaryTitle}</span>?
                  This action cannot be undone.
                </>
              )}
              {dialogState.type === 'deleteGroup' && (
                <>
                  Are you sure you want to delete all {dialogState.deleteIds.length} mangas in this group?
                  This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Preview for keep action */}
          {dialogState.type === 'keep' && dialogState.manga && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
              <div className="relative w-12 h-16 rounded overflow-hidden bg-muted shrink-0">
                <MangaImage
                  src={dialogState.manga.imageUrl}
                  filename={dialogState.manga.imageFilename}
                  alt={dialogState.manga.primaryTitle}
                  sizes="48px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium line-clamp-1">{dialogState.manga.primaryTitle}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>Ch. {dialogState.manga.lastChapterRead || 0}</span>
                  <span>{dialogState.manga.namesCount} names</span>
                  <span>{dialogState.manga.linksCount} links</span>
                </div>
              </div>
              <Badge variant="secondary" className="shrink-0 text-xs">Will be kept</Badge>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={pendingAction}>
              Cancel
            </Button>
            <Button
              variant={dialogState.type === 'keep' ? 'default' : 'destructive'}
              onClick={confirmAction}
              disabled={pendingAction}
            >
              {pendingAction ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : dialogState.type === 'keep' ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {dialogState.type === 'keep' && 'Keep & Merge'}
              {dialogState.type === 'delete' && 'Delete'}
              {dialogState.type === 'deleteGroup' && 'Delete All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
