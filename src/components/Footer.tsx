import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";
import logoAsset from "@/assets/pydah-logo.png.asset.json";

export function Footer() {
  return (
    <footer className="mt-24 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-white p-1">
              <img src={logoAsset.url} alt="PYDAH" className="h-full w-full object-contain" />
            </span>
            <span className="font-display text-lg font-semibold">PYDAH College<br/><span className="text-xs font-normal text-white/60">of Engineering</span></span>
          </div>
          <p className="mt-4 text-sm text-white/70">
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
            <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0" /> Kakinada, Andhra Pradesh, India</li>
            <li className="flex gap-2"><Phone className="h-4 w-4 shrink-0" /> +91 000 000 0000</li>
            <li className="flex gap-2"><Mail className="h-4 w-4 shrink-0" /> hello@pydah.example</li>
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
              className="w-full rounded-full bg-white/10 px-4 py-2 text-sm placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
              Join
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-6 py-6 text-xs text-white/60">
          © {new Date().getFullYear()} PYDAH College — Virtual Tour. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
