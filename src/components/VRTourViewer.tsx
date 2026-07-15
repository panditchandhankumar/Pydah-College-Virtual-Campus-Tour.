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

function VRIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 7v11a2 2 0 0 0 2 2h2.5a2 2 0 0 0 2-1.7l.5-2.3h3l.5 2.3a2 2 0 0 0 2 1.7H19a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
      <circle cx="8" cy="12" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12" r="2.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * WebXR wrapper around the SAME PanoramaEngine used on desktop.
 * The only difference vs <TourViewer /> is `xr: true` (enables
 * renderer.xr). Hotspots, sphere, raycaster and scene graph are literally
 * the same objects.
 *
 * The visible VR button is our own styled UI; the Three.js VRButton is kept
 * off-screen as the functional controller so session lifecycle still works.
 */
export function VRTourViewer({ panorama, onChange }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const visibleBtnRef = useRef<HTMLButtonElement>(null);
  const hiddenBtnRef = useRef<HTMLButtonElement | null>(null);
  const engineRef = useRef<PanoramaEngine | null>(null);
  const navigate = useNavigate();
  const [status, setStatus] = useState("Loading campus…");
  const [debugOn, setDebugOn] = useDebugMode();
  const [debugState, setDebugState] = useState<DebugState | null>(null);
  const [vrText, setVrText] = useState("VR NOT SUPPORTED");


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

    // Create the official Three.js VR button but keep it hidden. We render our
    // own styled button and proxy clicks to it, so Three.js can't clobber our UI.
    const hiddenBtn = VRButton.createButton(engine.renderer);
    hiddenBtnRef.current = hiddenBtn;
    hiddenBtn.style.setProperty("display", "none", "important");
    hiddenBtn.style.setProperty("position", "fixed", "important");
    hiddenBtn.style.setProperty("inset", "auto", "important");
    hiddenBtn.style.setProperty("bottom", "0", "important");
    hiddenBtn.style.setProperty("left", "0", "important");
    hiddenBtn.style.setProperty("opacity", "0", "important");
    hiddenBtn.style.setProperty("pointer-events", "none", "important");
    hiddenBtn.style.setProperty("z-index", "-1", "important");
    mountRef.current.appendChild(hiddenBtn);

    const syncText = () => setVrText(hiddenBtn.textContent || "VR NOT SUPPORTED");
    syncText();
    const textObserver = new MutationObserver(syncText);
    textObserver.observe(hiddenBtn, { childList: true, subtree: true, characterData: true });

    const onVisibleClick = () => hiddenBtn.click();
    visibleBtnRef.current?.addEventListener("click", onVisibleClick);

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
      textObserver.disconnect();
      visibleBtnRef.current?.removeEventListener("click", onVisibleClick);
      unsubscribe();
      try { hiddenBtn.remove(); } catch { /* ignore */ }
      engine.dispose();
      engineRef.current = null;
      hiddenBtnRef.current = null;
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
        className="pointer-events-auto absolute bottom-4 left-1/2 z-50 w-fit max-w-[min(90vw,360px)] -translate-x-1/2 px-4"
        aria-label="VR button container"
      >
        <button
          ref={visibleBtnRef}
          className="inline-flex items-center justify-center gap-2.5 rounded-full border-2 border-white/35 bg-[rgba(0,33,71,0.92)] px-6 py-3 text-[15px] font-bold uppercase tracking-wider text-white shadow-[0_8px_32px_rgba(0,0,0,0.55)] transition hover:opacity-90 active:scale-95 whitespace-nowrap"
        >
          <VRIcon className="h-[22px] w-[22px] flex-shrink-0" />
          {vrText}
        </button>
      </div>

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
