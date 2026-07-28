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
  verifyOtp: (email: string, otp: string) => Promise<{ error: string | null }>;
  signIn: (email: string, otpOrPassword?: string) => Promise<{ error: string | null; message?: string | null }>;
  signUp: (email: string, passwordOrOtp?: string, name?: string) => Promise<{ error: string | null; message?: string | null }>;
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
    } else {
      clearAuthSession();
      setToken(null);
      setUser(null);
      setTenantId(null);
    }
    setLoading(false);
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

  const verifyOtp = async (email: string, otp: string) => {
    const res = await apiFetch('/api/v1/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
    });

    if (res.error) {
      return { error: res.error };
    }

    const data = res.data;
    const role = data.role || 'OWNER';
    const isSuper = checkIsSuper(role, data.email || email);

    const newUser: AuthUser = {
      id: data.userId || 'user-' + Date.now(),
      email: data.email || email,
      tenantId: data.tenantId,
      businessName: data.businessName || 'My Business',
      role: isSuper ? 'SUPER_ADMIN' : role,
      isSuperAdmin: isSuper,
      onboardingCompleted: data.onboardingCompleted ?? false,
      user_metadata: {
        name: data.businessName || email.split('@')[0],
      },
    };

    const sessionData = {
      token: data.token,
      tenantId: data.tenantId,
      user: newUser,
    };

    setAuthSession(sessionData);
    setToken(data.token);
    setTenantId(data.tenantId || null);
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

  const signUp: AuthContextValue['signUp'] = async (email, passwordOrOtp) => {
    if (passwordOrOtp && /^\d{6}$/.test(passwordOrOtp.trim())) {
      return verifyOtp(email, passwordOrOtp);
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
