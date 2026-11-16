import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, Pencil, Search as SearchIcon, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/api/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { createPageUrl } from '@/utils';
import { summarizeSearchFilters } from '@/lib/savedSearches';
import { ALERT_FREQUENCIES } from './SaveSearchDialog';

const SEARCH_SESSION_KEY = 'search_state'; // Search.jsx session state

export default function SavedSearchesList({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState('');
  // The search waiting on delete confirmation. An in-app dialog replaces
  // window.confirm, which in-app browsers and automated test browsers often
  // auto-dismiss (so the delete never ran).
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data: searches = [], isLoading } = useQuery({
    queryKey: ['savedSearches', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('id, name, filters, frequency, alerts_enabled, last_sent_at, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // Updates we've alerted on in the last 7 days, per search.
  const { data: recentCounts = {} } = useQuery({
    queryKey: ['savedSearchHits', user?.id, searches.map((s) => s.id).join(',')],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
      const { data, error } = await supabase
        .from('saved_search_hits')
        .select('saved_search_id')
        .in('saved_search_id', searches.map((s) => s.id))
        .gte('detected_at', since);
      if (error) throw error;
      return (data ?? []).reduce((acc, h) => ({ ...acc, [h.saved_search_id]: (acc[h.saved_search_id] ?? 0) + 1 }), {});
    },
    enabled: searches.length > 0,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['savedSearches', user?.id] });

  // Every write asks for the affected row back: RLS turns a blocked write into
  // "0 rows, no error", which used to report success while changing nothing.
  const update = async (id, patch, message) => {
    const { data, error } = await supabase.from('saved_searches').update(patch).eq('id', id).select('id');
    if (error || !data?.length) {
      toast({ title: "Couldn't update this search", variant: 'destructive' });
      return false;
    }
    if (message) toast({ title: message });
    refresh();
    return true;
  };

  const confirmDelete = async () => {
    const search = pendingDelete;
    if (!search) return;
    setDeleting(true);
    const { data, error } = await supabase.from('saved_searches').delete().eq('id', search.id).select('id');
    setDeleting(false);
    setPendingDelete(null);
    if (error || !data?.length) {
      toast({ title: "Couldn't delete this search", description: 'Please refresh and try again.', variant: 'destructive' });
      refresh();
      return;
    }
    queryClient.setQueryData(['savedSearches', user?.id], (prev = []) => prev.filter((x) => x.id !== search.id));
    toast({ title: 'Saved search deleted' });
    refresh();
  };

  const view = (search) => {
    try { sessionStorage.setItem(SEARCH_SESSION_KEY, JSON.stringify({ filters: search.filters, currentPage: 1 })); } catch { /* ignore */ }
    navigate(createPageUrl('Search'));
  };

  const saveName = async (id) => {
    const name = draftName.trim().slice(0, 120);
    if (name && (await update(id, { name }))) setEditingId(null);
  };

  if (isLoading || searches.length === 0) return null;

  return (
    <section className="mb-10" aria-labelledby="saved-searches-heading">
      <h2 id="saved-searches-heading" className="text-xl font-normal text-foreground mb-4 flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" aria-hidden="true" /> Saved searches
      </h2>
      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {searches.map((s) => {
          const summary = summarizeSearchFilters(s.filters);
          const recent = recentCounts[s.id] ?? 0;
          return (
            <li key={s.id} className="rounded-xl border border-border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {editingId === s.id ? (
                    <form onSubmit={(e) => { e.preventDefault(); saveName(s.id); }} className="flex gap-2">
                      <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} maxLength={120} autoFocus aria-label="Search name" />
                      <Button type="submit" size="icon" variant="brand" aria-label="Save name"><Check className="h-4 w-4" /></Button>
                      <Button type="button" size="icon" variant="ghost" aria-label="Cancel" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                    </form>
                  ) : (
                    <p className="font-medium text-foreground truncate">{s.name}</p>
                  )}
                  {summary && <p className="text-sm text-muted-foreground truncate">{summary}</p>}
                  {recent > 0 && (
                    <p className="mt-1 text-xs font-medium text-primary">{recent} update{recent === 1 ? '' : 's'} this week</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {s.alerts_enabled ? <Bell className="h-4 w-4 text-primary" aria-hidden="true" /> : <BellOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
                  <Switch
                    checked={s.alerts_enabled}
                    onCheckedChange={(on) => update(s.id, { alerts_enabled: on }, on ? 'Alerts on' : 'Alerts paused')}
                    aria-label={s.alerts_enabled ? 'Pause alerts' : 'Turn on alerts'}
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={s.frequency}
                  onChange={(e) => update(s.id, { frequency: e.target.value }, 'Alert frequency updated')}
                  disabled={!s.alerts_enabled}
                  aria-label="Alert frequency"
                  className="h-9 text-sm border border-border rounded-md px-2 bg-white text-foreground disabled:opacity-50"
                >
                  {ALERT_FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <Button size="sm" variant="brand" onClick={() => view(s)}><SearchIcon className="h-4 w-4" /> View homes</Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditingId(s.id); setDraftName(s.name); }} aria-label={`Rename ${s.name}`}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setPendingDelete(s)} aria-label={`Delete ${s.name}`} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /> Delete</Button>
              </div>
            </li>
          );
        })}
      </ul>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open && !deleting) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this saved search?</AlertDialogTitle>
            <AlertDialogDescription>
              "{pendingDelete?.name}" will be removed and its listing alerts will stop.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting…' : 'Delete search'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
