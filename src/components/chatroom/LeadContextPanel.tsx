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
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';

const STAGE_COLORS: Record<string, string> = {
  NEW: 'bg-primary-500/15 text-primary-600 dark:text-primary-400 border border-primary-500/30',
  CONTACTED: 'bg-secondary-500/15 text-secondary-600 dark:text-secondary-400 border border-secondary-500/30',
  QUALIFIED: 'bg-warning-500/15 text-warning-600 dark:text-warning-400 border border-warning-500/30',
  WON: 'bg-success-500/15 text-success-600 dark:text-success-400 border border-success-500/30',
  LOST: 'bg-danger-500/15 text-danger-600 dark:text-danger-400 border border-danger-500/30',
};

const QUICK_ACTIONS = [
  { label: 'Book Slot', icon: CalendarPlus, color: 'text-primary-500 hover:bg-primary-500/10' },
  { label: 'Reassign Agent', icon: UserCheck, color: 'text-violet-500 hover:bg-violet-500/10' },
  { label: 'Pipeline View', icon: KanbanSquare, color: 'text-emerald-500 hover:bg-emerald-500/10' },
  { label: 'Add Tag', icon: Tag, color: 'text-amber-500 hover:bg-amber-500/10' },
];

export function LeadContextPanel({
  contact,
  onClose,
  onRequestPayment,
  onSendCatalog,
}: {
  contact: ContactDTO | null;
  onClose?: () => void;
  onRequestPayment?: () => void;
  onSendCatalog?: () => void;
}) {
  const name = contact?.name || contact?.waId || 'WhatsApp Lead';
  const phone = contact?.phone || contact?.waId || 'N/A';
  const email = contact?.email || 'Not provided';
  const source = contact?.source || 'WhatsApp Ingress';
  const tags = contact?.tags || ['NEW'];
  const stage = 'CONTACTED';
  const botStatus = contact?.botPaused ? 'Paused (Manual)' : 'Active (AI Bot)';

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card-c/95 backdrop-blur-md">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-base-c/80 px-4 py-3 bg-card-c/80">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-violet-500" />
          <h3 className="text-sm font-bold text-primary-c tracking-tight">Contact Profile</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800 xl:hidden"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center rounded-2xl border border-base-c/80 bg-slate-50/60 dark:bg-ink-900/60 p-4 shadow-xs">
          <Avatar name={name} size={60} />
          <h4 className="mt-2.5 text-base font-bold text-primary-c">{name}</h4>
          <p className="text-xs font-mono text-muted-c">{phone}</p>

          <div className="mt-2 flex items-center gap-1.5 flex-wrap justify-center">
            <span className={cx('rounded-full px-2.5 py-0.5 text-[10px] font-bold', STAGE_COLORS[stage])}>
              Stage: {stage}
            </span>
            {tags.map((t) => (
              <Badge key={t} variant={t === 'HOT' ? 'danger' : 'primary'} className="text-[10px] px-2 py-0.5 font-bold">{t}</Badge>
            ))}
          </div>

          {onRequestPayment && (
            <button
              onClick={onRequestPayment}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition btn-tactile cursor-pointer"
            >
              <span>💳</span>
              <span>Send WhatsApp Bill</span>
            </button>
          )}

          {onSendCatalog && (
            <button
              onClick={onSendCatalog}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-sm transition btn-tactile cursor-pointer"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Send Catalog Products</span>
            </button>
          )}
        </div>

        {/* Contact Info Card */}
        <div className="space-y-2.5 rounded-2xl border border-base-c/80 bg-card-c p-3.5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-c mb-2">Lead Information</p>
          <InfoRow icon={Phone} label="Phone" value={phone} />
          <InfoRow icon={Mail} label="Email" value={email} />
          <InfoRow icon={MapPin} label="Source" value={source} />
          <InfoRow icon={Bot} label="AI Assistant" value={botStatus} />
          <InfoRow icon={Clock} label="Last Activity" value="Just now" />
        </div>

        {/* Quick Actions Grid */}
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-c">Quick CRM Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.label}
                  className={cx(
                    'flex flex-col items-center gap-1.5 rounded-xl border border-base-c/80 bg-card-c p-2.5 text-center transition-all hover:border-primary-500/40 hover:shadow-soft btn-tactile',
                    a.color
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[10px] font-semibold text-secondary-c">{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Channel Status Card */}
        <GlassCard className="p-3.5 shadow-xs">
          <div className="mb-2.5 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <span className="text-xs font-bold text-primary-c">Channel Status</span>
          </div>
          <div className="space-y-2 text-xs">
            <SummaryRow icon={TrendingUp} label="Channel" value="WhatsApp Cloud API" />
            <SummaryRow icon={MessageSquare} label="Session" value="Active Live" />
            <SummaryRow icon={Bot} label="Auto-Reply" value={contact?.botPaused ? 'Disabled' : 'Enabled'} />
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
      <span className="text-xs text-muted-c">{label}</span>
      <span className="ml-auto truncate text-xs font-medium text-primary-c max-w-[130px] text-right">{value}</span>
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
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-c" />
      <span className="text-xs text-muted-c">{label}</span>
      <span className="ml-auto text-xs font-bold text-primary-c">{value}</span>
    </div>
  );
}

