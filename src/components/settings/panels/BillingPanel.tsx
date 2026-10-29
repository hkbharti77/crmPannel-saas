import { useState, useEffect } from 'react';
import { cx } from '@/lib/types';
import {
  CreditCard,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Zap,
  ShieldCheck,
  Receipt,
  FileText,
  Mail,
  Layers,
  Download,
  Sparkles,
  MessageSquare,
  Bot,
  PhoneCall,
  Coins,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { PanelHeader, SectionCard } from './_shared';
import {
  fetchSubscriptionStatus,
  fetchBillingTransactions,
  fetchAvailablePlans,
  fetchCreditTopUps,
  fetchCreditBalance,
  purchaseCreditTopUp,
  initiateCheckout,
  verifyRazorpayPayment,
  downloadInvoice,
  resendInvoiceEmailApi,
  type SubscriptionData,
  type BillingTransaction,
  type SubscriptionPlanDto,
  type CreditTopUpProductDto,
} from '@/lib/billingApi';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

const PLAN_LEVELS: Record<string, number> = {
  FREE: 0,
  STARTER: 1,
  GROWTH: 2,
  SCALE: 3,
  ENTERPRISE: 4,
};

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as unknown as { Razorpay: unknown }).Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/* ─── Subscription & Billing Panel (Unified Canonical Pricing & Meta Direct Billing) ─── */
export function BillingPanel() {
  const { user } = useAuth();
  const { isOwnerOrAdmin } = usePermissions();
  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlanDto[]>([]);
  const [topUps, setTopUps] = useState<CreditTopUpProductDto[]>([]);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [purchasingTopUpId, setPurchasingTopUpId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [emailSentNotice, setEmailSentNotice] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Detect timezone / country for default currency
  const userTz = typeof window !== 'undefined' ? (Intl.DateTimeFormat().resolvedOptions().timeZone || '') : '';
  const isIndiaDefault = userTz.toLowerCase().includes('kolkata') || userTz.toLowerCase().includes('calcutta') || userTz.toLowerCase().includes('india');
  const [currency, setCurrency] = useState<'INR' | 'USD'>(isIndiaDefault ? 'INR' : 'USD');

  const handleDownloadInvoice = (transactionId: string) => {
    window.open(`/billing/invoice/${transactionId}`, '_blank');
  };

  const handleResendInvoiceEmail = async (transactionId: string) => {
    try {
      setResendingId(transactionId);
      setEmailSentNotice(null);
      const res = await resendInvoiceEmailApi(transactionId);
      if (res.data?.success) {
        setEmailSentNotice('Invoice email successfully dispatched to your email address!');
        setTimeout(() => setEmailSentNotice(null), 5000);
      } else {
        alert(res.error || 'Failed to resend invoice email');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send invoice email';
      alert(msg);
    } finally {
      setResendingId(null);
    }
  };

  useEffect(() => {
    loadBillingData(currency);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency]);

  const loadBillingData = async (curr: 'INR' | 'USD' = currency) => {
    setLoading(true);
    setError(null);

    const [subRes, plansRes, txRes, topUpsRes, creditsRes] = await Promise.all([
      fetchSubscriptionStatus(),
      fetchAvailablePlans(curr),
      fetchBillingTransactions(),
      fetchCreditTopUps(),
      fetchCreditBalance(),
    ]);

    setLoading(false);

    if (subRes.data) {
      setSubData(subRes.data);
      const subCredits = subRes.data.aiCreditBalance ?? subRes.data.usage?.aiCreditBalance;
      if (subCredits !== undefined && subCredits !== null) {
        setCreditBalance(subCredits);
      }
    } else {
      setSubData({
        planId: 'STARTER',
        planName: 'Starter Pack',
        status: 'ACTIVE',
        billingCycle: 'MONTHLY',
        aiCreditBalance: 1000,
        whatsappIntegrationMode: 'COEXISTENCE',
        monthlyFreeRepliesLimit: 1000,
        monthlyRepliesUsed: 142,
        serviceReplyRateInr: 0.115,
        limits: {
          employeeLimit: 5,
          primaryResourceLimit: 10000,
          secondaryResourceLimit: 5000,
          ticketLimit: 500,
          emailLimit: 10000,
          hasWhatsapp: true,
          hasCustomWidget: false,
        },
        usage: {
          employeesCount: 2,
          leadsCount: 1420,
          bookingsCount: 38,
          appointmentsCount: 24,
          ticketsCount: 8,
          emailsCount: 420,
        },
      });
      setCreditBalance(1000);
    }

    if (creditsRes.data?.aiCreditBalance !== undefined && creditsRes.data.aiCreditBalance !== null) {
      setCreditBalance(creditsRes.data.aiCreditBalance);
    }

    if (topUpsRes.data && topUpsRes.data.length > 0) {
      setTopUps(topUpsRes.data);
    } else {
      // Canonical fallback top-up packs matching priceplan.md
      setTopUps([
        {
          id: 'TOPUP_MINI',
          name: 'Mini Pack',
          creditAmount: 1000,
          priceInr: 199,
          priceUsd: 2.99,
          description: '1,000 AI Credits for bots & lead qualification',
          isActive: true,
        },
        {
          id: 'TOPUP_STANDARD',
          name: 'Standard Pack',
          creditAmount: 5000,
          priceInr: 899,
          priceUsd: 11.99,
          description: '5,000 AI Credits for daily active workflows',
          isActive: true,
        },
        {
          id: 'TOPUP_BUSINESS',
          name: 'Business Pack',
          creditAmount: 15000,
          priceInr: 2499,
          priceUsd: 29.99,
          description: '15,000 AI Credits for high-volume outbound campaigns',
          isActive: true,
        },
      ]);
    }

    if (plansRes.data && plansRes.data.length > 0) {
      setPlans(plansRes.data);
    } else {
      // Default canonical plans fallback matching priceplan.md & DB seed
      setPlans([
        {
          id: 'FREE',
          name: 'Free Starter',
          priceMonthly: 0,
          priceYearly: 0,
          priceMonthlyInr: 0,
          priceYearlyInr: 0,
          priceMonthlyUsd: 0,
          priceYearlyUsd: 0,
          employeeLimit: 1,
          primaryResourceLimit: 100,
          secondaryResourceLimit: 15,
          ticketLimit: 10,
          emailLimit: 500,
          hasWhatsapp: false,
          hasCustomWidget: false,
          hasRagLlm: false,
          includedAiCredits: 500,
          hasVoiceBot: false,
          hasCallingAgent: false,
          hasWhatsappCoexistence: false,
        },
        {
          id: 'STARTER',
          name: 'Starter Accelerator',
          priceMonthly: curr === 'INR' ? 1999 : 25.0,
          priceYearly: curr === 'INR' ? 19190 : 240.0,
          priceMonthlyInr: 1999,
          priceYearlyInr: 19190,
          priceMonthlyUsd: 25.0,
          priceYearlyUsd: 240.0,
          employeeLimit: 3,
          primaryResourceLimit: 5000,
          secondaryResourceLimit: 1000,
          ticketLimit: 1000,
          emailLimit: 5000,
          hasWhatsapp: true,
          hasCustomWidget: false,
          hasRagLlm: true,
          includedAiCredits: 2500,
          hasVoiceBot: false,
          hasCallingAgent: false,
          hasWhatsappCoexistence: true,
        },
        {
          id: 'GROWTH',
          name: 'Growth Suite',
          priceMonthly: curr === 'INR' ? 4999 : 62.0,
          priceYearly: curr === 'INR' ? 47990 : 595.0,
          priceMonthlyInr: 4999,
          priceYearlyInr: 47990,
          priceMonthlyUsd: 62.0,
          priceYearlyUsd: 595.0,
          employeeLimit: 8,
          primaryResourceLimit: 20000,
          secondaryResourceLimit: 10000,
          ticketLimit: 10000,
          emailLimit: 25000,
          hasWhatsapp: true,
          hasCustomWidget: true,
          hasRagLlm: true,
          includedAiCredits: 10000,
          hasVoiceBot: true,
          hasCallingAgent: false,
          hasWhatsappCoexistence: true,
        },
        {
          id: 'SCALE',
          name: 'Scale Enterprise',
          priceMonthly: curr === 'INR' ? 9999 : 125.0,
          priceYearly: curr === 'INR' ? 95990 : 1200.0,
          priceMonthlyInr: 9999,
          priceYearlyInr: 95990,
          priceMonthlyUsd: 125.0,
          priceYearlyUsd: 1200.0,
          employeeLimit: 20,
          primaryResourceLimit: 100000,
          secondaryResourceLimit: 50000,
          ticketLimit: 50000,
          emailLimit: 100000,
          hasWhatsapp: true,
          hasCustomWidget: true,
          hasRagLlm: true,
          includedAiCredits: 25000,
          hasVoiceBot: true,
          hasCallingAgent: true,
          hasWhatsappCoexistence: true,
        },
        {
          id: 'ENTERPRISE',
          name: 'Enterprise Bespoke',
          priceMonthly: curr === 'INR' ? 24999 : 315.0,
          priceYearly: curr === 'INR' ? 239990 : 3000.0,
          priceMonthlyInr: 24999,
          priceYearlyInr: 239990,
          priceMonthlyUsd: 315.0,
          priceYearlyUsd: 3000.0,
          employeeLimit: 50,
          primaryResourceLimit: 1000000,
          secondaryResourceLimit: 1000000,
          ticketLimit: 1000000,
          emailLimit: 1000000,
          hasWhatsapp: true,
          hasCustomWidget: true,
          hasRagLlm: true,
          includedAiCredits: 100000,
          hasVoiceBot: true,
          hasCallingAgent: true,
          hasWhatsappCoexistence: true,
          isContactUs: true,
        },
      ]);
    }

    if (txRes.data) {
      setTransactions(txRes.data);
    }
  };

  const handlePurchaseTopUp = async (productId: string) => {
    if (!isOwnerOrAdmin) {
      setError('Only workspace Tenant Owner or Admin can purchase AI credit top-ups.');
      return;
    }

    setPurchasingTopUpId(productId);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await purchaseCreditTopUp(productId);
      if (res.data?.success) {
        setCreditBalance(res.data.newBalance);
        setSuccessMsg(`🎉 Successfully credited ${res.data.creditsGranted.toLocaleString()} AI Credits (${res.data.product}) to your workspace!`);
        setTimeout(() => setSuccessMsg(null), 6000);
      } else {
        setError(res.error || 'Failed to complete top-up purchase.');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Top-up purchase failed.';
      setError(msg);
    } finally {
      setPurchasingTopUpId(null);
    }
  };

  const handleUpgrade = async (targetPlanId: string) => {
    if (!isOwnerOrAdmin) {
      setError('Only workspace Tenant Owner or Admin can purchase or upgrade subscription plans.');
      return;
    }

    setUpgrading(true);
    setError(null);
    setSuccessMsg(null);

    const gateway = currency === 'INR' ? 'RAZORPAY' : 'STRIPE';
    const targetPlan = plans.find((p) => p.id.toUpperCase() === targetPlanId.toUpperCase());
    const planDisplayName = targetPlan?.name || targetPlanId;

    const res = await initiateCheckout(targetPlanId, billingCycle, gateway, currency);

    if (res.error) {
      setUpgrading(false);
      setError(`Checkout initialization failed: ${res.error}`);
      return;
    }

    // Direct zero-cost / Free plan activation bypass
    if (res.data?.freeActivated) {
      setUpgrading(false);
      setSuccessMsg(`🎉 Successfully activated ${planDisplayName}!`);
      loadBillingData(currency);
      return;
    }

    // 1. Stripe redirect flow
    if (res.data?.checkoutUrl) {
      setUpgrading(false);
      window.location.href = res.data.checkoutUrl;
      return;
    }

    // 2. Razorpay interactive modal flow
    if (res.data?.orderId) {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setUpgrading(false);
        setError('Failed to load Razorpay payment gateway SDK. Please check your internet connection and try again.');
        return;
      }

      const options = {
        key: res.data.keyId || '',
        amount: res.data.amount,
        currency: res.data.currency || 'INR',
        name: 'GyanVani AI Connect',
        description: `${planDisplayName} Subscription (${billingCycle})`,
        order_id: res.data.orderId,
        prefill: {
          name: user?.user_metadata?.name || user?.businessName || '',
          email: user?.email || '',
        },
        theme: {
          color: '#0d9488',
        },
        modal: {
          ondismiss: () => {
            setUpgrading(false);
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          setUpgrading(true);
          const verifyRes = await verifyRazorpayPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            planId: targetPlanId,
            billingCycle: billingCycle,
          });
          setUpgrading(false);

          if (verifyRes.error) {
            setError(`Payment verification failed: ${verifyRes.error}`);
          } else {
            const newBal = verifyRes.data?.newBalance ?? verifyRes.data?.aiCreditBalance;
            if (newBal !== undefined && newBal !== null) {
              setCreditBalance(newBal);
            }
            setSuccessMsg(`🎉 Successfully upgraded to ${planDisplayName}! Your invoice receipt email has been dispatched.`);
            await loadBillingData(currency);
          }
        },
      };

      try {
        const RazorpayClass = (
          window as unknown as {
            Razorpay: new (opts: unknown) => {
              on: (evt: string, cb: (res: { error?: { description?: string } }) => void) => void;
              open: () => void;
            };
          }
        ).Razorpay;
        const rzp = new RazorpayClass(options);
        rzp.on('payment.failed', (response: { error?: { description?: string } }) => {
          setUpgrading(false);
          setError(`Payment failed: ${response.error?.description || 'Transaction was declined'}`);
        });
        rzp.open();
      } catch (err: unknown) {
        setUpgrading(false);
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to launch Razorpay checkout: ${errMsg}`);
      }
      return;
    }

    setUpgrading(false);
    setSuccessMsg(`Subscription upgrade request submitted for ${planDisplayName}!`);
    loadBillingData(currency);
  };

  if (loading) {
    return (
      <SectionCard>
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="mt-3 text-xs text-muted-c">Fetching real-time pricing plans, quotas & AI ledger…</p>
        </div>
      </SectionCard>
    );
  }

  const currentPlanId = subData?.planId || 'FREE';
  const isActiveStatus = subData?.status === 'ACTIVE' || subData?.status === 'FREE_TRIAL';
  const currentPlanLevel = isActiveStatus ? (PLAN_LEVELS[currentPlanId.toUpperCase()] ?? 0) : -1;
  const limits = subData?.limits;
  const usage = subData?.usage;
  const isCoexistenceMode = subData?.whatsappIntegrationMode === 'COEXISTENCE' || !subData?.whatsappIntegrationMode;
  const repliesUsed = subData?.monthlyRepliesUsed ?? 0;
  const repliesLimit = subData?.monthlyFreeRepliesLimit ?? 1000;
  const repliesPercent = Math.min(100, Math.round((repliesUsed / repliesLimit) * 100));

  return (
    <div className="space-y-6">
      {/* Current Plan & Wallet Overview Header Card */}
      <SectionCard>
        <PanelHeader
          title="Subscription & Billing Hub"
          desc="Canonical plans, Meta WhatsApp direct billing, AI credit ledger, and tax invoices"
          icon={<CreditCard className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
        />

        {!isOwnerOrAdmin && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400 mb-4 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
            <span>Notice: Only workspace Tenant Owner or Admin can purchase top-ups or change subscription plans.</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-danger-500/20 bg-danger-500/10 p-3 text-xs text-danger-600 dark:text-danger-400 mb-4">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 mb-4">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Top 4 Stat Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2">
          {/* Current Plan Badge Card */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
              {currentPlanId}
            </span>
            <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mt-1">
              CURRENT PLAN
            </p>
          </div>

          {/* AI Credit Wallet Card */}
          <div className="rounded-xl border border-primary-500/30 bg-primary-500/10 p-4 text-center relative overflow-hidden flex flex-col justify-center">
            <span className="text-xl font-black text-primary-600 dark:text-primary-400 flex items-center justify-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              {creditBalance.toLocaleString()}
            </span>
            <p className="text-[11px] font-bold text-primary-700 dark:text-primary-300 uppercase tracking-wider mt-1">
              AI CREDITS BALANCE
            </p>
            {Boolean(limits?.includedAiCredits && limits.includedAiCredits > 0) && (
              <span className="text-[10px] text-primary-600/80 dark:text-primary-400/80 font-medium block mt-0.5">
                ({limits!.includedAiCredits!.toLocaleString()} included with {currentPlanId})
              </span>
            )}
          </div>

          {/* Active Agents Card */}
          <div className="rounded-xl border border-base-c bg-slate-50/70 dark:bg-ink-850/60 p-4 text-center">
            <span className="text-xl font-extrabold text-primary-c">
              {usage?.employeesCount ?? 0} / {limits?.employeeLimit ?? 5}
            </span>
            <p className="text-[11px] font-bold text-muted-c uppercase tracking-wider mt-1">
              STAFF SEATS
            </p>
          </div>

          {/* Monthly Leads Card */}
          <div className="rounded-xl border border-base-c bg-slate-50/70 dark:bg-ink-850/60 p-4 text-center">
            <span className="text-xl font-extrabold text-primary-c">
              {(usage?.leadsCount ?? 0).toLocaleString()} / {(limits?.primaryResourceLimit ?? 10000).toLocaleString()}
            </span>
            <p className="text-[11px] font-bold text-muted-c uppercase tracking-wider mt-1">
              MONTHLY LEADS
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Meta WhatsApp Direct Billing & Integration Mode Card */}
      <SectionCard>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-base-c pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-primary-c">WhatsApp Business API Billing Mode</h3>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                  {isCoexistenceMode ? 'Mode A: Coexistence Direct WABA' : 'Mode B: Legacy Cloud API'}
                </span>
              </div>
              <p className="text-xs text-muted-c">Official Meta rate card compliance (No hidden conversation surcharges)</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              ₹0.1150 / service reply
            </span>
            <p className="text-[10px] text-muted-c">Meta direct rate in India</p>
          </div>
        </div>

        <div className="pt-4 space-y-4">
          {/* Progress bar for free replies */}
          <div className="rounded-xl border border-base-c bg-slate-50/60 dark:bg-ink-850/40 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-primary-c flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Monthly Free Service Replies (Meta Direct Tier)
              </span>
              <span className="text-secondary-c font-mono">
                {repliesUsed.toLocaleString()} / {repliesLimit.toLocaleString()} ({repliesPercent}%)
              </span>
            </div>

            <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-ink-700 overflow-hidden">
              <div
                className={cx(
                  'h-full rounded-full transition-all duration-500',
                  repliesPercent > 90 ? 'bg-danger-500' : repliesPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                )}
                style={{ width: `${repliesPercent}%` }}
              />
            </div>

            <p className="text-[11px] text-muted-c leading-relaxed pt-1">
              Meta grants <strong>1,000 monthly free service replies</strong> per connected business phone number. Replies exceeding 1,000 within the billing cycle are charged at Meta's official direct rate of <strong>₹0.1150 / reply</strong>. Gyan VaniAi adds <strong>0% markup</strong> on service replies.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* AI Credit Wallet & Instant Top-Up Packs Card */}
      <SectionCard>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-base-c pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary-c">AI Credits & Top-Up Packs</h3>
              <p className="text-xs text-muted-c">Used for AI RAG LLM replies, document indexing, voice qualification, and automated workflows.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-primary-500/10 border border-primary-500/30 px-3 py-1 text-xs font-bold text-primary-600 dark:text-primary-400">
              Balance: {creditBalance.toLocaleString()} Credits
            </span>
          </div>
        </div>

        {/* Top-Up Packs Grid */}
        <div className="grid gap-4 pt-4 sm:grid-cols-3">
          {topUps.map((pack) => {
            const packCredits = pack.credits ?? pack.creditAmount ?? 0;
            const isPurchasing = purchasingTopUpId === pack.id;
            const isStandard = pack.id.toUpperCase().includes('STANDARD') || packCredits === 5000;
            const packPrice = currency === 'INR' ? `₹${(pack.priceInr ?? 0).toLocaleString('en-IN')}` : `$${pack.priceUsd ?? 0}`;
            const packDesc = pack.description || `${packCredits.toLocaleString()} AI Credits for bot interactions and workflows`;

            return (
              <div
                key={pack.id}
                className={cx(
                  'rounded-xl border p-4 space-y-3 relative flex flex-col justify-between transition-all bg-card-c',
                  isStandard ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-sm' : 'border-base-c'
                )}
              >
                {isStandard && (
                  <div className="absolute -top-2.5 right-4 rounded-full bg-gradient-accent px-2.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider shadow-sm">
                    MOST POPULAR
                  </div>
                )}

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-c">
                    {pack.name}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-2xl font-black text-primary-c">{packPrice}</h4>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      +{packCredits.toLocaleString()} Credits
                    </span>
                  </div>
                  <p className="text-xs text-secondary-c leading-relaxed">{packDesc}</p>
                </div>

                <button
                  onClick={() => handlePurchaseTopUp(pack.id)}
                  disabled={isPurchasing || !isOwnerOrAdmin}
                  className={cx(
                    'w-full rounded-xl py-2 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm',
                    isStandard
                      ? 'bg-gradient-accent text-white hover:opacity-95'
                      : 'border border-primary-500/30 bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-500/20'
                  )}
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Adding Credits…
                    </>
                  ) : (
                    <>
                      <Coins className="h-3.5 w-3.5" />
                      Buy {pack.name}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Voice AI Add-ons Section */}
      <SectionCard>
        <div className="border-b border-base-c pb-3">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-primary-c">Voice AI Add-ons</h3>
          </div>
          <p className="text-xs text-muted-c">Expand your CRM into real-time voice bots and autonomous outbound calling agents.</p>
        </div>

        <div className="grid gap-4 pt-4 sm:grid-cols-2">
          {/* Voice Bot Add-on */}
          <div className="rounded-xl border border-base-c bg-card-c p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-primary-c">Voice Bot Add-on</h4>
                  <p className="text-[11px] text-muted-c">Automated Interactive Voice Response (IVR) & speech qualification</p>
                </div>
              </div>
              <span className="text-xs font-black text-primary-c">₹499/mo</span>
            </div>
            <p className="text-xs text-secondary-c leading-relaxed">
              Handles incoming customer inquiries with natural voice synthesis, answers FAQ from your CRM documents, and logs call recordings.
            </p>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Included in Growth, Scale, & Enterprise plans
            </div>
          </div>

          {/* Calling Agent Add-on */}
          <div className="rounded-xl border border-base-c bg-card-c p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  <PhoneCall className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-primary-c">Calling Agent Add-on</h4>
                  <p className="text-[11px] text-muted-c">Autonomous outbound sales callers & appointment booking</p>
                </div>
              </div>
              <span className="text-xs font-black text-primary-c">₹999/mo</span>
            </div>
            <p className="text-xs text-secondary-c leading-relaxed">
              Proactively dials leads from your pipeline, books appointments directly into staff calendars, and updates ticket status in real-time.
            </p>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Included in Scale & Enterprise plans
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Dynamic Backend Pricing Plans Section Card */}
      <SectionCard>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-c pb-3">
          <div>
            <h3 className="text-sm font-bold text-primary-c">Canonical Subscription Plans</h3>
            <p className="text-xs text-muted-c">Direct database-driven tiers with included AI credits & WhatsApp capabilities.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Currency Selector (INR vs USD) */}
            <div className="flex items-center rounded-xl border border-base-c bg-slate-100 dark:bg-ink-850 p-1 text-xs">
              <button
                onClick={() => setCurrency('INR')}
                className={cx('rounded-lg px-2.5 py-1 font-bold transition-all', currency === 'INR' ? 'bg-card-c text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-muted-c')}
              >
                ₹ INR
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={cx('rounded-lg px-2.5 py-1 font-bold transition-all', currency === 'USD' ? 'bg-card-c text-primary-600 dark:text-primary-400 shadow-sm' : 'text-muted-c')}
              >
                $ USD
              </button>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="flex items-center rounded-xl border border-base-c bg-slate-100 dark:bg-ink-850 p-1 text-xs">
              <button
                onClick={() => setBillingCycle('MONTHLY')}
                className={cx('rounded-lg px-3 py-1 font-bold transition-all', billingCycle === 'MONTHLY' ? 'bg-card-c text-primary-c shadow-sm' : 'text-muted-c')}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('YEARLY')}
                className={cx('rounded-lg px-3 py-1 font-bold transition-all', billingCycle === 'YEARLY' ? 'bg-card-c text-primary-c shadow-sm' : 'text-muted-c')}
              >
                Yearly (Save 20%)
              </button>
            </div>
          </div>
        </div>

        {/* Canonical Dynamic Pricing Cards */}
        <div className="grid gap-4 pt-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const planLevel = PLAN_LEVELS[plan.id.toUpperCase()] ?? 0;
            const isCurrent = isActiveStatus && currentPlanId.toUpperCase() === plan.id.toUpperCase();
            const isLowerTier = isActiveStatus && planLevel < currentPlanLevel;
            const isProGrandfathered = plan.id.toUpperCase() === 'PRO';

            // Resolve price based on selected currency
            let rawPrice = 0;
            if (currency === 'INR') {
              rawPrice = billingCycle === 'YEARLY' ? (plan.priceYearlyInr || plan.priceYearly) : (plan.priceMonthlyInr || plan.priceMonthly);
            } else {
              rawPrice = billingCycle === 'YEARLY' ? (plan.priceYearlyUsd || plan.priceYearly) : (plan.priceMonthlyUsd || plan.priceMonthly);
            }

            const currSymbol = currency === 'INR' ? '₹' : '$';
            const formattedPrice = currency === 'INR' ? rawPrice.toLocaleString('en-IN') : rawPrice.toFixed(rawPrice % 1 === 0 ? 0 : 2);
            const isPopular = plan.id.toUpperCase() === 'GROWTH' || plan.id.toUpperCase() === 'STARTER';

            return (
              <div
                key={plan.id}
                className={cx(
                  'rounded-xl2 border p-5 space-y-4 relative flex flex-col justify-between transition-all',
                  isCurrent
                    ? 'border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/30'
                    : isLowerTier
                    ? 'border-base-c bg-slate-50/50 dark:bg-ink-850/30 opacity-75'
                    : isPopular
                    ? 'border-primary-500/50 bg-card-c shadow-md'
                    : 'border-base-c bg-card-c'
                )}
              >
                {isPopular && !isLowerTier && !isCurrent && (
                  <div className="absolute -top-3 right-4 rounded-full bg-gradient-accent px-3 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
                    RECOMMENDED
                  </div>
                )}

                {isLowerTier && (
                  <div className="absolute -top-3 right-4 rounded-full bg-slate-200 dark:bg-ink-700 px-3 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider shadow-sm">
                    INCLUDED IN ACTIVE TIER
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={cx(
                        'text-xs font-bold uppercase tracking-wider',
                        plan.id === 'FREE'
                          ? 'text-muted-c'
                          : plan.id === 'STARTER'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : plan.id === 'GROWTH'
                          ? 'text-primary-500'
                          : plan.id === 'SCALE'
                          ? 'text-indigo-500'
                          : 'text-amber-500'
                      )}
                    >
                      {plan.id}
                    </span>
                  </div>

                  <h4 className="text-2xl font-black text-primary-c">
                    {currSymbol}{formattedPrice}{' '}
                    <span className="text-xs font-normal text-muted-c">
                      /{billingCycle === 'YEARLY' ? 'yr' : 'mo'}
                    </span>
                  </h4>
                  <p className="text-xs text-secondary-c font-medium">{plan.name}</p>

                  {/* Backend Feature Limits List */}
                  <ul className="space-y-2 text-xs text-secondary-c pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Up to <strong>{plan.employeeLimit ?? 1}</strong> Staff Members</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span><strong>{(plan.primaryResourceLimit ?? 0).toLocaleString()}</strong> Primary Leads</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Coins className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span><strong>{(plan.includedAiCredits || 0).toLocaleString()}</strong> AI Credits Included</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span><strong>{(plan.emailLimit ?? 0).toLocaleString()}</strong> Monthly Emails</span>
                    </li>
                    {plan.hasWhatsapp && (
                      <li className="flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>WhatsApp Coexistence API</span>
                      </li>
                    )}
                    {plan.hasVoiceBot && (
                      <li className="flex items-center gap-2">
                        <Bot className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span>Voice Bot IVR Included</span>
                      </li>
                    )}
                    {plan.hasCallingAgent && (
                      <li className="flex items-center gap-2">
                        <PhoneCall className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span>Outbound Calling Agent Included</span>
                      </li>
                    )}
                  </ul>
                </div>

                {!isOwnerOrAdmin ? (
                  <button
                    disabled
                    className="w-full rounded-xl border border-slate-300 dark:border-ink-700 bg-slate-100 dark:bg-ink-800 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  >
                    Owner / Admin Only
                  </button>
                ) : isCurrent ? (
                  <button
                    disabled
                    className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                  >
                    Active Plan ✓
                  </button>
                ) : isLowerTier ? (
                  <button
                    disabled
                    className="w-full rounded-xl border border-slate-200 dark:border-ink-700 bg-slate-100/80 dark:bg-ink-850/80 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  >
                    Included in Current Tier
                  </button>
                ) : plan.isContactUs || plan.id.toUpperCase() === 'ENTERPRISE' ? (
                  <a
                    href="mailto:sales@gyanvaniaiconnect.com?subject=Enterprise%20Subscription%20Custom%20Quote"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full text-center rounded-xl border border-amber-500/40 bg-amber-500/10 py-2.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all block"
                  >
                    Contact Us for Custom Quote
                  </a>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={upgrading}
                    className="w-full rounded-xl bg-gradient-accent py-2.5 text-xs font-bold text-white shadow-sm transition-transform hover:scale-105"
                  >
                    {upgrading ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Processing…
                      </span>
                    ) : plan.id.toUpperCase() === 'FREE' ? (
                      'Activate Free Plan'
                    ) : (
                      `Upgrade to ${plan.name || plan.id}`
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Payment History & Invoices Card */}
      <SectionCard>
        <PanelHeader
          title="Payment History & Tax Invoices"
          desc="View past transactions, download official GST invoices, or dispatch email receipts"
          icon={<Receipt className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
        />

        {emailSentNotice && (
          <div className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{emailSentNotice}</span>
          </div>
        )}

        <div className="pt-2 overflow-x-auto">
          {transactions.length > 0 ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-base-c text-muted-c font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Gateway</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-c">
                {transactions.map((tx) => {
                  const gatewayName = tx.paymentGateway || tx.gateway || 'RAZORPAY';
                  const isSuccess = tx.status === 'SUCCESS';
                  const isPending = tx.status === 'PENDING';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-ink-850">
                      <td className="py-3 px-3 font-mono text-[11px] text-primary-c">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 font-bold text-primary-c">
                        {tx.currency} {tx.amount}
                      </td>
                      <td className="py-3 px-3 uppercase text-[10px] font-bold text-secondary-c">
                        {gatewayName}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={cx(
                            'rounded-full px-2 py-0.5 text-[10px] font-bold border',
                            isSuccess
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                              : isPending
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                              : 'bg-danger-500/15 border-danger-500/30 text-danger-600 dark:text-danger-400'
                          )}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          onClick={() => handleDownloadInvoice(tx.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold hover:bg-primary-500/20 transition-all text-xs border border-primary-500/20"
                          title="View Official Invoice Receipt"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Invoice
                        </button>

                        <button
                          onClick={() => handleResendInvoiceEmail(tx.id)}
                          disabled={resendingId === tx.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-ink-800 text-secondary-c font-medium hover:bg-slate-200 dark:hover:bg-ink-700 transition-all text-xs border border-base-c"
                          title="Send Email Receipt"
                        >
                          {resendingId === tx.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Mail className="h-3.5 w-3.5" />
                              Email
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="rounded-xl border border-base-c bg-slate-50/50 dark:bg-ink-850/40 p-6 text-center text-xs text-muted-c">
              No previous billing transaction receipts found. Your current plan details are active.
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
