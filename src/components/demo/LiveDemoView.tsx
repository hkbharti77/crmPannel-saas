import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchCurrentUserProfile, type UserProfileDto } from '@/lib/userApi';
import { useNavigate } from 'react-router-dom';
import { Monitor, Tablet, Smartphone, Settings } from 'lucide-react';

export function LiveDemoView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    fetchCurrentUserProfile()
      .then((res) => {
        if (res.data) setProfile(res.data);
      })
      .catch(() => {});
  }, []);

  const businessId = profile?.id || user?.id || 'demo-tenant-id';
  const businessName = profile?.businessName || (user as Record<string, unknown>)?.businessName as string || (user as Record<string, unknown>)?.name as string || user?.email?.split('@')[0] || 'My Business';

  const rawApiBase = (import.meta.env.VITE_API_BASE_URL || '').trim();
  const apiBase = rawApiBase || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? `${window.location.origin}` : 'http://localhost:8080');

  // Dynamically load the client's actual backend widget script onto the page
  useEffect(() => {
    if (!businessId) return;

    // Load styles.css if not present
    let styleLink = document.querySelector(`link[href="${apiBase}/styles.css"]`) as HTMLLinkElement;
    if (!styleLink) {
      styleLink = document.createElement('link');
      styleLink.rel = 'stylesheet';
      styleLink.href = `${apiBase}/styles.css`;
      document.head.appendChild(styleLink);
    }

    // Load chat-widget.js
    const scriptUrl = `${apiBase}/chat-widget.js`;
    const existingScript = document.querySelector(`script[data-business-id="${businessId}"]`) as HTMLScriptElement;

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.setAttribute('data-business-id', businessId);
      script.async = true;
      script.onload = () => {
        setScriptLoaded(true);
        console.log('✅ [Demo View] Chatbot widget script initialized for businessId:', businessId);
      };
      script.onerror = () => {
        console.warn('⚠️ [Demo View] Chatbot script load warning — check backend status');
      };
      document.body.appendChild(script);
      scriptRef.current = script;
    } else {
      setScriptLoaded(true);
    }

    return () => {
      // Clean up widget elements when navigating away from LiveDemoView (/demo)
      const widgetEl = document.getElementById('crm-chat-widget');
      if (widgetEl) widgetEl.remove();

      document.querySelectorAll('[id*="crm-chat"]').forEach((el) => el.remove());
      document.querySelectorAll('script[data-business-id]').forEach((el) => el.remove());
    };
  }, [businessId, apiBase]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-ink-950 flex flex-col items-center justify-between p-4 md:p-6 transition-colors">
      {/* Top Controls Bar - Ultra Minimal */}
      <div className="w-full max-w-7xl flex items-center justify-between gap-4 pb-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-extrabold text-lg shadow-md">
            {businessName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-primary-c">{businessName}</h1>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-c">
              <span className={`h-2 w-2 rounded-full ${scriptLoaded ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {scriptLoaded ? 'Live Bot Active' : 'Loading Bot...'}
            </span>
          </div>
        </div>

        {/* Viewport & Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-base-c bg-card-c p-1 shadow-xs">
            <button
              onClick={() => setViewport('desktop')}
              className={`p-2 text-xs font-semibold rounded-lg transition-all ${
                viewport === 'desktop' ? 'bg-blue-600 text-white shadow-xs' : 'text-muted-c hover:text-primary-c'
              }`}
              title="Desktop View"
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-2 text-xs font-semibold rounded-lg transition-all ${
                viewport === 'tablet' ? 'bg-blue-600 text-white shadow-xs' : 'text-muted-c hover:text-primary-c'
              }`}
              title="Tablet View"
            >
              <Tablet className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`p-2 text-xs font-semibold rounded-lg transition-all ${
                viewport === 'mobile' ? 'bg-blue-600 text-white shadow-xs' : 'text-muted-c hover:text-primary-c'
              }`}
              title="Mobile View"
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate('/settings/branding')}
            className="p-2.5 rounded-xl border border-base-c bg-card-c text-muted-c hover:text-primary-c transition-colors"
            title="Widget Settings"
          >
            <Settings className="h-4 w-4 text-blue-500" />
          </button>
        </div>
      </div>

      {/* Main Plain Full Page Canvas */}
      <div className="flex-1 w-full flex justify-center items-center py-4">
        <div
          className={`relative overflow-hidden rounded-3xl border border-base-c bg-card-c shadow-xl transition-all duration-300 flex flex-col justify-between p-8 md:p-12 ${
            viewport === 'mobile' ? 'w-[385px] min-h-[640px]' : viewport === 'tablet' ? 'w-[768px] min-h-[680px]' : 'w-full min-h-[700px]'
          }`}
        >
          {/* Canvas Brand Center Logo & Name */}
          <div className="my-auto text-center space-y-3">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-2xl shadow-lg mx-auto">
              {businessName.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-extrabold text-primary-c tracking-tight">{businessName}</h2>
          </div>
        </div>
      </div>
    </div>
  );
}
