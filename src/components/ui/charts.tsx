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

/** Mini trend line for KPI cards with smooth curves and gradient fill. */
export function Sparkline({
  data = [],
  color = '#2563EB',
  height = 36,
  strokeWidth = 2.5,
  showArea = true,
  className,
}: {
  data: number[];
  color?: string;
  height?: number;
  strokeWidth?: number;
  showArea?: boolean;
  className?: string;
}) {
  const width = 120;
  const padX = 3;
  const padY = 5;
  const gid = useMemo(() => `spark-${Math.random().toString(36).slice(2, 9)}`, []);

  const { path, area, lastPoint, isZero } = useMemo(() => {
    if (!data || data.length === 0) {
      return { path: '', area: '', lastPoint: null, isZero: true };
    }

    const max = Math.max(...data);
    const min = Math.min(...data);
    const allZero = max === 0 && min === 0;
    const isFlat = max === min;

    const effectiveLength = Math.max(data.length, 2);
    const step = (width - padX * 2) / (effectiveLength - 1);
    const drawHeight = height - padY * 2;

    if (allZero || isFlat) {
      const midY = height * 0.65;
      const pts: [number, number][] = [
        [padX, midY],
        [width - padX, midY],
      ];
      return {
        path: `M ${pts[0][0]} ${pts[0][1]} L ${pts[1][0]} ${pts[1][1]}`,
        area: '',
        lastPoint: pts[1],
        isZero: allZero,
      };
    }

    const range = max - min;
    const pts: [number, number][] = data.map((v, i) => {
      const x = padX + i * step;
      const y = padY + (1 - (v - min) / range) * drawHeight;
      return [x, y];
    });

    // Catmull-Rom to Cubic Bézier spline for silky smooth curves
    let curvePath = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];

      const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
      const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
      const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
      const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

      curvePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }

    const areaPath = `${curvePath} L ${pts[pts.length - 1][0].toFixed(1)} ${height} L ${pts[0][0].toFixed(1)} ${height} Z`;

    return {
      path: curvePath,
      area: areaPath,
      lastPoint: pts[pts.length - 1],
      isZero: false,
    };
  }, [data, height]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {showArea && area && !isZero && (
        <path d={area} fill={`url(#${gid})`} />
      )}

      {path && (
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity={isZero ? 0.35 : 0.95}
          strokeDasharray={isZero ? '4 4' : undefined}
        />
      )}

      {lastPoint && !isZero && (
        <circle
          cx={lastPoint[0]}
          cy={lastPoint[1]}
          r={strokeWidth * 1.05}
          fill={color}
        />
      )}
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
