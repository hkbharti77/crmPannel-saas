import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchCurrentUserProfile, type UserProfileDto } from '@/lib/userApi';
import { useNavigate } from 'react-router-dom';
import { GlassCard, Badge } from '@/components/ui/primitives';
import {
  Sparkles,
  MessageSquare,
  Bot,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Clock,
  Layers,
  MapPin,
  ShoppingBag,
  Send,
  Share2,
  FileText,
  Settings,
  RefreshCw,
  CheckCircle2,
  PhoneCall,
  ExternalLink,
} from 'lucide-react';

export function LiveDemoView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
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
  const businessName =
    profile?.businessName ||
    ((user as Record<string, unknown>)?.businessName as string) ||
    ((user as Record<string, unknown>)?.name as string) ||
    user?.email?.split('@')[0] ||
    'Nexus AI';

  const rawApiBase = (import.meta.env.VITE_API_BASE_URL || '').trim();
  const apiBase =
    rawApiBase ||
    (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? `${window.location.origin}`
      : 'http://localhost:8080');

  // Trigger floating chatbot widget programmatically
  const handleOpenWidget = (initialQuery?: string) => {
    const launcher = document.getElementById('chat-toggle') || document.querySelector('.chat-button');
    if (launcher) {
      (launcher as HTMLElement).click();
      if (initialQuery) {
        setTimeout(() => {
          const input = document.getElementById('chat-input') as HTMLInputElement | HTMLTextAreaElement;
          if (input) {
            input.value = initialQuery;
            input.focus();
          }
        }, 300);
      }
    }
  };

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

  // Preset conversation testing scenarios
  const presetScenarios = [
    {
      id: 'location',
      title: 'Location & Operating Hours',
      icon: MapPin,
      badge: 'Location Info',
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      description: 'Tests if your AI assistant accurately shares your physical office/store location and business hours.',
      query: 'Where are your offices and store locations, and what are your working hours?',
    },
    {
      id: 'catalog',
      title: 'Product Catalog & Pricing',
      icon: ShoppingBag,
      badge: 'Catalog & Deals',
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      description: 'Tests automated presentation of products, services, package tiers, and active promotional discounts.',
      query: 'Can you show me your product catalog, current price list, and active discount offers?',
    },
    {
      id: 'appointment',
      title: 'Appointment & Consultation Booking',
      icon: Calendar,
      badge: 'Calendar Booking',
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      description: 'Tests Google Calendar integration, slot recommendation, and automated meeting scheduling.',
      query: 'I would like to schedule a 15-minute consultation with an expert.',
    },
    {
      id: 'lead-quote',
      title: 'Lead Qualification & Custom Quote',
      icon: Zap,
      badge: 'Lead Capture',
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      description: 'Tests conversational capture of customer name, email, phone number, and project budget.',
      query: 'I need a custom quotation for my company. What details do you need from me?',
    },
    {
      id: 'order-status',
      title: 'Order Status & Tracking',
      icon: FileText,
      badge: 'Support Workflow',
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      description: 'Simulates a customer checking service progress, delivery tracking, or support ticket status.',
      query: 'Can you check the delivery status of my recent service order?',
    },
    {
      id: 'whatsapp-handoff',
      title: 'WhatsApp Agent Handoff',
      icon: PhoneCall,
      badge: 'Multi-Channel',
      color: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
      description: 'Tests omnichannel transfer from website live chat directly to WhatsApp Business conversation.',
      query: 'Can I speak to a live human representative on WhatsApp right now?',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8">
      {/* Page Header (Consistent with CRM style) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/20 via-indigo-600/15 to-purple-600/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-md shadow-blue-500/5">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-primary-c lg:text-2xl">
                AI Assistant Simulator & Omnichannel Studio
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                  scriptLoaded
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    scriptLoaded ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'
                  }`}
                />
                {scriptLoaded ? 'Bot Connected' : 'Connecting Engine...'}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-secondary-c">
              Preset customer conversation testing, location queries, and marketing automation for{' '}
              <strong className="text-primary-c font-semibold">{businessName}</strong>.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleOpenWidget()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Launch Chatbot</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/settings/branding')}
            className="inline-flex items-center gap-2 rounded-xl border border-base-c bg-card-c px-3.5 py-2 text-xs font-bold text-secondary-c hover:text-primary-c hover:border-primary-500/40 shadow-xs transition-all cursor-pointer"
            title="Configure Chat Widget Appearance"
          >
            <Settings className="h-3.5 w-3.5 text-blue-500" />
            <span>Widget Settings</span>
          </button>
        </div>
      </div>

      {/* Top KPI Metrics Row */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <GlassCard className="p-4 flex items-center gap-3.5">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-secondary-c font-medium">AI Latency</div>
            <div className="text-lg font-black text-primary-c tracking-tight">&lt; 1.2s</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Real-time Streaming
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3.5">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-secondary-c font-medium">Lead Conversion</div>
            <div className="text-lg font-black text-primary-c tracking-tight">3.4x Higher</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Auto Pipeline Sync
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3.5">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-secondary-c font-medium">Connected Channels</div>
            <div className="text-lg font-black text-primary-c tracking-tight">4 Omnichannel</div>
            <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
              WhatsApp • Web • Email • Social
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3.5">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-secondary-c font-medium">Knowledge Sync</div>
            <div className="text-lg font-black text-primary-c tracking-tight">Zero Hallucination</div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
              Trained on Business FAQs
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Preset Inquiries & Scenarios Grid ("used to preset the pages location and other") */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-primary-c flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              Preset Conversation Scenarios
            </h2>
            <p className="text-xs text-secondary-c">
              Test how your AI bot handles location questions, product catalogs, appointment bookings, and lead quotes.
            </p>
          </div>
          <span className="text-xs text-muted-c font-medium hidden sm:inline">
            Click any scenario to test live in widget
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {presetScenarios.map((s) => {
            const Icon = s.icon;
            return (
              <GlassCard
                key={s.id}
                hover
                onClick={() => handleOpenWidget(s.query)}
                className="p-5 flex flex-col justify-between border border-base-c bg-card-c transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`grid h-10 w-10 place-items-center rounded-xl border ${s.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-md border border-base-c bg-subtle-c px-2 py-0.5 text-[10px] font-bold text-secondary-c">
                      {s.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-primary-c group-hover:text-blue-600 transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-xs text-secondary-c mt-1 leading-relaxed">
                    {s.description}
                  </p>

                  <div className="mt-3 rounded-xl border border-base-c bg-subtle-c/60 p-2.5 text-[11px] text-primary-c font-medium italic">
                    &ldquo;{s.query}&rdquo;
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-base-c/60 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Run Test in Bot</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Marketing & Omnichannel Visual Showcase Modules (Featuring Generated Visuals) */}
      <div className="space-y-4 pt-2">
        <div>
          <h2 className="text-base font-extrabold text-primary-c flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-500" />
            Marketing & Lead Automation Modules
          </h2>
          <p className="text-xs text-secondary-c">
            Visual breakdown of your multi-channel broadcast templates, catalog commerce, and sales pipeline synchronization.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 1: WhatsApp Marketing & Interactive Catalogs */}
          <GlassCard className="p-5 border border-base-c bg-card-c flex flex-col justify-between overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <Send className="h-3.5 w-3.5" />
                  Messaging Campaigns & Catalogs
                </span>
                <span className="text-[11px] text-muted-c font-medium">98% Open Rate</span>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-base-c aspect-video bg-subtle-c">
                <img
                  src="/assets/campaign_catalog_messaging.jpg"
                  alt="Conversational Product Catalog & Broadcast Templates"
                  className="w-full h-full object-cover"
                />
              </div>

              <h3 className="text-sm font-bold text-primary-c">
                Interactive Broadcasts, Catalogs & Quick Actions
              </h3>
              <p className="text-xs text-secondary-c leading-relaxed">
                Empower customers to browse products, select variants, and trigger automated checkout right inside the chat window. Send personalized flash deal broadcasts with trackable CTA buttons.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-base-c/60 flex items-center justify-between">
              <div className="text-[11px] text-secondary-c font-medium">
                • Interactive CTA Buttons • Live Product Cards
              </div>
              <button
                type="button"
                onClick={() => handleOpenWidget('Can you show me your product catalog and discounts?')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <MessageSquare className="h-3 w-3" />
                <span>Test Catalog</span>
              </button>
            </div>
          </GlassCard>

          {/* Card 2: Omnichannel CRM, Social Ads & Marketing Hub */}
          <GlassCard className="p-5 border border-base-c bg-card-c flex flex-col justify-between overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                  <Share2 className="h-3.5 w-3.5" />
                  Omnichannel Social Ads & CRM Hub
                </span>
                <span className="text-[11px] text-muted-c font-medium">Unified Pipeline</span>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-base-c aspect-video bg-subtle-c">
                <img
                  src="/assets/omnichannel_crm_marketing.jpg"
                  alt="Omnichannel Social Ads, Email & Lead Automation Hub"
                  className="w-full h-full object-cover"
                />
              </div>

              <h3 className="text-sm font-bold text-primary-c">
                Social Ad Lead Sync, Email Sequences & CRM Pipeline
              </h3>
              <p className="text-xs text-secondary-c leading-relaxed">
                Connect incoming leads from social media ad forms, email marketing blasts, and SMS campaigns directly into your pipeline. Prioritize opportunities with autonomous AI lead scoring.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-base-c/60 flex items-center justify-between">
              <div className="text-[11px] text-secondary-c font-medium">
                • Lead Score Prioritization • Multi-Step Sequences
              </div>
              <button
                type="button"
                onClick={() => handleOpenWidget('How does lead qualification and CRM sync work?')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Zap className="h-3 w-3" />
                <span>Test Lead Capture</span>
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Card 3: Executive Growth & AI Performance Banner */}
        <GlassCard className="p-5 border border-base-c bg-card-c overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            <div className="md:col-span-5 relative rounded-2xl overflow-hidden border border-base-c aspect-video md:aspect-[4/3] bg-subtle-c">
              <img
                src="/assets/hero_lady_presenter.jpg"
                alt="Executive AI Customer Engagement and Revenue Growth"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="md:col-span-7 space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="h-3.5 w-3.5" />
                Executive Revenue & AI Insights
              </div>

              <h3 className="text-lg font-bold text-primary-c">
                Autonomous Business Engagement & Growth
              </h3>

              <p className="text-xs text-secondary-c leading-relaxed">
                Your AI bot acts as a tireless, top-performing sales representative that never sleeps. It answers inquiries within 1.5 seconds, gathers customer requirements, books discovery calls, and enters qualified deals straight into your CRM pipeline.
              </p>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="rounded-xl border border-base-c bg-subtle-c/50 p-2.5 text-center">
                  <div className="text-sm font-black text-primary-c">+42%</div>
                  <div className="text-[10px] text-muted-c">Revenue Velocity</div>
                </div>
                <div className="rounded-xl border border-base-c bg-subtle-c/50 p-2.5 text-center">
                  <div className="text-sm font-black text-primary-c">24/7</div>
                  <div className="text-[10px] text-muted-c">Active Coverage</div>
                </div>
                <div className="rounded-xl border border-base-c bg-subtle-c/50 p-2.5 text-center">
                  <div className="text-sm font-black text-primary-c">99.8%</div>
                  <div className="text-[10px] text-muted-c">Customer CSAT</div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenWidget('Can you introduce your business and services?')}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  <Bot className="h-3.5 w-3.5" />
                  <span>Start Full Live AI Demonstration</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Floating Quick Action Callout in CRM */}
      <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-md">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-primary-c">Ready to test in real-time?</div>
            <div className="text-[11px] text-secondary-c">
              Click the floating chat widget bubble in the bottom-right corner to interact with your live assistant.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleOpenWidget()}
          className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-bold shadow-md transition-all whitespace-nowrap cursor-pointer shrink-0"
        >
          Open Chat Widget
        </button>
      </div>
    </div>
  );
}



