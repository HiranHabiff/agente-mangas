'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, X, Plus, ExternalLink, Star, ImageIcon, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MangaImage } from '@/components/ui/manga-image';
import { useManga, useUpdateManga, useDeleteManga, useFilterOptions, useSites, useUpdateImage } from '@/hooks/use-mangas';
import type { Tag } from '@/types/manga';

interface LinkFormData {
  url: string;
  siteId: string;
  label: string;
  isPrimary: boolean;
}

const READING_STATUS_OPTIONS = [
  { id: 'reading', name: 'Reading', color: '#3b82f6' },
  { id: 'completed', name: 'Completed', color: '#22c55e' },
  { id: 'paused', name: 'Paused', color: '#f59e0b' },
  { id: 'dropped', name: 'Dropped', color: '#ef4444' },
  { id: 'plan_to_read', name: 'Plan to Read', color: '#8b5cf6' },
];

interface PageProps {
  params: Promise<{ id: string }>;
}

interface MultiSelectProps {
  label: string;
  options: Tag[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter(
    (opt) =>
      opt.name.toLowerCase().includes(search.toLowerCase()) ||
      opt.nameEnglish?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const selectedItems = options.filter((opt) => selected.includes(opt.id));

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedItems.map((item) => (
            <Badge
              key={item.id}
              variant="secondary"
              className="gap-1 pr-1"
              style={item.color ? { backgroundColor: item.color, color: '#fff' } : undefined}
            >
              {item.name}
              <button
                type="button"
                onClick={() => toggleOption(item.id)}
                className="ml-1 hover:bg-black/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Input
        placeholder={`Search ${label.toLowerCase()}...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-2"
      />
      <div className="border rounded-md max-h-48 overflow-y-auto">
        {filteredOptions.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground text-center">No options found</p>
        ) : (
          filteredOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleOption(opt.id)}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between ${
                selected.includes(opt.id) ? 'bg-muted' : ''
              }`}
            >
              <span className="flex items-center gap-2">
                {opt.color && (
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: opt.color }}
                  />
                )}
                {opt.name}
                {opt.nameEnglish && opt.nameEnglish !== opt.name && (
                  <span className="text-muted-foreground">({opt.nameEnglish})</span>
                )}
              </span>
              {selected.includes(opt.id) && (
                <span className="text-primary">Selected</span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default function EditMangaPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: manga, isLoading } = useManga(id);
  const { data: filterOptions } = useFilterOptions();
  const { data: sites } = useSites();
  const updateManga = useUpdateManga();
  const updateImage = useUpdateImage();
  const deleteManga = useDeleteManga();

  const [imageUrl, setImageUrl] = useState('');

  const [formData, setFormData] = useState({
    primaryTitle: '',
    url: '',
    synopsis: '',
    rating: '',
    totalChapters: '',
    status: '',
    userNotes: '',
    statusId: '',
    typeId: '',
    ratingId: '',
    demographicId: '',
    genreIds: [] as string[],
    themeIds: [] as string[],
    tagIds: [] as string[],
    alternativeNames: [] as string[],
    links: [] as LinkFormData[],
  });

  const [newAltName, setNewAltName] = useState('');
  const [newLink, setNewLink] = useState<LinkFormData>({
    url: '',
    siteId: '',
    label: '',
    isPrimary: false,
  });

  useEffect(() => {
    if (manga) {
      setFormData({
        primaryTitle: manga.primaryTitle || '',
        url: manga.url || '',
        synopsis: manga.synopsis || '',
        rating: manga.rating?.toString() || '',
        totalChapters: manga.totalChapters?.toString() || '',
        status: manga.status || '',
        userNotes: manga.userNotes || '',
        statusId: manga.statusRef?.id || '',
        typeId: manga.type?.id || '',
        ratingId: manga.contentRating?.id || '',
        demographicId: manga.demographic?.id || '',
        genreIds: manga.genres?.map((g) => g.id) || [],
        themeIds: manga.themes?.map((t) => t.id) || [],
        tagIds: manga.tags?.map((t) => t.id) || [],
        alternativeNames: manga.alternativeNames?.map((n) => n.name) || [],
        links: manga.links?.map((l) => ({
          url: l.url,
          siteId: l.site?.id || '',
          label: l.label || '',
          isPrimary: l.isPrimary || false,
        })) || [],
      });
    }
  }, [manga]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: Record<string, unknown> = {
      primaryTitle: formData.primaryTitle,
    };

    if (formData.url) data.url = formData.url;
    if (formData.synopsis) data.synopsis = formData.synopsis;
    if (formData.userNotes) data.userNotes = formData.userNotes;
    if (formData.status) data.status = formData.status;
    if (formData.rating) data.rating = parseFloat(formData.rating);
    if (formData.totalChapters) data.totalChapters = parseInt(formData.totalChapters, 10);
    if (formData.statusId) data.statusId = formData.statusId;
    if (formData.typeId) data.typeId = formData.typeId;
    if (formData.ratingId) data.ratingId = formData.ratingId;
    if (formData.demographicId) data.demographicId = formData.demographicId;

    data.genreIds = formData.genreIds;
    data.themeIds = formData.themeIds;
    data.tagIds = formData.tagIds;
    data.alternativeNames = formData.alternativeNames;
    data.links = formData.links.map((l) => ({
      url: l.url,
      siteId: l.siteId || undefined,
      label: l.label || undefined,
      isPrimary: l.isPrimary,
    }));

    updateManga.mutate(
      { id, data },
      {
        onSuccess: () => {
          router.push(`/mangas/${id}`);
        },
      }
    );
  };

  const addAlternativeName = () => {
    if (newAltName.trim() && !formData.alternativeNames.includes(newAltName.trim())) {
      setFormData({
        ...formData,
        alternativeNames: [...formData.alternativeNames, newAltName.trim()],
      });
      setNewAltName('');
    }
  };

  const removeAlternativeName = (name: string) => {
    setFormData({
      ...formData,
      alternativeNames: formData.alternativeNames.filter((n) => n !== name),
    });
  };

  const addLink = () => {
    if (newLink.url.trim()) {
      setFormData({
        ...formData,
        links: [...formData.links, { ...newLink, url: newLink.url.trim() }],
      });
      setNewLink({ url: '', siteId: '', label: '', isPrimary: false });
    }
  };

  const removeLink = (index: number) => {
    setFormData({
      ...formData,
      links: formData.links.filter((_, i) => i !== index),
    });
  };

  const toggleLinkPrimary = (index: number) => {
    setFormData({
      ...formData,
      links: formData.links.map((link, i) => ({
        ...link,
        isPrimary: i === index ? !link.isPrimary : false,
      })),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="space-y-6">
        <Link href="/mangas">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to list
          </Button>
        </Link>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Manga not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/mangas/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to details
          </Button>
        </Link>
        <Button onClick={handleSubmit} disabled={updateManga.isPending}>
          {updateManga.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-6">
        {/* Sidebar with cover */}
        <div className="space-y-4">
          <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted">
            <MangaImage
              src={manga.imageUrl}
              filename={manga.imageFilename}
              alt={formData.primaryTitle}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Update Cover</Label>
            <div className="flex gap-2">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="text-sm"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!imageUrl.trim() || updateImage.isPending}
                onClick={() => {
                  if (imageUrl.trim()) {
                    updateImage.mutate({ id, imageUrl: imageUrl.trim() }, {
                      onSuccess: () => setImageUrl(''),
                    });
                  }
                }}
              >
                {updateImage.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Main form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="classification">Classification</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
              <TabsTrigger value="names">Names</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
            </TabsList>

            {/* Basic Info */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="primaryTitle">Title *</Label>
                <Input
                  id="primaryTitle"
                  value={formData.primaryTitle}
                  onChange={(e) => setFormData({ ...formData, primaryTitle: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Reading Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {READING_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          <span className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: status.color }}
                            />
                            {status.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rating">Your Rating (0-10)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalChapters">Total Chapters</Label>
                  <Input
                    id="totalChapters"
                    type="number"
                    min="0"
                    value={formData.totalChapters}
                    onChange={(e) => setFormData({ ...formData, totalChapters: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">Source URL</Label>
                  <Input
                    id="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="synopsis">Synopsis</Label>
                <Textarea
                  id="synopsis"
                  rows={5}
                  value={formData.synopsis}
                  onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userNotes">Personal Notes</Label>
                <Textarea
                  id="userNotes"
                  rows={3}
                  value={formData.userNotes}
                  onChange={(e) => setFormData({ ...formData, userNotes: e.target.value })}
                  placeholder="Your thoughts, comments, reminders..."
                />
              </div>
            </TabsContent>

            {/* Classification */}
            <TabsContent value="classification" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.typeId}
                    onValueChange={(value) => setFormData({ ...formData, typeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions?.types.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <span className="flex items-center gap-2">
                            {type.color && (
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: type.color }}
                              />
                            )}
                            {type.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Publication Status</Label>
                  <Select
                    value={formData.statusId}
                    onValueChange={(value) => setFormData({ ...formData, statusId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select publication status" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions?.status.map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          <span className="flex items-center gap-2">
                            {status.color && (
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: status.color }}
                              />
                            )}
                            {status.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Demographic</Label>
                  <Select
                    value={formData.demographicId}
                    onValueChange={(value) => setFormData({ ...formData, demographicId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select demographic" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions?.demographics.map((demo) => (
                        <SelectItem key={demo.id} value={demo.id}>
                          <span className="flex items-center gap-2">
                            {demo.color && (
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: demo.color }}
                              />
                            )}
                            {demo.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Content Rating</Label>
                  <Select
                    value={formData.ratingId}
                    onValueChange={(value) => setFormData({ ...formData, ratingId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select content rating" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions?.ratings.map((rating) => (
                        <SelectItem key={rating.id} value={rating.id}>
                          <span className="flex items-center gap-2">
                            {rating.color && (
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: rating.color }}
                              />
                            )}
                            {rating.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Tags */}
            <TabsContent value="tags" className="space-y-6 mt-4">
              {filterOptions && (
                <>
                  <MultiSelect
                    label="Genres"
                    options={filterOptions.genres}
                    selected={formData.genreIds}
                    onChange={(genreIds) => setFormData({ ...formData, genreIds })}
                  />

                  <MultiSelect
                    label="Themes"
                    options={filterOptions.themes}
                    selected={formData.themeIds}
                    onChange={(themeIds) => setFormData({ ...formData, themeIds })}
                  />

                  <MultiSelect
                    label="Tags"
                    options={filterOptions.tags}
                    selected={formData.tagIds}
                    onChange={(tagIds) => setFormData({ ...formData, tagIds })}
                  />
                </>
              )}
            </TabsContent>

            {/* Alternative Names */}
            <TabsContent value="names" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Alternative Names</Label>
                <div className="flex gap-2">
                  <Input
                    value={newAltName}
                    onChange={(e) => setNewAltName(e.target.value)}
                    placeholder="Add alternative title..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addAlternativeName();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addAlternativeName}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {formData.alternativeNames.length > 0 ? (
                <div className="space-y-2">
                  {formData.alternativeNames.map((name, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <span className="text-sm">{name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAlternativeName(name)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No alternative names added
                </p>
              )}
            </TabsContent>

            {/* Links */}
            <TabsContent value="links" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <Label>External Links</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add links to manga sources. The site will be detected automatically from the URL.
                  </p>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">URL</Label>
                    <Input
                      value={newLink.url}
                      onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                      placeholder="https://mangadex.org/title/..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addLink();
                        }
                      }}
                    />
                  </div>
                  <div className="w-40 space-y-1">
                    <Label className="text-xs text-muted-foreground">Label (optional)</Label>
                    <Input
                      value={newLink.label}
                      onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                      placeholder="e.g. English"
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={addLink}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {formData.links.length > 0 ? (
                <div className="space-y-2">
                  {formData.links.map((link, index) => {
                    const site = sites?.find((s) => s.id === link.siteId);
                    // Extrai hostname da URL para exibir quando não há site
                    let hostname = '';
                    try {
                      hostname = new URL(link.url).hostname.replace(/^www\./, '');
                    } catch {
                      hostname = link.url;
                    }
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {site?.image && (
                            <img
                              src={site.image}
                              alt={site.name}
                              className="w-5 h-5 rounded flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {link.isPrimary && (
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                              )}
                              <span className="text-sm truncate">{link.url}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{site?.name || hostname}</span>
                              {link.label && <span>• {link.label}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleLinkPrimary(index)}
                            title={link.isPrimary ? 'Remove primary' : 'Set as primary'}
                          >
                            <Star
                              className={`h-4 w-4 ${
                                link.isPrimary ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'
                              }`}
                            />
                          </Button>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-muted rounded"
                          >
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </a>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLink(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No external links added
                </p>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between pt-4 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Manga
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="sm:max-w-[400px]">
                <AlertDialogHeader className="text-left">
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Delete this manga?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the manga and its cover image. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                  <div className="relative w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-muted">
                    <MangaImage
                      src={manga?.imageUrl}
                      filename={manga?.imageFilename}
                      alt={manga?.primaryTitle || ''}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{manga?.primaryTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {manga?.lastChapterRead ? `Ch. ${manga.lastChapterRead}` : 'No progress'}
                      {manga?.totalChapters ? ` / ${manga.totalChapters}` : ''}
                    </p>
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      deleteManga.mutate(id, {
                        onSuccess: () => {
                          router.push('/mangas');
                        },
                      });
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleteManga.isPending}
                  >
                    {deleteManga.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </>
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-3">
              <Link href={`/mangas/${id}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={updateManga.isPending}>
                {updateManga.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
