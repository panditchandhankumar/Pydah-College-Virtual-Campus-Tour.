import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Info, X, Search } from "lucide-react";
import { PANORAMAS, getPanorama } from "@/data/panoramas";
import { TourViewer as PanoramaViewer } from "@/components/TourViewer";
import { MiniMap } from "@/components/MiniMap";
import { TourHUD } from "@/components/TourHUD";
import { useHotspotStore, withOverrides } from "@/lib/hotspotStore";

const search = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/tour")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Virtual Tour — PYDAH College" },
      {
        name: "description",
        content:
          "Google-Street-View-style 360° campus tour of PYDAH College. Walk between the main gate, engineering block, labs, ground and more.",
      },
    ],
  }),
  component: TourPage,
});

function TourPage() {
  const navigate = useNavigate({ from: "/tour" });
  const { id } = Route.useSearch();
  const activeId = id && getPanorama(id) ? id : PANORAMAS[0].id;
  const basePanorama = getPanorama(activeId)!;

  const overrides = useHotspotStore((s) => s.overrides);
  const active = useMemo(() => withOverrides(basePanorama, overrides), [basePanorama, overrides]);

  const [infoOpen, setInfoOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const skipPush = useRef(false);

  const lastActive = useRef(activeId);
  useEffect(() => {
    if (lastActive.current !== activeId) {
      if (skipPush.current) skipPush.current = false;
      else setHistory((h) => [...h, lastActive.current]);
      lastActive.current = activeId;
    }
  }, [activeId]);

  const go = (target: string) => navigate({ search: { id: target }, replace: true });

  const goBack = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const next = h.slice(0, -1);
      skipPush.current = true;
      go(h[h.length - 1]);
      return next;
    });
  };

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return PANORAMAS.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.facilities.some((f) => f.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [query]);

  return (
    <div className="relative pt-24">
      <div className="mx-auto max-w-[1600px] px-4 pb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary">Now viewing</p>
            <h1 className="font-display text-3xl font-bold text-primary md:text-4xl">{active.title}</h1>
          </div>
        </div>

        <div className="relative">
          <div className="h-[78vh] min-h-[560px] w-full">
            <PanoramaViewer panorama={active} hotspots={active.hotspots} onNavigate={go} />
          </div>

          {/* Search bar */}
          <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center px-4">
            <div className="pointer-events-auto flex w-full max-w-xl items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3 py-2 text-white backdrop-blur-xl">
              <Search className="h-4 w-4 shrink-0 text-accent" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search buildings, labs, departments…"
                className="w-full bg-transparent text-sm placeholder:text-white/50 focus:outline-none"
              />
              <button
                onClick={() => setInfoOpen(true)}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Information"
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
          </div>

          {results.length > 0 && (
            <div className="absolute left-1/2 top-20 z-10 w-full max-w-xl -translate-x-1/2 px-4">
              <ul className="overflow-hidden rounded-2xl border border-white/15 bg-black/70 text-white backdrop-blur-xl">
                {results.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => {
                        go(r.id);
                        setQuery("");
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-white/10"
                    >
                      <img src={r.thumbnail} alt="" className="h-9 w-9 rounded-lg object-cover" />
                      <div>
                        <p className="font-semibold">{r.title}</p>
                        <p className="text-xs text-white/60">{r.category}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <TourHUD
            active={active}
            onHome={() => go(PANORAMAS[0].id)}
            onToggleMap={() => setMapOpen((v) => !v)}
            mapOpen={mapOpen}
            onBack={goBack}
            canBack={history.length > 0}
            onNext={() => {
              const i = PANORAMAS.findIndex((p) => p.id === activeId);
              const next = PANORAMAS[(i + 1) % PANORAMAS.length];
              go(next.id);
            }}
            onToggleInfo={() => setInfoOpen((v) => !v)}
          />

          <AnimatePresence>
            {mapOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-24 right-4 z-10 w-72"
              >
                <MiniMap currentId={activeId} onSelect={go} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info side panel */}
          <AnimatePresence>
            {infoOpen && (
              <motion.aside
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
                className="absolute inset-y-0 right-0 z-20 w-full max-w-md overflow-y-auto bg-card p-6 shadow-elegant ring-1 ring-border"
              >
                <button
                  onClick={() => setInfoOpen(false)}
                  className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-muted text-foreground hover:bg-primary hover:text-primary-foreground"
                  aria-label="Close information"
                >
                  <X className="h-4 w-4" />
                </button>
                <img src={active.thumbnail} alt={active.title} className="h-40 w-full rounded-xl object-cover" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-secondary">{active.category}</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-primary">{active.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{active.description}</p>
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Facilities</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {active.facilities.map((f) => (
                      <li key={f} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
