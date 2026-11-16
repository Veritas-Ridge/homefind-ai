import { getServiceClient, getUser, isAdminProfile, corsHeaders, jsonResponse } from '../_shared/supabaseAdmin.ts';
import { SPARK_RESO_BASE, sparkFetch } from '../_shared/spark.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    // Admin only
    const user = await getUser(req);
    if (!user || !isAdminProfile(user)) {
      return jsonResponse({ error: 'Admin access required' }, 403);
    }

    // Our key is a Spark bearer-token replication key. Per Spark docs it only
    // works on replication.sparkapi.com, so test the exact endpoint the syncs use.
    const sparkAccessToken = Deno.env.get('SPARK_OAUTH_ACCESS_TOKEN') ||
                             Deno.env.get('SPARK_ACCESS_TOKEN');

    if (!sparkAccessToken) {
      return jsonResponse({
        configured: false,
        connection_successful: false,
        status: 'No Spark access token configured (SPARK_OAUTH_ACCESS_TOKEN)',
        listings_available: false,
        sample_listing: null,
      });
    }

    try {
      const url = `${SPARK_RESO_BASE}/Property?$top=1&$count=true` +
        `&$select=ListingKey,ListingId,StandardStatus,ListPrice,City,ModificationTimestamp` +
        `&$filter=${encodeURIComponent("StandardStatus eq 'Active'")}`;
      const testResponse = await sparkFetch(url, sparkAccessToken, { retries: 0 });

      if (!testResponse.ok) {
        const detail = (await testResponse.text()).slice(0, 300);
        return jsonResponse({
          configured: true,
          connection_successful: false,
          status: testResponse.status === 429
            ? 'Rate limited by Spark (HTTP 429). Try again in a few minutes.'
            : `Connection failed with status ${testResponse.status}`,
          detail,
          listings_available: false,
          sample_listing: null,
        });
      }

      const data = await testResponse.json();
      const listings = data.value || [];
      const sampleListing = listings.length > 0 ? listings[0] : null;

      return jsonResponse({
        configured: true,
        connection_successful: true,
        status: 'Connected successfully',
        endpoint: SPARK_RESO_BASE,
        active_listing_count: data['@odata.count'] ?? null,
        listings_available: listings.length > 0,
        sample_listing: sampleListing,
      });
    } catch (fetchError) {
      return jsonResponse({
        configured: true,
        connection_successful: false,
        status: `Connection error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
        listings_available: false,
        sample_listing: null,
      });
    }
  } catch (error) {
    console.error('Error in testSparkApiConnection:', error);
    return jsonResponse(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      500
    );
  }
});
