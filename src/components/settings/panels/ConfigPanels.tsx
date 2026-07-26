import { useState } from 'react';
import { cx } from '@/lib/types';
import { Badge } from '@/components/ui/primitives';
import {
  Plug, FileText, LayoutList, ShoppingBag, FormInput, ListTree,
  Mail, MessageSquare, MousePointerClick,
  Check, Plus, Trash2, X, Search, RefreshCw, ExternalLink, ChevronDown, ChevronUp,
  Building2, Home, Square, Store,
} from 'lucide-react';
import { PanelHeader, FieldRow, Toggle, SaveBar, SectionCard } from './_shared';

/* ─── Meta Integration ─── */
export function MetaIntegrationPanel() {
  const [mode, setMode] = useState<'cloud' | 'embedded'>('cloud');
  const [phoneNumberId, setPhoneNumberId] = useState('123456789012345');
  const [wabaId, setWabaId] = useState('987654321098765');
  const [accessToken, setAccessToken] = useState('EAAG•••••••••••••••••••••••');
  const [verified, setVerified] = useState(true);

  return (
    <div className="space-y-4">
      <SectionCard>
        <PanelHeader title="Meta Integration" desc="WhatsApp API credentials & Dual Connection Modes" icon={<Plug className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

        {/* Connection modes */}
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-c">Connection Mode</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <ModeCard
            active={mode === 'cloud'}
            onClick={() => setMode('cloud')}
            title="Cloud API"
            desc="Meta-hosted API. Faster setup, no server needed."
            badge="Recommended"
          />
          <ModeCard
            active={mode === 'embedded'}
            onClick={() => setMode('embedded')}
            title="Embedded Sign Up"
            desc="Direct from Meta Business Suite."
          />
        </div>

        {/* Credentials */}
        <div className="mt-5 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary-c">Phone Number ID</label>
            <input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary-c">WhatsApp Business Account ID</label>
            <input value={wabaId} onChange={(e) => setWabaId(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary-c">Access Token</label>
            <input value={accessToken} onChange={(e) => setAccessToken(e.target.value)} className="form-input" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => setVerified(!verified)}
            className={cx(
              'flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all',
              verified ? 'bg-success-500/10 text-success-600 dark:text-success-400' : 'bg-gradient-accent text-white hover:scale-105',
            )}
          >
            {verified ? <><Check className="h-3.5 w-3.5" /> Verified</> : 'Verify Connection'}
          </button>
          <a href="#" className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline dark:text-primary-400">
            <ExternalLink className="h-3 w-3" /> Meta Business Dashboard
          </a>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-primary-c">Webhook Configuration</h4>
          <Badge variant={verified ? 'success' : 'warning'}>
            {verified ? 'Active' : 'Pending'}
          </Badge>
        </div>
        <div className="mt-3 rounded-xl2 border border-base-c p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-c">Callback URL</p>
          <p className="mt-1 break-all text-xs font-mono text-secondary-c">https://api.crmlite.io/webhooks/whatsapp/waba_987654</p>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {['messages', 'message_status', 'message_template_status_update', 'phone_number_quality_update'].map((t) => (
            <span key={t} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-mono text-secondary-c dark:bg-ink-800">{t}</span>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function ModeCard({ active, onClick, title, desc, badge }: { active: boolean; onClick: () => void; title: string; desc: string; badge?: string }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'rounded-xl2 border-2 p-4 text-left transition-all',
        active ? 'border-primary-500/40 bg-primary-500/5' : 'border-base-c hover:border-primary-500/20',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-primary-c">{title}</span>
        {badge && <Badge variant="gradient">{badge}</Badge>}
        {active && !badge && <Check className="h-4 w-4 text-primary-500" />}
      </div>
      <p className="mt-1.5 text-xs text-muted-c">{desc}</p>
    </button>
  );
}

/* ─── WhatsApp Template Builder ─── */
export function WhatsAppTemplatesPanel() {
  const [templates, setTemplates] = useState([
    { id: 't1', name: 'appointment_reminder', lang: 'en_US', status: 'APPROVED', category: 'UTILITY' },
    { id: 't2', name: 'lead_followup', lang: 'en_US', status: 'APPROVED', category: 'MARKETING' },
    { id: 't3', name: 'property_listing', lang: 'en_US', status: 'PENDING', category: 'MARKETING' },
    { id: 't4', name: 'welcome_message', lang: 'en_US', status: 'REJECTED', category: 'AUTHENTICATION' },
  ]);
  const [showCreate, setShowCreate] = useState(false);

  const statusColor: Record<string, string> = {
    APPROVED: 'success',
    PENDING: 'warning',
    REJECTED: 'danger',
  };

  return (
    <SectionCard>
      <PanelHeader title="WhatsApp Template Builder" desc="Create HSM message templates & sync Meta directory" icon={<FileText className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-secondary-c">{templates.length} templates</p>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-base-c px-3 py-2 text-xs font-medium text-secondary-c hover:text-primary-c">
            <RefreshCw className="h-3.5 w-3.5" /> Sync with Meta
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-2 text-xs font-semibold text-white hover:scale-105">
            <Plus className="h-3.5 w-3.5" /> New Template
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {templates.map((t) => (
          <div key={t.id} className="flex items-center gap-3 rounded-xl2 border border-base-c p-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-500/10">
              <FileText className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-primary-c">{t.name}</p>
              <p className="text-xs text-muted-c">{t.lang} · {t.category}</p>
            </div>
            <Badge variant={statusColor[t.status] as 'success' | 'warning' | 'danger'}>{t.status}</Badge>
            <button onClick={() => setTemplates((prev) => prev.filter((x) => x.id !== t.id))} className="grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:bg-danger-500/10 hover:text-danger-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {showCreate && (
        <TemplateModal onClose={() => setShowCreate(false)} onCreate={(name) => {
          setTemplates((prev) => [{ id: `t${prev.length + 1}`, name, lang: 'en_US', status: 'PENDING', category: 'MARKETING' }, ...prev]);
          setShowCreate(false);
        }} />
      )}
    </SectionCard>
  );
}

function TemplateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('MARKETING');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl2 border border-base-c bg-card-c p-5 shadow-soft-lg animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-bold text-primary-c">New WhatsApp Template</h4>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:bg-slate-100 dark:hover:bg-ink-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary-c">Template Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. property_inquiry" className="form-input" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary-c">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-input">
              <option>MARKETING</option>
              <option>UTILITY</option>
              <option>AUTHENTICATION</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary-c">Message Body</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Hello {{1}}, your site visit is scheduled for {{2}}…" className="form-input resize-none" />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-base-c px-4 py-2 text-xs font-medium text-secondary-c">Cancel</button>
          <button onClick={() => name.trim() && onCreate(name.trim())} disabled={!name.trim()} className={cx('rounded-lg px-4 py-2 text-xs font-semibold', name.trim() ? 'bg-gradient-accent text-white hover:scale-105' : 'bg-slate-300 text-slate-500 dark:bg-ink-700')}>
            Submit for Approval
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Menu & Buttons ─── */
export function MenuButtonsPanel() {
  const [buttons, setButtons] = useState([
    { id: 'b1', label: 'Book a Site Visit', enabled: true },
    { id: 'b2', label: 'Browse Properties', enabled: true },
    { id: 'b3', label: 'Talk to an Agent', enabled: true },
    { id: 'b4', label: 'Schedule a Call', enabled: false },
  ]);

  return (
    <SectionCard>
      <PanelHeader title="Menu & Buttons" desc="Customize the UI buttons shown to your customers" icon={<LayoutList className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

      <div className="space-y-2">
        {buttons.map((b) => (
          <div key={b.id} className="flex items-center gap-3 rounded-xl2 border border-base-c p-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-500/10">
              <LayoutList className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            </div>
            <input
              value={b.label}
              onChange={(e) => setButtons((prev) => prev.map((x) => x.id === b.id ? { ...x, label: e.target.value } : x))}
              className="flex-1 bg-transparent text-sm font-medium text-primary-c focus:outline-none"
            />
            <Toggle checked={b.enabled} onChange={(v) => setButtons((prev) => prev.map((x) => x.id === b.id ? { ...x, enabled: v } : x))} />
            <button onClick={() => setButtons((prev) => prev.filter((x) => x.id !== b.id))} className="grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:bg-danger-500/10 hover:text-danger-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-base-c px-3 py-2 text-xs font-medium text-secondary-c hover:border-primary-500/30 hover:text-primary-c">
        <Plus className="h-3.5 w-3.5" /> Add Button
      </button>

      <div className="mt-5"><SaveBar onSave={() => {}} /></div>
    </SectionCard>
  );
}

/* ─── Menu Builder ─── */
export function MenuBuilderPanel() {
  const [cards, setCards] = useState([
    { id: 'c1', title: 'Dashboard', icon: 'LayoutDashboard', visible: true },
    { id: 'c2', title: 'Inbox', icon: 'MessageSquare', visible: true },
    { id: 'c3', title: 'Pipeline', icon: 'KanbanSquare', visible: true },
    { id: 'c4', title: 'Properties', icon: 'Building2', visible: true },
    { id: 'c5', title: 'Reports', icon: 'BarChart3', visible: true },
    { id: 'c6', title: 'Team', icon: 'Users', visible: true },
  ]);

  const move = (id: string, dir: -1 | 1) => {
    setCards((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

  return (
    <SectionCard>
      <PanelHeader title="Menu Builder" desc="Customize the main sidebar cards — reorder and toggle visibility" icon={<LayoutList className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

      <div className="space-y-2">
        {cards.map((c, idx) => (
          <div key={c.id} className="flex items-center gap-3 rounded-xl2 border border-base-c p-3">
            <div className="flex flex-col">
              <button onClick={() => move(c.id, -1)} disabled={idx === 0} className="text-muted-c hover:text-primary-c disabled:opacity-30">
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => move(c.id, 1)} disabled={idx === cards.length - 1} className="text-muted-c hover:text-primary-c disabled:opacity-30">
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-muted-c dark:bg-ink-800">{idx + 1}</span>
            <span className="flex-1 text-sm font-medium text-primary-c">{c.title}</span>
            <Toggle checked={c.visible} onChange={(v) => setCards((prev) => prev.map((x) => x.id === c.id ? { ...x, visible: v } : x))} />
          </div>
        ))}
      </div>

      <div className="mt-5"><SaveBar onSave={() => {}} /></div>
    </SectionCard>
  );
}

/* ─── Products & Services ─── */
export function ProductsServicesPanel() {
  const [products, setProducts] = useState([
    { id: 'p1', name: 'Skyline Residency 3BHK', price: '₹1.2Cr', type: 'Apartment', icon: 'Building2' },
    { id: 'p2', name: 'Green Acres Villa', price: '₹2.8Cr', type: 'Villa', icon: 'Home' },
    { id: 'p3', name: 'Consultation Call', price: 'Free', type: 'Service', icon: 'Square' },
    { id: 'p4', name: 'Metro Square Commercial', price: '₹4.5Cr', type: 'Commercial', icon: 'Store' },
  ]);

  const ICONS: Record<string, typeof Building2> = { Building2, Home, Square, Store };
  const [showAdd, setShowAdd] = useState(false);

  return (
    <SectionCard>
      <PanelHeader title="Products & Services" desc="Manage your catalog of properties and services" icon={<ShoppingBag className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-secondary-c">{products.length} items</p>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-2 text-xs font-semibold text-white hover:scale-105">
          <Plus className="h-3.5 w-3.5" /> Add Product
        </button>
      </div>

      <div className="space-y-2">
        {products.map((p) => {
          const Icon = ICONS[p.icon] ?? Square;
          return (
            <div key={p.id} className="flex items-center gap-3 rounded-xl2 border border-base-c p-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-500/10">
                <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-primary-c">{p.name}</p>
                <p className="text-xs text-muted-c">{p.type}</p>
              </div>
              <span className="text-sm font-bold text-primary-c">{p.price}</span>
              <button onClick={() => setProducts((prev) => prev.filter((x) => x.id !== p.id))} className="grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:bg-danger-500/10 hover:text-danger-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-md rounded-xl2 border border-base-c bg-card-c p-5 shadow-soft-lg animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-bold text-primary-c">Add Product / Service</h4>
              <button onClick={() => setShowAdd(false)} className="grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:bg-slate-100 dark:hover:bg-ink-800"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input className="form-input" placeholder="Product name" />
              <input className="form-input" placeholder="Price (e.g. ₹1.2Cr)" />
              <select className="form-input" defaultValue="Apartment">
                <option>Apartment</option><option>Villa</option><option>Plot</option><option>Commercial</option><option>Service</option>
              </select>
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

/* ─── Form Fields ─── */
export function FormFieldsPanel() {
  const [fields, setFields] = useState([
    { id: 'f1', label: 'Full Name', type: 'text', required: true },
    { id: 'f2', label: 'Phone Number', type: 'tel', required: true },
    { id: 'f3', label: 'Email', type: 'email', required: false },
    { id: 'f4', label: 'Property Type', type: 'select', required: false },
    { id: 'f5', label: 'Budget Range', type: 'select', required: false },
  ]);

  return (
    <SectionCard>
      <PanelHeader title="Form Fields" desc="Customize WhatsApp lead capture form fields" icon={<FormInput className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

      <div className="space-y-2">
        {fields.map((f) => (
          <div key={f.id} className="flex items-center gap-3 rounded-xl2 border border-base-c p-3">
            <FormInput className="h-4 w-4 shrink-0 text-muted-c" />
            <input value={f.label} onChange={(e) => setFields((prev) => prev.map((x) => x.id === f.id ? { ...x, label: e.target.value } : x))} className="flex-1 bg-transparent text-sm font-medium text-primary-c focus:outline-none" />
            <Badge variant="neutral">{f.type}</Badge>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-c">Required</span>
              <Toggle checked={f.required} onChange={(v) => setFields((prev) => prev.map((x) => x.id === f.id ? { ...x, required: v } : x))} />
            </div>
            <button onClick={() => setFields((prev) => prev.filter((x) => x.id !== f.id))} className="grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:bg-danger-500/10 hover:text-danger-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-base-c px-3 py-2 text-xs font-medium text-secondary-c hover:border-primary-500/30 hover:text-primary-c">
        <Plus className="h-3.5 w-3.5" /> Add Field
      </button>

      <div className="mt-5"><SaveBar onSave={() => {}} /></div>
    </SectionCard>
  );
}

/* ─── Custom Sub-Menus ─── */
export function CustomSubMenusPanel() {
  const [menus, setMenus] = useState([
    { id: 'm1', title: 'Luxury Properties', items: 8 },
    { id: 'm2', title: 'Budget Homes', items: 15 },
    { id: 'm3', title: 'Commercial Spaces', items: 5 },
  ]);

  return (
    <SectionCard>
      <PanelHeader title="Custom Sub-Menus" desc="Create custom lists to organize your offerings" icon={<ListTree className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

      <div className="space-y-2">
        {menus.map((m) => (
          <div key={m.id} className="flex items-center gap-3 rounded-xl2 border border-base-c p-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary-500/10">
              <ListTree className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-primary-c">{m.title}</p>
              <p className="text-xs text-muted-c">{m.items} items</p>
            </div>
            <button className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400">Edit</button>
            <button onClick={() => setMenus((prev) => prev.filter((x) => x.id !== m.id))} className="grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:bg-danger-500/10 hover:text-danger-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-base-c px-3 py-2 text-xs font-medium text-secondary-c hover:border-primary-500/30 hover:text-primary-c">
        <Plus className="h-3.5 w-3.5" /> Create Sub-Menu
      </button>
    </SectionCard>
  );
}

/* ─── Email Templates ─── */
export function EmailTemplatesPanel() {
  const [templates, setTemplates] = useState([
    { id: 'e1', name: 'New Lead Welcome', subject: 'Welcome to GyanVaniAi Connect', trigger: 'On new lead' },
    { id: 'e2', name: 'Site Visit Reminder', subject: 'Your site visit tomorrow at 10 AM', trigger: '1 day before visit' },
    { id: 'e3', name: 'Post-Visit Follow-up', subject: 'How was your visit?', trigger: '2 hours after visit' },
    { id: 'e4', name: 'Monthly Newsletter', subject: 'New properties this month', trigger: 'Monthly' },
  ]);

  return (
    <SectionCard>
      <PanelHeader title="Email Templates" desc="Automated lead follow-up email sequences" icon={<Mail className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

      <div className="space-y-2">
        {templates.map((t) => (
          <div key={t.id} className="flex items-center gap-3 rounded-xl2 border border-base-c p-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-500/10">
              <Mail className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-primary-c">{t.name}</p>
              <p className="truncate text-xs text-muted-c">{t.subject}</p>
            </div>
            <Badge variant="neutral">{t.trigger}</Badge>
            <button className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400">Edit</button>
            <button onClick={() => setTemplates((prev) => prev.filter((x) => x.id !== t.id))} className="grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:bg-danger-500/10 hover:text-danger-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-base-c px-3 py-2 text-xs font-medium text-secondary-c hover:border-primary-500/30 hover:text-primary-c">
        <Plus className="h-3.5 w-3.5" /> New Email Template
      </button>
    </SectionCard>
  );
}

/* ─── Quick Responses ─── */
export function QuickResponsesPanel() {
  const [responses, setResponses] = useState([
    { id: 'q1', shortcut: '/hello', text: 'Hello! Thanks for reaching out. How can I help you today?' },
    { id: 'q2', shortcut: '/pricing', text: 'Our properties start from ₹68L. Would you like me to share a detailed price list?' },
    { id: 'q3', shortcut: '/visit', text: 'I can schedule a site visit for you. What day works best?' },
    { id: 'q4', shortcut: '/location', text: 'We have properties in Hyderabad, Mumbai, and Bengaluru. Which city are you interested in?' },
  ]);

  return (
    <SectionCard>
      <PanelHeader title="Quick Responses" desc="Direct text & image replies for faster chat responses" icon={<MessageSquare className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

      <div className="space-y-2">
        {responses.map((r) => (
          <div key={r.id} className="rounded-xl2 border border-base-c p-3">
            <div className="flex items-center gap-2">
              <Badge variant="gradient">{r.shortcut}</Badge>
              <button onClick={() => setResponses((prev) => prev.filter((x) => x.id !== r.id))} className="ml-auto grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:bg-danger-500/10 hover:text-danger-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-secondary-c">{r.text}</p>
          </div>
        ))}
      </div>

      <button className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-base-c px-3 py-2 text-xs font-medium text-secondary-c hover:border-primary-500/30 hover:text-primary-c">
        <Plus className="h-3.5 w-3.5" /> Add Quick Response
      </button>
    </SectionCard>
  );
}

/* ─── Flow CTA Buttons ─── */
export function FlowCTAPanel() {
  const [ctas, setCtas] = useState([
    { id: 'cta1', label: 'Cancel Appointment', action: 'END_FLOW', style: 'danger' },
    { id: 'cta2', label: 'Confirm Booking', action: 'NEXT_STEP', style: 'success' },
    { id: 'cta3', label: 'Reschedule', action: 'JUMP_STEP', style: 'neutral' },
  ]);

  const styleColor: Record<string, string> = {
    success: 'success',
    danger: 'danger',
    neutral: 'neutral',
    primary: 'primary',
  };

  return (
    <SectionCard>
      <PanelHeader title="Flow CTA Buttons" desc="Configure cancel & complete call-to-action buttons in flows" icon={<MousePointerClick className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

      <div className="space-y-2">
        {ctas.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-xl2 border border-base-c p-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-500/10">
              <MousePointerClick className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-primary-c">{c.label}</p>
              <p className="text-xs text-muted-c font-mono">{c.action}</p>
            </div>
            <Badge variant={styleColor[c.style] as 'success' | 'danger' | 'neutral' | 'primary'}>{c.style}</Badge>
            <button onClick={() => setCtas((prev) => prev.filter((x) => x.id !== c.id))} className="grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:bg-danger-500/10 hover:text-danger-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-base-c px-3 py-2 text-xs font-medium text-secondary-c hover:border-primary-500/30 hover:text-primary-c">
        <Plus className="h-3.5 w-3.5" /> Add CTA Button
      </button>
    </SectionCard>
  );
}
