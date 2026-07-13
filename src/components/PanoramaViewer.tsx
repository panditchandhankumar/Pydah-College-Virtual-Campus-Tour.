import { useEffect, useRef, useState } from "react";
import type { Hotspot, HotspotIcon } from "@/data/panoramas";
import { getPanorama, PANORAMAS } from "@/data/panoramas";

const RAD2DEG = 180 / Math.PI;

const ICON_GLYPH: Record<HotspotIcon, string> = {
  arrow: "↑",
  building: "🏫",
  gate: "🏠",
  cse: "💻",
  ece: "📡",
  cafeteria: "🍽",
  seminar: "🎤",
  library: "📚",
  parking: "🚲",
  ground: "⚽",
  garden: "🌳",
  info: "ℹ",
  nav: "➡",
};

function arrowSvg(direction: Hotspot["arrow"], color = "white") {
  const d =
    direction === "right"
      ? "M5 12h14M12 5l7 7-7 7"
      : direction === "left"
      ? "M19 12H5M12 5l-7 7 7 7"
      : direction === "down"
      ? "M12 5v14M5 12l7 7 7-7"
      : "M12 19V5M5 12l7-7 7 7";
  return `<svg viewBox="0 0 24 24" width="60%" height="60%" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
}

interface ContextMenuPayload {
  index: number;
  screenX: number;
  screenY: number;
}

interface Props {
  panorama: { id: string; title: string; panorama: string };
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
 * Client-only Photo Sphere Viewer wrapper.
 * View mode: click marker → navigate.
 * Edit mode: click marker → select (dashed outline), drag to move, right-click
 * for context menu, double-click empty area to add.
 * Add mode (edit mode + addMode=true): a single click on empty area drops
 * a new hotspot at that spherical coordinate.
 */
export function PanoramaViewer({
  panorama,
  hotspots,
  editMode = false,
  addMode = false,
  selectedIndex = null,
  onNavigate,
  onHotspotsChange,
  onAddRequest,
  onSelect,
  onHotspotContextMenu,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const markersRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  const cbRef = useRef({
    onNavigate,
    onHotspotsChange,
    onAddRequest,
    onSelect,
    onHotspotContextMenu,
    editMode,
    addMode,
    selectedIndex,
    hotspots,
  });
  cbRef.current = {
    onNavigate,
    onHotspotsChange,
    onAddRequest,
    onSelect,
    onHotspotContextMenu,
    editMode,
    addMode,
    selectedIndex,
    hotspots,
  };

  useEffect(() => {
    let disposed = false;
    (async () => {
      const [{ Viewer }, { MarkersPlugin }, { StereoPlugin }, { GyroscopePlugin }] = await Promise.all([
        import("@photo-sphere-viewer/core"),
        import("@photo-sphere-viewer/markers-plugin"),
        import("@photo-sphere-viewer/stereo-plugin"),
        import("@photo-sphere-viewer/gyroscope-plugin"),
      ]);
      if (disposed || !containerRef.current) return;
      const viewer = new Viewer({
        container: containerRef.current,
        panorama: panorama.panorama,
        loadingImg: undefined,
        defaultZoomLvl: 20,
        touchmoveTwoFingers: false,
        mousewheelCtrlKey: false,
        navbar: ["zoom", "gyroscope", "stereo", "fullscreen"],
        plugins: [[MarkersPlugin, {}], [GyroscopePlugin, {}], [StereoPlugin, {}]],
      });
      viewer.addEventListener("ready", () => setLoading(false), { once: true });
      viewerRef.current = viewer;
      markersRef.current = viewer.getPlugin(MarkersPlugin);
      renderMarkers(cbRef.current.hotspots);

      markersRef.current.addEventListener("select-marker", (e: any) => {
        const idx = e.marker?.data?.idx as number | undefined;
        if (cbRef.current.editMode) {
          if (typeof idx === "number") cbRef.current.onSelect?.(idx);
          return;
        }
        const targetId = e.marker?.data?.targetId as string | undefined;
        if (targetId) cbRef.current.onNavigate(targetId);
      });

      // Click on empty area
      viewer.addEventListener("click", (e: any) => {
        if (!cbRef.current.editMode) return;
        // In add mode a single click drops a hotspot.
        if (cbRef.current.addMode && cbRef.current.onAddRequest) {
          const yaw = ((e.data.yaw ?? 0) * RAD2DEG + 360) % 360;
          const pitch = (e.data.pitch ?? 0) * RAD2DEG;
          cbRef.current.onAddRequest(yaw, pitch);
          return;
        }
        // Otherwise clear selection.
        cbRef.current.onSelect?.(null);
      });

      viewer.addEventListener("dblclick", (e: any) => {
        if (!cbRef.current.editMode || cbRef.current.addMode) return;
        if (!cbRef.current.onAddRequest) return;
        const yaw = ((e.data.yaw ?? 0) * RAD2DEG + 360) % 360;
        const pitch = (e.data.pitch ?? 0) * RAD2DEG;
        cbRef.current.onAddRequest(yaw, pitch);
      });

      installEditHandlers();
    })();
    return () => {
      disposed = true;
      viewerRef.current?.destroy();
      viewerRef.current = null;
      markersRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    setLoading(true);
    viewer
      .setPanorama(panorama.panorama, { transition: 1000, showLoader: false })
      .then(() => {
        setLoading(false);
        renderMarkers(cbRef.current.hotspots);
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panorama.id]);

  useEffect(() => {
    if (!markersRef.current) return;
    renderMarkers(hotspots);
  }, [hotspots, editMode, selectedIndex, panorama.id]);

  function renderMarkers(list: Hotspot[]) {
    const markers = markersRef.current;
    if (!markers) return;
    markers.setMarkers(
      list
        .map((h, i) => ({ h, i }))
        .filter(({ h }) => editMode || h.visible !== false)
        .map(({ h, i }) => {
          const target = getPanorama(h.targetId);
          const name = h.label ?? target?.title ?? "Location";
          return {
            id: `hs-${i}-${h.targetId}`,
            position: { yaw: `${h.yaw}deg`, pitch: `${h.pitch}deg` },
            html: buildHotspotHtml(h, name, i, i === selectedIndex, editMode),
            anchor: "center center",
            tooltip: h.tooltip || (editMode ? `${name} (drag to move)` : name),
            data: { targetId: h.targetId, idx: i },
          };
        })
    );
  }

  function installEditHandlers() {
    const container = containerRef.current;
    const viewer = viewerRef.current;
    if (!container || !viewer) return;

    let dragging: { idx: number } | null = null;

    const findIdx = (el: EventTarget | null): number | null => {
      if (!(el instanceof Element)) return null;
      const node = el.closest("[data-idx]") as HTMLElement | null;
      if (!node) return null;
      const v = node.dataset.idx;
      return v != null ? Number(v) : null;
    };

    container.addEventListener("pointerdown", (ev) => {
      if (!cbRef.current.editMode) return;
      const idx = findIdx(ev.target);
      if (idx == null) return;
      ev.stopPropagation();
      ev.preventDefault();
      dragging = { idx };
      cbRef.current.onSelect?.(idx);
      (ev.target as Element).setPointerCapture?.(ev.pointerId);
    });

    container.addEventListener("pointermove", (ev) => {
      if (!dragging) return;
      const rect = container.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const sphere = viewer.dataHelper?.viewerCoordsToSphericalCoords({ x, y });
      if (!sphere) return;
      const yaw = ((sphere.yaw * RAD2DEG) + 360) % 360;
      const pitch = sphere.pitch * RAD2DEG;
      const markers = markersRef.current;
      const list = cbRef.current.hotspots;
      const h = list[dragging.idx];
      if (!h) return;
      const id = `hs-${dragging.idx}-${h.targetId}`;
      try {
        markers.updateMarker({
          id,
          position: { yaw: `${yaw}deg`, pitch: `${pitch}deg` },
        });
      } catch {
        /* ignore mid-drag update errors */
      }
    });

    const endDrag = (ev: PointerEvent) => {
      if (!dragging) return;
      const rect = container.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const sphere = viewer.dataHelper?.viewerCoordsToSphericalCoords({ x, y });
      const list = cbRef.current.hotspots.slice();
      const h = list[dragging.idx];
      if (h && sphere) {
        list[dragging.idx] = {
          ...h,
          yaw: Number((((sphere.yaw * RAD2DEG) + 360) % 360).toFixed(2)),
          pitch: Number((sphere.pitch * RAD2DEG).toFixed(2)),
        };
        cbRef.current.onHotspotsChange?.(list);
      }
      dragging = null;
    };
    container.addEventListener("pointerup", endDrag);
    container.addEventListener("pointercancel", endDrag);

    container.addEventListener("contextmenu", (ev) => {
      if (!cbRef.current.editMode) return;
      const idx = findIdx(ev.target);
      if (idx == null) return;
      ev.preventDefault();
      cbRef.current.onSelect?.(idx);
      cbRef.current.onHotspotContextMenu?.({
        index: idx,
        screenX: ev.clientX,
        screenY: ev.clientY,
      });
    });
  }

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-2xl bg-primary ${
        editMode ? "psv-edit-mode" : ""
      } ${addMode ? "psv-add-mode" : ""}`}
    >
      <div ref={containerRef} className="h-full w-full" />
      {editMode && (
        <div className="pointer-events-none absolute left-4 top-20 z-10 rounded-full bg-accent/90 px-3 py-1 text-xs font-semibold text-white shadow-lg">
          {addMode
            ? "ADD MODE — click anywhere on the panorama to drop a hotspot"
            : "EDIT MODE — click to select · drag to move · double-click empty area to add"}
        </div>
      )}
      {loading && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-primary/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 text-white">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-accent" />
            <p className="text-sm">Loading {panorama.title}…</p>
          </div>
        </div>
      )}
      <style>{`
        .psv-add-mode, .psv-add-mode canvas { cursor: crosshair !important; }
        .psv-hotspot {
          position: relative;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          cursor: pointer;
          transition: transform .2s ease, filter .2s ease;
        }
        .psv-hotspot:hover { transform: translateY(-2px) scale(1.05); }
        .psv-edit-mode .psv-hotspot { cursor: grab; }
        .psv-edit-mode .psv-hotspot:active { cursor: grabbing; }
        .psv-hotspot-name {
          padding: 4px 12px;
          border-radius: 6px;
          background: #ffffff;
          color: #002147;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(0,0,0,.35);
          border: 1px solid rgba(0,33,71,.15);
        }
        .psv-hotspot-disc {
          display: grid; place-items: center;
          background: var(--hs-bg, #1e5fbf);
          color: var(--hs-fg, #ffffff);
          border: var(--hs-border-width, 3px) solid var(--hs-border, rgba(255,255,255,.95));
          font-size: var(--hs-icon-size, 26px);
          line-height: 1;
        }
        .psv-hotspot-disc.-shadow { box-shadow: 0 6px 18px rgba(0,0,0,.45); }
        .psv-hotspot-disc.-glow { box-shadow: 0 0 24px 4px var(--hs-bg, #1e5fbf), 0 6px 18px rgba(0,0,0,.45); }
        .psv-hotspot-disc.-glass {
          background: rgba(255,255,255,.15); backdrop-filter: blur(10px);
          border-color: rgba(255,255,255,.4);
        }
        .psv-hotspot-disc.-shape-circle { border-radius: 9999px; }
        .psv-hotspot-disc.-shape-rounded { border-radius: 14px; }
        .psv-hotspot-disc.-shape-pill { border-radius: 9999px; padding: 0 14px; }
        .psv-hotspot-disc.-anim-bob { animation: hs-bob 2.4s ease-in-out infinite; }
        .psv-hotspot-disc.-anim-pulse { animation: hs-pulse 1.8s ease-in-out infinite; }
        .psv-hotspot-disc.-anim-spin { animation: hs-spin 6s linear infinite; }
        .psv-hotspot--selected .psv-hotspot-disc {
          outline: 2px dashed #f97316;
          outline-offset: 6px;
        }
        .psv-hotspot--selected .psv-hotspot-name {
          outline: 2px dashed #f97316;
          outline-offset: 3px;
        }
        @keyframes hs-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes hs-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
        @keyframes hs-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function buildHotspotHtml(h: Hotspot, name: string, selected: boolean, editMode: boolean) {
  const size = h.size ?? 54;
  const bg = h.background ?? "#1e5fbf";
  const fg = h.textColor ?? "#ffffff";
  const border = h.borderColor ?? "rgba(255,255,255,.95)";
  const borderW = h.borderWidth ?? 3;
  const opacity = h.opacity ?? 1;
  const style = h.style ?? "circle";
  const display = h.display ?? "iconText";
  const anim = h.animation ?? "bob";
  const iconKey: HotspotIcon = h.icon ?? "arrow";
  const iconHtml =
    iconKey === "arrow" ? arrowSvg(h.arrow, fg) : `<span>${ICON_GLYPH[iconKey] ?? "•"}</span>`;

  const discClasses = [
    "psv-hotspot-disc",
    `-shape-${style === "glass" || style === "floating" ? "circle" : style}`,
    style === "glass" ? "-glass" : "",
    h.glow ? "-glow" : h.shadow === false ? "" : "-shadow",
    `-anim-${anim}`,
  ]
    .filter(Boolean)
    .join(" ");

  const styleVars = `--hs-bg:${bg};--hs-fg:${fg};--hs-border:${border};--hs-border-width:${borderW}px;--hs-icon-size:${Math.round(
    size * 0.48
  )}px;opacity:${opacity};`;

  const showText = display !== "icon";
  const showIcon = display !== "text";
  const label = escapeHtml(name);
  const idx = 0; // idx is set via data attribute on outer wrapper; we use CSS classes via a wrapper span
  return `
    <div class="psv-hotspot ${selected ? "psv-hotspot--selected" : ""}" data-idx="${idx}">
      ${showText ? `<span class="psv-hotspot-name" data-idx="${idx}">${label}</span>` : ""}
      ${
        showIcon
          ? `<span class="${discClasses}" data-idx="${idx}" style="${styleVars}width:${size}px;height:${size}px;">${iconHtml}</span>`
          : ""
      }
      ${editMode ? "" : ""}
    </div>
  `;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

export const PANO_OPTIONS = PANORAMAS.map((p) => ({ id: p.id, title: p.title }));
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
