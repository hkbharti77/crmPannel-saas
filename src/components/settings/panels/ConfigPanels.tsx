
import { useState, useEffect } from 'react';
import { cx } from '@/lib/types';
import { Badge } from '@/components/ui/primitives';
import {
  Plug, FileText,
  Check, ExternalLink,
  RefreshCw, Plus, Trash2, X,
} from 'lucide-react';
import { PanelHeader, SectionCard, PlanLockBanner } from './_shared';
import { fetchSubscriptionStatus } from '@/lib/billingApi';

export { MenuButtonsPanel } from './MenuButtonsPanel';
export { MenuBuilderPanel } from './MenuBuilderPanel';
export { ProductsServicesPanel } from './ProductsServicesPanel';
export { FormFieldsPanel } from './FormFieldsPanel';
export { CustomSubMenusPanel } from './CustomSubMenusPanel';
export { EmailTemplatesPanel } from '@/components/emails/EmailTemplatesPanel';
export { QuickResponsesPanel } from './QuickResponsesPanel';
export { FlowCTAPanel } from './FlowCTAPanel';

/* ─── Meta Integration ─── */
export function MetaIntegrationPanel() {
  const [mode, setMode] = useState<'cloud' | 'embedded'>('cloud');
  const [phoneNumberId, setPhoneNumberId] = useState('123456789012345');
  const [wabaId, setWabaId] = useState('987654321098765');
  const [accessToken, setAccessToken] = useState('EAAG•••••••••••••••••••••••');
  const [verified, setVerified] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    fetchSubscriptionStatus().then((res) => {
      if (res.data) {
        if (!res.data.limits.hasWhatsapp || res.data.planId === 'FREE') {
          setIsLocked(true);
        } else {
          setIsLocked(false);
        }
      }
    });
  }, []);

  return (
    <div className="space-y-4">
      <SectionCard>
        <PanelHeader title="Meta Integration" desc="WhatsApp API credentials & Dual Connection Modes" icon={<Plug className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

        {isLocked && (
          <PlanLockBanner featureName="WhatsApp Business API Integration" requiredPlan="PRO" />
        )}

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
          <p className="mt-1 break-all text-xs font-mono text-secondary-c">https://api.gyanvaniaiconnect.com/webhooks/whatsapp/waba_987654</p>
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







/* CustomSubMenusPanel is exported from ./CustomSubMenusPanel (standalone, backend-integrated) */

/* EmailTemplatesPanel → see ./EmailTemplatesPanel (standalone, backend-integrated) */
/* QuickResponsesPanel → see ./QuickResponsesPanel (standalone, backend-integrated) */
/* FlowCTAPanel        → see ./FlowCTAPanel        (standalone, backend-integrated) */
