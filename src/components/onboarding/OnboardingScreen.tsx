import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { onboardingApi, categoryApi, apiFetch, type OnboardingData } from '@/lib/api';
import { cx } from '@/lib/types';
import {
  User,
  Building2,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Copy,
  Sun,
  Moon,
  LogOut,
  ExternalLink,
  Phone,
  MapPin,
  Image,
  AlertCircle,
  CheckCircle2,
  Plug,
  Key,
} from 'lucide-react';

const TOTAL_STEPS = 5;
const META_APP_ID = import.meta.env.VITE_META_APP_ID || '1573307991099476';
const META_CONFIG_ID = import.meta.env.VITE_META_CONFIG_ID || '1052344107323702';

const FALLBACK_CATEGORIES: Record<string, string[]> = {
  'Real Estate': [
    'Residential Sales',
    'Commercial Leasing',
    'Plot/Land Sales',
    'Luxury Villas',
    'Rental Property Management',
  ],
  'Healthcare & Medical': [
    'Clinics & OPDs',
    'Hospitals & Surgery',
    'Dental Care',
    'Diagnostic & Pathology Labs',
    'Physiotherapy & Wellness',
  ],
  'Education & Coaching': [
    'IIT-JEE & NEET Prep',
    'School & College Admissions',
    'Study Abroad & IELTS',
    'Upskilling & Tech Bootcamps',
    'Competitive Exam Coaching',
  ],
  'Financial Services': [
    'Home & Business Loans',
    'Mutual Funds & Wealth Advisory',
    'Life & Health Insurance',
    'Tax & Accounting Consulting',
    'Stock Trading Services',
  ],
  'Automobile & Dealerships': [
    'New Car Showrooms',
    'Used Car Dealerships',
    '2-Wheeler Showrooms',
    'Auto Servicing & Garage',
    'Fleet & Commercial Vehicles',
  ],
  'Fitness & Wellness': [
    'Gyms & Fitness Centers',
    'Yoga & Meditation Studios',
    'Nutrition & Diet Plans',
    'Spas & Salons',
    'Sports Academies',
  ],
  'Travel & Hospitality': [
    'Tour & Vacation Packages',
    'Hotel & Resort Bookings',
    'Visa & Immigration',
    'Wedding & Event Planning',
    'Corporate Offsites',
  ],
  'Retail & D2C': [
    'Electronics & Appliances',
    'Fashion & Apparel',
    'Furniture & Home Decor',
    'Jewelry & Luxury Goods',
    'FMCG & Organic Stores',
  ],
  'Professional Services': [
    'Legal & Advocate Services',
    'Architecture & Interior Design',
    'Digital Marketing & SEO',
    'IT Services & Web Dev',
    'HR & Staffing Solutions',
  ],
};

const STEP_METADATA = [
  { step: 1, title: 'Personal Info', desc: 'Your details', icon: User },
  { step: 2, title: 'Business', desc: 'Industry & niche', icon: Building2 },
  { step: 3, title: 'WhatsApp', desc: 'Meta integration', icon: MessageSquare },
  { step: 4, title: 'Compliance', desc: 'Terms & consent', icon: ShieldCheck },
  { step: 5, title: 'Brand', desc: 'Address & logo', icon: Sparkles },
];

