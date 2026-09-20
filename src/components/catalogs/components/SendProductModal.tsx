import { useState, useEffect } from 'react';
import { Send, Loader2, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/primitives';
import { apiFetch } from '@/lib/api';
import type { CommerceProduct } from '../types';

interface SendProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: CommerceProduct | null;
  catalogId: string;
  showToast: (msg: string, isErr?: boolean) => void;
  onSuccess?: () => void;
}

export function SendProductModal({
  isOpen,
  onClose,
  product,
  catalogId,
  showToast,
  onSuccess,
}: SendProductModalProps) {
  const [waId, setWaId] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [requestId, setRequestId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRequestId(crypto.randomUUID());
      setBodyText(product ? `Check out our ${product.name}!` : '');
    } else {
      setWaId('');
      setBodyText('');
      setIsSending(false);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const currencySymbol = product.currency === 'USD' ? '$' : product.currency === 'EUR' ? '€' : '₹';
  const priceNum = typeof product.price === 'number' ? product.price : parseFloat(String(product.price || 0));

  const handleSend = async () => {
    const cleanWaId = waId.replace(/[^0-9+]/g, '');
    if (!cleanWaId || cleanWaId.replace(/[^0-9]/g, '').length < 10) {
      showToast('Please enter a valid phone number with country code (e.g. +919876543210)', true);
      return;
    }

    setIsSending(true);
    try {
      const res = await apiFetch<{
        status: string;
        waMessageId?: string;
        messageId?: string;
        error?: string;
        failureReason?: string;
      }>(`/api/v1/whatsapp/catalogs/${catalogId}/send-product`, {
        method: 'POST',
        body: JSON.stringify({
          requestId,
          waId: cleanWaId,
          productRetailerId: product.productRetailerId,
          bodyText: bodyText.trim() || undefined,
        }),
      });

      if (res.error) {
        throw new Error(res.error);
      }

      if (res.data?.status === 'in_progress') {
        showToast('Message send is currently processing in background.');
      } else {
        showToast(`Product sent to ${cleanWaId}! (ID: ${res.data?.waMessageId || 'OK'})`);
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to send product message', true);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Product to WhatsApp"
    >
      <div className="space-y-5">
        {/* Product Card Preview */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-ink-800/80 border border-base-c">
          <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-ink-900 border border-base-c overflow-hidden shrink-0 flex items-center justify-center">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm text-primary-c truncate">{product.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs text-secondary-c">{product.productRetailerId}</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {currencySymbol}{priceNum.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Phone Number */}
        <div>
          <label className="block text-xs font-bold text-secondary-c uppercase tracking-wider mb-1.5">
            Recipient WhatsApp Number <span className="text-rose-500">*</span>
          </label>
          <input
            type="tel"
            placeholder="+919876543210"
            value={waId}
            onChange={(e) => setWaId(e.target.value)}
            disabled={isSending}
            className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-ink-850 border border-base-c rounded-lg text-primary-c focus:outline-hidden focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
          />
          <p className="text-[11px] text-muted-c mt-1">
            Include country code without spaces or dashes (e.g. +919876543210).
          </p>
        </div>

        {/* Optional Body Text */}
        <div>
          <label className="block text-xs font-bold text-secondary-c uppercase tracking-wider mb-1.5">
            Accompanying Message <span className="text-muted-c font-normal lowercase">(optional)</span>
          </label>
          <textarea
            rows={2}
            placeholder="Add an introductory message for the customer..."
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            disabled={isSending}
            className="w-full px-3.5 py-2 text-sm bg-white dark:bg-ink-850 border border-base-c rounded-lg text-primary-c focus:outline-hidden focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors resize-none"
          />
        </div>

        {/* Info Box */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            This dispatches an interactive Single Product Message (SPM). The customer will see a native WhatsApp product card with view details and add-to-cart buttons.
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="px-4 py-2 text-xs font-semibold text-secondary-c hover:text-primary-c border border-base-c rounded-lg hover:bg-base-c transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending}
            className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isSending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Send Product
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
