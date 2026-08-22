import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getStoredUser, categoryApi, onboardingApi, metaGatewayApi } from '@/lib/api';
import { cx } from '@/lib/types';
import {
  Mail, KeyRound, User, ArrowRight, Sun, Moon,
  Building2, MessageSquare, TrendingUp, Calendar, Shield, RefreshCw, Edit2,
  Phone, Tag, Layers, CheckCircle2, ExternalLink, Key, Plug, Check, Sparkles,
  AlertCircle, UserPlus, LogIn
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
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1 = Input Info, 2 = Verify OTP, 3 = Business & WhatsApp Setup (Same Card)

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
  const [verifyToken, setVerifyToken] = useState('crm_' + Math.random().toString(36).substring(2, 10));
  const [wabaId, setWabaId] = useState('');
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
        // Smooth in-place transition to Step 3 on the SAME screen card!
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
    <div className="flex min-h-screen bg-base-c">
      {/* Left panel — branding / showcase */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 p-12 lg:flex">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-secondary-400/20 blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center">
            <img src="https://www.gyanvaniai.online/logo.webp" alt="Logo" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="text-xl font-extrabold tracking-tight text-white leading-tight">
              GyanVaniAi
            </h2>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 leading-none mt-1">
              Connect
            </span>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight text-white">
            Close more deals.<br />Convert more leads.
          </h1>
          <p className="mt-4 text-base text-white/80">
            The all-in-one real estate CRM with WhatsApp Coexistence, automated AI lead capture, and appointment booking — built for Indian realty.
          </p>

          {/* Feature pills */}
          <div className="mt-8 grid grid-cols-2 gap-3 text-sm text-white/90">
            <div className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md px-3.5 py-2.5">
              <MessageSquare className="h-4 w-4 text-emerald-300" />
              <span>WhatsApp Coexistence</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md px-3.5 py-2.5">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>AI Lead Qualified</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md px-3.5 py-2.5">
              <TrendingUp className="h-4 w-4 text-blue-300" />
              <span>Pipeline & Deals</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md px-3.5 py-2.5">
              <Calendar className="h-4 w-4 text-purple-300" />
              <span>Site Visits & Booking</span>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative rounded-2xl bg-white/10 p-5 backdrop-blur-md border border-white/10">
          <p className="text-sm italic text-white/90">
            "With WhatsApp Coexistence, our team handles real estate leads on mobile and CRM seamlessly without account conflicts!"
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
              AK
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Arjun Kapoor</p>
              <p className="text-[11px] text-white/70">Principal Broker, Luxe Estates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — Unified Auth & Same-Screen Setup Card */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile logo & theme switch */}
          <div className="mb-8 flex items-center justify-between lg:justify-end">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center">
                <img src="https://www.gyanvaniai.online/logo.webp" alt="Logo" className="h-full w-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-primary-c">GyanVaniAi</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">
                  Connect
                </span>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="grid h-9 w-9 place-items-center rounded-lg text-secondary-c transition-colors hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800 dark:hover:text-white"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>
          </div>

          {/* Session expired banner */}
          {sessionExpiredBanner && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Session expired</p>
                <p className="text-xs text-amber-600 dark:text-amber-500">Your session has expired. Please sign in again to continue.</p>
              </div>
            </div>
          )}

          {/* Step Progress Indicator (Only for Sign Up / Onboarding Flow) */}
          {(mode === 'signup' || step === 3) && (
            <div className="mb-6 flex items-center justify-between gap-2 border-b border-base-c pb-4">
              <div className={cx("flex items-center gap-1.5 text-xs font-bold", step >= 1 ? "text-primary-600 dark:text-primary-400" : "text-muted-c")}>
                <span className={cx("flex h-5 w-5 items-center justify-center rounded-full text-[10px]", step > 1 ? "bg-emerald-500 text-white" : step === 1 ? "bg-primary-600 text-white" : "bg-slate-200 dark:bg-ink-800")}>
                  {step > 1 ? <Check className="h-3 w-3" /> : '1'}
                </span>
                <span>Profile</span>
              </div>
              <div className="h-0.5 flex-1 bg-base-c" />
              <div className={cx("flex items-center gap-1.5 text-xs font-bold", step >= 2 ? "text-primary-600 dark:text-primary-400" : "text-muted-c")}>
                <span className={cx("flex h-5 w-5 items-center justify-center rounded-full text-[10px]", step > 2 ? "bg-emerald-500 text-white" : step === 2 ? "bg-primary-600 text-white" : "bg-slate-200 dark:bg-ink-800")}>
                  {step > 2 ? <Check className="h-3 w-3" /> : '2'}
                </span>
                <span>Verify</span>
              </div>
              <div className="h-0.5 flex-1 bg-base-c" />
              <div className={cx("flex items-center gap-1.5 text-xs font-bold", step >= 3 ? "text-primary-600 dark:text-primary-400" : "text-muted-c")}>
                <span className={cx("flex h-5 w-5 items-center justify-center rounded-full text-[10px]", step === 3 ? "bg-primary-600 text-white" : "bg-slate-200 dark:bg-ink-800")}>
                  3
                </span>
                <span>Setup & WhatsApp</span>
              </div>
            </div>
          )}

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-primary-c">
              {step === 1
                ? mode === 'login' ? 'Welcome back' : 'Create your account'
                : step === 2
                ? 'Enter verification code'
                : 'Complete Business Setup'}
            </h2>
            <p className="mt-1.5 text-sm text-secondary-c">
              {step === 1
                ? mode === 'login'
                  ? 'Sign in to access your CRM dashboard'
                  : 'Get started with GyanVaniAi Connect CRM'
                : step === 2
                ? `We sent a 6-digit code to ${email}`
                : 'Select your business niche & connect WhatsApp to start messaging leads.'}
            </p>
          </div>

          {/* Mode tabs (only on Step 1) */}
          {step === 1 && (
            <div className="mb-6 flex rounded-xl border border-base-c bg-card-c p-1">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={cx(
                  'flex-1 rounded-lg py-2 text-sm font-semibold transition-all',
                  mode === 'login'
                    ? 'bg-gradient-accent text-white shadow-soft'
                    : 'text-secondary-c hover:text-primary-c',
                )}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={cx(
                  'flex-1 rounded-lg py-2 text-sm font-semibold transition-all',
                  mode === 'signup'
                    ? 'bg-gradient-accent text-white shadow-soft'
                    : 'text-secondary-c hover:text-primary-c',
                )}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Status Messages & Interactive Guidance Banners */}
          {infoMessage && (
            <div className="mb-4 rounded-xl border border-primary-500/30 bg-primary-500/10 px-3.5 py-2.5 text-xs font-medium text-primary-600 dark:text-primary-400 animate-slide-down">
              {infoMessage}
            </div>
          )}

          {errorCode === 'ACCOUNT_NOT_FOUND' ? (
            <div className="mb-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 dark:border-amber-400/30 dark:bg-amber-950/30 animate-slide-down shadow-xs">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    No Workspace Found
                  </h4>
                  <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                    We couldn't find a CRM workspace associated with this email. Create an account to set up your business workspace and get started.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        switchMode('signup');
                        setError(null);
                        setErrorCode(null);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-soft transition-all cursor-pointer"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Create Account &rarr;</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : errorCode === 'ACCOUNT_ALREADY_EXISTS' ? (
            <div className="mb-5 rounded-2xl border border-blue-500/40 bg-blue-500/10 p-4 dark:border-blue-400/30 dark:bg-blue-950/30 animate-slide-down shadow-xs">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200">
                    Account Already Registered
                  </h4>
                  <p className="mt-1 text-xs text-blue-800/90 dark:text-blue-300/90 leading-relaxed">
                    An active account is already registered with <strong className="font-semibold">{email || 'this email'}</strong>. Please sign in to access your CRM dashboard.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        switchMode('login');
                        setError(null);
                        setErrorCode(null);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-soft transition-all cursor-pointer"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      <span>Sign In to Your Account</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="mb-4 rounded-xl border border-danger-500/30 bg-danger-500/10 px-3.5 py-2.5 text-xs font-medium text-danger-600 dark:text-danger-400 animate-slide-down">
              {error}
            </div>
          ) : null}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STEP 1 FORM: Email, Name, Business Name, Mobile */}
          {/* ───────────────────────────────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <InputField
                    icon={User}
                    label="Full Name"
                    type="text"
                    value={name}
                    onChange={setName}
                    placeholder="Arjun Kapoor"
                    autoComplete="name"
                    required
                  />
                  <InputField
                    icon={Building2}
                    label="Business / Agency Name (Optional)"
                    type="text"
                    value={businessName}
                    onChange={setBusinessName}
                    placeholder="Luxe Estates"
                    autoComplete="organization"
                  />
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-secondary-c">
                      Mobile Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-c" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        className="form-input pl-10"
                      />
                    </div>
                  </div>
                </>
              )}

              <InputField
                icon={Mail}
                label="Email Address"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-accent py-3 text-sm font-semibold text-white shadow-soft transition-all hover:shadow-glow-blue disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    {mode === 'signup' ? 'Get Verification Code' : 'Send Login Code'}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STEP 2 FORM: 6-Digit OTP */}
          {/* ───────────────────────────────────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex flex-col gap-1 rounded-xl bg-card-c p-3 border border-base-c text-xs">
                <div className="flex items-center justify-between text-secondary-c">
                  <span className="font-semibold text-primary-c">{email}</span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1 font-medium text-primary-600 hover:underline dark:text-primary-400 cursor-pointer"
                  >
                    <Edit2 className="h-3 w-3" /> Edit Email
                  </button>
                </div>
                {mode === 'signup' && name && (
                  <span className="text-secondary-c font-medium mt-0.5">
                    Registering as: <strong className="text-primary-c">{name}</strong> {businessName ? `(${businessName})` : ''}
                  </span>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-secondary-c">6-Digit Verification Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-c" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="form-input pl-10 tracking-widest font-mono text-base"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-accent py-3 text-sm font-semibold text-white shadow-soft transition-all hover:shadow-glow-blue disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    Verify & Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading || resendTimer > 0}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary-c hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <RefreshCw className={cx("h-3.5 w-3.5", loading ? "animate-spin" : "")} />
                  {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STEP 3 FORM: Business Niche & WhatsApp Setup (Same Screen!) */}
          {/* ───────────────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              {/* Category & SubCategory */}
              <div className="space-y-3 rounded-2xl border border-base-c bg-card-c p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-primary-c">
                  <Tag className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  <span>Business Niche & Category</span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-medium text-secondary-c mb-1">Industry</label>
                    <select
                      value={category}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        setCategory(newCat);
                        if (categories[newCat]?.length > 0) {
                          setSubCategory(categories[newCat][0]);
                        }
                      }}
                      className="form-input text-xs py-2"
                    >
                      {Object.keys(categories).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-secondary-c mb-1">Sub-Category / Role</label>
                    <select
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      className="form-input text-xs py-2"
                    >
                      {(categories[category] || []).map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* WhatsApp Meta Integration */}
              <div className="space-y-3 rounded-2xl border border-base-c bg-card-c p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary-c">
                    <MessageSquare className="h-4 w-4 text-emerald-500" />
                    <span>WhatsApp Integration</span>
                  </div>
                  <div className="flex rounded-lg border border-base-c bg-subtle-c p-0.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setWhatsappMode('embedded')}
                      className={cx("px-2 py-1 rounded font-semibold", whatsappMode === 'embedded' ? "bg-card-c text-primary-c shadow-xs" : "text-muted-c")}
                    >
                      1-Click Meta
                    </button>
                    <button
                      type="button"
                      onClick={() => setWhatsappMode('manual')}
                      className={cx("px-2 py-1 rounded font-semibold", whatsappMode === 'manual' ? "bg-card-c text-primary-c shadow-xs" : "text-muted-c")}
                    >
                      Manual Keys
                    </button>
                  </div>
                </div>

                {whatsappMode === 'embedded' ? (
                  <div className="space-y-3 pt-1">
                    {metaConnected ? (
                      <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">WhatsApp Connected!</p>
                          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 truncate">{metaPhoneDisplay || 'Coexistence Mode Active'}</p>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleLaunchGatewayPopup}
                        disabled={isMetaConnecting}
                        className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold shadow-soft transition-all cursor-pointer disabled:opacity-60"
                      >
                        {isMetaConnecting ? (
                          <>
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            <span>Opening Meta Gateway...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            <span>Connect with Facebook (Coexistence)</span>
                          </>
                        )}
                      </button>
                    )}
                    <p className="text-[10px] text-muted-c text-center">
                      Keeps mobile WhatsApp active while automating CRM chats.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1 text-xs">
                    <div>
                      <label className="block text-[10px] font-medium text-secondary-c mb-0.5">Phone Number ID</label>
                      <input
                        type="text"
                        value={phoneNumberId}
                        onChange={(e) => setPhoneNumberId(e.target.value)}
                        placeholder="e.g. 104829104829104"
                        className="form-input text-xs py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-secondary-c mb-0.5">Access Token</label>
                      <input
                        type="password"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        placeholder="EAABw..."
                        className="form-input text-xs py-1.5"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Consent check */}
              <label className="flex items-start gap-2.5 text-xs text-secondary-c cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-base-c text-primary-600 focus:ring-primary-500"
                />
                <span className="text-[11px] leading-tight">
                  I agree to WhatsApp Cloud API Messaging terms & GyanVaniAi Connect CRM data policy.
                </span>
              </label>

              {/* Submit / Skip Actions */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleCompleteSetup(false)}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-accent py-3 text-sm font-semibold text-white shadow-soft transition-all hover:shadow-glow-blue disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      <span>Complete & Enter Dashboard</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleCompleteSetup(true)}
                  disabled={loading}
                  className="w-full text-center text-xs font-semibold text-secondary-c hover:text-primary-c py-1 transition-colors cursor-pointer"
                >
                  Skip WhatsApp for now & continue to Dashboard →
                </button>
              </div>
            </div>
          )}

          {/* Footer (only on Step 1) */}
          {step === 1 && (
            <p className="mt-6 text-center text-xs text-muted-c">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button onClick={() => switchMode('signup')} className="font-semibold text-primary-600 hover:underline dark:text-primary-400 cursor-pointer">Sign up free</button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button onClick={() => switchMode('login')} className="font-semibold text-primary-600 hover:underline dark:text-primary-400 cursor-pointer">Sign in</button>
                </>
              )}
            </p>
          )}

          {/* Trust badge */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted-c">
            <Shield className="h-3.5 w-3.5" />
            Secured by GyanVaniAi Connect REST Auth & Meta Tech Provider
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({
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
      <label className="mb-1.5 block text-xs font-medium text-secondary-c">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-c" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="form-input pl-10"
          required={required}
        />
      </div>
    </div>
  );
}
