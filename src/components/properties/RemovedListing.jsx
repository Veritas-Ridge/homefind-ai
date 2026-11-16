import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import PropertyCard from './PropertyCard';

// Fallback market when we know nothing about the removed listing: the team's
// home turf, so a scan from an unknown sign still lands on real homes.
const DEFAULT_CITY = 'Queen Creek';
const ACTIVE = ['active', 'coming_soon'];

/**
 * Shown when a PropertyDetail link no longer resolves to an active listing.
 *
 * 1. If the same MLS number is active under a new record id (relisted or
 *    re-imported), forward there so old links and QR codes keep working.
 * 2. Otherwise show up to 6 similar active homes: same city, price within
 *    ±25%, beds within ±1, using the removed_listings tombstone. With no
 *    tombstone, show the newest homes in Queen Creek.
 */
export default function RemovedListing({ propertyId }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['removedListing', propertyId],
    queryFn: async () => {
      let { data: tomb } = propertyId
        ? await supabase
          .from('removed_listings')
          .select('id, mls_number, address, city, price, bedrooms')
          .eq('id', propertyId)
          .maybeSingle()
        : { data: null };

      // Pending / under contract rows still exist but aren't displayable.
      if (!tomb && propertyId) {
        const { data: inactive } = await supabase
          .from('properties')
          .select('id, address, city, price, bedrooms')
          .eq('id', propertyId)
          .maybeSingle();
        if (inactive) tomb = inactive;
      }

      if (tomb?.mls_number) {
        const { data: relisted } = await supabase
          .from('properties')
          .select('id')
          .eq('mls_number', tomb.mls_number)
          .in('status', ACTIVE)
          .maybeSingle();
        if (relisted?.id) return { tomb, forwardTo: relisted.id, similar: [] };
      }

      const run = (q) => q.in('status', ACTIVE).order('listing_date', { ascending: false, nullsFirst: false }).limit(6);
      let similar = [];
      if (tomb?.city) {
        let q = supabase.from('properties').select('*').ilike('city', tomb.city);
        if (tomb.price > 0) q = q.gte('price', tomb.price * 0.75).lte('price', tomb.price * 1.25);
        if (tomb.bedrooms > 0) q = q.gte('bedrooms', tomb.bedrooms - 1).lte('bedrooms', tomb.bedrooms + 1);
        const { data: rows } = await run(q);
        similar = rows ?? [];
        if (similar.length < 3) {
          const { data: wider } = await run(supabase.from('properties').select('*').ilike('city', tomb.city));
          similar = wider ?? similar;
        }
      }
      if (similar.length === 0) {
        const { data: rows } = await run(supabase.from('properties').select('*').ilike('city', DEFAULT_CITY));
        similar = rows ?? [];
      }
      return { tomb, forwardTo: null, similar };
    },
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (data?.forwardTo) navigate(`${createPageUrl('PropertyDetail')}?id=${data.forwardTo}`, { replace: true });
  }, [data?.forwardTo, navigate]);

  if (isLoading || data?.forwardTo) {
    return (
      <div className="crandell-container py-24 flex justify-center" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  const tomb = data?.tomb;
  const city = tomb?.city || DEFAULT_CITY;

  return (
    <div className="crandell-container py-12 md:py-16">
      <div className="max-w-2xl">
        <p className="crandell-eyebrow mb-3">Listing no longer available</p>
        <h1 className="font-display text-foreground mb-3">
          {tomb?.address ? `${tomb.address} is off the market` : 'This home is no longer on the market'}
        </h1>
        <p className="text-muted-foreground">
          It may have sold or been withdrawn by the seller. Here are similar homes for sale in {city} right now.
        </p>
      </div>

      {data?.similar?.length > 0 && (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.similar.map((p) => <PropertyCard key={p.id} property={p} user={user} />)}
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to={createPageUrl('Search')}>
          <Button variant="brand"><SearchIcon className="h-4 w-4" /> Search all homes</Button>
        </Link>
        <a href="tel:+14805441539">
          <Button variant="brandOutline">Call (480) 544-1539</Button>
        </a>
      </div>
    </div>
  );
}
