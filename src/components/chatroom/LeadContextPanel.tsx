import { GlassCard, Badge, Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import type { ContactDTO } from '@/lib/messagesApi';
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
  X,
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
  contact,
  onClose,
}: {
  contact: ContactDTO | null;
  onClose?: () => void;
}) {
  const name = contact?.name || contact?.waId || 'WhatsApp Lead';
  const phone = contact?.phone || contact?.waId || 'N/A';
  const email = contact?.email || 'Not provided';
  const source = contact?.source || 'WhatsApp Ingress';
  const tags = contact?.tags || ['NEW'];
  const stage = 'CONTACTED';
  const botStatus = contact?.botPaused ? 'Paused (Manual)' : 'Active (Bot)';

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-base-c px-3.5 py-2.5">
        <h3 className="text-sm font-semibold text-primary-c">Contact Details</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:text-primary-c xl:hidden"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3 scrollbar-thin">
        {/* Profile */}
        <div className="flex flex-col items-center text-center">
          <Avatar name={name} size={56} />
          <h4 className="mt-2 text-sm font-bold text-primary-c">{name}</h4>
          <p className="text-xs text-muted-c">{phone}</p>
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap justify-center">
            <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-bold', STAGE_COLORS[stage])}>
              {stage}
            </span>
            {tags.map((t) => (
              <Badge key={t} variant={t === 'HOT' ? 'danger' : 'primary'} className="text-[10px] px-1.5 py-0.5">{t}</Badge>
            ))}
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-2 rounded-xl border border-base-c p-2.5">
          <InfoRow icon={Phone} label="Phone" value={phone} />
          <InfoRow icon={Mail} label="Email" value={email} />
          <InfoRow icon={MapPin} label="Source" value={source} />
          <InfoRow icon={Bot} label="AI Bot Status" value={botStatus} />
          <InfoRow icon={Clock} label="Last activity" value="Just now" />
        </div>

        {/* Quick actions */}
        <div>
          <p className="mb-1.5 text-[11px] font-semibold text-muted-c">Quick Actions</p>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.label}
                  className="flex flex-col items-center gap-1 rounded-xl border border-base-c p-2 text-center transition-all hover:border-primary-500/30 hover:shadow-soft"
                >
                  <Icon className={cx('h-3.5 w-3.5', a.color)} />
                  <span className="text-[10px] font-medium text-secondary-c">{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Real Status Summary */}
        <GlassCard className="p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-secondary-600 dark:text-secondary-400" />
            <span className="text-xs font-semibold text-primary-c">Live Status</span>
          </div>
          <div className="space-y-2">
            <SummaryRow icon={TrendingUp} label="Channel" value="WhatsApp Business" />
            <SummaryRow icon={MessageSquare} label="Status" value="Connected" />
            <SummaryRow icon={Bot} label="Auto-Response" value={contact?.botPaused ? 'Disabled' : 'Enabled'} />
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
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-c" />
      <span className="text-[11px] text-muted-c">{label}</span>
      <span className="ml-auto truncate text-xs font-medium text-primary-c max-w-[120px] text-right">{value}</span>
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
