import { useState } from 'react';
import { GlassCard, Badge, Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { LEAD_DETAIL } from './leadDetailData';
import { LeadDetailHeader } from './LeadDetailHeader';
import { ActivityTimeline, NotesPanel, FilesPanel } from './DetailTabs';
import {
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  UserCheck,
  Radio,
  Sparkles,
  Clock,
  Activity as ActivityIcon,
  StickyNote,
  FolderOpen,
} from 'lucide-react';

type TabId = 'timeline' | 'notes' | 'files';

const TABS: { id: TabId; label: string; icon: typeof ActivityIcon; count?: number }[] = [
  { id: 'timeline', label: 'Timeline', icon: ActivityIcon, count: LEAD_DETAIL.timeline.length },
  { id: 'notes', label: 'Notes', icon: StickyNote, count: LEAD_DETAIL.notes.length },
  { id: 'files', label: 'Files', icon: FolderOpen, count: LEAD_DETAIL.files.length },
];

export function LeadDetailView({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<TabId>('timeline');
  const lead = LEAD_DETAIL;

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 lg:p-6">
      <LeadDetailHeader onBack={onBack} />

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        {/* Left: tabbed content */}
        <div className="space-y-4">
          {/* Tab bar */}
          <div className="flex items-center gap-1.5 rounded-xl2 border border-base-c bg-card-c p-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cx(
                    'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all',
                    active
                      ? 'bg-gradient-accent text-white shadow-soft'
                      : 'text-secondary-c hover:text-primary-c',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" /> {t.label}
                  {t.count !== undefined && (
                    <span className={cx(
                      'grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold',
                      active ? 'bg-white/25' : 'bg-slate-100 text-muted-c dark:bg-ink-800',
                    )}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <GlassCard className="p-5">
            {tab === 'timeline' && <ActivityTimeline />}
            {tab === 'notes' && <NotesPanel />}
            {tab === 'files' && <FilesPanel />}
          </GlassCard>
        </div>

        {/* Right: info sidebar */}
        <div className="space-y-4">
          {/* Lead info */}
          <GlassCard className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-primary-c">Lead Information</h3>
            <div className="space-y-3">
              <InfoRow icon={Phone} label="Phone" value={lead.phone} />
              <InfoRow icon={Mail} label="Email" value={lead.email} />
              <InfoRow icon={MapPin} label="Location" value={lead.location} />
              <InfoRow icon={DollarSign} label="Budget" value={lead.budget} />
              <InfoRow icon={Target} label="Interest" value={lead.interest} />
              <InfoRow icon={Radio} label="Source" value={lead.source} />
              <InfoRow icon={UserCheck} label="Assigned to" value={lead.assignedTo} />
              <InfoRow icon={Calendar} label="Created" value={lead.createdAt} />
              <InfoRow icon={Clock} label="Last activity" value={lead.lastActivity} />
            </div>
          </GlassCard>

          {/* Deal value + priority */}
          <GlassCard className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-primary-c">Deal Metrics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl2 bg-gradient-accent-soft p-3">
                <span className="text-xs text-secondary-c">Deal Value</span>
                <span className="text-xl font-bold text-primary-c tabular-nums">{lead.value}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary-c">Priority</span>
                <Badge variant={lead.priority === 'HIGH' ? 'danger' : lead.priority === 'MEDIUM' ? 'warning' : 'neutral'}>
                  {lead.priority}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary-c">Sentiment</span>
                <Badge variant={lead.sentiment === 'Positive' ? 'success' : lead.sentiment === 'Negative' ? 'danger' : 'neutral'}>
                  {lead.sentiment}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary-c">Lead Quality</span>
                <div className="flex items-center gap-1.5">
                  <span className={cx(
                    'h-2.5 w-2.5 rounded-full',
                    lead.quality === 'GREEN' && 'bg-success-500',
                    lead.quality === 'YELLOW' && 'bg-warning-500',
                    lead.quality === 'RED' && 'bg-danger-500',
                  )} />
                  <span className="text-xs font-medium text-primary-c">{lead.quality}</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* AI insights */}
          <GlassCard className="p-5">
            <div className="mb-3 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-secondary-600 dark:text-secondary-400" />
              <h3 className="text-sm font-semibold text-primary-c">AI Insights</h3>
            </div>
            <div className="space-y-2.5">
              <InsightRow
                icon={TrendingUp}
                label="Conversion probability"
                value="78%"
                color="text-success-600 dark:text-success-400"
              />
              <InsightRow
                icon={Clock}
                label="Best time to call"
                value="2-4 PM"
                color="text-primary-600 dark:text-primary-400"
              />
              <InsightRow
                icon={ActivityIcon}
                label="Engagement score"
                value="High"
                color="text-warning-600 dark:text-warning-400"
              />
            </div>
            <button className="mt-4 w-full rounded-xl2 bg-gradient-accent-soft py-2 text-xs font-medium text-primary-600 transition-colors hover:bg-gradient-accent hover:text-white dark:text-primary-300">
              View full AI report
            </button>
          </GlassCard>
        </div>
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
      <span className="text-xs text-muted-c">{label}</span>
      <span className="ml-auto truncate text-right text-xs font-medium text-primary-c">{value}</span>
    </div>
  );
}

function InsightRow({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-slate-50 p-2.5 dark:bg-ink-850/60">
      <Icon className={cx('h-4 w-4 shrink-0', color)} />
      <span className="text-xs text-secondary-c">{label}</span>
      <span className="ml-auto text-xs font-bold text-primary-c">{value}</span>
    </div>
  );
}
