import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  apiFetch,
  setAuthSession,
  clearAuthSession,
  getStoredUser,
  getAuthToken,
  getTenantId,
} from '@/lib/api';

export type AuthUser = {
  id: string;
  email: string;
  tenantId?: string;
  businessName?: string;
  role?: string;
  isSuperAdmin?: boolean;
  onboardingCompleted?: boolean;
  planType?: string;
  user_metadata?: {
    name?: string;
  };
};

type AuthContextValue = {
  token: string | null;
  tenantId: string | null;
  user: AuthUser | null;
  loading: boolean;
  requestOtp: (email: string) => Promise<{ error: string | null; message: string | null }>;
  verifyOtp: (email: string, otp: string, displayName?: string, businessName?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, otpOrPassword?: string) => Promise<{ error: string | null; message?: string | null }>;
  signUp: (email: string, passwordOrOtp?: string, name?: string, businessName?: string) => Promise<{ error: string | null; message?: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [tenantId, setTenantId] = useState<string | null>(getTenantId());
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [loading, setLoading] = useState(true);

  const checkIsSuper = (role?: string, emailStr?: string): boolean => {
    const roleUpper = (role || '').toUpperCase();
    const cleanEmail = (emailStr || '').toLowerCase().trim();
    return (
      roleUpper === 'SUPER_ADMIN' ||
      roleUpper === 'PLATFORM_ADMIN' ||
      roleUpper.includes('SUPER') ||
      roleUpper.includes('PLATFORM') ||
      cleanEmail === 'gyanvaniai@gmail.com' ||
      cleanEmail.startsWith('superadmin')
    );
  };

  useEffect(() => {
    // Check local storage session on initial render
    const storedToken = getAuthToken();
    const storedUser = getStoredUser();
    const storedTenant = getTenantId();

    if (storedToken && storedUser) {
      const isSuper = checkIsSuper(storedUser.role, storedUser.email);
      const updatedUser = { ...storedUser, isSuperAdmin: isSuper };
      setToken(storedToken);
      setUser(updatedUser);
      setTenantId(storedTenant);

      // Silently fetch latest profile in background to update planType and other volatile fields
      apiFetch('/api/v1/users/me').then(res => {
        if (!res.error && res.data) {
          const freshData = res.data;
          const freshUser = {
            ...updatedUser,
            planType: freshData.planType || 'FREE',
            role: freshData.role || updatedUser.role,
            businessName: freshData.businessName || updatedUser.businessName,
          };
          setUser(freshUser);
          setAuthSession({ token: storedToken, tenantId: storedTenant, user: freshUser });
        }
      });
    } else {
      clearAuthSession();
      setToken(null);
      setUser(null);
      setTenantId(null);
    }
    setLoading(false);
  }, []);

  // Global event listeners for auto-logout
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'crmlite_token' && !e.newValue) {
        // Token was cleared in another tab, log out here
        setToken(null);
        setTenantId(null);
        setUser(null);
      }
    };

    const handleSessionExpired = () => {
      clearAuthSession();
      setToken(null);
      setTenantId(null);
      setUser(null);
      // Redirect to login with a message — use replace so back button doesn't return to the expired page
      window.location.replace('/login?reason=expired');
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, []);

  const requestOtp = async (email: string) => {
    const res = await apiFetch('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim() }),
    });

    if (res.error) {
      return { error: res.error, message: null };
    }
    return { error: null, message: res.data?.message || 'Verification code sent to your email.' };
  };

  const verifyOtp = async (email: string, otp: string, displayName?: string, businessName?: string) => {
    const res = await apiFetch('/api/v1/auth/verify', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim(),
        otp: otp.trim(),
        displayName: displayName?.trim() || undefined,
        businessName: businessName?.trim() || undefined,
      }),
    });

    if (res.error) {
      return { error: res.error };
    }

    const data = res.data;
    const role = data.role || 'OWNER';
    const isSuper = checkIsSuper(role, data.email || email);
    const resolvedTenantId = data.tenantId || data.userId;

    const newUser: AuthUser = {
      id: data.userId || 'user-' + Date.now(),
      email: data.email || email,
      tenantId: resolvedTenantId,
      businessName: data.businessName || businessName || 'My Business',
      role: isSuper ? 'SUPER_ADMIN' : role,
      isSuperAdmin: isSuper,
      onboardingCompleted: data.onboardingCompleted ?? false,
      planType: data.planType || 'FREE',
      user_metadata: {
        name: data.displayName || displayName || data.businessName || email.split('@')[0],
      },
    };

    const sessionData = {
      token: data.token,
      tenantId: resolvedTenantId,
      user: newUser,
    };

    setAuthSession(sessionData);
    setToken(data.token);
    setTenantId(resolvedTenantId || null);
    setUser(newUser);

    return { error: null };
  };

  const signIn: AuthContextValue['signIn'] = async (email, otpOrPassword) => {
    if (otpOrPassword && /^\d{6}$/.test(otpOrPassword.trim())) {
      return verifyOtp(email, otpOrPassword);
    }
    const res = await requestOtp(email);
    return { error: res.error, message: res.message };
  };

  const signUp: AuthContextValue['signUp'] = async (email, passwordOrOtp, name, businessName) => {
    if (passwordOrOtp && /^\d{6}$/.test(passwordOrOtp.trim())) {
      return verifyOtp(email, passwordOrOtp, name, businessName);
    }
    const res = await requestOtp(email);
    return { error: res.error, message: res.message };
  };

  const signOut = async () => {
    try {
      if (token) {
        await apiFetch('/api/v1/auth/logout', { method: 'POST' });
      }
    } catch {
      // Ignore network errors during logout
    } finally {
      clearAuthSession();
      setToken(null);
      setTenantId(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        tenantId,
        user,
        loading,
        requestOtp,
        verifyOtp,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
