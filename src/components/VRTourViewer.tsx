import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PanoramaEngine, type DebugState, type DiagnosticsState, type QualityPreset } from "@/tour-engine/PanoramaEngine";
import type { Panorama } from "@/data/panoramas";
import { useHotspotStore } from "@/lib/hotspotStore";
import { DebugHUD, useDebugMode } from "./DebugHUD";
import { Gauge, Sliders, X, Terminal } from "lucide-react";

interface Props {
  panorama: Panorama;
  onChange: (id: string) => void;
}

type VrLog = { ts: number; level: "info" | "warn" | "error"; msg: string };


const VR_START_TIMEOUT_MS = 15_000;

function getVrErrorMessage(error: unknown) {
  const name = error instanceof DOMException || error instanceof Error ? error.name : "";
  if (name === "NotSupportedError") return "This browser or headset does not support WebXR VR.";
  if (name === "SecurityError") return "VR permission was blocked. Open this page in a secure Quest browser tab.";
  if (name === "NotAllowedError") return "VR permission was denied. Please allow VR and try again.";
  if (name === "AbortError") return "VR startup was cancelled. Please retry.";
  if (error instanceof Error && error.message.includes("timed out")) {
    return "VR startup timed out. Please retry from the headset browser.";
  }
  return "VR could not start. Please retry.";
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
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
 * The visible VR button starts WebXR directly so we can keep Quest session
 * options stable and avoid black-screen XR layer paths.
 */
export function VRTourViewer({ panorama, onChange }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const visibleBtnRef = useRef<HTMLButtonElement>(null);
  const xrSessionRef = useRef<any>(null);
  const canStartVrRef = useRef(false);
  const vrStartInFlightRef = useRef(false);
  const vrStartAttemptRef = useRef(0);
  const engineRef = useRef<PanoramaEngine | null>(null);
  const navigate = useNavigate();
  const [status, setStatus] = useState("Loading campus…");
  const [debugOn, setDebugOn] = useDebugMode();
  const [debugState, setDebugState] = useState<DebugState | null>(null);
  const [vrText, setVrText] = useState("CHECKING VR…");
  const [vrDisabled, setVrDisabled] = useState(true);
  const [diag, setDiag] = useState<DiagnosticsState | null>(null);
  const [qPanelOpen, setQPanelOpen] = useState(false);
  const [preset, setPreset] = useState<QualityPreset>("auto");
  const [vrError, setVrError] = useState(false);
  const [vrLogs, setVrLogs] = useState<VrLog[]>([]);
  const [logsOpen, setLogsOpen] = useState(false);
  const logRef = useRef<(level: VrLog["level"], msg: string) => void>(() => {});
  logRef.current = (level, msg) => {
    const entry: VrLog = { ts: Date.now(), level, msg };
    setVrLogs((prev) => [...prev.slice(-49), entry]);
    const line = `[VR] ${msg}`;
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.info(line);
  };
  const vrLog = (level: VrLog["level"], msg: string) => logRef.current(level, msg);

  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new PanoramaEngine(mountRef.current, { xr: true });
    engineRef.current = engine;

    engine.setCallbacks({
      onNavigate: (id) => onChange(id),
      onLoadStart: (t) => setStatus(`Loading ${t}…`),
      onLoadEnd: () => setStatus(""),
      onLoadError: () => {
        setStatus("Panorama image could not load. Showing fallback scene.");
        window.setTimeout(() => {
          if (!cancelled) setStatus("");
        }, 2500);
      },
      onDebug: setDebugState,
      onDiagnostics: setDiag,
    });
    engine.setQualityPreset("auto");

    const xr = (navigator as Navigator & { xr?: any }).xr;
    let cancelled = false;
    let removeCurrentSessionEndListener: (() => void) | null = null;

    const setReadyToEnter = () => {
      canStartVrRef.current = true;
      vrStartInFlightRef.current = false;
      setVrText("ENTER VR");
      setVrDisabled(false);
    };

    const clearSessionEndListener = () => {
      removeCurrentSessionEndListener?.();
      removeCurrentSessionEndListener = null;
    };

    const recoverFromFailedStart = async (message: string, session?: any) => {
      vrLog("error", `Recovering: ${message}`);
      vrStartAttemptRef.current += 1;
      vrStartInFlightRef.current = false;
      canStartVrRef.current = false;
      clearSessionEndListener();
      engine.cancelXRSessionRequest();
      xrSessionRef.current = null;
      try { await session?.end?.(); vrLog("info", "Prior session ended cleanly"); } catch (e) { vrLog("warn", `session.end() threw: ${(e as Error)?.message ?? e}`); }
      if (!cancelled) {
        setVrError(true);
        setStatus(message);
        setReadyToEnter();
        vrLog("info", "Retry VR is now available");
      }
    };

    const onSessionEnded = () => {
      vrLog("info", "XR session ended");
      clearSessionEndListener();
      xrSessionRef.current = null;
      engine.cancelXRSessionRequest();
      vrStartInFlightRef.current = false;
      if (!cancelled) {
        setVrError(false);
        setStatus("");
        setReadyToEnter();
      }
    };

    if (!xr) {
      canStartVrRef.current = false;
      const label = window.isSecureContext ? "VR NOT AVAILABLE" : "WEBXR NEEDS HTTPS";
      setVrText(label);
      setVrDisabled(true);
      vrLog("warn", `navigator.xr unavailable → ${label}`);
    } else {
      vrLog("info", "Checking immersive-vr support…");
      withTimeout<boolean>(xr.isSessionSupported("immersive-vr") as Promise<boolean>, 6_000, "VR support check")
        .then((supported: boolean) => {
          if (cancelled) return;
          canStartVrRef.current = supported;
          setVrText(supported ? "ENTER VR" : "VR NOT SUPPORTED");
          setVrDisabled(!supported);
          vrLog(supported ? "info" : "warn", `isSessionSupported → ${supported}`);
        })
        .catch((e) => {
          if (cancelled) return;
          canStartVrRef.current = false;
          setVrText("VR NOT ALLOWED");
          setVrDisabled(true);
          vrLog("error", `Support check failed: ${(e as Error)?.message ?? e}`);
        });
    }

    const onVisibleClick = async () => {
      if (!xr || !canStartVrRef.current || vrStartInFlightRef.current) {
        vrLog("warn", `Click ignored (xr=${!!xr} canStart=${canStartVrRef.current} inFlight=${vrStartInFlightRef.current})`);
        return;
      }
      if (xrSessionRef.current) {
        vrLog("info", "Exit VR requested — ending session");
        try { await xrSessionRef.current.end(); } catch (e) { vrLog("warn", `end() failed: ${(e as Error)?.message ?? e}`); }
        return;
      }

      const attemptId = vrStartAttemptRef.current + 1;
      vrStartAttemptRef.current = attemptId;
      vrStartInFlightRef.current = true;
      canStartVrRef.current = false;
      setVrDisabled(true);
      setVrText("OPENING VR…");
      setStatus("Opening VR…");
      setVrError(false);
      engine.beginXRSessionRequest();
      vrLog("info", `Attempt #${attemptId}: requesting XR session (timeout ${VR_START_TIMEOUT_MS}ms)`);

      let session: any = null;
      try {
        const requestSession = xr.requestSession("immersive-vr", {
          optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
        }).then((startedSession: any) => {
          vrLog("info", "Browser resolved requestSession()");
          if (cancelled || attemptId !== vrStartAttemptRef.current) {
            try { startedSession?.end?.(); } catch { /* ignore */ }
            throw new DOMException("VR start was cancelled", "AbortError");
          }
          return startedSession;
        });
        requestSession.catch(() => { /* consumed by timeout race */ });
        session = await withTimeout(requestSession, VR_START_TIMEOUT_MS, "VR session request");
        vrLog("info", "Session acquired — attaching to renderer");

        clearSessionEndListener();
        session.addEventListener("end", onSessionEnded, { once: true });
        removeCurrentSessionEndListener = () => session?.removeEventListener?.("end", onSessionEnded);
        xrSessionRef.current = session;
        await withTimeout(engine.renderer.xr.setSession(session), VR_START_TIMEOUT_MS, "VR renderer setup");
        if (cancelled || attemptId !== vrStartAttemptRef.current) {
          await recoverFromFailedStart("VR startup was cancelled. Please retry.", session);
          return;
        }
        vrLog("info", "VR renderer attached — entering headset");
        vrStartInFlightRef.current = false;
        canStartVrRef.current = true;
        setVrText("EXIT VR");

        setVrDisabled(false);
        setStatus("");
        setVrError(false);
      } catch (err) {
        if (import.meta.env.DEV) console.warn("Unable to start WebXR session", err);
        await recoverFromFailedStart(getVrErrorMessage(err), session);
      }
    };
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
      cancelled = true;
      vrStartAttemptRef.current += 1;
      vrStartInFlightRef.current = false;
      clearSessionEndListener();
      visibleBtnRef.current?.removeEventListener("click", onVisibleClick);
      unsubscribe();
      try { xrSessionRef.current?.end?.(); } catch { /* ignore */ }
      engine.dispose();
      engineRef.current = null;
      xrSessionRef.current = null;
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
          disabled={vrDisabled}
          className="inline-flex items-center justify-center gap-2.5 rounded-full border-2 border-white/35 bg-[rgba(0,33,71,0.92)] px-6 py-3 text-[15px] font-bold uppercase tracking-wider text-white shadow-[0_8px_32px_rgba(0,0,0,0.55)] transition hover:opacity-90 active:scale-95 whitespace-nowrap"
          style={{ opacity: vrDisabled ? 0.55 : 1, cursor: vrDisabled ? "not-allowed" : "pointer" }}
        >
          <VRIcon className="h-[22px] w-[22px] flex-shrink-0" />
          {vrText}
        </button>
      </div>

      {status && (
        <div className={`${vrError ? "pointer-events-auto" : "pointer-events-none"} absolute inset-0 grid place-items-center bg-black/50 backdrop-blur-sm`}>
          <div className="flex max-w-[min(92vw,420px)] flex-col items-center gap-3 rounded-2xl bg-black/55 px-6 py-5 text-center text-white ring-1 ring-white/15">
            {!vrError && <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-accent" />}
            <p className="text-sm">{status}</p>
            {vrError && (
              <div className="flex flex-col items-stretch gap-2">
                <button
                  onClick={() => {
                    setVrError(false);
                    setStatus("");
                    vrLog("info", "User tapped Retry VR");
                    // Defer to next tick so state resets before the click re-fires.
                    setTimeout(() => visibleBtnRef.current?.click(), 0);
                  }}
                  className="rounded-full bg-cyan-400 px-5 py-2 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-cyan-300"
                >
                  Retry VR
                </button>
                <button
                  onClick={() => setLogsOpen(true)}
                  className="rounded-full bg-white/10 px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-white/90 hover:bg-white/20"
                >
                  View diagnostics
                </button>
              </div>
            )}

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

      {/* VR diagnostics log launcher */}
      <button
        onClick={() => setLogsOpen((v) => !v)}
        title="VR startup logs"
        className="absolute right-3 top-14 z-40 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-2 text-[11px] font-semibold text-white ring-1 ring-white/20 backdrop-blur hover:bg-black/85"
      >
        <Terminal className="h-3.5 w-3.5 text-emerald-300" />
        <span>Logs ({vrLogs.length})</span>
      </button>

      {logsOpen && (
        <div className="absolute right-3 top-[100px] z-40 w-[360px] max-w-[92vw] rounded-xl border border-white/15 bg-black/90 p-3 text-[11px] text-white shadow-2xl backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
            <p className="flex items-center gap-1.5 font-bold text-emerald-300">
              <Terminal className="h-3.5 w-3.5" /> VR Diagnostics
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setVrLogs([])}
                className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider hover:bg-white/20"
              >
                Clear
              </button>
              <button onClick={() => setLogsOpen(false)} className="grid h-6 w-6 place-items-center rounded-full hover:bg-white/10">
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto font-mono leading-snug">
            {vrLogs.length === 0 ? (
              <p className="py-6 text-center text-white/50">No VR events yet. Tap Enter VR to begin.</p>
            ) : (
              vrLogs.map((l, i) => {
                const color = l.level === "error" ? "text-red-300" : l.level === "warn" ? "text-amber-300" : "text-white/85";
                const time = new Date(l.ts).toLocaleTimeString(undefined, { hour12: false });
                return (
                  <div key={i} className={`${color} border-b border-white/5 py-1`}>
                    <span className="text-white/40">{time}</span> {l.msg}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>

  );

}

// Back-compat alias for the old import name.
export const VRPanoramaViewer = VRTourViewer;
