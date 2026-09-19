import { useState, useEffect } from 'react';
import { cx } from '@/lib/types';
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  IndianRupee,
  ShoppingBag,
  Zap,
  Layers,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  DollarSign,
  Receipt,
  User,
  FileText,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import {
  fetchOrders,
  type WhatsAppOrderResponseDto,
  type WhatsAppOrderPaymentStatus,
} from '@/lib/paymentApi';
import {
  PREBUILT_PAYMENT_TEMPLATES,
  generateMetaTemplateSubmissionJson,
  convertToWhatsAppTemplateDto,
  type PaymentTemplateDefinition,
} from '@/lib/paymentTemplates';
import {
  fetchWhatsAppTemplates,
  createWhatsAppTemplate,
  type WhatsAppTemplateDto,
} from '@/lib/broadcastsApi';
import { PaymentRequestModal } from './PaymentRequestModal';
import { PaymentTemplateBuilderModal } from './PaymentTemplateBuilderModal';
import { OrderDetailDrawer } from './OrderDetailDrawer';
import { PaymentGatewaySettingsPanel } from '@/components/settings/panels/PaymentGatewaySettingsPanel';

export function WhatsAppPaymentsDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'transactions' | 'refunds' | 'templates' | 'settings'>('orders');
  const [orders, setOrders] = useState<WhatsAppOrderResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Synced WABA state for status badges
  const [syncedTemplates, setSyncedTemplates] = useState<WhatsAppTemplateDto[]>([]);
  const [loadingSynced, setLoadingSynced] = useState(false);

  // 1-Click Deploy states
  const [deployingKey, setDeployingKey] = useState<string | null>(null);
  const [deploySuccessKey, setDeploySuccessKey] = useState<string | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);

  // Modals & Drawers
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(false);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | undefined>(undefined);
  const [selectedOrder, setSelectedOrder] = useState<WhatsAppOrderResponseDto | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter]);

  useEffect(() => {
    if (activeTab === 'templates' && syncedTemplates.length === 0) {
      loadSyncedTemplates(false);
    }
  }, [activeTab]);

  const loadSyncedTemplates = async (forceSync = false) => {
    try {
      setLoadingSynced(true);
      const res = await fetchWhatsAppTemplates(forceSync);
      if (res.data) {
        setSyncedTemplates(res.data);
      }
    } catch (err) {
      console.error('Failed to load synced WABA templates', err);
    } finally {
      setLoadingSynced(false);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const filter = statusFilter !== 'ALL' ? statusFilter : undefined;
      const data = await fetchOrders(page, 20, filter);
      setOrders(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalOrders(data.totalElements || 0);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  const handle1ClickDeploy = async (tpl: PaymentTemplateDefinition) => {
    try {
      setDeployingKey(tpl.definitionKey);
      setDeployError(null);
      const dto = convertToWhatsAppTemplateDto(tpl);
      const res = await createWhatsAppTemplate(dto);
      if (res.error) {
        throw new Error(res.error);
      }
      setDeploySuccessKey(tpl.definitionKey);
      await loadSyncedTemplates(true);
      setTimeout(() => setDeploySuccessKey(null), 3500);
    } catch (err: any) {
      setDeployError(err?.message || `Failed to deploy template ${tpl.name} to Meta`);
      setTimeout(() => setDeployError(null), 6000);
    } finally {
      setDeployingKey(null);
    }
  };

  const handleCopyJson = (tpl: PaymentTemplateDefinition) => {
    const json = generateMetaTemplateSubmissionJson(tpl);
    navigator.clipboard.writeText(json);
    setCopiedKey(tpl.definitionKey);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSendWithTemplate = (tplKey: string) => {
    setSelectedTemplateKey(tplKey);
    setIsSendModalOpen(true);
  };

  // Compute Metrics
  const totalRevenuePaise = orders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((acc, o) => acc + o.totalMinor, 0);
  const paidCount = orders.filter((o) => o.paymentStatus === 'PAID').length;
  const pendingCount = orders.filter((o) => ['CREATED', 'PAYMENT_REQUEST_SENT', 'PAYMENT_PENDING'].includes(o.paymentStatus)).length;
  const refundedPaise = orders
    .filter((o) => ['PARTIALLY_REFUNDED', 'REFUNDED'].includes(o.paymentStatus))
    .reduce((acc, o) => acc + o.totalMinor, 0);

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.referenceId.toLowerCase().includes(q) ||
      o.customerWaId.includes(q) ||
      (o.customerName && o.customerName.toLowerCase().includes(q))
    );
  });

  const allTransactions = orders.flatMap((o) =>
    o.transactions.map((t) => ({ ...t, orderReferenceId: o.referenceId, customerName: o.customerName, customerWaId: o.customerWaId }))
  );

  const allRefunds = orders.flatMap((o) =>
    o.refunds.map((r) => ({ ...r, orderReferenceId: o.referenceId, customerName: o.customerName, customerWaId: o.customerWaId }))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Zap className="w-6 h-6" />
            </span>
            WhatsApp Payments & Direct Billing
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            In-chat native UPI payments, itemized invoices, 24h session window policies, and multi-gateway checkout.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadOrders()}
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200 dark:border-slate-800"
            title="Refresh"
          >
            <RefreshCw className={cx('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <button
            onClick={() => {
              setSelectedTemplateKey(undefined);
              setIsSendModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Send Bill / Request Payment
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <span>Total Collected</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100">
            ₹{(totalRevenuePaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-600/90 font-medium">{paidCount} successfully paid orders</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Pending In-Chat Bills</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{pendingCount}</div>
          <div className="text-[11px] text-slate-400">Awaiting customer UPI tap</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Total Orders Created</span>
            <Receipt className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalOrders}</div>
          <div className="text-[11px] text-slate-400">Across all WhatsApp channels</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Refunded Total</span>
            <RotateCcw className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-900 dark:text-purple-300">
            ₹{(refundedPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400">Returned to customers</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'orders', label: 'Orders & Bills', count: totalOrders },
          { id: 'transactions', label: 'Transactions', count: allTransactions.length },
          { id: 'refunds', label: 'Refunds', count: allRefunds.length },
          { id: 'templates', label: 'Payment Templates', count: PREBUILT_PAYMENT_TEMPLATES.length },
          { id: 'settings', label: 'Gateway Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cx(
                  'px-1.5 py-0.5 rounded-full text-[10px]',
                  activeTab === tab.id
                    ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab 1: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Ref #, Phone or Name..."
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['ALL', 'PAID', 'PAYMENT_PENDING', 'FAILED', 'REFUNDED'].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st);
                    setPage(0);
                  }}
                  className={cx(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition whitespace-nowrap',
                    statusFilter === st
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  )}
                >
                  {st.replace('PAYMENT_', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3">Order Ref</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Mode</th>
                    <th className="px-5 py-3">Total (₹)</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                        No payment orders found.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDrawerOpen(true);
                        }}
                      >
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {order.referenceId}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-slate-900 dark:text-slate-100 font-semibold">
                            {order.customerName || 'Anonymous'}
                          </div>
                          <div className="text-slate-400 font-mono text-[11px]">{order.customerWaId}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            {order.preferredPaymentMode === 'NATIVE_WHATSAPP' ? (
                              <Zap className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                            )}
                            <span>{order.preferredPaymentMode === 'NATIVE_WHATSAPP' ? 'Native UPI' : 'Direct Link'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-slate-100 text-sm">
                          ₹{(order.totalMinor / 100).toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={cx(
                              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase',
                              order.paymentStatus === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : order.paymentStatus === 'FAILED'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : order.paymentStatus === 'REFUNDED'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            )}
                          >
                            {order.paymentStatus === 'PAID' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                              setIsDrawerOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 transition"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Transactions */}
      {activeTab === 'transactions' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Order Ref</th>
                <th className="px-5 py-3">Provider</th>
                <th className="px-5 py-3">Mode</th>
                <th className="px-5 py-3">Txn ID</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {allTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    No payment attempts recorded yet.
                  </td>
                </tr>
              ) : (
                allTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">{tx.orderReferenceId}</td>
                    <td className="px-5 py-3">{tx.provider}</td>
                    <td className="px-5 py-3 text-slate-500">{tx.paymentMode}</td>
                    <td className="px-5 py-3 font-mono text-[11px] text-slate-500">{tx.providerPaymentId || '—'}</td>
                    <td className="px-5 py-3 font-bold">₹{(tx.amountMinor / 100).toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cx(
                          'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                          tx.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800'
                        )}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-[11px]">{new Date(tx.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Refunds */}
      {activeTab === 'refunds' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Order Ref</th>
                <th className="px-5 py-3">Refund ID</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Reason</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Processed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {allRefunds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No refunds issued yet.
                  </td>
                </tr>
              ) : (
                allRefunds.map((ref) => (
                  <tr key={ref.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">{ref.orderReferenceId}</td>
                    <td className="px-5 py-3 font-mono text-[11px] text-slate-500">{ref.providerRefundId || ref.id}</td>
                    <td className="px-5 py-3 font-bold text-rose-600">₹{(ref.amountMinor / 100).toFixed(2)}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{ref.reason || '—'}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                        {ref.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-[11px]">{new Date(ref.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Payment Templates (Pre-Built & Synced WABA) */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* 24-Hour Policy Notice Card */}
          <div className="p-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20 rounded-2xl flex items-start gap-3.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                WhatsApp 24-Hour Customer Window & Template Compliance
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-4xl">
                When a customer's 24-hour session window expires, Meta blocks free-form text and native UPI cards.
                Use <strong>Approved WhatsApp Payment Templates</strong> with dynamic payment checkout URLs
                to legally re-engage customers and collect payments out of session.
              </p>
            </div>
          </div>

          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="p-1 rounded bg-emerald-500/10 text-emerald-600">
                  <Layers className="w-4 h-4" />
                </span>
                Curated Payment Templates
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pre-formatted Meta WhatsApp billing schemas ready to deploy to your WhatsApp Business Account in 1 click.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                {PREBUILT_PAYMENT_TEMPLATES.length} Ready Templates Available
              </span>

              <button
                type="button"
                onClick={() => setIsBuilderModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Payment Template</span>
              </button>
            </div>
          </div>

          {/* Curated Payment Templates Grid */}
          <div className="space-y-4">
            {deployError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deployError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {PREBUILT_PAYMENT_TEMPLATES.map((tpl) => {
                const syncedMatch = syncedTemplates.find((t) => t.name === tpl.name);
                const isDeploying = deployingKey === tpl.definitionKey;
                const isSuccess = deploySuccessKey === tpl.definitionKey;

                return (
                  <div
                    key={tpl.definitionKey}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    <div className="space-y-3">
                      {/* Top Category & Status Badges */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          {tpl.expectedCategory}
                        </span>
                        {isSuccess ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
                            ✅ Deployed to Meta!
                          </span>
                        ) : syncedMatch?.status === 'APPROVED' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            🟢 Approved on Meta
                          </span>
                        ) : syncedMatch?.status === 'PENDING' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            🟡 In Meta Review
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            Ready to Deploy
                          </span>
                        )}
                      </div>

                      {/* Title & Slug */}
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                          {tpl.title || tpl.name}
                        </h4>
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                          {tpl.name}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {tpl.description}
                      </p>

                      {/* WhatsApp Message Preview Mockup */}
                      <div className="bg-[#f0f9f5] dark:bg-[#0b141a] p-3.5 rounded-xl border border-emerald-500/20 dark:border-emerald-900/40 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-400">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp Preview</span>
                        </div>
                        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                          {tpl.sampleBody
                            .replace('{{1}}', tpl.samplePreview.customer_name || 'Customer')
                            .replace('{{2}}', tpl.samplePreview.order_reference || tpl.samplePreview.amount || 'ORD-1001')
                            .replace('{{3}}', tpl.samplePreview.amount || tpl.samplePreview.item_name || '500.00')
                            .replace('{{4}}', tpl.samplePreview.payment_link || tpl.samplePreview.due_date || 'https://rzp.io/i/sample123')
                            .replace('{{5}}', tpl.samplePreview.currency || 'INR')}
                        </p>
                        <div className="pt-2 border-t border-emerald-500/20 dark:border-emerald-900/40 text-center">
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                            🔗 {tpl.ctaButtonText || 'Pay Now'}
                          </span>
                        </div>
                      </div>

                      {/* Variables Schema */}
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Template Parameters:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {tpl.requiredVariables.map((v, vIdx) => (
                            <span
                              key={v}
                              className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-[10px] font-mono text-emerald-800 dark:text-emerald-300"
                            >
                              {`{{${vIdx + 1}}} ${tpl.variableLabels[v] || v}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Card Bottom Actions */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {/* 1-Click Deploy to Meta Button */}
                      <button
                        type="button"
                        onClick={() => handle1ClickDeploy(tpl)}
                        disabled={isDeploying}
                        className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition"
                      >
                        {isDeploying ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Deploying to Meta...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-100" />
                            <span>🪄 1-Click Deploy to Meta</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyJson(tpl)}
                          className="flex-1 py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1"
                        >
                          {copiedKey === tpl.definitionKey ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-600 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy JSON</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendWithTemplate(tpl.definitionKey)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs transition"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send Bill</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Settings */}
      {activeTab === 'settings' && <PaymentGatewaySettingsPanel />}

      {/* Payment Request Modal */}
      <PaymentRequestModal
        isOpen={isSendModalOpen}
        onClose={() => {
          setIsSendModalOpen(false);
          setSelectedTemplateKey(undefined);
        }}
        initialTemplateKey={selectedTemplateKey}
        onSuccess={() => {
          loadOrders();
        }}
      />

      {/* Custom Payment Template Builder Modal */}
      <PaymentTemplateBuilderModal
        isOpen={isBuilderModalOpen}
        onClose={() => setIsBuilderModalOpen(false)}
        onSuccess={(created) => {
          loadSyncedTemplates(true);
          setSelectedTemplateKey(created.name);
          setIsBuilderModalOpen(false);
        }}
      />

      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        isOpen={isDrawerOpen}
        order={selectedOrder}
        onClose={() => setIsDrawerOpen(false)}
        onOrderUpdated={() => {
          loadOrders();
          setIsDrawerOpen(false);
        }}
      />
    </div>
  );
}
