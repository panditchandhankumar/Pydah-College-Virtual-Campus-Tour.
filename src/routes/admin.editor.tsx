/**
 * @file /admin/editor — Professional visual hotspot editor.
 * Auth-gated by the parent /admin layout (see admin.tsx).
 *
 * Layout: [Scene Navigator | Panorama + Floating Toolbar | Right Sidebar]
 * Public /tour has NO editing UI — all edit surfaces live here.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  Download,
  Eye,
  EyeOff,
  Layers,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  MousePointer2,
} from "lucide-react";
import {
  PANORAMAS,
  getPanorama,
  type Hotspot,
  type HotspotIcon,
} from "@/data/panoramas";
import { PanoramaViewer, HOTSPOT_ICONS } from "@/components/PanoramaViewer";
import { useHotspotStore, withOverrides } from "@/lib/hotspotStore";

const search = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/admin/editor")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Hotspot Editor — PYDAH Admin" },
      { name: "description", content: "Visual hotspot editor for the campus tour." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminEditor,
});

const DEFAULT_HOTSPOT: Omit<Hotspot, "targetId" | "yaw" | "pitch"> = {
  arrow: "up",
  icon: "arrow",
  size: 54,
  background: "#5B0B5A",
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

const ARROWS: Hotspot["arrow"][] = ["up", "right", "down", "left"];
const COLORS = ["#5B0B5A", "#8B1A8A", "#1e5fbf", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#111827"];

function AdminEditor() {
  const { id } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/editor" });
  const [activeId, setActiveId] = useState(id && getPanorama(id) ? id : PANORAMAS[0].id);
  const basePanorama = getPanorama(activeId)!;

  const overrides = useHotspotStore((s) => s.overrides);
  const setHotspotsInStore = useHotspotStore((s) => s.setHotspots);
  const save = useHotspotStore((s) => s.save);
  const resetPano = useHotspotStore((s) => s.resetPanorama);
  const dirty = useHotspotStore((s) => s.dirty);
  const autosave = useHotspotStore((s) => s.autosave);
  const setAutosave = useHotspotStore((s) => s.setAutosave);
  const exportJSON = useHotspotStore((s) => s.exportJSON);
  const importJSON = useHotspotStore((s) => s.importJSON);

  const active = useMemo(() => withOverrides(basePanorama, overrides), [basePanorama, overrides]);
  const hotspots = active.hotspots;

  const [addMode, setAddMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [addPending, setAddPending] = useState<{ yaw: number; pitch: number } | null>(null);
  const [sceneQuery, setSceneQuery] = useState("");
  const [hsQuery, setHsQuery] = useState("");
  const [leftOpen, setLeftOpen] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const setHotspots = useCallback(
    (next: Hotspot[]) => setHotspotsInStore(activeId, next),
    [activeId, setHotspotsInStore],
  );

  // Reset selection when switching panoramas
  useEffect(() => {
    setSelectedIdx(null);
    setAddMode(false);
  }, [activeId]);

  // ─── Actions ─────────────────────────────────────────────────────────
  const doSave = useCallback(() => {
    save();
    toast.success("Changes saved successfully");
  }, [save]);

  const doReset = () => {
    resetPano(activeId);
    setSelectedIdx(null);
    toast("Scene reset to defaults");
  };

  const handleAddAt = (yaw: number, pitch: number) => {
    setAddPending({ yaw, pitch });
    setAddMode(false);
  };

  const commitAdd = (payload: {
    label: string;
    targetId: string;
    arrow: Hotspot["arrow"];
    icon: HotspotIcon;
    background: string;
    description?: string;
  }) => {
    if (!addPending) return;
    const fresh: Hotspot = {
      ...DEFAULT_HOTSPOT,
      targetId: payload.targetId,
      yaw: Number(addPending.yaw.toFixed(2)),
      pitch: Number(addPending.pitch.toFixed(2)),
      label: payload.label || undefined,
      arrow: payload.arrow,
      icon: payload.icon,
      background: payload.background,
      description: payload.description,
    };
    const next = [...hotspots, fresh];
    setHotspots(next);
    setSelectedIdx(next.length - 1);
    setAddPending(null);
    toast.success("Hotspot added");
  };

  const patchSelected = (patch: Partial<Hotspot>) => {
    if (selectedIdx == null) return;
    const next = hotspots.slice();
    next[selectedIdx] = { ...next[selectedIdx], ...patch };
    setHotspots(next);
  };

  const doDelete = (idx: number) => {
    setHotspots(hotspots.filter((_, i) => i !== idx));
    setSelectedIdx(null);
    setConfirmDelete(null);
    toast("Hotspot deleted");
  };

  const doDuplicate = (idx: number) => {
    const h = hotspots[idx];
    const dup: Hotspot = { ...h, yaw: (h.yaw + 8) % 360, label: h.label ? `${h.label} copy` : undefined };
    const next = [...hotspots, dup];
    setHotspots(next);
    setSelectedIdx(next.length - 1);
    toast.success("Hotspot duplicated");
  };

  const doExport = () => {
    const blob = new Blob([exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pydah-hotspots.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported hotspots.json");
  };

  const doImportClick = () => fileRef.current?.click();
  const doImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    const ok = await importJSON(text);
    toast[ok ? "success" : "error"](ok ? "Hotspots imported" : "Invalid JSON file");
    e.target.value = "";
  };

  // ─── Keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inField = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (inField) {
        if (e.key === "Escape") (e.target as HTMLElement).blur();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        doSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        if (selectedIdx != null) {
          e.preventDefault();
          doDuplicate(selectedIdx);
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIdx != null) setConfirmDelete(selectedIdx);
      } else if (e.key === "Escape") {
        setAddMode(false);
        setSelectedIdx(null);
        setAddPending(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIdx, hotspots]);

  // ─── Unsaved changes warning ─────────────────────────────────────────
  useEffect(() => {
    if (!dirty || autosave) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, autosave]);

  // ─── Scene nav ───────────────────────────────────────────────────────
  const filteredScenes = useMemo(() => {
    const q = sceneQuery.trim().toLowerCase();
    if (!q) return PANORAMAS;
    return PANORAMAS.filter(
      (p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
    );
  }, [sceneQuery]);

  const sceneIdx = PANORAMAS.findIndex((p) => p.id === activeId);
  const goScene = (id: string) => {
    setActiveId(id);
    navigate({ search: { id }, replace: true });
  };
  const prevScene = () => goScene(PANORAMAS[(sceneIdx - 1 + PANORAMAS.length) % PANORAMAS.length].id);
  const nextScene = () => goScene(PANORAMAS[(sceneIdx + 1) % PANORAMAS.length].id);

  const filteredHotspots = useMemo(() => {
    const q = hsQuery.trim().toLowerCase();
    return hotspots
      .map((h, i) => ({ h, i }))
      .filter(({ h }) => {
        if (!q) return true;
        const name = (h.label ?? getPanorama(h.targetId)?.title ?? "").toLowerCase();
        return name.includes(q);
      });
  }, [hotspots, hsQuery]);

  const selected = selectedIdx != null ? hotspots[selectedIdx] : null;
  const showAdminUI = !previewMode;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-gradient-to-br from-slate-950 via-[#1a0620] to-slate-950 text-white">
      {/* ── Top bar ── */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-white/10 bg-black/50 px-5 py-3 backdrop-blur-xl sm:flex sm:flex-wrap sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => navigate({ to: "/admin" })}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20"
            title="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-fuchsia-300">
              PYDAH · Admin CMS
            </p>
            <h1 className="truncate font-display text-lg font-bold">Hotspot Editor</h1>
          </div>
          {dirty && !autosave && (
            <span className="ml-2 shrink-0 rounded-full bg-amber-500/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
              Unsaved
            </span>
          )}
          {autosave && (
            <span className="ml-2 shrink-0 rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
              Autosaving
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs ring-1 ring-white/10 hover:bg-white/10">
            <input
              type="checkbox"
              checked={autosave}
              onChange={(e) => setAutosave(e.target.checked)}
              className="accent-fuchsia-400"
            />
            Autosave
          </label>
          <button
            onClick={() => setPreviewMode((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
              previewMode
                ? "bg-amber-400 text-black ring-amber-300"
                : "bg-white/5 text-white ring-white/10 hover:bg-white/10"
            }`}
          >
            {previewMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {previewMode ? "Exit Preview" : "Preview"}
          </button>
          <button
            onClick={doImportClick}
            className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/10 hover:bg-white/10"
          >
            <Upload className="h-3.5 w-3.5" /> Import
          </button>
          <button
            onClick={doExport}
            className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/10 hover:bg-white/10"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button
            onClick={doSave}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-fuchsia-500/30 transition hover:brightness-110"
          >
            <Save className="h-3.5 w-3.5" /> Save
          </button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={doImportFile} />
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex min-h-0 flex-1">
        {/* ── Scene Navigator (left) ── */}
        {showAdminUI && (
          <aside
            className={`relative flex flex-col border-r border-white/10 bg-black/30 backdrop-blur-xl transition-all ${
              leftOpen ? "w-64" : "w-14"
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-3">
              {leftOpen && (
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/60">
                  <Layers className="h-3.5 w-3.5" /> Scenes
                </p>
              )}
              <button
                onClick={() => setLeftOpen((v) => !v)}
                className="grid h-7 w-7 place-items-center rounded-full bg-white/5 hover:bg-white/15"
                title={leftOpen ? "Collapse" : "Expand"}
              >
                {leftOpen ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            </div>

            {leftOpen && (
              <>
                <div className="p-3">
                  <div className="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5 ring-1 ring-white/10">
                    <Search className="h-3.5 w-3.5 text-white/60" />
                    <input
                      value={sceneQuery}
                      onChange={(e) => setSceneQuery(e.target.value)}
                      placeholder="Search scenes…"
                      className="w-full bg-transparent text-xs placeholder:text-white/40 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
                  {filteredScenes.map((p) => {
                    const isActive = p.id === activeId;
                    return (
                      <button
                        key={p.id}
                        onClick={() => goScene(p.id)}
                        className={`mb-1.5 flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition ${
                          isActive
                            ? "bg-gradient-to-r from-fuchsia-500/30 to-purple-600/20 ring-1 ring-fuchsia-400/50"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <img
                          src={p.thumbnail}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold">{p.title}</p>
                          <p className="text-[10px] uppercase tracking-wider text-white/50">
                            {(overrides[p.id] ?? p.hotspots).length} hotspot(s)
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </aside>
        )}

        {/* ── Viewer ── */}
        <div className="relative flex-1">
          <PanoramaViewer
            panorama={active}
            hotspots={hotspots}
            editMode={showAdminUI}
            addMode={addMode}
            selectedIndex={selectedIdx}
            onNavigate={goScene}
            onHotspotsChange={(next) => setHotspots(next)}
            onAddRequest={handleAddAt}
            onSelect={setSelectedIdx}
          />

          {/* Scene indicator + prev/next */}
          {showAdminUI && (
            <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center px-4">
              <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-2 py-1.5 backdrop-blur-xl">
                <button
                  onClick={prevScene}
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20"
                  title="Previous scene"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <p className="px-2 text-xs font-semibold">
                  {active.title}{" "}
                  <span className="text-white/50">
                    ({sceneIdx + 1}/{PANORAMAS.length})
                  </span>
                </p>
                <button
                  onClick={nextScene}
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20"
                  title="Next scene"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Floating Toolbar */}
          {showAdminUI && (
            <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
              <div className="flex items-center gap-1 rounded-2xl border border-white/15 bg-black/70 p-1.5 shadow-2xl backdrop-blur-xl">
                <ToolBtn
                  icon={<Plus className="h-4 w-4" />}
                  label="Add Hotspot"
                  active={addMode}
                  onClick={() => setAddMode((v) => !v)}
                />
                <ToolBtn
                  icon={<MousePointer2 className="h-4 w-4" />}
                  label="Select / Move"
                  active={!addMode}
                  onClick={() => setAddMode(false)}
                />
                <div className="mx-1 h-6 w-px bg-white/15" />
                <ToolBtn
                  icon={<Copy className="h-4 w-4" />}
                  label="Duplicate"
                  disabled={selectedIdx == null}
                  onClick={() => selectedIdx != null && doDuplicate(selectedIdx)}
                />
                <ToolBtn
                  icon={<Trash2 className="h-4 w-4" />}
                  label="Delete"
                  disabled={selectedIdx == null}
                  danger
                  onClick={() => selectedIdx != null && setConfirmDelete(selectedIdx)}
                />
                <div className="mx-1 h-6 w-px bg-white/15" />
                <ToolBtn icon={<RotateCcw className="h-4 w-4" />} label="Reset Scene" onClick={doReset} />
                <ToolBtn icon={<Save className="h-4 w-4" />} label="Save" onClick={doSave} primary />
              </div>
            </div>
          )}

          {addMode && (
            <div className="pointer-events-none absolute left-1/2 top-20 z-10 -translate-x-1/2 rounded-full bg-fuchsia-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg">
              Click anywhere on the panorama to place a hotspot
            </div>
          )}
        </div>

        {/* ── Right Sidebar ── */}
        {showAdminUI && (
          <aside className="flex w-80 shrink-0 flex-col border-l border-white/10 bg-black/30 backdrop-blur-xl">
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-fuchsia-300">
                {selected ? "Hotspot Settings" : "Scene Settings"}
              </p>
              <h2 className="truncate text-sm font-bold">{selected ? selected.label ?? getPanorama(selected.targetId)?.title : active.title}</h2>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {selected ? (
                <HotspotForm
                  hotspot={selected}
                  onChange={patchSelected}
                  onDuplicate={() => selectedIdx != null && doDuplicate(selectedIdx)}
                  onDelete={() => selectedIdx != null && setConfirmDelete(selectedIdx)}
                  onDeselect={() => setSelectedIdx(null)}
                />
              ) : (
                <SceneInfo panoId={activeId} />
              )}
            </div>

            {/* Hotspot Manager */}
            <div className="border-t border-white/10">
              <div className="px-4 pt-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-fuchsia-300">
                  Hotspot Manager ({hotspots.length})
                </p>
                <div className="mb-2 flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5 ring-1 ring-white/10">
                  <Search className="h-3.5 w-3.5 text-white/60" />
                  <input
                    value={hsQuery}
                    onChange={(e) => setHsQuery(e.target.value)}
                    placeholder="Search hotspots…"
                    className="w-full bg-transparent text-xs placeholder:text-white/40 focus:outline-none"
                  />
                </div>
              </div>
              <ul className="max-h-56 overflow-y-auto px-2 pb-3">
                {filteredHotspots.length === 0 && (
                  <li className="px-2 py-4 text-center text-xs text-white/40">No hotspots yet.</li>
                )}
                {filteredHotspots.map(({ h, i }) => {
                  const target = getPanorama(h.targetId);
                  const isSel = i === selectedIdx;
                  return (
                    <li key={i}>
                      <button
                        onClick={() => setSelectedIdx(i)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition ${
                          isSel ? "bg-fuchsia-500/25 ring-1 ring-fuchsia-400/50" : "hover:bg-white/5"
                        }`}
                      >
                        <span
                          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold"
                          style={{ background: h.background ?? "#5B0B5A" }}
                        >
                          {(h.icon ?? "•").slice(0, 1).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">
                            {h.label ?? target?.title ?? "Unnamed"}
                          </span>
                          <span className="block truncate text-[10px] text-white/50">
                            → {target?.title ?? h.targetId} · {h.arrow ?? "up"}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        )}
      </div>

      {/* ── Add Hotspot Dialog ── */}
      {addPending && (
        <AddHotspotDialog
          yaw={addPending.yaw}
          pitch={addPending.pitch}
          onCancel={() => setAddPending(null)}
          onSubmit={commitAdd}
        />
      )}

      {/* ── Delete Confirm ── */}
      {confirmDelete != null && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
          >
            <h3 className="font-display text-lg font-bold text-white">Delete this hotspot?</h3>
            <p className="mt-2 text-sm text-white/70">This action can be undone by clicking Reset before saving.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={() => doDelete(confirmDelete)}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────

function ToolBtn({
  icon,
  label,
  onClick,
  active,
  disabled,
  danger,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  danger?: boolean;
  primary?: boolean;
}) {
  const base = "group relative grid h-9 w-9 place-items-center rounded-xl transition";
  const cls = disabled
    ? "text-white/30 cursor-not-allowed"
    : primary
      ? "bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30 hover:brightness-110"
      : active
        ? "bg-fuchsia-500/80 text-white"
        : danger
          ? "text-red-300 hover:bg-red-500/20"
          : "text-white/85 hover:bg-white/10";
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${cls}`} title={label} aria-label={label}>
      {icon}
      <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-0.5 text-[10px] font-semibold opacity-0 shadow group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-white/50">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-fuchsia-400 focus:outline-none";

function HotspotForm({
  hotspot,
  onChange,
  onDuplicate,
  onDelete,
  onDeselect,
}: {
  hotspot: Hotspot;
  onChange: (patch: Partial<Hotspot>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDeselect: () => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Editing selected</span>
        <button onClick={onDeselect} className="grid h-6 w-6 place-items-center rounded-full bg-white/5 hover:bg-white/15">
          <X className="h-3 w-3" />
        </button>
      </div>

      <Field label="Name / Label">
        <input
          value={hotspot.label ?? ""}
          onChange={(e) => onChange({ label: e.target.value || undefined })}
          placeholder="e.g. Admission Cell"
          className={inputCls}
        />
      </Field>

      <Field label="Target Scene">
        <select
          value={hotspot.targetId}
          onChange={(e) => onChange({ targetId: e.target.value })}
          className={inputCls}
        >
          {PANORAMAS.map((p) => (
            <option key={p.id} value={p.id} className="bg-slate-900">
              {p.title}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Arrow Direction">
        <div className="grid grid-cols-4 gap-1">
          {ARROWS.map((a) => (
            <button
              key={a}
              onClick={() => onChange({ arrow: a })}
              className={`rounded-lg px-2 py-1.5 text-xs font-semibold capitalize ring-1 transition ${
                hotspot.arrow === a
                  ? "bg-fuchsia-500 text-white ring-fuchsia-300"
                  : "bg-white/5 text-white/80 ring-white/10 hover:bg-white/10"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Icon">
        <select
          value={hotspot.icon ?? "arrow"}
          onChange={(e) => onChange({ icon: e.target.value as HotspotIcon })}
          className={inputCls}
        >
          {HOTSPOT_ICONS.map((it) => (
            <option key={it.key} value={it.key} className="bg-slate-900">
              {it.glyph}  {it.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Color">
        <div className="flex flex-wrap gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onChange({ background: c })}
              className={`h-7 w-7 rounded-full ring-2 transition ${
                hotspot.background === c ? "ring-white scale-110" : "ring-white/20"
              }`}
              style={{ background: c }}
              aria-label={c}
            />
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Yaw°">
          <input
            type="number"
            value={Math.round(hotspot.yaw)}
            onChange={(e) => onChange({ yaw: Number(e.target.value) })}
            className={inputCls}
          />
        </Field>
        <Field label="Pitch°">
          <input
            type="number"
            value={Math.round(hotspot.pitch)}
            onChange={(e) => onChange({ pitch: Number(e.target.value) })}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          value={hotspot.description ?? ""}
          onChange={(e) => onChange({ description: e.target.value || undefined })}
          rows={2}
          className={inputCls}
          placeholder="Optional context shown on hover"
        />
      </Field>

      <label className="mb-3 flex cursor-pointer items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs">
        <input
          type="checkbox"
          checked={hotspot.visible !== false}
          onChange={(e) => onChange({ visible: e.target.checked })}
          className="accent-fuchsia-400"
        />
        Visible to visitors
      </label>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onDuplicate}
          className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold ring-1 ring-white/10 hover:bg-white/10"
        >
          <Copy className="mr-1 inline h-3.5 w-3.5" /> Duplicate
        </button>
        <button
          onClick={onDelete}
          className="flex-1 rounded-lg bg-red-500/90 px-3 py-2 text-xs font-bold text-white hover:bg-red-500"
        >
          <Trash2 className="mr-1 inline h-3.5 w-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}

function SceneInfo({ panoId }: { panoId: string }) {
  const p = getPanorama(panoId)!;
  return (
    <div>
      <img src={p.thumbnail} alt="" className="mb-3 h-32 w-full rounded-xl object-cover ring-1 ring-white/10" />
      <Field label="Scene Name">
        <input value={p.title} readOnly className={inputCls + " opacity-70"} />
      </Field>
      <Field label="Category">
        <input value={p.category} readOnly className={inputCls + " opacity-70"} />
      </Field>
      <Field label="Description">
        <textarea value={p.description} readOnly rows={3} className={inputCls + " opacity-70"} />
      </Field>
      <p className="mt-4 rounded-lg bg-fuchsia-500/10 p-3 text-xs text-fuchsia-200 ring-1 ring-fuchsia-500/30">
        💡 Click a hotspot inside the panorama, or use the toolbar's <b>+</b> to add a new one. Selecting a hotspot switches this panel to its properties.
      </p>
    </div>
  );
}

function AddHotspotDialog({
  yaw,
  pitch,
  onCancel,
  onSubmit,
}: {
  yaw: number;
  pitch: number;
  onCancel: () => void;
  onSubmit: (p: {
    label: string;
    targetId: string;
    arrow: Hotspot["arrow"];
    icon: HotspotIcon;
    background: string;
    description?: string;
  }) => void;
}) {
  const [label, setLabel] = useState("");
  const [targetId, setTargetId] = useState(PANORAMAS[0].id);
  const [arrow, setArrow] = useState<Hotspot["arrow"]>("up");
  const [icon, setIcon] = useState<HotspotIcon>("arrow");
  const [background, setBackground] = useState("#5B0B5A");
  const [description, setDescription] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-[#1a0620] to-slate-900 p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-fuchsia-300">
              New Hotspot
            </p>
            <h3 className="font-display text-lg font-bold text-white">
              At yaw {Math.round(yaw)}°, pitch {Math.round(pitch)}°
            </h3>
          </div>
          <button onClick={onCancel} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20">
            <X className="h-4 w-4" />
          </button>
        </div>

        <Field label="Hotspot Name">
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Cafeteria"
            className={inputCls}
          />
        </Field>

        <Field label="Target Scene">
          <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className={inputCls}>
            {PANORAMAS.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900">
                {p.title}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Arrow">
            <select value={arrow} onChange={(e) => setArrow(e.target.value as Hotspot["arrow"])} className={inputCls}>
              {ARROWS.map((a) => (
                <option key={a} value={a} className="bg-slate-900">
                  {a}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Icon">
            <select value={icon} onChange={(e) => setIcon(e.target.value as HotspotIcon)} className={inputCls}>
              {HOTSPOT_ICONS.map((it) => (
                <option key={it.key} value={it.key} className="bg-slate-900">
                  {it.glyph} {it.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Color">
          <div className="flex flex-wrap gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setBackground(c)}
                className={`h-7 w-7 rounded-full ring-2 transition ${
                  background === c ? "ring-white scale-110" : "ring-white/20"
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </Field>

        <Field label="Description (optional)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className={inputCls}
          />
        </Field>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSubmit({
                label,
                targetId,
                arrow,
                icon,
                background,
                description: description || undefined,
              })
            }
            className="rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/30 hover:brightness-110"
          >
            <Plus className="mr-1 inline h-4 w-4" /> Add Hotspot
          </button>
        </div>
      </div>
    </div>
  );
}
