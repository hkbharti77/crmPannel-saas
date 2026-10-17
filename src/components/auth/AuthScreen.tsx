import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getStoredUser, categoryApi, onboardingApi, metaGatewayApi } from '@/lib/api';
import { cx } from '@/lib/types';
import { GoogleSignInButton } from './GoogleSignInButton';
import {
  Mail, KeyRound, User, ArrowRight, Sun, Moon,
  Building2, MessageSquare, TrendingUp, Calendar, Shield, RefreshCw, Edit2,
  Phone, Tag, CheckCircle2, Check, Sparkles,
  AlertCircle, UserPlus, LogIn, Star, Zap, Bot, ArrowUpRight
} from 'lucide-react';

type Mode = 'login' | 'signup';

const FALLBACK_CATEGORIES: Record<string, string[]> = {
  'Real Estate': [
    'Residential Agent / Broker',
    'Commercial Property Broker',
    'Real Estate Developer / Builder',
    'Property Consultant',
    'Rental / Leasing Specialist',
  ],
  'Financial Services': [
    'Home Loan Advisor',
    'Insurance Broker',
    'Wealth Manager / Investment Planner',
  ],
  'Home & Living': [
    'Interior Designer',
    'Architect / Space Planner',
    'Home Renovation Contractor',
  ],
  'Professional Services': [
    'Legal Consultant / Property Lawyer',
    'Chartered Accountant (Tax & Real Estate)',
    'Digital Marketing Agency',
  ],
  'Other / General': ['General Business Owner', 'Independent Consultant'],
};

