import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { cx } from '@/lib/types';
import {
  Mail, KeyRound, User, ArrowRight, Sun, Moon,
  Building2, MessageSquare, TrendingUp, Calendar, Shield, RefreshCw, Edit2
} from 'lucide-react';

type Mode = 'login' | 'signup';

export function AuthScreen({ initialMode = 'login' }: { initialMode?: Mode }) {
  const { requestOtp, verifyOtp } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<1 | 2>(1); // 1 = Enter Email, 2 = Enter OTP
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (mode === 'signup' && name.trim().length < 2) {
      setError('Please enter your full name');
      return;
    }

    setLoading(true);
    const { error, message } = await requestOtp(email);
    setLoading(false);

    if (error) {
      setError(error);
    } else {
      setStep(2);
      setInfoMessage(message || 'A 6-digit verification code has been sent to your email.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp || !/^\d{6}$/.test(otp.trim())) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }

    setLoading(true);
    const { error } = await verifyOtp(email, otp, mode === 'signup' ? name : undefined, mode === 'signup' ? businessName : undefined);
    setLoading(false);

    if (error) {
      setError(error);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setInfoMessage(null);
    setLoading(true);
    const { error, message } = await requestOtp(email);
    setLoading(false);

    if (error) {
      setError(error);
    } else {
      setInfoMessage(message || 'A new verification code has been sent to your email.');
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setStep(1);
    setOtp('');
    setError(null);
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
            The all-in-one real estate CRM with WhatsApp, pipeline management, AI suggestions, and appointment booking — built for Indian realty.
          </p>

          {/* Feature pills */}
          <div className="mt-8 flex flex-wrap gap-2.5">
            {[
              { icon: MessageSquare, label: 'WhatsApp' },
              { icon: Building2, label: 'Pipeline' },
              { icon: TrendingUp, label: 'AI Scoring' },
              { icon: Calendar, label: 'Booking' },
            ].map((f) => (
              <span key={f.label} className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                <f.icon className="h-3.5 w-3.5" />
                {f.label}
              </span>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative rounded-2xl bg-white/10 p-5 backdrop-blur-md">
          <div className="flex gap-0.5 text-warning-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} viewBox="0 0 20 20" className="h-4 w-4 fill-current"><path d="M10 1l2.7 5.5 6.1.9-4.4 4.3 1 6L10 15l-5.4 2.8 1-6L1.2 7.4l6.1-.9z" /></svg>
            ))}
          </div>
          <p className="mt-3 text-sm text-white/90">"GyanVaniAi Connect transformed how our team manages leads. We closed 40% more deals in the first quarter."</p>
          <div className="mt-3 flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-sm font-semibold text-white">VT</div>
            <div>
              <p className="text-sm font-semibold text-white">Vikram Thapar</p>
              <p className="text-[11px] text-white/60">Director, Luxe Estates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Theme toggle */}
          <div className="mb-8 flex items-center justify-between">
            {/* Mobile logo */}
            <div className="flex items-center gap-2.5 lg:hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                <img src="https://www.gyanvaniai.online/logo.webp" alt="Logo" className="h-full w-full object-contain" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-[15px] font-extrabold tracking-tight text-primary-c leading-tight">
                  GyanVaniAi
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary-500/80 leading-none mt-[2px]">
                  Connect
                </span>
              </div>
            </div>
            <div className="hidden lg:block" />
            <button
              onClick={toggleTheme}
              className="grid h-9 w-9 place-items-center rounded-lg text-secondary-c transition-colors hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800 dark:hover:text-white"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-primary-c">
              {step === 1
                ? mode === 'login' ? 'Welcome back' : 'Create your account'
                : 'Enter verification code'}
            </h2>
            <p className="mt-1.5 text-sm text-secondary-c">
              {step === 1
                ? mode === 'login'
                  ? 'Sign in to access your CRM dashboard'
                  : 'Get started with GyanVaniAi Connect CRM'
                : `We sent a 6-digit code to ${email}`}
            </p>
          </div>

          {/* Mode tabs (only on Step 1) */}
          {step === 1 && (
            <div className="mb-6 flex rounded-xl2 border border-base-c bg-card-c p-1">
              <button
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

          {/* Messages */}
          {infoMessage && (
            <div className="mb-4 rounded-lg border border-primary-500/30 bg-primary-500/10 px-3 py-2.5 text-xs font-medium text-primary-600 dark:text-primary-400 animate-slide-down">
              {infoMessage}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-lg border border-danger-500/30 bg-danger-500/5 px-3 py-2.5 text-xs font-medium text-danger-600 dark:text-danger-400 animate-slide-down">
              {error}
            </div>
          )}

          {/* STEP 1 FORM: Email / Name / BusinessName */}
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
              />

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl2 bg-gradient-accent py-3 text-sm font-semibold text-white shadow-soft transition-all hover:shadow-glow-blue disabled:opacity-60 disabled:cursor-not-allowed"
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

          {/* STEP 2 FORM: OTP Code */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex flex-col gap-1 rounded-xl bg-card-c p-3 border border-base-c text-xs">
                <div className="flex items-center justify-between text-secondary-c">
                  <span className="font-semibold text-primary-c">{email}</span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1 font-medium text-primary-600 hover:underline dark:text-primary-400"
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
                className="flex w-full items-center justify-center gap-2 rounded-xl2 bg-gradient-accent py-3 text-sm font-semibold text-white shadow-soft transition-all hover:shadow-glow-blue disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    Verify & Enter Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary-c hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Resend Code
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          {step === 1 && (
            <p className="mt-6 text-center text-xs text-muted-c">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button onClick={() => switchMode('signup')} className="font-semibold text-primary-600 hover:underline dark:text-primary-400">Sign up free</button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button onClick={() => switchMode('login')} className="font-semibold text-primary-600 hover:underline dark:text-primary-400">Sign in</button>
                </>
              )}
            </p>
          )}

          {/* Trust badge */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted-c">
            <Shield className="h-3.5 w-3.5" />
            Secured by GyanVaniAi Connect REST Auth
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
}: {
  icon: typeof Mail;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
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
          required
        />
      </div>
    </div>
  );
}
