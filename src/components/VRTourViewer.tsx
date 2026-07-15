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
  const vrButtonRef = useRef<HTMLDivElement>(null);
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

    // Mount the official Three.js Enter-VR button into its own dedicated container
    // so it stays centered and never overlaps with the locations drawer.
    const vrButton = VRButton.createButton(engine.renderer);
    vrButton.classList.add("vr-entry-btn");
    vrButton.style.setProperty("position", "static", "important");
    vrButton.style.setProperty("display", "inline-flex", "important");
    vrButton.style.setProperty("align-items", "center", "important");
    vrButton.style.setProperty("justify-content", "center", "important");
    vrButton.style.setProperty("width", "auto", "important");
    vrButton.style.setProperty("min-width", "auto", "important");
    vrButton.style.setProperty("max-width", "min(90vw, 360px)", "important");
    vrButton.style.setProperty("font-size", "15px", "important");
    vrButton.style.setProperty("font-weight", "700", "important");
    vrButton.style.setProperty("padding", "12px 24px 12px 18px", "important");
    vrButton.style.setProperty("border-radius", "9999px", "important");
    vrButton.style.setProperty("background", "rgba(0, 33, 71, 0.92)", "important");
    vrButton.style.setProperty("color", "#ffffff", "important");
    vrButton.style.setProperty("border", "2px solid rgba(255, 255, 255, 0.35)", "important");
    vrButton.style.setProperty("box-shadow", "0 8px 32px rgba(0, 0, 0, 0.55)", "important");
    vrButton.style.setProperty("text-transform", "uppercase", "important");
    vrButton.style.setProperty("letter-spacing", "0.04em", "important");
    vrButton.style.setProperty("white-space", "nowrap", "important");
    vrButton.style.setProperty("overflow", "hidden", "important");
    vrButton.style.setProperty("text-overflow", "clip", "important");
    vrButton.style.setProperty("text-align", "center", "important");
    vrButton.style.setProperty("line-height", "1.25", "important");
    vrButton.style.setProperty("cursor", "pointer", "important");
    vrButton.style.setProperty("gap", "10px", "important");

    // Inject a VR headset icon via ::before so it survives Three.js textContent updates.
    if (!document.getElementById("vr-entry-btn-style")) {
      const style = document.createElement("style");
      style.id = "vr-entry-btn-style";
      const svg = encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v11a2 2 0 0 0 2 2h2.5a2 2 0 0 0 2-1.7l.5-2.3h3l.5 2.3a2 2 0 0 0 2 1.7H19a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/><circle cx="8" cy="12" r="2.2" fill="%23ffffff" stroke="none"/><circle cx="16" cy="12" r="2.2" fill="%23ffffff" stroke="none"/></svg>'
      );
      style.textContent = `
        .vr-entry-btn::before {
          content: "";
          display: inline-block;
          width: 22px;
          height: 22px;
          flex: 0 0 22px;
          background-image: url("data:image/svg+xml,${svg}");
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
        }
      `;
      document.head.appendChild(style);
    }

    vrButtonRef.current?.appendChild(vrButton);


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
      document.getElementById("vr-entry-btn-style")?.remove();
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

      {/* Dedicated, always-centered VR button container kept above the locations drawer. */}
      <div
        ref={vrButtonRef}
        className="pointer-events-auto absolute bottom-4 left-1/2 z-50 w-fit max-w-[min(90vw,360px)] -translate-x-1/2 px-4 text-center"
        aria-label="VR button container"
      />

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

