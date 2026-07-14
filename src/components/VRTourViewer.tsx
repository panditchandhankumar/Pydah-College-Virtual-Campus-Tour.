import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import { PanoramaEngine, type DebugState } from "@/tour-engine/PanoramaEngine";
import type { Panorama } from "@/data/panoramas";
import { useHotspotStore } from "@/lib/hotspotStore";
import { DebugHUD, useDebugMode } from "./DebugHUD";

interface Props {
  panorama: Panorama;
  onChange: (id: string) => void;
}

/**
 * WebXR wrapper around the SAME PanoramaEngine used on desktop.
 * The only difference vs <TourViewer /> is `xr: true` (enables
 * renderer.xr + mounts the VRButton). Hotspots, sphere, raycaster,
 * scene graph are literally the same objects.
 */
export function VRTourViewer({ panorama, onChange }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PanoramaEngine | null>(null);
  const navigate = useNavigate();
  const [status, setStatus] = useState("Loading campus…");
  const [debugOn, setDebugOn] = useDebugMode();
  const [debugState, setDebugState] = useState<DebugState | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const engine = new PanoramaEngine(mountRef.current, { xr: true });
    engineRef.current = engine;

    engine.setCallbacks({
      onNavigate: (id) => onChange(id),
      onLoadStart: (t) => setStatus(`Loading ${t}…`),
      onLoadEnd: () => setStatus(""),
      onLoadError: () => setStatus("Failed to load panorama."),
      onDebug: setDebugState,
    });

    // Mount the official Three.js Enter-VR button (bottom-center, above overlays).
    const vrButton = VRButton.createButton(engine.renderer);
    vrButton.style.setProperty("position", "absolute", "important");
    vrButton.style.setProperty("bottom", "28px", "important");
    vrButton.style.setProperty("left", "50%", "important");
    vrButton.style.setProperty("right", "auto", "important");
    vrButton.style.setProperty("transform", "translateX(-50%)", "important");
    vrButton.style.setProperty("z-index", "50", "important");
    mountRef.current.appendChild(vrButton);

    engine.setPanorama(panorama.id, false);
    engine.setHotspots(useHotspotStore.getState().getHotspots(panorama.id));
    engine.enableDebug(debugOn);

    // Live-refresh hotspots when admin edits land.
    const unsubscribe = useHotspotStore.subscribe((s) => {
      const id = panorama.id;
      const list = s.overrides[id];
      engineRef.current?.setHotspots(list ?? useHotspotStore.getState().getHotspots(id));
    });

    return () => {
      unsubscribe();
      try { vrButton.remove(); } catch { /* ignore */ }
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.setPanorama(panorama.id, true);
    engineRef.current?.setHotspots(useHotspotStore.getState().getHotspots(panorama.id));
  }, [panorama.id]);

  useEffect(() => { engineRef.current?.enableDebug(debugOn); }, [debugOn]);

  return (
    <div className="relative h-full w-full">
      <div ref={mountRef} className="h-full w-full" />
      {status && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 text-white">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-accent" />
            <p className="text-sm">{status}</p>
          </div>
        </div>
      )}
      <DebugHUD open={debugOn} onToggle={() => setDebugOn(!debugOn)} state={debugState} />
    </div>
  );
}

// Back-compat alias for the old import name.
export const VRPanoramaViewer = VRTourViewer;
