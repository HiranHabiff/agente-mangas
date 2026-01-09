'use client';

import { useState } from 'react';
import { List, Plus, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useLists, useMangaLists, useCreateList, useAddMangaToList, useRemoveMangaFromList } from '@/hooks/use-lists';

interface AddToListModalProps {
  mangaId: string;
  mangaTitle: string;
  trigger?: React.ReactNode;
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

export function AddToListModal({ mangaId, mangaTitle, trigger }: AddToListModalProps) {
  const [open, setOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListColor, setNewListColor] = useState('#3b82f6');

  const { data: lists = [], isLoading: listsLoading } = useLists();
  const { data: mangaLists = [], isLoading: mangaListsLoading } = useMangaLists(mangaId);
  const createList = useCreateList();
  const addToList = useAddMangaToList();
  const removeFromList = useRemoveMangaFromList();

  const isLoading = listsLoading || mangaListsLoading;
  const mangaListIds = new Set(mangaLists.map((l) => l.id));

  const handleToggleList = async (listId: string) => {
    if (mangaListIds.has(listId)) {
      await removeFromList.mutateAsync({ listId, mangaId });
    } else {
      await addToList.mutateAsync({ listId, data: { mangaId } });
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    try {
      const newList = await createList.mutateAsync({
        name: newListName.trim(),
        color: newListColor,
      });
      // Auto-add manga to the new list
      await addToList.mutateAsync({ listId: newList.id, data: { mangaId } });
      setNewListName('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create list:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <List className="h-4 w-4" />
            Add to List
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Reading List</DialogTitle>
          <DialogDescription className="truncate">
            {mangaTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Existing Lists */}
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2">
                  {lists.length === 0 && !showCreateForm && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No lists yet. Create one below!
                    </p>
                  )}
                  {lists.map((list) => {
                    const isInList = mangaListIds.has(list.id);
                    const isPending =
                      addToList.isPending || removeFromList.isPending;

                    return (
                      <button
                        key={list.id}
                        onClick={() => handleToggleList(list.id)}
                        disabled={isPending}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left',
                          isInList
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-muted/50 border-transparent'
                        )}
                      >
                        <div
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: list.color || '#3b82f6' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{list.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {list.mangaCount} manga{list.mangaCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {isInList && (
                          <Check className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Create New List Form */}
              {showCreateForm ? (
                <div className="space-y-3 border-t pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="listName">List Name</Label>
                    <Input
                      id="listName"
                      placeholder="My Reading List"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewListColor(color)}
                          className={cn(
                            'w-6 h-6 rounded-full transition-transform',
                            newListColor === color && 'ring-2 ring-offset-2 ring-primary scale-110'
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewListName('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleCreateList}
                      disabled={!newListName.trim() || createList.isPending}
                    >
                      {createList.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Create & Add'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setShowCreateForm(true)}
                >
                  <Plus className="h-4 w-4" />
                  Create New List
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
