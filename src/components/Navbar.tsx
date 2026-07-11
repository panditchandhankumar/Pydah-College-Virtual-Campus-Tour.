import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, Search, User } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoAsset from "@/assets/pydah-logo.png.asset.json";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About us" },
  { to: "/departments", label: "Academics" },
  { to: "/tour", label: "Virtual Tour" },
  { to: "/gallery", label: "Campus Life" },
  { to: "/placements", label: "Placements" },
  { to: "/contact", label: "Contact Us" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const now = new Date();
  const stamp = `${String(now.getDate()).padStart(2, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}  ${now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;

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

          <div className="ml-auto hidden flex-col items-end gap-3 md:flex">
            <div className="flex items-center gap-6 text-sm font-semibold">
              <button className="flex items-center gap-1.5 text-foreground hover:text-primary">
                <User className="h-4 w-4" /> Student Login
              </button>
              <button className="flex items-center gap-1.5 text-primary hover:opacity-80">
                <Search className="h-4 w-4" /> Search
              </button>
            </div>
            <p className="text-xs italic text-muted-foreground">Last Updated on {stamp}</p>
          </div>

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
