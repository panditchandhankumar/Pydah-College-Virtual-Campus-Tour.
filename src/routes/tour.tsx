import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Info, X, Search, Wrench, Save, Download, Upload, Lock, RotateCcw } from "lucide-react";
import { PANORAMAS, getPanorama, type Hotspot } from "@/data/panoramas";
import { PanoramaViewer, PANO_OPTIONS } from "@/components/PanoramaViewer";
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

interface CtxMenu {
  index: number;
  x: number;
  y: number;
}

function TourPage() {
  const navigate = useNavigate({ from: "/tour" });
  const { id } = Route.useSearch();
  const activeId = id && getPanorama(id) ? id : PANORAMAS[0].id;
  const basePanorama = getPanorama(activeId)!;

  const overrides = useHotspotStore((s) => s.overrides);
  const editMode = useHotspotStore((s) => s.editMode);
  const dirty = useHotspotStore((s) => s.dirty);
  const setEditMode = useHotspotStore((s) => s.setEditMode);
  const setHotspots = useHotspotStore((s) => s.setHotspots);
  const save = useHotspotStore((s) => s.save);
  const resetPanorama = useHotspotStore((s) => s.resetPanorama);
  const exportJSON = useHotspotStore((s) => s.exportJSON);
  const importJSON = useHotspotStore((s) => s.importJSON);

  const active = useMemo(() => withOverrides(basePanorama, overrides), [basePanorama, overrides]);
  const currentHotspots = active.hotspots;

  const [infoOpen, setInfoOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [editing, setEditing] = useState<{ index: number; hotspot: Hotspot } | null>(null);
  const [adding, setAdding] = useState<{ yaw: number; pitch: number } | null>(null);
  const skipPush = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

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

  const updateHotspots = (next: Hotspot[]) => setHotspots(activeId, next);

  const handleDelete = (idx: number) => {
    updateHotspots(currentHotspots.filter((_, i) => i !== idx));
    setCtxMenu(null);
  };
  const handleDuplicate = (idx: number) => {
    const h = currentHotspots[idx];
    const dup: Hotspot = { ...h, yaw: (h.yaw + 8) % 360 };
    updateHotspots([...currentHotspots, dup]);
    setCtxMenu(null);
  };
  const openEdit = (idx: number) => {
    setEditing({ index: idx, hotspot: { ...currentHotspots[idx] } });
    setCtxMenu(null);
  };

  const handleExport = () => {
    const blob = new Blob([exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pydah-hotspots.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleImport = () => fileInput.current?.click();
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    const ok = importJSON(text);
    alert(ok ? "Hotspots imported." : "Invalid JSON file.");
    e.target.value = "";
  };

  return (
    <div className="relative pt-24">
      <div className="mx-auto max-w-[1600px] px-4 pb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary">Now viewing</p>
            <h1 className="font-display text-3xl font-bold text-primary md:text-4xl">{active.title}</h1>
          </div>

          {/* Editor toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setEditMode(!editMode)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow ${
                editMode ? "bg-orange-500 text-white" : "bg-primary text-white hover:bg-primary/90"
              }`}
              title="Toggle Edit Mode"
            >
              {editMode ? <Lock className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
              {editMode ? "Lock Hotspots" : "Edit Hotspots"}
            </button>
            <button
              onClick={save}
              disabled={!dirty}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-40"
              title="Save hotspot positions"
            >
              <Save className="h-4 w-4" /> Save{dirty ? " *" : ""}
            </button>
            <button
              onClick={() => resetPanorama(activeId)}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-primary ring-1 ring-border hover:bg-white/20"
              title="Reset this panorama's hotspots to defaults"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-primary ring-1 ring-border hover:bg-white/20"
            >
              <Download className="h-4 w-4" /> Export JSON
            </button>
            <button
              onClick={handleImport}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-primary ring-1 ring-border hover:bg-white/20"
            >
              <Upload className="h-4 w-4" /> Import
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>
        </div>

        <div className="relative">
          <div className="h-[78vh] min-h-[560px] w-full">
            <PanoramaViewer
              panorama={active}
              hotspots={currentHotspots}
              editMode={editMode}
              onNavigate={go}
              onHotspotsChange={updateHotspots}
              onAddRequest={(yaw, pitch) => setAdding({ yaw, pitch })}
              onHotspotContextMenu={({ index, screenX, screenY }) =>
                setCtxMenu({ index, x: screenX, y: screenY })
              }
            />
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

          {/* Context menu */}
          {ctxMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setCtxMenu(null)} />
              <div
                className="fixed z-40 w-48 overflow-hidden rounded-xl border border-border bg-card text-sm shadow-xl"
                style={{ left: ctxMenu.x, top: ctxMenu.y }}
              >
                {[
                  { label: "Rename / Edit", fn: () => openEdit(ctxMenu.index) },
                  { label: "Duplicate", fn: () => handleDuplicate(ctxMenu.index) },
                  { label: "Delete", fn: () => handleDelete(ctxMenu.index), danger: true },
                ].map((it) => (
                  <button
                    key={it.label}
                    onClick={it.fn}
                    className={`block w-full px-4 py-2 text-left hover:bg-muted ${it.danger ? "text-red-600" : ""}`}
                  >
                    {it.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Edit / Add modal */}
          <AnimatePresence>
            {(editing || adding) && (
              <HotspotForm
                title={editing ? "Edit Hotspot" : "Add Hotspot"}
                initial={
                  editing
                    ? editing.hotspot
                    : { targetId: PANO_OPTIONS[0].id, yaw: adding!.yaw, pitch: adding!.pitch, arrow: "up" }
                }
                onCancel={() => {
                  setEditing(null);
                  setAdding(null);
                }}
                onSubmit={(h) => {
                  if (editing) {
                    const next = currentHotspots.slice();
                    next[editing.index] = h;
                    updateHotspots(next);
                    setEditing(null);
                  } else {
                    updateHotspots([...currentHotspots, h]);
                    setAdding(null);
                  }
                }}
                onDelete={
                  editing
                    ? () => {
                        handleDelete(editing.index);
                        setEditing(null);
                      }
                    : undefined
                }
              />
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

        {/* Location strip */}
        <div className="mt-6 -mx-4 overflow-x-auto px-4">
          <div className="flex gap-3">
            {PANORAMAS.map((p) => {
              const isActive = p.id === activeId;
              return (
                <button
                  key={p.id}
                  onClick={() => go(p.id)}
                  className={`group relative flex w-40 shrink-0 flex-col overflow-hidden rounded-2xl ring-1 transition ${
                    isActive ? "ring-2 ring-accent shadow-elegant" : "ring-border hover:ring-primary"
                  }`}
                >
                  <img src={p.thumbnail} alt={p.title} className="h-24 w-full object-cover" />
                  <div className="bg-card p-2 text-left">
                    <p className="truncate text-xs font-semibold text-foreground">{p.title}</p>
                    <p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">{p.category}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function HotspotForm({
  title,
  initial,
  onSubmit,
  onCancel,
  onDelete,
}: {
  title: string;
  initial: Hotspot;
  onSubmit: (h: Hotspot) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [label, setLabel] = useState(initial.label ?? "");
  const [targetId, setTargetId] = useState(initial.targetId);
  const [arrow, setArrow] = useState<Hotspot["arrow"]>(initial.arrow ?? "up");
  const [yaw, setYaw] = useState(initial.yaw);
  const [pitch, setPitch] = useState(initial.pitch);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-card p-6 text-foreground shadow-elegant"
      >
        <h3 className="mb-4 font-display text-xl font-bold text-primary">{title}</h3>
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">Name (label)</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Optional custom label"
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">Target Panorama</span>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            >
              {PANO_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">Icon / Arrow</span>
            <select
              value={arrow ?? "up"}
              onChange={(e) => setArrow(e.target.value as Hotspot["arrow"])}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            >
              {(["up", "right", "down", "left"] as const).map((a) => (
                <option key={a} value={a}>
                  ↑→↓←"[{a}]"
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">Yaw°</span>
              <input
                type="number"
                step="0.1"
                value={yaw}
                onChange={(e) => setYaw(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">Pitch°</span>
              <input
                type="number"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between gap-2">
          {onDelete ? (
            <button onClick={onDelete} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white">
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button onClick={onCancel} className="rounded-full bg-muted px-4 py-2 text-sm font-semibold">
              Cancel
            </button>
            <button
              onClick={() =>
                onSubmit({
                  targetId,
                  yaw: Number(yaw.toFixed(2)),
                  pitch: Number(pitch.toFixed(2)),
                  arrow,
                  label: label.trim() || undefined,
                })
              }
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Save
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
