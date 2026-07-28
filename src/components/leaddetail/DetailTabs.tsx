import { useState } from 'react';
import { GlassCard, Badge, Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
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
  Activity as ActivityIcon,
  FolderOpen,
} from 'lucide-react';

export function ActivityTimeline({ enquiries }: { enquiries?: any[] }) {
  if (enquiries && enquiries.length > 0) {
    return (
      <div className="relative">
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border-base" />
        <div className="space-y-1">
          {enquiries.map((e, idx) => (
            <div
              key={e.id || idx}
              className="group relative flex gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50 dark:hover:bg-ink-850/60"
            >
              <div className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 ring-4 ring-card-c">
                <MessageSquare className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-primary-c">{e.type || 'Enquiry Received'}</p>
                  <span className="shrink-0 text-[10px] text-muted-c">
                    {e.createdAt ? new Date(e.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recently'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-secondary-c">{e.message || e.requirement || 'Enquiry logged for this lead.'}</p>
                <p className="mt-1 text-[10px] font-medium text-muted-c">by {e.name || e.source || 'Customer'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-c">
      <ActivityIcon className="h-8 w-8 opacity-40 mb-2" />
      <p className="text-sm font-semibold text-primary-c">No activity logged yet</p>
      <p className="text-xs text-muted-c mt-0.5">Enquiry activity and updates will appear here in real-time.</p>
    </div>
  );
}

export function NotesPanel({
  notes = [],
  onAddNote,
}: {
  notes?: { id: string; author: string; time: string; text: string }[];
  onAddNote?: (text: string) => void;
}) {
  const [inputNote, setInputNote] = useState('');

  const handleAdd = () => {
    if (!inputNote.trim() || !onAddNote) return;
    onAddNote(inputNote.trim());
    setInputNote('');
  };

  return (
    <div className="space-y-4">
      {/* Add note */}
      <div className="rounded-xl2 border border-base-c bg-card-c p-3">
        <textarea
          value={inputNote}
          onChange={(e) => setInputNote(e.target.value)}
          placeholder="Add a note about this lead…"
          rows={3}
          className="w-full resize-none bg-transparent text-sm text-primary-c placeholder:text-muted-c focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between">
          <button className="flex items-center gap-1 text-xs text-secondary-600 hover:text-secondary-700 dark:text-secondary-400">
            <Sparkles className="h-3.5 w-3.5" /> AI Summarize
          </button>
          <button
            onClick={handleAdd}
            disabled={!inputNote.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-105 disabled:opacity-50"
          >
            <Send className="h-3 w-3" /> Add Note
          </button>
        </div>
      </div>

      {/* Notes list */}
      {notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map((note) => (
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
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-c">
          <StickyNote className="h-8 w-8 opacity-40 mb-2" />
          <p className="text-xs font-semibold text-primary-c">No notes added yet for this lead</p>
          <p className="text-[11px] text-muted-c mt-0.5">Use the input box above to add internal team notes.</p>
        </div>
      )}
    </div>
  );
}

export function FilesPanel({ files = [] }: { files?: any[] }) {
  return (
    <div className="space-y-3">
      <button className="flex w-full items-center justify-center gap-2 rounded-xl2 border-2 border-dashed border-base-c py-4 text-xs font-medium text-muted-c transition-colors hover:border-primary-500/40 hover:text-primary-c">
        <Download className="h-4 w-4 rotate-180" /> Upload file or drag & drop
      </button>

      {files.length > 0 ? (
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div
              key={file.id || idx}
              className="group flex items-center gap-3 rounded-xl2 border border-base-c bg-card-c p-3 transition-all hover:border-primary-500/30 hover:shadow-soft"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-500/15 text-primary-600">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-primary-c">{file.name}</p>
                <p className="text-[10px] text-muted-c">
                  {file.size || 'Attachment'} · {file.uploadedBy || 'User'}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-c">
          <FolderOpen className="h-8 w-8 opacity-40 mb-2" />
          <p className="text-xs font-semibold text-primary-c">No files uploaded yet</p>
          <p className="text-[11px] text-muted-c mt-0.5">Upload documents or attachments related to this lead.</p>
        </div>
      )}
    </div>
  );
}
