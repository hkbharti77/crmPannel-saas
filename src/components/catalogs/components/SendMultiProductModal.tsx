import { useState, useEffect } from 'react';
import { Send, Loader2, Image as ImageIcon, CheckCircle2, X } from 'lucide-react';
import { Modal } from '@/components/ui/primitives';
import { apiFetch } from '@/lib/api';
import type { CommerceProduct } from '../types';

interface SendMultiProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: CommerceProduct[];
  catalogId: string;
  showToast: (msg: string, isErr?: boolean) => void;
  onSuccess?: () => void;
}

export function SendMultiProductModal({
  isOpen,
  onClose,
  products: initialProducts,
  catalogId,
  showToast,
  onSuccess,
}: SendMultiProductModalProps) {
  const [selectedProducts, setSelectedProducts] = useState<CommerceProduct[]>([]);
  const [waId, setWaId] = useState('');
  const [headerText, setHeaderText] = useState('Our Featured Products');
  const [bodyText, setBodyText] = useState('Browse our selected collection below:');
  const [footerText, setFooterText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [requestId, setRequestId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedProducts(initialProducts);
      setRequestId(crypto.randomUUID());
      setHeaderText('Our Featured Products');
      setBodyText('Browse our selected collection below:');
      setFooterText('');
    } else {
      setWaId('');
      setIsSending(false);
    }
  }, [isOpen, initialProducts]);

  if (!isOpen || selectedProducts.length === 0) return null;

  const handleRemoveProduct = (productId: string) => {
    if (selectedProducts.length <= 1) {
      showToast('At least one product must remain selected.', true);
      return;
    }
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleSend = async () => {
    const cleanWaId = waId.replace(/[^0-9+]/g, '');
    if (!cleanWaId || cleanWaId.replace(/[^0-9]/g, '').length < 10) {
      showToast('Please enter a valid phone number with country code (e.g. +919876543210)', true);
      return;
    }

    if (selectedProducts.length === 0) {
      showToast('Please select at least one product', true);
      return;
    }

    if (selectedProducts.length > 30) {
      showToast('Maximum 30 products allowed in a Multi-Product Message', true);
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
      }>(`/api/v1/whatsapp/catalogs/${catalogId}/send-multi-product`, {
        method: 'POST',
        body: JSON.stringify({
          requestId,
          waId: cleanWaId,
          headerText: headerText.trim() || undefined,
          bodyText: bodyText.trim() || undefined,
          footerText: footerText.trim() || undefined,
          productRetailerIds: selectedProducts.map(p => p.productRetailerId),
        }),
      });

      if (res.error) {
        throw new Error(res.error);
      }

      if (res.data?.status === 'in_progress') {
        showToast('Multi-product message is processing in background.');
      } else {
        showToast(`Catalog collection (${selectedProducts.length} items) sent to ${cleanWaId}!`);
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to send multi-product message', true);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Send Multi-Product Message (${selectedProducts.length} items)`}
    >
      <div className="space-y-4">
        {/* Selected Products Chips */}
        <div>
          <label className="block text-xs font-bold text-secondary-c uppercase tracking-wider mb-2">
            Selected Products ({selectedProducts.length})
          </label>
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-ink-800/80 rounded-lg border border-base-c">
            {selectedProducts.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-ink-900 border border-base-c text-xs text-primary-c"
              >
                <div className="w-4 h-4 rounded bg-slate-100 dark:bg-ink-800 overflow-hidden shrink-0 flex items-center justify-center">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-2.5 h-2.5 text-slate-400" />
                  )}
                </div>
                <span className="font-medium truncate max-w-[120px]">{p.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(p.id)}
                  disabled={isSending}
                  className="text-muted-c hover:text-rose-500 transition-colors p-0.5"
                  title="Remove from list"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
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
        </div>

        {/* Header Text */}
        <div>
          <label className="block text-xs font-bold text-secondary-c uppercase tracking-wider mb-1.5">
            Header Title <span className="text-muted-c font-normal lowercase">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Featured Products"
            value={headerText}
            onChange={(e) => setHeaderText(e.target.value)}
            disabled={isSending}
            maxLength={60}
            className="w-full px-3.5 py-2 text-sm bg-white dark:bg-ink-850 border border-base-c rounded-lg text-primary-c focus:outline-hidden focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
          />
        </div>

        {/* Body Text */}
        <div>
          <label className="block text-xs font-bold text-secondary-c uppercase tracking-wider mb-1.5">
            Body Description <span className="text-muted-c font-normal lowercase">(optional)</span>
          </label>
          <textarea
            rows={2}
            placeholder="Browse our selected products below..."
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            disabled={isSending}
            maxLength={1024}
            className="w-full px-3.5 py-2 text-sm bg-white dark:bg-ink-850 border border-base-c rounded-lg text-primary-c focus:outline-hidden focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors resize-none"
          />
        </div>

        {/* Footer Text */}
        <div>
          <label className="block text-xs font-bold text-secondary-c uppercase tracking-wider mb-1.5">
            Footer Note <span className="text-muted-c font-normal lowercase">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Tap View items to browse full catalog"
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
            disabled={isSending}
            maxLength={60}
            className="w-full px-3.5 py-2 text-sm bg-white dark:bg-ink-850 border border-base-c rounded-lg text-primary-c focus:outline-hidden focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
          />
        </div>

        {/* Info Box */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Sends an interactive Multi-Product Message (MPM). The customer will be able to browse the products and add items to a shared cart directly inside WhatsApp.
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
            disabled={isSending || selectedProducts.length === 0}
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
                Send Multi-Product ({selectedProducts.length})
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
