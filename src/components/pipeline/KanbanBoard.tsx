import { GlassCard, Avatar, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import type { Lead } from './pipelineData';
import { PRIORITY_STYLES } from './pipelineData';
import {
  Clock,
  ArrowRight,
  Phone,
  MessageSquare,
  CalendarPlus,
  GripVertical,
  CircleDot,
  Globe,
  Users,
  Mail,
  Laptop,
  Bot,
  Sparkles,
} from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

const SOURCE_ICONS: Record<string, typeof Phone> = {
  WhatsApp: MessageSquare,
  WHATSAPP: MessageSquare,
  'Web Widget': Laptop,
  WEB_WIDGET: Laptop,
  Website: Globe,
  WEBSITE: Globe,
  Referral: Users,
  'Cold Call': Phone,
  Email: Mail,
  EMAIL: Mail,
  Bot: Bot,
};

const TAG_STYLES: Record<string, string> = {
  HOT: 'bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300',
  VIP: 'bg-gradient-accent text-white',
  RETURNING: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300',
};

export function LeadCard({
  lead,
  onOpen,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  lead: Lead;
  onOpen?: () => void;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}) {
  const SourceIcon = SOURCE_ICONS[lead.source] ?? CircleDot;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={cx(
        'group cursor-pointer rounded-xl2 border border-base-c bg-card-c p-3 shadow-soft transition-all hover:shadow-soft-lg hover:border-primary-500/30',
        isDragging && 'opacity-50 scale-95 ring-2 ring-primary-500/40',
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-2.5">
        <div className="relative shrink-0">
          <Avatar name={lead.name} size={36} />
          {lead.hasUnread && (
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-danger-500 ring-2 ring-card-c" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-primary-c">{lead.name}</p>
          <p className="truncate text-xs text-muted-c">{lead.company}</p>
        </div>
        <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-c opacity-0 transition-opacity group-hover:opacity-60 active:cursor-grabbing" />
      </div>

      {/* Tags + priority + AI Lead Score */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className={cx('rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide', PRIORITY_STYLES[lead.priority])}>
          {lead.priority}
        </span>
        <span className="flex items-center gap-0.5 rounded bg-primary-500/15 px-1.5 py-0.5 text-[9px] font-bold text-primary-600 dark:text-primary-400">
          <Sparkles className="h-2.5 w-2.5" /> Score {lead.score ?? 50}
        </span>
        {lead.tags.map((t) => (
          <span key={t} className={cx('rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide', TAG_STYLES[t] ?? 'bg-slate-100 text-slate-600 dark:bg-ink-800')}>
            {t}
          </span>
        ))}
      </div>

      {/* Value + source */}
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-base font-bold text-primary-c tabular-nums">{lead.value}</span>
        <span className="flex items-center gap-1 text-[10px] text-muted-c">
          <SourceIcon className="h-3 w-3" /> {lead.source}
        </span>
      </div>

      {/* Next action */}
      <div className="mt-2.5 rounded-lg bg-slate-50 p-2 dark:bg-ink-850/60">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 shrink-0 text-primary-500" />
          <span className="truncate text-[11px] font-medium text-secondary-c">{lead.nextAction}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between">
          <span className="text-[10px] text-muted-c">{lead.nextActionDate}</span>
          <span className="text-[10px] text-muted-c">{lead.assignedTo}</span>
        </div>
      </div>
    </div>
  );
}

export function KanbanColumn({
  stage,
  title,
  color,
  barColor,
  accent,
  leads,
  onOpenLead,
  onDrop,
  isDragOver,
  onDragOver,
  onDragLeave,
  draggedLeadId,
  onDragStart,
}: {
  stage: string;
  title: string;
  color: string;
  barColor: string;
  accent: string;
  leads: Lead[];
  onOpenLead: (lead: Lead) => void;
  onDrop: (stage: string) => void;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  draggedLeadId?: string | null;
  onDragStart?: (leadId: string | null) => void;
}) {
  const totalValue = leads.reduce((s, l) => {
    const v = l.value || '';
    if (v.includes('Cr')) return s + parseFloat(v.replace(/[₹,Cr]/g, '').trim()) * 10000000;
    if (v.includes('L')) return s + parseFloat(v.replace(/[₹,L]/g, '').trim()) * 100000;
    const num = parseFloat(v.replace(/[^0-9.]/g, ''));
    return s + (isNaN(num) ? 0 : num);
  }, 0);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: leads.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 150, // Approximate height of a LeadCard + margin
    overscan: 5,
  });

  return (
    <div
      onDragOver={onDragOver}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(stage);
      }}
      onDragLeave={onDragLeave}
      className={cx(
        'flex w-72 shrink-0 flex-col rounded-xl2 border transition-all',
        isDragOver
          ? 'border-primary-500/40 bg-primary-500/5'
          : 'border-base-c bg-subtle-c',
      )}
      style={isDragOver ? { backgroundColor: accent } : undefined}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 border-b border-base-c px-3 py-3">
        <span className={cx('h-2.5 w-2.5 rounded-full', barColor)} />
        <h4 className={cx('text-sm font-semibold', color)}>{title}</h4>
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-slate-200 px-1.5 text-[10px] font-bold text-secondary-c dark:bg-ink-700 dark:text-slate-300">
          {leads.length}
        </span>
        <span className="ml-auto text-[10px] font-medium text-muted-c tabular-nums">
          {totalValue >= 10000000
            ? `₹${(totalValue / 10000000).toFixed(1)}Cr`
            : totalValue >= 100000
            ? `₹${(totalValue / 100000).toFixed(1)}L`
            : `₹${totalValue.toLocaleString('en-IN')}`}
        </span>
      </div>

      {/* Cards */}
      <div 
        ref={parentRef}
        className="flex-1 overflow-y-auto p-2.5 scrollbar-thin" 
        style={{ minHeight: '120px' }}
      >
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ArrowRight className="h-6 w-6 text-muted-c/30" />
            <p className="mt-2 text-[11px] text-muted-c">Drop leads here</p>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const lead = leads[virtualRow.index];
              return (
                <div
                  key={lead.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    paddingBottom: '10px' // Spacer between cards
                  }}
                >
                  <LeadCard 
                    lead={lead} 
                    onOpen={() => onOpenLead(lead)} 
                    isDragging={draggedLeadId === lead.id}
                    onDragStart={() => onDragStart?.(lead.id)}
                    onDragEnd={() => onDragStart?.(null)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
