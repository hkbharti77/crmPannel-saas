import { GlassCard, Badge, Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import type { LeadContext } from './chatData';
import { CONVERSATION_SUMMARY } from './chatData';
import {
  Phone,
  Mail,
  MapPin,
  CalendarPlus,
  UserCheck,
  KanbanSquare,
  Tag,
  TrendingUp,
  Clock,
  MessageSquare,
  Bot,
  Sparkles,
} from 'lucide-react';

const STAGE_COLORS: Record<string, string> = {
  NEW: 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300',
  CONTACTED: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-500/15 dark:text-secondary-300',
  QUALIFIED: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300',
  WON: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300',
  LOST: 'bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300',
};

const QUICK_ACTIONS = [
  { label: 'Book appointment', icon: CalendarPlus, color: 'text-primary-600 dark:text-primary-400' },
  { label: 'Assign agent', icon: UserCheck, color: 'text-secondary-600 dark:text-secondary-400' },
  { label: 'Move to pipeline', icon: KanbanSquare, color: 'text-success-600 dark:text-success-400' },
  { label: 'Add tag', icon: Tag, color: 'text-warning-600 dark:text-warning-400' },
];

export function LeadContextPanel({
  lead,
  onClose,
}: {
  lead: LeadContext;
  onClose?: () => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-base-c p-4">
        <h3 className="text-sm font-semibold text-primary-c">Lead Details</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:text-primary-c xl:hidden"
            aria-label="Close panel"
          >
            <X />
          </button>
        )}
      </div>

      <div className="space-y-4 p-4">
        {/* Profile */}
        <div className="flex flex-col items-center text-center">
          <Avatar name={lead.name} size={72} />
          <h4 className="mt-3 text-base font-bold text-primary-c">{lead.name}</h4>
          <p className="text-xs text-muted-c">{lead.phone}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className={cx('rounded-full px-2.5 py-0.5 text-[10px] font-bold', STAGE_COLORS[lead.stage])}>
              {lead.stage}
            </span>
            {lead.tags.map((t) => (
              <Badge key={t} variant={t === 'HOT' ? 'danger' : 'primary'}>{t}</Badge>
            ))}
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-2 rounded-xl2 border border-base-c p-3">
          <InfoRow icon={Phone} label="Phone" value={lead.phone} />
          <InfoRow icon={Mail} label="Email" value={lead.email} />
          <InfoRow icon={MapPin} label="Source" value={lead.source} />
          <InfoRow icon={TrendingUp} label="Budget" value={lead.budget} />
          <InfoRow icon={Tag} label="Interest" value={lead.interest} />
          <InfoRow icon={UserCheck} label="Assigned" value={lead.assignedTo} />
          <InfoRow icon={Clock} label="Last activity" value={lead.lastActivity} />
        </div>

        {/* Quick actions */}
        <div>
          <p className="mb-2 text-xs font-semibold text-muted-c">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.label}
                  className="flex flex-col items-center gap-1.5 rounded-xl2 border border-base-c p-3 text-center transition-all hover:border-primary-500/30 hover:shadow-soft"
                >
                  <Icon className={cx('h-4 w-4', a.color)} />
                  <span className="text-[10px] font-medium text-secondary-c">{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Conversation Summary */}
        <GlassCard className="p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-secondary-600 dark:text-secondary-400" />
            <span className="text-xs font-semibold text-primary-c">AI Summary</span>
          </div>
          <div className="space-y-2.5">
            <SummaryRow icon={TrendingUp} label="Sentiment" value={CONVERSATION_SUMMARY.sentiment} />
            <SummaryRow icon={MessageSquare} label="Intent" value={CONVERSATION_SUMMARY.intent} />
            <SummaryRow icon={Bot} label="Bot resolved" value={`${CONVERSATION_SUMMARY.botResolved} queries`} />
            <SummaryRow icon={Clock} label="Avg response" value={CONVERSATION_SUMMARY.avgResponseTime} />
            <SummaryRow icon={MessageSquare} label="Total messages" value={String(CONVERSATION_SUMMARY.totalMessages)} />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-c" />
      <span className="text-[11px] text-muted-c">{label}</span>
      <span className="ml-auto truncate text-xs font-medium text-primary-c">{value}</span>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3 w-3 shrink-0 text-muted-c" />
      <span className="text-[11px] text-muted-c">{label}</span>
      <span className="ml-auto text-xs font-semibold text-primary-c">{value}</span>
    </div>
  );
}

import { X } from 'lucide-react';
