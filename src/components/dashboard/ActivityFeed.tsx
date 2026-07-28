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
      const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
      if (diff < 1) return 'Just now';
      if (diff < 60) return `${diff}m ago`;
      const hours = Math.floor(diff / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
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
              const actType = (a.action || 'note').toLowerCase();
              const iconObj = ICONS[actType] || ICONS['note'];
              const Icon = iconObj.icon;

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
                      <span className="font-semibold">{a.actorName || 'System'}</span>{' '}
                      <span className="text-secondary-c">{a.description || a.action}</span>
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

