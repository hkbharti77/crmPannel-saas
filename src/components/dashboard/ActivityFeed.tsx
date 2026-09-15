import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/ui/primitives';
import {
  MessageSquare,
  PhoneCall,
  CalendarPlus,
  Trophy,
  Mail,
  FileText,
  UserPlus,
  Activity,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import type { ActivityLogDTO } from '@/lib/dashboardApi';

const ICONS: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  chat: { icon: MessageSquare, color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  call: { icon: PhoneCall, color: '#2563EB', bg: 'rgba(37,99,235,0.15)' },
  appointment: { icon: CalendarPlus, color: '#7C3AED', bg: 'rgba(124,58,237,0.15)' },
  won: { icon: Trophy, color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  email: { icon: Mail, color: '#2563EB', bg: 'rgba(37,99,235,0.15)' },
  note: { icon: FileText, color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
  lead: { icon: UserPlus, color: '#7C3AED', bg: 'rgba(124,58,237,0.15)' },
};

export function ActivityFeed({ activities = [] }: { activities?: ActivityLogDTO[] }) {
  const navigate = useNavigate();

  const top10Activities = useMemo(() => {
    return (activities || []).slice(0, 10);
  }, [activities]);

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return 'Just now';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const handleActivityClick = (a: ActivityLogDTO) => {
    const actType = ((a.activityType || '') + ' ' + (a.summary || '') + ' ' + (a.source || '') + ' ' + (a.action || '')).toLowerCase();

    if (actType.includes('ticket')) {
      navigate('/tickets');
    } else if (actType.includes('appointment') || actType.includes('meeting') || actType.includes('booking')) {
      navigate('/appointments');
    } else if (actType.includes('email')) {
      navigate('/emails');
    } else if (actType.includes('chat') || actType.includes('message') || actType.includes('inbox') || actType.includes('wa_')) {
      navigate('/inbox');
    } else {
      // Default lead & pipeline navigation
      navigate('/pipeline');
    }
  };

  return (
    <GlassCard className="p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-base-c pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary-c">Recent Activity Stream</h3>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          Top 10 Latest
        </span>
      </div>

      {top10Activities.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-c">
          No recent activity logged for this workspace yet.
        </div>
      ) : (
        <div className="relative pl-1">
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-ink-800" />

          <div className="space-y-2">
            {top10Activities.map((a) => {
              const actType = (a.activityType || a.action || 'note').toLowerCase();
              const iconKey = actType.includes('chat') || actType.includes('message') ? 'chat'
                : actType.includes('call') ? 'call'
                : actType.includes('appointment') ? 'appointment'
                : actType.includes('won') || actType.includes('closed_won') ? 'won'
                : actType.includes('email') ? 'email'
                : actType.includes('lead') ? 'lead'
                : 'note';
              const iconObj = ICONS[iconKey] || ICONS['note'];
              const Icon = iconObj.icon;

              const displayName = a.contactName || a.actorName || a.ownerName || 'System';
              const displayDesc = a.summary || a.description || a.activityType || a.action || '';

              return (
                <div
                  key={a.id}
                  onClick={() => handleActivityClick(a)}
                  className="group relative flex items-center gap-3 rounded-2xl p-2.5 transition-all hover:bg-slate-100 dark:hover:bg-ink-850/80 cursor-pointer border border-transparent hover:border-base-c"
                  title="Click to open page details"
                >
                  <div
                    className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-2xl ring-4 ring-card-c shadow-xs transition-transform group-hover:scale-105"
                    style={{ backgroundColor: iconObj.bg }}
                  >
                    <Icon className="h-4 w-4" style={{ color: iconObj.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-primary-c leading-relaxed group-hover:text-blue-600 transition-colors">
                      <strong className="font-bold text-primary-c">{displayName}</strong>{' '}
                      <span className="text-secondary-c">{displayDesc}</span>
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-c font-medium">{formatTime(a.createdAt)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-c group-hover:text-primary-c transition-transform group-hover:translate-x-0.5 shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
