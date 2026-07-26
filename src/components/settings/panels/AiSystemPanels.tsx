import { useState } from 'react';
import { cx } from '@/lib/types';
import { Badge, Avatar } from '@/components/ui/primitives';
import {
  Brain, HelpCircle, Zap, LifeBuoy,
  Upload, FileText, Trash2, Plus, Check, Search,
  Server, Database, Cpu, HardDrive, Activity, RefreshCw,
  Mail, MessageSquare, Phone, ExternalLink, BookOpen,
} from 'lucide-react';
import { PanelHeader, FieldRow, Toggle, SaveBar, SectionCard, StatPill } from './_shared';

/* ─── Knowledge Base ─── */
export function KnowledgeBasePanel() {
  const [docs, setDocs] = useState([
    { id: 'd1', name: 'Property_Brochure_2026.pdf', size: '2.4 MB', status: 'trained', chunks: 142 },
    { id: 'd2', name: 'Pricing_Sheet.xlsx', size: '480 KB', status: 'trained', chunks: 38 },
    { id: 'd3', name: 'FAQ_Document.docx', size: '1.1 MB', status: 'processing', chunks: 0 },
  ]);
  const [botEnabled, setBotEnabled] = useState(true);
  const [autoReply, setAutoReply] = useState(true);
  const [fallbackHuman, setFallbackHuman] = useState(true);

  const statusMeta: Record<string, { label: string; variant: 'success' | 'warning' }> = {
    trained: { label: 'Trained', variant: 'success' },
    processing: { label: 'Processing', variant: 'warning' },
  };

  return (
    <div className="space-y-4">
      <SectionCard>
        <PanelHeader title="Knowledge Base" desc="Upload documents to train your RAG bot" icon={<Brain className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

        {/* Bot toggles */}
        <div className="mb-4 space-y-3 rounded-xl2 border border-base-c p-4">
          <FieldRow label="Enable AI Bot" desc="Let the bot answer customer questions automatically">
            <Toggle checked={botEnabled} onChange={setBotEnabled} />
          </FieldRow>
          <div className="border-t border-base-c" />
          <FieldRow label="Auto-Reply on WhatsApp" desc="Bot replies instantly when a lead messages">
            <Toggle checked={autoReply} onChange={setAutoReply} />
          </FieldRow>
          <div className="border-t border-base-c" />
          <FieldRow label="Fallback to Human Agent" desc="Hand off to a human when the bot can't answer">
            <Toggle checked={fallbackHuman} onChange={setFallbackHuman} />
          </FieldRow>
        </div>

        {/* Upload zone */}
        <div className="rounded-xl2 border-2 border-dashed border-base-c p-6 text-center transition-colors hover:border-primary-500/30">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-500/10">
            <Upload className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <p className="mt-3 text-sm font-semibold text-primary-c">Drop documents here or click to upload</p>
          <p className="text-xs text-muted-c">PDF, DOCX, TXT, XLSX — max 10MB each</p>
          <button className="mt-3 rounded-lg bg-gradient-accent px-4 py-2 text-xs font-semibold text-white hover:scale-105">
            Choose Files
          </button>
        </div>

        {/* Document list */}
        <div className="mt-4 space-y-2">
          {docs.map((d) => {
            const meta = statusMeta[d.status];
            return (
              <div key={d.id} className="flex items-center gap-3 rounded-xl2 border border-base-c p-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-500/10">
                  <FileText className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-primary-c">{d.name}</p>
                  <p className="text-xs text-muted-c">{d.size} · {d.chunks > 0 ? `${d.chunks} chunks` : 'indexing…'}</p>
                </div>
                <Badge variant={meta.variant}>{meta.label}</Badge>
                <button onClick={() => setDocs((prev) => prev.filter((x) => x.id !== d.id))} className="grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:bg-danger-500/10 hover:text-danger-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <StatPill label="Documents" value={String(docs.length)} color="bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300" />
          <StatPill label="Total Chunks" value={String(docs.reduce((s, d) => s + d.chunks, 0))} color="bg-secondary-100 text-secondary-700 dark:bg-secondary-500/15 dark:text-secondary-300" />
          <StatPill label="Status" value="Ready" color="bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300" />
        </div>
      </SectionCard>
    </div>
  );
}

/* ─── Support Categories ─── */
export function SupportCategoriesPanel() {
  const [cats, setCats] = useState([
    { id: 'cat1', name: 'Pricing Inquiry', emoji: '💰', tickets: 42 },
    { id: 'cat2', name: 'Site Visit Request', emoji: '🏠', tickets: 28 },
    { id: 'cat3', name: 'Property Details', emoji: '📋', tickets: 35 },
    { id: 'cat4', name: 'Booking Issue', emoji: '🎫', tickets: 12 },
    { id: 'cat5', name: 'General Query', emoji: '💬', tickets: 56 },
  ]);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <SectionCard>
      <PanelHeader title="Support Categories" desc="Categories for WhatsApp support requests" icon={<HelpCircle className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-secondary-c">{cats.length} categories</p>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-2 text-xs font-semibold text-white hover:scale-105">
          <Plus className="h-3.5 w-3.5" /> Add Category
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {cats.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-xl2 border border-base-c p-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-lg dark:bg-ink-800">{c.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-primary-c">{c.name}</p>
              <p className="text-xs text-muted-c">{c.tickets} tickets this month</p>
            </div>
            <button onClick={() => setCats((prev) => prev.filter((x) => x.id !== c.id))} className="grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:bg-danger-500/10 hover:text-danger-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-sm rounded-xl2 border border-base-c bg-card-c p-5 shadow-soft-lg animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h4 className="mb-4 text-sm font-bold text-primary-c">Add Support Category</h4>
            <div className="space-y-3">
              <input className="form-input" placeholder="Category name" />
              <input className="form-input" placeholder="Emoji (e.g. 🏠)" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowAdd(false)} className="rounded-lg border border-base-c px-4 py-2 text-xs font-medium text-secondary-c">Cancel</button>
              <button onClick={() => setShowAdd(false)} className="rounded-lg bg-gradient-accent px-4 py-2 text-xs font-semibold text-white">Add</button>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

/* ─── System Health ─── */
export function SystemHealthPanel() {
  const services = [
    { name: 'API Gateway', status: 'operational', latency: '42ms', uptime: '99.98%' },
    { name: 'WhatsApp Cloud API', status: 'operational', latency: '128ms', uptime: '99.95%' },
    { name: 'PostgreSQL Database', status: 'operational', latency: '8ms', uptime: '99.99%' },
    { name: 'AI / RAG Engine', status: 'operational', latency: '340ms', uptime: '99.92%' },
    { name: 'Email Service', status: 'degraded', latency: '820ms', uptime: '98.40%' },
    { name: 'Webhook Processor', status: 'operational', latency: '15ms', uptime: '99.97%' },
  ];

  const statusMeta: Record<string, { label: string; dot: string; color: string }> = {
    operational: { label: 'Operational', dot: 'bg-success-500', color: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300' },
    degraded: { label: 'Degraded', dot: 'bg-warning-500', color: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300' },
    down: { label: 'Down', dot: 'bg-danger-500', color: 'bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300' },
  };

  return (
    <div className="space-y-4">
      <SectionCard>
        <PanelHeader title="System Health" desc="Backend telemetry & service status" icon={<Zap className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

        <div className="flex items-center justify-between rounded-xl2 bg-gradient-accent-soft p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl2 bg-success-500/15">
              <Activity className="h-5 w-5 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary-c">All Systems Operational</p>
              <p className="text-xs text-muted-c">Last checked 2 minutes ago</p>
            </div>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-base-c bg-card-c px-3 py-2 text-xs font-medium text-secondary-c hover:text-primary-c">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <HealthStat icon={Server} label="API Latency" value="42ms" />
          <HealthStat icon={Cpu} label="CPU Usage" value="34%" />
          <HealthStat icon={HardDrive} label="Storage" value="61%" />
          <HealthStat icon={Database} label="DB Queries" value="1.2K/s" />
        </div>
      </SectionCard>

      <SectionCard>
        <h4 className="text-sm font-semibold text-primary-c">Service Status</h4>
        <div className="mt-3 space-y-2">
          {services.map((s) => {
            const meta = statusMeta[s.status];
            return (
              <div key={s.name} className="flex items-center gap-3 rounded-xl2 border border-base-c p-3">
                <span className={cx('h-2.5 w-2.5 shrink-0 rounded-full', meta.dot)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-primary-c">{s.name}</p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-medium text-secondary-c">{s.latency}</p>
                  <p className="text-[10px] text-muted-c">{s.uptime} uptime</p>
                </div>
                <Badge variant={s.status === 'operational' ? 'success' : 'warning'}>{meta.label}</Badge>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}

function HealthStat({ icon: Icon, label, value }: { icon: typeof Server; label: string; value: string }) {
  return (
    <div className="rounded-xl2 border border-base-c p-3">
      <Icon className="h-4 w-4 text-muted-c" />
      <p className="mt-2 text-lg font-bold text-primary-c tabular-nums">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-c">{label}</p>
    </div>
  );
}

/* ─── Need Help ─── */
export function NeedHelpPanel() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const channels = [
    { icon: MessageSquare, label: 'Live Chat', value: 'Available 24/7', action: 'Start chat' },
    { icon: Mail, label: 'Email Support', value: 'support@crmlite.io', action: 'Send email' },
    { icon: Phone, label: 'Phone Support', value: '+91 80 4567 8900', action: 'Call now' },
  ];

  const faqs = [
    { q: 'How do I connect my WhatsApp number?', a: 'Go to Configuration → Meta Integration and enter your Phone Number ID and Access Token from Meta Business Suite.' },
    { q: 'How do I train the AI bot?', a: 'Upload documents in the Knowledge Base section. The bot will use them to answer customer questions automatically.' },
    { q: 'Can I customize the lead capture form?', a: 'Yes, go to Configuration → Form Fields to add, remove, or reorder fields in your WhatsApp lead form.' },
    { q: 'How do I invite team members?', a: 'Navigate to Account → Staff Management and click "Invite Member" to send an email invitation.' },
  ];

  return (
    <div className="space-y-4">
      <SectionCard>
        <PanelHeader title="Need Help?" desc="Contact our support team for assistance" icon={<LifeBuoy className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

        <div className="grid gap-3 sm:grid-cols-3">
          {channels.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="rounded-xl2 border border-base-c p-4 text-center">
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl2 bg-primary-500/10">
                  <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <p className="mt-2 text-sm font-semibold text-primary-c">{c.label}</p>
                <p className="text-xs text-muted-c">{c.value}</p>
                <button className="mt-2 text-xs font-medium text-primary-600 hover:underline dark:text-primary-400">{c.action}</button>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard>
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-c" />
          <h4 className="text-sm font-semibold text-primary-c">Frequently Asked Questions</h4>
        </div>
        <div className="mt-3 space-y-2">
          {faqs.map((f, i) => (
            <FAQItem key={i} q={f.q} a={f.a} />
          ))}
        </div>
        <a href="#" className="mt-3 flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline dark:text-primary-400">
          <ExternalLink className="h-3 w-3" /> Browse full documentation
        </a>
      </SectionCard>

      <SectionCard>
        <h4 className="text-sm font-semibold text-primary-c">Send a Support Ticket</h4>
        <div className="mt-3 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary-c">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Briefly describe the issue" className="form-input" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary-c">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Describe the issue in detail…" className="form-input resize-none" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            disabled={!subject.trim() || !message.trim()}
            className={cx(
              'flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all',
              subject.trim() && message.trim() ? 'bg-gradient-accent text-white hover:scale-105' : 'bg-slate-300 text-slate-500 dark:bg-ink-700',
            )}
          >
            <Mail className="h-3.5 w-3.5" /> Submit Ticket
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl2 border border-base-c">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-2 p-3 text-left">
        <span className="text-sm font-medium text-primary-c">{q}</span>
        <Plus className={cx('h-4 w-4 shrink-0 text-muted-c transition-transform', open && 'rotate-45')} />
      </button>
      {open && <p className="px-3 pb-3 text-xs leading-relaxed text-secondary-c">{a}</p>}
    </div>
  );
}
