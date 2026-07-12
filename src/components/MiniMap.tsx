/**
 * @file MiniMap — campus map rendered entirely from `src/config/campus.json`.
 *
 * Purpose: show clickable pins for every panorama on a data-driven SVG plan.
 * Adding a road, building or label means editing campus.json only.
 *
 * Inputs:  currentId — active panorama id; onSelect(id) — teleport handler.
 * Outputs: JSX SVG with pin buttons.
 */
import { config } from "@/config";

interface Props {
  currentId: string;
  onSelect: (id: string) => void;
}

export function MiniMap({ currentId, onSelect }: Props) {
  const { campus, panoramas } = config;

  return (
    <div className="glass-dark rounded-2xl p-3 text-white">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">Campus Map</p>
        <p className="text-[10px] text-white/60">Click a location</p>
      </div>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gradient-to-br from-emerald-900/40 via-secondary/50 to-primary/80">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={campus.viewBox}
          fill="none"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="grid" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M 6 0 L 0 0 0 6" fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100" height="100" fill="url(#grid)" />

          {/* Roads — casings then surfaces then centrelines, all from JSON. */}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <g stroke={campus.roads.casingColor} strokeOpacity={campus.roads.casingOpacity} strokeWidth={campus.roads.casingWidth}>
              {campus.roads.paths.map((d, i) => <path key={`c-${i}`} d={d} />)}
            </g>
            <g stroke={campus.roads.surfaceColor} strokeOpacity={campus.roads.surfaceOpacity} strokeWidth={campus.roads.surfaceWidth}>
              {campus.roads.paths.map((d, i) => <path key={`s-${i}`} d={d} />)}
            </g>
            {campus.roads.centerlines.map((c, i) => (
              <path key={`cl-${i}`} d={c.d} stroke="white" strokeOpacity={c.opacity} strokeWidth={c.width} strokeDasharray={c.dash} />
            ))}
          </g>

          {/* Building footprints */}
          <g>
            {campus.buildings.map((b) => (
              <rect
                key={b.id}
                x={b.x} y={b.y} width={b.w} height={b.h} rx={0.8}
                fill={b.fill ?? "white"}
                fillOpacity={b.fill ? 0.22 : 0.1}
                stroke={b.stroke ?? "white"}
                strokeOpacity={b.stroke ? 0.7 : 0.35}
                strokeWidth={0.4}
              />
            ))}
          </g>

          {/* Green zones */}
          <g>
            {campus.greens.map((g, i) =>
              g.shape === "ellipse" ? (
                <ellipse key={i} cx={g.cx} cy={g.cy} rx={g.rx} ry={g.ry} fill="#22c55e" fillOpacity="0.18" stroke="white" strokeOpacity="0.3" strokeWidth="0.4" />
              ) : (
                <rect key={i} x={g.x} y={g.y} width={g.w} height={g.h} rx={1.5} fill="#22c55e" fillOpacity="0.18" stroke="white" strokeOpacity="0.3" strokeWidth="0.4" />
              ),
            )}
          </g>

          {/* Roundabout */}
          <g>
            <circle cx={campus.roundabout.cx} cy={campus.roundabout.cy} r={campus.roundabout.r} fill="#0b1220" fillOpacity="0.55" />
            <circle cx={campus.roundabout.cx} cy={campus.roundabout.cy} r={campus.roundabout.r - 0.8} fill="none" stroke="#f5f5dc" strokeOpacity="0.75" strokeWidth="0.6" />
            <circle cx={campus.roundabout.cx} cy={campus.roundabout.cy} r={1.4} fill="#22c55e" fillOpacity="0.55" />
          </g>

          {/* Labels */}
          <g fill="white" fillOpacity="0.8" fontSize="2.6" fontFamily="sans-serif">
            {campus.labels.map((l, i) => (
              <text
                key={i}
                x={l.x}
                y={l.y}
                textAnchor="middle"
                fontSize={(l as { fontSize?: number }).fontSize ?? 2.6}
                fill={(l as { color?: string }).color ?? "white"}
                transform={(l as { rotate?: number }).rotate ? `rotate(${(l as { rotate?: number }).rotate} ${l.x} ${l.y})` : undefined}
              >
                {l.text}
              </text>
            ))}
          </g>
        </svg>

        {/* Panorama pins */}
        {panoramas.map((p) => {
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

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 px-1 text-[10px] text-white/70">
        <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-white/90" /> Location</div>
        <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> You are here</div>
        <div className="flex items-center gap-1.5"><span className="h-1.5 w-3 rounded-sm bg-[#f5f5dc]/60" /> Road</div>
        <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-500/40" /> Green zone</div>
      </div>
    </div>
  );
}
