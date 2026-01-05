'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, StickyNote } from 'lucide-react';
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
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-transparent p-0 border-b rounded-none">
        <TabsTrigger
          value="overview"
          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
        >
          Overview
        </TabsTrigger>
        <TabsTrigger
          value="details"
          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
        >
          Details
        </TabsTrigger>
        <TabsTrigger
          value="links"
          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
        >
          Links
          {manga.links && manga.links.length > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
              {manga.links.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="notes"
          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
        >
          Notes
        </TabsTrigger>
        <TabsTrigger
          value="history"
          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
        >
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

        <TagSection title="Genres" tags={manga.genres} />
        <TagSection title="Themes" tags={manga.themes} />
        <TagSection title="Tags" tags={manga.tags} />
      </TabsContent>

      {/* Details Tab */}
      <TabsContent value="details" className="space-y-6 pt-6">
        <div className="grid grid-cols-2 gap-4">
          {manga.type && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
              <p className="font-medium">{manga.type.name}</p>
            </div>
          )}
          {manga.demographic && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Demographic</h4>
              <p className="font-medium">{manga.demographic.name}</p>
            </div>
          )}
          {manga.contentRating && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Content Rating</h4>
              <p className="font-medium">{manga.contentRating.name}</p>
            </div>
          )}
          {manga.statusRef && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Publication Status</h4>
              <p className="font-medium">{manga.statusRef.name}</p>
            </div>
          )}
        </div>

        {manga.alternativeNames && manga.alternativeNames.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Alternative Names</h4>
            <ul className="space-y-1">
              {manga.alternativeNames.map((name) => (
                <li key={name.id} className="text-sm flex items-center gap-2">
                  <span>{name.name}</span>
                  {name.language && (
                    <Badge variant="outline" className="text-xs">
                      {name.language}
                    </Badge>
                  )}
                  {name.isOfficial && (
                    <Badge variant="secondary" className="text-xs">
                      Official
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
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
