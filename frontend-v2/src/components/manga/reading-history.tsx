'use client';

import { BookOpen, Clock, Calendar, TrendingUp, Loader2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReadingSession {
  id: string;
  chapterNumber: number;
  startedAt: string | null;
  durationMinutes: number | null;
  notes: string | null;
  createdAt: string;
}

interface ReadingStats {
  totalSessions: number;
  totalChaptersRead: number;
  totalTimeMinutes: number;
  avgTimePerChapter: number | null;
  firstReadAt: string | null;
  lastReadAt: string | null;
}

interface ReadingHistoryProps {
  sessions: ReadingSession[];
  stats: ReadingStats;
  isLoading?: boolean;
}

function formatRelativeDate(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ptBR });
  } catch {
    return dateString;
  }
}

function formatFullDate(dateString: string): string {
  try {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return dateString;
  }
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

function StatsCard({ stats }: { stats: ReadingStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <BookOpen className="h-4 w-4" />
            Sessions
          </div>
          <p className="text-2xl font-bold mt-1">{stats.totalSessions}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <TrendingUp className="h-4 w-4" />
            Chapters
          </div>
          <p className="text-2xl font-bold mt-1">{stats.totalChaptersRead}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Clock className="h-4 w-4" />
            Total Time
          </div>
          <p className="text-2xl font-bold mt-1">
            {stats.totalTimeMinutes > 0 ? formatDuration(stats.totalTimeMinutes) : '-'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Calendar className="h-4 w-4" />
            First Read
          </div>
          <p className="text-lg font-bold mt-1">
            {stats.firstReadAt ? formatRelativeDate(stats.firstReadAt) : '-'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SessionTimeline({ sessions }: { sessions: ReadingSession[] }) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No reading sessions recorded</p>
        <p className="text-sm mt-1">Sessions will appear here when you update chapters</p>
      </div>
    );
  }

  // Agrupa sessões por data
  const groupedSessions: Record<string, ReadingSession[]> = {};
  sessions.forEach((session) => {
    const date = format(new Date(session.createdAt), 'yyyy-MM-dd');
    if (!groupedSessions[date]) {
      groupedSessions[date] = [];
    }
    groupedSessions[date].push(session);
  });

  return (
    <div className="space-y-6">
      {Object.entries(groupedSessions).map(([date, daySessions]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm text-muted-foreground font-medium">
              {format(new Date(date), "dd 'de' MMMM", { locale: ptBR })}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-2">
            {daySessions.map((session, index) => (
              <div
                key={session.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                {/* Timeline dot */}
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  {index < daySessions.length - 1 && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-px h-8 bg-border" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Ch. {session.chapterNumber}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatFullDate(session.createdAt)}
                    </span>
                  </div>
                  {session.notes && (
                    <p className="text-sm text-muted-foreground mt-1">{session.notes}</p>
                  )}
                </div>

                {/* Duration */}
                {session.durationMinutes && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDuration(session.durationMinutes)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReadingHistory({ sessions, stats, isLoading }: ReadingHistoryProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <StatsCard stats={stats} />
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Reading Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <SessionTimeline sessions={sessions} />
        </CardContent>
      </Card>
    </div>
  );
}
