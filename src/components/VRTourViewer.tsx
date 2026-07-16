import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import { PanoramaEngine, type DebugState, type DiagnosticsState, type QualityPreset } from "@/tour-engine/PanoramaEngine";
import type { Panorama } from "@/data/panoramas";
import { useHotspotStore } from "@/lib/hotspotStore";
import { DebugHUD, useDebugMode } from "./DebugHUD";
import { Gauge, Sliders, X } from "lucide-react";

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
  const [diag, setDiag] = useState<DiagnosticsState | null>(null);
  const [qPanelOpen, setQPanelOpen] = useState(false);
  const [preset, setPreset] = useState<QualityPreset>("auto");


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
      onDiagnostics: setDiag,
    });
    engine.setQualityPreset("auto");

    // Create the official Three.js VR button but keep it hidden. We render our
    // own styled button and proxy clicks to it, so Three.js can't clobber our UI.
    const hiddenBtn = VRButton.createButton(engine.renderer) as HTMLButtonElement;
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

    const syncText = () => {
      const text = hiddenBtn.textContent || "VR NOT SUPPORTED";
      setVrText(text);
      // Mirror the disabled state onto the visible button so users on
      // non-XR browsers can see the button is inactive instead of clicking
      // it and getting no response (which reads as a "black screen").
      const disabled = hiddenBtn.hasAttribute("disabled") ||
        /not (allowed|supported|found)/i.test(text) ||
        /https?:/i.test(text);
      if (visibleBtnRef.current) {
        visibleBtnRef.current.disabled = disabled;
        visibleBtnRef.current.style.opacity = disabled ? "0.55" : "1";
        visibleBtnRef.current.style.cursor = disabled ? "not-allowed" : "pointer";
      }
    };
    syncText();
    const textObserver = new MutationObserver(syncText);
    textObserver.observe(hiddenBtn, { childList: true, subtree: true, characterData: true, attributes: true });

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

      {/* Quality / diagnostics launcher */}
      <button
        onClick={() => setQPanelOpen((v) => !v)}
        title="VR quality & diagnostics"
        className="absolute right-3 top-3 z-40 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur hover:bg-black/85"
      >
        <Gauge className="h-4 w-4 text-cyan-300" />
        <span>{diag ? `${diag.fps}fps · ${diag.effectivePreset}` : "Quality"}</span>
      </button>

      {qPanelOpen && (
        <div className="absolute right-3 top-14 z-40 w-[300px] max-w-[92vw] rounded-xl border border-white/15 bg-black/85 p-3 text-[12px] text-white shadow-2xl backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
            <p className="flex items-center gap-1.5 font-bold text-cyan-300">
              <Sliders className="h-3.5 w-3.5" /> VR Quality
            </p>
            <button onClick={() => setQPanelOpen(false)} className="grid h-6 w-6 place-items-center rounded-full hover:bg-white/10">
              <X className="h-3 w-3" />
            </button>
          </div>

          <div className="mb-3 grid grid-cols-4 gap-1">
            {(["auto", "crisp", "balanced", "performance"] as QualityPreset[]).map((p) => (
              <button
                key={p}
                onClick={() => { setPreset(p); engineRef.current?.setQualityPreset(p); }}
                className={`rounded-md px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition ${
                  preset === p
                    ? "bg-cyan-500 text-black"
                    : "bg-white/10 text-white/80 hover:bg-white/20"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {diag ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[11px]">
              <span className="text-white/50">Mode</span>
              <span>{diag.presenting ? "In VR" : "Preview"}</span>
              <span className="text-white/50">FPS</span>
              <span>{diag.fps} <span className="text-white/40">(avg {diag.avgFps})</span></span>
              <span className="text-white/50">FB scale</span>
              <span>{diag.framebufferScale.toFixed(2)}×</span>
              <span className="text-white/50">Foveation</span>
              <span>{diag.foveation.toFixed(2)} {diag.foveation === 0 ? "(off)" : ""}</span>
              <span className="text-white/50">Anisotropy</span>
              <span>{diag.anisotropy}/{diag.maxAnisotropy}</span>
              <span className="text-white/50">Mipmaps</span>
              <span>{diag.mipmaps ? "on" : "off"} · {diag.minFilter}</span>
              <span className="text-white/50">Texture</span>
              <span>{diag.textureWidth}×{diag.textureHeight}</span>
              <span className="text-white/50">Loading</span>
              <span>{diag.loading ? (diag.loadingLabel || "…") : "idle"}</span>
              {diag.autoDowngraded && (
                <>
                  <span className="text-amber-300">Auto</span>
                  <span className="text-amber-300">downgraded → {diag.effectivePreset}</span>
                </>
              )}
            </div>
          ) : (
            <p className="text-white/60">Waiting for engine frame…</p>
          )}

          <p className="mt-3 border-t border-white/10 pt-2 text-[10px] leading-relaxed text-white/50">
            In headset: <b>Left grip</b> toggles the in-VR panel · <b>Right grip</b> cycles presets.
          </p>
        </div>
      )}
    </div>
  );

}

// Back-compat alias for the old import name.
export const VRPanoramaViewer = VRTourViewer;
