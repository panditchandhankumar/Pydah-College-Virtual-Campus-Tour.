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
        const name = target?.title ?? h.label;
        return {
          id: `hs-${h.targetId}`,
          position: { yaw: `${h.yaw}deg`, pitch: `${h.pitch}deg` },
          html: `
            <div class="psv-hotspot">
              <span class="psv-hotspot-name">${name}</span>
              <span class="psv-hotspot-disc">
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
              </span>
            </div>
          `,
          anchor: "center center",
          tooltip: name,
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
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          cursor: pointer;
          transition: transform .2s ease;
        }
        .psv-hotspot:hover { transform: translateY(-2px) scale(1.05); }
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
