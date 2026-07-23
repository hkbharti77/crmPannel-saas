import { GlassCard, Avatar } from '@/components/ui/primitives';
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

type Activity = {
  id: string;
  type: 'chat' | 'call' | 'appointment' | 'won' | 'email' | 'note' | 'lead';
  actor: string;
  text: string;
  time: string;
};

const ICONS: Record<Activity['type'], { icon: LucideIcon; color: string; bg: string }> = {
  chat: { icon: MessageSquare, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  call: { icon: PhoneCall, color: '#2563EB', bg: 'rgba(37,99,235,0.12)' },
  appointment: { icon: CalendarPlus, color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
  won: { icon: Trophy, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  email: { icon: Mail, color: '#2563EB', bg: 'rgba(37,99,235,0.12)' },
  note: { icon: FileText, color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  lead: { icon: UserPlus, color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
};

const ACTIVITIES: Activity[] = [
  { id: '1', type: 'won', actor: 'Priya Sharma', text: 'closed a deal with Metro Realty — ₹1,20,000', time: '2m ago' },
  { id: '2', type: 'chat', actor: 'Rahul Verma', text: 'started a new WhatsApp conversation', time: '8m ago' },
  { id: '3', type: 'lead', actor: 'System', text: 'captured a new lead from website chatbot', time: '15m ago' },
  { id: '4', type: 'appointment', actor: 'Sneha Patel', text: 'scheduled a site visit for tomorrow 11:00 AM', time: '32m ago' },
  { id: '5', type: 'call', actor: 'Arjun Kapoor', text: 'logged a follow-up call with Sunil Group', time: '1h ago' },
  { id: '6', type: 'email', actor: 'Priya Sharma', text: 'sent the Q3 pricing proposal to 4 leads', time: '2h ago' },
  { id: '7', type: 'note', actor: 'Rahul Verma', text: 'added a note on lead "Ananya Builders"', time: '3h ago' },
  { id: '8', type: 'won', actor: 'Sneha Patel', text: 'closed a deal with Apex Housing — ₹85,000', time: '5h ago' },
];

export function ActivityFeed() {
  return (
    <GlassCard className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-primary-c">Recent Activity</h3>
        <button className="text-xs font-medium text-muted-c transition-colors hover:text-primary-c">
          View all
        </button>
      </div>

      <div className="relative">
        <div className="absolute left-[18px] top-2 bottom-2 w-px bg-border-base" />

        <div className="space-y-1">
          {ACTIVITIES.map((a) => {
            const { icon: Icon, color, bg } = ICONS[a.type];
            return (
              <div
                key={a.id}
                className="group relative flex gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50 dark:hover:bg-ink-850/60"
              >
                <div
                  className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full ring-4 ring-card-c"
                  style={{ backgroundColor: bg }}
                >
                  <Icon className="h-4 w-4" style={{ color }} />
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <p className="text-sm text-primary-c">
                    <span className="font-semibold">{a.actor}</span>{' '}
                    <span className="text-secondary-c">{a.text}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-c">{a.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
