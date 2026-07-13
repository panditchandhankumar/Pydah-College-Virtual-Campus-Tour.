import { useEffect, useRef, useState } from "react";
import type { Panorama, Hotspot } from "@/data/panoramas";
import { getPanorama, PANORAMAS } from "@/data/panoramas";

function arrowSvg(direction: Hotspot["arrow"]) {
  const d =
    direction === "right"
      ? "M5 12h14M12 5l7 7-7 7"
      : direction === "left"
      ? "M19 12H5M12 5l-7 7 7 7"
      : direction === "down"
      ? "M12 5v14M5 12l7 7 7-7"
      : "M12 19V5M5 12l7-7 7 7";
  return `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
}

const RAD2DEG = 180 / Math.PI;

interface ContextMenuPayload {
  index: number;
  screenX: number;
  screenY: number;
}

interface Props {
  panorama: Panorama;
  hotspots: Hotspot[];
  editMode?: boolean;
  onNavigate: (id: string) => void;
  onHotspotsChange?: (next: Hotspot[]) => void;
  onAddRequest?: (yaw: number, pitch: number) => void;
  onHotspotContextMenu?: (payload: ContextMenuPayload) => void;
}

/**
 * Client-only Photo Sphere Viewer wrapper.
 * Supports view mode + a visual edit mode: drag markers, double-click to add,
 * right-click for a context menu. All positions stay in panorama spherical
 * coords (yaw/pitch in degrees).
 */
export function PanoramaViewer({
  panorama,
  hotspots,
  editMode = false,
  onNavigate,
  onHotspotsChange,
  onAddRequest,
  onHotspotContextMenu,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const markersRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  // Keep latest callbacks/props in refs so the viewer effect stays stable.
  const cbRef = useRef({
    onNavigate,
    onHotspotsChange,
    onAddRequest,
    onHotspotContextMenu,
    editMode,
    hotspots,
  });
  cbRef.current = {
    onNavigate,
    onHotspotsChange,
    onAddRequest,
    onHotspotContextMenu,
    editMode,
    hotspots,
  };

  // Create viewer once
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
        // In edit mode a click selects but does not navigate.
        if (cbRef.current.editMode) return;
        const targetId = e.marker?.data?.targetId as string | undefined;
        if (targetId) cbRef.current.onNavigate(targetId);
      });

      // Double-click to add a hotspot in edit mode.
      viewer.addEventListener("dblclick", (e: any) => {
        if (!cbRef.current.editMode) return;
        const { onAddRequest } = cbRef.current;
        if (!onAddRequest) return;
        const yaw = ((e.data.yaw ?? 0) * RAD2DEG + 360) % 360;
        const pitch = (e.data.pitch ?? 0) * RAD2DEG;
        onAddRequest(yaw, pitch);
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

  // Change panorama when prop updates
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

  // Re-render markers whenever the hotspot list or edit mode changes.
  useEffect(() => {
    if (!markersRef.current) return;
    renderMarkers(hotspots);
    // toggle body class for edit-mode cursor
  }, [hotspots, editMode, panorama.id]);

  function renderMarkers(list: Hotspot[]) {
    const markers = markersRef.current;
    if (!markers) return;
    markers.setMarkers(
      list.map((h, i) => {
        const target = getPanorama(h.targetId);
        const name = h.label ?? target?.title ?? "Location";
        return {
          id: `hs-${i}-${h.targetId}`,
          position: { yaw: `${h.yaw}deg`, pitch: `${h.pitch}deg` },
          html: `
            <div class="psv-hotspot ${editMode ? "psv-hotspot--edit" : ""}" data-idx="${i}">
              <span class="psv-hotspot-name">${escapeHtml(name)}</span>
              <span class="psv-hotspot-disc">${arrowSvg(h.arrow)}</span>
            </div>
          `,
          anchor: "center center",
          tooltip: editMode ? `${name} (drag to move)` : name,
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
      cbRef.current.onHotspotContextMenu?.({
        index: idx,
        screenX: ev.clientX,
        screenY: ev.clientY,
      });
    });
  }

  return (
    <div className={`relative h-full w-full overflow-hidden rounded-2xl bg-primary ${editMode ? "psv-edit-mode" : ""}`}>
      <div ref={containerRef} className="h-full w-full" />
      {editMode && (
        <div className="pointer-events-none absolute left-4 top-20 z-10 rounded-full bg-accent/90 px-3 py-1 text-xs font-semibold text-white shadow-lg">
          EDIT MODE — drag hotspots · double-click to add · right-click to edit
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
        .psv-hotspot {
          position: relative;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          cursor: pointer;
          transition: transform .2s ease;
        }
        .psv-hotspot:hover { transform: translateY(-2px) scale(1.05); }
        .psv-hotspot--edit { cursor: grab; }
        .psv-hotspot--edit:active { cursor: grabbing; }
        .psv-hotspot--edit .psv-hotspot-disc {
          background: #f97316 !important;
          box-shadow: 0 0 0 3px rgba(255,255,255,.95), 0 0 22px rgba(249,115,22,.7) !important;
        }
        .psv-hotspot-name {
          padding: 4px 12px;
          border-radius: 6px;
          background: #ffffff;
          color: #002147;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: .2px;
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(0,0,0,.35);
          border: 1px solid rgba(0,33,71,.15);
        }
        .psv-hotspot-disc {
          width: 54px; height: 54px;
          display: grid; place-items: center;
          border-radius: 9999px;
          background: #1e5fbf;
          box-shadow: 0 6px 18px rgba(0,0,0,.45), inset 0 0 0 3px rgba(255,255,255,.95);
          animation: hs-bob 2.4s ease-in-out infinite;
        }
        @keyframes hs-bob {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

// Re-export list of panorama ids for editor pickers if needed elsewhere.
export const PANO_OPTIONS = PANORAMAS.map((p) => ({ id: p.id, title: p.title }));
