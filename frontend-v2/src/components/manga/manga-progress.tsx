'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MangaProgressProps {
  lastChapterRead?: number | null;
  totalChapters?: number | null;
  isPending?: boolean;
  onChapterChange: (chapter: number) => void;
  onMarkComplete?: () => void;
  className?: string;
}

export function MangaProgress({
  lastChapterRead,
  totalChapters,
  isPending = false,
  onChapterChange,
  onMarkComplete,
  className,
}: MangaProgressProps) {
  const [editingChapter, setEditingChapter] = useState(false);
  const [chapterInput, setChapterInput] = useState('');

  const currentChapter = lastChapterRead || 0;
  const progress = totalChapters && currentChapter
    ? Math.min(100, Math.round((currentChapter / totalChapters) * 100))
    : null;

  const handleChapterChange = (delta: number) => {
    const newChapter = Math.max(0, currentChapter + delta);
    onChapterChange(newChapter);
  };

  const handleChapterSubmit = () => {
    const chapter = parseInt(chapterInput, 10);
    if (!isNaN(chapter) && chapter >= 0) {
      onChapterChange(chapter);
    }
    setEditingChapter(false);
    setChapterInput('');
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Progress Label */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Progress</span>
        <span className="font-medium">
          Ch. {currentChapter}
          {totalChapters && <span className="text-muted-foreground"> / {totalChapters}</span>}
          {progress !== null && (
            <span className="text-muted-foreground ml-2">({progress}%)</span>
          )}
        </span>
      </div>

      {/* Progress Bar */}
      {progress !== null && (
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Chapter Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={() => handleChapterChange(-1)}
          disabled={isPending || currentChapter <= 0}
        >
          <Minus className="h-5 w-5" />
        </Button>

        {editingChapter ? (
          <Input
            type="number"
            min="0"
            value={chapterInput}
            onChange={(e) => setChapterInput(e.target.value)}
            onBlur={handleChapterSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleChapterSubmit()}
            className="w-40 h-10 text-center text-base font-medium"
            autoFocus
          />
        ) : (
          <button
            onClick={() => {
              setChapterInput(String(currentChapter));
              setEditingChapter(true);
            }}
            className="w-40 h-10 px-3 text-base font-medium border rounded-md hover:bg-muted transition-colors text-center"
          >
            {currentChapter}
          </button>
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={() => handleChapterChange(1)}
          disabled={isPending}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
