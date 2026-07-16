-- Restrict hotspot_overrides writes to service_role only; keep public read.
DROP POLICY IF EXISTS "Public can insert hotspot overrides" ON public.hotspot_overrides;
DROP POLICY IF EXISTS "Public can update hotspot overrides" ON public.hotspot_overrides;
DROP POLICY IF EXISTS "Public can delete hotspot overrides" ON public.hotspot_overrides;
DROP POLICY IF EXISTS "Anyone can insert hotspot overrides" ON public.hotspot_overrides;
DROP POLICY IF EXISTS "Anyone can update hotspot overrides" ON public.hotspot_overrides;
DROP POLICY IF EXISTS "Anyone can delete hotspot overrides" ON public.hotspot_overrides;
DROP POLICY IF EXISTS "Allow public insert" ON public.hotspot_overrides;
DROP POLICY IF EXISTS "Allow public update" ON public.hotspot_overrides;
DROP POLICY IF EXISTS "Allow public delete" ON public.hotspot_overrides;

-- Revoke anon/authenticated writes; service_role (server-only) retains full access.
REVOKE INSERT, UPDATE, DELETE ON public.hotspot_overrides FROM anon, authenticated;
GRANT SELECT ON public.hotspot_overrides TO anon, authenticated;
GRANT ALL ON public.hotspot_overrides TO service_role;
