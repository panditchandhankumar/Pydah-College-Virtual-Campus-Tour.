import { useEffect, useState } from "react";
import { Bug, X } from "lucide-react";
import type { DebugState } from "@/tour-engine/PanoramaEngine";

/**
 * Tree-shakes out of production builds when the toggle is never enabled.
 * `import.meta.env.DEV` guards the UI so the panel is invisible in prod
 * unless someone manually opens `?debug=1`.
 */
const DEV = import.meta.env.DEV;

export function useDebugMode(): [boolean, (v: boolean) => void] {
  const [on, setOn] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const url = new URLSearchParams(window.location.search);
    if (url.get("debug") === "1") return true;
    if (!DEV) return false;
    return window.localStorage.getItem("pydah-debug") === "1";
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "d" || e.key === "D") {
        setOn((v) => {
          const next = !v;
          if (DEV) window.localStorage.setItem("pydah-debug", next ? "1" : "0");
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const setter = (v: boolean) => {
    setOn(v);
    if (DEV) window.localStorage.setItem("pydah-debug", v ? "1" : "0");
  };
  return [on, setter];
}

export function DebugHUD({
  open,
  onToggle,
  state,
}: {
  open: boolean;
  onToggle: () => void;
  state: DebugState | null;
}) {
  // Not visible in production unless explicitly opened via ?debug=1.
  if (!DEV && !open) return null;
  if (!open) {
    return (
      <button
        onClick={onToggle}
        title="Open Debug (D)"
        className="absolute right-3 top-3 z-40 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white ring-1 ring-white/20 backdrop-blur hover:bg-black/80"
      >
        <Bug className="h-4 w-4" />
      </button>
    );
  }
  return (
    <div className="absolute right-3 top-3 z-40 w-[340px] max-w-[90vw] rounded-xl border border-white/15 bg-black/85 p-3 font-mono text-[11px] text-white shadow-2xl backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
        <p className="flex items-center gap-1.5 font-bold text-emerald-300">
          <Bug className="h-3.5 w-3.5" /> Debug HUD
        </p>
        <button onClick={onToggle} className="grid h-6 w-6 place-items-center rounded-full hover:bg-white/10">
          <X className="h-3 w-3" />
        </button>
      </div>
      {state ? (
        <>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            <span className="text-white/50">Mode</span>
            <span>{state.presenting ? "WebXR (VR)" : "Desktop / 2D"}</span>
            <span className="text-white/50">Panorama</span>
            <span className="truncate">{state.panoramaId ?? "—"}</span>
            <span className="text-white/50">FPS</span>
            <span>{state.fps}</span>
            <span className="text-white/50">Camera yaw</span>
            <span>{state.cameraYaw}°</span>
            <span className="text-white/50">Camera pitch</span>
            <span>{state.cameraPitch}°</span>
            <span className="text-white/50">Hotspots</span>
            <span>{state.hotspots.length}</span>
          </div>
          <div className="mt-2 max-h-72 overflow-y-auto rounded border border-white/10">
            <table className="w-full text-[10px]">
              <thead className="sticky top-0 bg-black/90 text-emerald-300">
                <tr>
                  <th className="px-1 py-1 text-left">#</th>
                  <th className="px-1 text-left">target</th>
                  <th className="px-1 text-right">yaw</th>
                  <th className="px-1 text-right">pitch</th>
                  <th className="px-1 text-right">dist</th>
                </tr>
              </thead>
              <tbody>
                {state.hotspots.map((h) => (
                  <tr
                    key={h.index}
                    className={`border-t border-white/5 ${
                      h.selected ? "bg-orange-500/20" : h.hovered ? "bg-emerald-500/15" : ""
                    } ${h.visible ? "" : "text-white/40"}`}
                    title={`world (${h.world.x}, ${h.world.y}, ${h.world.z})`}
                  >
                    <td className="px-1 py-0.5">{h.index}</td>
                    <td className="px-1 truncate max-w-[110px]">{h.targetId}</td>
                    <td className="px-1 text-right">{h.yaw.toFixed(1)}</td>
                    <td className="px-1 text-right">{h.pitch.toFixed(1)}</td>
                    <td className="px-1 text-right">{h.distance.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[10px] text-white/40">
            Press <b>D</b> to toggle · <b>?debug=1</b> forces on in production
          </p>
        </>
      ) : (
        <p className="text-white/60">Waiting for engine frame…</p>
      )}
    </div>
  );
}
