import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const SORT_OPTIONS = [
  { value: 'updated_at', label: 'Last Updated' },
  { value: 'last_read_at', label: 'Last Read' },
  { value: 'primary_title', label: 'Title' },
  { value: 'rating', label: 'Rating' },
  { value: 'created_at', label: 'Date Added' },
  { value: 'last_chapter_read', label: 'Chapters Read' },
];

interface SortDropdownProps {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

export function SortDropdown({ sortBy, sortOrder, onSortChange }: SortDropdownProps) {
  const currentOption = SORT_OPTIONS.find((o) => o.value === sortBy) || SORT_OPTIONS[0];

  const handleSortChange = (value: string) => {
    if (value === sortBy) {
      onSortChange(value, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(value, 'desc');
    }
  };

  const toggleOrder = () => {
    onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            {currentOption.label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {SORT_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleSortChange(option.value)}
              className={sortBy === option.value ? 'bg-accent' : ''}
            >
              {option.label}
              {sortBy === option.value && (
                <span className="ml-auto">
                  {sortOrder === 'asc' ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                </span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleOrder}>
        {sortOrder === 'asc' ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
