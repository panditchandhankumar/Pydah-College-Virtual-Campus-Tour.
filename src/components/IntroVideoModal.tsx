import { motion, AnimatePresence } from "framer-motion";
import { X, Compass, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Cinematic intro that plays the campus flyover on YouTube with
 * floating action buttons (Campus Tour, Visit Website) — inspired by
 * the VIT virtual-tour landing overlay.
 */
export function IntroVideoModal({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm"
          onClick={onClose}
        >
          <button
            onClick={onClose}
            aria-label="Close video"
            className="absolute right-5 top-5 z-20 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="absolute inset-0 flex items-center justify-center p-0">
            <div
              className="relative h-full w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* YouTube background video (autoplay, muted, looped, hidden controls) */}
              <iframe
                className="absolute inset-0 h-full w-full"
                src="https://www.youtube.com/embed/iJyZLRkJuWk?autoplay=1&mute=1&controls=0&loop=1&playlist=iJyZLRkJuWk&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&playsinline=1"
                title="PYDAH Campus Flyover"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />

              {/* Soft vignette so buttons pop */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)",
                }}
              />

              {/* Overlay action buttons */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end gap-6 px-6 pb-[14vh] md:justify-center md:pb-0">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="pointer-events-auto flex flex-col items-center gap-6"
                >
                  <Link
                    to="/tour"
                    search={{ id: "main-gate" }}
                    onClick={onClose}
                    className="group grid h-36 w-36 place-items-center rounded-full text-center text-base font-bold text-white shadow-glow ring-4 ring-white/30 transition-transform hover:scale-110"
                    style={{
                      background:
                        "radial-gradient(circle at 30% 30%, #4c1d95, #2e1065 70%)",
                    }}
                  >
                    <span className="flex flex-col items-center gap-1 leading-tight">
                      <Compass className="h-6 w-6" />
                      Campus
                      <span>Tour</span>
                    </span>
                  </Link>

                  <p className="max-w-3xl text-center text-xs italic text-white/80 md:text-sm">
                    Best experienced with Google Cardboard VR on a phone with a
                    5.5″+ display and gyroscopic sensor.
                  </p>

                  <a
                    href="https://pydah.edu.in"
                    target="_blank"
                    rel="noreferrer"
                    className="group grid h-32 w-32 place-items-center rounded-full text-center text-sm font-bold text-white shadow-glow ring-4 ring-white/30 transition-transform hover:scale-110"
                    style={{
                      background:
                        "radial-gradient(circle at 30% 30%, #4c1d95, #2e1065 70%)",
                    }}
                  >
                    <span className="flex flex-col items-center gap-1 leading-tight">
                      <ExternalLink className="h-5 w-5" />
                      Visit
                      <span>Website</span>
                    </span>
                  </a>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
