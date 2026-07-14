
CREATE TABLE public.hotspot_overrides (
  scene_id TEXT PRIMARY KEY,
  hotspots JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hotspot_overrides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hotspot_overrides TO authenticated;
GRANT ALL ON public.hotspot_overrides TO service_role;

ALTER TABLE public.hotspot_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read hotspot overrides"
  ON public.hotspot_overrides FOR SELECT
  USING (true);

CREATE POLICY "Anyone can upsert hotspot overrides"
  ON public.hotspot_overrides FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update hotspot overrides"
  ON public.hotspot_overrides FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete hotspot overrides"
  ON public.hotspot_overrides FOR DELETE
  USING (true);

CREATE OR REPLACE FUNCTION public.hotspot_overrides_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER hotspot_overrides_updated_at
BEFORE UPDATE ON public.hotspot_overrides
FOR EACH ROW EXECUTE FUNCTION public.hotspot_overrides_touch_updated_at();
