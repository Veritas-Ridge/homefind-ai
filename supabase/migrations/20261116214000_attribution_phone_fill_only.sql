-- refresh_listing_attribution v2:
--  * Agent phone and email are FILL-ONLY: the Property payload's
--    ListAgentDirectPhone is a direct line the Member resource doesn't expose
--    (ARMLS Member has no MemberDirectPhone), so never replace it.
--  * Strip the country prefix ARMLS Member phones carry ("1 480-…", "01 602-…").
--  * Agent name and office name still follow Member/Office (source of truth).
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
           nullif(regexp_replace(coalesce(direct_phone, preferred_phone, mobile_phone, office_phone), '^\s*0?1[\s.-]+', ''), '') AS phone
      FROM spark_members
     WHERE member_mls_id IS NOT NULL
     ORDER BY lower(member_mls_id),
              (coalesce(member_status, '') ILIKE 'active') DESC,
              modification_timestamp DESC NULLS LAST
  ), v AS (
    SELECT p.listing_key,
           coalesce(m.full_name, p.listing_agent_name)                   AS new_name,
           coalesce(nullif(p.listing_agent_email, ''), m.email, p.listing_agent_email) AS new_email,
           coalesce(nullif(p.listing_agent_phone, ''), m.phone, p.listing_agent_phone) AS new_phone
      FROM properties p
      JOIN m ON m.mls_id = lower(p.listing_agent_mls_id)
     WHERE (p_keys IS NULL OR p.listing_key = ANY (p_keys))
  )
  UPDATE properties p
     SET listing_agent_name  = v.new_name,
         listing_agent_email = v.new_email,
         listing_agent_phone = v.new_phone
    FROM v
   WHERE v.listing_key = p.listing_key
     AND (p.listing_agent_name  IS DISTINCT FROM v.new_name
       OR p.listing_agent_email IS DISTINCT FROM v.new_email
       OR p.listing_agent_phone IS DISTINCT FROM v.new_phone);
  GET DIAGNOSTICS n_agent = ROW_COUNT;

  RETURN n_office + n_agent;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_listing_attribution(text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_listing_attribution(text[]) TO service_role;
