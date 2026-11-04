import React, { useState } from 'react';
import {
  Monitor,
  Smartphone,
  MessageSquare,
  X,
  Send,
  Sparkles,
  Shield,
  Zap,
  Users,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import {
  RobotCyan3DGraphic,
  RobotPurple3DGraphic,
  SparkleOrbGraphic,
  SupportHumanGraphic,
} from './AvatarGraphics';

export interface WebsiteSimulatorProps {
  businessName: string;
  primaryColor: string;
  secondaryColor?: string;
  logoUrl?: string;
  widgetIconUrl?: string;
  launcherStyle: 'ROBOT_BUBBLE' | 'AVATAR_ONLY' | 'CIRCULAR_BUTTON' | 'PILL_BUTTON' | 'CUSTOM_PNG';
  avatarPreset: 'ROBOT_CYAN_3D' | 'ROBOT_PURPLE_3D' | 'AI_SPARKLE_ORB' | 'SUPPORT_HUMAN' | 'CUSTOM';
  greetingBubbleText: string;
  greetingBubbleTheme: 'GRADIENT_PURPLE' | 'BRAND_COLOR' | 'DARK_SLEEK' | 'GLASSMORPHIC' | 'CLEAN_WHITE';
  greetingBubbleEnabled: boolean;
  botAnimation: 'FLOAT_BOB' | 'PULSE' | 'BOUNCE' | 'STATIC';
  animationSpeed?: number;
}

export const WebsiteSimulator: React.FC<WebsiteSimulatorProps> = ({
  businessName,
  primaryColor,
  secondaryColor = '#0f172a',
  logoUrl,
  widgetIconUrl,
  launcherStyle,
  avatarPreset,
  greetingBubbleText,
  greetingBubbleTheme,
  greetingBubbleEnabled,
  botAnimation,
  animationSpeed = 2.4,
}) => {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // Determine Bubble Theme Styles
  const getBubbleStyle = () => {
    switch (greetingBubbleTheme) {
      case 'GRADIENT_PURPLE':
        return {
          background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 45%, #9333ea 100%)',
          color: '#ffffff',
          boxShadow: '0 10px 25px -4px rgba(147, 51, 234, 0.45)',
        };
      case 'BRAND_COLOR':
        return {
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          color: '#ffffff',
          boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.25)',
        };
      case 'DARK_SLEEK':
        return {
          background: '#0f172a',
          color: '#f8fafc',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 10px 25px -4px rgba(0, 0, 0, 0.45)',
        };
      case 'GLASSMORPHIC':
        return {
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          color: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.15)',
        };
      case 'CLEAN_WHITE':
      default:
        return {
          background: '#ffffff',
          color: '#1e293b',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.12)',
        };
    }
  };

  const getTailColor = () => {
    switch (greetingBubbleTheme) {
      case 'GRADIENT_PURPLE':
        return '#9333ea';
      case 'BRAND_COLOR':
        return secondaryColor || primaryColor;
      case 'DARK_SLEEK':
        return '#0f172a';
      case 'GLASSMORPHIC':
        return 'rgba(255, 255, 255, 0.88)';
      case 'CLEAN_WHITE':
      default:
        return '#ffffff';
    }
  };

  const renderAvatarGraphic = () => {
    if (avatarPreset === 'CUSTOM' && (widgetIconUrl || logoUrl)) {
      return (
        <img
          src={widgetIconUrl || logoUrl}
          alt="Avatar"
          className="h-full w-full object-contain drop-shadow-md"
        />
      );
    }
    switch (avatarPreset) {
      case 'ROBOT_PURPLE_3D':
        return <RobotPurple3DGraphic />;
      case 'AI_SPARKLE_ORB':
        return <SparkleOrbGraphic />;
      case 'SUPPORT_HUMAN':
        return <SupportHumanGraphic />;
      case 'ROBOT_CYAN_3D':
      default:
        return <RobotCyan3DGraphic />;
    }
  };

  // Animation Style
  const getAnimationClass = () => {
    switch (botAnimation) {
      case 'FLOAT_BOB':
        return 'animate-bounce-subtle';
      case 'PULSE':
        return 'animate-pulse';
      case 'BOUNCE':
        return 'animate-bounce';
      case 'STATIC':
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col rounded-2xl border border-base-c bg-card-c shadow-sm overflow-hidden">
      {/* ── Browser Chrome Toolbar ── */}
      <div className="flex items-center justify-between border-b border-base-c bg-subtle-c/60 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* macOS 3 Dots */}
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56] inline-block shadow-sm" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e] inline-block shadow-sm" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f] inline-block shadow-sm" />
          </div>

          {/* Browser URL Input Simulation */}
          <div className="flex items-center gap-1.5 rounded-md border border-base-c bg-card-c px-3 py-1 text-[11px] text-muted-c shadow-2xs">
            <Lock className="h-3 w-3 text-emerald-500" />
            <span className="font-mono text-secondary-c">
              https://{businessName ? businessName.toLowerCase().replace(/[^a-z0-9]/g, '') : 'company'}.com
            </span>
          </div>
        </div>

        {/* Viewport Switcher */}
        <div className="flex items-center gap-1 rounded-lg border border-base-c bg-card-c p-0.5">
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              viewport === 'desktop'
                ? 'bg-primary-50 text-primary-600 shadow-xs dark:bg-primary-950/60 dark:text-primary-300'
                : 'text-muted-c hover:text-secondary-c'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setViewport('mobile')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
              viewport === 'mobile'
                ? 'bg-primary-50 text-primary-600 shadow-xs dark:bg-primary-950/60 dark:text-primary-300'
                : 'text-muted-c hover:text-secondary-c'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Mobile</span>
          </button>
        </div>
      </div>

      {/* ── Simulated Website Body ── */}
      <div className="relative flex min-h-[500px] items-center justify-center bg-subtle-c/30 p-3 sm:p-5 overflow-hidden">
        <div
          className={`relative flex flex-col overflow-hidden rounded-xl border border-base-c bg-card-c shadow-xl transition-all duration-300 ${
            viewport === 'desktop' ? 'h-[500px] w-full' : 'h-[520px] w-[340px] max-w-full'
          }`}
        >
          {/* Simulated Brand Nav */}
          <div className="flex items-center justify-between border-b border-base-c/60 bg-card-c/90 px-4 py-2.5 backdrop-blur-md">
            <div className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-6 w-6 rounded-md object-contain" />
              ) : (
                <div
                  className="grid h-6 w-6 place-items-center rounded-lg text-[10px] font-bold text-white shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  {businessName ? businessName.slice(0, 2).toUpperCase() : 'AI'}
                </div>
              )}
              <span className="text-xs font-bold text-primary-c">
                {businessName || 'Enterprise Cloud'}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-[11px] font-medium text-secondary-c">
              <span className="hover:text-primary-600 cursor-pointer">Platform</span>
              <span className="hover:text-primary-600 cursor-pointer">Solutions</span>
              <span className="hover:text-primary-600 cursor-pointer">Pricing</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="hidden sm:inline-flex rounded-md border border-base-c px-2.5 py-1 text-[11px] font-semibold text-secondary-c hover:bg-subtle-c"
              >
                Log In
              </button>
              <button
                type="button"
                className="rounded-md px-2.5 py-1 text-[11px] font-bold text-white shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                Start Free
              </button>
            </div>
          </div>

          {/* Simulated Landing Page Hero */}
          <div className="relative flex flex-1 flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
            {/* Subtle Grid Pattern Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <div className="relative z-10 max-w-md space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                <Sparkles className="h-3 w-3" />
                <span>Next-Gen Conversational Agent</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-primary-c leading-tight">
                Engage Visitors, Capture Leads, &amp; Close Deals Automatically
              </h1>

              <p className="text-xs text-muted-c max-w-xs mx-auto leading-relaxed">
                Connect with prospective buyers the exact moment they land on your site with AI-driven human workflows.
              </p>

              <div className="flex items-center justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  className="rounded-lg px-4 py-2 text-xs font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
                  style={{ backgroundColor: primaryColor }}
                >
                  Start Free Trial
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-base-c bg-card-c px-3 py-2 text-xs font-semibold text-secondary-c hover:bg-subtle-c"
                >
                  Request Demo
                </button>
              </div>

              {/* Feature Highlights Row */}
              <div className="pt-3 hidden sm:flex items-center justify-center gap-4 text-[10px] text-muted-c">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Instant SLA Reply
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-indigo-500" />
                  SOC2 Certified
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-500" />
                  CRM Auto-Sync
                </span>
              </div>
            </div>
          </div>

          {/* ── BOT LAUNCHER & GREETING BUBBLE IN CORNER ── */}
          <div className="absolute bottom-4 right-4 z-30 flex flex-col items-end pointer-events-auto">
            {/* Opened Chat Window Simulation */}
            {isChatOpen ? (
              <div className="w-[310px] max-w-[92vw] rounded-2xl border border-base-c bg-card-c shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Chat Header */}
                <div
                  className="flex items-center justify-between p-3 text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-white/20 text-white font-bold text-xs shadow-xs overflow-hidden">
                      {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-cover" /> : 'AI'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-tight">{businessName || 'AI Assistant'}</h4>
                      <span className="text-[10px] text-white/80 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                        Online &amp; Ready
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChatOpen(false)}
                    className="rounded-lg p-1 hover:bg-white/20 transition-colors"
                    title="Close preview"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Chat Messages Body */}
                <div className="p-3.5 space-y-2.5 bg-subtle-c/50 min-h-[170px] max-h-[220px] overflow-y-auto">
                  <div className="flex items-start gap-2">
                    <div
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-white text-[9px] font-bold shadow-xs"
                      style={{ backgroundColor: primaryColor }}
                    >
                      AI
                    </div>
                    <div
                      className="rounded-2xl rounded-tl-xs px-3.5 py-2 text-xs text-white shadow-xs max-w-[85%]"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {greetingBubbleText || 'How can I help you today?'}
                    </div>
                  </div>
                </div>

                {/* Chat Composer */}
                <div className="flex items-center gap-2 border-t border-base-c p-2.5 bg-card-c">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a test message…"
                    className="flex-1 rounded-lg border border-base-c bg-subtle-c px-3 py-1.5 text-xs text-primary-c placeholder:text-muted-c focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    className="grid h-7 w-7 place-items-center rounded-lg text-white shadow-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* Closed Launcher Mode */
              <div
                className={`flex flex-col items-end cursor-pointer group select-none ${getAnimationClass()}`}
                style={{
                  animationDuration: `${animationSpeed}s`,
                }}
              >
                {/* Speech Greeting Bubble (if enabled and applicable) */}
                {(launcherStyle === 'ROBOT_BUBBLE' || launcherStyle === 'CUSTOM_PNG') && greetingBubbleEnabled && (
                  <div
                    onClick={() => setIsChatOpen(true)}
                    className="relative mb-2.5 mr-2 rounded-full px-5 py-2 text-[13px] font-bold tracking-tight transition-transform duration-200 group-hover:scale-105 active:scale-95 max-w-[240px] text-center"
                    style={getBubbleStyle()}
                  >
                    <span>{greetingBubbleText || 'How can I help you today?'}</span>

                    {/* Accurate SVG Speech Tail Pointer */}
                    <svg
                      viewBox="0 0 14 8"
                      className="absolute -bottom-2 right-6 h-2 w-3.5 overflow-visible"
                      style={{ fill: getTailColor() }}
                    >
                      <path d="M0 0 L14 0 L7 8 Z" />
                    </svg>
                  </div>
                )}

                {/* Launcher Button / Avatar Graphic */}
                {launcherStyle === 'ROBOT_BUBBLE' || launcherStyle === 'AVATAR_ONLY' ? (
                  <button
                    type="button"
                    onClick={() => setIsChatOpen(true)}
                    className="h-16 w-16 transition-transform group-hover:scale-110 active:scale-95 relative focus:outline-none"
                    title="Click to test chat window"
                  >
                    {renderAvatarGraphic()}
                  </button>
                ) : launcherStyle === 'PILL_BUTTON' ? (
                  <button
                    type="button"
                    onClick={() => setIsChatOpen(true)}
                    className="flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-transform group-hover:scale-105 active:scale-95"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Chat with us</span>
                  </button>
                ) : launcherStyle === 'CUSTOM_PNG' ? (
                  <button
                    type="button"
                    onClick={() => setIsChatOpen(true)}
                    className="h-16 w-16 transition-transform group-hover:scale-110 active:scale-95 relative focus:outline-none"
                    title="Custom Brand Mascot"
                  >
                    {widgetIconUrl || logoUrl ? (
                      <img
                        src={widgetIconUrl || logoUrl}
                        alt="Brand Mascot"
                        className="h-full w-full object-contain drop-shadow-md"
                      />
                    ) : (
                      <div
                        className="h-14 w-14 rounded-full grid place-items-center text-white shadow-lg"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <MessageSquare className="h-6 w-6" />
                      </div>
                    )}
                  </button>
                ) : (
                  /* CIRCULAR_BUTTON */
                  <button
                    type="button"
                    onClick={() => setIsChatOpen(true)}
                    className="grid h-14 w-14 place-items-center rounded-full text-white shadow-xl transition-transform group-hover:scale-110 active:scale-95 focus:outline-none"
                    style={{ backgroundColor: primaryColor }}
                    title="Open chat"
                  >
                    <MessageSquare className="h-6 w-6" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
