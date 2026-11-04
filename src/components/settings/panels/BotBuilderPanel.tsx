import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  MessageSquare,
  Check,
  Loader2,
  RotateCcw,
  ExternalLink,
  Copy,
  Upload,
  Code,
  CheckCircle2,
  AlertCircle,
  Eye,
  HelpCircle,
  X,
  SlidersHorizontal,
  Layers,
  Activity,
  FileCode2,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import {
  fetchCurrentUserProfile,
  updateCurrentUserProfile,
  uploadWidgetIcon,
  type UserProfileDto,
} from '@/lib/userApi';
import { WebsiteSimulator } from '../bot-builder/WebsiteSimulator';
import {
  RobotCyan3DGraphic,
  RobotPurple3DGraphic,
  SparkleOrbGraphic,
  SupportHumanGraphic,
} from '../bot-builder/AvatarGraphics';

export const BotBuilderPanel: React.FC = () => {
  // Persistence state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tenant / Brand basics
  const [businessName, setBusinessName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [secondaryColor, setSecondaryColor] = useState('#0f172a');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [widgetIconUrl, setWidgetIconUrl] = useState<string>('');
  const [tenantId, setTenantId] = useState<string>('');

  // 1. Launcher Style
  const [launcherStyle, setLauncherStyle] = useState<
    'ROBOT_BUBBLE' | 'AVATAR_ONLY' | 'CIRCULAR_BUTTON' | 'PILL_BUTTON' | 'CUSTOM_PNG'
  >('ROBOT_BUBBLE');

  // 2. Avatar Preset
  const [avatarPreset, setAvatarPreset] = useState<
    'ROBOT_CYAN_3D' | 'ROBOT_PURPLE_3D' | 'AI_SPARKLE_ORB' | 'SUPPORT_HUMAN' | 'CUSTOM'
  >('ROBOT_CYAN_3D');

  // 3. Greeting Bubble
  const [greetingBubbleEnabled, setGreetingBubbleEnabled] = useState(true);
  const [greetingBubbleText, setGreetingBubbleText] = useState('How can I help you today?');
  const [greetingBubbleTheme, setGreetingBubbleTheme] = useState<
    'GRADIENT_PURPLE' | 'BRAND_COLOR' | 'DARK_SLEEK' | 'GLASSMORPHIC' | 'CLEAN_WHITE'
  >('GRADIENT_PURPLE');

  // 4. Animation Settings
  const [botAnimation, setBotAnimation] = useState<'FLOAT_BOB' | 'PULSE' | 'BOUNCE' | 'STATIC'>('FLOAT_BOB');
  const [animationSpeed, setAnimationSpeed] = useState<number>(2.4);

  // Original saved state tracking for draft detection & reset
  const [originalConfig, setOriginalConfig] = useState<Partial<UserProfileDto>>({});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Modals & Popups
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchCurrentUserProfile().then((res) => {
      setLoading(false);
      if (res.data) {
        const u = res.data;
        setBusinessName(u.businessName || '');
        if (u.primaryColor) setPrimaryColor(u.primaryColor);
        if (u.secondaryColor) setSecondaryColor(u.secondaryColor);
        if (u.logoUrl) setLogoUrl(u.logoUrl);
        if (u.widgetIconUrl) setWidgetIconUrl(u.widgetIconUrl);
        if (u.tenantId || u.id) setTenantId(u.tenantId || u.id);

        if (u.launcherStyle) setLauncherStyle(u.launcherStyle as any);
        if (u.avatarPreset) setAvatarPreset(u.avatarPreset as any);
        if (u.greetingBubbleText) setGreetingBubbleText(u.greetingBubbleText);
        if (u.greetingBubbleTheme) setGreetingBubbleTheme(u.greetingBubbleTheme as any);
        if (typeof u.greetingBubbleEnabled === 'boolean') setGreetingBubbleEnabled(u.greetingBubbleEnabled);
        if (u.botAnimation) setBotAnimation(u.botAnimation as any);

        setOriginalConfig({
          launcherStyle: u.launcherStyle || 'ROBOT_BUBBLE',
          avatarPreset: u.avatarPreset || 'ROBOT_CYAN_3D',
          greetingBubbleText: u.greetingBubbleText || 'How can I help you today?',
          greetingBubbleTheme: u.greetingBubbleTheme || 'GRADIENT_PURPLE',
          greetingBubbleEnabled: u.greetingBubbleEnabled !== false,
          botAnimation: u.botAnimation || 'FLOAT_BOB',
          widgetIconUrl: u.widgetIconUrl || '',
        });
      }
    });
  }, []);

  // Determine if there are unsaved draft modifications
  const isDraftModified =
    launcherStyle !== (originalConfig.launcherStyle || 'ROBOT_BUBBLE') ||
    avatarPreset !== (originalConfig.avatarPreset || 'ROBOT_CYAN_3D') ||
    greetingBubbleText !== (originalConfig.greetingBubbleText || 'How can I help you today?') ||
    greetingBubbleTheme !== (originalConfig.greetingBubbleTheme || 'GRADIENT_PURPLE') ||
    greetingBubbleEnabled !== (originalConfig.greetingBubbleEnabled !== false) ||
    botAnimation !== (originalConfig.botAnimation || 'FLOAT_BOB') ||
    widgetIconUrl !== (originalConfig.widgetIconUrl || '');

  // Reset to original saved state
  const handleReset = () => {
    if (!originalConfig) return;
    setLauncherStyle((originalConfig.launcherStyle as any) || 'ROBOT_BUBBLE');
    setAvatarPreset((originalConfig.avatarPreset as any) || 'ROBOT_CYAN_3D');
    setGreetingBubbleText(originalConfig.greetingBubbleText || 'How can I help you today?');
    setGreetingBubbleTheme((originalConfig.greetingBubbleTheme as any) || 'GRADIENT_PURPLE');
    setGreetingBubbleEnabled(originalConfig.greetingBubbleEnabled !== false);
    setBotAnimation((originalConfig.botAnimation as any) || 'FLOAT_BOB');
    setWidgetIconUrl(originalConfig.widgetIconUrl || '');
    setErrorMsg(null);
  };

  // Custom Avatar / Mascot PNG Upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('png') && !file.type.includes('webp')) {
      setErrorMsg('❌ Avatar must be a transparent PNG or WebP file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('❌ Avatar file size must not exceed 2MB.');
      return;
    }

    try {
      setUploadingAvatar(true);
      setErrorMsg(null);
      const res = await uploadWidgetIcon(file);
      setUploadingAvatar(false);
      if (res.data?.widgetIconUrl) {
        setWidgetIconUrl(res.data.widgetIconUrl);
        setAvatarPreset('CUSTOM');
        setLauncherStyle('CUSTOM_PNG');
      } else {
        setErrorMsg('Failed to upload avatar graphic.');
      }
    } catch (err: any) {
      setUploadingAvatar(false);
      setErrorMsg(err.message || 'Error uploading file');
    }
  };

  // Save changes to backend
  const handleSaveChanges = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload: Partial<UserProfileDto> = {
      launcherStyle,
      avatarPreset,
      greetingBubbleText: greetingBubbleText.trim(),
      greetingBubbleTheme,
      greetingBubbleEnabled,
      botAnimation,
      widgetIconUrl,
    };

    const res = await updateCurrentUserProfile(payload);
    setSaving(false);

    if (res.error) {
      setErrorMsg(`❌ Failed to save configuration: ${res.error}`);
    } else {
      setSuccessMsg('✅ Bot Builder configuration updated & published across all live websites!');
      setOriginalConfig({ ...originalConfig, ...payload });
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const widgetScriptUrl = `${window.location.origin}/chat-widget.js`;
  const embedCodeSnippet = `<!-- CRMLite Chat Widget -->\n<script\n  src="${widgetScriptUrl}"\n  data-business-id="${tenantId || 'YOUR_BUSINESS_ID'}"\n  async>\n</script>`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(embedCodeSnippet);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-c">
        <Loader2 className="h-7 w-7 animate-spin text-primary-500" />
        <span className="text-xs font-semibold tracking-wide">Loading Bot Builder Studio…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── ENTERPRISE STUDIO HEADER ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-base-c bg-card-c p-5 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-primary-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-primary-500/20">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold text-primary-c">Bot Builder Studio</h1>
              <span className="rounded-full bg-primary-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-600 border border-primary-500/20">
                Engine v2.0
              </span>
              {isDraftModified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Unsaved Draft
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Live &amp; Deployed
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-secondary-c">
              Design, customize, and deploy your floating 3D avatar &amp; interactive website chat launcher.
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-base-c bg-card-c px-3 py-2 text-xs font-semibold text-secondary-c hover:bg-subtle-c transition-colors shadow-2xs"
          >
            <HelpCircle className="h-3.5 w-3.5 text-muted-c" />
            <span>Styles Guide</span>
          </button>

          <button
            type="button"
            onClick={() => window.open('/demo', '_blank')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-base-c bg-card-c px-3 py-2 text-xs font-semibold text-secondary-c hover:bg-subtle-c transition-colors shadow-2xs"
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-c" />
            <span>Preview in Tab</span>
          </button>

          {isDraftModified && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-base-c bg-card-c px-3 py-2 text-xs font-semibold text-secondary-c hover:bg-subtle-c transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            disabled={saving || !isDraftModified}
            onClick={handleSaveChanges}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-all ${
              saving || !isDraftModified
                ? 'opacity-50 cursor-not-allowed bg-slate-400'
                : 'bg-primary-600 hover:bg-primary-700 active:scale-95 shadow-primary-500/25'
            }`}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            <span>{saving ? 'Publishing…' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── MAIN STUDIO GRID ── */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: Controls Dashboard (5 cols) */}
        <div className="space-y-5 lg:col-span-5">
          {/* SECTION 1: Launcher Style Selector */}
          <div className="rounded-2xl border border-base-c bg-card-c p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-base-c/60 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary-c">
                  1. Launcher Style
                </span>
              </div>
              <span className="rounded-full bg-subtle-c px-2 py-0.5 text-[10px] font-bold text-muted-c">
                5 Styles Available
              </span>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {/* Option 1: 3D Robot + Bubble (Recommended Default) */}
              <div
                onClick={() => setLauncherStyle('ROBOT_BUBBLE')}
                className={`relative flex flex-col justify-between rounded-xl border-2 p-3 cursor-pointer transition-all ${
                  launcherStyle === 'ROBOT_BUBBLE'
                    ? 'border-primary-600 bg-primary-500/5 ring-1 ring-primary-500/20 shadow-xs'
                    : 'border-base-c hover:border-base-c/80 bg-card-c'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="rounded-full bg-primary-600 text-white text-[9px] font-bold px-1.5 py-0.5 shadow-2xs">
                    Recommended
                  </span>
                  {launcherStyle === 'ROBOT_BUBBLE' && (
                    <div className="h-4 w-4 rounded-full bg-primary-600 text-white grid place-items-center">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Mini Preview Graphic */}
                <div className="h-16 w-full rounded-lg bg-subtle-c/60 flex flex-col items-center justify-center relative p-1.5 overflow-hidden mb-2">
                  <div className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-[8px] font-bold text-white px-2 py-0.5 shadow-xs mb-1">
                    How can I help?
                  </div>
                  <div className="h-9 w-9">
                    <RobotCyan3DGraphic />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-primary-c">3D Robot + Bubble</h4>
                  <p className="mt-0.5 text-[10px] text-muted-c line-clamp-2">
                    Floating metallic mascot with glowing eyes and reactive greeting speech tail.
                  </p>
                </div>
              </div>

              {/* Option 2: Robot Avatar Only */}
              <div
                onClick={() => setLauncherStyle('AVATAR_ONLY')}
                className={`relative flex flex-col justify-between rounded-xl border-2 p-3 cursor-pointer transition-all ${
                  launcherStyle === 'AVATAR_ONLY'
                    ? 'border-primary-600 bg-primary-500/5 ring-1 ring-primary-500/20 shadow-xs'
                    : 'border-base-c hover:border-base-c/80 bg-card-c'
                }`}
              >
                <div className="flex items-center justify-end mb-2 h-4">
                  {launcherStyle === 'AVATAR_ONLY' && (
                    <div className="h-4 w-4 rounded-full bg-primary-600 text-white grid place-items-center">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="h-16 w-full rounded-lg bg-subtle-c/60 flex items-center justify-center p-1.5 mb-2">
                  <div className="h-11 w-11">
                    <RobotCyan3DGraphic />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-primary-c">Avatar Mascot Only</h4>
                  <p className="mt-0.5 text-[10px] text-muted-c line-clamp-2">
                    Clean floating character without persistent text bubble for minimal sites.
                  </p>
                </div>
              </div>

              {/* Option 3: Circular FAB Button */}
              <div
                onClick={() => setLauncherStyle('CIRCULAR_BUTTON')}
                className={`relative flex flex-col justify-between rounded-xl border-2 p-3 cursor-pointer transition-all ${
                  launcherStyle === 'CIRCULAR_BUTTON'
                    ? 'border-primary-600 bg-primary-500/5 ring-1 ring-primary-500/20 shadow-xs'
                    : 'border-base-c hover:border-base-c/80 bg-card-c'
                }`}
              >
                <div className="flex items-center justify-end mb-2 h-4">
                  {launcherStyle === 'CIRCULAR_BUTTON' && (
                    <div className="h-4 w-4 rounded-full bg-primary-600 text-white grid place-items-center">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="h-16 w-full rounded-lg bg-subtle-c/60 flex items-center justify-center p-1.5 mb-2">
                  <div
                    className="h-10 w-10 rounded-full grid place-items-center text-white shadow-md"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <MessageSquare className="h-5 w-5" />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-primary-c">Circular Button</h4>
                  <p className="mt-0.5 text-[10px] text-muted-c line-clamp-2">
                    Classic 56px floating action button with chat icon and smooth hover physics.
                  </p>
                </div>
              </div>

              {/* Option 4: Pill Button */}
              <div
                onClick={() => setLauncherStyle('PILL_BUTTON')}
                className={`relative flex flex-col justify-between rounded-xl border-2 p-3 cursor-pointer transition-all ${
                  launcherStyle === 'PILL_BUTTON'
                    ? 'border-primary-600 bg-primary-500/5 ring-1 ring-primary-500/20 shadow-xs'
                    : 'border-base-c hover:border-base-c/80 bg-card-c'
                }`}
              >
                <div className="flex items-center justify-end mb-2 h-4">
                  {launcherStyle === 'PILL_BUTTON' && (
                    <div className="h-4 w-4 rounded-full bg-primary-600 text-white grid place-items-center">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="h-16 w-full rounded-lg bg-subtle-c/60 flex items-center justify-center p-1.5 mb-2">
                  <div
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold text-white shadow-md"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <MessageSquare className="h-3 w-3" />
                    <span>Chat with us</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-primary-c">Pill Label Button</h4>
                  <p className="mt-0.5 text-[10px] text-muted-c line-clamp-2">
                    Horizontal rounded badge displaying custom call-to-action text.
                  </p>
                </div>
              </div>

              {/* Option 5: Custom Brand Mascot PNG */}
              <div
                onClick={() => setLauncherStyle('CUSTOM_PNG')}
                className={`relative flex flex-col justify-between rounded-xl border-2 p-3.5 cursor-pointer sm:col-span-2 transition-all ${
                  launcherStyle === 'CUSTOM_PNG'
                    ? 'border-primary-600 bg-primary-500/5 ring-1 ring-primary-500/20 shadow-xs'
                    : 'border-base-c hover:border-base-c/80 bg-card-c'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-subtle-c border border-base-c grid place-items-center overflow-hidden shrink-0">
                      {widgetIconUrl ? (
                        <img src={widgetIconUrl} alt="" className="h-full w-full object-contain p-1" />
                      ) : (
                        <Upload className="h-5 w-5 text-muted-c" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-primary-c">Custom Mascot PNG</h4>
                        {launcherStyle === 'CUSTOM_PNG' && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
                        )}
                      </div>
                      <p className="text-[10px] text-muted-c">
                        Upload your company mascot, illustrated avatar, or custom brand icon.
                      </p>
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-1.5 rounded-lg border border-base-c bg-card-c px-3 py-1.5 text-xs font-semibold text-secondary-c hover:bg-subtle-c cursor-pointer shadow-2xs">
                    <Upload className="h-3 w-3 text-muted-c" />
                    <span>{uploadingAvatar ? 'Uploading…' : 'Upload PNG'}</span>
                    <input
                      type="file"
                      accept="image/png,image/webp"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Avatar Preset Selector */}
          <div className="rounded-2xl border border-base-c bg-card-c p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-base-c/60 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary-c">
                  2. Avatar Character
                </span>
              </div>
              <span className="rounded-full bg-subtle-c px-2 py-0.5 text-[10px] font-bold text-muted-c">
                High-Fidelity Vectors
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {/* Preset 1: Robot Cyan 3D */}
              <button
                type="button"
                onClick={() => setAvatarPreset('ROBOT_CYAN_3D')}
                className={`flex items-center gap-3 rounded-xl border-2 p-2.5 text-left transition-all ${
                  avatarPreset === 'ROBOT_CYAN_3D'
                    ? 'border-primary-600 bg-primary-500/5 ring-1 ring-primary-500/20'
                    : 'border-base-c hover:bg-subtle-c/60'
                }`}
              >
                <div className="h-10 w-10 shrink-0">
                  <RobotCyan3DGraphic />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-primary-c">Robot Cyan</h5>
                  <p className="text-[10px] text-muted-c truncate">Metallic white + cyan smile (^^)</p>
                </div>
              </button>

              {/* Preset 2: Robot Purple 3D */}
              <button
                type="button"
                onClick={() => setAvatarPreset('ROBOT_PURPLE_3D')}
                className={`flex items-center gap-3 rounded-xl border-2 p-2.5 text-left transition-all ${
                  avatarPreset === 'ROBOT_PURPLE_3D'
                    ? 'border-primary-600 bg-primary-500/5 ring-1 ring-primary-500/20'
                    : 'border-base-c hover:bg-subtle-c/60'
                }`}
              >
                <div className="h-10 w-10 shrink-0">
                  <RobotPurple3DGraphic />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-primary-c">Robot Purple</h5>
                  <p className="text-[10px] text-muted-c truncate">Metallic white + violet visor</p>
                </div>
              </button>

              {/* Preset 3: AI Sparkle Orb */}
              <button
                type="button"
                onClick={() => setAvatarPreset('AI_SPARKLE_ORB')}
                className={`flex items-center gap-3 rounded-xl border-2 p-2.5 text-left transition-all ${
                  avatarPreset === 'AI_SPARKLE_ORB'
                    ? 'border-primary-600 bg-primary-500/5 ring-1 ring-primary-500/20'
                    : 'border-base-c hover:bg-subtle-c/60'
                }`}
              >
                <div className="h-10 w-10 shrink-0">
                  <SparkleOrbGraphic />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-primary-c">AI Sparkle Orb</h5>
                  <p className="text-[10px] text-muted-c truncate">Luminous animated sphere</p>
                </div>
              </button>

              {/* Preset 4: Support Agent */}
              <button
                type="button"
                onClick={() => setAvatarPreset('SUPPORT_HUMAN')}
                className={`flex items-center gap-3 rounded-xl border-2 p-2.5 text-left transition-all ${
                  avatarPreset === 'SUPPORT_HUMAN'
                    ? 'border-primary-600 bg-primary-500/5 ring-1 ring-primary-500/20'
                    : 'border-base-c hover:bg-subtle-c/60'
                }`}
              >
                <div className="h-10 w-10 shrink-0">
                  <SupportHumanGraphic />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-primary-c">Support Agent</h5>
                  <p className="text-[10px] text-muted-c truncate">Friendly human specialist</p>
                </div>
              </button>

              {/* Preset 5: Custom Brand Mascot (Uploaded PNG) */}
              <button
                type="button"
                onClick={() => setAvatarPreset('CUSTOM')}
                className={`flex items-center gap-3 rounded-xl border-2 p-2.5 text-left transition-all sm:col-span-2 ${
                  avatarPreset === 'CUSTOM'
                    ? 'border-primary-600 bg-primary-500/5 ring-1 ring-primary-500/20'
                    : 'border-base-c hover:bg-subtle-c/60'
                }`}
              >
                <div className="h-10 w-10 shrink-0 rounded-lg bg-subtle-c border border-base-c grid place-items-center overflow-hidden">
                  {widgetIconUrl ? (
                    <img src={widgetIconUrl} alt="Custom Mascot" className="h-full w-full object-contain p-1" />
                  ) : (
                    <Upload className="h-4 w-4 text-muted-c" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h5 className="text-xs font-bold text-primary-c">Custom Mascot (Uploaded)</h5>
                    {widgetIconUrl ? (
                      <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-bold text-emerald-600 border border-emerald-500/20">
                        PNG Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-bold text-amber-600 border border-amber-500/20">
                        Upload Required
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-c truncate">
                    {widgetIconUrl ? 'Your transparent brand mascot graphic' : 'Upload PNG in Section 1 to use as custom avatar'}
                  </p>
                </div>
                {avatarPreset === 'CUSTOM' && (
                  <Check className="h-4 w-4 text-primary-600 stroke-[3] shrink-0" />
                )}
              </button>
            </div>
          </div>

          {/* SECTION 3: Speech Greeting Bubble */}
          <div className="rounded-2xl border border-base-c bg-card-c p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-base-c/60 pb-3 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare className="h-4 w-4 text-purple-500 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary-c truncate">
                  3. Speech Bubble
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer shrink-0">
                <span className="text-xs font-semibold text-secondary-c whitespace-nowrap">Show Bubble</span>
                <input
                  type="checkbox"
                  checked={greetingBubbleEnabled}
                  onChange={(e) => setGreetingBubbleEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-base-c text-primary-600 focus:ring-primary-500"
                />
              </label>
            </div>

            {greetingBubbleEnabled && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Text Input with counter */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-primary-c">
                      Greeting Message
                    </label>
                    <span
                      className={`text-[10px] font-mono font-semibold ${
                        greetingBubbleText.length > 110 ? 'text-rose-500' : 'text-muted-c'
                      }`}
                    >
                      {greetingBubbleText.length} / 120
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={120}
                    value={greetingBubbleText}
                    onChange={(e) => setGreetingBubbleText(e.target.value)}
                    placeholder="e.g. How can I help you today?"
                    className="w-full rounded-xl border border-base-c bg-subtle-c/60 px-3.5 py-2 text-xs text-primary-c placeholder:text-muted-c focus:border-primary-500 focus:bg-card-c focus:outline-none"
                  />
                </div>

                {/* Color Themes - Spacious 2-Column Grid to avoid squishing */}
                <div>
                  <label className="block text-xs font-semibold text-primary-c mb-2">
                    Bubble Color &amp; Gradient Theme
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Purple Glow */}
                    <button
                      type="button"
                      onClick={() => setGreetingBubbleTheme('GRADIENT_PURPLE')}
                      className={`flex items-center justify-between rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
                        greetingBubbleTheme === 'GRADIENT_PURPLE'
                          ? 'border-primary-600 bg-primary-500/10 ring-1 ring-primary-500/20'
                          : 'border-base-c hover:bg-subtle-c/60 bg-card-c'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="h-4 w-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 shrink-0 shadow-2xs" />
                        <span className="text-xs font-semibold text-primary-c truncate">Purple Glow</span>
                      </div>
                      {greetingBubbleTheme === 'GRADIENT_PURPLE' && (
                        <Check className="h-3.5 w-3.5 text-primary-600 stroke-[3] shrink-0" />
                      )}
                    </button>

                    {/* Brand Color */}
                    <button
                      type="button"
                      onClick={() => setGreetingBubbleTheme('BRAND_COLOR')}
                      className={`flex items-center justify-between rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
                        greetingBubbleTheme === 'BRAND_COLOR'
                          ? 'border-primary-600 bg-primary-500/10 ring-1 ring-primary-500/20'
                          : 'border-base-c hover:bg-subtle-c/60 bg-card-c'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="h-4 w-4 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: primaryColor }}
                        />
                        <span className="text-xs font-semibold text-primary-c truncate">Brand Color</span>
                      </div>
                      {greetingBubbleTheme === 'BRAND_COLOR' && (
                        <Check className="h-3.5 w-3.5 text-primary-600 stroke-[3] shrink-0" />
                      )}
                    </button>

                    {/* Dark Sleek */}
                    <button
                      type="button"
                      onClick={() => setGreetingBubbleTheme('DARK_SLEEK')}
                      className={`flex items-center justify-between rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
                        greetingBubbleTheme === 'DARK_SLEEK'
                          ? 'border-primary-600 bg-primary-500/10 ring-1 ring-primary-500/20'
                          : 'border-base-c hover:bg-subtle-c/60 bg-card-c'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="h-4 w-4 rounded-full bg-slate-900 border border-slate-700 shrink-0" />
                        <span className="text-xs font-semibold text-primary-c truncate">Dark Sleek</span>
                      </div>
                      {greetingBubbleTheme === 'DARK_SLEEK' && (
                        <Check className="h-3.5 w-3.5 text-primary-600 stroke-[3] shrink-0" />
                      )}
                    </button>

                    {/* Glassmorphic */}
                    <button
                      type="button"
                      onClick={() => setGreetingBubbleTheme('GLASSMORPHIC')}
                      className={`flex items-center justify-between rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
                        greetingBubbleTheme === 'GLASSMORPHIC'
                          ? 'border-primary-600 bg-primary-500/10 ring-1 ring-primary-500/20'
                          : 'border-base-c hover:bg-subtle-c/60 bg-card-c'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="h-4 w-4 rounded-full bg-slate-200 border border-slate-300 shrink-0" />
                        <span className="text-xs font-semibold text-primary-c truncate">Glassmorphic</span>
                      </div>
                      {greetingBubbleTheme === 'GLASSMORPHIC' && (
                        <Check className="h-3.5 w-3.5 text-primary-600 stroke-[3] shrink-0" />
                      )}
                    </button>

                    {/* Clean White */}
                    <button
                      type="button"
                      onClick={() => setGreetingBubbleTheme('CLEAN_WHITE')}
                      className={`flex items-center justify-between rounded-xl border-2 px-3 py-2.5 text-left col-span-2 transition-all ${
                        greetingBubbleTheme === 'CLEAN_WHITE'
                          ? 'border-primary-600 bg-primary-500/10 ring-1 ring-primary-500/20'
                          : 'border-base-c hover:bg-subtle-c/60 bg-card-c'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="h-4 w-4 rounded-full bg-white border border-slate-300 shrink-0 shadow-2xs" />
                        <span className="text-xs font-semibold text-primary-c truncate">Clean White</span>
                      </div>
                      {greetingBubbleTheme === 'CLEAN_WHITE' && (
                        <Check className="h-3.5 w-3.5 text-primary-600 stroke-[3] shrink-0" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: Motion & Physics */}
          <div className="rounded-2xl border border-base-c bg-card-c p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-base-c/60 pb-3 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Activity className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary-c truncate">
                  4. Motion &amp; Physics
                </span>
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 shrink-0 whitespace-nowrap">
                <Check className="h-3 w-3" /> Reduced Motion Safe
              </span>
            </div>

            {/* 2-Column Motion Buttons with comfortable width */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setBotAnimation('FLOAT_BOB')}
                className={`flex items-center justify-between rounded-xl border-2 px-3.5 py-2.5 text-left transition-all ${
                  botAnimation === 'FLOAT_BOB'
                    ? 'border-primary-600 bg-primary-500/10 text-primary-600 ring-1 ring-primary-500/20 shadow-xs'
                    : 'border-base-c text-secondary-c hover:bg-subtle-c/60 bg-card-c'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-primary-500 shrink-0" />
                  <span className="text-xs font-bold truncate">Floating Bob</span>
                </div>
                {botAnimation === 'FLOAT_BOB' && (
                  <Check className="h-3.5 w-3.5 text-primary-600 stroke-[3] shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setBotAnimation('PULSE')}
                className={`flex items-center justify-between rounded-xl border-2 px-3.5 py-2.5 text-left transition-all ${
                  botAnimation === 'PULSE'
                    ? 'border-primary-600 bg-primary-500/10 text-primary-600 ring-1 ring-primary-500/20 shadow-xs'
                    : 'border-base-c text-secondary-c hover:bg-subtle-c/60 bg-card-c'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                  <span className="text-xs font-bold truncate">Gentle Pulse</span>
                </div>
                {botAnimation === 'PULSE' && (
                  <Check className="h-3.5 w-3.5 text-primary-600 stroke-[3] shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setBotAnimation('BOUNCE')}
                className={`flex items-center justify-between rounded-xl border-2 px-3.5 py-2.5 text-left transition-all ${
                  botAnimation === 'BOUNCE'
                    ? 'border-primary-600 bg-primary-500/10 text-primary-600 ring-1 ring-primary-500/20 shadow-xs'
                    : 'border-base-c text-secondary-c hover:bg-subtle-c/60 bg-card-c'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                  <span className="text-xs font-bold truncate">Bounce</span>
                </div>
                {botAnimation === 'BOUNCE' && (
                  <Check className="h-3.5 w-3.5 text-primary-600 stroke-[3] shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setBotAnimation('STATIC')}
                className={`flex items-center justify-between rounded-xl border-2 px-3.5 py-2.5 text-left transition-all ${
                  botAnimation === 'STATIC'
                    ? 'border-primary-600 bg-primary-500/10 text-primary-600 ring-1 ring-primary-500/20 shadow-xs'
                    : 'border-base-c text-secondary-c hover:bg-subtle-c/60 bg-card-c'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
                  <span className="text-xs font-bold truncate">Static</span>
                </div>
                {botAnimation === 'STATIC' && (
                  <Check className="h-3.5 w-3.5 text-primary-600 stroke-[3] shrink-0" />
                )}
              </button>
            </div>

            {/* Float Speed Duration Slider */}
            {botAnimation !== 'STATIC' && (
              <div className="rounded-xl border border-base-c bg-subtle-c/40 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-secondary-c">
                  <span className="font-medium">Cycle Duration</span>
                  <span className="rounded-md bg-card-c px-2 py-0.5 font-mono text-xs font-bold text-primary-600 shadow-2xs border border-base-c">
                    {animationSpeed}s
                  </span>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="3.5"
                  step="0.1"
                  value={animationSpeed}
                  onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                  className="w-full accent-primary-600 cursor-pointer h-2 bg-base-c rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-muted-c font-medium px-0.5">
                  <span>Fast (1.5s)</span>
                  <span>Default (2.4s)</span>
                  <span>Gentle (3.5s)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Website Preview Simulator (7 cols) */}
        <div className="space-y-5 lg:col-span-7">
          <div className="rounded-2xl border border-base-c bg-card-c p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-base-c/60 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-c flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary-500" />
                Live Website Simulator
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                Interactive DOM Render
              </span>
            </div>

            {/* Interactive Live Simulator */}
            <WebsiteSimulator
              businessName={businessName}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              logoUrl={logoUrl}
              widgetIconUrl={widgetIconUrl}
              launcherStyle={launcherStyle}
              avatarPreset={avatarPreset}
              greetingBubbleText={greetingBubbleText}
              greetingBubbleTheme={greetingBubbleTheme}
              greetingBubbleEnabled={greetingBubbleEnabled}
              botAnimation={botAnimation}
              animationSpeed={animationSpeed}
            />

            {/* Configuration Specs Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
              <div className="rounded-xl border border-base-c bg-subtle-c/50 p-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-c block">Style</span>
                <span className="font-bold text-primary-c mt-0.5 block truncate">
                  {launcherStyle.replace('_', ' ')}
                </span>
              </div>
              <div className="rounded-xl border border-base-c bg-subtle-c/50 p-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-c block">Character</span>
                <span className="font-bold text-primary-c mt-0.5 block truncate">
                  {avatarPreset.replace('_', ' ')}
                </span>
              </div>
              <div className="rounded-xl border border-base-c bg-subtle-c/50 p-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-c block">Theme</span>
                <span className="font-bold text-primary-c mt-0.5 block truncate">
                  {greetingBubbleTheme.replace('_', ' ')}
                </span>
              </div>
              <div className="rounded-xl border border-base-c bg-subtle-c/50 p-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-c block">Motion</span>
                <span className="font-bold text-primary-c mt-0.5 block truncate">
                  {botAnimation.replace('_', ' ')} ({animationSpeed}s)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Deployment Bar */}
          <div className="rounded-2xl border border-base-c bg-card-c p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-base-c/60 pb-3">
              <div className="flex items-center gap-2">
                <FileCode2 className="h-4 w-4 text-primary-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary-c">
                  Quick Actions &amp; Embed Code
                </span>
              </div>
              <span className="text-[11px] text-muted-c">Universal 1-line script</span>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-3">
              <button
                type="button"
                onClick={handleCopyScript}
                className="flex items-center justify-center gap-2 rounded-xl border border-base-c bg-card-c p-3 text-xs font-bold text-primary-c hover:bg-subtle-c transition-colors shadow-2xs"
              >
                {copiedScript ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-c" />}
                <span>{copiedScript ? 'Script Copied!' : 'Copy Script Tag'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEmbedModal(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-base-c bg-card-c p-3 text-xs font-bold text-primary-c hover:bg-subtle-c transition-colors shadow-2xs"
              >
                <Code className="h-4 w-4 text-indigo-500" />
                <span>Get Embed Code</span>
              </button>

              <button
                type="button"
                onClick={() => window.open('/demo', '_blank')}
                className="flex items-center justify-center gap-2 rounded-xl border border-base-c bg-card-c p-3 text-xs font-bold text-primary-c hover:bg-subtle-c transition-colors shadow-2xs"
              >
                <ExternalLink className="h-4 w-4 text-emerald-500" />
                <span>View Live Demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── EMBED CODE MODAL ── */}
      {showEmbedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-base-c bg-card-c p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-base-c/60 pb-3">
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary-600" />
                <h3 className="text-base font-bold text-primary-c">Website Embed Snippet</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEmbedModal(false)}
                className="rounded-lg p-1 text-muted-c hover:bg-subtle-c"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-secondary-c">
              Add this single script tag right before the closing <code className="rounded bg-subtle-c px-1 py-0.5 font-mono text-primary-c">&lt;/body&gt;</code> tag of your website. Works on WordPress, Shopify, Next.js, Webflow, and HTML.
            </p>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-400 overflow-x-auto shadow-inner">
              <pre>{embedCodeSnippet}</pre>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopyScript}
                className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white hover:bg-primary-700 shadow-sm"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copiedScript ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STYLES GUIDE MODAL ── */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-base-c bg-card-c p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-base-c/60 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary-600" />
                <h3 className="text-base font-bold text-primary-c">Bot Launcher Best Practices</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="rounded-lg p-1 text-muted-c hover:bg-subtle-c"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-secondary-c">
              <div className="rounded-xl border border-primary-500/20 bg-primary-500/10 p-3">
                <h4 className="font-bold text-primary-600 mb-1">3D Robot + Speech Bubble</h4>
                <p>Generates up to 3.2x higher visitor click-through rates by greeting the user with an approachable, intelligent character persona.</p>
              </div>

              <div className="rounded-xl border border-base-c bg-subtle-c/50 p-3">
                <h4 className="font-bold text-primary-c mb-1">Greeting Bubble Tuning</h4>
                <p>Keep your greeting message concise (under 80 characters) to ensure optimal readability across mobile viewports.</p>
              </div>

              <div className="rounded-xl border border-base-c bg-subtle-c/50 p-3">
                <h4 className="font-bold text-primary-c mb-1">Accessibility Compliance</h4>
                <p>All decorative bob and pulse motions automatically pause when the visitor's operating system has <code className="bg-subtle-c px-1 rounded font-mono">prefers-reduced-motion</code> enabled.</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="rounded-xl border border-base-c bg-subtle-c px-4 py-2 text-xs font-semibold text-primary-c hover:bg-subtle-c/80"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
