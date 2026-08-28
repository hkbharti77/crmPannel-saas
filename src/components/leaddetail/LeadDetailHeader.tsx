import { GlassCard, Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import type { LeadStage } from '@/lib/types';
import type { LeadDTO } from '@/lib/leadsApi';
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  CalendarPlus,
  UserCheck,
  MoreVertical,
  Star,
  CheckCircle2,
  Circle,
  TrendingUp,
} from 'lucide-react';

const STAGES: LeadStage[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST'];

const STAGE_COLORS: Record<LeadStage, string> = {
  NEW: 'bg-primary-500',
  CONTACTED: 'bg-secondary-500',
  QUALIFIED: 'bg-warning-500',
  WON: 'bg-success-500',
  LOST: 'bg-danger-500',
};

function normalizeStage(raw?: string): LeadStage {
  if (!raw) return 'NEW';
  const u = raw.toUpperCase();
  if (u === 'NEW') return 'NEW';
  if (u === 'CONTACTED' || u === 'INTERESTED') return 'CONTACTED';
  if (u === 'QUALIFIED' || u === 'FOLLOW_UP' || u === 'BOOKED') return 'QUALIFIED';
  if (u === 'WON' || u === 'CLOSED_WON') return 'WON';
  if (u === 'LOST' || u === 'CLOSED_LOST') return 'LOST';
  return 'NEW';
}

export function LeadDetailHeader({
  lead,
  onBack,
  onChat,
  onCall,
  onBook,
  onAssign,
  onStageChange,
}: {
  lead: LeadDTO | null;
  onBack: () => void;
  onChat?: () => void;
  onCall?: () => void;
  onBook?: () => void;
  onAssign?: () => void;
  onStageChange?: (newStage: LeadStage) => void;
}) {
  const name = lead?.contact?.name || lead?.contact?.waId || lead?.leadNumber || 'Lead';
  const company = lead?.dealLabel || lead?.contact?.source || 'Direct Lead';
  const phone = lead?.contact?.phone || lead?.contact?.waId || 'N/A';
  const email = lead?.contact?.email || 'Not provided';
  const tags = lead?.contact?.tags || (lead?.score && lead.score >= 70 ? ['HOT'] : ['NEW']);
  const stage = normalizeStage(lead?.status || (lead as Record<string, unknown> | undefined)?.stage as string);

  return (
    <GlassCard className="p-4 lg:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* Left: identity */}
        <div className="flex items-start gap-4">
          <button
            onClick={onBack}
            className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800"
            aria-label="Back to pipeline"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="relative">
            <Avatar name={name} size={56} />
            <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-success-500 ring-2 ring-card-c" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-primary-c">{name}</h2>
              {tags.includes('HOT') && (
                <span className="flex items-center gap-0.5 rounded-full bg-danger-500/15 px-2 py-0.5 text-[10px] font-bold text-danger-600 dark:text-danger-400">
                  <TrendingUp className="h-3 w-3" /> HOT
                </span>
              )}
              {tags.includes('VIP') && (
                <span className="flex items-center gap-0.5 rounded-full bg-gradient-accent px-2 py-0.5 text-[10px] font-bold text-white">
                  <Star className="h-3 w-3" /> VIP
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-secondary-c">{company}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-c">
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {phone}</span>
              <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {email}</span>
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex flex-wrap items-center gap-2">
          <ActionBtn icon={MessageSquare} label="Chat" accent onClick={onChat} />
          <ActionBtn icon={Phone} label="Call" onClick={onCall} />
          <ActionBtn icon={CalendarPlus} label="Book" onClick={onBook} />
          <ActionBtn icon={UserCheck} label="Assign" onClick={onAssign} />
          <button className="grid h-9 w-9 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stage progression */}
      <div className="mt-5">
        <StageProgression currentStage={stage} onStageChange={onStageChange} />
      </div>
    </GlassCard>
  );
}

function StageProgression({
  currentStage,
  onStageChange,
}: {
  currentStage: LeadStage;
  onStageChange?: (newStage: LeadStage) => void;
}) {
  const currentIdx = STAGES.indexOf(currentStage);

  return (
    <div className="w-full overflow-x-auto scrollbar-none py-1">
      <div className="flex items-center min-w-[340px] sm:min-w-full">
        {STAGES.map((stageItem, i) => {
          const isComplete = i < currentIdx;
          const isCurrent = i === currentIdx;

          return (
            <div key={stageItem} className="flex flex-1 items-center last:flex-none">
              <div
                onClick={() => onStageChange?.(stageItem)}
                className="flex flex-col items-center cursor-pointer group shrink-0"
                title={`Click to set stage to ${stageItem}`}
              >
                <div className="relative">
                  {isComplete ? (
                    <div className={cx('grid h-8 w-8 place-items-center rounded-full text-white shadow-soft transition-transform group-hover:scale-110', STAGE_COLORS[stageItem])}>
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  ) : isCurrent ? (
                    <div className={cx('grid h-8 w-8 place-items-center rounded-full text-white shadow-soft ring-4 ring-card-c transition-transform group-hover:scale-110', STAGE_COLORS[stageItem])}>
                      <Circle className="h-4 w-4 fill-current" />
                    </div>
                  ) : (
                    <div className="grid h-8 w-8 place-items-center rounded-full border-2 border-base-c bg-card-c text-muted-c transition-all group-hover:border-primary-500 group-hover:text-primary-c group-hover:scale-110">
                      <Circle className="h-4 w-4" />
                    </div>
                  )}
                  {isCurrent && (
                    <span className="absolute -inset-1 animate-ping rounded-full bg-secondary-500/30" />
                  )}
                </div>
                <span className={cx(
                  'mt-1.5 text-[10px] font-semibold transition-colors whitespace-nowrap',
                  isCurrent ? 'text-primary-c font-bold' : isComplete ? 'text-secondary-c' : 'text-muted-c group-hover:text-primary-c',
                )}>
                  {stageItem}
                </span>
              </div>

              {i < STAGES.length - 1 && (
                <div className="mx-1.5 h-0.5 flex-1 rounded-full min-w-[20px]">
                  <div className={cx(
                    'h-full rounded-full transition-colors',
                    i < currentIdx ? STAGE_COLORS[STAGES[i]] : 'bg-base-c',
                  )} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  accent,
  onClick,
}: {
  icon: typeof Phone;
  label: string;
  accent?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all whitespace-nowrap btn-tactile',
        accent
          ? 'bg-gradient-accent text-white hover:scale-105 shadow-sm'
          : 'border border-base-c text-secondary-c hover:border-primary-500/30 hover:text-primary-c',
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