export function AuthScreen({ initialMode = 'login' }: { initialMode?: Mode }) {
  const navigate = useNavigate();
  const { user, requestOtp, verifyOtp, setOnboardingCompleted } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1 = Input Info, 2 = Verify OTP, 3 = Business & WhatsApp Setup

  // Step 1 Inputs
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2 Inputs
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState<number>(0);

  // Step 3 Inputs (Business Niche & WhatsApp Integration)
  const [categories, setCategories] = useState<Record<string, string[]>>(FALLBACK_CATEGORIES);
  const [category, setCategory] = useState('Real Estate');
  const [subCategory, setSubCategory] = useState('Residential Agent / Broker');
  const [whatsappMode, setWhatsappMode] = useState<'embedded' | 'manual'>('embedded');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [verifyToken, _setVerifyToken] = useState('crm_' + Math.random().toString(36).substring(2, 10));
  const [wabaId, _setWabaId] = useState('');
  const [metaConnected, setMetaConnected] = useState(false);
  const [metaPhoneDisplay, setMetaPhoneDisplay] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(true);
  const [isMetaConnecting, setIsMetaConnecting] = useState(false);

  // General state
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<'ACCOUNT_NOT_FOUND' | 'ACCOUNT_ALREADY_EXISTS' | string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionExpiredBanner, setSessionExpiredBanner] = useState(false);

  // Load categories
  useEffect(() => {
    categoryApi
      .getAll()
      .then((res) => {
        if (res.data && Object.keys(res.data).length > 0) {
          setCategories(res.data);
          const firstCat = Object.keys(res.data)[0];
          setCategory(firstCat);
          if (res.data[firstCat]?.length > 0) {
            setSubCategory(res.data[firstCat][0]);
          }
        }
      })
      .catch(() => {
        setCategories(FALLBACK_CATEGORIES);
      });
  }, []);

  // Listen for Meta Gateway Popup window message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'META_WHATSAPP_CONNECTED' && event.data?.success) {
        const payload = event.data.data;
        setMetaConnected(true);
        setPhoneNumberId(payload?.phoneNumberId || 'CONNECTED_VIA_META');
        setAccessToken('CONNECTED_VIA_META_GATEWAY');
        setMetaPhoneDisplay(
          payload?.displayPhoneNumber || payload?.phoneNumberId
            ? `Phone: ${payload.displayPhoneNumber || payload.phoneNumberId}`
            : 'Connected via Meta Gateway'
        );
        setIsMetaConnecting(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Check expired session param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reason') === 'expired') {
      setSessionExpiredBanner(true);
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  // Resend Timer logic
  useEffect(() => {
    const storedTime = localStorage.getItem('otpResendAvailableAt');
    if (storedTime) {
      const remaining = Math.floor((parseInt(storedTime, 10) - Date.now()) / 1000);
      if (remaining > 0) {
        setResendTimer(remaining);
      } else {
        localStorage.removeItem('otpResendAvailableAt');
      }
    }
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            localStorage.removeItem('otpResendAvailableAt');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const startResendTimer = () => {
    const expiresAt = Date.now() + 60 * 1000;
    localStorage.setItem('otpResendAvailableAt', expiresAt.toString());
    setResendTimer(60);
  };

  // If already authenticated and fully onboarded, redirect to Dashboard
  useEffect(() => {
    if (user && step !== 3) {
      const isSuper = user.isSuperAdmin || user.role === 'SUPER_ADMIN';
      if (isSuper) {
        navigate('/admin', { replace: true });
      } else if (user.onboardingCompleted === false) {
        setStep(3); // In-place transition to Step 3 inside the SAME auth card!
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, step, navigate]);

  // Handle Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorCode(null);
    setInfoMessage(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (mode === 'signup') {
      if (name.trim().length < 2) {
        setError('Please enter your full name');
        return;
      }
      if (phone.trim() && !/^[6-9]\d{9}$/.test(phone.trim())) {
        setError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)');
        return;
      }
    }

    setLoading(true);
    const { error, message, code } = await requestOtp(email, mode);
    setLoading(false);

    if (error) {
      setError(error);
      setErrorCode(code || null);
    } else {
      setStep(2);
      setErrorCode(null);
      setInfoMessage(message || 'A 6-digit verification code has been sent to your email.');
      startResendTimer();
    }
  };

  // Handle Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorCode(null);

    if (!otp || !/^\d{6}$/.test(otp.trim())) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }

    setLoading(true);
    setInfoMessage('Verifying code & authenticating...');
    const { error, code } = await verifyOtp(
      email,
      otp,
      mode === 'signup' ? name : undefined,
      mode === 'signup' ? businessName : undefined,
      mode
    );

    if (error) {
      setLoading(false);
      setInfoMessage(null);
      setError(error);
      setErrorCode(code || null);
    } else {
      setLoading(false);
      const storedUser = getStoredUser<any>();
      const isSuper = storedUser?.isSuperAdmin || storedUser?.role === 'SUPER_ADMIN';

      if (isSuper) {
        navigate('/admin', { replace: true });
      } else if (storedUser?.onboardingCompleted === false) {
        setStep(3);
        setInfoMessage('Account verified! Let’s complete your business & WhatsApp setup.');
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  };

  // Launch Meta WhatsApp Gateway Launcher Popup
  const handleLaunchGatewayPopup = () => {
    setError(null);
    setIsMetaConnecting(true);
    const launchUrl = metaGatewayApi.getLaunchUrl();
    const width = 520;
    const height = 680;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      launchUrl,
      'MetaWhatsAppGateway',
      `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=${width}, height=${height}, top=${top}, left=${left}`
    );

    if (!popup) {
      setError('Popup was blocked by browser. Please allow popups to connect Meta WhatsApp.');
      setIsMetaConnecting(false);
    }
  };

  // Handle Step 3: Complete Business & WhatsApp Setup
  const handleCompleteSetup = async (skipWhatsApp = false) => {
    setError(null);
    setLoading(true);

    try {
      if (skipWhatsApp) {
        await onboardingApi.skip();
      } else {
        await onboardingApi.submit({
          displayName: name || user?.name || 'User',
          phone: phone || user?.phone || '9876543210',
          businessName: businessName || user?.businessName || '',
          businessType: category,
          businessSubType: subCategory,
          phoneNumberId: phoneNumberId || undefined,
          accessToken: accessToken || undefined,
          verifyToken: verifyToken || undefined,
          wabaId: wabaId || undefined,
          consentAccepted: consentAccepted,
        });
      }

      setOnboardingCompleted(true);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Failed to finalize setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setErrorCode(null);
    setInfoMessage(null);
    setLoading(true);
    const { error, message, code } = await requestOtp(email, mode);
    setLoading(false);

    if (error) {
      setError(error);
      setErrorCode(code || null);
    } else {
      setInfoMessage(message || 'A new verification code has been sent to your email.');
      startResendTimer();
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setStep(1);
    setOtp('');
    setError(null);
    setErrorCode(null);
    setInfoMessage(null);
  };

  return (
    <div className="relative flex h-screen max-h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-600/30 selection:text-white">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-blue-600/15 via-indigo-600/10 to-transparent blur-3xl dark:from-blue-600/20 dark:via-indigo-500/10" />
        <div className="absolute top-1/2 -right-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-purple-600/15 via-pink-600/10 to-transparent blur-3xl dark:from-purple-600/20 dark:via-pink-500/10" />
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Left panel — Modern Brand Showcase with UK Representative Photo */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="relative hidden w-1/2 h-full max-h-screen flex-col justify-between overflow-hidden border-r border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-br from-slate-900 via-[#0d162b] to-[#121c38] p-6 xl:p-8 text-white lg:flex">
        {/* Subtle grid pattern overlay */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Ambient glow spots */}
        <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-8 right-0 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

        {/* Top bar: Brand identity & live status */}
        <div className="relative z-10 flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 p-1.5 backdrop-blur-md border border-white/15 shadow-inner">
              <img
                src="https://www.gyanvaniai.online/logo.webp"
                alt="GyanVani AI Logo"
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <Bot className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-white leading-tight">GyanVani AI</span>
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-300 border border-blue-400/30 leading-none">
                  Connect CRM
                </span>
              </div>
              <span className="text-[10px] font-medium tracking-wide text-slate-400 leading-tight">
                WhatsApp Coexistence & AI Voice Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>AI Voice & WhatsApp Live</span>
          </div>
        </div>

        {/* Central showcase card: High-Fashion UK Female Representative */}
        <div className="relative z-10 my-auto py-2">
          <div className="relative mx-auto max-w-sm xl:max-w-md">
            {/* Ambient halo around card */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-25 blur-lg animate-pulse-slow" />

            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-slate-900/70 p-2.5 shadow-2xl backdrop-blur-xl">
              {/* Representative Image Container (Compact 16:9 / 200px) */}
              <div className="relative h-40 xl:h-48 w-full overflow-hidden rounded-xl bg-slate-800">
                <img
                  src="/assets/auth/uk_rep.jpg"
                  alt="Charlotte Davies - Client Growth Representative"
                  className="h-full w-full object-cover object-top transition-transform duration-700 hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/representative.jpg';
                  }}
                />

                {/* Subtle gradient overlay on bottom of image for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />

                {/* Floating Top-Left Status Pill */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-lg bg-slate-900/80 px-2.5 py-1 text-[10px] font-semibold text-white shadow-md backdrop-blur-md border border-white/15">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Verified Representative</span>
                  <span className="text-[9px] text-blue-300 font-bold bg-blue-500/20 px-1 py-0.2 rounded">UK 24/7</span>
                </div>

                {/* Floating Top-Right conversion chip */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-lg bg-emerald-500/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-md backdrop-blur-md">
                  <TrendingUp className="h-3 w-3" />
                  <span>+340% Conversions</span>
                </div>

                {/* Bottom Overlay Info on the Image */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src="/assets/auth/uk_avatar.jpg"
                      alt="Charlotte Davies"
                      className="h-8 w-8 rounded-full border border-white/80 object-cover shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">Charlotte Davies</h4>
                      <p className="text-[10px] text-slate-300 leading-none mt-0.5">Senior Growth & Client Engagement · London</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-md border border-white/20">
                    <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                    <span>4.9 / 5.0</span>
                  </div>
                </div>
              </div>

              {/* Compact Quote Box */}
              <div className="mt-2 rounded-lg bg-white/5 px-3 py-2 border border-white/10 backdrop-blur-sm">
                <p className="text-[11px] italic leading-snug text-slate-200">
                  "GyanVani AI transformed client engagement. WhatsApp Coexistence & AI Voice handle inquiries around the clock with zero lead leakage."
                </p>
              </div>
            </div>

            {/* Feature Pills under image (Compact 2x2 grid) */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 backdrop-blur-md">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400">
                  <MessageSquare className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate text-[11px]">WhatsApp Coexistence</p>
                  <p className="text-[9px] text-slate-400 truncate">Keeps mobile app active</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 backdrop-blur-md">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-500/20 text-blue-400">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate text-[11px]">AI Voice Calling</p>
                  <p className="text-[9px] text-slate-400 truncate">Instant voice follow-ups</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 backdrop-blur-md">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-purple-500/20 text-purple-400">
                  <Zap className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate text-[11px]">Instant Lead Capture</p>
                  <p className="text-[9px] text-slate-400 truncate">Automated CRM sync</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 backdrop-blur-md">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-amber-400">
                  <Calendar className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate text-[11px]">Smart Site Visits</p>
                  <p className="text-[9px] text-slate-400 truncate">Direct appointments</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom trust footer */}
        <div className="relative z-10 flex shrink-0 items-center justify-between border-t border-white/10 pt-3 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-blue-400" />
            <span>Meta Official Tech Provider · 256-Bit SSL Secured</span>
          </div>
          <span>v2.4 Enterprise</span>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Right panel — Unified Auth Form Card (Strict 100vh Fit) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="relative flex w-full h-full max-h-screen flex-col justify-center items-center overflow-y-auto px-4 py-4 sm:px-6 md:px-8 lg:w-1/2 lg:px-8 xl:px-14 scrollbar-none">
        <div className="my-auto w-full max-w-[420px] py-2">
          {/* Top Bar on Mobile & Desktop: Brand and Theme Toggle */}
          <div className="mb-3 flex items-center justify-between">
            {/* Mobile Brand Header */}
            <div className="flex items-center gap-2.5 lg:hidden">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 p-1 text-white shadow-sm">
                <img
                  src="https://www.gyanvaniai.online/logo.webp"
                  alt="GyanVani AI Logo"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                  GyanVani AI
                </h3>
                <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Connect CRM
                </span>
              </div>
            </div>

            {/* Desktop spacer if hidden */}
            <div className="hidden lg:block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Enterprise Portal
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow-xs transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Mobile Representative Preview Banner (Compact) */}
          <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-blue-500/20 bg-blue-50/70 p-2 dark:border-blue-500/30 dark:bg-blue-950/30 backdrop-blur-md lg:hidden">
            <img
              src="/assets/auth/uk_avatar.jpg"
              alt="Charlotte Davies"
              className="h-8 w-8 shrink-0 rounded-full border border-blue-500/40 object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-slate-900 dark:text-white">Charlotte Davies</span>
                <span className="rounded bg-blue-600 px-1 py-0.2 text-[8px] font-bold text-white uppercase">UK Rep</span>
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 truncate">
                AI Voice & WhatsApp Coexistence CRM
              </p>
            </div>
          </div>

          {/* Main Card Container */}
          <div className="relative rounded-2xl border border-slate-200/80 bg-white/95 p-5 sm:p-6 shadow-xl backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/95 dark:shadow-2xl">
            {/* Session Expired Banner */}
            {sessionExpiredBanner && (
              <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-amber-300/60 bg-amber-50/90 p-2.5 dark:border-amber-500/30 dark:bg-amber-950/40 animate-slide-down">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="text-[11px]">
                  <p className="font-bold text-amber-900 dark:text-amber-300">Session expired</p>
                  <p className="mt-0.5 text-amber-700 dark:text-amber-400">Please verify your email to log back in to your CRM workspace.</p>
                </div>
              </div>
            )}

            {/* Step Progress Indicator (For Signup or Step 3) */}
            {(mode === 'signup' || step === 3) && (
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                <div className={cx("flex items-center gap-1.5 text-[11px] font-bold transition-colors", step >= 1 ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-600")}>
                  <span className={cx("flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold transition-all", step > 1 ? "bg-emerald-500 text-white" : step === 1 ? "bg-blue-600 text-white shadow-xs" : "bg-slate-200 dark:bg-slate-800")}>
                    {step > 1 ? <Check className="h-3 w-3" /> : '1'}
                  </span>
                  <span>Profile</span>
                </div>

                <div className={cx("h-0.5 flex-1 mx-2 transition-colors", step > 1 ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800")} />

                <div className={cx("flex items-center gap-1.5 text-[11px] font-bold transition-colors", step >= 2 ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-600")}>
                  <span className={cx("flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold transition-all", step > 2 ? "bg-emerald-500 text-white" : step === 2 ? "bg-blue-600 text-white shadow-xs" : "bg-slate-200 dark:bg-slate-800")}>
                    {step > 2 ? <Check className="h-3 w-3" /> : '2'}
                  </span>
                  <span>Verify</span>
                </div>

                <div className={cx("h-0.5 flex-1 mx-2 transition-colors", step >= 3 ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800")} />

                <div className={cx("flex items-center gap-1.5 text-[11px] font-bold transition-colors", step >= 3 ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-600")}>
                  <span className={cx("flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold transition-all", step === 3 ? "bg-blue-600 text-white shadow-xs" : "bg-slate-200 dark:bg-slate-800")}>
                    3
                  </span>
                  <span>Setup</span>
                </div>
              </div>
            )}

            {/* Header Titles */}
            <div className="mb-2.5">
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl">
                {step === 1
                  ? mode === 'login' ? 'Welcome back' : 'Create your account'
                  : step === 2
                    ? 'Verify verification code'
                    : 'Complete Business Setup'}
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                {step === 1
                  ? mode === 'login'
                    ? 'Enter your email to sign in to your AI CRM workspace'
                    : 'Start turning leads into clients with GyanVani AI'
                  : step === 2
                    ? `We sent a 6-digit code to ${email}`
                    : 'Configure your industry category & connect WhatsApp to start automating.'}
              </p>
            </div>

            {/* Segmented Mode Toggle Tabs (Only on Step 1) */}
            {step === 1 && (
              <div className="mb-3 flex rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={cx(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer',
                    mode === 'login'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <LogIn className="h-3 w-3" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className={cx(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer',
                    mode === 'signup'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <UserPlus className="h-3 w-3" />
                  <span>Sign Up</span>
                </button>
              </div>
            )}

            {/* Status Feedback Banners */}
            {infoMessage && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-50/80 dark:bg-blue-950/40 p-2 text-[11px] font-semibold text-blue-700 dark:text-blue-300 animate-slide-down">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                <span>{infoMessage}</span>
              </div>
            )}

            {errorCode === 'ACCOUNT_NOT_FOUND' ? (
              <div className="mb-3 rounded-xl border border-amber-300/60 bg-amber-50/90 p-3 dark:border-amber-500/30 dark:bg-amber-950/40 animate-slide-down">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                      No Workspace Found
                    </h4>
                    <p className="mt-0.5 text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-tight">
                      We couldn't find a CRM workspace associated with <strong className="font-semibold">{email}</strong>.
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          switchMode('signup');
                          setError(null);
                          setErrorCode(null);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-600 hover:bg-amber-700 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs cursor-pointer"
                      >
                        <UserPlus className="h-3 w-3" />
                        <span>Create Account &rarr;</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : errorCode === 'ACCOUNT_ALREADY_EXISTS' ? (
              <div className="mb-3 rounded-xl border border-blue-500/40 bg-blue-50/90 p-3 dark:border-blue-400/30 dark:bg-blue-950/40 animate-slide-down">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-bold text-blue-900 dark:text-blue-200">
                      Account Already Registered
                    </h4>
                    <p className="mt-0.5 text-[11px] text-blue-800/90 dark:text-blue-300/90 leading-tight">
                      An active account is already registered with <strong className="font-semibold">{email || 'this email'}</strong>.
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          switchMode('login');
                          setError(null);
                          setErrorCode(null);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs cursor-pointer"
                      >
                        <LogIn className="h-3 w-3" />
                        <span>Sign In</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-50/80 dark:bg-red-950/40 p-2.5 text-[11px] font-semibold text-red-600 dark:text-red-400 animate-slide-down">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* STEP 1 FORM: Email, Full Name, Business Name, Phone */}
            {/* ───────────────────────────────────────────────────────────── */}
            {step === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-2.5">
                {mode === 'signup' && (
                  <>
                    <ModernInputField
                      icon={User}
                      label="Full Name"
                      type="text"
                      value={name}
                      onChange={setName}
                      placeholder="e.g. Arjun Kapoor"
                      autoComplete="name"
                      required
                    />

                    <ModernInputField
                      icon={Building2}
                      label="Business / Agency Name"
                      type="text"
                      value={businessName}
                      onChange={setBusinessName}
                      placeholder="e.g. Luxe Estates UK"
                      autoComplete="organization"
                    />

                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Mobile Number (Optional)
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="9876543210"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-8 pr-3 text-xs font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15 dark:border-slate-800 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-900"
                        />
                      </div>
                    </div>
                  </>
                )}

                <ModernInputField
                  icon={Mail}
                  label="Work Email Address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="name@company.com"
                  autoComplete="email"
                  required
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      <span>{mode === 'signup' ? 'Get Instant Verification Code' : 'Send Login Code'}</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>

                {/* Google Sign-in Divider */}
                <div className="relative my-2.5 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <span className="relative bg-white dark:bg-slate-900 px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Or continue with
                  </span>
                </div>

                {/* Google One-Tap / OAuth Button */}
                <div className="flex justify-center">
                  <GoogleSignInButton
                    text={mode === 'signup' ? 'signup_with' : 'signin_with'}
                    theme={theme === 'dark' ? 'filled_black' : 'outline'}
                    onError={(err) => setError(err)}
                    className="w-full"
                  />
                </div>
              </form>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* STEP 2 FORM: 6-Digit OTP */}
            {/* ───────────────────────────────────────────────────────────── */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-200/80 dark:border-slate-700/60 text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-900 dark:text-white truncate text-[11px]">{email}</p>
                    {mode === 'signup' && name && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Registering as: <span className="font-semibold text-slate-700 dark:text-slate-300">{name}</span>
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex shrink-0 items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline text-[11px] cursor-pointer"
                  >
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    6-Digit Security Code
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-8 pr-3 text-center font-mono text-lg font-bold tracking-[0.4em] text-slate-900 transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-xs placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15 dark:border-slate-800 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-900"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      <span>Verify Code & Continue</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading || resendTimer > 0}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <RefreshCw className={cx("h-3 w-3", loading ? "animate-spin" : "")} />
                    {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : 'Resend Code'}
                  </button>
                </div>
              </form>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* STEP 3 FORM: Business Niche & WhatsApp Setup */}
            {/* ───────────────────────────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-3 animate-slide-down">
                {/* Category & SubCategory */}
                <div className="space-y-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900 dark:text-white">
                    <Tag className="h-3.5 w-3.5 text-blue-500" />
                    <span>Business Niche & Industry</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
                        Industry
                      </label>
                      <select
                        value={category}
                        onChange={(e) => {
                          const newCat = e.target.value;
                          setCategory(newCat);
                          if (categories[newCat]?.length > 0) {
                            setSubCategory(categories[newCat][0]);
                          }
                        }}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 px-2.5 text-[11px] font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                      >
                        {Object.keys(categories).map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
                        Role / Specialty
                      </label>
                      <select
                        value={subCategory}
                        onChange={(e) => setSubCategory(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 px-2.5 text-[11px] font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                      >
                        {(categories[category] || []).map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Meta Integration */}
                <div className="space-y-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900 dark:text-white">
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                      <span>WhatsApp Coexistence</span>
                    </div>
                    <div className="flex rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5 text-[9px]">
                      <button
                        type="button"
                        onClick={() => setWhatsappMode('embedded')}
                        className={cx("px-1.5 py-0.5 rounded font-bold transition-all", whatsappMode === 'embedded' ? "bg-blue-600 text-white shadow-xs" : "text-slate-500")}
                      >
                        1-Click Meta
                      </button>
                      <button
                        type="button"
                        onClick={() => setWhatsappMode('manual')}
                        className={cx("px-1.5 py-0.5 rounded font-bold transition-all", whatsappMode === 'manual' ? "bg-blue-600 text-white shadow-xs" : "text-slate-500")}
                      >
                        Manual Keys
                      </button>
                    </div>
                  </div>

                  {whatsappMode === 'embedded' ? (
                    <div className="space-y-2 pt-0.5">
                      {metaConnected ? (
                        <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">WhatsApp Connected!</p>
                            <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 truncate">{metaPhoneDisplay || 'Coexistence Active'}</p>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleLaunchGatewayPopup}
                          disabled={isMetaConnecting}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer disabled:opacity-60 active:scale-[0.98]"
                        >
                          {isMetaConnecting ? (
                            <>
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              <span>Opening Meta Secure Gateway...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                              </svg>
                              <span>Connect WhatsApp with Meta</span>
                            </>
                          )}
                        </button>
                      )}
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center">
                        Keep chatting on mobile while AI auto-qualifies leads.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-0.5 text-xs">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">Phone Number ID</label>
                        <input
                          type="text"
                          value={phoneNumberId}
                          onChange={(e) => setPhoneNumberId(e.target.value)}
                          placeholder="e.g. 104829104829104"
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 px-2.5 text-[11px] font-mono text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">System User Access Token</label>
                        <input
                          type="password"
                          value={accessToken}
                          onChange={(e) => setAccessToken(e.target.value)}
                          placeholder="EAABw..."
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 px-2.5 text-[11px] font-mono text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Consent checkbox */}
                <label className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={consentAccepted}
                    onChange={(e) => setConsentAccepted(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[10px] leading-tight">
                    I agree to the WhatsApp Cloud API Terms & Data Protection Policy.
                  </span>
                </label>

                {/* Final Submission Buttons */}
                <div className="flex flex-col gap-1.5 pt-1.5">
                  <button
                    type="button"
                    onClick={() => handleCompleteSetup(false)}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        <span>Complete Setup & Enter Dashboard</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCompleteSetup(true)}
                    disabled={loading}
                    className="w-full text-center text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white py-1 transition-colors cursor-pointer"
                  >
                    Skip WhatsApp for now & go to Dashboard &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* Switch Mode Prompt (Step 1) */}
            {step === 1 && (
              <p className="mt-3 text-center text-[11px] text-slate-500 dark:text-slate-400">
                {mode === 'login' ? (
                  <>
                    Don't have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      className="font-bold text-blue-600 hover:underline dark:text-blue-400 cursor-pointer"
                    >
                      Sign up free
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="font-bold text-blue-600 hover:underline dark:text-blue-400 cursor-pointer"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            )}

            {/* Security Badge in Card */}
            <div className="mt-3 flex items-center justify-center gap-1 border-t border-slate-100 pt-2.5 text-[10px] font-medium text-slate-400 dark:border-slate-800 dark:text-slate-500">
              <Shield className="h-3 w-3 text-emerald-500" />
              <span>Protected by Enterprise TLS & Token Authentication</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModernInputField({
  icon: Icon,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
}: {
  icon: typeof Mail;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 transition-colors peer-focus:text-blue-600" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="peer w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-8 pr-3 text-xs font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15 dark:border-slate-800 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-900"
        />
      </div>
    </div>
  );
}
