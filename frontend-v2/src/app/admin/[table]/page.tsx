'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, defaultColumns } from '@/components/admin';
import { EditDialog } from '@/components/admin';
import {
  useAdminItems,
  useCreateAdminItem,
  useUpdateAdminItem,
  useDeleteAdminItem,
} from '@/hooks/use-admin';
import type { Tag } from '@/types/manga';

const tableNames: Record<string, string> = {
  genres: 'Genres',
  themes: 'Themes',
  tags: 'Tags',
  status: 'Status',
  types: 'Types',
  ratings: 'Ratings',
  demographics: 'Demographics',
  sites: 'Sites',
  warnings: 'Warnings',
  characters: 'Characters',
};

export default function AdminTablePage() {
  const params = useParams();
  const router = useRouter();
  const table = params.table as string;

  const [editItem, setEditItem] = useState<Tag | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading } = useAdminItems(table);
  const createMutation = useCreateAdminItem(table);
  const updateMutation = useUpdateAdminItem(table);
  const deleteMutation = useDeleteAdminItem(table);

  const handleAdd = () => {
    setEditItem(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: Tag) => {
    setEditItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (item: Tag) => {
    try {
      await deleteMutation.mutateAsync(item.id);
    } catch (error: any) {
      alert(error.message || 'Failed to delete');
    }
  };

  const handleSave = async (data: Partial<Tag>) => {
    try {
      if (editItem) {
        await updateMutation.mutateAsync({ id: editItem.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      alert(error.message || 'Failed to save');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {tableNames[table] || table}
          </h1>
          <p className="text-muted-foreground">
            Manage {tableNames[table]?.toLowerCase() || table}
          </p>
        </div>
      </div>

      <DataTable
        title={tableNames[table] || table}
        data={data || []}
        columns={defaultColumns}
        isLoading={isLoading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <EditDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        item={editItem}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
