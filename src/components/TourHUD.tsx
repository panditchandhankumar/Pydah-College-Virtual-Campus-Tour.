import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Home,
  Map as MapIcon,
  ArrowLeft,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Glasses,
  HelpCircle,
  X,
} from "lucide-react";
import type { Panorama } from "@/data/panoramas";

interface Props {
  active: Panorama;
  onHome: () => void;
  onToggleMap: () => void;
  mapOpen: boolean;
  onBack: () => void;
  canBack: boolean;
}

/**
 * Floating glass navigation panel — visible on every panorama.
 * Buttons: Main Gate | Campus Map | Back | Voice Guide | Fullscreen | Enter VR | Help
 */
export function TourHUD({ active, onHome, onToggleMap, mapOpen, onBack, canBack }: Props) {
  const [speaking, setSpeaking] = useState(false);
  const [isFull, setIsFull] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const onFs = () => setIsFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Cancel any narration when panorama changes
  useEffect(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [active.id]);

  function toggleVoice() {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(`${active.title}. ${active.description}`);
    utter.rate = 1;
    utter.pitch = 1;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
  }

  async function toggleFull() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      /* ignored */
    }
  }

  const btn =
    "group relative grid h-11 w-11 place-items-center rounded-full text-white/95 transition hover:bg-white/20 hover:text-white";
  const tip =
    "pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white opacity-0 shadow group-hover:opacity-100";

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center px-4">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/20 bg-black/50 px-2 py-2 shadow-2xl backdrop-blur-xl">
          <button onClick={onHome} className={btn} aria-label="Main Gate">
            <Home className="h-5 w-5" />
            <span className={tip}>Main Gate</span>
          </button>

          <button
            onClick={onToggleMap}
            className={`${btn} ${mapOpen ? "bg-white/20" : ""}`}
            aria-label="Campus Map"
          >
            <MapIcon className="h-5 w-5" />
            <span className={tip}>Campus Map</span>
          </button>

          <button
            onClick={onBack}
            disabled={!canBack}
            className={`${btn} ${canBack ? "" : "opacity-40"}`}
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className={tip}>Back</span>
          </button>

          <button
            onClick={toggleVoice}
            className={`${btn} ${speaking ? "bg-accent text-black hover:bg-accent" : ""}`}
            aria-label="Voice Guide"
          >
            {speaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            <span className={tip}>{speaking ? "Stop Voice" : "Voice Guide"}</span>
          </button>

          <button onClick={toggleFull} className={btn} aria-label="Fullscreen">
            {isFull ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            <span className={tip}>{isFull ? "Exit Fullscreen" : "Fullscreen"}</span>
          </button>

          <Link
            to="/vr"
            search={{ id: active.id }}
            className={btn}
            aria-label="Enter VR"
          >
            <Glasses className="h-5 w-5" />
            <span className={tip}>Enter VR</span>
          </Link>

          <button onClick={() => setHelpOpen(true)} className={btn} aria-label="Help">
            <HelpCircle className="h-5 w-5" />
            <span className={tip}>Help</span>
          </button>
        </div>
      </div>

      {helpOpen && (
        <div
          className="absolute inset-0 z-30 grid place-items-center bg-black/60 backdrop-blur-sm"
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-white/15 bg-black/80 p-6 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setHelpOpen(false)}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20"
              aria-label="Close help"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="font-display text-xl font-bold text-accent">How to explore</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/85">
              <li>• Drag the scene to look around in 360°.</li>
              <li>• Click a blue disc hotspot to walk to that location.</li>
              <li>• Use the Campus Map to jump anywhere instantly.</li>
              <li>• Voice Guide reads the description of the current spot.</li>
              <li>• Enter VR opens the immersive Meta Quest experience.</li>
              <li>• Back returns to the previous panorama.</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
