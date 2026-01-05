'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FilterBar } from '@/components/filters';
import { MangaGrid } from '@/components/manga';
import { useInfiniteMangas, useFilterOptions } from '@/hooks/use-mangas';
import type { MangaFilters } from '@/types/manga';
import { Loader2 } from 'lucide-react';

const ITEMS_PER_PAGE = 24;

export default function MangasPage() {
  const [filters, setFilters] = useState<Omit<MangaFilters, 'offset'>>({
    sortBy: 'updated_at',
    sortOrder: 'desc',
    limit: ITEMS_PER_PAGE,
  });

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteMangas(filters);

  const { data: filterOptions } = useFilterOptions();

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0,
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver]);

  const allMangas = data?.pages.flatMap((page) => page.data) ?? [];
  const total = data?.pages[0]?.pagination.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mangas</h1>
        <p className="text-muted-foreground">
          Browse and filter your manga collection
        </p>
      </div>

      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        filterOptions={filterOptions}
        isLoading={isLoading}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data && (
            <>
              Showing {allMangas.length.toLocaleString()} of {total.toLocaleString()} results
            </>
          )}
        </p>
      </div>

      <MangaGrid mangas={allMangas} isLoading={isLoading} />

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="flex justify-center py-4">
        {isFetchingNextPage && (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        )}
        {!hasNextPage && allMangas.length > 0 && (
          <p className="text-sm text-muted-foreground">No more results</p>
        )}
      </div>
    </div>
  );
}
