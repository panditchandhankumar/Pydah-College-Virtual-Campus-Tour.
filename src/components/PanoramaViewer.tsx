import { useEffect, useRef, useState } from "react";
import type { Panorama } from "@/data/panoramas";
import { getPanorama } from "@/data/panoramas";

interface Props {
  panorama: Panorama;
  onNavigate: (id: string) => void;
}

/**
 * Client-only Photo Sphere Viewer wrapper.
 * Loads the viewer dynamically so SSR bundles never touch `window`.
 */
export function PanoramaViewer({ panorama, onNavigate }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const markersRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const onNavigateRef = useRef(onNavigate);
  onNavigateRef.current = onNavigate;

  // Create viewer once
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
        panorama: panorama.panorama,
        loadingImg: undefined,
        defaultZoomLvl: 20,
        touchmoveTwoFingers: false,
        mousewheelCtrlKey: false,
        navbar: ["zoom", "fullscreen"],
        plugins: [[MarkersPlugin, {}]],
      });
      viewer.addEventListener("ready", () => setLoading(false), { once: true });
      viewerRef.current = viewer;
      markersRef.current = viewer.getPlugin(MarkersPlugin);
      renderMarkers(panorama);

      markersRef.current.addEventListener("select-marker", (e: any) => {
        const targetId = e.marker?.data?.targetId as string | undefined;
        if (targetId) onNavigateRef.current(targetId);
      });
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
        renderMarkers(panorama);
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panorama.id]);

  function renderMarkers(p: Panorama) {
    const markers = markersRef.current;
    if (!markers) return;
    markers.setMarkers(
      p.hotspots.map((h) => {
        const target = getPanorama(h.targetId);
        return {
          id: `hs-${h.targetId}`,
          position: { yaw: `${h.yaw}deg`, pitch: `${h.pitch}deg` },
          html: `
            <div class="psv-hotspot">
              <span class="psv-hotspot-ring"></span>
              <span class="psv-hotspot-dot"></span>
              <span class="psv-hotspot-label">${h.label}</span>
            </div>
          `,
          anchor: "center center",
          tooltip: target?.title ?? h.label,
          data: { targetId: h.targetId },
        };
      })
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-primary">
      <div ref={containerRef} className="h-full w-full" />
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
          width: 44px; height: 44px;
          display: grid; place-items: center;
          cursor: pointer;
        }
        .psv-hotspot-ring {
          position: absolute; inset: 0;
          border-radius: 9999px;
          background: color-mix(in oklab, #00C2FF 30%, transparent);
          animation: hs-pulse 2s ease-out infinite;
        }
        .psv-hotspot-dot {
          width: 16px; height: 16px; border-radius: 9999px;
          background: #00C2FF;
          box-shadow: 0 0 0 3px rgba(255,255,255,.9), 0 6px 16px rgba(0,0,0,.35);
        }
        .psv-hotspot-label {
          position: absolute; top: 46px; white-space: nowrap;
          padding: 4px 10px; border-radius: 9999px;
          background: rgba(0,33,71,.9); color: #fff; font-size: 12px; font-weight: 600;
          opacity: 0; transition: opacity .2s ease, transform .2s ease;
          transform: translateY(-4px);
        }
        .psv-hotspot:hover .psv-hotspot-label {
          opacity: 1; transform: translateY(0);
        }
        @keyframes hs-pulse {
          0% { transform: scale(.6); opacity: .9; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
