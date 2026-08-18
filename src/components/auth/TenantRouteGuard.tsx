import React from 'react';
import { useAccess } from '@/context/TenantEntitlementsContext';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, Sparkles, ArrowLeft, RefreshCw, Lock, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TenantRouteGuardProps {
  children: React.ReactNode;
  pageKey: string;
  userPerm?: string;
  title?: string;
  description?: string;
}

export const TenantRouteGuard: React.FC<TenantRouteGuardProps> = ({
  children,
  pageKey,
  userPerm,
  title,
  description,
}) => {
  const { canAccess, loading, refreshEntitlements } = useAccess();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent mb-3" />
        <p className="text-sm text-secondary-c font-medium">Verifying organization service entitlements…</p>
      </div>
    );
  }

  const access = canAccess(pageKey, userPerm);

  if (!access.allowed) {
    const isFeatureLocked = access.reason === 'FEATURE_LOCKED';

    return (
      <div className="mx-auto flex min-h-[75vh] max-w-2xl flex-col items-center justify-center p-6 text-center animate-fade-in">
        {/* Glow & Icon container */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-rose-500/20 via-orange-500/20 to-amber-500/20 blur-xl dark:from-rose-500/10 dark:via-orange-500/10 dark:to-amber-500/10" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-border-c bg-card-c shadow-xl">
            {isFeatureLocked ? (
              <Lock className="h-10 w-10 text-rose-500 dark:text-rose-400" />
            ) : (
              <ShieldAlert className="h-10 w-10 text-amber-500 dark:text-amber-400" />
            )}
          </div>
        </div>

        {/* Badge */}
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
          <Sparkles className="h-3.5 w-3.5" />
          {isFeatureLocked ? 'Feature Not Enabled In Your Plan' : 'Permission Denied'}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold tracking-tight text-primary-c sm:text-3xl">
          {title || (isFeatureLocked ? 'Service Unavailable' : 'Access Restricted')}
        </h2>

        {/* Description */}
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-secondary-c">
          {description ||
            (isFeatureLocked
              ? `The ${pageKey.replace('PAGE_', '').replace(/_/g, ' ')} module is currently not included in your organization's subscription plan. Please contact your platform owner to enable this service.`
              : `Your user account role does not have the required permission (${userPerm}) to view or manage this section. Please contact your workspace administrator.`)}
        </p>

        {/* Action CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 rounded-xl border border-base-c bg-card-c px-4 py-2.5 text-xs font-semibold text-primary-c shadow-sm hover:bg-muted-c/40 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          <button
            onClick={() => refreshEntitlements()}
            className="flex items-center gap-2 rounded-xl border border-base-c bg-card-c px-4 py-2.5 text-xs font-semibold text-secondary-c hover:text-primary-c shadow-sm hover:bg-muted-c/40 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Check Entitlements
          </button>

          {isFeatureLocked && (
            <button
              onClick={() => navigate('/settings/need-help')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:opacity-95 transition-opacity"
            >
              <HelpCircle className="h-4 w-4" />
              Contact Platform Owner
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
