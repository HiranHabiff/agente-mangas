'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useStats } from '@/hooks/use-mangas';
import { Book, BookOpen, Clock, Star, TrendingUp, Pause } from 'lucide-react';

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
    </div>
  );
}
