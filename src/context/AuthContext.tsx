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
  permissions?: string[];
  permissionVersion?: number;
  user_metadata?: {
    name?: string;
  };
};

type AuthContextValue = {
  token: string | null;
  tenantId: string | null;
  user: AuthUser | null;
  loading: boolean;
  requestOtp: (email: string, mode?: 'login' | 'signup') => Promise<{ error: string | null; message: string | null; code?: string | null }>;
  verifyOtp: (email: string, otp: string, displayName?: string, businessName?: string, mode?: 'login' | 'signup') => Promise<{ error: string | null; code?: string | null }>;
  signIn: (email: string, otpOrPassword?: string) => Promise<{ error: string | null; message?: string | null; code?: string | null }>;
  signUp: (email: string, passwordOrOtp?: string, name?: string, businessName?: string) => Promise<{ error: string | null; message?: string | null; code?: string | null }>;
  signOut: () => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => void;
};

type VerifyAuthResponse = {
  token: string;
  userId?: string;
  email?: string;
  tenantId?: string;
  businessName?: string;
  displayName?: string;
  role?: string;
  onboardingCompleted?: boolean;
  planType?: string;
  permissions?: string[];
  permissionVersion?: number;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [tenantId, setTenantId] = useState<string | null>(getTenantId());
  const [user, setUser] = useState<AuthUser | null>(getStoredUser<AuthUser>());
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
    const storedUser = getStoredUser<AuthUser>();
    const storedTenant = getTenantId();

    if (storedToken && storedUser) {
      const isSuper = checkIsSuper(storedUser.role, storedUser.email);
      const updatedUser: AuthUser = { ...storedUser, isSuperAdmin: isSuper };
      setToken(storedToken);
      setUser(updatedUser);
      setTenantId(storedTenant);

      // Silently fetch latest profile in background to update planType and other volatile fields
      apiFetch<Partial<AuthUser>>('/api/v1/users/me').then(res => {
        if (!res.error && res.data) {
          const freshData = res.data;
          const freshUser: AuthUser = {
            ...updatedUser,
            planType: freshData.planType || 'FREE',
            role: freshData.role || updatedUser.role,
            businessName: freshData.businessName || updatedUser.businessName,
            permissions: freshData.permissions || updatedUser.permissions,
            permissionVersion: freshData.permissionVersion || updatedUser.permissionVersion,
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

    const handleProfileUpdated = () => {
      const storedToken = getAuthToken();
      const storedTenant = getTenantId();
      if (storedToken) {
        apiFetch<Partial<AuthUser>>('/api/v1/users/me').then(res => {
          if (!res.error && res.data) {
            const freshData = res.data;
            setUser(prev => {
              if (!prev) return prev;
              const updated: AuthUser = {
                ...prev,
                planType: freshData.planType || prev.planType || 'FREE',
                role: freshData.role || prev.role,
                businessName: freshData.businessName || prev.businessName,
                permissions: freshData.permissions || prev.permissions,
                permissionVersion: freshData.permissionVersion || prev.permissionVersion,
              };
              setAuthSession({ token: storedToken, tenantId: storedTenant, user: updated });
              return updated;
            });
          }
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('session-expired', handleSessionExpired);
    window.addEventListener('profileUpdated', handleProfileUpdated);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('session-expired', handleSessionExpired);
      window.removeEventListener('profileUpdated', handleProfileUpdated);
    };
  }, []);

  const requestOtp = async (email: string, mode: 'login' | 'signup' = 'login') => {
    const res = await apiFetch<{ message?: string; error?: string; code?: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), mode }),
    });

    if (res.error) {
      let code: string | null = null;
      if (res.error.includes('No account found') || res.status === 404) {
        code = 'ACCOUNT_NOT_FOUND';
      } else if (res.error.includes('already exists') || res.status === 409) {
        code = 'ACCOUNT_ALREADY_EXISTS';
      }
      return { error: res.error, message: null, code };
    }
    return { error: null, message: res.data?.message || 'Verification code sent to your email.', code: null };
  };

  const verifyOtp = async (email: string, otp: string, displayName?: string, businessName?: string, mode: 'login' | 'signup' = 'login') => {
    const res = await apiFetch<VerifyAuthResponse & { code?: string }>('/api/v1/auth/verify', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim(),
        otp: otp.trim(),
        displayName: displayName?.trim() || undefined,
        businessName: businessName?.trim() || undefined,
        mode,
      }),
    });

    if (res.error || !res.data) {
      let code: string | null = null;
      if (res.error?.includes('Account not registered') || res.status === 404 || res.status === 401) {
        code = 'ACCOUNT_NOT_FOUND';
      }
      return { error: res.error || 'Verification failed', code };
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
      permissions: data.permissions,
      permissionVersion: data.permissionVersion,
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

    return { error: null, code: null };
  };

  const signIn: AuthContextValue['signIn'] = async (email, otpOrPassword) => {
    if (otpOrPassword && /^\d{6}$/.test(otpOrPassword.trim())) {
      return verifyOtp(email, otpOrPassword, undefined, undefined, 'login');
    }
    const res = await requestOtp(email, 'login');
    return { error: res.error, message: res.message, code: res.code };
  };

  const signUp: AuthContextValue['signUp'] = async (email, passwordOrOtp, name, businessName) => {
    if (passwordOrOtp && /^\d{6}$/.test(passwordOrOtp.trim())) {
      return verifyOtp(email, passwordOrOtp, name, businessName, 'signup');
    }
    const res = await requestOtp(email, 'signup');
    return { error: res.error, message: res.message, code: res.code };
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

  const setOnboardingCompleted = (completed: boolean) => {
    if (user) {
      const updatedUser = { ...user, onboardingCompleted: completed };
      setUser(updatedUser);
      setAuthSession({ token: token || '', tenantId, user: updatedUser });
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
        setOnboardingCompleted,
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
