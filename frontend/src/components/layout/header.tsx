import { Link, useLocation } from 'react-router-dom';
import { Book, LayoutDashboard, Settings, Copy, ChevronDown, Tags, Palette, Globe, AlertTriangle, Users, Star, Layers, Plus, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { AddMangaModal } from '@/components/manga/add-manga-modal';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Mangas', href: '/mangas', icon: Book },
  { name: 'Lists', href: '/lists', icon: List },
  { name: 'Duplicates', href: '/duplicates', icon: Copy },
];

const configMenuItems = [
  { name: 'Genres', href: '/admin/genres', icon: Tags },
  { name: 'Themes', href: '/admin/themes', icon: Palette },
  { name: 'Tags', href: '/admin/tags', icon: Tags },
  { name: 'Status', href: '/admin/status', icon: Layers },
  { name: 'Types', href: '/admin/types', icon: Book },
  { name: 'Ratings', href: '/admin/ratings', icon: Star },
  { name: 'Demographics', href: '/admin/demographics', icon: Users },
  { name: 'Sites', href: '/admin/sites', icon: Globe },
  { name: 'Warnings', href: '/admin/warnings', icon: AlertTriangle },
  { name: 'Characters', href: '/admin/characters', icon: Users },
];

export function Header() {
  const { pathname } = useLocation();
  const isConfigActive = pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg mr-8">
          <Book className="h-6 w-6" />
          <span>MangaTracker</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}

          {/* Config Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isConfigActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              <Settings className="h-4 w-4" />
              Configurações
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Lookup Tables</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {configMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link
                      to={item.href}
                      className={cn(
                        'flex items-center gap-2 cursor-pointer',
                        isActive && 'bg-accent'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="ml-auto">
          <AddMangaModal
            trigger={
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Manga
              </Button>
            }
          />
        </div>
      </div>
    </header>
  );
}
