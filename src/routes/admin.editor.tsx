/**
 * @file /admin/editor — Visual hotspot editor.
 * Auth-gated by the parent /admin layout (see admin.tsx).
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { Trash2, Download, Plus, ArrowLeft, Save, RotateCcw } from "lucide-react";
import { PANORAMAS, getPanorama, type Hotspot } from "@/data/panoramas";
import { useHotspotStore } from "@/lib/hotspotStore";

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
  component: AdminInner,
});

function AdminInner() {
  const { id } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/editor" });
  const initialId = id && getPanorama(id) ? id : PANORAMAS[0].id;
  const [activeId, setActiveId] = useState(initialId);
  const active = getPanorama(activeId)!;

  // Editable working copy — seeded from persisted overrides so previously
  // saved hotspots reappear across sessions and across the whole project.
  const storeGet = useHotspotStore((s) => s.getHotspots);
  const storeSet = useHotspotStore((s) => s.setHotspots);
  const storeSave = useHotspotStore((s) => s.save);
  const storeReset = useHotspotStore((s) => s.resetPanorama);
  const dirty = useHotspotStore((s) => s.dirty);
  const autosave = useHotspotStore((s) => s.autosave);
  const setAutosave = useHotspotStore((s) => s.setAutosave);
  const [drafts, setDrafts] = useState<Record<string, Hotspot[]>>(() =>
    Object.fromEntries(PANORAMAS.map((p) => [p.id, storeGet(p.id).map((h) => ({ ...h }))])),
  );
  const hotspots = drafts[activeId] ?? [];

  // Push draft edits into the store on every change so the tour viewer
  // reflects them live; `Save` then persists to localStorage.
  useEffect(() => {
    storeSet(activeId, drafts[activeId] ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts, activeId]);

  function saveAll() {
    // Flush every panorama's drafts (in case some were edited then user switched away)
    for (const p of PANORAMAS) storeSet(p.id, drafts[p.id] ?? []);
    storeSave();
  }

  function resetActive() {
    storeReset(activeId);
    setDrafts((d) => ({ ...d, [activeId]: getPanorama(activeId)!.hotspots.map((h) => ({ ...h })) }));
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const markersRef = useRef<any>(null);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const [{ Viewer }, { MarkersPlugin }] = await Promise.all([
        import("@photo-sphere-viewer/core"),
        import("@photo-sphere-viewer/markers-plugin"),
      ]);
      if (disposed || !containerRef.current) return;
      const viewer = new Viewer({
        container: containerRef.current,
        panorama: active.panorama,
        navbar: ["zoom", "fullscreen"],
        plugins: [[MarkersPlugin, {}]],
      });
      viewerRef.current = viewer;
      markersRef.current = viewer.getPlugin(MarkersPlugin);

      // Click on the sphere → capture yaw/pitch and open placement modal.
      viewer.addEventListener("click", (e: any) => {
        const { yaw, pitch } = e.data;
        window.dispatchEvent(new CustomEvent("pydah-admin-place", {
          detail: { yaw: THREE_degrees(yaw), pitch: THREE_degrees(pitch) },
        }));
      });
    })();
    return () => {
      disposed = true;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Redraw markers whenever hotspots change.
  useEffect(() => {
    const markers = markersRef.current;
    if (!markers) return;
    markers.setMarkers(
      hotspots.map((h, i) => ({
        id: `admin-${i}`,
        position: { yaw: `${h.yaw}deg`, pitch: `${h.pitch}deg` },
        html: `<div style="padding:4px 8px;border-radius:9999px;background:#1e5fbf;color:#fff;font:600 12px system-ui;box-shadow:0 4px 12px rgba(0,0,0,.4)">${
          (getPanorama(h.targetId)?.title ?? h.label ?? "?")
        }</div>`,
        anchor: "center center",
      })),
    );
  }, [hotspots]);

  // Placement modal state.
  const [pending, setPending] = useState<{ yaw: number; pitch: number } | null>(null);
  useEffect(() => {
    const fn = (e: Event) => setPending((e as CustomEvent).detail);
    window.addEventListener("pydah-admin-place", fn);
    return () => window.removeEventListener("pydah-admin-place", fn);
  }, []);

  function addHotspot(targetId: string, arrow: Hotspot["arrow"]) {
    if (!pending) return;
    setDrafts((d) => ({
      ...d,
      [activeId]: [...(d[activeId] ?? []), { targetId, yaw: pending.yaw, pitch: pending.pitch, arrow }],
    }));
    setPending(null);
  }

  function deleteHotspot(i: number) {
    setDrafts((d) => ({ ...d, [activeId]: d[activeId].filter((_, idx) => idx !== i) }));
  }

  function updateHotspot(i: number, patch: Partial<Hotspot>) {
    setDrafts((d) => ({
      ...d,
      [activeId]: d[activeId].map((h, idx) => (idx === i ? { ...h, ...patch } : h)),
    }));
  }

  const exportJson = useMemo(
    () =>
      JSON.stringify(
        PANORAMAS.map((p) => ({ ...p, hotspots: drafts[p.id] ?? p.hotspots })),
        null,
        2,
      ),
    [drafts],
  );

  function download() {
    const blob = new Blob([exportJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "locations.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-black text-white">
      <div className="flex items-center justify-between border-b border-white/10 bg-black/80 px-4 py-3">
        <button onClick={() => navigate({ to: "/admin" })} className="flex items-center gap-2 text-sm text-white/80 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </button>
        <p className="text-xs uppercase tracking-widest text-accent">
          Admin — Hotspot Editor
          {autosave ? (
            <span className="ml-2 rounded-full bg-emerald-500/80 px-2 py-0.5 text-[10px] text-black">autosaving</span>
          ) : dirty ? (
            <span className="ml-2 rounded-full bg-orange-500/80 px-2 py-0.5 text-[10px] text-black">unsaved</span>
          ) : null}
        </p>
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20">
            <input type="checkbox" checked={autosave} onChange={(e) => setAutosave(e.target.checked)} className="accent-emerald-400" />
            Autosave
          </label>
          <button onClick={resetActive} title="Revert this panorama to defaults" className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20">
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          <button onClick={saveAll} className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-black hover:brightness-110">
            <Save className="h-4 w-4" /> Save to Project
          </button>
          <button onClick={download} className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-bold text-black hover:brightness-110">
            <Download className="h-4 w-4" /> Export JSON
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Location list */}
        <aside className="w-56 shrink-0 overflow-y-auto border-r border-white/10 bg-black/70 p-2">
          {PANORAMAS.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-xs ${
                p.id === activeId ? "bg-accent text-black" : "text-white/80 hover:bg-white/10"
              }`}
            >
              <p className="font-semibold">{p.title}</p>
              <p className="text-[10px] opacity-70">{p.hotspots.length} hotspots</p>
            </button>
          ))}
        </aside>

        {/* Viewer */}
        <div className="relative flex-1">
          <div ref={containerRef} className="h-full w-full" />
          <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1.5 text-xs">
            Click anywhere on the panorama to place a hotspot
          </div>
        </div>

        {/* Hotspot list for the active panorama */}
        <aside className="w-80 shrink-0 overflow-y-auto border-l border-white/10 bg-black/70 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/70">Hotspots in {active.title}</p>
          {hotspots.length === 0 && <p className="text-xs text-white/50">No hotspots yet. Click the panorama.</p>}
          {(hotspots as Hotspot[]).map((h, i) => (
            <div key={i} className="mb-2 rounded-lg border border-white/10 bg-white/5 p-2 text-xs">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-semibold">{getPanorama(h.targetId)?.title ?? "(unknown)"}</span>
                <button onClick={() => deleteHotspot(i)} className="text-white/60 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <label className="mb-1 block">
                <span className="opacity-60">Target</span>
                <select
                  value={h.targetId}
                  onChange={(e) => updateHotspot(i, { targetId: e.target.value })}
                  className="mt-0.5 block w-full rounded bg-black px-2 py-1 text-white"
                >
                  {PANORAMAS.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-1">
                <label><span className="opacity-60">Yaw</span>
                  <input type="number" value={Math.round(h.yaw)} onChange={(e) => updateHotspot(i, { yaw: Number(e.target.value) })} className="mt-0.5 block w-full rounded bg-black px-2 py-1" />
                </label>
                <label><span className="opacity-60">Pitch</span>
                  <input type="number" value={Math.round(h.pitch)} onChange={(e) => updateHotspot(i, { pitch: Number(e.target.value) })} className="mt-0.5 block w-full rounded bg-black px-2 py-1" />
                </label>
              </div>
              <label className="mt-1 block">
                <span className="opacity-60">Arrow</span>
                <select value={h.arrow ?? "up"} onChange={(e) => updateHotspot(i, { arrow: e.target.value as Hotspot["arrow"] })} className="mt-0.5 block w-full rounded bg-black px-2 py-1">
                  <option value="up">up</option><option value="right">right</option><option value="down">down</option><option value="left">left</option>
                </select>
              </label>
            </div>
          ))}
        </aside>
      </div>

      {/* Placement modal */}
      {pending && (
        <div className="absolute inset-0 z-50 grid place-items-center bg-black/80" onClick={() => setPending(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-white/15 bg-black p-5">
            <p className="text-sm font-semibold">Place hotspot at yaw {Math.round(pending.yaw)}°, pitch {Math.round(pending.pitch)}°</p>
            <p className="mt-1 text-xs text-white/60">Choose the target panorama and arrow direction.</p>
            <PlacementForm onSubmit={addHotspot} onCancel={() => setPending(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function PlacementForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (id: string, arrow: Hotspot["arrow"]) => void;
  onCancel: () => void;
}) {
  const [target, setTarget] = useState(PANORAMAS[0].id);
  const [arrow, setArrow] = useState<Hotspot["arrow"]>("up");
  return (
    <div className="mt-4 space-y-2 text-sm">
      <label className="block">
        <span className="text-xs opacity-70">Target</span>
        <select value={target} onChange={(e) => setTarget(e.target.value)} className="mt-1 block w-full rounded bg-white/10 px-2 py-1.5">
          {PANORAMAS.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-xs opacity-70">Arrow direction</span>
        <select value={arrow} onChange={(e) => setArrow(e.target.value as Hotspot["arrow"])} className="mt-1 block w-full rounded bg-white/10 px-2 py-1.5">
          <option value="up">up</option><option value="right">right</option><option value="down">down</option><option value="left">left</option>
        </select>
      </label>
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-full bg-white/10 px-3 py-1.5 text-xs">Cancel</button>
        <button onClick={() => onSubmit(target, arrow)} className="flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-black"><Plus className="h-3.5 w-3.5" /> Add</button>
      </div>
    </div>
  );
}

/** PSV yaw/pitch come in radians; convert to degrees for our JSON shape. */
function THREE_degrees(rad: number) {
  return (rad * 180) / Math.PI;
}
