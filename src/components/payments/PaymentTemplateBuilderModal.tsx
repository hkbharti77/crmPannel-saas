import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '@/lib/types';
import {
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Zap,
  Globe,
  Plus,
  Trash2,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Send,
  FileText,
} from 'lucide-react';
import {
  createWhatsAppTemplate,
  generateAiWhatsAppTemplate,
  type WhatsAppTemplateDto,
} from '@/lib/broadcastsApi';

interface PaymentTemplateBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdTemplate: WhatsAppTemplateDto) => void;
}

export function PaymentTemplateBuilderModal({
  isOpen,
  onClose,
  onSuccess,
}: PaymentTemplateBuilderModalProps) {
  const [templateName, setTemplateName] = useState('');
  const [category, setCategory] = useState<'UTILITY' | 'MARKETING'>('UTILITY');
  const [language, setLanguage] = useState('en_US');
  const [headerText, setHeaderText] = useState('Payment Notice');
  const [bodyText, setBodyText] = useState(
    'Hi {{1}}, your invoice for order #{{2}} of ₹{{3}} is ready for payment. Please tap below to complete your checkout securely.'
  );
  const [footerText, setFooterText] = useState('Powered by WhatsApp Direct Billing');
  const [buttonText, setButtonText] = useState('Pay Now 💳');
  const [buttonUrl, setButtonUrl] = useState('https://checkout.crmlite.com/pay/{{1}}');

  // Preview samples
  const [sampleVar1, setSampleVar1] = useState('Rahul Sharma');
  const [sampleVar2, setSampleVar2] = useState('ORD-9821');
  const [sampleVar3, setSampleVar3] = useState('4,999.00');

  // AI Generator state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    const sanitized = val.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    setTemplateName(sanitized);
  };

  const insertVariable = (varNumber: number) => {
    setBodyText((prev) => prev + ` {{${varNumber}}}`);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    try {
      setIsAiGenerating(true);
      setError(null);
      const promptText = `Generate a WhatsApp Payment/Billing template for: ${aiPrompt}. Include variables {{1}} for customer name, {{2}} for order id, {{3}} for amount.`;
      const res = await generateAiWhatsAppTemplate(promptText);
      if (res.data) {
        if (res.data.name) setTemplateName(res.data.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
        if (res.data.body) setBodyText(res.data.body);
        if (res.data.category) setCategory(res.data.category as 'UTILITY' | 'MARKETING');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate template with AI');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const buildMetaDto = (): WhatsAppTemplateDto => {
    return {
      name: templateName.trim(),
      language: language,
      category: category,
      headerType: headerText ? 'TEXT' : 'NONE',
      headerText: headerText ? headerText.trim() : undefined,
      bodyText: bodyText.trim(),
      footerText: footerText ? footerText.trim() : undefined,
      buttons: [
        {
          type: 'URL',
          text: buttonText.trim() || 'Pay Now',
          url: buttonUrl.trim() || 'https://checkout.crmlite.com/pay/{{1}}',
        },
      ],
    };
  };

  const handleCopyJson = () => {
    const dto = buildMetaDto();
    const metaPayload = {
      name: dto.name,
      category: dto.category,
      language: dto.language,
      components: [
        ...(dto.headerText
          ? [{ type: 'HEADER', format: 'TEXT', text: dto.headerText }]
          : []),
        { type: 'BODY', text: dto.bodyText },
        ...(dto.footerText ? [{ type: 'FOOTER', text: dto.footerText }] : []),
        {
          type: 'BUTTONS',
          buttons: [
            {
              type: 'URL',
              text: buttonText,
              url: buttonUrl,
            },
          ],
        },
      ],
    };
    navigator.clipboard.writeText(JSON.stringify(metaPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitToMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      setError('Please provide a unique template name (e.g. order_bill_notice_v1)');
      return;
    }
    if (!bodyText.trim()) {
      setError('Template body text cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const dto = buildMetaDto();
      const res = await createWhatsAppTemplate(dto);
      if (res.error) {
        throw new Error(res.error);
      }
      setSuccessMsg(`Template "${dto.name}" submitted to Meta for review!`);
      if (onSuccess && res.data) {
        onSuccess(res.data);
      }
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit template to Meta');
    } finally {
      setSubmitting(false);
    }
  };

  // Preview Body Replacement
  const previewBody = bodyText
    .replace(/\{\{1\}\}/g, sampleVar1 || 'Rahul Sharma')
    .replace(/\{\{2\}\}/g, sampleVar2 || 'ORD-9821')
    .replace(/\{\{3\}\}/g, sampleVar3 || '4,999.00')
    .replace(/\{\{(\d+)\}\}/g, '[$1]');

  return createPortal(
    <>
      {/* Full Viewport Backdrop */}
      <div
        className="fixed inset-0 top-0 right-0 bottom-0 left-0 w-screen h-screen z-[10000] bg-slate-950/65 backdrop-blur-md transition-all animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Viewport Container */}
      <div className="fixed inset-0 top-0 right-0 bottom-0 left-0 w-screen h-screen z-[10001] pointer-events-none flex items-center justify-center p-4 overflow-y-auto">
        <div className="pointer-events-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Custom Payment Template Builder
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  Meta Official API
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Design compliant WhatsApp payment notification templates with dynamic checkout CTA buttons.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-7 p-6 space-y-5">
            {/* AI Assistant Banner */}
            <div className="p-3.5 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-500/20 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> AI Template Assistant
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g., Overdue consulting invoice with 10% discount in Hindi & English"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-purple-200 dark:border-purple-900/60 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
                <button
                  type="button"
                  disabled={isAiGenerating || !aiPrompt.trim()}
                  onClick={handleAiGenerate}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {isAiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Generate
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Template Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Template Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. pending_invoice_alert_v1"
                    value={templateName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Lowercase letters, numbers, and underscores only</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category & Language
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 font-medium"
                    >
                      <option value="UTILITY">UTILITY (Bills)</option>
                      <option value="MARKETING">MARKETING</option>
                    </select>

                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 font-medium"
                    >
                      <option value="en_US">English (US)</option>
                      <option value="en_GB">English (UK)</option>
                      <option value="en_IN">English (IND)</option>
                      <option value="hi">Hindi (हिन्दी)</option>
                      <option value="mr">Marathi (मराठी)</option>
                      <option value="gu">Gujarati (ગુજરાતી)</option>
                      <option value="bn">Bengali (বাংলা)</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Header Text */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Header (Optional Text)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Invoice Ready for Payment"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Body Text & Variable Inserters */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Template Body <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Insert:</span>
                    <button
                      type="button"
                      onClick={() => insertVariable(1)}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-[10px] font-mono font-semibold text-indigo-600 transition"
                    >
                      +&#123;&#123;1&#125;&#125; Name
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVariable(2)}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-[10px] font-mono font-semibold text-indigo-600 transition"
                    >
                      +&#123;&#123;2&#125;&#125; Order #
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVariable(3)}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-[10px] font-mono font-semibold text-indigo-600 transition"
                    >
                      +&#123;&#123;3&#125;&#125; Amount
                    </button>
                  </div>
                </div>
                <textarea
                  rows={4}
                  required
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 font-sans leading-relaxed"
                />
              </div>

              {/* Dynamic Payment CTA Button */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Dynamic Payment URL Button (Meta Cloud API CTA)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Target URL (with &#123;&#123;1&#125;&#125; dynamic token)
                    </label>
                    <input
                      type="text"
                      value={buttonUrl}
                      onChange={(e) => setButtonUrl(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Text */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Footer (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Powered by ChatCRM Lite"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Mobile Preview & Testing */}
          <div className="lg:col-span-5 p-6 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Live WhatsApp Preview
                </span>
                <span className="text-[11px] text-slate-400">Meta Verified</span>
              </div>

              {/* Sample Variables Input */}
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Preview Sample Variables:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Var 1 (Name)"
                    value={sampleVar1}
                    onChange={(e) => setSampleVar1(e.target.value)}
                    className="px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Var 2 (Order)"
                    value={sampleVar2}
                    onChange={(e) => setSampleVar2(e.target.value)}
                    className="px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Var 3 (Amount)"
                    value={sampleVar3}
                    onChange={(e) => setSampleVar3(e.target.value)}
                    className="px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                </div>
              </div>

              {/* WhatsApp Bubble Preview */}
              <div className="bg-[#efeae2] dark:bg-[#111b21] p-4 rounded-2xl border border-slate-300/60 dark:border-slate-800 shadow-inner space-y-3">
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>WhatsApp Business Account</span>
                  <span>12:00 PM</span>
                </div>

                {headerText && (
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-xs border-b border-slate-200/60 dark:border-slate-800 pb-1.5">
                    {headerText}
                  </div>
                )}

                <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                  {previewBody}
                </div>

                {footerText && (
                  <div className="text-[10px] text-slate-400 pt-1">
                    {footerText}
                  </div>
                )}

                {buttonText && (
                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 text-center">
                    <button
                      type="button"
                      className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {buttonText}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Error / Success Notifications */}
            <div className="space-y-3">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied JSON' : 'Copy Meta JSON'}
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmitToMeta}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit to Meta
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>,
  document.body
);
}
