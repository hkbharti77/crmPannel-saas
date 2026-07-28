import { useState, useEffect } from 'react';
import { GlassCard, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { LeadDetailHeader } from './LeadDetailHeader';
import { ActivityTimeline, NotesPanel, FilesPanel } from './DetailTabs';
import { fetchLeadById, type LeadDTO } from '@/lib/leadsApi';
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

export function LeadDetailView({
  leadId,
  leadObj,
  onBack,
}: {
  leadId?: string | null;
  leadObj?: any;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<TabId>('timeline');
  const [lead, setLead] = useState<LeadDTO | null>(leadObj || null);
  const [loading, setLoading] = useState(false);
  const [localNotes, setLocalNotes] = useState<{ id: string; author: string; time: string; text: string }[]>([]);
  const [localFiles, setLocalFiles] = useState<any[]>([]);

  useEffect(() => {
    if (leadId && leadId.includes('-')) {
      setLoading(true);
      fetchLeadById(leadId).then(({ data }) => {
        setLoading(false);
        if (data) {
          setLead(data);
        }
      });
    }
  }, [leadId]);

  const phone = lead?.contact?.phone || lead?.contact?.waId || leadObj?.phone || 'N/A';
  const email = lead?.contact?.email || leadObj?.email || 'N/A';
  const location = lead?.contact?.source || 'N/A';
  const budget = lead?.dealValue ? `₹${lead.dealValue}` : 'Not specified';
  const firstEnquiry = lead?.enquiries?.[0];
  const interest = firstEnquiry?.requirement || firstEnquiry?.serviceCategory || lead?.dealLabel || 'General Inquiry';
  const source = lead?.contact?.source || leadObj?.source || 'WhatsApp Ingress';
  const assignedTo = lead?.ownerName || leadObj?.assignedTo || 'Unassigned';
  const createdAtStr = lead?.createdAtHuman || 'Recently';
  const lastActivityStr = lead?.lastActivity ? new Date(lead.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently';
  const dealValueStr = lead?.dealValue ? `₹${lead.dealValue}` : '₹0';
  const priority = lead?.score && lead.score > 70 ? 'HIGH' : leadObj?.priority || 'MEDIUM';
  const enquiries = lead?.enquiries || [];

  const handleAddNote = (text: string) => {
    const newNote = {
      id: `n-${Date.now()}`,
      author: lead?.ownerName || 'Agent',
      time: 'Just now',
      text,
    };
    setLocalNotes((prev) => [newNote, ...prev]);
  };

  const tabs: { id: TabId; label: string; icon: typeof ActivityIcon; count?: number }[] = [
    { id: 'timeline', label: 'Timeline', icon: ActivityIcon, count: enquiries.length },
    { id: 'notes', label: 'Notes', icon: StickyNote, count: localNotes.length },
    { id: 'files', label: 'Files', icon: FolderOpen, count: localFiles.length },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 lg:p-6">
      <LeadDetailHeader lead={lead} onBack={onBack} />

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        {/* Left: tabbed content */}
        <div className="space-y-4">
          {/* Tab bar */}
          <div className="flex items-center gap-1.5 rounded-xl2 border border-base-c bg-card-c p-1">
            {tabs.map((t) => {
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
            {tab === 'timeline' && <ActivityTimeline enquiries={enquiries} />}
            {tab === 'notes' && <NotesPanel notes={localNotes} onAddNote={handleAddNote} />}
            {tab === 'files' && <FilesPanel files={localFiles} />}
          </GlassCard>
        </div>

        {/* Right: info sidebar */}
        <div className="space-y-4">
          {/* Lead info */}
          <GlassCard className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-primary-c">Lead Information</h3>
            <div className="space-y-3">
              <InfoRow icon={Phone} label="Phone" value={phone} />
              <InfoRow icon={Mail} label="Email" value={email} />
              <InfoRow icon={MapPin} label="Location" value={location} />
              <InfoRow icon={DollarSign} label="Budget" value={budget} />
              <InfoRow icon={Target} label="Interest" value={interest} />
              <InfoRow icon={Radio} label="Source" value={source} />
              <InfoRow icon={UserCheck} label="Assigned to" value={assignedTo} />
              <InfoRow icon={Calendar} label="Created" value={createdAtStr} />
              <InfoRow icon={Clock} label="Last activity" value={lastActivityStr} />
            </div>
          </GlassCard>

          {/* Deal value + priority */}
          <GlassCard className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-primary-c">Deal Metrics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl2 bg-gradient-accent-soft p-3">
                <span className="text-xs text-secondary-c">Deal Value</span>
                <span className="text-xl font-bold text-primary-c tabular-nums">{dealValueStr}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary-c">Priority</span>
                <Badge variant={priority === 'HIGH' ? 'danger' : priority === 'MEDIUM' ? 'warning' : 'neutral'}>
                  {priority}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary-c">Sentiment</span>
                <Badge variant="success">Positive</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary-c">Lead Quality</span>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-success-500" />
                  <span className="text-xs font-medium text-primary-c">GREEN</span>
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
      <span className="ml-auto truncate text-right text-xs font-medium text-primary-c max-w-[150px]">{value}</span>
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
