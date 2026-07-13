import { motion, AnimatePresence } from "framer-motion";
import { X, Compass, ExternalLink, Building2, BookOpen, GraduationCap, Home, Trophy, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import campusTourVideo from "@/assets/campus-tour.mp4.asset.json";
import pydahCampusPoster from "@/assets/pydah-campus.jpg.asset.json";

interface Props {
  open: boolean;
  onClose: () => void;
}

const QUICK_LINKS = [
  { id: "main-gate", label: "Main Gate", Icon: Compass },
  { id: "administration", label: "Admin Block", Icon: Building2 },
  { id: "library", label: "Library", Icon: BookOpen },
  { id: "cse-block", label: "CSE Block", Icon: GraduationCap },
  { id: "hostel", label: "Hostel", Icon: Home },
  { id: "playground", label: "Sports", Icon: Trophy },
];

/**
 * Full-screen cinematic intro that plays the campus flyover locally, with a vertical
 * stack of circular navigation buttons on the right — inspired by VIT's
 * virtual tour landing.
 */
export function IntroVideoModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"loading" | "playing" | "buffering" | "error">("loading");

  useEffect(() => {
    if (!open) {
      setStatus("loading");
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [open]);

  const openTour = (id: string) => {
    onClose();
    navigate({ to: "/tour", search: { id } });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black"
        >
          {/* Fullscreen background video — served from the project CDN so it plays smoothly even on slower networks. */}
          <div className="absolute inset-0 overflow-hidden bg-black">
            <video
              ref={videoRef}
              src={campusTourVideo.url}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={pydahCampusPoster.url}
              className="absolute inset-0 h-full w-full object-cover"
              aria-label="PYDAH Campus Flyover"
              onCanPlay={() => setStatus((s) => (s === "error" ? "error" : "playing"))}
              onWaiting={() => setStatus("buffering")}
              onPlaying={() => setStatus("playing")}
              onStalled={() => setStatus("buffering")}
              onError={() => setStatus("error")}
            />

            {/* Loading / buffering indicator */}
            {(status === "loading" || status === "buffering") && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-black/60 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3 text-white">
                  <Loader2 className="h-10 w-10 animate-spin" />
                  <p className="text-sm font-medium tracking-wide">
                    {status === "loading" ? "Loading campus experience…" : "Buffering…"}
                  </p>
                </div>
              </div>
            )}

            {/* Error fallback */}
            {status === "error" && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-black/70 px-6 text-center">
                <div className="max-w-md text-white">
                  <p className="text-lg font-semibold">Unable to play the campus video</p>
                  <p className="mt-2 text-sm text-white/80">
                    Your network may be too slow. Please try again or start the 360° tour below.
                  </p>
                  <button
                    onClick={() => {
                      setStatus("loading");
                      videoRef.current?.load();
                    }}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-bold text-accent-foreground"
                  >
                    <Loader2 className="h-4 w-4" />
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Vignette */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.65) 100%)",
            }}
          />

          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Close video"
            className="absolute right-5 top-5 z-20 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Top-left title */}
          <div className="absolute left-6 top-6 z-20 text-white drop-shadow-lg">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Virtual Tour</p>
            <p className="mt-1 font-display text-xl font-semibold md:text-2xl">
              PYDAH College Campus
            </p>
          </div>

          {/* Vertical quick-access buttons on the right */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 md:right-8"
          >
            <div className="flex flex-col items-center gap-4">
              {QUICK_LINKS.map(({ id, label, Icon }, i) => (
                <motion.button
                  key={id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.08 }}
                  onClick={() => openTour(id)}
                  className="group relative flex items-center"
                >
                  {/* Label tooltip */}
                  <span className="absolute right-full mr-3 whitespace-nowrap rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                    {label}
                  </span>
                  <span
                    className="grid h-14 w-14 place-items-center rounded-full text-white ring-2 ring-white/40 shadow-glow transition-transform group-hover:scale-110 md:h-16 md:w-16"
                    style={{
                      background:
                        "radial-gradient(circle at 30% 30%, #2b3990, #1a1f6b 70%)",
                    }}
                  >
                    <Icon className="h-6 w-6 md:h-7 md:w-7" />
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Bottom CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="absolute inset-x-0 bottom-6 z-20 flex flex-col items-center gap-3 px-6 md:bottom-10"
          >
            <button
              onClick={() => openTour("main-gate")}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-bold text-accent-foreground shadow-glow transition-transform hover:scale-105"
            >
              <Compass className="h-4 w-4" />
              Start Campus Tour
            </button>
            <a
              href="https://pydah.edu.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Visit Official Website
            </a>
            <p className="max-w-2xl text-center text-[11px] italic text-white/70">
              Best experienced with Google Cardboard VR on a phone with a 5.5″+ display and gyroscopic sensor.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
