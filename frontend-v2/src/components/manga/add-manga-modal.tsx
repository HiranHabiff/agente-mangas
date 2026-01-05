'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Loader2, ImageIcon, ExternalLink, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateManga, useFilterOptions, useSites } from '@/hooks/use-mangas';
import type { Tag } from '@/types/manga';

const READING_STATUS_OPTIONS = [
  { id: 'reading', name: 'Reading', color: '#3b82f6' },
  { id: 'completed', name: 'Completed', color: '#22c55e' },
  { id: 'paused', name: 'Paused', color: '#f59e0b' },
  { id: 'dropped', name: 'Dropped', color: '#ef4444' },
  { id: 'plan_to_read', name: 'Plan to Read', color: '#8b5cf6' },
];

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
      <div className="border rounded-md max-h-32 overflow-y-auto">
        {filteredOptions.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground text-center">No options found</p>
        ) : (
          filteredOptions.slice(0, 50).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleOption(opt.id)}
              className={`w-full px-3 py-1.5 text-left text-sm hover:bg-muted flex items-center justify-between ${
                selected.includes(opt.id) ? 'bg-muted' : ''
              }`}
            >
              <span className="flex items-center gap-2">
                {opt.color && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: opt.color }}
                  />
                )}
                {opt.name}
              </span>
              {selected.includes(opt.id) && (
                <span className="text-primary text-xs">Selected</span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

interface LinkFormData {
  url: string;
  siteId: string;
  label: string;
  isPrimary: boolean;
}

interface AddMangaModalProps {
  trigger?: React.ReactNode;
}

export function AddMangaModal({ trigger }: AddMangaModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data: filterOptions } = useFilterOptions();
  const { data: sites } = useSites();
  const createManga = useCreateManga();

  const [formData, setFormData] = useState({
    primaryTitle: '',
    imageUrl: '',
    url: '',
    synopsis: '',
    rating: '',
    totalChapters: '',
    status: 'plan_to_read',
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

  const resetForm = () => {
    setFormData({
      primaryTitle: '',
      imageUrl: '',
      url: '',
      synopsis: '',
      rating: '',
      totalChapters: '',
      status: 'plan_to_read',
      userNotes: '',
      statusId: '',
      typeId: '',
      ratingId: '',
      demographicId: '',
      genreIds: [],
      themeIds: [],
      tagIds: [],
      alternativeNames: [],
      links: [],
    });
    setNewAltName('');
    setNewLink({ url: '', siteId: '', label: '', isPrimary: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.primaryTitle.trim()) {
      toast.error('Title is required');
      return;
    }

    const data: Record<string, unknown> = {
      primaryTitle: formData.primaryTitle.trim(),
    };

    if (formData.imageUrl) data.imageUrl = formData.imageUrl;
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

    if (formData.genreIds.length > 0) data.genreIds = formData.genreIds;
    if (formData.themeIds.length > 0) data.themeIds = formData.themeIds;
    if (formData.tagIds.length > 0) data.tagIds = formData.tagIds;
    if (formData.alternativeNames.length > 0) data.alternativeNames = formData.alternativeNames;
    if (formData.links.length > 0) {
      data.links = formData.links.map((l) => ({
        url: l.url,
        siteId: l.siteId || undefined,
        label: l.label || undefined,
        isPrimary: l.isPrimary,
      }));
    }

    createManga.mutate(data as any, {
      onSuccess: (result) => {
        toast.success('Manga created successfully');
        setOpen(false);
        resetForm();
        router.push(`/mangas/${result.id}`);
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to create manga');
      },
    });
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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Manga
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Manga</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="Enter manga title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Cover Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                  {formData.imageUrl && (
                    <div className="w-10 h-14 rounded overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Reading Status</Label>
                  <Select
                    value={formData.status || undefined}
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
                  rows={4}
                  value={formData.synopsis}
                  onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                  placeholder="Enter manga synopsis..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userNotes">Personal Notes</Label>
                <Textarea
                  id="userNotes"
                  rows={2}
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
                    value={formData.typeId || undefined}
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
                    value={formData.statusId || undefined}
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
                    value={formData.demographicId || undefined}
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
                    value={formData.ratingId || undefined}
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
            <TabsContent value="tags" className="space-y-4 mt-4">
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
                <p className="text-sm text-muted-foreground text-center py-4">
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
                    Add links to manga sources.
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
                  <div className="w-32 space-y-1">
                    <Label className="text-xs text-muted-foreground">Label</Label>
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
                <p className="text-sm text-muted-foreground text-center py-4">
                  No external links added
                </p>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createManga.isPending}>
              {createManga.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Manga
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
