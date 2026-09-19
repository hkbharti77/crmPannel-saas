import React, { useState, useEffect } from 'react';
import { cx } from '@/lib/types';
import {
  X,
  Plus,
  Trash2,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  ShoppingBag,
  Zap,
  CreditCard,
  Clock,
  FileText,
  ShieldCheck,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  sendPaymentBill,
  fetchSessionStatus,
  type PaymentItemDto,
  type PaymentRequestDto,
  type WhatsAppOrderResponseDto,
  type WhatsAppSessionInfoDto,
  type PaymentMode,
  type PaymentDispatchMode,
} from '@/lib/paymentApi';
import { PREBUILT_PAYMENT_TEMPLATES, type PaymentTemplateDefinition } from '@/lib/paymentTemplates';
import { fetchWhatsAppTemplates, type WhatsAppTemplateDto } from '@/lib/broadcastsApi';
import { PaymentTemplateBuilderModal } from './PaymentTemplateBuilderModal';

interface PaymentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerWaId?: string;
  customerName?: string;
  initialTemplateKey?: string;
  onSuccess?: (order: WhatsAppOrderResponseDto) => void;
}

export function PaymentRequestModal({
  isOpen,
  onClose,
  customerWaId = '',
  customerName = '',
  initialTemplateKey,
  onSuccess,
}: PaymentRequestModalProps) {
  const [targetWaId, setTargetWaId] = useState<string>(customerWaId);
  const [targetName, setTargetName] = useState<string>(customerName);
  const [items, setItems] = useState<Array<{ name: string; sku: string; quantity: number; unitPriceRupees: number }>>([
    { name: '', sku: '', quantity: 1, unitPriceRupees: 0 },
  ]);
  const [discountRupees, setDiscountRupees] = useState<number>(0);
  const [taxRupees, setTaxRupees] = useState<number>(0);
  const [shippingRupees, setShippingRupees] = useState<number>(0);

  // Session & Dispatch state
  const [sessionInfo, setSessionInfo] = useState<WhatsAppSessionInfoDto | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [dispatchMode, setDispatchMode] = useState<PaymentDispatchMode>('SESSION_MESSAGE');
  const [preferredMode, setPreferredMode] = useState<PaymentMode>('NATIVE_WHATSAPP');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>(initialTemplateKey || 'payment_order_invoice_v1');
  const [templateParams, setTemplateParams] = useState<Record<string, string>>({});
  const [syncedTemplates, setSyncedTemplates] = useState<WhatsAppTemplateDto[]>([]);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync initial props & load synced WABA templates
  useEffect(() => {
    if (isOpen) {
      setTargetWaId(customerWaId || '');
      setTargetName(customerName || '');
      if (initialTemplateKey) {
        setSelectedTemplateKey(initialTemplateKey);
        setDispatchMode('PAYMENT_TEMPLATE');
      }
      setError(null);
      loadWabaTemplates();
    }
  }, [isOpen, customerWaId, customerName, initialTemplateKey]);

  const loadWabaTemplates = async () => {
    try {
      const res = await fetchWhatsAppTemplates(false);
      if (res.data) {
        setSyncedTemplates(res.data);
      }
    } catch (e) {
      console.warn('Could not load synced templates for selector', e);
    }
  };

  // Fetch session status whenever clean WhatsApp ID changes
  useEffect(() => {
    if (!isOpen) return;
    const cleanWaId = targetWaId.replace(/[^0-9]/g, '');
    if (cleanWaId.length >= 10) {
      checkSession(cleanWaId);
    } else {
      setSessionInfo(null);
    }
  }, [targetWaId, isOpen]);

  const checkSession = async (waId: string) => {
    try {
      setLoadingSession(true);
      const info = await fetchSessionStatus(waId);
      setSessionInfo(info);

      if (info.sessionStatus === 'CLOSED' || info.sessionStatus === 'UNKNOWN') {
        setDispatchMode('PAYMENT_TEMPLATE');
        setPreferredMode('DIRECT_LINK');
      } else {
        if (!initialTemplateKey) {
          setDispatchMode('SESSION_MESSAGE');
          setPreferredMode('NATIVE_WHATSAPP');
        }
      }
    } catch (err) {
      console.error('Failed to fetch session status', err);
    } finally {
      setLoadingSession(false);
    }
  };

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { name: '', sku: '', quantity: 1, unitPriceRupees: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const subtotal = items.reduce((acc, it) => acc + (it.quantity || 0) * (it.unitPriceRupees || 0), 0);
  const total = Math.max(0, subtotal - (discountRupees || 0) + (taxRupees || 0) + (shippingRupees || 0));

  // Determine active template (prebuilt or synced custom)
  const prebuiltMatch = PREBUILT_PAYMENT_TEMPLATES.find((t) => t.definitionKey === selectedTemplateKey);
  const syncedMatch = syncedTemplates.find((t) => t.name === selectedTemplateKey);

  const selectedTemplate: PaymentTemplateDefinition = prebuiltMatch || {
    definitionKey: syncedMatch?.name || selectedTemplateKey,
    name: syncedMatch?.name || selectedTemplateKey,
    version: 1,
    expectedCategory: (syncedMatch?.category as any) || 'UTILITY',
    description: `Custom Template from WhatsApp Account (${syncedMatch?.language || 'en_US'})`,
    requiredVariables: ['1', '2', '3'],
    sampleBody: syncedMatch?.bodyText || 'Payment notification for {{1}} regarding {{2}} of amount {{3}}.',
    samplePreview: {
      customer_name: targetName || 'Customer',
      order_reference: items[0]?.name || 'ORD-9821',
      amount: `₹${total.toFixed(2)}`,
    },
    ctaButton: {
      type: 'URL',
      text: syncedMatch?.buttons?.[0]?.text || 'Pay Now',
      dynamicUrlPath: '/checkout/{{1}}',
    },
  };

  const handleSendBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWaId = targetWaId.replace(/[^0-9]/g, '');
    if (!cleanWaId || cleanWaId.length < 10) {
      setError('Please enter a valid customer WhatsApp number with country code (e.g. 919876543210)');
      return;
    }

    if (items.some((it) => !it.name.trim() || it.unitPriceRupees <= 0)) {
      setError('Please provide valid names and prices (> 0) for all items');
      return;
    }
    if (total <= 0) {
      setError('Total bill amount must be greater than zero');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const paymentItems: PaymentItemDto[] = items.map((it) => ({
        name: it.name.trim(),
        sku: it.sku.trim() || undefined,
        quantity: Number(it.quantity),
        unitPriceMinor: Math.round(Number(it.unitPriceRupees) * 100),
      }));

      const payload: PaymentRequestDto = {
        customerWaId: cleanWaId,
        customerName: targetName.trim() || undefined,
        discountMinor: Math.round(Number(discountRupees || 0) * 100),
        taxMinor: Math.round(Number(taxRupees || 0) * 100),
        shippingMinor: Math.round(Number(shippingRupees || 0) * 100),
        preferredPaymentMode: preferredMode,
        dispatchMode: dispatchMode,
        templateDefinitionKey: dispatchMode === 'PAYMENT_TEMPLATE' ? selectedTemplateKey : undefined,
        templateParameters: dispatchMode === 'PAYMENT_TEMPLATE' ? templateParams : undefined,
        items: paymentItems,
      };

      const createdOrder = await sendPaymentBill(payload);
      if (onSuccess) {
        onSuccess(createdOrder);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send payment bill';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const remainingHours = sessionInfo ? Math.floor(sessionInfo.remainingSeconds / 3600) : 0;
  const remainingMins = sessionInfo ? Math.floor((sessionInfo.remainingSeconds % 3600) / 60) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base leading-tight">
                Send WhatsApp Bill & Payment Request
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Session-aware payment dispatch with 24-hour window policy
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSendBill} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Recipient Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                WhatsApp Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="e.g. 919876543210"
                value={targetWaId}
                onChange={(e) => setTargetWaId(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                required
              />
              <span className="text-[10px] text-slate-400">With country code (e.g. 91 for India)</span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Customer Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
              />
              <span className="text-[10px] text-slate-400">Appears on the bill and WhatsApp message</span>
            </div>
          </div>

          {/* Server-Enforced 24-Hour Session Status Banner */}
          {targetWaId.replace(/[^0-9]/g, '').length >= 10 && (
            <div
              className={cx(
                'p-3.5 rounded-xl border flex items-start gap-3 transition-all',
                loadingSession
                  ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  : sessionInfo?.sessionStatus === 'OPEN'
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800/60 dark:text-emerald-200'
                  : 'bg-amber-50/70 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800/60 dark:text-amber-200'
              )}
            >
              {loadingSession ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />
              ) : sessionInfo?.sessionStatus === 'OPEN' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs">
                <div className="font-bold flex items-center justify-between">
                  <span>
                    {loadingSession
                      ? 'Checking WhatsApp 24-hour service window...'
                      : sessionInfo?.sessionStatus === 'OPEN'
                      ? '🟢 Customer Service Window Open'
                      : '🔴 Customer Service Window Expired / Closed'}
                  </span>
                  {sessionInfo?.sessionStatus === 'OPEN' && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-200/60 dark:bg-emerald-800/40 text-emerald-800 dark:text-emerald-200 font-semibold">
                      Expires in {remainingHours}h {remainingMins}m
                    </span>
                  )}
                </div>
                <p className="mt-0.5 opacity-85 text-[11px]">
                  {sessionInfo?.sessionStatus === 'OPEN'
                    ? 'You can dispatch an Interactive UPI Checkout card directly, or send a pre-built payment template.'
                    : 'Customer has not sent an inbound message in the last 24 hours. Meta requires an approved WhatsApp Payment Template to contact this recipient.'}
                </p>
              </div>
            </div>
          )}

          {/* Delivery & Dispatch Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Dispatch Delivery Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  if (sessionInfo?.sessionStatus === 'CLOSED') return;
                  setDispatchMode('SESSION_MESSAGE');
                }}
                disabled={sessionInfo?.sessionStatus === 'CLOSED'}
                className={cx(
                  'flex items-center gap-2.5 p-3 rounded-xl border text-left transition',
                  dispatchMode === 'SESSION_MESSAGE'
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300',
                  sessionInfo?.sessionStatus === 'CLOSED' && 'opacity-40 cursor-not-allowed'
                )}
              >
                <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">In-Chat Session Card</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {sessionInfo?.sessionStatus === 'CLOSED' ? 'Requires active 24h window' : 'Native UPI / Direct CTA'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDispatchMode('PAYMENT_TEMPLATE')}
                className={cx(
                  'flex items-center gap-2.5 p-3 rounded-xl border text-left transition',
                  dispatchMode === 'PAYMENT_TEMPLATE'
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                )}
              >
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">WhatsApp Payment Template</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">24h Safe · Approved WABA Template</div>
                </div>
              </button>
            </div>
          </div>

          {/* If In-Chat Session Mode -> Select Experience Sub-mode */}
          {dispatchMode === 'SESSION_MESSAGE' && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                In-Chat Checkout Experience
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPreferredMode('NATIVE_WHATSAPP')}
                  className={cx(
                    'p-2 rounded-lg text-xs font-semibold border text-center transition',
                    preferredMode === 'NATIVE_WHATSAPP'
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  )}
                >
                  ⚡ Native UPI (Order Details)
                </button>
                <button
                  type="button"
                  onClick={() => setPreferredMode('DIRECT_LINK')}
                  className={cx(
                    'p-2 rounded-lg text-xs font-semibold border text-center transition',
                    preferredMode === 'DIRECT_LINK'
                      ? 'border-indigo-500 bg-indigo-600 text-white shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  )}
                >
                  💳 Gateway Link (Razorpay/PayU)
                </button>
              </div>
            </div>
          )}

          {/* If Template Mode -> Select from 5 Pre-Built Definitions & Parameters */}
          {dispatchMode === 'PAYMENT_TEMPLATE' && (
            <div className="space-y-3 p-4 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl border border-indigo-200 dark:border-indigo-800/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Select WhatsApp Payment Template
                </label>
                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(true)}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Create New
                </button>
              </div>

              <select
                value={selectedTemplateKey}
                onChange={(e) => setSelectedTemplateKey(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800 dark:text-slate-200"
              >
                <optgroup label="⭐ Pre-Built Payment Blueprints">
                  {PREBUILT_PAYMENT_TEMPLATES.map((t) => (
                    <option key={t.definitionKey} value={t.definitionKey}>
                      {t.name} — {t.description}
                    </option>
                  ))}
                </optgroup>
                {syncedTemplates.length > 0 && (
                  <optgroup label="🏢 Synced WhatsApp Account Templates">
                    {syncedTemplates.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name} ({t.category} · {t.language})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              {/* Dynamic template variable input helpers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {selectedTemplateKey === 'pending_bill_reminder_v1' && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Payment Due Date / Deadline
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tomorrow, 6:00 PM"
                      value={templateParams['due_date'] || ''}
                      onChange={(e) => setTemplateParams({ ...templateParams, due_date: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {selectedTemplateKey === 'service_booking_deposit_v1' && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Booking Slot Date/Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Saturday, 11:30 AM"
                      value={templateParams['booking_date'] || ''}
                      onChange={(e) => setTemplateParams({ ...templateParams, booking_date: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {selectedTemplateKey === 'subscription_renewal_notice_v1' && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Renewal Due Date
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 30th September 2026"
                      value={templateParams['renewal_date'] || ''}
                      onChange={(e) => setTemplateParams({ ...templateParams, renewal_date: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {selectedTemplateKey === 'quotation_payment_approval_v1' && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Quote Validity Deadline
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 7 days from now"
                      value={templateParams['valid_until'] || ''}
                      onChange={(e) => setTemplateParams({ ...templateParams, valid_until: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Approximate Live WhatsApp Template Preview */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  WhatsApp-style message preview
                </div>
                <div className="bg-[#efeae2] dark:bg-[#111b21] p-3 rounded-lg text-slate-800 dark:text-slate-200 text-xs shadow-xs font-sans leading-relaxed border border-slate-200/50 dark:border-slate-800">
                  <p>
                    {selectedTemplate.sampleBody
                      .replace('{{1}}', targetName || 'Valued Customer')
                      .replace('{{2}}', items[0]?.name || 'ORD-REF')
                      .replace('{{3}}', `₹${total.toFixed(2)}`)
                      .replace('{{4}}', templateParams['due_date'] || templateParams['booking_date'] || templateParams['renewal_date'] || 'Tomorrow')
                      .replace('{{5}}', 'INR')}
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-center">
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                      💳 Pay Now (₹{total.toFixed(2)})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Line Items
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Item Title (e.g. Standard Consultation)"
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
                    />
                  </div>
                  <div className="w-28 relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Price"
                      value={item.unitPriceRupees || ''}
                      onChange={(e) => handleItemChange(idx, 'unitPriceRupees', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs pl-6 pr-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right font-medium"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length === 1}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Adjustments (Discount, Tax, Shipping) */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Discount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={discountRupees || ''}
                onChange={(e) => setDiscountRupees(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Tax / GST (₹)
              </label>
              <input
                type="number"
                min="0"
                value={taxRupees || ''}
                onChange={(e) => setTaxRupees(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Shipping (₹)
              </label>
              <input
                type="number"
                min="0"
                value={shippingRupees || ''}
                onChange={(e) => setShippingRupees(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Total Summary */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 border border-slate-200/60 dark:border-slate-700/40">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discountRupees > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                <span>Discount:</span>
                <span>-₹{discountRupees.toFixed(2)}</span>
              </div>
            )}
            {taxRupees > 0 && (
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Tax / GST:</span>
                <span>+₹{taxRupees.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-slate-100 pt-1.5 border-t border-slate-200 dark:border-slate-700">
              <span>Total Payable:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-base">₹{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {dispatchMode === 'PAYMENT_TEMPLATE'
                ? `Dispatch Template Bill (₹${total.toFixed(2)})`
                : `Send In-Chat Bill (₹${total.toFixed(2)})`}
            </button>
          </div>
        </form>
      </div>

      {/* Embedded Payment Template Builder Modal */}
      <PaymentTemplateBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSuccess={(created) => {
          loadWabaTemplates();
          setSelectedTemplateKey(created.name);
          setIsBuilderOpen(false);
        }}
      />
    </div>
  );
}
