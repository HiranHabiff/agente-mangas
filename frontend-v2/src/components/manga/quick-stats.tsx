'use client';

import { BookOpen, Calendar, Clock, RefreshCw } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface QuickStatsProps {
  lastChapterRead?: number | null;
  totalChapters?: number | null;
  createdAt: string;
  updatedAt: string;
  lastReadAt?: string | null;
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
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
  } catch {
    return dateString;
  }
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  tooltip?: string;
}

function StatItem({ icon, label, value, tooltip }: StatItemProps) {
  const content = (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-default">{content}</div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export function QuickStats({
  lastChapterRead,
  totalChapters,
  createdAt,
  updatedAt,
  lastReadAt,
}: QuickStatsProps) {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg border">
        <StatItem
          icon={<BookOpen className="h-4 w-4" />}
          label="Chapters"
          value={`${lastChapterRead || 0}${totalChapters ? ` / ${totalChapters}` : ''}`}
        />

        {lastReadAt && (
          <StatItem
            icon={<Clock className="h-4 w-4" />}
            label="Last read"
            value={formatRelativeDate(lastReadAt)}
            tooltip={formatFullDate(lastReadAt)}
          />
        )}

        <StatItem
          icon={<Calendar className="h-4 w-4" />}
          label="Added"
          value={formatRelativeDate(createdAt)}
          tooltip={formatFullDate(createdAt)}
        />

        <StatItem
          icon={<RefreshCw className="h-4 w-4" />}
          label="Updated"
          value={formatRelativeDate(updatedAt)}
          tooltip={formatFullDate(updatedAt)}
        />
      </div>
    </TooltipProvider>
  );
}
