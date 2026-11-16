import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { invokeFunction } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Webhook, Loader2, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Connection health for the FUB integration and the webhooks that keep agent,
// stage and tags in sync. Backed by the fubWebhooks edge function.
export default function FollowUpBossWebhooks() {
  const [registering, setRegistering] = useState(false);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['fubWebhookStatus'],
    queryFn: () => invokeFunction('fubWebhooks', { action: 'status' }),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const register = async () => {
    setRegistering(true);
    try {
      const res = await invokeFunction('fubWebhooks', { action: 'register' });
      if (res?.ok) toast.success('Webhooks are active');
      else toast.error(res?.problems?.[0] || 'Some webhooks could not be registered');
      await refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to register webhooks');
    } finally {
      setRegistering(false);
    }
  };

  const ours = Array.isArray(data?.webhooks) ? data.webhooks.filter((w) => w.ours) : [];
  const activeEvents = new Set(ours.filter((w) => w.status === 'Active').map((w) => w.event));
  const allActive = (data?.events ?? []).every((e) => activeEvents.has(e));

  const Row = ({ ok, label, detail }) => (
    <div className="flex items-start gap-2 text-sm">
      {ok ? <Check className="h-4 w-4 text-green-600 mt-0.5" /> : <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />}
      <div>
        <span className="text-slate-900">{label}</span>
        {detail && <span className="text-slate-500"> · {detail}</span>}
      </div>
    </div>
  );

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Follow Up Boss Webhooks
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Checking…</div>
        ) : data?.error ? (
          <p className="text-sm text-red-600">{data.error}</p>
        ) : (
          <>
            <div className="space-y-2">
              <Row ok={data?.apiKeyConfigured && data?.account} label="API key" detail={data?.apiKeyUser ? `${data.apiKeyUser.name} (${data?.apiKeyRole ?? 'unknown role'})` : 'not working'} />
              <Row ok={data?.apiKeyIsOwner} label="Key belongs to the account owner" detail={data?.apiKeyIsOwner ? null : 'required for webhooks'} />
              <Row ok={data?.systemKeyValid} label={`Registered system "${data?.system}"`} detail={data?.systemKeyValid ? 'verified' : 'X-System-Key missing or not accepted'} />
              <Row ok={allActive} label="Webhooks" detail={allActive ? 'contact changes sync automatically' : 'not set up'} />
            </div>

            {(data?.events ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.events.map((e) => (
                  <Badge key={e} variant={activeEvents.has(e) ? 'default' : 'outline'}>{e}</Badge>
                ))}
              </div>
            )}

            {data?.problems?.length > 0 && (
              <ul className="text-sm text-amber-700 list-disc pl-5 space-y-1">
                {data.problems.map((p) => <li key={p}>{p}</li>)}
              </ul>
            )}

            {!allActive && (
              <Button onClick={register} disabled={registering || !data?.ready}>
                {registering ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Webhook className="h-4 w-4 mr-2" />}
                Register webhooks
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
