import { useState, useRef } from 'react';
import { Avatar } from '@/components/ui/primitives';
import type { LeadNoteDTO, LeadAttachmentDTO, LeadActivityDTO } from '@/lib/leadsApi';
import { getAuthToken, getTenantId } from '@/lib/api';
import {
  MessageSquare,
  PhoneCall,
  StickyNote,
  FileText,
  Download,
  Send,
  Sparkles,
  Activity as ActivityIcon,
  FolderOpen,
  Trash2,
  Loader2,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

export function ActivityTimeline({
  enquiries = [],
  activities = [],
}: {
  enquiries?: Array<Record<string, any>>;
  activities?: LeadActivityDTO[];
}) {
  const combined = [
    ...enquiries.map((e) => ({
      id: (e?.id as string) || Math.random().toString(),
      type: (e?.type as string) || 'Enquiry Received',
      message: (e?.message || e?.requirement || 'Enquiry logged for this lead.') as string,
      author: (e?.name || e?.source || 'Customer') as string,
      createdAt: e?.createdAt as string | number | Date | undefined,
      icon: MessageSquare,
    })),
    ...activities.map((a) => {
      let icon = ActivityIcon;
      let title = a.type;
      let msg = a.metadataJson || '';

      try {
        const meta = JSON.parse(a.metadataJson || '{}');
        if (a.type === 'NOTE_ADDED') {
          icon = StickyNote;
          title = 'Internal Note Added';
          msg = meta.noteId ? 'Added an internal note to lead record' : msg;
        } else if (a.type === 'FILE_UPLOADED') {
          icon = FileText;
          title = 'File Attachment Uploaded';
          msg = meta.fileName ? `Uploaded file attachment "${meta.fileName}"` : msg;
        } else if (a.type === 'CALL_INITIATED') {
          icon = PhoneCall;
          title = 'Outbound Call Initiated';
          msg = meta.phoneNumber ? `Outbound call placed to ${meta.phoneNumber}` : 'Outbound call initiated';
        } else if (a.type === 'LEAD_REASSIGNED') {
          icon = UserCheck;
          title = 'Lead Owner Reassigned';
          msg = meta.newOwner ? `Reassigned lead ownership to ${meta.newOwner}` : msg;
        }
      } catch {
        // fallback to raw string
      }

      return {
        id: a.id,
        type: title,
        message: msg,
        author: a.actorName,
        createdAt: a.createdAt as string | number | Date | undefined,
        icon,
      };
    }),
  ].sort((a, b) => {
    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return db - da;
  });

  if (combined.length > 0) {
    return (
      <div className="relative">
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-base-c" />
        <div className="space-y-1">
          {combined.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="group relative flex gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50 dark:hover:bg-ink-850/60"
              >
                <div className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 ring-4 ring-card-c">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-primary-c">{item.type}</p>
                    <span className="shrink-0 text-[10px] text-muted-c">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recently'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-secondary-c">{item.message}</p>
                  <p className="mt-1 text-[10px] font-medium text-muted-c">by {item.author}</p>
                </div>
              </div>
            );
          })}
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
  onDeleteNote,
  loading = false,
}: {
  notes?: LeadNoteDTO[];
  onAddNote: (text: string) => Promise<void>;
  onDeleteNote?: (noteId: string) => Promise<void>;
  loading?: boolean;
}) {
  const [inputNote, setInputNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!inputNote.trim() || submitting) return;
    setSubmitting(true);
    await onAddNote(inputNote.trim());
    setInputNote('');
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl2 border border-base-c bg-card-c p-3">
        <textarea
          value={inputNote}
          onChange={(e) => setInputNote(e.target.value)}
          placeholder="Add an internal note about this lead…"
          rows={3}
          className="w-full resize-none bg-transparent text-sm text-primary-c placeholder:text-muted-c focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between">
          <button className="flex items-center gap-1 text-xs text-secondary-600 hover:text-secondary-700 dark:text-secondary-400">
            <Sparkles className="h-3.5 w-3.5" /> Internal Audit Log
          </button>
          <button
            onClick={handleAdd}
            disabled={!inputNote.trim() || submitting}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-105 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Add Note
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
        </div>
      ) : notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="group relative rounded-xl2 border border-base-c bg-subtle-c p-3">
              <div className="mb-2 flex items-center gap-2">
                <Avatar name={note.authorName} size={24} />
                <span className="text-xs font-semibold text-primary-c">{note.authorName}</span>
                <span className="ml-auto text-[10px] text-muted-c">
                  {note.createdAt ? new Date(note.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recently'}
                </span>
                {onDeleteNote && (
                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-c hover:text-danger-500 transition-opacity"
                    title="Delete Note"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="text-sm leading-relaxed text-secondary-c whitespace-pre-wrap">{note.content}</p>
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

export function FilesPanel({
  files = [],
  onUploadFile,
  onDeleteFile,
  loading = false,
}: {
  files?: LeadAttachmentDTO[];
  onUploadFile: (file: File) => Promise<void>;
  onDeleteFile?: (fileId: string) => Promise<void>;
  loading?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setErrorMsg(null);

    // Client-side validation: Max 10MB
    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMsg('File size exceeds maximum limit of 10MB.');
      return;
    }

    setUploading(true);
    try {
      await onUploadFile(selectedFile);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = (file: LeadAttachmentDTO) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
    const token = getAuthToken();
    const tenantId = getTenantId();

    const fullUrl = `${API_BASE_URL}${file.downloadUrl}`;
    fetch(fullUrl, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => alert('Failed to download attachment'));
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.docx,.doc"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex w-full items-center justify-center gap-2 rounded-xl2 border-2 border-dashed border-base-c py-4 text-xs font-medium text-muted-c transition-colors hover:border-primary-500/40 hover:text-primary-c"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
        ) : (
          <Download className="h-4 w-4 rotate-180" />
        )}
        {uploading ? 'Uploading attachment...' : 'Upload file (PDF, PNG, JPG, DOCX - Max 10MB)'}
      </button>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-danger-500/20 bg-danger-500/10 p-3 text-xs text-danger-600 dark:text-danger-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
        </div>
      ) : files.length > 0 ? (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="group flex items-center gap-3 rounded-xl2 border border-base-c bg-card-c p-3 transition-all hover:border-primary-500/30 hover:shadow-soft"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-500/15 text-primary-600">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-primary-c">{file.fileName}</p>
                <p className="text-[10px] text-muted-c">
                  {(file.fileSize / 1024).toFixed(1)} KB · Uploaded by {file.uploaderName}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDownload(file)}
                  className="p-1 text-muted-c hover:text-primary-500"
                  title="Download File"
                >
                  <Download className="h-4 w-4" />
                </button>
                {onDeleteFile && (
                  <button
                    onClick={() => onDeleteFile(file.id)}
                    className="p-1 text-muted-c hover:text-danger-500"
                    title="Delete File"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
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
