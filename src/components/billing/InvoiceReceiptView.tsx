import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Printer,
  Download,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  CreditCard,
  Sparkles,
  Calendar,
  Mail,
  ShieldCheck,
  Hash,
} from 'lucide-react';
import { fetchInvoiceData, downloadInvoiceHtml, type InvoiceData } from '@/lib/billingApi';

export function InvoiceReceiptView() {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingHtml, setDownloadingHtml] = useState(false);

  useEffect(() => {
    if (!transactionId) {
      setError('Transaction ID is missing.');
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchInvoiceData(transactionId)
      .then((res) => {
        if (!isMounted) return;
        if (res.data) {
          setData(res.data);
        } else {
          setError(res.error || 'Invoice receipt not found.');
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Failed to fetch invoice details.';
        setError(msg);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [transactionId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = async () => {
    if (!transactionId) return;
    try {
      setDownloadingHtml(true);
      await downloadInvoiceHtml(transactionId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to download HTML invoice';
      alert(msg);
    } finally {
      setDownloadingHtml(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/settings/billing');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-ink-950 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 p-8 bg-white dark:bg-ink-900 rounded-2xl shadow-sm border border-slate-200 dark:border-ink-800">
          <Loader2 className="h-9 w-9 text-indigo-600 dark:text-indigo-400 animate-spin" />
          <div className="text-center">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Loading Official Invoice</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Retrieving official billing ledger record...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-ink-950 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-ink-900 rounded-2xl shadow-sm border border-rose-200 dark:border-rose-900/40 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Invoice Not Accessible</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            {error || 'Unable to locate transaction record. Please ensure you are logged in with the workspace account.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-ink-800 dark:hover:bg-ink-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to CRM
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-ink-950 font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-500/20 selection:text-indigo-600 print:bg-white print:text-black">
      {/* Embedded Print CSS */}
      <style>{`
        @media print {
          nav, header, .no-print, .action-bar {
            display: none !important;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .invoice-sheet {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
          }
          .badge-print {
            border: 1px solid #10b981 !important;
            color: #047857 !important;
            background: transparent !important;
          }
        }
      `}</style>

      {/* Top Action Bar (hidden when printing) */}
      <header className="action-bar sticky top-0 z-40 bg-slate-900 text-white shadow-md px-4 sm:px-8 py-3.5 border-b border-slate-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors"
              title="Return to Billing Settings"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Receipt:</span>
              <span className="font-mono font-bold text-indigo-300">{data.invoiceNo}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDownloadHtml}
              disabled={downloadingHtml}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
              title="Download standalone HTML file"
            >
              {downloadingHtml ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 text-slate-300" />
              )}
              <span className="hidden sm:inline">Download HTML</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm hover:shadow transition-all"
              title="Print document or Save as PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Invoice Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="invoice-sheet bg-white dark:bg-ink-900 border border-slate-200 dark:border-ink-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-12 transition-all">
          
          {/* Header Row: Brand & Invoice Meta */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-8 border-b-2 border-slate-100 dark:border-ink-800 gap-6">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
                  GV
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    GyanVani AI Connect
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Official Tax & Subscription Billing Receipt
                  </p>
                </div>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Official Receipt
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                {data.invoiceNo}
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 badge-print">
                <CheckCircle2 className="h-3 w-3" />
                <span>PAYMENT {data.status}</span>
              </div>
            </div>
          </div>

          {/* Grid 2: Billed To & Payment Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            {/* Billed To Box */}
            <div className="bg-slate-50 dark:bg-ink-850 border border-slate-200/80 dark:border-ink-800 rounded-xl p-5">
              <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                <span>Billed To</span>
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {data.billedTo?.businessName || 'Workspace Account'}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1.5 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>{data.billedTo?.email}</span>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-2 pt-2 border-t border-slate-200/60 dark:border-ink-800 flex items-center gap-1.5">
                <Hash className="h-3 w-3 text-slate-400" />
                <span>Tenant ID: {data.billedTo?.tenantId}</span>
              </div>
            </div>

            {/* Payment Details Box */}
            <div className="bg-slate-50 dark:bg-ink-850 border border-slate-200/80 dark:border-ink-800 rounded-xl p-5">
              <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
                <span>Payment Details</span>
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Gateway:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  {data.paymentGateway}
                </span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-2 flex items-center justify-between">
                <span>Date & Time:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{data.createdDateFormatted}</span>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-2 pt-2 border-t border-slate-200/60 dark:border-ink-800 flex items-center justify-between">
                <span>Gateway Ref ID:</span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[200px]">
                  {data.gatewayTransactionId}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto my-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-ink-800 bg-slate-50/80 dark:bg-ink-850/80 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Item & Description</th>
                  <th className="py-3 px-4">Cycle</th>
                  <th className="py-3 px-4">Active Period</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-ink-800 text-xs">
                <tr>
                  <td className="py-4 px-4 align-top">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {data.plan?.planName || 'CRM Plan'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                      Full CRM Enterprise Access, Multi-User Quotas, WhatsApp Direct Cloud API, and Automated Voice Workflows.
                    </div>
                  </td>
                  <td className="py-4 px-4 align-top font-semibold text-slate-700 dark:text-slate-300 uppercase">
                    {data.plan?.billingCycle || 'MONTHLY'}
                  </td>
                  <td className="py-4 px-4 align-top text-slate-600 dark:text-slate-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span>{data.plan?.periodText || 'Active Period'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 align-top text-right font-bold text-sm text-slate-900 dark:text-white">
                    {data.formattedAmount}
                  </td>
                </tr>

                {/* Total Row */}
                <tr className="bg-slate-50 dark:bg-ink-850 font-bold border-t-2 border-slate-300 dark:border-ink-700">
                  <td colSpan={3} className="py-4 px-4 text-sm text-slate-900 dark:text-white">
                    Total Paid Amount
                  </td>
                  <td className="py-4 px-4 text-right text-base text-indigo-600 dark:text-indigo-400 font-black">
                    {data.formattedAmount}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Included Features & Quotas Box */}
          <div className="my-8 rounded-xl bg-violet-50/70 dark:bg-violet-950/20 border border-violet-200/80 dark:border-violet-900/40 p-5 sm:p-6">
            <div className="text-xs uppercase tracking-wider font-extrabold text-violet-700 dark:text-violet-400 mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <span>Included Subscription Quotas & Feature Entitlements</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-violet-900 dark:text-violet-200 font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-400 flex-shrink-0" />
                <span>Staff Member Accounts: <strong>{data.plan?.staffLimit ?? 10} Seats</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-400 flex-shrink-0" />
                <span>Primary CRM Leads: <strong>{data.plan?.leadLimit ?? 25000} Records</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-400 flex-shrink-0" />
                <span>Email Marketing: <strong>{data.plan?.emailLimit ?? 15000} Emails/mo</strong></span>
              </div>
              {data.plan?.hasWhatsapp && (
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-400 flex-shrink-0" />
                  <span>Meta WhatsApp Cloud API: <strong>Active Broadcasts</strong></span>
                </div>
              )}
              {data.plan?.hasAi && (
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-400 flex-shrink-0" />
                  <span>AI RAG Knowledge Base: <strong>Vector Search Enabled</strong></span>
                </div>
              )}
              {data.plan?.hasMultiCurrency && (
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-400 flex-shrink-0" />
                  <span>Multi-Currency Billing: <strong>INR & USD Supported</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Notice */}
          <footer className="pt-6 border-t border-slate-200 dark:border-ink-800 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
            <p>
              Thank you for subscribing to <strong>GyanVani AI Connect</strong>. For billing assistance, contact{' '}
              <a
                href="mailto:support@gyanvaniai.online"
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                support@gyanvaniai.online
              </a>
              .
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              This is a secure, computer-generated tax invoice and payment confirmation. No signature required.
            </p>
          </footer>

        </div>
      </main>
    </div>
  );
}

