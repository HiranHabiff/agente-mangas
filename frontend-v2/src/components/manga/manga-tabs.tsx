'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Clock, Copy, ExternalLink, FileText, Link2, StickyNote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuickStats } from './quick-stats';
import { ExternalLinks } from './external-links';
import type { MangaDetail, Tag } from '@/types/manga';

interface MangaTabsProps {
  manga: MangaDetail;
  onNotesChange?: (notes: string) => void;
  readingHistory?: React.ReactNode;
}

function Synopsis({ text, maxLength = 500 }: { text: string; maxLength?: number }) {
  const [expanded, setExpanded] = useState(false);
  const shouldTruncate = text.length > maxLength;
  const displayText = expanded || !shouldTruncate
    ? text
    : text.slice(0, maxLength) + '...';

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Synopsis
      </h3>
      <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
        {displayText}
      </p>
      {shouldTruncate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="text-xs h-7 px-2"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Show more
            </>
          )}
        </Button>
      )}
    </div>
  );
}

function TagSection({ title, tags }: { title: string; tags: Tag[] }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            style={tag.color ? { backgroundColor: tag.color, color: '#fff' } : undefined}
          >
            {tag.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function UserNotes({
  notes,
  onNotesChange
}: {
  notes: string | null | undefined;
  onNotesChange?: (notes: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(notes || '');

  const handleSave = () => {
    onNotesChange?.(value);
    setEditing(false);
  };

  const handleCancel = () => {
    setValue(notes || '');
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="space-y-3">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add your notes here..."
          className="min-h-[150px]"
          autoFocus
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notes ? (
        <p className="text-sm text-muted-foreground whitespace-pre-line">{notes}</p>
      ) : (
        <p className="text-sm text-muted-foreground italic">No notes yet.</p>
      )}
      <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
        <StickyNote className="h-4 w-4 mr-2" />
        {notes ? 'Edit notes' : 'Add notes'}
      </Button>
    </div>
  );
}

export function MangaTabs({ manga, onNotesChange, readingHistory }: MangaTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full mt-4">
      <TabsList className="w-full h-10 grid grid-cols-5 gap-1 rounded-lg bg-muted p-1">
        <TabsTrigger
          value="overview"
          className="inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
        >
          <FileText className="h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger
          value="names"
          className="inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
        >
          <BookOpen className="h-4 w-4" />
          Names
          {manga.alternativeNames && manga.alternativeNames.length > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-background/50">
              {manga.alternativeNames.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="links"
          className="inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
        >
          <Link2 className="h-4 w-4" />
          Links
          {manga.links && manga.links.length > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-background/50">
              {manga.links.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="notes"
          className="inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
        >
          <StickyNote className="h-4 w-4" />
          Notes
        </TabsTrigger>
        <TabsTrigger
          value="history"
          className="inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
        >
          <Clock className="h-4 w-4" />
          History
        </TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-6 pt-6">
        {manga.synopsis && <Synopsis text={manga.synopsis} />}

        <QuickStats
          lastChapterRead={manga.lastChapterRead}
          totalChapters={manga.totalChapters}
          createdAt={manga.createdAt}
          updatedAt={manga.updatedAt}
          lastReadAt={manga.lastReadAt}
        />

        {/* Type, Content Rating, Publication Status */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {manga.type && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">Type</h4>
              <p className="text-sm font-medium">{manga.type.name}</p>
            </div>
          )}
          {manga.contentRating && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">Content Rating</h4>
              <p className="text-sm font-medium">{manga.contentRating.name}</p>
            </div>
          )}
          {manga.statusRef && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">Publication Status</h4>
              <p className="text-sm font-medium">{manga.statusRef.name}</p>
            </div>
          )}
          {manga.demographic && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">Demographic</h4>
              <p className="text-sm font-medium">{manga.demographic.name}</p>
            </div>
          )}
        </div>

        <TagSection title="Genres" tags={manga.genres} />
        <TagSection title="Themes" tags={manga.themes} />
        <TagSection title="Tags" tags={manga.tags} />
      </TabsContent>

      {/* Alternative Names Tab */}
      <TabsContent value="names" className="pt-6">
        {manga.alternativeNames && manga.alternativeNames.length > 0 ? (
          <div className="space-y-2">
            {manga.alternativeNames.map((name) => (
              <div
                key={name.id}
                className="flex items-center justify-between gap-2 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm font-medium flex-1">{name.name}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      navigator.clipboard.writeText(name.name);
                    }}
                    title="Copy name"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(name.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Search on Google"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No alternative names available</p>
          </div>
        )}
      </TabsContent>

      {/* Links Tab */}
      <TabsContent value="links" className="pt-6">
        <ExternalLinks links={manga.links} />
      </TabsContent>

      {/* Notes Tab */}
      <TabsContent value="notes" className="pt-6">
        <UserNotes notes={manga.userNotes} onNotesChange={onNotesChange} />
      </TabsContent>

      {/* History Tab */}
      <TabsContent value="history" className="pt-6">
        {readingHistory || (
          <div className="text-center py-8 text-muted-foreground">
            <p>Reading history will appear here</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
