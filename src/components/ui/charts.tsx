import { useMemo } from 'react';

/** Smooth area chart rendered as inline SVG — no deps. */
export function AreaChart({
  data,
  height = 160,
  className,
  color = '#2563EB',
  showGrid = true,
  showDots = false,
}: {
  data: number[];
  height?: number;
  className?: string;
  color?: string;
  showGrid?: boolean;
  showDots?: boolean;
}) {
  const width = 600;
  const padX = 8;
  const padY = 16;
  const gid = useMemo(() => `g${Math.random().toString(36).slice(2, 9)}`, []);

  const { path, area, points } = useMemo(() => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const step = (width - padX * 2) / (data.length - 1);
    const pts = data.map((v, i) => {
      const x = padX + i * step;
      const y = padY + (1 - (v - min) / range) * (height - padY * 2);
      return [x, y] as const;
    });
    const path = pts
      .map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
      .join(' ');
    const area = `${path} L ${pts[pts.length - 1][0]} ${height} L ${pts[0][0]} ${height} Z`;
    return { path, area, points: pts, max, min };
  }, [data, height]);

  const gridLines = [0.25, 0.5, 0.75];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {showGrid &&
        gridLines.map((g) => (
          <line
            key={g}
            x1={padX}
            x2={width - padX}
            y1={padY + g * (height - padY * 2)}
            y2={padY + g * (height - padY * 2)}
            className="stroke-slate-200 dark:stroke-ink-800"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
        ))}

      <path d={area} fill={`url(#${gid})`} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots &&
        points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill={color} />
        ))}
    </svg>
  );
}

/** Mini trend line for KPI cards. */
export function Sparkline({
  data,
  color = '#2563EB',
  className,
}: {
  data: number[];
  color?: string;
  className?: string;
}) {
  const width = 120;
  const height = 36;
  const path = useMemo(() => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const step = width / (data.length - 1);
    return data
      .map((v, i) => {
        const x = i * step;
        const y = (1 - (v - min) / range) * height;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [data]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} preserveAspectRatio="none">
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Horizontal bars for categorical breakdowns. */
export function BarRow({
  label,
  value,
  max,
  color = 'bg-gradient-accent',
  rightLabel,
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
  rightLabel?: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-secondary-c">{label}</span>
        <span className="font-semibold text-primary-c tabular-nums">
          {rightLabel ?? value}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-ink-800">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
