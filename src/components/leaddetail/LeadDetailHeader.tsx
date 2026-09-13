import { useState } from 'react';
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
  Star,
  CheckCircle2,
  Circle,
  TrendingUp,
  Copy,
  Check,
  ChevronDown,
  Layers,
  ListChecks,
} from 'lucide-react';

const STAGES: LeadStage[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST'];

const STAGE_COLORS: Record<LeadStage, string> = {
  NEW: 'bg-primary-500',
  CONTACTED: 'bg-secondary-500',
  QUALIFIED: 'bg-warning-500',
  WON: 'bg-success-500',
  LOST: 'bg-danger-500',
};

const DISPOSITIONS = [
  { id: 'UNTOUCHED', label: 'Untouched', color: 'bg-slate-500' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-sky-500' },
  { id: 'FOLLOW_UP', label: 'Follow Up Required', color: 'bg-amber-500' },
  { id: 'APPOINTMENT_BOOKED', label: 'Appointment Booked', color: 'bg-indigo-500' },
  { id: 'PROPOSAL_SENT', label: 'Proposal Sent', color: 'bg-purple-500' },
  { id: 'WON', label: 'Closed Won', color: 'bg-emerald-500' },
  { id: 'CLOSED_LOST', label: 'Closed Lost', color: 'bg-rose-500' },
];

function normalizeStage(raw?: string): LeadStage {
  if (!raw) return 'NEW';
  const u = raw.toUpperCase();
  if (u === 'NEW' || u === 'UNTOUCHED') return 'NEW';
  if (u === 'CONTACTED' || u === 'INTERESTED' || u === 'IN_PROGRESS') return 'CONTACTED';
  if (u === 'QUALIFIED' || u === 'FOLLOW_UP' || u === 'BOOKED' || u === 'APPOINTMENT_BOOKED' || u === 'PROPOSAL_SENT') return 'QUALIFIED';
  if (u === 'WON' || u === 'CLOSED_WON') return 'WON';
  if (u === 'LOST' || u === 'CLOSED_LOST') return 'LOST';
  return 'NEW';
}

function normalizeDisposition(raw?: string): string {
  if (!raw) return 'UNTOUCHED';
  const u = raw.toUpperCase();
  const found = DISPOSITIONS.find((d) => d.id === u || d.label.toUpperCase() === u);
  if (found) return found.id;
  if (u === 'NEW') return 'UNTOUCHED';
  if (u === 'CONTACTED') return 'IN_PROGRESS';
  if (u === 'QUALIFIED') return 'PROPOSAL_SENT';
  if (u === 'WON') return 'WON';
  if (u === 'LOST') return 'CLOSED_LOST';
  return 'UNTOUCHED';
}

export function LeadDetailHeader({
  lead,
  onBack,
  onChat,
  onWhatsApp,
  onCall,
  onEmail,
  onBook,
  onAssign,
  onStageChange,
}: {
  lead: LeadDTO | null;
  onBack: () => void;
  onChat?: () => void;
  onWhatsApp?: () => void;
  onCall?: () => void;
  onEmail?: () => void;
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
  const disposition = normalizeDisposition(lead?.status || (lead as Record<string, unknown> | undefined)?.stage as string);

  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [trackingMode, setTrackingMode] = useState<'stages' | 'status'>('stages');

  const copyToClipboard = (text: string, type: 'phone' | 'email') => {
    if (text && text !== 'N/A' && text !== 'Not provided') {
      navigator.clipboard.writeText(text);
      if (type === 'phone') {
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
      } else {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      }
    }
  };

  return (
    <GlassCard className="p-4 lg:p-5 shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* Left: identity */}
        <div className="flex items-start gap-4">
          <button
            onClick={onBack}
            className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-base-c bg-card-c text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800 transition-colors"
            aria-label="Back to pipeline"
            title="Back to Pipeline"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="relative">
            <Avatar name={name} size={56} />
            <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-success-500 ring-2 ring-card-c" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-primary-c tracking-tight">{name}</h2>
              {tags.includes('HOT') && (
                <span className="flex items-center gap-0.5 rounded-full bg-danger-500/15 px-2.5 py-0.5 text-[10px] font-bold text-danger-600 dark:text-danger-400">
                  <TrendingUp className="h-3 w-3" /> HOT
                </span>
              )}
              {tags.includes('VIP') && (
                <span className="flex items-center gap-0.5 rounded-full bg-gradient-accent px-2.5 py-0.5 text-[10px] font-bold text-white">
                  <Star className="h-3 w-3" /> VIP
                </span>
              )}
              {/* Quick stage badge dropdown */}
              <div className="relative inline-block">
                <select
                  value={stage}
                  onChange={(e) => onStageChange?.(e.target.value as LeadStage)}
                  className={cx(
                    'cursor-pointer rounded-full px-3 py-0.5 pr-6 text-xs font-bold text-white outline-none appearance-none transition-all shadow-sm',
                    STAGE_COLORS[stage]
                  )}
                  title="Click to quickly switch stage"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s} className="bg-card-c text-primary-c font-semibold">
                      Stage: {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white" />
              </div>
            </div>

            <p className="mt-1 text-sm font-medium text-secondary-c">{company}</p>

            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-muted-c">
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-ink-800/80 px-2.5 py-1">
                <Phone className="h-3.5 w-3.5 text-primary-500" />
                <span className="font-mono text-primary-c">{phone}</span>
                {phone !== 'N/A' && (
                  <button
                    onClick={() => copyToClipboard(phone, 'phone')}
                    className="ml-1 text-muted-c hover:text-primary-c"
                    title="Copy phone"
                  >
                    {copiedPhone ? <Check className="h-3 w-3 text-success-500" /> : <Copy className="h-3 w-3" />}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-ink-800/80 px-2.5 py-1">
                <Mail className="h-3.5 w-3.5 text-secondary-500" />
                <span className="text-primary-c">{email}</span>
                {email !== 'Not provided' && (
                  <button
                    onClick={() => copyToClipboard(email, 'email')}
                    className="ml-1 text-muted-c hover:text-primary-c"
                    title="Copy email"
                  >
                    {copiedEmail ? <Check className="h-3 w-3 text-success-500" /> : <Copy className="h-3 w-3" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onWhatsApp && (
            <button
              onClick={onWhatsApp}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-semibold shadow-sm transition-all hover:scale-105 btn-tactile"
              title="Open WhatsApp Web Chat"
            >
              <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
            </button>
          )}
          {onChat && (
            <ActionBtn icon={MessageSquare} label="CRM Chat" accent onClick={onChat} />
          )}
          {onCall && (
            <button
              onClick={onCall}
              className="flex items-center gap-1.5 rounded-xl border border-base-c bg-card-c hover:border-primary-500/50 hover:bg-slate-50 dark:hover:bg-ink-800 text-primary-c px-3 py-2 text-xs font-medium transition-all btn-tactile"
              title="Initiate phone call"
            >
              <Phone className="h-3.5 w-3.5 text-primary-500" /> Call
            </button>
          )}
          {onEmail && (
            <button
              onClick={onEmail}
              className="flex items-center gap-1.5 rounded-xl border border-base-c bg-card-c hover:border-primary-500/50 hover:bg-slate-50 dark:hover:bg-ink-800 text-primary-c px-3 py-2 text-xs font-medium transition-all btn-tactile"
              title="Send email"
            >
              <Mail className="h-3.5 w-3.5 text-secondary-500" /> Email
            </button>
          )}
          {onBook && (
            <ActionBtn icon={CalendarPlus} label="Book Slot" onClick={onBook} />
          )}
          {onAssign && (
            <ActionBtn icon={UserCheck} label="Reassign" onClick={onAssign} />
          )}
        </div>
      </div>

      {/* Mode Selector & Stepper Section */}
      <div className="mt-5 border-t border-base-c/60 pt-3">
        {/* Mode Toggle Switcher */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-c flex items-center gap-1">
            Tracking Mode:
          </span>
          <div className="flex items-center gap-1 rounded-xl border border-base-c bg-slate-100 dark:bg-ink-900 p-0.5">
            <button
              onClick={() => setTrackingMode('stages')}
              className={cx(
                'flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all',
                trackingMode === 'stages'
                  ? 'bg-gradient-accent text-white shadow-soft'
                  : 'text-secondary-c hover:text-primary-c'
              )}
            >
              <Layers className="h-3.5 w-3.5" /> Pipeline Stages
            </button>
            <button
              onClick={() => setTrackingMode('status')}
              className={cx(
                'flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all',
                trackingMode === 'status'
                  ? 'bg-gradient-accent text-white shadow-soft'
                  : 'text-secondary-c hover:text-primary-c'
              )}
            >
              <ListChecks className="h-3.5 w-3.5" /> Detailed Status
            </button>
          </div>
        </div>

        {/* Render Active Mode Stepper */}
        {trackingMode === 'stages' ? (
          <StageProgression currentStage={stage} onStageChange={onStageChange} />
        ) : (
          <DispositionProgression currentDisposition={disposition} onStageChange={onStageChange} />
        )}
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

function DispositionProgression({
  currentDisposition,
  onStageChange,
}: {
  currentDisposition: string;
  onStageChange?: (newStage: LeadStage) => void;
}) {
  const currentIdx = DISPOSITIONS.findIndex((d) => d.id === currentDisposition);

  const mapDispToStage = (dispId: string): LeadStage => {
    if (dispId === 'UNTOUCHED') return 'NEW';
    if (dispId === 'IN_PROGRESS' || dispId === 'FOLLOW_UP') return 'CONTACTED';
    if (dispId === 'APPOINTMENT_BOOKED' || dispId === 'PROPOSAL_SENT') return 'QUALIFIED';
    if (dispId === 'WON') return 'WON';
    return 'LOST';
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-none py-1">
      <div className="flex items-center min-w-[500px] sm:min-w-full">
        {DISPOSITIONS.map((disp, i) => {
          const isComplete = i < currentIdx;
          const isCurrent = i === currentIdx;

          return (
            <div key={disp.id} className="flex flex-1 items-center last:flex-none">
              <div
                onClick={() => onStageChange?.(mapDispToStage(disp.id))}
                className="flex flex-col items-center cursor-pointer group shrink-0"
                title={`Click to set disposition status to ${disp.label}`}
              >
                <div className="relative">
                  {isComplete ? (
                    <div className={cx('grid h-7 w-7 place-items-center rounded-full text-white shadow-soft transition-transform group-hover:scale-110', disp.color)}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                  ) : isCurrent ? (
                    <div className={cx('grid h-7 w-7 place-items-center rounded-full text-white shadow-soft ring-4 ring-card-c transition-transform group-hover:scale-110', disp.color)}>
                      <Circle className="h-3.5 w-3.5 fill-current" />
                    </div>
                  ) : (
                    <div className="grid h-7 w-7 place-items-center rounded-full border-2 border-base-c bg-card-c text-muted-c transition-all group-hover:border-primary-500 group-hover:text-primary-c group-hover:scale-110">
                      <Circle className="h-3.5 w-3.5" />
                    </div>
                  )}
                  {isCurrent && (
                    <span className="absolute -inset-1 animate-ping rounded-full bg-secondary-500/30" />
                  )}
                </div>
                <span className={cx(
                  'mt-1 text-[10px] font-semibold transition-colors whitespace-nowrap',
                  isCurrent ? 'text-primary-c font-bold' : isComplete ? 'text-secondary-c' : 'text-muted-c group-hover:text-primary-c',
                )}>
                  {disp.label}
                </span>
              </div>

              {i < DISPOSITIONS.length - 1 && (
                <div className="mx-1 h-0.5 flex-1 rounded-full min-w-[15px]">
                  <div className={cx(
                    'h-full rounded-full transition-colors',
                    i < currentIdx ? disp.color : 'bg-base-c',
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
        'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap btn-tactile',
        accent
          ? 'bg-gradient-accent text-white hover:scale-105 shadow-sm'
          : 'border border-base-c bg-card-c text-secondary-c hover:border-primary-500/30 hover:text-primary-c hover:bg-slate-50 dark:hover:bg-ink-800',
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}


