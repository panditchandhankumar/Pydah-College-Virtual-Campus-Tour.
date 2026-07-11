import { PANORAMAS } from "@/data/panoramas";

interface Props {
  currentId: string;
  onSelect: (id: string) => void;
}

/**
 * Campus map — layout based on the official PYDAH College site plan.
 * Coordinates are 0-100 (viewBox 100x100) so panorama map.x/map.y align 1:1.
 */
export function MiniMap({ currentId, onSelect }: Props) {
  return (
    <div className="glass-dark rounded-2xl p-3 text-white">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">Campus Map</p>
        <p className="text-[10px] text-white/60">Click a location</p>
      </div>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gradient-to-br from-emerald-900/40 via-secondary/50 to-primary/80">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          fill="none"
          preserveAspectRatio="none"
        >
          {/* Green campus fill grid */}
          <defs>
            <pattern id="grid" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M 6 0 L 0 0 0 6" fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="0.3" />
            </pattern>
            <filter id="roadShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="0.4" />
            </filter>
          </defs>
          <rect x="0" y="0" width="100" height="100" fill="url(#grid)" />

          {/* Roads — casing (dark) under surface (light) for a premium look */}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Casings */}
            <g stroke="#0b1220" strokeOpacity="0.55" strokeWidth="3.6">
              <path d="M8 12 H82" />
              <path d="M45 12 V92" />
              <path d="M8 55 H92" />
              <path d="M70 55 V80" />
              <path d="M92 12 V80" />
              {/* new connector: cafeteria spur */}
              <path d="M79 42 H86" />
              {/* new connector: seminar hall spur */}
              <path d="M45 46 H52" />
            </g>
            {/* Surfaces */}
            <g stroke="#f5f5dc" strokeOpacity="0.75" strokeWidth="2.2">
              <path d="M8 12 H82" />
              <path d="M45 12 V92" />
              <path d="M8 55 H92" />
              <path d="M70 55 V80" />
              <path d="M92 12 V80" />
              <path d="M79 42 H86" />
              <path d="M45 46 H52" />
            </g>
            {/* Dashed centreline on spine road */}
            <path d="M45 15 V90" stroke="white" strokeOpacity="0.35" strokeWidth="0.35" strokeDasharray="1.4 1.6" />
            <path d="M10 55 H90" stroke="white" strokeOpacity="0.28" strokeWidth="0.3" strokeDasharray="1.2 1.6" />
          </g>

          {/* Building footprints */}
          <g fill="white" fillOpacity="0.10" stroke="white" strokeOpacity="0.35" strokeWidth="0.4">
            {/* Security office */}
            <rect x="40" y="6" width="10" height="5" rx="0.8" />
            {/* Admission block */}
            <rect x="68" y="17" width="16" height="10" rx="0.8" />
            {/* Engineering college (middle block) */}
            <rect x="55" y="34" width="24" height="16" rx="0.8" />
            {/* Faculty room */}
            <rect x="38" y="36" width="10" height="8" rx="0.8" />
            {/* Degree college (far right, tall) */}
            <rect x="86" y="42" width="8" height="30" rx="0.8" />
            {/* NEW — Cafeteria (right of Engineering) */}
            <rect x="82" y="34" width="9" height="8" rx="0.8" fill="#f59e0b" fillOpacity="0.22" stroke="#f59e0b" strokeOpacity="0.7" />
            {/* NEW — Seminar Hall (between Faculty & Engineering) */}
            <rect x="49" y="44" width="9" height="7" rx="0.8" fill="#38bdf8" fillOpacity="0.22" stroke="#38bdf8" strokeOpacity="0.7" />
          </g>

          {/* Central junction — proper roundabout */}
          <g>
            <circle cx="45" cy="55" r="4.2" fill="#0b1220" fillOpacity="0.55" />
            <circle cx="45" cy="55" r="3.4" fill="none" stroke="#f5f5dc" strokeOpacity="0.75" strokeWidth="0.6" />
            <circle cx="45" cy="55" r="1.4" fill="#22c55e" fillOpacity="0.55" />
          </g>

          {/* Open ground */}
          <ellipse cx="70" cy="75" rx="7" ry="5" fill="#22c55e" fillOpacity="0.18" stroke="white" strokeOpacity="0.3" strokeWidth="0.4" />
          {/* Playground */}
          <rect x="4" y="45" width="18" height="22" rx="1.5" fill="#22c55e" fillOpacity="0.18" stroke="white" strokeOpacity="0.3" strokeWidth="0.4" />

          {/* Text labels */}
          <g fill="white" fillOpacity="0.8" fontSize="2.6" fontFamily="sans-serif">
            <text x="45" y="5" textAnchor="middle">Security</text>
            <text x="76" y="16" textAnchor="middle">Admission</text>
            <text x="67" y="43" textAnchor="middle">Engineering College</text>
            <text x="43" y="41" textAnchor="middle">Faculty</text>
            <text x="90" y="40" textAnchor="middle" transform="rotate(90 90 40)">Degree Block</text>
            <text x="13" y="57" textAnchor="middle">Play Ground</text>
            <text x="70" y="76" textAnchor="middle">Open Ground</text>
            <text x="45" y="97" textAnchor="middle">Staff / Bike Parking</text>
            <text x="10" y="10" fontSize="2.2">Crater</text>
            <text x="86.5" y="39" textAnchor="middle" fontSize="2.3" fill="#fde68a">Cafeteria</text>
            <text x="53.5" y="49" textAnchor="middle" fontSize="2.2" fill="#bae6fd">Seminar</text>
          </g>
        </svg>


        {/* Panorama pins */}
        {PANORAMAS.map((p) => {
          const active = p.id === currentId;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              style={{ left: `${p.map.x}%`, top: `${p.map.y}%` }}
              className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all ${
                active
                  ? "h-4 w-4 bg-accent ring-4 ring-accent/40"
                  : "h-2.5 w-2.5 bg-white/90 hover:h-3.5 hover:w-3.5 hover:bg-accent"
              }`}
              aria-label={p.title}
              title={p.title}
            >
              {active && (
                <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                  {p.title}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 px-1 text-[10px] text-white/70">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-white/90" /> Location
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent" /> You are here
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-3 rounded-sm bg-[#f5f5dc]/60" /> Road
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-emerald-500/40" /> Green zone
        </div>
      </div>
    </div>
  );
}
