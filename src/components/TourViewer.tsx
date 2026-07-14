import { useEffect, useRef, useState } from "react";
import { PanoramaEngine, type DebugState } from "@/tour-engine/PanoramaEngine";
import type { Hotspot, Panorama } from "@/data/panoramas";
import { PANORAMAS } from "@/data/panoramas";
import { DebugHUD, useDebugMode } from "./DebugHUD";

interface ContextMenuPayload {
  index: number;
  screenX: number;
  screenY: number;
}

interface Props {
  panorama: Panorama;
  hotspots: Hotspot[];
  editMode?: boolean;
  addMode?: boolean;
  selectedIndex?: number | null;
  onNavigate: (id: string) => void;
  onHotspotsChange?: (next: Hotspot[]) => void;
  onAddRequest?: (yaw: number, pitch: number) => void;
  onSelect?: (index: number | null) => void;
  onHotspotContextMenu?: (payload: ContextMenuPayload) => void;
}

/**
 * Desktop / mobile / fullscreen wrapper around PanoramaEngine.
 * Same prop surface as the old PanoramaViewer so routes swap 1:1.
 */
export function TourViewer(props: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PanoramaEngine | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadTitle, setLoadTitle] = useState(props.panorama.title);
  const [debugOn, setDebugOn] = useDebugMode();
  const [debugState, setDebugState] = useState<DebugState | null>(null);

  const cbRef = useRef(props);
  cbRef.current = props;

  // Boot engine once.
  useEffect(() => {
    if (!mountRef.current) return;
    const engine = new PanoramaEngine(mountRef.current, { xr: false });
    engineRef.current = engine;
    engine.setCallbacks({
      onNavigate: (id) => cbRef.current.onNavigate?.(id),
      onSelect: (i) => cbRef.current.onSelect?.(i),
      onHotspotDrag: (i, yaw, pitch) => {
        const list = cbRef.current.hotspots.slice();
        if (list[i]) {
          list[i] = { ...list[i], yaw, pitch };
          cbRef.current.onHotspotsChange?.(list);
        }
      },
      onEmptyClick: (yaw, pitch) => {
        if (cbRef.current.addMode) cbRef.current.onAddRequest?.(yaw, pitch);
        else cbRef.current.onSelect?.(null);
      },
      onHotspotContextMenu: (index, x, y) =>
        cbRef.current.onHotspotContextMenu?.({ index, screenX: x, screenY: y }),
      onLoadStart: (t) => { setLoadTitle(t); setLoading(true); },
      onLoadEnd: () => setLoading(false),
      onLoadError: () => setLoading(false),
      onDebug: setDebugState,
    });
    engine.setPanorama(props.panorama.id, false);
    engine.setHotspots(props.hotspots, {
      editMode: !!props.editMode,
      selectedIndex: props.selectedIndex ?? null,
    });
    engine.enableDebug(debugOn);
    return () => { engine.dispose(); engineRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Panorama swap.
  useEffect(() => {
    engineRef.current?.setPanorama(props.panorama.id, true);
  }, [props.panorama.id]);

  // Hotspots / edit / selection.
  useEffect(() => {
    engineRef.current?.setHotspots(props.hotspots, {
      editMode: !!props.editMode,
      selectedIndex: props.selectedIndex ?? null,
    });
  }, [props.hotspots, props.editMode, props.selectedIndex]);

  // Debug toggle.
  useEffect(() => { engineRef.current?.enableDebug(debugOn); }, [debugOn]);

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-2xl bg-primary ${
        props.editMode ? "psv-edit-mode" : ""
      } ${props.addMode ? "psv-add-mode" : ""}`}
    >
      <div ref={mountRef} className="h-full w-full" />
      {props.editMode && (
        <div className="pointer-events-none absolute left-4 top-20 z-10 rounded-full bg-accent/90 px-3 py-1 text-xs font-semibold text-white shadow-lg">
          {props.addMode
            ? "ADD MODE — click anywhere on the panorama to drop a hotspot"
            : "EDIT MODE — click to select · drag to move"}
        </div>
      )}
      {loading && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-primary/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 text-white">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-accent" />
            <p className="text-sm">Loading {loadTitle}…</p>
          </div>
        </div>
      )}
      <DebugHUD open={debugOn} onToggle={() => setDebugOn(!debugOn)} state={debugState} />
      <style>{`.psv-add-mode canvas { cursor: crosshair !important; }`}</style>
    </div>
  );
}

// Backwards-compatible exports so routes/admin.editor.tsx keeps working.
export const PanoramaViewer = TourViewer;
export const PANO_OPTIONS = PANORAMAS.map((p) => ({ id: p.id, title: p.title }));
export type HotspotIcon =
  | "arrow" | "building" | "gate" | "cse" | "ece" | "cafeteria"
  | "seminar" | "library" | "parking" | "ground" | "garden" | "info" | "nav";
export const HOTSPOT_ICONS: { key: HotspotIcon; label: string; glyph: string }[] = [
  { key: "arrow", label: "Navigation Arrow", glyph: "↑" },
  { key: "building", label: "Building", glyph: "🏫" },
  { key: "gate", label: "Main Gate", glyph: "🏠" },
  { key: "cse", label: "CSE", glyph: "💻" },
  { key: "ece", label: "ECE", glyph: "📡" },
  { key: "cafeteria", label: "Cafeteria", glyph: "🍽" },
  { key: "seminar", label: "Seminar Hall", glyph: "🎤" },
  { key: "library", label: "Library", glyph: "📚" },
  { key: "parking", label: "Parking", glyph: "🚲" },
  { key: "ground", label: "Ground", glyph: "⚽" },
  { key: "garden", label: "Garden", glyph: "🌳" },
  { key: "info", label: "Information", glyph: "ℹ" },
  { key: "nav", label: "Navigation", glyph: "➡" },
];
