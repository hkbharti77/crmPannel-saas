import { useState } from 'react';
import { cx } from '@/lib/types';
import {
  X,
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  RefreshCw,
  Send,
  CreditCard,
  Zap,
  ShoppingBag,
  Receipt,
  User,
  Phone,
  Calendar,
  Loader2,
} from 'lucide-react';
import {
  resendPaymentOrder,
  refundPaymentOrder,
  type WhatsAppOrderResponseDto,
} from '@/lib/paymentApi';

interface OrderDetailDrawerProps {
  order: WhatsAppOrderResponseDto | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated: () => void;
}

export function OrderDetailDrawer({
  order,
  isOpen,
  onClose,
  onOrderUpdated,
}: OrderDetailDrawerProps) {
  const [resending, setResending] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmountRupees, setRefundAmountRupees] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('');
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(order.referenceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResend = async () => {
    try {
      setResending(true);
      setActionError(null);
      await resendPaymentOrder(order.id);
      onOrderUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend payment';
      setActionError(msg);
    } finally {
      setResending(false);
    }
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRefunding(true);
      setActionError(null);
      const minorAmount = refundAmountRupees > 0 ? Math.round(refundAmountRupees * 100) : undefined;
      await refundPaymentOrder(order.id, minorAmount, refundReason);
      setShowRefundModal(false);
      onOrderUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Refund failed';
      setActionError(msg);
    } finally {
      setRefunding(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" /> PAID
          </span>
        );
      case 'PAYMENT_PENDING':
      case 'PAYMENT_REQUEST_SENT':
      case 'CREATED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <Clock className="w-3 h-3" /> PENDING
          </span>
        );
      case 'PARTIALLY_REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
            <RotateCcw className="w-3 h-3" /> PARTIALLY REFUNDED
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
            <RotateCcw className="w-3 h-3" /> REFUNDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <AlertCircle className="w-3 h-3" /> {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                  {order.referenceId}
                </span>
                <button
                  onClick={handleCopyRef}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                  title="Copy Reference"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {copied && <span className="text-[11px] text-emerald-600 font-medium">Copied!</span>}
              </div>
              <div className="mt-1 flex items-center gap-2">
                {getStatusBadge(order.paymentStatus)}
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(order.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {actionError && (
              <div className="p-3 rounded-lg text-xs bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Customer Information */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Details</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{order.customerName || 'Anonymous Customer'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{order.customerWaId}</span>
                </div>
              </div>
            </div>

            {/* Line Items Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Itemized Bill</h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {order.items.map((item) => (
                  <div key={item.id} className="p-3 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</div>
                      <div className="text-slate-400 text-[11px]">
                        Qty: {item.quantity} × ₹{(item.unitPriceMinor / 100).toFixed(2)}
                      </div>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      ₹{(item.lineTotalMinor / 100).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Table */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 text-xs border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>₹{(order.subtotalMinor / 100).toFixed(2)}</span>
                </div>
                {order.discountMinor > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-₹{(order.discountMinor / 100).toFixed(2)}</span>
                  </div>
                )}
                {order.taxMinor > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Tax / GST:</span>
                    <span>+₹{(order.taxMinor / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Total Amount:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">₹{(order.totalMinor / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Attempts / Transactions */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Payment Transactions ({order.transactions.length})
              </h4>
              <div className="space-y-2">
                {order.transactions.map((tx, idx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                        {tx.paymentMode === 'NATIVE_WHATSAPP' ? (
                          <Zap className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                        )}
                        <span>{tx.provider}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({tx.paymentMode})</span>
                      </div>
                      <span
                        className={cx(
                          'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                          tx.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : tx.status === 'FAILED'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        )}
                      >
                        {tx.status}
                      </span>
                    </div>
                    {tx.providerPaymentId && (
                      <div className="text-slate-500 font-mono text-[11px]">
                        Txn ID: {tx.providerPaymentId}
                      </div>
                    )}
                    {tx.failureReason && (
                      <div className="text-rose-600 text-[11px]">
                        Failure: {tx.failureReason}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit History Timeline */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Audit Timeline</h4>
              <div className="space-y-2 border-l-2 border-slate-200 dark:border-slate-800 ml-2 pl-4">
                {order.auditLogs.map((log) => (
                  <div key={log.id} className="relative text-xs space-y-0.5">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-600 border-2 border-white dark:border-slate-900" />
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {log.action} <span className="text-slate-400 font-normal">by {log.actorType}</span>
                    </div>
                    {log.newStatus && (
                      <div className="text-[11px] text-slate-500">Status $\rightarrow$ {log.newStatus}</div>
                    )}
                    <div className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between gap-3">
            {order.paymentStatus !== 'PAID' && order.paymentStatus !== 'REFUNDED' && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 transition disabled:opacity-50"
              >
                {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Resend Bill
              </button>
            )}

            {(order.paymentStatus === 'PAID' || order.paymentStatus === 'PARTIALLY_REFUNDED') && (
              <button
                type="button"
                onClick={() => {
                  setRefundAmountRupees(order.totalMinor / 100);
                  setShowRefundModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-rose-700 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Issue Refund
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 ml-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Process Refund</h3>
            <form onSubmit={handleRefundSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Refund Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={order.totalMinor / 100}
                  value={refundAmountRupees || ''}
                  onChange={(e) => setRefundAmountRupees(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 font-bold"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Reason for Refund
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Customer requested cancellation / defective item"
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refunding}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {refunding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  Confirm Refund (₹{refundAmountRupees.toFixed(2)})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
