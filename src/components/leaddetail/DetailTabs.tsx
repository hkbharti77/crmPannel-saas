import { GlassCard, Badge, Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { LEAD_DETAIL } from './leadDetailData';
import type { TimelineEvent, Note, LeadFile } from './leadDetailData';
import {
  MessageSquare,
  PhoneCall,
  Mail,
  CalendarPlus,
  StickyNote,
  GitBranch,
  Trophy,
  UserPlus,
  FileText,
  Image as ImageIcon,
  Sheet,
  FileType,
  Download,
  Send,
  Sparkles,
} from 'lucide-react';

const EVENT_ICONS: Record<TimelineEvent['type'], { icon: typeof MessageSquare; color: string; bg: string }> = {
  chat: { icon: MessageSquare, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  call: { icon: PhoneCall, color: '#2563EB', bg: 'rgba(37,99,235,0.12)' },
  email: { icon: Mail, color: '#2563EB', bg: 'rgba(37,99,235,0.12)' },
  appointment: { icon: CalendarPlus, color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
  note: { icon: StickyNote, color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  stage_change: { icon: GitBranch, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  won: { icon: Trophy, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  lead_created: { icon: UserPlus, color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
};

export function ActivityTimeline() {
  const events = LEAD_DETAIL.timeline;

  return (
    <div className="relative">
      <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border-base" />
      <div className="space-y-1">
        {[...events].reverse().map((e) => {
          const { icon: Icon, color, bg } = EVENT_ICONS[e.type];
          return (
            <div
              key={e.id}
              className="group relative flex gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50 dark:hover:bg-ink-850/60"
            >
              <div
                className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full ring-4 ring-card-c"
                style={{ backgroundColor: bg }}
              >
                <Icon className="h-4.5 w-4.5" style={{ color }} />
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-primary-c">{e.title}</p>
                  <span className="shrink-0 text-[10px] text-muted-c">{e.time}</span>
                </div>
                <p className="mt-0.5 text-xs text-secondary-c">{e.description}</p>
                <p className="mt-1 text-[10px] font-medium text-muted-c">by {e.actor}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function NotesPanel() {
  return (
    <div className="space-y-4">
      {/* Add note */}
      <div className="rounded-xl2 border border-base-c bg-card-c p-3">
        <textarea
          placeholder="Add a note about this lead…"
          rows={3}
          className="w-full resize-none bg-transparent text-sm text-primary-c placeholder:text-muted-c focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between">
          <button className="flex items-center gap-1 text-xs text-secondary-600 hover:text-secondary-700 dark:text-secondary-400">
            <Sparkles className="h-3.5 w-3.5" /> AI Summarize
          </button>
          <button className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-105">
            <Send className="h-3 w-3" /> Add Note
          </button>
        </div>
      </div>

      {/* Notes list */}
      <div className="space-y-3">
        {LEAD_DETAIL.notes.map((note: Note) => (
          <div key={note.id} className="rounded-xl2 border border-base-c bg-subtle-c p-3">
            <div className="mb-2 flex items-center gap-2">
              <Avatar name={note.author} size={24} />
              <span className="text-xs font-semibold text-primary-c">{note.author}</span>
              <span className="ml-auto text-[10px] text-muted-c">{note.time}</span>
            </div>
            <p className="text-sm leading-relaxed text-secondary-c">{note.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const FILE_ICON_MAP: Record<LeadFile['type'], typeof FileText> = {
  pdf: FileText,
  image: ImageIcon,
  doc: FileType,
  sheet: Sheet,
};

const FILE_COLORS: Record<LeadFile['type'], string> = {
  pdf: 'bg-danger-500/15 text-danger-600 dark:text-danger-400',
  image: 'bg-success-500/15 text-success-600 dark:text-success-400',
  doc: 'bg-primary-500/15 text-primary-600 dark:text-primary-400',
  sheet: 'bg-warning-500/15 text-warning-600 dark:text-warning-400',
};

export function FilesPanel() {
  return (
    <div className="space-y-3">
      <button className="flex w-full items-center justify-center gap-2 rounded-xl2 border-2 border-dashed border-base-c py-4 text-xs font-medium text-muted-c transition-colors hover:border-primary-500/40 hover:text-primary-c">
        <Download className="h-4 w-4 rotate-180" /> Upload file or drag & drop
      </button>

      <div className="space-y-2">
        {LEAD_DETAIL.files.map((file: LeadFile) => {
          const Icon = FILE_ICON_MAP[file.type];
          return (
            <div
              key={file.id}
              className="group flex items-center gap-3 rounded-xl2 border border-base-c bg-card-c p-3 transition-all hover:border-primary-500/30 hover:shadow-soft"
            >
              <div className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-lg', FILE_COLORS[file.type])}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-primary-c">{file.name}</p>
                <p className="text-[10px] text-muted-c">
                  {file.size} · {file.uploadedBy} · {file.time}
                </p>
              </div>
              <button className="grid h-8 w-8 place-items-center rounded-lg text-muted-c opacity-0 transition-opacity hover:bg-slate-100 hover:text-primary-c group-hover:opacity-100 dark:hover:bg-ink-800">
                <Download className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
