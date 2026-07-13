import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Info,
  X,
  Search,
  Wrench,
  Save,
  Download,
  Upload,
  Lock,
  RotateCcw,
  Plus,
  Copy,
  Trash2,
} from "lucide-react";
import { PANORAMAS, getPanorama, type Hotspot, type HotspotIcon } from "@/data/panoramas";
import { PanoramaViewer, PANO_OPTIONS, HOTSPOT_ICONS } from "@/components/PanoramaViewer";
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

const DEFAULT_HOTSPOT: Omit<Hotspot, "targetId" | "yaw" | "pitch"> = {
  arrow: "up",
  icon: "arrow",
  size: 54,
  background: "#1e5fbf",
  textColor: "#ffffff",
  borderColor: "rgba(255,255,255,0.95)",
  borderWidth: 3,
  opacity: 1,
  style: "circle",
  display: "iconText",
  animation: "bob",
  glow: false,
  shadow: true,
  visible: true,
  enabled: true,
};

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
  const [addMode, setAddMode] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const skipPush = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const lastActive = useRef(activeId);
  useEffect(() => {
    if (lastActive.current !== activeId) {
      if (skipPush.current) skipPush.current = false;
      else setHistory((h) => [...h, lastActive.current]);
      lastActive.current = activeId;
      setSelectedIdx(null);
    }
  }, [activeId]);

  // Turning edit mode off = lock
  useEffect(() => {
    if (!editMode) {
      setAddMode(false);
      setSelectedIdx(null);
    }
  }, [editMode]);

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

  const patchSelected = (patch: Partial<Hotspot>) => {
    if (selectedIdx == null) return;
    const next = currentHotspots.slice();
    next[selectedIdx] = { ...next[selectedIdx], ...patch };
    updateHotspots(next);
  };

  const handleDelete = (idx: number) => {
    updateHotspots(currentHotspots.filter((_, i) => i !== idx));
    setCtxMenu(null);
    setConfirmDelete(null);
    if (selectedIdx === idx) setSelectedIdx(null);
  };
  const handleDuplicate = (idx: number) => {
    const h = currentHotspots[idx];
    const dup: Hotspot = { ...h, yaw: (h.yaw + 8) % 360 };
    updateHotspots([...currentHotspots, dup]);
    setCtxMenu(null);
    setSelectedIdx(currentHotspots.length);
  };

  const handleAddAt = (yaw: number, pitch: number) => {
    const fresh: Hotspot = {
      ...DEFAULT_HOTSPOT,
      targetId: PANO_OPTIONS[0].id,
      yaw: Number(yaw.toFixed(2)),
      pitch: Number(pitch.toFixed(2)),
      label: "New Hotspot",
    };
    updateHotspots([...currentHotspots, fresh]);
    setSelectedIdx(currentHotspots.length);
    setAddMode(false);
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

  const selected = selectedIdx != null ? currentHotspots[selectedIdx] : null;

  return (
    <div className="relative pt-24">
      <div className="mx-auto max-w-[1600px] px-4 pb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary">Now viewing</p>
            <h1 className="font-display text-3xl font-bold text-primary md:text-4xl">{active.title}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setEditMode(!editMode)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow ${
                editMode ? "bg-orange-500 text-white" : "bg-primary text-white hover:bg-primary/90"
              }`}
            >
              {editMode ? <Lock className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
              {editMode ? "Lock Hotspots" : "Edit Hotspots"}
            </button>
            {editMode && (
              <button
                onClick={() => setAddMode((v) => !v)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow ${
                  addMode ? "bg-emerald-500 text-white" : "bg-accent text-white hover:bg-accent/90"
                }`}
              >
                <Plus className="h-4 w-4" />
                {addMode ? "Click on Panorama…" : "Add Hotspot"}
              </button>
            )}
            <button
              onClick={save}
              disabled={!dirty}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-40"
            >
              <Save className="h-4 w-4" /> Save{dirty ? " *" : ""}
            </button>
            <button
              onClick={() => resetPanorama(activeId)}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-primary ring-1 ring-border hover:bg-white/20"
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
              addMode={addMode}
              selectedIndex={selectedIdx}
              onNavigate={go}
              onHotspotsChange={updateHotspots}
              onAddRequest={handleAddAt}
              onSelect={setSelectedIdx}
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
            {mapOpen && !(editMode && selected) && (
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
                className="fixed z-40 w-52 overflow-hidden rounded-xl border border-border bg-card text-sm shadow-xl"
                style={{ left: ctxMenu.x, top: ctxMenu.y }}
              >
                {[
                  {
                    label: "Edit Properties",
                    fn: () => {
                      setSelectedIdx(ctxMenu.index);
                      setCtxMenu(null);
                    },
                  },
                  { label: "Duplicate", fn: () => handleDuplicate(ctxMenu.index) },
                  {
                    label: "Delete",
                    fn: () => {
                      setConfirmDelete(ctxMenu.index);
                      setCtxMenu(null);
                    },
                    danger: true,
                  },
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

          {/* Properties panel */}
          <AnimatePresence>
            {editMode && selected && (
              <PropertiesPanel
                key={selectedIdx}
                hotspot={selected}
                onChange={patchSelected}
                onClose={() => setSelectedIdx(null)}
                onDuplicate={() => handleDuplicate(selectedIdx!)}
                onDelete={() => setConfirmDelete(selectedIdx!)}
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

          {/* Delete confirmation */}
          <AnimatePresence>
            {confirmDelete != null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
                onClick={() => setConfirmDelete(null)}
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-sm rounded-2xl bg-card p-6 text-foreground shadow-elegant"
                >
                  <h3 className="font-display text-lg font-bold text-primary">Delete this hotspot?</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This removes it from the panorama. You can undo by pressing Reset before saving.
                  </p>
                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="rounded-full bg-muted px-4 py-2 text-sm font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(confirmDelete)}
                      className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              </motion.div>
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

/** Slide-out live-editing panel for the currently selected hotspot. */
function PropertiesPanel({
  hotspot,
  onChange,
  onClose,
  onDuplicate,
  onDelete,
}: {
  hotspot: Hotspot;
  onChange: (patch: Partial<Hotspot>) => void;
  onClose: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const set = <K extends keyof Hotspot>(k: K, v: Hotspot[K]) => onChange({ [k]: v } as Partial<Hotspot>);
  const sizePresets: { label: string; value: number }[] = [
    { label: "S", value: 40 },
    { label: "M", value: 54 },
    { label: "L", value: 72 },
    { label: "XL", value: 96 },
  ];

  return (
    <motion.aside
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="absolute inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col overflow-y-auto border-l border-border bg-card/95 backdrop-blur-xl shadow-elegant"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">Selected</p>
          <h3 className="font-display text-base font-bold text-primary">Hotspot Properties</h3>
        </div>
        <button
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-full bg-muted hover:bg-primary hover:text-primary-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-5 p-4 text-sm">
        <Field label="Name">
          <input
            value={hotspot.label ?? ""}
            placeholder="e.g. Engineering Block"
            onChange={(e) => set("label", e.target.value || undefined)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </Field>

        <Field label="Target Panorama">
          <select
            value={hotspot.targetId}
            onChange={(e) => set("targetId", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          >
            {PANO_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Description / Tooltip">
          <textarea
            rows={2}
            value={hotspot.tooltip ?? ""}
            onChange={(e) => set("tooltip", e.target.value || undefined)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </Field>

        <Field label="Icon">
          <div className="grid grid-cols-6 gap-1.5">
            {HOTSPOT_ICONS.map((ic) => (
              <button
                key={ic.key}
                onClick={() => set("icon", ic.key as HotspotIcon)}
                title={ic.label}
                className={`grid aspect-square place-items-center rounded-lg border text-lg transition ${
                  hotspot.icon === ic.key
                    ? "border-accent bg-accent/10"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                {ic.glyph}
              </button>
            ))}
          </div>
          {hotspot.icon === "arrow" && (
            <select
              value={hotspot.arrow ?? "up"}
              onChange={(e) => set("arrow", e.target.value as Hotspot["arrow"])}
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2"
            >
              <option value="up">↑ Up</option>
              <option value="right">→ Right</option>
              <option value="down">↓ Down</option>
              <option value="left">← Left</option>
            </select>
          )}
        </Field>

        <Field label="Button Style">
          <div className="grid grid-cols-3 gap-1.5">
            {(["circle", "rounded", "pill", "glass", "floating"] as const).map((s) => (
              <button
                key={s}
                onClick={() => set("style", s)}
                className={`rounded-lg border px-2 py-1.5 text-xs font-semibold capitalize ${
                  (hotspot.style ?? "circle") === s
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-background"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Display">
          <div className="grid grid-cols-3 gap-1.5">
            {(["icon", "iconText", "text"] as const).map((d) => (
              <button
                key={d}
                onClick={() => set("display", d)}
                className={`rounded-lg border px-2 py-1.5 text-xs font-semibold ${
                  (hotspot.display ?? "iconText") === d
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-background"
                }`}
              >
                {d === "iconText" ? "Icon + Text" : d === "icon" ? "Icon Only" : "Text Only"}
              </button>
            ))}
          </div>
        </Field>

        <Field label={`Size (${hotspot.size ?? 54}px)`}>
          <div className="mb-2 flex gap-1.5">
            {sizePresets.map((p) => (
              <button
                key={p.label}
                onClick={() => set("size", p.value)}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold ${
                  (hotspot.size ?? 54) === p.value
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-background"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={24}
            max={140}
            step={2}
            value={hotspot.size ?? 54}
            onChange={(e) => set("size", Number(e.target.value))}
            className="w-full"
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <ColorField label="Background" value={hotspot.background ?? "#1e5fbf"} onChange={(v) => set("background", v)} />
          <ColorField label="Text" value={hotspot.textColor ?? "#ffffff"} onChange={(v) => set("textColor", v)} />
          <ColorField
            label="Border"
            value={hexOrDefault(hotspot.borderColor, "#ffffff")}
            onChange={(v) => set("borderColor", v)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={`Border Width (${hotspot.borderWidth ?? 3}px)`}>
            <input
              type="range"
              min={0}
              max={10}
              value={hotspot.borderWidth ?? 3}
              onChange={(e) => set("borderWidth", Number(e.target.value))}
              className="w-full"
            />
          </Field>
          <Field label={`Opacity (${Math.round((hotspot.opacity ?? 1) * 100)}%)`}>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round((hotspot.opacity ?? 1) * 100)}
              onChange={(e) => set("opacity", Number(e.target.value) / 100)}
              className="w-full"
            />
          </Field>
        </div>

        <Field label="Animation">
          <select
            value={hotspot.animation ?? "bob"}
            onChange={(e) => set("animation", e.target.value as Hotspot["animation"])}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          >
            <option value="none">None</option>
            <option value="bob">Bob</option>
            <option value="pulse">Pulse</option>
            <option value="spin">Spin</option>
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Toggle label="Shadow" value={hotspot.shadow !== false} onChange={(v) => set("shadow", v)} />
          <Toggle label="Glow" value={!!hotspot.glow} onChange={(v) => set("glow", v)} />
          <Toggle label="Visible" value={hotspot.visible !== false} onChange={(v) => set("visible", v)} />
          <Toggle label="Enabled" value={hotspot.enabled !== false} onChange={(v) => set("enabled", v)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Yaw°">
            <input
              type="number"
              step={0.1}
              value={hotspot.yaw}
              onChange={(e) => set("yaw", Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </Field>
          <Field label="Pitch°">
            <input
              type="number"
              step={0.1}
              value={hotspot.pitch}
              onChange={(e) => set("pitch", Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </Field>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onDuplicate}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Copy className="h-4 w-4" /> Duplicate
          </button>
          <button
            onClick={onDelete}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-3 py-2 text-sm font-semibold text-white"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>
    </motion.aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-8 shrink-0 cursor-pointer rounded border border-border bg-transparent"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-xs focus:outline-none"
        />
      </div>
    </label>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold transition ${
        value ? "border-accent bg-accent/10 text-accent" : "border-border bg-background text-muted-foreground"
      }`}
    >
      <span>{label}</span>
      <span
        className={`grid h-4 w-7 items-center rounded-full px-0.5 ${value ? "bg-accent" : "bg-muted"}`}
      >
        <span
          className={`h-3 w-3 rounded-full bg-white transition ${value ? "translate-x-3" : "translate-x-0"}`}
        />
      </span>
    </button>
  );
}

function hexOrDefault(v: string | undefined, d: string) {
  if (!v) return d;
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : d;
}
