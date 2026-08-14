import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Palette,
  Tag,
  Bookmark,
  Type,
  Star,
  Users,
  Globe,
  AlertTriangle,
  Swords
} from 'lucide-react';

const adminTables = [
  {
    name: 'Genres',
    href: '/admin/genres',
    description: 'Manage manga genres',
    icon: Palette,
    color: '#e91e63',
  },
  {
    name: 'Themes',
    href: '/admin/themes',
    description: 'Manage manga themes',
    icon: Bookmark,
    color: '#9c27b0',
  },
  {
    name: 'Tags',
    href: '/admin/tags',
    description: 'Manage custom tags',
    icon: Tag,
    color: '#673ab7',
  },
  {
    name: 'Status',
    href: '/admin/status',
    description: 'Publication status types',
    icon: Star,
    color: '#3f51b5',
  },
  {
    name: 'Types',
    href: '/admin/types',
    description: 'Manga types (manga, manhwa, etc)',
    icon: Type,
    color: '#2196f3',
  },
  {
    name: 'Ratings',
    href: '/admin/ratings',
    description: 'Content rating categories',
    icon: AlertTriangle,
    color: '#f44336',
  },
  {
    name: 'Demographics',
    href: '/admin/demographics',
    description: 'Target demographics (shounen, seinen, etc)',
    icon: Users,
    color: '#4caf50',
  },
  {
    name: 'Sites',
    href: '/admin/sites',
    description: 'Reading sites',
    icon: Globe,
    color: '#00bcd4',
  },
  {
    name: 'Warnings',
    href: '/admin/warnings',
    description: 'Content warnings',
    icon: AlertTriangle,
    color: '#ff9800',
  },
  {
    name: 'Characters',
    href: '/admin/characters',
    description: 'Character types',
    icon: Swords,
    color: '#795548',
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
        <p className="text-muted-foreground">
          Manage lookup tables and configurations
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {adminTables.map((table) => {
          const Icon = table.icon;
          return (
            <Link key={table.name} to={table.href}>
              <Card className="h-full hover:ring-2 hover:ring-primary transition-all cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${table.color}20` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: table.color }} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{table.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{table.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
