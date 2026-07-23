import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { cx } from '@/lib/types';
import {
  Mail, Lock, User, Eye, EyeOff, ArrowRight, Sun, Moon,
  Building2, MessageSquare, TrendingUp, Calendar, Shield,
} from 'lucide-react';

type Mode = 'login' | 'signup';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      if (name.trim().length < 2) {
        setError('Please enter your full name');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, name);
      if (error) setError(error);
    }
    setLoading(false);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
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
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a4 4 0 0 1 4 4v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V6a4 4 0 0 1 4-4Z" />
              <path d="M5 12a7 7 0 0 0 14 0" />
              <path d="M12 19v3" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">CRMLite</h2>
            <p className="text-xs text-white/70">GyanVaniAi Connect</p>
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
          <p className="mt-3 text-sm text-white/90">"CRMLite transformed how our team manages leads. We closed 40% more deals in the first quarter."</p>
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
              <div className="grid h-10 w-10 place-items-center rounded-xl2 bg-gradient-accent">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a4 4 0 0 1 4 4v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V6a4 4 0 0 1 4-4Z" />
                  <path d="M5 12a7 7 0 0 0 14 0" />
                  <path d="M12 19v3" />
                </svg>
              </div>
              <span className="text-base font-bold text-primary-c">CRMLite</span>
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
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-1.5 text-sm text-secondary-c">
              {mode === 'login'
                ? 'Enter your credentials to access your dashboard'
                : 'Start your 14-day free trial — no credit card required'}
            </p>
          </div>

          {/* Mode tabs */}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <InputField
                icon={User}
                label="Full Name"
                type="text"
                value={name}
                onChange={setName}
                placeholder="Arjun Kapoor"
                autoComplete="name"
              />
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
            <div>
              <label className="mb-1.5 block text-xs font-medium text-secondary-c">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-c" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="form-input px-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted-c hover:text-primary-c"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-danger-500/30 bg-danger-500/5 px-3 py-2.5 text-xs font-medium text-danger-600 dark:text-danger-400 animate-slide-down">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl2 bg-gradient-accent py-3 text-sm font-semibold text-white shadow-soft transition-all hover:shadow-glow-blue disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
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

          {/* Trust badge */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted-c">
            <Shield className="h-3.5 w-3.5" />
            Secured by Supabase Auth
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
