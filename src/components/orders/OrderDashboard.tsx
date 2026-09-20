import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { apiFetch } from '@/lib/api';
import {
  ShoppingBag,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  MapPin,
  Mail,
  Phone,
  CreditCard,
  Truck,
  Eye,
  X,
  Sparkles,
} from 'lucide-react';

interface OrderItem {
  id?: string;
  productRetailerId: string;
  quantity: number;
  itemPrice: number;
  currency?: string;
}

interface CommerceOrder {
  id: string;
  customerName: string;
  customerWaId: string;
  customerPhone?: string;
  customerEmail?: string;
  status: string;
  checkoutStatus?: string;
  paymentStatus: string;
  paymentMethod?: string;
  paymentProvider?: string;
  paymentLinkId?: string;
  paymentLinkUrl?: string;
  total: number;
  currency: string;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  discount?: number;
  shippingAddress?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  createdAt: string;
  paidAt?: string;
  items?: OrderItem[];
}

export function OrderDashboard() {
  const [orders, setOrders] = useState<CommerceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<CommerceOrder | null>(null);
  const [confirmMarkPaidOrderId, setConfirmMarkPaidOrderId] = useState<string | null>(null);
  const [markPaidLoading, setMarkPaidLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!selectedOrder) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedOrder(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOrder]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiFetch<any>('/api/v1/whatsapp/orders?sortBy=createdAt&sortDir=desc');
      if (response.error) throw new Error(response.error);
      setOrders(response.data?.content || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await apiFetch(`/api/v1/whatsapp/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (res.error) throw new Error(res.error);
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handleMarkPaidConfirmed = async () => {
    if (!confirmMarkPaidOrderId) return;
    const orderId = confirmMarkPaidOrderId;
    try {
      setMarkPaidLoading(true);
      setSyncingOrderId(orderId);
      const res = await apiFetch<CommerceOrder>(`/api/v1/whatsapp/orders/${orderId}/mark-paid`, {
        method: 'POST',
      });
      if (res.error) throw new Error(res.error);
      fetchOrders();
      if (selectedOrder?.id === orderId && res.data) {
        setSelectedOrder(res.data);
      }
    } catch (error: any) {
      console.error('Failed to mark order paid:', error);
    } finally {
      setMarkPaidLoading(false);
      setSyncingOrderId(null);
      setConfirmMarkPaidOrderId(null);
    }
  };

  const syncPaymentStatus = async (orderId: string) => {
    try {
      setSyncingOrderId(orderId);
      const res = await apiFetch<CommerceOrder>(`/api/v1/whatsapp/orders/${orderId}/sync-payment`, {
        method: 'POST',
      });
      if (res.error) throw new Error(res.error);
      fetchOrders();
      if (selectedOrder?.id === orderId && res.data) {
        setSelectedOrder(res.data);
      }
    } catch (error: any) {
      console.error('Failed to sync payment status:', error);
    } finally {
      setSyncingOrderId(null);
    }
  };

  const markOrderPaid = (orderId: string) => {
    setConfirmMarkPaidOrderId(orderId);
  };

  const sendPaymentLink = async (orderId: string) => {
    try {
      const res = await apiFetch(`/api/v1/whatsapp/orders/${orderId}/send-payment`, {
        method: 'POST',
      });
      if (res.error) throw new Error(res.error);
      fetchOrders();
    } catch (error) {
      console.error('Failed to send payment link:', error);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPaymentBadge = (paymentStatus: string, method?: string) => {
    switch (paymentStatus?.toUpperCase()) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            PAID
          </span>
        );
      case 'PAYMENT_LINK_CREATED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <CreditCard className="w-3 h-3" />
            Link Sent
          </span>
        );
      case 'COD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <Truck className="w-3 h-3" />
            COD Confirmed
          </span>
        );
      case 'PAYMENT_FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <AlertCircle className="w-3 h-3" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            {paymentStatus || 'Awaiting Checkout'}
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              WhatsApp Catalog Commerce Orders
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Live Checkout
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Automated WhatsApp cart checkout orders with Razorpay direct links & address collection.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Customer & Address</th>
                <th className="px-6 py-4">Order Status</th>
                <th className="px-6 py-4">Payment & Gateway</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-emerald-500" />
                    Loading WhatsApp catalog orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <ShoppingBag className="mx-auto mb-3 h-10 w-10 opacity-20" />
                    No commerce cart orders found yet.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    {/* Customer */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {order.customerName || 'WhatsApp Customer'}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        +{order.customerWaId}
                      </div>
                      {(order.shippingAddress || order.addressLine1) && (
                        <div className="flex items-start gap-1 text-[11px] text-slate-400 mt-1 max-w-xs line-clamp-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                          <span>{order.shippingAddress || `${order.addressLine1}, ${order.city || ''} ${order.postalCode || ''}`}</span>
                        </div>
                      )}
                      {order.customerEmail && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{order.customerEmail}</span>
                        </div>
                      )}
                    </td>

                    {/* Order Status */}
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="RECEIVED">Received</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {new Date(order.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    {/* Payment & Gateway */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getPaymentBadge(order.paymentStatus, order.paymentMethod)}
                      </div>

                      {order.paymentLinkUrl && (
                        <div className="mt-2 flex items-center gap-2">
                          <a
                            href={order.paymentLinkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-500 hover:underline bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800"
                          >
                            <span>Open Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <button
                            onClick={() => copyToClipboard(order.paymentLinkUrl!, order.id)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded transition"
                            title="Copy link"
                          >
                            {copiedId === order.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}

                      {order.paymentLinkId && (
                        <div className="text-[10px] text-slate-400 font-mono mt-1">
                          Ref: {order.paymentLinkId}
                        </div>
                      )}
                    </td>

                    {/* Total */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        ₹{Number(order.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {order.currency || 'INR'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Details
                        </button>

                        {order.paymentLinkId && order.paymentStatus !== 'PAID' && (
                          <button
                            onClick={() => syncPaymentStatus(order.id)}
                            disabled={syncingOrderId === order.id}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800 transition"
                            title="Query Razorpay API directly to verify payment"
                          >
                            <RefreshCw className={`w-3 h-3 ${syncingOrderId === order.id ? 'animate-spin' : ''}`} />
                            Sync Razorpay
                          </button>
                        )}

                        {order.paymentStatus !== 'PAID' && (
                          <button
                            onClick={() => markOrderPaid(order.id)}
                            disabled={syncingOrderId === order.id}
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-emerald-600 transition"
                            title="Simulate payment confirmation"
                          >
                            <Sparkles className="w-3 h-3" />
                            Simulate Paid
                          </button>
                        )}

                        {(order.paymentStatus === 'NOT_REQUIRED' || order.paymentStatus === 'PENDING') && !order.paymentLinkUrl && (
                          <button
                            onClick={() => sendPaymentLink(order.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-500"
                          >
                            Send Payment Link
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder &&
        createPortal(
          <>
            {/* Full Viewport Backdrop */}
            <div
              className="fixed inset-0 top-0 right-0 bottom-0 left-0 w-screen h-screen z-[9998] bg-slate-950/65 backdrop-blur-md transition-all animate-in fade-in duration-200"
              onClick={() => setSelectedOrder(null)}
              aria-hidden="true"
            />

            {/* Modal Dialog Viewport Container */}
            <div className="fixed inset-0 top-0 right-0 bottom-0 left-0 w-screen h-screen z-[9999] pointer-events-none flex items-center justify-center p-4 overflow-y-auto">
              <div className="pointer-events-auto relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Order #{selectedOrder.id.substring(0, 8)}
                </h3>
                <p className="text-xs text-slate-500">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Status Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                <div>
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Payment Status</div>
                  <div className="mt-1">{getPaymentBadge(selectedOrder.paymentStatus, selectedOrder.paymentMethod)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Order Status</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedOrder.status}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Amount</div>
                  <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    ₹{Number(selectedOrder.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Payment Link Card */}
              {selectedOrder.paymentLinkUrl && (
                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" />
                      Razorpay Payment Link
                    </span>
                    {selectedOrder.paymentStatus !== 'PAID' && (
                      <button
                        onClick={() => syncPaymentStatus(selectedOrder.id)}
                        disabled={syncingOrderId === selectedOrder.id}
                        className="text-xs font-bold text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncingOrderId === selectedOrder.id ? 'animate-spin' : ''}`} />
                        Sync Razorpay
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={selectedOrder.paymentLinkUrl}
                      className="w-full text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300"
                    />
                    <a
                      href={selectedOrder.paymentLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0"
                    >
                      Pay Now <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {/* Customer & Shipping Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer</div>
                  <div className="font-semibold text-slate-900 dark:text-white">{selectedOrder.customerName}</div>
                  <div className="text-xs text-slate-500">WhatsApp: +{selectedOrder.customerWaId}</div>
                  {selectedOrder.customerEmail && (
                    <div className="text-xs text-slate-500">Email: {selectedOrder.customerEmail}</div>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Delivery Address</div>
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    {selectedOrder.shippingAddress || selectedOrder.addressLine1 ? (
                      <p>{selectedOrder.shippingAddress || `${selectedOrder.addressLine1}, ${selectedOrder.city || ''} ${selectedOrder.postalCode || ''}`}</p>
                    ) : (
                      <span className="text-slate-400 italic">Address prompt in progress...</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Items List */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Ordered Items</div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 text-xs">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{item.productRetailerId}</div>
                          <div className="text-slate-400">Qty: {item.quantity}</div>
                        </div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          ₹{Number(item.itemPrice * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              {selectedOrder.paymentStatus !== 'PAID' ? (
                <button
                  onClick={() => markOrderPaid(selectedOrder.id)}
                  disabled={syncingOrderId === selectedOrder.id}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Mark as Paid & Confirm Order
                </button>
              ) : (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Order Confirmed & Paid
                </span>
              )}
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </>,
      document.body
    )}

    {/* Mark as Paid Confirm Modal */}
    <ConfirmModal
      isOpen={!!confirmMarkPaidOrderId}
      title="Mark Order as PAID?"
      message="This will manually mark the order as PAID and trigger an order confirmation message to the customer's WhatsApp."
      confirmText="Yes, Mark as Paid"
      cancelText="Cancel"
      variant="warning"
      confirmVariant="primary"
      isLoading={markPaidLoading}
      onConfirm={handleMarkPaidConfirmed}
      onCancel={() => setConfirmMarkPaidOrderId(null)}
    />
</div>
  );
}
