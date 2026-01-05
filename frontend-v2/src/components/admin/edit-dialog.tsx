'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Tag } from '@/types/manga';

interface EditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Tag | null;
  onSave: (data: Partial<Tag>) => void;
  isLoading?: boolean;
}

export function EditDialog({
  open,
  onOpenChange,
  item,
  onSave,
  isLoading,
}: EditDialogProps) {
  const [name, setName] = useState('');
  const [nameEnglish, setNameEnglish] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.name);
      setNameEnglish(item.nameEnglish || '');
      setColor(item.color || '#3b82f6');
      setDescription(item.description || '');
    } else {
      setName('');
      setNameEnglish('');
      setColor('#3b82f6');
      setDescription('');
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      nameEnglish: nameEnglish || undefined,
      color: color || undefined,
      description: description || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nameEnglish">English Name</Label>
            <Input
              id="nameEnglish"
              value={nameEnglish}
              onChange={(e) => setNameEnglish(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#3b82f6"
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name}>
              {isLoading ? 'Saving...' : item ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
