import { GlassCard } from '@/components/ui/primitives';
import {
  MessageSquare,
  PhoneCall,
  CalendarPlus,
  Trophy,
  Mail,
  FileText,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import type { ActivityLogDTO } from '@/lib/dashboardApi';

const ICONS: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  chat: { icon: MessageSquare, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  call: { icon: PhoneCall, color: '#2563EB', bg: 'rgba(37,99,235,0.12)' },
  appointment: { icon: CalendarPlus, color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
  won: { icon: Trophy, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  email: { icon: Mail, color: '#2563EB', bg: 'rgba(37,99,235,0.12)' },
  note: { icon: FileText, color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  lead: { icon: UserPlus, color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
};

export function ActivityFeed({ activities = [] }: { activities?: ActivityLogDTO[] }) {
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return 'Just now';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-primary-c">Recent Activity</h3>
      </div>

      {activities.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-c">
          No recent activity logged for this workspace yet.
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[18px] top-2 bottom-2 w-px bg-border-base" />

          <div className="space-y-1">
            {activities.map((a) => {
              const actType = (a.activityType || a.action || 'note').toLowerCase();
              // Map backend activity type codes to icon keys
              const iconKey = actType.includes('chat') || actType.includes('message') ? 'chat'
                : actType.includes('call') ? 'call'
                : actType.includes('appointment') ? 'appointment'
                : actType.includes('won') || actType.includes('closed_won') ? 'won'
                : actType.includes('email') ? 'email'
                : actType.includes('lead') ? 'lead'
                : 'note';
              const iconObj = ICONS[iconKey] || ICONS['note'];
              const Icon = iconObj.icon;

              // Actor: prefer contactName (who the activity is about), fallback to ownerName
              const displayName = a.contactName || a.actorName || a.ownerName || 'System';
              // Description: prefer summary, fallback to activityType/action
              const displayDesc = a.summary || a.description || a.activityType || a.action || '';

              return (
                <div
                  key={a.id}
                  className="group relative flex gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50 dark:hover:bg-ink-850/60"
                >
                  <div
                    className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full ring-4 ring-card-c"
                    style={{ backgroundColor: iconObj.bg }}
                  >
                    <Icon className="h-4 w-4" style={{ color: iconObj.color }} />
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="text-sm text-primary-c">
                      <span className="font-semibold">{displayName}</span>{' '}
                      <span className="text-secondary-c">{displayDesc}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-c">{formatTime(a.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

