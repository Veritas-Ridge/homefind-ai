import React, { useMemo, useState } from 'react';
import { supabase, invokeFunction } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History, CheckCircle, XCircle, Loader2, Search, Plug, AlertTriangle, RefreshCw } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

// Every Follow Up Boss write goes through the fub_events outbox, so the outbox
// IS the sync log: one row per event with its delivery result. (The old
// fub_sync_history table was never written to, hence "Total 0".)

const STATUS_STYLES = {
  sent: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  failed: 'bg-red-100 text-red-800',
  skipped: 'bg-muted text-muted-foreground',
};

function sourceLabel(payload) {
  const a = payload?.attribution;
  if (!a) return '';
  const utm = [a.utm_source, a.utm_medium, a.utm_campaign].filter(Boolean).join(' / ');
  if (utm) return utm;
  try { return a.referrer ? new URL(a.referrer).hostname : ''; } catch { return ''; }
}

function ConnectionPanel() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['fub-status'],
    queryFn: () => invokeFunction('fubStatus', {}),
    refetchInterval: 60_000,
    retry: 1,
  });

  if (isLoading) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Checking connection…</div>;
  }

  const q = data?.queue ?? {};
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className={`rounded-lg border p-4 ${data?.connected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <Plug className="h-4 w-4" aria-hidden="true" />
            {data?.connected ? 'Connected to Follow Up Boss' : 'Not connected'}
          </p>
          <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isFetching} aria-label="Recheck connection">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {data?.connected ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Account: <span className="font-medium text-foreground">{data.account?.name || 'Unnamed'}</span>
            {data.account?.id ? ` (ID ${data.account.id})` : ''}
            {data.account?.domain ? ` · ${data.account.domain}` : ''}
            {data.account?.user ? ` · key owner ${data.account.user}` : ''}
          </p>
        ) : (
          <p className="mt-1 text-sm text-red-700">{data?.connection_error || 'Unable to check the connection.'}</p>
        )}
      </div>

      <div className={`rounded-lg border p-4 ${q.worker_ok === false ? 'border-amber-300 bg-amber-50' : 'border-border bg-card'}`}>
        <p className="flex items-center gap-2 font-semibold text-foreground">
          {q.worker_ok === false ? <AlertTriangle className="h-4 w-4 text-amber-600" /> : <CheckCircle className="h-4 w-4 text-green-600" />}
          Delivery queue
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {q.pending ?? 0} waiting · {q.failed ?? 0} failed
          {q.last_sent_at ? ` · last delivered ${formatDistanceToNow(new Date(q.last_sent_at), { addSuffix: true })}` : ' · nothing delivered yet'}
        </p>
        {q.worker_ok === false && (
          <p className="mt-1 text-sm text-amber-800">
            {q.stalled} event{q.stalled === 1 ? ' has' : 's have'} waited over 10 minutes. The background sender
            (process-fub-events cron) isn't running; check the vault service_role_key secret.
          </p>
        )}
      </div>
    </div>
  );
}

export default function FollowUpBossSyncHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['fub-sync-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fub_events')
        .select('id, user_id, event_type, status, attempts, fub_status, last_error, payload, created_at, sent_at, property_id')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      const rows = data || [];
      const ids = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
      let people = {};
      if (ids.length) {
        const { data: profiles } = await supabase.from('profiles').select('id, email, full_name').in('id', ids);
        people = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
      }
      return rows.map((r) => {
        const p = people[r.user_id];
        const anon = r.payload?.person;
        return {
          ...r,
          contact_name: p?.full_name || anon?.name || '',
          contact_email: p?.email || anon?.email || '',
        };
      });
    },
    refetchInterval: 30_000,
  });

  const types = useMemo(() => [...new Set(events.map((e) => e.event_type))].sort(), [events]);

  const filtered = events.filter((e) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || e.contact_email.toLowerCase().includes(term) || e.contact_name.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchesType = typeFilter === 'all' || e.event_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: events.length,
    sent: events.filter((e) => e.status === 'sent').length,
    failed: events.filter((e) => e.status === 'failed').length,
    pending: events.filter((e) => e.status === 'pending').length,
  };

  return (
    <Card className="shadow-lg border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Follow Up Boss sync
        </CardTitle>
        <div className="mt-4">
          <ConnectionPanel />
        </div>
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <span><span className="text-muted-foreground">Total: </span><span className="font-semibold">{stats.total}</span></span>
          <span><span className="text-muted-foreground">Delivered: </span><span className="font-semibold text-green-700">{stats.sent}</span></span>
          <span><span className="text-muted-foreground">Waiting: </span><span className="font-semibold text-amber-700">{stats.pending}</span></span>
          <span><span className="text-muted-foreground">Failed: </span><span className="font-semibold text-red-600">{stats.failed}</span></span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by contact name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="sent">Delivered</SelectItem>
              <SelectItem value="pending">Waiting</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="skipped">Skipped</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-52"><SelectValue placeholder="Event type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All event types</SelectItem>
              {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">No sync events yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {format(new Date(e.created_at), 'MMM d, h:mm a')}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{e.contact_name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{e.contact_email}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {e.event_type}
                      {e.payload?.intent && <span className="text-muted-foreground"> ({e.payload.intent})</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[12rem] truncate">{sourceLabel(e.payload) || 'Direct'}</TableCell>
                    <TableCell>
                      <Badge className={`border-0 ${STATUS_STYLES[e.status] || ''}`}>
                        {e.status === 'sent' ? <CheckCircle className="h-3 w-3 mr-1" /> : e.status === 'failed' ? <XCircle className="h-3 w-3 mr-1" /> : null}
                        {e.status === 'sent' ? 'Delivered' : e.status === 'pending' ? 'Waiting' : e.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {e.status === 'sent' && e.sent_at ? format(new Date(e.sent_at), 'MMM d, h:mm a') : ''}
                        {e.fub_status ? ` · HTTP ${e.fub_status}` : ''}
                        {e.attempts > 1 ? ` · ${e.attempts} attempts` : ''}
                      </div>
                      {e.last_error && e.status !== 'sent' && (
                        <div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={e.last_error}>{e.last_error}</div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
