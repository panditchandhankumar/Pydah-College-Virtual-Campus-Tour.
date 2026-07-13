import { Link, useRouterState } from "@tanstack/react-router";
import { Lock, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoAsset from "@/assets/pydah-logo.png.asset.json";

const links = [
  { to: "/", label: "Home" },
  { to: "/tour", label: "Virtual Tour" },
  { to: "/vr", label: "Enter VR" },
  { to: "/gallery", label: "Campus Life" },
  { to: "/about", label: "About us" },
  { to: "/contact", label: "Contact Us" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [stamp, setStamp] = useState<string>("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const now = new Date();
    setStamp(
      `${String(now.getDate()).padStart(2, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}  ${now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`,
    );
  }, []);

  return (
    <header className="sticky top-0 z-50 shadow-sm">
      {/* Top white band */}
      <div className="border-t-4 border-primary bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-4">
          <Link to="/" className="flex items-center gap-5">
            <img src={logoAsset.url} alt="PYDAH" className="h-16 w-auto" />
            <div className="hidden border-l-2 border-primary pl-5 sm:block">
              <h1 className="font-display text-2xl font-bold leading-tight text-primary md:text-3xl">
                Pydah College of Engineering
              </h1>
              <p className="text-sm font-medium text-foreground/80">An Autonomous Institution</p>
              <p className="mt-0.5 text-xs text-foreground/70">
                <span className="border-l-2 border-primary pl-2">Permanently Affiliated to JNTU Kakinada</span>
              </p>
              <p className="mt-0.5 text-xs text-foreground/70">
                <span className="border-l-2 border-primary pl-2">Kakinada | Andhra Pradesh | INDIA</span>
              </p>
            </div>
          </Link>

          <div className="ml-auto hidden flex-col items-end gap-2 md:flex">
            {stamp && <p className="text-xs italic text-muted-foreground">Last Updated on {stamp}</p>}
            <Link
              to="/admin-login"
              aria-label="Admin login"
              className="group inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-white/70 px-3 py-1 text-xs font-semibold text-primary/80 shadow-sm backdrop-blur transition duration-200 hover:scale-105 hover:border-primary/60 hover:bg-white hover:text-primary hover:shadow-[0_0_16px_rgba(91,26,91,0.35)]"
            >
              <Lock className="h-3 w-3" />
              Admin
            </Link>
          </div>

          <Link
            to="/admin-login"
            aria-label="Admin login"
            className="ml-auto mr-2 grid h-9 w-9 place-items-center rounded-full border border-primary/20 bg-white/80 text-primary shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white hover:shadow-[0_0_14px_rgba(91,26,91,0.35)] md:hidden"
          >
            <Lock className="h-4 w-4" />
          </Link>

          <button
            onClick={() => setOpen((v) => !v)}
            className="ml-auto grid h-11 w-11 place-items-center rounded-md bg-primary text-white lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Maroon nav band */}
      <nav className="bg-primary">
        <div className="mx-auto hidden max-w-7xl items-center px-6 lg:flex">
          <ul className="flex items-stretch">
            {links.map((l) => {
              const active = pathname === l.to;
              return (
                <li key={l.to} className="relative">
                  <Link
                    to={l.to}
                    className={`block px-5 py-4 text-[15px] font-semibold uppercase tracking-wide text-white/95 transition hover:bg-white/10 ${
                      active ? "bg-white/10" : ""
                    }`}
                  >
                    {l.label}
                    {active && (
                      <span className="absolute left-4 right-4 top-0 h-[3px] rounded-b bg-white" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden"
            >
              <ul className="flex flex-col border-t border-white/10">
                {links.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      onClick={() => setOpen(false)}
                      className={`block px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white/95 ${
                        pathname === l.to ? "bg-white/15" : "hover:bg-white/10"
                      }`}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
