import React, { useState, useEffect } from 'react';
import { Settings, X, ShieldCheck, ExternalLink } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'crmpannel_cookie_consent';

export interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.preferences) return parsed.preferences;
        }
      }
    } catch {
      // ignore parsing errors
    }
    return {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: false,
    };
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    try {
      const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!saved) {
        timer = setTimeout(() => setVisible(true), 600);
      }
    } catch {
      timer = setTimeout(() => setVisible(true), 600);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Event listener to trigger preference modal from anywhere (e.g. Settings page)
  useEffect(() => {
    const handleOpenModal = () => {
      setShowPreferences(true);
      setVisible(true);
    };
    window.addEventListener('open-cookie-preferences', handleOpenModal);
    return () => {
      window.removeEventListener('open-cookie-preferences', handleOpenModal);
    };
  }, []);

  const saveConsent = (status: 'all' | 'essential' | 'rejected' | 'custom', customPrefs?: CookiePreferences) => {
    const finalPrefs = customPrefs || {
      necessary: true,
      functional: status === 'all',
      analytics: status === 'all',
      marketing: status === 'all',
    };

    const consentData = {
      status,
      preferences: finalPrefs,
      timestamp: new Date().toISOString(),
    };

    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
    } catch (e) {
      console.warn('Could not save cookie consent:', e);
    }

    setPreferences(finalPrefs);
    setVisible(false);
    setShowPreferences(false);

    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: consentData }));
  };

  const handleAcceptAll = () => saveConsent('all');
  
  const handleEssentialOnly = () => {
    saveConsent('essential', {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    });
  };

  const handleRejectAll = () => {
    saveConsent('rejected', {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    });
  };

  const handleSavePreferences = () => {
    saveConsent('custom', preferences);
  };

  const togglePref = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // Mandatory
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!visible && !showPreferences) return null;

  return (
    <>
      {/* Banner */}
      {visible && (
        <div
          role="dialog"
          aria-label="Cookie Consent Banner"
          className="fixed bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 max-w-7xl mx-auto z-[9999] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-slate-900/25 transition-all duration-300 animate-slide-up"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl" role="img" aria-label="cookie">🍪</span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  We use cookies to enhance your experience
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                We use cookies and similar technologies to help you navigate efficiently, perform certain functions, and collect statistics about your use of our services. Learn more in our{' '}
                <a
                  href="https://www.gyanvaniai.online/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:opacity-85 inline-flex items-center gap-0.5"
                >
                  Privacy Policy <ExternalLink className="w-3 h-3 inline" />
                </a>
                {' '}and{' '}
                <a
                  href="https://www.gyanvaniai.online/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:opacity-85 inline-flex items-center gap-0.5"
                >
                  Terms & Conditions <ExternalLink className="w-3 h-3 inline" />
                </a>.
              </p>
            </div>

            {/* Actions Row */}
            <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRejectAll}
                className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Reject All
              </button>

              <button
                type="button"
                onClick={handleEssentialOnly}
                className="px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all"
              >
                Essential Cookies
              </button>

              <button
                type="button"
                onClick={() => setShowPreferences(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Manage Preferences
              </button>

              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {showPreferences && (
        <div
          className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowPreferences(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto text-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Cookie Preferences</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Manage your data collection settings</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Customize which cookies and data collection functions you want to allow. You can update these choices anytime in{' '}
              <a
                href="https://www.gyanvaniai.online/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-2"
              >
                Privacy Policy
              </a>.
            </p>

            {/* Toggles List */}
            <div className="space-y-3">
              {/* Necessary */}
              <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Strictly Necessary Cookies</h4>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Essential for secure login, session authentication, and CRM navigation. Always active.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full whitespace-nowrap self-center">
                  Always Active
                </span>
              </div>

              {/* Functional */}
              <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Functional Cookies</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Enables theme memory (dark/light mode), customized UI layout, and active tab preferences.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer self-center shrink-0">
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={() => togglePref('functional')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Analytics */}
              <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Analytics & Performance</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Helps us measure feature usage, page load metrics, and optimize chatbot response times.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer self-center shrink-0">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={() => togglePref('analytics')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Marketing */}
              <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Marketing & Integration</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Used to notify you about feature updates, WhatsApp automation releases, and system announcements.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer self-center shrink-0">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={() => togglePref('marketing')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleRejectAll}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Reject All
              </button>
              <button
                type="button"
                onClick={handleSavePreferences}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
