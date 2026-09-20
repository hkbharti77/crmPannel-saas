import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X, ShoppingCart, Users, ChevronLeft, ChevronRight,
  ExternalLink, AlertCircle, Package, Phone,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { cx } from '@/lib/types';

interface BuyerEntry {
  orderId: string;
  customerName: string | null;
  waId: string;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
}

interface ProductSummary { sku: string; name: string; imageUrl?: string }
interface OrderSummary   { orderCount: number; uniqueBuyerCount: number }

interface BuyersResponse {
  product: ProductSummary;
  summary: OrderSummary;
  buyers: BuyerEntry[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

interface ProductBuyersDrawerProps {
  metaCatalogId: string;
  sku: string;
  productName: string;
  productImage?: string;
  onClose: () => void;
}

function PaymentBadge({ status }: { status: string }) {
  const s = status?.toUpperCase();
  const cls = s === 'PAID'
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
    : s === 'UNPAID' || s === 'PENDING' || s === 'PAYMENT_LINK_CREATED'
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700'
    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-600';
  return (
    <span className={cx('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border', cls)}>
      {s}
    </span>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase();
  const cls = s === 'CONFIRMED' || s === 'DELIVERED'
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
    : s === 'PLACED' || s === 'RECEIVED'
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
    : s === 'PENDING_MANUAL_REVIEW'
    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  return (
    <span className={cx('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold', cls)}>
      {s?.replace(/_/g, ' ')}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-28" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-14" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-8" /></td>
    </tr>
  );
}

export function ProductBuyersDrawer({
  metaCatalogId,
  sku,
  productName,
  productImage,
  onClose,
}: ProductBuyersDrawerProps) {
  const [data, setData] = useState<BuyersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const fetchBuyers = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<BuyersResponse>(
        `/api/v1/whatsapp/catalogs/${metaCatalogId}/products/${encodeURIComponent(sku)}/buyers?page=${p}&size=20`
      );
      if (res.error) throw new Error(res.error);
      setData(res.data!);
    } catch (e: any) {
      setError(e.message || 'Failed to load buyers');
    } finally {
      setLoading(false);
    }
  }, [metaCatalogId, sku]);

  useEffect(() => { fetchBuyers(page); }, [fetchBuyers, page]);

  // Escape key closes drawer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const formatDate = (iso: string) =>
    iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-[9999] flex w-full max-w-2xl flex-col bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-5 py-4">
          <div className="flex items-center gap-3">
            {productImage ? (
              <img src={productImage} alt={productName} className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Package className="w-5 h-5 text-slate-400" />
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{productName}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">SKU: {sku}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary Strip */}
        {data && !loading && (
          <div className="flex items-center gap-6 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">{data.summary.orderCount}</span>
              <span className="text-xs text-slate-500">orders</span>
            </div>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">{data.summary.uniqueBuyerCount}</span>
              <span className="text-xs text-slate-500">unique customers</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
              <AlertCircle className="w-10 h-10 text-rose-400" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Failed to load buyers</p>
              <p className="text-xs text-slate-500">{error}</p>
              <button
                onClick={() => fetchBuyers(page)}
                className="mt-2 px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : !loading && data?.buyers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
              <ShoppingCart className="w-12 h-12 text-slate-300 dark:text-slate-600" />
              <p className="text-base font-bold text-slate-600 dark:text-slate-300">No orders yet</p>
              <p className="text-sm text-slate-400">No customers have ordered this product yet.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                  : data?.buyers.map(buyer => (
                    <tr key={buyer.orderId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                          {buyer.customerName || 'WhatsApp Customer'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <Phone className="w-3 h-3 shrink-0" />
                          +{buyer.waId}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          ₹{Number(buyer.total).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={buyer.orderStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <PaymentBadge status={buyer.paymentStatus} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(buyer.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={`/orders?id=${buyer.orderId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                          title="View order details"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 px-5 py-3 bg-white dark:bg-slate-900">
            <p className="text-xs text-slate-500">
              Page {data.page + 1} of {data.totalPages} · {data.totalElements} total
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                disabled={page >= data.totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
