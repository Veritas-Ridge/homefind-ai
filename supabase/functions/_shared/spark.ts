/**
 * Shared Spark Platform client settings.
 *
 * Follows https://sparkplatform.com/docs/overview/set_up_access and the
 * replication docs it links to:
 *   - Our key is a bearer token (non-expiring access token), so there is no
 *     refresh flow: the token is sent as `Authorization: Bearer <token>`.
 *   - Replication keys MUST call replication.sparkapi.com. The same key fails
 *     against the regular sparkapi.com endpoints.
 *   - Every request should identify the client with X-SparkApi-User-Agent.
 *   - IDX keys are limited to 1,500 requests per 5 minutes. Going over returns
 *     HTTP 429, and Spark will not grant exceptions, so we back off and retry.
 */

export const SPARK_RESO_BASE = 'https://replication.sparkapi.com/Reso/OData';
export const SPARK_V1_BASE = 'https://replication.sparkapi.com/v1';
export const SPARK_USER_AGENT = 'HomeFindAI/1.0';

export function sparkToken(): string {
  const token = Deno.env.get('SPARK_OAUTH_ACCESS_TOKEN') || Deno.env.get('SPARK_ACCESS_TOKEN');
  if (!token) throw new Error('SPARK_OAUTH_ACCESS_TOKEN not set');
  return token;
}

export function sparkHeaders(token: string = sparkToken()): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'X-SparkApi-User-Agent': SPARK_USER_AGENT,
    'User-Agent': SPARK_USER_AGENT,
  };
}

/**
 * fetch() for Spark with 429 / 503 back off. Honors Retry-After when present.
 * Retries a few times with short waits so a cron run can still finish inside
 * its time budget; if Spark is still throttling, the last response is
 * returned and the caller decides whether to checkpoint and stop.
 */
export async function sparkFetch(
  url: string,
  token: string = sparkToken(),
  { retries = 3, maxWaitMs = 8_000 }: { retries?: number; maxWaitMs?: number } = {},
): Promise<Response> {
  let attempt = 0;
  while (true) {
    const res = await fetch(url, { headers: sparkHeaders(token) });
    if ((res.status !== 429 && res.status !== 503) || attempt >= retries) return res;
    const retryAfter = Number(res.headers.get('Retry-After'));
    const waitMs = Math.min(
      maxWaitMs,
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt,
    );
    await res.body?.cancel();
    console.warn(`[spark] HTTP ${res.status}, retrying in ${waitMs}ms (attempt ${attempt + 1}/${retries})`);
    await new Promise((r) => setTimeout(r, waitMs));
    attempt++;
  }
}

/** RESO StandardStatus is exactly "Active" for listings we may show on IDX. */
export function isStrictlyActive(rec: { StandardStatus?: string; MlsStatus?: string }): boolean {
  const s = (rec.StandardStatus || rec.MlsStatus || '').trim().toLowerCase();
  return s === 'active';
}
