import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Mail, KeyRound, Link2, X, AlertCircle, Loader2 } from 'lucide-react';

interface LinkGoogleAccountModalProps {
  /** The base64 linkToken returned by the backend on 409 LINK_REQUIRED */
  linkToken: string;
  /** The Google email that triggered the link requirement */
  email: string;
  onSuccess: () => void;
  onClose: () => void;
}

/**
 * Modal shown when a user tries to sign in with Google but an existing CRM
 * account already uses that email address without a linked Google identity.
 *
 * Flow:
 *   1. User enters their email OTP (sent via the existing OTP system)
 *   2. Backend verifies OTP + linkToken, sets googleSubjectId on the account
 *   3. Backend returns JWT → stored → user is logged in
 */
export function LinkGoogleAccountModal({
  linkToken,
  email,
  onSuccess,
  onClose,
}: LinkGoogleAccountModalProps) {
  const { setSessionFromAuthResponse } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  // Step 1: Send OTP to the user's existing CRM email
  const handleSendOtp = async () => {
    setSendingOtp(true);
    setError(null);
    const res = await apiFetch<{ message: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, mode: 'login' }),
    });
    setSendingOtp(false);
    if (res.error) {
      setError(res.error);
    } else {
      setOtpSent(true);
    }
  };

  // Step 2: Submit OTP + linkToken to link the Google account
  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !/^\d{6}$/.test(otp.trim())) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await apiFetch<{
      token: string;
      userId: string;
      tenantId: string;
      email: string;
      displayName: string;
      businessName: string;
      role: string;
      onboardingCompleted: boolean;
      planType: string;
    }>('/api/v1/auth/google/link', {
      method: 'POST',
      body: JSON.stringify({ linkToken, otp: otp.trim() }),
    });

    setLoading(false);

    if (res.error || !res.data) {
      setError(res.error || 'Failed to link account. Please try again.');
      return;
    }

    // Store auth session in AuthContext and localStorage
    setSessionFromAuthResponse(res.data);
    onSuccess();
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
            <Link2 size={24} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Link Google Account</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            An account already exists for <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Verify your identity with a one-time code to link Google Sign-In.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {!otpSent ? (
          /* Step 1: Send OTP */
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <Mail size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{email}</span>
            </div>
            <button
              onClick={handleSendOtp}
              disabled={sendingOtp}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
            >
              {sendingOtp ? (
                <><Loader2 size={16} className="animate-spin" /> Sending code...</>
              ) : (
                <><Mail size={16} /> Send verification code</>
              )}
            </button>
          </div>
        ) : (
          /* Step 2: Enter OTP */
          <form onSubmit={handleLink} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Verification code
              </label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit code"
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-[0.4em] font-mono text-lg"
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 text-center">
                Check your email at <span className="font-medium">{email}</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Linking account...</>
              ) : (
                <><Link2 size={16} /> Link & sign in</>
              )}
            </button>

            <button
              type="button"
              onClick={() => setOtpSent(false)}
              className="w-full text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors py-1"
            >
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
