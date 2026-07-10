import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoAsset from "@/assets/pydah-logo.png.asset.json";

const links = [
  { to: "/", label: "Home" },
  { to: "/tour", label: "Virtual Tour" },
  { to: "/departments", label: "Departments" },
  { to: "/gallery", label: "Gallery" },
  { to: "/placements", label: "Placements" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const transparent = onHome && !scrolled;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "backdrop-blur-xl bg-white/80 shadow-[0_8px_30px_-12px_rgba(7,27,68,0.15)]" : ""
      }`}
      style={{ height: 90 }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoAsset.url} alt="PYDAH" className="h-12 w-auto" />
          <span className="hidden sm:flex flex-col leading-tight">
            <span
              className={`font-display text-[17px] font-bold tracking-tight transition-colors ${
                transparent ? "text-white" : "text-primary"
              }`}
            >
              Pydah College of Engineering
            </span>
            <span
              className={`text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                transparent ? "text-white/70" : "text-secondary"
              }`}
            >
              An Autonomous Institution
            </span>
          </span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => {
            const active = pathname === l.to;
            return (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className={`group relative px-4 py-2 text-[15px] font-medium transition-colors ${
                    transparent
                      ? active ? "text-white" : "text-white/85 hover:text-white"
                      : active ? "text-primary" : "text-foreground/75 hover:text-primary"
                  }`}
                >
                  {l.label}
                  <span
                    className={`pointer-events-none absolute left-4 right-4 -bottom-0.5 h-[2px] origin-left rounded-full bg-accent transition-transform duration-300 ${
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden lg:block">
          <Link
            to="/tour"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-secondary to-accent px-5 py-2.5 text-[15px] font-semibold text-white shadow-[0_10px_30px_-8px_rgba(0,102,255,0.6)] transition-all hover:scale-[1.03] hover:shadow-[0_14px_40px_-8px_rgba(40,199,250,0.7)]"
          >
            Start Tour
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className={`grid h-11 w-11 place-items-center rounded-xl lg:hidden ${
            transparent ? "bg-white/15 text-white backdrop-blur" : "bg-primary/10 text-primary"
          }`}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mx-4 mt-2 rounded-2xl bg-white/95 p-3 shadow-xl backdrop-blur-xl lg:hidden"
          >
            <ul className="flex flex-col gap-1">
              {links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className={`block rounded-xl px-4 py-3 text-[15px] font-medium ${
                      pathname === l.to
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/80 hover:bg-primary/10"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <Link
                  to="/tour"
                  onClick={() => setOpen(false)}
                  className="block rounded-xl bg-gradient-to-r from-secondary to-accent px-4 py-3 text-center text-[15px] font-semibold text-white"
                >
                  Start Virtual Tour
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
