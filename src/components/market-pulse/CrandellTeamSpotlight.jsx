import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';

/**
 * CrandellTeamSpotlight — focused panel showing just the Crandell team's
 * activity, rolled up from all deals where is_crandell_listing = true.
 *
 * Shows three KPIs at the top (active / pending / closed-last-12mo), then
 * a short list of the 5 most recent closed deals below.
 */

function formatCurrency(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${Math.round(n).toLocaleString()}`;
}

export default function CrandellTeamSpotlight({ deals }) {
  const stats = useMemo(() => {
    const active = deals.filter((d) => d.mls_status === 'Active').length;
    const pending = deals.filter((d) => d.mls_status === 'Pending').length;
    const oneYearAgo = new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10);
    const closed12mo = deals.filter((d) => d.mls_status === 'Closed' && d.close_date && d.close_date >= oneYearAgo);
    const closed24mo = deals.filter((d) => d.mls_status === 'Closed');
    const totalClosedValue = closed12mo.reduce((s, d) => s + (d.close_price || 0), 0);
    const medianClose = (() => {
      const prices = closed12mo.map((d) => d.close_price).filter(Boolean).sort((a, b) => a - b);
      return prices.length ? prices[Math.floor(prices.length / 2)] : null;
    })();
    const recentClosed = closed24mo
      .filter((d) => d.close_date)
      .sort((a, b) => b.close_date.localeCompare(a.close_date))
      .slice(0, 5);
    return {
      active,
      pending,
      closed12mo: closed12mo.length,
      closed24mo: closed24mo.length,
      totalClosedValue,
      medianClose,
      recentClosed,
    };
  }, [deals]);

  return (
    <Card className="bg-card shadow-sm border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Star className="h-4 w-4 text-[#4F90B5]" />
          Crandell Team Spotlight
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Top row: three mini stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted">
            <div className="text-2xl font-bold text-foreground">{stats.active}</div>
            <div className="text-xs text-muted-foreground mt-1">Active</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <div className="text-2xl font-bold text-foreground">{stats.pending}</div>
            <div className="text-xs text-muted-foreground mt-1">Pending</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-[#4F90B5]/10">
            <div className="text-2xl font-bold text-[#4F90B5]">{stats.closed12mo}</div>
            <div className="text-xs text-muted-foreground mt-1">Closed 12mo</div>
          </div>
        </div>

        {/* Middle row: totals */}
        <div className="grid grid-cols-2 gap-3 pb-4 border-b border-border">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Sold (12mo)</div>
            <div className="text-lg font-bold text-foreground">{formatCurrency(stats.totalClosedValue)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Median Sale (12mo)</div>
            <div className="text-lg font-bold text-foreground">{formatCurrency(stats.medianClose)}</div>
          </div>
        </div>

        {/* Recent deals list */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Recent Closings
          </div>
          {stats.recentClosed.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No recent closings in the 24-month window.</p>
          )}
          <div className="space-y-2">
            {stats.recentClosed.map((deal, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-sm text-foreground truncate">
                    <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{deal.unparsed_address || 'Address not available'}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 ml-4.5">
                    {deal.city} ·{' '}
                    {deal.close_date
                      ? format(parseISO(deal.close_date), 'MMM d, yyyy')
                      : '—'}
                  </div>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <div className="text-sm font-bold text-foreground tabular-nums">
                    {formatCurrency(deal.close_price)}
                  </div>
                  {deal.days_listing_to_close != null && (
                    <div className="text-xs text-muted-foreground">{deal.days_listing_to_close}d</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
