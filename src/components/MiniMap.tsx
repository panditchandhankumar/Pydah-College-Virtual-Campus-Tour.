import { PANORAMAS } from "@/data/panoramas";

interface Props {
  currentId: string;
  onSelect: (id: string) => void;
}

export function MiniMap({ currentId, onSelect }: Props) {
  return (
    <div className="glass-dark rounded-2xl p-3 text-white">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">Campus Map</p>
        <p className="text-[10px] text-white/60">Click a location</p>
      </div>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gradient-to-br from-secondary/60 to-primary/80">
        {/* Decorative campus lanes */}
        <svg className="absolute inset-0 h-full w-full opacity-40" viewBox="0 0 100 75" fill="none">
          <path d="M12 82 Q 28 68 46 54 T 74 30 82 48" stroke="white" strokeWidth="0.6" strokeDasharray="1 1.5" />
          <path d="M46 54 L 66 68 84 78 50 88" stroke="white" strokeWidth="0.6" strokeDasharray="1 1.5" />
          <rect x="4" y="4" width="92" height="67" rx="4" stroke="white" strokeOpacity=".3" strokeWidth=".4" />
        </svg>
        {PANORAMAS.map((p) => {
          const active = p.id === currentId;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              style={{ left: `${p.map.x}%`, top: `${p.map.y * 0.75}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all ${
                active
                  ? "h-4 w-4 bg-accent ring-4 ring-accent/40"
                  : "h-2.5 w-2.5 bg-white/80 hover:h-3.5 hover:w-3.5 hover:bg-accent"
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
    </div>
  );
}
