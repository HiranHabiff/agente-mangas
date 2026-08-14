import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useStats } from '@/hooks/use-mangas';
import { useLists } from '@/hooks/use-lists';
import { useTriggeredReminders, useDismissReminder } from '@/hooks/use-reminders';
import { MangaImage } from '@/components/ui/manga-image';
import { Book, BookOpen, Clock, Star, TrendingUp, Pause, List, Plus, ArrowRight, Bell, X, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  isLoading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useStats();
  const { data: lists = [], isLoading: listsLoading } = useLists();
  const { data: triggeredReminders = [], isLoading: remindersLoading } = useTriggeredReminders();
  const dismissReminder = useDismissReminder();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your manga collection
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Mangas"
          value={stats?.total ?? 0}
          icon={Book}
          isLoading={isLoading}
        />
        <StatCard
          title="Reading"
          value={stats?.byStatus.reading ?? 0}
          icon={BookOpen}
          isLoading={isLoading}
        />
        <StatCard
          title="Completed"
          value={stats?.byStatus.completed ?? 0}
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <StatCard
          title="Plan to Read"
          value={stats?.byStatus.planToRead ?? 0}
          icon={Clock}
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Average Rating"
          value={stats?.averageRating?.toFixed(2) ?? 'N/A'}
          icon={Star}
          description={`Based on ${stats?.mangasWithRating ?? 0} rated mangas`}
          isLoading={isLoading}
        />
        <StatCard
          title="Chapters Read"
          value={stats?.totalChaptersRead?.toLocaleString() ?? 0}
          icon={BookOpen}
          description="Total chapters read across all mangas"
          isLoading={isLoading}
        />
        <StatCard
          title="Paused"
          value={(stats?.byStatus.paused ?? 0) + (stats?.byStatus.dropped ?? 0)}
          icon={Pause}
          description={`${stats?.byStatus.paused ?? 0} paused, ${stats?.byStatus.dropped ?? 0} dropped`}
          isLoading={isLoading}
        />
      </div>

      {/* Triggered Reminders Section */}
      {triggeredReminders.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-500" />
            <h2 className="text-xl font-semibold">Lembretes</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {triggeredReminders.map((reminder) => (
              <Card key={reminder.id} className="overflow-hidden border-yellow-500/50 bg-yellow-500/5">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {reminder.manga && (
                      <Link to={`/mangas/${reminder.manga.id}`} className="shrink-0">
                        <div className="relative w-12 h-16 rounded overflow-hidden bg-muted">
                          <MangaImage
                            src={reminder.manga.imageUrl}
                            filename={reminder.manga.imageFilename}
                            alt={reminder.manga.primaryTitle}
                          />
                        </div>
                      </Link>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          {reminder.manga && (
                            <Link to={`/mangas/${reminder.manga.id}`}>
                              <h3 className="font-medium truncate hover:text-primary transition-colors">
                                {reminder.manga.primaryTitle}
                              </h3>
                            </Link>
                          )}
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            {reminder.isRecurring && <RefreshCw className="h-3 w-3" />}
                            {reminder.message || (reminder.reminderType === 'update' ? 'Verificar atualizações' : 'Continuar leitura')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(reminder.scheduledFor), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => dismissReminder.mutate(reminder.id)}
                          disabled={dismissReminder.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Reading Lists Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Reading Lists</h2>
            <p className="text-sm text-muted-foreground">
              Your custom manga collections
            </p>
          </div>
          <Link to="/lists">
            <Button variant="outline" size="sm" className="gap-2">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {listsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-16" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : lists.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <List className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="font-medium mb-1">No lists yet</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Create reading lists to organize your manga
              </p>
              <Link to="/lists">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create List
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {lists.slice(0, 4).map((list) => (
              <Link key={list.id} to={`/lists/${list.id}`}>
                <Card className="group cursor-pointer hover:border-primary/50 transition-colors overflow-hidden">
                  <div
                    className="h-1"
                    style={{ backgroundColor: list.color || '#3b82f6' }}
                  />
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: (list.color || '#3b82f6') + '20' }}
                      >
                        <List
                          className="h-4 w-4"
                          style={{ color: list.color || '#3b82f6' }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base truncate group-hover:text-primary transition-colors">
                          {list.name}
                        </CardTitle>
                        <CardDescription>
                          {list.mangaCount} manga{list.mangaCount !== 1 ? 's' : ''}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
