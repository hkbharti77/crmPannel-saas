import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cx } from '@/lib/types';
import { createWhatsAppTemplate, generateAiWhatsAppTemplate, type WhatsAppTemplateDto, type TemplateButtonDto } from '@/lib/broadcastsApi';
import {
  Check, Bold, Italic, Strikethrough, Code, Plus, Trash2,
  Image as ImageIcon, Video, File, Globe, Phone, MessageSquare, Loader2, ArrowLeft,
  LayoutTemplate, Settings, MousePointerClick, ChevronLeft, MoreVertical, Smartphone, Sparkles, Lock
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/* ─── WhatsApp Text Formatter Helper ─── */
function renderWhatsAppFormattedText(text: string) {
  if (!text) return <span className="text-slate-400 italic">Message content preview...</span>;

  const lines = text.split('\n');

  return lines.map((line, lIdx) => {
    const parts: (string | JSX.Element)[] = [];
    const regex = /(\{\{\d+\}\})|(\*[^*]+\*)|(_[^_]+_)|(~[^~]+~)|(`[^`]+`)/g;
    let match;
    let lastIdx = 0;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIdx) {
        parts.push(line.substring(lastIdx, match.index));
      }

      const val = match[0];
      if (val.startsWith('{{')) {
        parts.push(
          <span key={match.index} className="mx-0.5 inline-block rounded-md bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800 border border-emerald-200">
            {val}
          </span>
        );
      } else if (val.startsWith('*') && val.endsWith('*')) {
        parts.push(<strong key={match.index} className="font-bold text-slate-900">{val.slice(1, -1)}</strong>);
      } else if (val.startsWith('_') && val.endsWith('_')) {
        parts.push(<em key={match.index} className="italic text-slate-800">{val.slice(1, -1)}</em>);
      } else if (val.startsWith('~') && val.endsWith('~')) {
        parts.push(<del key={match.index} className="line-through text-slate-500">{val.slice(1, -1)}</del>);
      } else if (val.startsWith('`') && val.endsWith('`')) {
        parts.push(<code key={match.index} className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-pink-600 border border-slate-200">{val.slice(1, -1)}</code>);
      }

      lastIdx = match.index + val.length;
    }
    if (lastIdx < line.length) {
      parts.push(line.substring(lastIdx));
    }
    return (
      <span key={lIdx}>
        {parts}
        {lIdx < lines.length - 1 && <br />}
      </span>
    );
  });
}

export default function CreateTemplateView() {
  const { user } = useAuth();
  const isPremium = user?.planType?.toUpperCase() === 'PRO' || user?.planType?.toUpperCase() === 'ENTERPRISE';
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING');
  const [language, setLanguage] = useState('en_US');
  const [mediaSample, setMediaSample] = useState<'NONE' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'>('NONE');
  const [headerType, setHeaderType] = useState<'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO'>('NONE');
  const [headerContent, setHeaderContent] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');
  
  // Dynamic list of action buttons (Max limit: 3)
  const [buttonsList, setButtonsList] = useState<TemplateButtonDto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const canSubmit = name.trim().length > 0 && bodyText.trim().length > 0 && !submitting;

  const insertFormatting = (prefix: string, suffix = prefix) => {
    const input = bodyRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = bodyText.substring(start, end) || 'text';
    const replacement = `${prefix}${selected}${suffix}`;

    const newText = bodyText.substring(0, start) + replacement + bodyText.substring(end);
    setBodyText(newText);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  const insertVariable = () => {
    const matches = bodyText.match(/\{\{\d+\}\}/g) || [];
    const nextVarNum = matches.length + 1;
    const varTag = `{{${nextVarNum}}}`;

    const input = bodyRef.current;
    if (input) {
      const start = input.selectionStart;
      const newText = bodyText.substring(0, start) + varTag + bodyText.substring(start);
      setBodyText(newText);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + varTag.length, start + varTag.length);
      }, 50);
    } else {
      setBodyText((prev) => prev + varTag);
    }
  };

  const handleAddButton = (type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER') => {
    if (buttonsList.length >= 3) return;
    if (type === 'QUICK_REPLY') {
      setButtonsList((prev) => [...prev, { type: 'QUICK_REPLY', text: '' }]);
    } else if (type === 'URL') {
      setButtonsList((prev) => [...prev, { type: 'URL', text: '', url: 'https://' }]);
    } else if (type === 'PHONE_NUMBER') {
      setButtonsList((prev) => [...prev, { type: 'PHONE_NUMBER', text: '', phoneNumber: '+91' }]);
    }
  };

  const handleRemoveButton = (index: number) => {
    setButtonsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateButton = (index: number, field: keyof TemplateButtonDto, value: string) => {
    setButtonsList((prev) =>
      prev.map((btn, i) => (i === index ? { ...btn, [field]: value } : btn)),
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    // Validate variables {{1}}, {{2}}...
    const matches = bodyText.match(/\{\{(\d+)\}\}/g) || [];
    const varNumbers = matches.map(m => parseInt(m.replace(/[^0-9]/g, ''), 10));
    if (varNumbers.length > 0) {
      const uniqueVars = Array.from(new Set(varNumbers)).sort((a, b) => a - b);
      if (uniqueVars[0] !== 1) {
        alert("Variables must start at {{1}}.");
        return;
      }
      for (let i = 0; i < uniqueVars.length; i++) {
        if (uniqueVars[i] !== i + 1) {
          alert(`Variable {{${i + 1}}} is missing. Variables must be sequential ({{1}}, {{2}}, {{3}}...).`);
          return;
        }
      }
    }

    setSubmitting(true);

    const formattedName = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const validButtons = buttonsList.filter((b) => b.text.trim().length > 0);

    const dto: WhatsAppTemplateDto = {
      name: formattedName,
      category,
      language,
      headerType: mediaSample !== 'NONE' ? mediaSample : headerType,
      headerContent: headerType === 'TEXT' ? headerContent.trim() : undefined,
      bodyText: bodyText.trim(),
      footerText: footerText.trim() || undefined,
      buttons: validButtons.length > 0 ? validButtons : undefined,
    };

    const res = await createWhatsAppTemplate(dto);
    setSubmitting(false);

    if (res.error) {
      alert(`Failed to create template: ${res.error}`);
      return;
    }
    if (res.data) {
      navigate('/broadcasts');
    }
  };

  const handleGenerateAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    const res = await generateAiWhatsAppTemplate(aiPrompt.trim());
    setAiLoading(false);

    if (res.error) {
      alert(`AI Generation Failed: ${res.error}`);
      return;
    }

    if (res.data) {
      if (res.data.headerContent) {
        setHeaderType('TEXT');
        setHeaderContent(res.data.headerContent);
      }
      if (res.data.bodyText) setBodyText(res.data.bodyText);
      if (res.data.footerText) setFooterText(res.data.footerText);
      if (res.data.buttons && res.data.buttons.length > 0) {
        setButtonsList(res.data.buttons.slice(0, 3));
      } else {
        setButtonsList([]);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-base-c text-primary-c overflow-hidden">
      {/* Enterprise Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-base-c bg-card-c px-8 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/broadcasts')} 
            className="flex h-9 w-9 items-center justify-center rounded-full border border-base-c text-secondary-c hover:bg-subtle-c hover:text-primary-c transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-primary-c">Create WhatsApp Template</h1>
            <p className="text-xs font-medium text-muted-c">Design and submit a new template for Meta approval.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/broadcasts')} 
            className="rounded-lg px-5 py-2 text-sm font-semibold text-secondary-c hover:bg-subtle-c transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cx(
              'flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold shadow-sm transition-all',
              canSubmit 
                ? 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-ink-800 dark:text-slate-600'
            )}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Template'}
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="grid flex-1 overflow-hidden lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
        
        {/* Left Column: Premium Form */}
        <div className="overflow-y-auto p-8 lg:p-12 space-y-10 scrollbar-thin">
          
          <div className="max-w-3xl mx-auto space-y-10">
            {/* Section: AI Generator */}
            {isPremium ? (
              <section className="flex gap-6">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-primary-c">Generate with AI Builder</h3>
                    <p className="text-sm text-secondary-c mt-1">Let AI craft a Meta-compliant template with perfect formatting.</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g. Write a promotional template for 20% off summer sale..."
                      className="flex-1 rounded-xl border border-base-c bg-card-c px-4 py-2.5 text-sm text-primary-c focus:ring-2 focus:ring-primary-500/50 outline-none"
                      disabled={aiLoading}
                    />
                    <button
                      onClick={handleGenerateAi}
                      disabled={!aiPrompt.trim() || aiLoading}
                      className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {aiLoading ? 'Generating...' : 'Generate AI'}
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              <section className="flex gap-6">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                  <Lock className="h-5 w-5" />
                </div>
                <div className="flex-1 surface rounded-2xl p-6 border border-amber-200/50 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-900/10">
                  <h3 className="text-base font-bold text-amber-700 dark:text-amber-500">AI Builder Locked</h3>
                  <p className="text-sm text-secondary-c mt-1 mb-4">Upgrade to the PRO plan to unlock AI-powered template generation and bypass Meta formatting hassles.</p>
                  <button 
                    onClick={() => navigate('/settings?tab=billing')}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700 transition-colors"
                  >
                    Upgrade to PRO
                  </button>
                </div>
              </section>
            )}

            {/* Section: Identity */}
            <section className="flex gap-6">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <Settings className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-primary-c">Template Identity</h3>
                  <p className="text-sm text-secondary-c mt-1">Define the internal name, category, and language for your template.</p>
                </div>
                <div className="surface rounded-2xl p-6 space-y-5 shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-primary-c">Template Name</label>
                      <span className="text-xs font-medium text-muted-c">
                        {name.length}/512 {name.length > 0 && <Check className="inline-block h-3.5 w-3.5 text-emerald-500 ml-1" />}
                      </span>
                    </div>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                      placeholder="e.g. appointment_reminder_v1"
                      className="w-full rounded-xl border border-base-c bg-subtle-c px-4 py-2.5 text-sm font-mono text-primary-c focus:bg-card-c focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all outline-none"
                    />
                    <p className="mt-2 text-xs text-muted-c">Use only lowercase alphanumeric characters and underscores.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-primary-c">Category</label>
                      <select 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value as any)} 
                        className="w-full rounded-xl border border-base-c bg-subtle-c px-4 py-2.5 text-sm text-primary-c focus:bg-card-c focus:ring-2 focus:ring-primary-500/50 outline-none cursor-pointer appearance-none"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em' }}
                      >
                        <option value="MARKETING">Marketing (Promos, Offers)</option>
                        <option value="UTILITY">Utility (Updates, Alerts)</option>
                        <option value="AUTHENTICATION">Authentication (OTPs)</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-primary-c">Language</label>
                      <select 
                        value={language} 
                        onChange={(e) => setLanguage(e.target.value)} 
                        className="w-full rounded-xl border border-base-c bg-subtle-c px-4 py-2.5 text-sm text-primary-c focus:bg-card-c focus:ring-2 focus:ring-primary-500/50 outline-none cursor-pointer appearance-none"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em' }}
                      >
                        <option value="en_US">English (US)</option>
                        <option value="hi">Hindi (hi)</option>
                        <option value="es">Spanish (es)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Content */}
            <section className="flex gap-6">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <LayoutTemplate className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-primary-c">Message Content</h3>
                  <p className="text-sm text-secondary-c mt-1">Design the header, body, and footer of your template.</p>
                </div>
                
                <div className="surface rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-6 space-y-6">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-primary-c">Header Media (Optional)</label>
                      <select 
                        value={mediaSample} 
                        onChange={(e) => setMediaSample(e.target.value as any)} 
                        className="w-full rounded-xl border border-base-c bg-subtle-c px-4 py-2.5 text-sm text-primary-c focus:bg-card-c focus:ring-2 focus:ring-primary-500/50 outline-none cursor-pointer appearance-none"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em' }}
                      >
                        <option value="NONE">No Media (Text or None)</option>
                        <option value="IMAGE">Image Header</option>
                        <option value="VIDEO">Video Header</option>
                        <option value="DOCUMENT">Document Header</option>
                      </select>
                    </div>

                    {mediaSample === 'NONE' && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-primary-c">Text Header (Optional)</label>
                          <span className="text-xs font-medium text-muted-c">{headerContent.length}/60</span>
                        </div>
                        <input
                          value={headerContent}
                          onChange={(e) => {
                            setHeaderContent(e.target.value);
                            if (e.target.value.trim() && headerType === 'NONE') setHeaderType('TEXT');
                          }}
                          placeholder="e.g. Special Offer!"
                          className="w-full rounded-xl border border-base-c bg-subtle-c px-4 py-2.5 text-sm text-primary-c focus:bg-card-c focus:ring-2 focus:ring-primary-500/50 transition-all outline-none"
                        />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-primary-c">Body Message <span className="text-danger-500">*</span></label>
                        <span className="text-xs font-medium text-muted-c">{bodyText.length}/1024</span>
                      </div>
                      <div className="overflow-hidden rounded-xl border border-base-c focus-within:ring-2 focus-within:ring-primary-500/50 focus-within:border-primary-500 transition-all">
                        {/* Editor Toolbar */}
                        <div className="flex items-center justify-between bg-subtle-c border-b border-base-c px-3 py-2">
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => insertFormatting('*')} className="p-1.5 rounded-lg text-secondary-c hover:bg-card-c hover:text-primary-c transition-colors" title="Bold"><Bold className="h-4 w-4" /></button>
                            <button type="button" onClick={() => insertFormatting('_')} className="p-1.5 rounded-lg text-secondary-c hover:bg-card-c hover:text-primary-c transition-colors" title="Italic"><Italic className="h-4 w-4" /></button>
                            <button type="button" onClick={() => insertFormatting('~')} className="p-1.5 rounded-lg text-secondary-c hover:bg-card-c hover:text-primary-c transition-colors" title="Strikethrough"><Strikethrough className="h-4 w-4" /></button>
                            <div className="w-px h-4 bg-border-base mx-1" />
                            <button type="button" onClick={() => insertFormatting('`')} className="p-1.5 rounded-lg text-secondary-c hover:bg-card-c hover:text-primary-c transition-colors" title="Monospace"><Code className="h-4 w-4" /></button>
                          </div>
                          <button
                            type="button"
                            onClick={insertVariable}
                            className="flex items-center gap-1.5 rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-600 hover:bg-primary-100 transition-colors dark:bg-primary-500/10 dark:text-primary-400"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add Variable
                          </button>
                        </div>
                        <textarea
                          ref={bodyRef}
                          value={bodyText}
                          onChange={(e) => setBodyText(e.target.value)}
                          rows={6}
                          placeholder="Type your message here. Use variables like {{1}} to personalize content."
                          className="w-full bg-card-c p-4 text-sm leading-relaxed text-primary-c outline-none resize-y"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-primary-c">Footer (Optional)</label>
                        <span className="text-xs font-medium text-muted-c">{footerText.length}/60</span>
                      </div>
                      <input
                        value={footerText}
                        onChange={(e) => setFooterText(e.target.value)}
                        placeholder="e.g. Reply STOP to unsubscribe"
                        className="w-full rounded-xl border border-base-c bg-subtle-c px-4 py-2.5 text-sm text-primary-c focus:bg-card-c focus:ring-2 focus:ring-primary-500/50 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Action Buttons */}
            <section className="flex gap-6 pb-20">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
                <MousePointerClick className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-primary-c">Action Buttons</h3>
                    <p className="text-sm text-secondary-c mt-1">Add up to 3 interactive buttons below your message.</p>
                  </div>
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
                    {buttonsList.length} / 3 Allowed
                  </span>
                </div>

                <div className="surface rounded-2xl shadow-sm p-6 space-y-6">
                  {/* Buttons Selection */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleAddButton('QUICK_REPLY')}
                      disabled={buttonsList.length >= 3}
                      className={cx(
                        'flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all',
                        buttonsList.length < 3 ? 'border-base-c bg-card-c hover:border-emerald-400 hover:text-emerald-600 hover:shadow-sm' : 'border-base-c bg-subtle-c opacity-50 cursor-not-allowed'
                      )}
                    >
                      <Plus className="h-4 w-4" /> Quick Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddButton('URL')}
                      disabled={buttonsList.length >= 3}
                      className={cx(
                        'flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all',
                        buttonsList.length < 3 ? 'border-base-c bg-card-c hover:border-sky-400 hover:text-sky-600 hover:shadow-sm' : 'border-base-c bg-subtle-c opacity-50 cursor-not-allowed'
                      )}
                    >
                      <Globe className="h-4 w-4" /> Website Link
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddButton('PHONE_NUMBER')}
                      disabled={buttonsList.length >= 3}
                      className={cx(
                        'flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all',
                        buttonsList.length < 3 ? 'border-base-c bg-card-c hover:border-purple-400 hover:text-purple-600 hover:shadow-sm' : 'border-base-c bg-subtle-c opacity-50 cursor-not-allowed'
                      )}
                    >
                      <Phone className="h-4 w-4" /> Call Button
                    </button>
                  </div>

                  {/* Configured Buttons */}
                  {buttonsList.length > 0 && (
                    <div className="space-y-4 pt-2">
                      {buttonsList.map((btn, idx) => (
                        <div key={idx} className="flex gap-4 rounded-xl border border-base-c bg-subtle-c p-4 relative group transition-colors hover:border-primary-300">
                          <button
                            type="button"
                            onClick={() => handleRemoveButton(idx)}
                            className="absolute -right-2 -top-2 rounded-full bg-card-c border border-base-c p-1.5 text-secondary-c hover:text-danger-500 hover:border-danger-200 shadow-sm transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          
                          <div className="w-24 shrink-0 flex items-center justify-center rounded-lg bg-card-c border border-base-c shadow-sm">
                            <span className="text-[10px] font-bold text-secondary-c uppercase tracking-wider">{btn.type.replace('_', ' ')}</span>
                          </div>

                          <div className="flex-1 space-y-3">
                            <div>
                              <input
                                value={btn.text}
                                onChange={(e) => handleUpdateButton(idx, 'text', e.target.value)}
                                placeholder="Button Label (e.g. View Offer)"
                                className="w-full rounded-lg border-b border-dashed border-base-c bg-transparent py-1 text-sm font-semibold text-primary-c focus:border-primary-500 outline-none"
                              />
                            </div>
                            {btn.type === 'URL' && (
                              <input
                                value={btn.url || ''}
                                onChange={(e) => handleUpdateButton(idx, 'url', e.target.value)}
                                placeholder="https://example.com"
                                className="w-full rounded-lg border border-base-c bg-card-c px-3 py-2 text-xs font-mono text-primary-c focus:border-primary-500 outline-none"
                              />
                            )}
                            {btn.type === 'PHONE_NUMBER' && (
                              <input
                                value={btn.phoneNumber || ''}
                                onChange={(e) => handleUpdateButton(idx, 'phoneNumber', e.target.value)}
                                placeholder="+1234567890"
                                className="w-full rounded-lg border border-base-c bg-card-c px-3 py-2 text-xs font-mono text-primary-c focus:border-primary-500 outline-none"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Right Column: Premium Live Preview */}
        <div className="bg-slate-50 dark:bg-ink-950 border-l border-base-c p-8 flex flex-col items-center justify-start overflow-y-auto">
          <div className="flex items-center gap-2 mb-8 self-start w-full">
            <Smartphone className="h-5 w-5 text-emerald-600" />
            <h4 className="text-sm font-bold text-primary-c">Live WhatsApp Preview</h4>
          </div>

          {/* Premium Mock Phone */}
          <div className="relative w-full max-w-[340px] rounded-[3rem] border-[8px] border-slate-900 bg-[#E5DDD5] shadow-2xl overflow-hidden min-h-[640px] flex flex-col">
            
            {/* Phone Notch */}
            <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 rounded-b-2xl w-32 mx-auto z-20"></div>

            {/* WhatsApp Header */}
            <div className="bg-[#075E54] text-white pt-10 pb-3 px-4 flex items-center justify-between shadow-md z-10">
              <div className="flex items-center gap-2">
                <ChevronLeft className="h-6 w-6" />
                <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                  <div className="h-7 w-7 rounded-full bg-slate-200" />
                </div>
                <div>
                  <div className="font-bold text-sm leading-tight">Business Name</div>
                  <div className="text-[10px] text-white/80 opacity-90">Business Account</div>
                </div>
              </div>
              <div className="flex gap-4">
                <Video className="h-5 w-5 opacity-90" />
                <Phone className="h-5 w-5 opacity-90" />
                <MoreVertical className="h-5 w-5 opacity-90" />
              </div>
            </div>

            {/* WhatsApp Chat Area */}
            <div className="flex-1 p-4 relative overflow-y-auto scrollbar-thin" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'cover' }}>
              
              {/* Date Pill */}
              <div className="flex justify-center mb-4">
                <span className="bg-[#E1F3FB] text-slate-600 text-[11px] px-3 py-1 rounded-lg shadow-sm font-medium">
                  TODAY
                </span>
              </div>

              {/* Chat Bubble Layout */}
              <div className="flex justify-start">
                {/* Tail SVG */}
                <svg viewBox="0 0 8 13" width="8" height="13" className="absolute left-[8px] mt-1 text-white">
                  <path opacity="1" fill="currentColor" d="M1.533,3.568L8,12.193V1H2.812 C1.042,1,0.474,2.156,1.533,3.568z"></path>
                </svg>
                
                <div className="relative max-w-[275px] bg-white rounded-lg rounded-tl-none shadow-sm flex flex-col z-10 ml-2">
                  
                  {/* Bubble Content */}
                  <div className="p-2.5 space-y-2">
                    
                    {/* Media Header */}
                    {mediaSample === 'IMAGE' && (
                      <div className="h-36 w-full rounded bg-emerald-50 flex items-center justify-center border border-emerald-100">
                        <ImageIcon className="h-10 w-10 text-emerald-300" />
                      </div>
                    )}
                    {mediaSample === 'VIDEO' && (
                      <div className="h-36 w-full rounded bg-slate-800 flex items-center justify-center relative">
                        <div className="h-10 w-10 rounded-full bg-white/30 flex items-center justify-center backdrop-blur-sm">
                          <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1"></div>
                        </div>
                      </div>
                    )}
                    {mediaSample === 'DOCUMENT' && (
                      <div className="flex items-center gap-3 rounded bg-slate-100 p-3">
                        <div className="h-10 w-10 rounded bg-red-400 flex items-center justify-center">
                          <File className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="h-2.5 w-3/4 bg-slate-300 rounded mb-1.5" />
                          <div className="h-2 w-1/2 bg-slate-200 rounded" />
                        </div>
                      </div>
                    )}

                    {/* Text Header */}
                    {mediaSample === 'NONE' && headerContent.trim() && (
                      <p className="font-bold text-slate-900 text-[15px] px-1 pt-1">{headerContent}</p>
                    )}

                    {/* Body */}
                    <div className="text-[14px] text-[#111b21] leading-relaxed px-1">
                      {renderWhatsAppFormattedText(bodyText)}
                    </div>

                    {/* Footer & Timestamp */}
                    <div className="flex items-end justify-between gap-4 px-1 pt-1">
                      <p className="text-[11px] text-slate-500 truncate flex-1">
                        {footerText.trim()}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
                        <span>13:08</span>
                        <Check className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {/* Appended Action Buttons */}
                  {buttonsList.length > 0 && (
                    <div className="border-t border-slate-100 bg-slate-50/50 rounded-b-lg overflow-hidden divide-y divide-slate-100">
                      {buttonsList.map((btn, idx) => (
                        <div key={idx} className="flex items-center justify-center gap-2 py-2.5 px-3 text-[14px] text-[#00A884] bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                          {btn.type === 'URL' ? <Globe className="h-4 w-4" /> : btn.type === 'PHONE_NUMBER' ? <Phone className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                          <span className="font-medium truncate">{btn.text || 'Action Button'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Phone bottom indicator */}
            <div className="absolute bottom-2 inset-x-0 flex justify-center">
              <div className="h-1 w-24 bg-slate-900/20 rounded-full" />
            </div>
          </div>
          
          <p className="mt-6 text-xs text-muted-c text-center max-w-[280px]">
            Preview illustrates how this message appears on iOS devices. Actual rendering may vary slightly on Android.
          </p>
        </div>
      </div>
    </div>
  );
}
