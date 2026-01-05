'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilterDropdown } from './filter-dropdown';
import { SortDropdown } from './sort-dropdown';
import { SearchInput } from './search-input';
import type { FilterOptions, MangaFilters } from '@/types/manga';

const STATUS_OPTIONS = [
  { id: 'reading', name: 'Reading', color: '#3b82f6' },
  { id: 'completed', name: 'Completed', color: '#22c55e' },
  { id: 'paused', name: 'Paused', color: '#f59e0b' },
  { id: 'dropped', name: 'Dropped', color: '#ef4444' },
  { id: 'plan_to_read', name: 'Plan to Read', color: '#8b5cf6' },
];

interface FilterBarProps {
  filters: MangaFilters;
  onFiltersChange: (filters: MangaFilters) => void;
  filterOptions?: FilterOptions;
  isLoading?: boolean;
}

export function FilterBar({
  filters,
  onFiltersChange,
  filterOptions,
  isLoading,
}: FilterBarProps) {
  const updateFilter = <K extends keyof MangaFilters>(key: K, value: MangaFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value, offset: 0 });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      limit: filters.limit,
    });
  };

  const hasActiveFilters =
    (filters.query?.length || 0) > 0 ||
    (filters.status?.length || 0) > 0 ||
    (filters.genres?.length || 0) > 0 ||
    (filters.themes?.length || 0) > 0 ||
    (filters.tags?.length || 0) > 0 ||
    (filters.types?.length || 0) > 0 ||
    (filters.ratings?.length || 0) > 0 ||
    (filters.demographics?.length || 0) > 0;

  const activeFilterCount =
    (filters.status?.length || 0) +
    (filters.genres?.length || 0) +
    (filters.themes?.length || 0) +
    (filters.tags?.length || 0) +
    (filters.types?.length || 0) +
    (filters.ratings?.length || 0) +
    (filters.demographics?.length || 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={filters.query || ''}
          onChange={(query) => updateFilter('query', query || undefined)}
          placeholder="Search by title..."
          className="w-full sm:w-64"
        />

        <FilterDropdown
          label="Status"
          options={STATUS_OPTIONS}
          selected={filters.status || []}
          onChange={(status) => updateFilter('status', status.length ? status : undefined)}
        />

        {filterOptions && (
          <>
            <FilterDropdown
              label="Genres"
              options={filterOptions.genres}
              selected={filters.genres || []}
              onChange={(genres) => updateFilter('genres', genres.length ? genres : undefined)}
            />

            <FilterDropdown
              label="Themes"
              options={filterOptions.themes}
              selected={filters.themes || []}
              onChange={(themes) => updateFilter('themes', themes.length ? themes : undefined)}
            />

            <FilterDropdown
              label="Tags"
              options={filterOptions.tags}
              selected={filters.tags || []}
              onChange={(tags) => updateFilter('tags', tags.length ? tags : undefined)}
            />

            <FilterDropdown
              label="Types"
              options={filterOptions.types}
              selected={filters.types || []}
              onChange={(types) => updateFilter('types', types.length ? types : undefined)}
            />

            <FilterDropdown
              label="Ratings"
              options={filterOptions.ratings}
              selected={filters.ratings || []}
              onChange={(ratings) => updateFilter('ratings', ratings.length ? ratings : undefined)}
            />

            <FilterDropdown
              label="Demographics"
              options={filterOptions.demographics}
              selected={filters.demographics || []}
              onChange={(demographics) => updateFilter('demographics', demographics.length ? demographics : undefined)}
            />
          </>
        )}

        <div className="flex-1" />

        <SortDropdown
          sortBy={filters.sortBy || 'updated_at'}
          sortOrder={filters.sortOrder || 'desc'}
          onSortChange={(sortBy, sortOrder) =>
            onFiltersChange({ ...filters, sortBy, sortOrder, offset: 0 })
          }
        />
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary">{activeFilterCount} filters</Badge>
          )}
          {filters.query && (
            <Badge variant="outline" className="gap-1">
              Search: {filters.query}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('query', undefined)}
              />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
