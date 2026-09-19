import { cx } from '@/lib/types';

export interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export function Skeleton({
  className,
  variant = 'rect',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const variantStyles = {
    rect: 'rounded-lg',
    circle: 'rounded-full',
    text: 'rounded-md h-4 my-1',
  };

  return (
    <div
      aria-hidden="true"
      className={cx(
        'bg-slate-200/80 dark:bg-slate-800/80',
        animate && 'animate-pulse',
        variantStyles[variant],
        className
      )}
      style={{
        width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      }}
    />
  );
}

export function SkeletonKpi() {
  return (
    <div className="glass rounded-xl2 p-4 sm:p-5 border border-slate-200/70 dark:border-slate-800/80">
      <div className="flex items-center justify-between">
        <Skeleton variant="circle" width={40} height={40} />
        <Skeleton variant="rect" width={60} height={20} className="rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton variant="text" width="40%" height={14} />
        <Skeleton variant="text" width="70%" height={26} />
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
        <Skeleton variant="text" width="50%" height={12} />
        <Skeleton variant="text" width="20%" height={12} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-3">
      {/* Table Header */}
      <div className="flex items-center gap-4 py-3 px-4 border-b border-slate-200/70 dark:border-slate-800/80">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={`th-${i}`} className="flex-1">
            <Skeleton variant="text" width={`${Math.floor(50 + (i % 3) * 20)}%`} height={14} />
          </div>
        ))}
      </div>
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div
          key={`tr-${rIdx}`}
          className="flex items-center gap-4 py-3.5 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40"
        >
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div key={`td-${rIdx}-${cIdx}`} className="flex-1 flex items-center gap-3">
              {cIdx === 0 && <Skeleton variant="circle" width={32} height={32} />}
              <Skeleton
                variant="text"
                width={cIdx === 0 ? '60%' : `${Math.floor(40 + ((rIdx + cIdx) % 4) * 15)}%`}
                height={16}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={`card-${idx}`}
          className="glass rounded-xl2 p-5 border border-slate-200/70 dark:border-slate-800/80 space-y-3"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton variant="text" width="65%" height={18} />
              <Skeleton variant="text" width="40%" height={13} />
            </div>
            <Skeleton variant="circle" width={28} height={28} />
          </div>
          <Skeleton variant="text" width="90%" height={14} />
          <Skeleton variant="text" width="75%" height={14} />
          <div className="pt-2 flex items-center gap-2">
            <Skeleton variant="rect" width={60} height={22} className="rounded-md" />
            <Skeleton variant="rect" width={75} height={22} className="rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChatList({ count = 6 }: { count?: number }) {
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
      {Array.from({ length: count }).map((_, i) => (
        <div key={`chat-skel-${i}`} className="p-3.5 flex items-center gap-3">
          <Skeleton variant="circle" width={42} height={42} />
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex items-center justify-between">
              <Skeleton variant="text" width="45%" height={14} />
              <Skeleton variant="text" width="20%" height={11} />
            </div>
            <Skeleton variant="text" width="75%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}
