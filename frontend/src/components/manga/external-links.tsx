import { ExternalLink, Copy, Star, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface LinkItem {
  id: string;
  url: string;
  label?: string | null;
  isPrimary?: boolean;
  isActive?: boolean;
  site?: {
    id: string;
    name: string;
    url: string;
    image: string;
  } | null;
}

interface ExternalLinksProps {
  links: LinkItem[];
}

function getSiteFavicon(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return '';
  }
}

export function ExternalLinks({ links }: ExternalLinksProps) {
  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('URL copied to clipboard');
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  if (!links || links.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No external links</p>
      </div>
    );
  }

  // Sort: primary first, then by site name
  const sortedLinks = [...links].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    const nameA = a.site?.name || a.label || '';
    const nameB = b.site?.name || b.label || '';
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="space-y-2">
      {sortedLinks.map((link) => {
        const siteName = link.site?.name || link.label || 'Link';
        const favicon = link.site?.image || getSiteFavicon(link.url);

        return (
          <div
            key={link.id}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
          >
            {/* Favicon */}
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {favicon ? (
                <img
                  src={favicon}
                  alt={siteName}
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('fallback');
                  }}
                />
              ) : (
                <Globe className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            {/* Site Name */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{siteName}</span>
                {link.isPrimary && (
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Primary
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{link.url}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleCopyUrl(link.url)}
                title="Copy URL"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                asChild
              >
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
