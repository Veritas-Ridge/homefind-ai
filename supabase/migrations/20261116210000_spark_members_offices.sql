-- =============================================================================
-- Spark Member + Office replication (agent and office attribution).
--
-- Spark's replication docs: agent/office details are not stored on Property
-- records, and Member/Office changes do not bump the listing's
-- ModificationTimestamp. ARMLS IDX rules require crediting the listing office,
-- so we replicate both resources (syncMembersOffices) and push the current
-- values onto `properties` with refresh_listing_attribution().
--
-- properties.listing_office_mls_id already holds the RESO ListOfficeKey, and
-- properties.listing_agent_mls_id holds ListAgentMlsId, so no new columns are
-- needed on properties.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.spark_offices (
  office_key             text PRIMARY KEY,
  office_mls_id          text,
  office_name            text,
  office_phone           text,
  office_email           text,
  office_status          text,
  modification_timestamp timestamptz,
  synced_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.spark_members (
  member_key             text PRIMARY KEY,
  member_mls_id          text,
  full_name              text,
  email                  text,
  direct_phone           text,
  preferred_phone        text,
  mobile_phone           text,
  office_phone           text,
  office_key             text,
  office_mls_id          text,
  office_name            text,
  member_status          text,
  modification_timestamp timestamptz,
  synced_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS spark_members_mls_id_lower_idx ON public.spark_members (lower(member_mls_id));
CREATE INDEX IF NOT EXISTS properties_listing_office_mls_id_idx ON public.properties (listing_office_mls_id);
CREATE INDEX IF NOT EXISTS properties_listing_agent_mls_id_lower_idx ON public.properties (lower(listing_agent_mls_id));

-- Service role only: no policies means anon/authenticated cannot read.
ALTER TABLE public.spark_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spark_members ENABLE ROW LEVEL SECURITY;

-- Copy current office + agent details onto listings. Pass listing keys to
-- limit the update (used right after a listing upsert), or NULL for all.
-- Only overwrites with non-null values, and only rows that actually change.
CREATE OR REPLACE FUNCTION public.refresh_listing_attribution(p_keys text[] DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n_office integer := 0;
  n_agent  integer := 0;
BEGIN
  UPDATE properties p
     SET listing_office_name = o.office_name,
         list_office_name    = o.office_name
    FROM spark_offices o
   WHERE o.office_key = p.listing_office_mls_id
     AND o.office_name IS NOT NULL
     AND (p.listing_office_name IS DISTINCT FROM o.office_name
          OR p.list_office_name IS DISTINCT FROM o.office_name)
     AND (p_keys IS NULL OR p.listing_key = ANY (p_keys));
  GET DIAGNOSTICS n_office = ROW_COUNT;

  WITH m AS (
    SELECT DISTINCT ON (lower(member_mls_id))
           lower(member_mls_id) AS mls_id,
           full_name,
           email,
           coalesce(direct_phone, preferred_phone, mobile_phone, office_phone) AS phone
      FROM spark_members
     WHERE member_mls_id IS NOT NULL
     ORDER BY lower(member_mls_id),
              (coalesce(member_status, '') ILIKE 'active') DESC,
              modification_timestamp DESC NULLS LAST
  )
  UPDATE properties p
     SET listing_agent_name  = coalesce(m.full_name, p.listing_agent_name),
         listing_agent_email = coalesce(m.email, p.listing_agent_email),
         listing_agent_phone = coalesce(m.phone, p.listing_agent_phone)
    FROM m
   WHERE m.mls_id = lower(p.listing_agent_mls_id)
     AND (p.listing_agent_name  IS DISTINCT FROM coalesce(m.full_name, p.listing_agent_name)
       OR p.listing_agent_email IS DISTINCT FROM coalesce(m.email, p.listing_agent_email)
       OR p.listing_agent_phone IS DISTINCT FROM coalesce(m.phone, p.listing_agent_phone))
     AND (p_keys IS NULL OR p.listing_key = ANY (p_keys));
  GET DIAGNOSTICS n_agent = ROW_COUNT;

  RETURN n_office + n_agent;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_listing_attribution(text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_listing_attribution(text[]) TO service_role;
