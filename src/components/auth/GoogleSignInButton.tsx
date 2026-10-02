import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { LinkGoogleAccountModal } from './LinkGoogleAccountModal';
import { Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps {
  /** Text variant for Google button: signin_with | signup_with | continue_with */
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  /** Visual theme for the button */
  theme?: 'outline' | 'filled_black' | 'filled_blue';
  /** Called when sign-in completes successfully */
  onSuccess?: () => void;
  /** Called on any error — receives a user-friendly message */
  onError?: (msg: string) => void;
  className?: string;
}

type GoogleAuthResponse = {
  token?: string;
  userId?: string;
  tenantId?: string;
  email?: string;
  displayName?: string;
  businessName?: string;
  role?: string;
  onboardingCompleted?: boolean;
  planType?: string;
  permissions?: string[];
  permissionVersion?: number;
  // 409 LINK_REQUIRED fields
  action?: 'LINK_REQUIRED';
  message?: string;
  linkToken?: string;
};

// Helper: decode base64 linkToken to extract email
function extractEmailFromLinkToken(linkToken: string): string {
  try {
    const decoded = atob(linkToken.replace(/-/g, '+').replace(/_/g, '/'));
    const parts = decoded.split('|');
    return parts[1] || '';
  } catch {
    return '';
  }
}

/**
 * Google Sign-In button using @react-oauth/google.
 *
 * Uses the standard ID Token flow — Google library renders the official button,
 * handles the OAuth popup, and returns the verified JWT ID Token string.
 * This is sent to POST /api/v1/auth/google for backend verification.
 *
 * 3-path response handling:
 *   - Normal JWT response → store session in AuthContext & localStorage → navigate
 *   - 409 LINK_REQUIRED  → show LinkGoogleAccountModal
 *   - Any error          → call onError()
 */
export function GoogleSignInButton({
  text = 'continue_with',
  theme = 'outline',
  onSuccess,
  onError,
  className = '',
}: GoogleSignInButtonProps) {
  const navigate = useNavigate();
  const { setSessionFromAuthResponse } = useAuth();
  const [loading, setLoading] = useState(false);
  const [linkModal, setLinkModal] = useState<{
    linkToken: string;
    email: string;
  } | null>(null);

  const handleCredential = async (idToken: string) => {
    setLoading(true);

    const res = await apiFetch<GoogleAuthResponse>('/api/v1/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });

    setLoading(false);

    // ── 409 LINK_REQUIRED ──────────────────────────────────────────────────
    if (res.status === 409 && res.data?.action === 'LINK_REQUIRED') {
      setLinkModal({
        linkToken: res.data.linkToken!,
        email: extractEmailFromLinkToken(res.data.linkToken!),
      });
      return;
    }

    // ── Error ──────────────────────────────────────────────────────────────
    if (res.error || !res.data?.token) {
      onError?.(res.error || 'Google sign-in failed. Please try again.');
      return;
    }

    // ── Success ────────────────────────────────────────────────────────────
    const data = res.data;
    setSessionFromAuthResponse({
      token: data.token!,
      userId: data.userId,
      tenantId: data.tenantId || data.userId,
      email: data.email,
      displayName: data.displayName,
      businessName: data.businessName,
      role: data.role,
      onboardingCompleted: data.onboardingCompleted,
      planType: data.planType,
      permissions: data.permissions,
      permissionVersion: data.permissionVersion,
    });

    onSuccess?.();

    // Navigate based on role / onboarding state
    if (data.role === 'SUPER_ADMIN') {
      navigate('/admin', { replace: true });
    } else if (data.onboardingCompleted === false) {
      navigate('/onboarding', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Link account modal — shown on 409 LINK_REQUIRED */}
      {linkModal && (
        <LinkGoogleAccountModal
          linkToken={linkModal.linkToken}
          email={linkModal.email}
          onSuccess={() => {
            setLinkModal(null);
            onSuccess?.();
            navigate('/dashboard', { replace: true });
          }}
          onClose={() => setLinkModal(null)}
        />
      )}

      {loading ? (
        <div className="flex w-full items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-sm text-slate-600 dark:text-slate-300 shadow-xs">
          <Loader2 size={16} className="animate-spin text-primary-500" />
          <span>Verifying Google account...</span>
        </div>
      ) : (
        <div className="flex justify-center w-full">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              if (credentialResponse.credential) {
                handleCredential(credentialResponse.credential);
              } else {
                onError?.('No credential returned from Google');
              }
            }}
            onError={() => {
              onError?.('Google sign-in was cancelled or failed.');
            }}
            theme={theme}
            text={text}
            shape="rectangular"
            size="large"
            width="380"
          />
        </div>
      )}
    </div>
  );
}

// Export the headless hook in case custom UI is desired
export function useGoogleSignIn(onError?: (msg: string) => void) {
  const navigate = useNavigate();
  const { setSessionFromAuthResponse } = useAuth();
  const [loading, setLoading] = useState(false);
  const [linkModal, setLinkModal] = useState<{ linkToken: string; email: string } | null>(null);

  const handleCredential = async (credential: string) => {
    setLoading(true);

    const res = await apiFetch<GoogleAuthResponse>('/api/v1/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken: credential }),
    });

    setLoading(false);

    if (res.status === 409 && res.data?.action === 'LINK_REQUIRED') {
      setLinkModal({
        linkToken: res.data.linkToken!,
        email: extractEmailFromLinkToken(res.data.linkToken!),
      });
      return;
    }

    if (res.error || !res.data?.token) {
      onError?.(res.error || 'Google sign-in failed. Please try again.');
      return;
    }

    const data = res.data;
    setSessionFromAuthResponse({
      token: data.token!,
      userId: data.userId,
      tenantId: data.tenantId || data.userId,
      email: data.email,
      displayName: data.displayName,
      businessName: data.businessName,
      role: data.role,
      onboardingCompleted: data.onboardingCompleted,
      planType: data.planType,
      permissions: data.permissions,
      permissionVersion: data.permissionVersion,
    });

    if (data.role === 'SUPER_ADMIN') {
      navigate('/admin', { replace: true });
    } else if (data.onboardingCompleted === false) {
      navigate('/onboarding', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const LinkModal = linkModal ? (
    <LinkGoogleAccountModal
      linkToken={linkModal.linkToken}
      email={linkModal.email}
      onSuccess={() => {
        setLinkModal(null);
        navigate('/dashboard', { replace: true });
      }}
      onClose={() => setLinkModal(null)}
    />
  ) : null;

  return { handleCredential, loading, LinkModal };
}