export function OnboardingScreen() {
  const navigate = useNavigate();
  const { user, setOnboardingCompleted, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Dynamic Categories
  const [categories, setCategories] = useState<Record<string, string[]>>(FALLBACK_CATEGORIES);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Form State
  // Step 1: Personal Info
  const [displayName, setDisplayName] = useState(user?.user_metadata?.name || '');
  const [phone, setPhone] = useState('');

  // Step 2: Business Details
  const [businessName, setBusinessName] = useState(user?.businessName !== 'My Business' ? user?.businessName || '' : '');
  const [businessType, setBusinessType] = useState('');
  const [businessSubType, setBusinessSubType] = useState('');

  // Step 3: WhatsApp Setup
  const [whatsappMode, setWhatsappMode] = useState<'embedded' | 'manual'>('embedded');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [wabaId, _setWabaId] = useState('');
  const [verifyToken] = useState(() => 'crm_' + Math.random().toString(36).substring(2, 12));
  const [isMetaConnecting, setIsMetaConnecting] = useState(false);
  const [metaConnected, setMetaConnected] = useState(false);
  const [metaPhoneDisplay, setMetaPhoneDisplay] = useState<string | null>(null);

  // Step 4: Permissions & Consent
  const [consentMessages, setConsentMessages] = useState(false);
  const [consentData, setConsentData] = useState(false);

  // Step 5: Additional Info (Optional)
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    categoryApi
      .getAll()
      .then((res) => {
        if (res.data && Object.keys(res.data).length > 0) {
          setCategories(res.data);
        }
      })
      .catch(() => {
        setCategories(FALLBACK_CATEGORIES);
      })
      .finally(() => setCategoriesLoading(false));

    loadFacebookSdk();

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

  const loadFacebookSdk = () => {
    if (window.FB) return;

    window.fbAsyncInit = function () {
      window.FB?.init({
        appId: META_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v20.0',
      });
    };

    (function (d, s, id) {
      if (d.getElementById(id)) return;
      const fjs = d.getElementsByTagName(s)[0];
      const js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = 'https://connect.facebook.net/en_US/sdk.js';
      fjs.parentNode?.insertBefore(js, fjs);
    })(document, 'script', 'facebook-jssdk');
  };

  const handleLaunchBackendGatewayPopup = () => {
    setError(null);
    setIsMetaConnecting(true);
    const launchUrl = metaGatewayApi.getLaunchUrl();
    const width = 520;
    const height = 660;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      launchUrl,
      'MetaWhatsAppGateway',
      `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=${width}, height=${height}, top=${top}, left=${left}`
    );

    if (!popup) {
      setError('Popup was blocked by browser. Please allow popups or use Facebook Login button below.');
      setIsMetaConnecting(false);
    }
  };

  const handleLaunchMetaSignup = () => {
    setError(null);

    if (!window.FB) {
      handleLaunchBackendGatewayPopup();
      return;
    }

    setIsMetaConnecting(true);

    window.FB.login(
      async (response: any) => {
        const authResponse = response.authResponse;
        if (authResponse?.code) {
          const oauthCode = authResponse.code;
          try {
            // Exchange code via backend Embedded Signup endpoint
            const res = await apiFetch<any>('/api/v1/integrations/meta/gateway/exchange', {
              method: 'POST',
              body: JSON.stringify({
                code: oauthCode,
              }),
            });

            if (res.error) {
              setError(`Meta connection error: ${res.error}`);
              setIsMetaConnecting(false);
              return;
            }

            setMetaConnected(true);
            setPhoneNumberId(res.data?.phoneNumberId || 'CONNECTED_VIA_META');
            setAccessToken('CONNECTED_VIA_META_OAUTH');
            setMetaPhoneDisplay(
              res.data?.displayPhoneNumber || res.data?.phoneNumberId
                ? `Phone: ${res.data.displayPhoneNumber || res.data.phoneNumberId}`
                : 'Connected'
            );
            setIsMetaConnecting(false);
          } catch (err: any) {
            setError(err?.message || 'Failed to exchange Meta OAuth token.');
            setIsMetaConnecting(false);
          }
        } else {
          setIsMetaConnecting(false);
          setError('Meta popup closed or authorization was cancelled.');
        }
      },
      {
        config_id: META_CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: 'coexistence',
          sessionInfoVersion: '3',
        },
      }
    );
  };

  const handleCopyVerifyToken = () => {
    navigator.clipboard.writeText(verifyToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleNext = () => {
    setError(null);

    // Validation for Step 1
    if (step === 1) {
      if (!displayName.trim()) {
        setError('Please enter your full name');
        return;
      }
      if (!phone.trim()) {
        setError('Please enter your mobile number');
        return;
      }
      if (!/^[6-9]\d{9}$/.test(phone.trim())) {
        setError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)');
        return;
      }
    }

    // Validation for Step 2
    if (step === 2) {
      if (!businessName.trim()) {
        setError('Please enter your business or agency name');
        return;
      }
      if (!businessType) {
        setError('Please select a business category');
        return;
      }
      if (!businessSubType) {
        setError('Please select a sub-category');
        return;
      }
    }

    // Validation for Step 3
    if (step === 3) {
      if (!metaConnected && (!phoneNumberId.trim() || !accessToken.trim())) {
        setError('Please connect WhatsApp via Meta or enter Phone ID & Access Token, or click "Skip for now"');
        return;
      }
    }

    // Validation for Step 4
    if (step === 4) {
      if (!consentMessages || !consentData) {
        setError('Please accept both permissions to continue using WhatsApp CRM features');
        return;
      }
    }

    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkip = async () => {
    setError(null);
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      // Final step skip — save skipped state to backend
      setLoading(true);
      try {
        await onboardingApi.skip();
      } catch {
        // Continue even if backend fails
      }
      setOnboardingCompleted(true);
      navigate('/dashboard', { replace: true });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const payload: OnboardingData = {
      displayName: displayName.trim(),
      phone: phone.trim(),
      businessName: businessName.trim(),
      businessType,
      businessSubType,
      phoneNumberId: phoneNumberId.trim() || undefined,
      accessToken: accessToken.trim() || undefined,
      verifyToken,
      wabaId: wabaId.trim() || undefined,
      consentAccepted: consentMessages && consentData,
      address: address.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
    };

    try {
      const res = await onboardingApi.submit(payload);
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      setOnboardingCompleted(true);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Something went wrong submitting your setup. Please try again.');
      setLoading(false);
    }
  };

  const progressPercent = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="min-h-screen bg-base-c text-primary-c flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-base-c bg-card-c/80 backdrop-blur-md px-6 py-4 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center">
              <img src="https://www.gyanvaniai.online/logo.webp" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight leading-none text-primary-c">GyanVaniAi</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 mt-0.5">
                Connect CRM
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right text-xs">
              <span className="text-secondary-c font-medium">Logged in as</span>
              <span className="font-semibold text-primary-c max-w-[200px] truncate">{user?.email}</span>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-base-c bg-card-c text-secondary-c hover:text-primary-c transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              onClick={() => signOut()}
              className="p-2 rounded-lg border border-base-c bg-card-c text-secondary-c hover:text-danger-600 dark:hover:text-danger-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 flex flex-col justify-center">
        {/* Stepper Navigation Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Setup Wizard
              </span>
              <h1 className="text-xl font-bold tracking-tight text-primary-c">
                Step {step} of {TOTAL_STEPS}: {STEP_METADATA[step - 1].title}
              </h1>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 border border-primary-200 dark:border-primary-800/50">
              {progressPercent}% Completed
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full bg-slate-100 dark:bg-ink-800 rounded-full overflow-hidden border border-base-c">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Step Icon Bubbles */}
          <div className="hidden sm:grid grid-cols-5 gap-2 mt-4">
            {STEP_METADATA.map((s) => {
              const Icon = s.icon;
              const isCompleted = step > s.step;
              const isCurrent = step === s.step;

              return (
                <div
                  key={s.step}
                  className={cx(
                    'flex items-center gap-2 p-2 rounded-xl border transition-all text-left',
                    isCurrent
                      ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30'
                      : isCompleted
                      ? 'border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10 opacity-80'
                      : 'border-base-c bg-card-c opacity-50'
                  )}
                >
                  <div
                    className={cx(
                      'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold',
                      isCurrent
                        ? 'bg-primary-600 text-white'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-ink-800 text-secondary-c'
                    )}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate leading-tight">{s.title}</div>
                    <div className="text-[10px] text-secondary-c truncate">{s.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-card-c border border-base-c rounded-2xl shadow-soft p-6 sm:p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-danger-500/30 bg-danger-500/10 p-3.5 text-xs text-danger-600 dark:text-danger-400 animate-slide-down">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STEP 1: PERSONAL INFORMATION */}
          {/* ───────────────────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-lg font-bold text-primary-c">Let's start with your profile</h2>
                <p className="text-xs text-secondary-c mt-1">
                  Tell us how we should address you and provide a mobile number for important system notifications.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary-c mb-1.5">
                  Your Full Name <span className="text-danger-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-c" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Arjun Kapoor"
                    className="form-input pl-10"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary-c mb-1.5">
                  Mobile Number (India +91) <span className="text-danger-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-semibold text-secondary-c">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="form-input pl-12 font-mono text-sm tracking-wide"
                  />
                </div>
                <p className="text-[11px] text-muted-c mt-1">Enter 10-digit mobile number starting with 6, 7, 8, or 9.</p>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STEP 2: BUSINESS DETAILS */}
          {/* ───────────────────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-lg font-bold text-primary-c">Your Business & Industry</h2>
                <p className="text-xs text-secondary-c mt-1">
                  We customize pipeline stages, lead fields, and AI suggestions tailored to your niche.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary-c mb-1.5">
                  Business / Brand Name <span className="text-danger-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-c" />
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Luxe Estates Realty"
                    className="form-input pl-10"
                    autoFocus
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-secondary-c mb-1.5">
                    Business Category <span className="text-danger-500">*</span>
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => {
                      setBusinessType(e.target.value);
                      setBusinessSubType('');
                    }}
                    className="form-input"
                  >
                    <option value="">{categoriesLoading ? 'Loading Categories...' : 'Select Category'}</option>
                    {Object.keys(categories).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary-c mb-1.5">
                    Sub-Category / Specialization <span className="text-danger-500">*</span>
                  </label>
                  <select
                    value={businessSubType}
                    onChange={(e) => setBusinessSubType(e.target.value)}
                    disabled={!businessType}
                    className="form-input disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">{businessType ? 'Select Specialization' : 'Select Category First'}</option>
                    {businessType &&
                      categories[businessType]?.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {businessSubType && (
                <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-3.5 flex items-start gap-2.5 text-xs text-secondary-c">
                  <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-primary-c">Selected Niche: {businessSubType}</span>
                    <p className="mt-0.5 text-[11px]">
                      Your dashboard will automatically be tailored with appropriate lead pipelines, appointment
                      rules, and custom quick replies.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STEP 3: WHATSAPP META CLOUD API & COEXISTENCE EMBEDDED SIGNUP */}
          {/* ───────────────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-primary-c">Connect WhatsApp Business</h2>
                  <p className="text-xs text-secondary-c mt-1">
                    Integrate your official Meta WhatsApp Business account for live chat, automation, and campaigns.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline shrink-0"
                >
                  Skip for now →
                </button>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex rounded-xl border border-base-c bg-subtle-c p-1">
                <button
                  type="button"
                  onClick={() => setWhatsappMode('embedded')}
                  className={cx(
                    'flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all',
                    whatsappMode === 'embedded'
                      ? 'bg-card-c text-primary-c shadow-sm'
                      : 'text-secondary-c hover:text-primary-c'
                  )}
                >
                  <Plug className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                  <span>1-Click Meta Tech Provider (Recommended)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWhatsappMode('manual')}
                  className={cx(
                    'flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all',
                    whatsappMode === 'manual'
                      ? 'bg-card-c text-primary-c shadow-sm'
                      : 'text-secondary-c hover:text-primary-c'
                  )}
                >
                  <Key className="w-3.5 h-3.5 text-secondary-c" />
                  <span>Manual API Keys</span>
                </button>
              </div>

              {/* OPTION 1: EMBEDDED SIGNUP / COEXISTENCE */}
              {whatsappMode === 'embedded' && (
                <div className="space-y-4 pt-1">
                  {metaConnected ? (
                    <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                          WhatsApp Successfully Connected!
                        </h3>
                        <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                          {metaPhoneDisplay || 'Meta Tech Provider integration active.'}
                        </p>
                      </div>
                      <p className="text-[11px] text-secondary-c">
                        You're all set! Click <strong>"Continue"</strong> below to proceed.
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl border border-base-c bg-card-c text-center space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center mx-auto">
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </div>

                      <div className="max-w-md mx-auto">
                        <h3 className="text-sm font-bold text-primary-c">
                          Connect with Meta Embedded Signup (Coexistence)
                        </h3>
                        <p className="text-xs text-secondary-c mt-1 leading-relaxed">
                          Keeps your existing WhatsApp Mobile / Business app active while simultaneously powering GyanVaniAi
                          Connect CRM, live chats, and automated AI lead capture.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={handleLaunchMetaSignup}
                          disabled={isMetaConnecting}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold shadow-soft transition-all disabled:opacity-60 cursor-pointer"
                        >
                          {isMetaConnecting ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              <span>Connecting with Meta...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                              </svg>
                              <span>Continue with Facebook</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleLaunchBackendGatewayPopup}
                          disabled={isMetaConnecting}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-base-c bg-subtle-c hover:bg-slate-100 dark:hover:bg-ink-800 text-xs font-semibold text-secondary-c hover:text-primary-c transition-all"
                          title="Open Gateway Window"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Gateway Window</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-center gap-2 text-[11px] text-muted-c">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Official Meta Verified Tech Provider Integration</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* OPTION 2: MANUAL API KEYS */}
              {whatsappMode === 'manual' && (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-secondary-c mb-1.5">
                      Phone Number ID <span className="text-secondary-c text-[11px]">(from Meta Developer Portal)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-c" />
                      <input
                        type="text"
                        value={phoneNumberId}
                        onChange={(e) => setPhoneNumberId(e.target.value)}
                        placeholder="e.g. 109283746592837"
                        className="form-input pl-10 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-secondary-c mb-1.5">
                      Permanent Access Token <span className="text-secondary-c text-[11px]">(System User Token)</span>
                    </label>
                    <textarea
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="Paste EAAG... permanent access token"
                      rows={3}
                      className="form-input font-mono text-xs resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-secondary-c mb-1.5">
                      Webhook Verification Token <span className="text-muted-c text-[11px]">(Auto-generated)</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        readOnly
                        value={verifyToken}
                        className="form-input pr-24 font-mono text-xs bg-slate-50 dark:bg-ink-900 select-all"
                      />
                      <button
                        type="button"
                        onClick={handleCopyVerifyToken}
                        className="absolute right-2 px-2.5 py-1 text-xs font-medium rounded-lg border border-base-c bg-card-c hover:bg-slate-100 dark:hover:bg-ink-800 transition-colors flex items-center gap-1"
                      >
                        {copiedToken ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-secondary-c" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-c mt-1">
                      Paste this Verify Token into your Meta App Webhook configuration.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STEP 4: COMPLIANCE & PERMISSIONS */}
          {/* ───────────────────────────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-lg font-bold text-primary-c">Permissions & Data Compliance</h2>
                <p className="text-xs text-secondary-c mt-1">
                  Please review and accept our WhatsApp messaging policy and data processing consent.
                </p>
              </div>

              <div className="space-y-3">
                <label
                  onClick={() => setConsentMessages(!consentMessages)}
                  className={cx(
                    'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all',
                    consentMessages
                      ? 'border-primary-500/50 bg-primary-50/40 dark:bg-primary-950/20'
                      : 'border-base-c bg-card-c hover:border-slate-300 dark:hover:border-ink-700'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={consentMessages}
                    onChange={() => {}}
                    className="mt-0.5 rounded border-base-c text-primary-600 focus:ring-primary-500 h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-semibold text-primary-c block">
                      WhatsApp Messaging & Broadcast Consent
                    </span>
                    <span className="text-[11px] text-secondary-c block mt-0.5 leading-relaxed">
                      I consent to dispatch transactional notifications, chat replies, and opted-in broadcast campaigns
                      to customers via the Meta WhatsApp Cloud API adhering to WhatsApp Business Policies.
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setConsentData(!consentData)}
                  className={cx(
                    'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all',
                    consentData
                      ? 'border-primary-500/50 bg-primary-50/40 dark:bg-primary-950/20'
                      : 'border-base-c bg-card-c hover:border-slate-300 dark:hover:border-ink-700'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={consentData}
                    onChange={() => {}}
                    className="mt-0.5 rounded border-base-c text-primary-600 focus:ring-primary-500 h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-semibold text-primary-c block">Data Processing & Storage Consent</span>
                    <span className="text-[11px] text-secondary-c block mt-0.5 leading-relaxed">
                      I allow GyanVaniAi Connect to securely store, organize, and process CRM leads, chats, and
                      interaction records on behalf of my business.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-c">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>You can manage these privacy and integration settings anytime under Settings.</span>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STEP 5: BRAND IDENTITY & ADDRESS (OPTIONAL) */}
          {/* ───────────────────────────────────────────────────────────── */}
          {step === 5 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-primary-c">Brand Customization & Location</h2>
                  <p className="text-xs text-secondary-c mt-1">
                    These details are optional and can be updated anytime from your Settings view.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline shrink-0"
                >
                  Skip →
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary-c mb-1.5">Business Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-muted-c" />
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Suite 402, Signature Towers, MG Road, Gurugram"
                    rows={2}
                    className="form-input pl-10 resize-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary-c mb-1.5">Business Logo URL</label>
                <div className="relative">
                  <Image className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-c" />
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="form-input pl-10 text-xs"
                  />
                </div>
              </div>

              {logoUrl && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-base-c bg-subtle-c">
                  <img
                    src={logoUrl}
                    alt="Logo Preview"
                    onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                    className="w-10 h-10 object-contain rounded-lg border border-base-c bg-white p-1"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-primary-c block">Logo Preview</span>
                    <span className="text-[11px] text-secondary-c">Image loaded from provided URL</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* ACTION BUTTONS FOOTER */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="mt-8 pt-6 border-t border-base-c flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-base-c text-xs font-semibold text-secondary-c hover:text-primary-c hover:bg-slate-100 dark:hover:bg-ink-800 transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              {(step === 3 || step === 5) && (
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-secondary-c hover:text-primary-c transition-colors disabled:opacity-50"
                >
                  Skip Step
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white text-xs font-semibold shadow-soft hover:shadow-glow-blue transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : step === TOTAL_STEPS ? (
                  <>
                    <span>Finish & Enter CRM</span>
                    <Check className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-c border-t border-base-c/50">
        GyanVaniAi Connect CRM &copy; {new Date().getFullYear()} &bull; Multi-Tenant WhatsApp & Sales Automation
      </footer>
    </div>
  );
}
