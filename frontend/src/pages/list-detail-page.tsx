import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Loader2, List as ListIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MangaImage } from '@/components/ui/manga-image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useList, useRemoveMangaFromList } from '@/hooks/use-lists';

const statusColors: Record<string, string> = {
  reading: 'bg-blue-500',
  completed: 'bg-green-500',
  paused: 'bg-yellow-500',
  dropped: 'bg-red-500',
  plan_to_read: 'bg-purple-500',
};

export default function ListDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data: list, isLoading, error } = useList(id);
  const removeManga = useRemoveMangaFromList();

  const handleRemoveManga = async (mangaId: string) => {
    await removeManga.mutateAsync({ listId: id, mangaId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground mb-4">List not found</p>
        <Link to="/lists">
          <Button variant="outline">Back to Lists</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/lists">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      {/* List Info */}
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: (list.color || '#3b82f6') + '20' }}
        >
          <ListIcon
            className="h-7 w-7"
            style={{ color: list.color || '#3b82f6' }}
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{list.name}</h1>
          <p className="text-muted-foreground">
            {list.mangaCount} manga{list.mangaCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Mangas Grid */}
      {list.mangas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ListIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No mangas in this list</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add mangas to this list from their detail pages
            </p>
            <Link to="/mangas">
              <Button variant="outline">Browse Mangas</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.mangas.map((manga) => (
            <Card key={manga.id} className="group overflow-hidden">
              <div className="relative aspect-[2/3]">
                <Link to={`/mangas/${manga.id}`}>
                  <MangaImage
                    src={manga.imageUrl}
                    filename={manga.imageFilename}
                    alt={manga.primaryTitle}
                    className="transition-transform group-hover:scale-105"
                  />
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove from list</AlertDialogTitle>
                      <AlertDialogDescription>
                        Remove &quot;{manga.primaryTitle}&quot; from this list?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleRemoveManga(manga.id)}>
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-2 h-2 rounded-full ${statusColors[manga.status] || statusColors.plan_to_read}`}
                    />
                    <span className="text-white text-xs">
                      Ch. {manga.lastChapterRead}
                      {manga.totalChapters && ` / ${manga.totalChapters}`}
                    </span>
                  </div>
                </div>
              </div>
              <CardContent className="p-3">
                <Link to={`/mangas/${manga.id}`}>
                  <h3 className="font-medium line-clamp-2 hover:text-primary transition-colors">
                    {manga.primaryTitle}
                  </h3>
                </Link>
                <div className="flex flex-wrap gap-1 mt-2">
                  {manga.type && (
                    <Badge variant="secondary" className="text-xs">
                      {manga.type.name}
                    </Badge>
                  )}
                  {manga.genres.slice(0, 2).map((genre) => (
                    <Badge key={genre.id} variant="outline" className="text-xs">
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
