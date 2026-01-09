'use client';

import { useState } from 'react';
import { Bell, Plus, Trash2, Loader2, Calendar, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useMangaReminders, useCreateReminder, useDeleteReminder } from '@/hooks/use-reminders';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AddReminderModalProps {
  mangaId: string;
  mangaTitle: string;
  trigger?: React.ReactNode;
}

const REMINDER_TYPES = [
  { value: 'update', label: 'Verificar atualizações' },
  { value: 'read', label: 'Continuar leitura' },
  { value: 'custom', label: 'Personalizado' },
];

const QUICK_OPTIONS = [
  { label: '1 hora', hours: 1 },
  { label: '1 dia', hours: 24 },
  { label: '3 dias', hours: 72 },
  { label: '1 semana', hours: 168 },
];

export function AddReminderModal({ mangaId, mangaTitle, trigger }: AddReminderModalProps) {
  const [open, setOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [reminderType, setReminderType] = useState('update');
  const [message, setMessage] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceDays, setRecurrenceDays] = useState(7);

  const { data: reminders = [], isLoading } = useMangaReminders(mangaId);
  const createReminder = useCreateReminder();
  const deleteReminder = useDeleteReminder();

  const handleQuickReminder = async (hours: number) => {
    const date = new Date();
    date.setHours(date.getHours() + hours);

    await createReminder.mutateAsync({
      mangaId,
      reminderType: 'update',
      scheduledFor: date.toISOString(),
    });
  };

  const handleCreateReminder = async () => {
    if (!scheduledFor) return;

    await createReminder.mutateAsync({
      mangaId,
      reminderType,
      message: message || undefined,
      scheduledFor: new Date(scheduledFor).toISOString(),
      isRecurring,
      recurrenceDays: isRecurring ? recurrenceDays : undefined,
    });

    resetForm();
  };

  const handleDeleteReminder = async (id: string) => {
    await deleteReminder.mutateAsync(id);
  };

  const resetForm = () => {
    setShowCreateForm(false);
    setReminderType('update');
    setMessage('');
    setScheduledFor('');
    setIsRecurring(false);
    setRecurrenceDays(7);
  };

  const activeReminders = reminders.filter((r) => r.isActive);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Bell className="h-4 w-4" />
            Reminder
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lembretes</DialogTitle>
          <DialogDescription className="truncate">
            {mangaTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Quick Options */}
              {!showCreateForm && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Lembrete rápido</Label>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_OPTIONS.map((option) => (
                      <Button
                        key={option.label}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickReminder(option.hours)}
                        disabled={createReminder.isPending}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Reminders */}
              {activeReminders.length > 0 && !showCreateForm && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Lembretes ativos</Label>
                  <ScrollArea className="max-h-[200px]">
                    <div className="space-y-2">
                      {activeReminders.map((reminder) => (
                        <div
                          key={reminder.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                              reminder.isRecurring ? 'bg-blue-500/20' : 'bg-yellow-500/20'
                            )}>
                              {reminder.isRecurring ? (
                                <RefreshCw className="h-4 w-4 text-blue-500" />
                              ) : (
                                <Bell className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {REMINDER_TYPES.find((t) => t.value === reminder.reminderType)?.label || reminder.reminderType}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(reminder.scheduledFor), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })}
                                {reminder.isRecurring && ` (a cada ${reminder.recurrenceDays} dias)`}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                            onClick={() => handleDeleteReminder(reminder.id)}
                            disabled={deleteReminder.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Create Form */}
              {showCreateForm ? (
                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={reminderType} onValueChange={setReminderType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REMINDER_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Data e Hora</Label>
                    <Input
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                      min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                    />
                  </div>

                  {reminderType === 'custom' && (
                    <div className="space-y-2">
                      <Label>Mensagem</Label>
                      <Input
                        placeholder="Sua mensagem personalizada..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Recorrente</Label>
                      <p className="text-xs text-muted-foreground">
                        Repetir automaticamente
                      </p>
                    </div>
                    <Switch
                      checked={isRecurring}
                      onCheckedChange={setIsRecurring}
                    />
                  </div>

                  {isRecurring && (
                    <div className="space-y-2">
                      <Label>Repetir a cada (dias)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={recurrenceDays}
                        onChange={(e) => setRecurrenceDays(parseInt(e.target.value) || 7)}
                      />
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={resetForm}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleCreateReminder}
                      disabled={!scheduledFor || createReminder.isPending}
                    >
                      {createReminder.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Criar'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setShowCreateForm(true)}
                >
                  <Plus className="h-4 w-4" />
                  Criar Lembrete Personalizado
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
