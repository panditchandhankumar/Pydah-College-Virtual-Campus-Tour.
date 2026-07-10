import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import logoAsset from "@/assets/pydah-logo.png.asset.json";


const links = [
  { to: "/", label: "Home" },
  { to: "/tour", label: "Virtual Tour" },
  { to: "/departments", label: "Departments" },
  { to: "/gallery", label: "Gallery" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto mt-4 max-w-7xl px-4">
        <nav className="glass flex items-center justify-between rounded-2xl px-4 py-3 shadow-sm">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoAsset.url} alt="PYDAH College of Engineering" className="h-11 w-auto" />
            <span className="hidden sm:flex flex-col leading-tight">
              <span className="font-display text-base font-bold text-primary">Pydah College of Engineering</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-secondary">An Autonomous Institution</span>
            </span>
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {links.map((l) => {
              const active = pathname === l.to;
              return (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/80 hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="hidden md:block">
            <Link
              to="/tour"
              className="rounded-full bg-gradient-to-r from-secondary to-accent px-5 py-2 text-sm font-semibold text-white shadow-elegant transition-transform hover:scale-105"
            >
              Start Tour
            </Link>
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {open && (
          <div className="glass mt-2 rounded-2xl p-3 md:hidden">
            <ul className="flex flex-col gap-1">
              {links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className={`block rounded-xl px-4 py-3 text-sm font-medium ${
                      pathname === l.to
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/80 hover:bg-primary/10"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
