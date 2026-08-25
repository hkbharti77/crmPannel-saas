import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchCurrentUserProfile, type UserProfileDto } from '@/lib/userApi';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Monitor,
  Tablet,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  Settings,
  Bot,
  Play,
  RefreshCw,
  Zap,
  ShieldCheck,
  MessageSquare,
  Building2,
  HelpCircle,
  ArrowRight,
  Code2,
} from 'lucide-react';

export function LiveDemoView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    fetchCurrentUserProfile()
      .then((res) => {
        if (res.data) setProfile(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const businessId = profile?.id || user?.id || 'demo-tenant-id';
  const businessName = profile?.businessName || (user as any)?.businessName || (user as any)?.name || user?.email?.split('@')[0] || 'My Enterprise Business';
  const businessNiche = profile?.businessType || (user as any)?.businessType || 'AI Customer Support';


  const rawApiBase = (import.meta.env.VITE_API_BASE_URL || '').trim();
  const apiBase = rawApiBase || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? `${window.location.origin}` : 'http://localhost:8080');

  const snippetCode = `<link rel="stylesheet" href="${apiBase}/styles.css">
<script src="${apiBase}/chat-widget.js" data-business-id="${businessId}"></script>`;

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
    let existingScript = document.querySelector(`script[data-business-id="${businessId}"]`) as HTMLScriptElement;

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
      // Optional cleanup if navigating away
    };
  }, [businessId, apiBase]);

  const copyCode = () => {
    navigator.clipboard.writeText(snippetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerWidgetOpen = () => {
    // Check if widget window trigger exists globally
    const launcher = document.querySelector('.webchat-launcher-btn, #chat-widget-launcher, [data-chat-launcher]') as HTMLElement;
    if (launcher) {
      launcher.click();
    } else if ((window as any).openWebChatWidget) {
      (window as any).openWebChatWidget();
    } else {
      alert('Chatbot launcher active at the bottom right corner of the demo container!');
    }
  };

  const handleTestPrompt = (promptText: string) => {
    setActivePrompt(promptText);
    triggerWidgetOpen();
    setTimeout(() => {
      const chatInput = document.querySelector('.webchat-input-textarea, #chat-widget-input, input[placeholder*="Ask"]') as HTMLInputElement | HTMLTextAreaElement;
      if (chatInput) {
        chatInput.value = promptText;
        chatInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 400);
  };

  return (
    <div className="mx-auto max-w-7xl p-3 lg:p-5 space-y-4">
      {/* ── Top Header Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-base-c bg-card-c p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-primary-c">Live Website Chatbot Simulator</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Bot Active
              </span>
            </div>
            <p className="text-xs text-muted-c">
              Simulating <strong className="text-primary-c">{businessName}</strong> (Business ID: <code className="font-mono text-[11px] text-blue-600 dark:text-blue-400">{businessId.substring(0, 8)}...</code>)
            </p>
          </div>
        </div>

        {/* Viewport & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Device Frame Selector */}
          <div className="flex items-center rounded-xl border border-base-c bg-slate-100 dark:bg-ink-850 p-1">
            <button
              onClick={() => setViewport('desktop')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewport === 'desktop' ? 'bg-card-c text-primary-600 dark:text-primary-400 shadow-sm' : 'text-muted-c hover:text-primary-c'
              }`}
              title="Desktop View (Full Width)"
            >
              <Monitor className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewport === 'tablet' ? 'bg-card-c text-primary-600 dark:text-primary-400 shadow-sm' : 'text-muted-c hover:text-primary-c'
              }`}
              title="Tablet View (768px)"
            >
              <Tablet className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tablet</span>
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewport === 'mobile' ? 'bg-card-c text-primary-600 dark:text-primary-400 shadow-sm' : 'text-muted-c hover:text-primary-c'
              }`}
              title="Mobile View (385px)"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate('/settings/branding')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-base-c bg-card-c px-3 py-1.5 text-xs font-semibold text-secondary-c hover:text-primary-c transition-colors"
          >
            <Settings className="h-3.5 w-3.5 text-primary-500" />
            Customize Widget
          </button>

          <button
            type="button"
            onClick={copyCode}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition-all"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-white" /> : <Code2 className="h-3.5 w-3.5" />}
            {copied ? 'Copied Code!' : 'Get Embed Code'}
          </button>
        </div>
      </div>

      {/* ── Quick Test Prompts Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-base-c bg-blue-500/5 dark:bg-blue-950/20 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold text-primary-c">Test Quick AI Prompts:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => handleTestPrompt(`What services does ${businessName} offer?`)}
            className="rounded-lg border border-blue-500/20 bg-card-c px-2.5 py-1 text-[11px] font-medium text-secondary-c hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            💬 "What services do you offer?"
          </button>
          <button
            onClick={() => handleTestPrompt(`How can I book an appointment or consultation?`)}
            className="rounded-lg border border-blue-500/20 bg-card-c px-2.5 py-1 text-[11px] font-medium text-secondary-c hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            📅 "How to book an appointment?"
          </button>
          <button
            onClick={() => handleTestPrompt(`What is your pricing and plan details?`)}
            className="rounded-lg border border-blue-500/20 bg-card-c px-2.5 py-1 text-[11px] font-medium text-secondary-c hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            💰 "Pricing & Plans?"
          </button>
          <button
            onClick={triggerWidgetOpen}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-bold shadow-sm transition-all"
          >
            <Play className="h-3 w-3 fill-current" />
            Open Widget Now
          </button>
        </div>
      </div>

      {/* ── Interactive Website Mockup Container ── */}
      <div className="flex justify-center transition-all duration-300">
        <div
          className={`relative overflow-hidden rounded-2xl border border-base-c bg-card-c shadow-2xl transition-all duration-300 ${
            viewport === 'mobile' ? 'w-[385px] min-h-[700px]' : viewport === 'tablet' ? 'w-[768px] min-h-[750px]' : 'w-full min-h-[750px]'
          }`}
        >
          {/* Browser Address Bar Header */}
          <div className="flex items-center justify-between border-b border-base-c bg-slate-100 dark:bg-ink-900 px-4 py-2.5 select-none">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-base-c bg-card-c px-3 py-1 text-xs text-muted-c font-mono max-w-md w-full justify-center shadow-inner">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span className="truncate">https://www.{businessName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com</span>
            </div>

            <div className="flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 text-muted-c cursor-pointer hover:text-primary-c" onClick={() => window.location.reload()} />
            </div>
          </div>

          {/* ── Simulated Business Website Page Content ── */}
          <div className="p-6 space-y-8 min-h-[650px] bg-slate-50/50 dark:bg-ink-950/40">
            {/* Nav Header */}
            <header className="flex items-center justify-between border-b border-base-c pb-4">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white font-extrabold text-sm shadow-md">
                  {businessName.charAt(0).toUpperCase()}
                </div>
                <span className="text-base font-extrabold tracking-tight text-primary-c">{businessName}</span>
              </div>
              <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-secondary-c">
                <a href="#services" className="hover:text-primary-c">Services</a>
                <a href="#features" className="hover:text-primary-c">Features</a>
                <a href="#pricing" className="hover:text-primary-c">Pricing</a>
                <a href="#contact" className="hover:text-primary-c">Contact Us</a>
              </nav>
              <button
                onClick={triggerWidgetOpen}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-sm transition-all"
              >
                Live Chat Support
              </button>
            </header>

            {/* Hero Section */}
            <section className="text-center py-10 max-w-3xl mx-auto space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                <Zap className="h-3.5 w-3.5" />
                Next-Gen {businessNiche} Platform
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary-c leading-tight">
                Empowering Your Growth with Instant AI Automation
              </h1>
              <p className="text-sm text-secondary-c leading-relaxed max-w-2xl mx-auto">
                Welcome to <strong className="text-primary-c">{businessName}</strong>. Our intelligent AI Chatbot assistant is available 24/7 at the bottom right corner of this website to answer your questions, book appointments, and assist you in real time.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={triggerWidgetOpen}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 text-xs font-bold shadow-lg shadow-blue-500/25 transition-all hover:scale-105"
                >
                  <MessageSquare className="h-4 w-4" />
                  Start Live AI Chat
                </button>
                <a
                  href="https://www.gyanvaniai.online/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-xl border border-base-c bg-card-c px-4 py-2.5 text-xs font-semibold text-secondary-c hover:text-primary-c transition-colors"
                >
                  View Privacy Policy <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </section>

            {/* Features Grid */}
            <section className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
              <div className="rounded-xl border border-base-c bg-card-c p-4 space-y-2 shadow-xs">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Bot className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-primary-c">24/7 AI Assistance</h4>
                <p className="text-[11px] text-muted-c leading-relaxed">
                  Instant answers to client queries powered by advanced natural language processing.
                </p>
              </div>

              <div className="rounded-xl border border-base-c bg-card-c p-4 space-y-2 shadow-xs">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-primary-c">Verified Security & CRM</h4>
                <p className="text-[11px] text-muted-c leading-relaxed">
                  All customer chats are automatically logged and synchronized with your CRM lead pipeline.
                </p>
              </div>

              <div className="rounded-xl border border-base-c bg-card-c p-4 space-y-2 shadow-xs sm:col-span-2 md:col-span-1">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-primary-c">Custom Brand Parity</h4>
                <p className="text-[11px] text-muted-c leading-relaxed">
                  Custom colors, company logo, custom avatars, and instant WhatsApp handoff.
                </p>
              </div>
            </section>

            {/* Banner Callout */}
            <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-base font-bold">Have Questions? Talk to our AI Assistant right now!</h3>
                <p className="text-xs text-blue-100">
                  Click the floating chat widget icon at the bottom right corner of this screen to test live responses.
                </p>
              </div>
              <button
                onClick={triggerWidgetOpen}
                className="shrink-0 rounded-xl bg-white text-blue-700 hover:bg-blue-50 px-4 py-2.5 text-xs font-bold shadow-md transition-all hover:scale-105"
              >
                Launch Chatbot
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
