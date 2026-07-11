import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import logoAsset from "@/assets/pydah-logo.png.asset.json";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white p-1.5 shadow-sm">
              <img src={logoAsset.url} alt="PYDAH" className="h-full w-full object-contain" />
            </span>
            <span className="font-display text-lg font-semibold leading-tight">
              PYDAH College
              <span className="block text-xs font-normal text-white/60">of Engineering</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
            An immersive virtual campus experience — explore every corner of PYDAH from anywhere in the world.
          </p>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">
            Explore
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li><Link to="/tour" className="hover:text-accent">Virtual Tour</Link></li>
            <li><Link to="/departments" className="hover:text-accent">Departments</Link></li>
            <li><Link to="/gallery" className="hover:text-accent">Gallery</Link></li>
            <li><Link to="/about" className="hover:text-accent">About</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">
            Reach us
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-accent" /> Kakinada, Andhra Pradesh, India</li>
            <li className="flex gap-2"><Phone className="h-4 w-4 shrink-0 text-accent" /> +91 000 000 0000</li>
            <li className="flex gap-2"><Mail className="h-4 w-4 shrink-0 text-accent" /> hello@pydah.example</li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">
            Newsletter
          </h4>
          <p className="mt-4 text-sm text-white/70">Campus updates in your inbox.</p>
          <form onSubmit={(e) => e.preventDefault()} className="mt-3 flex gap-2">
            <input
              type="email"
              placeholder="you@email.com"
              className="w-full rounded-full bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground transition hover:brightness-110">
              Join
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 md:flex-row">
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} PYDAH College — Virtual Tour. All rights reserved.
          </p>

          <div className="flex items-center gap-2 rounded-full bg-black/20 px-4 py-2 ring-1 ring-white/10">
            {[
              { Icon: Facebook, href: "#", label: "Facebook" },
              { Icon: Instagram, href: "#", label: "Instagram" },
              { Icon: Linkedin, href: "#", label: "LinkedIn" },
              { Icon: Youtube, href: "#", label: "YouTube" },
            ].map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="grid h-8 w-8 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
