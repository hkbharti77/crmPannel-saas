import { useState, useEffect, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Send,
  Bot,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  Copy,
  Check,
  Users,
  Eye,
  EyeOff,
  Sparkles,
  Link as LinkIcon,
  HelpCircle,
  Loader2,
  Plus,
  Trash2,
  MessageSquare,
  Plug,
  ListTree,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/primitives';
import {
  fetchTelegramConfig,
  configureCustomerBot,
  configureAgentBot,
  rotateTelegramSecret,
  generateAgentBindingLink,
  updateReplyKeyboardButtons,
  updateTelegramGreetings,
  TelegramConfigResponse,
  TelegramReplyKeyboardButton,
  TelegramGreetingMenuButton,
} from '@/lib/telegramApi';
import { getStoredUser, apiFetch } from '@/lib/api';
import { fetchCurrentUserProfile, updateCurrentUserProfile } from '@/lib/userApi';

interface CustomSubMenuRef {
  id: string;
  triggerLabel: string;
  headerTitle: string;
  itemsCount: number;
}

interface QuickResponseRef {
  id: string; // "custom_msg_1", "custom_msg_2", ...
  internalName: string;
  text: string;
  imageUrl?: string;
}

export function TelegramIntegrationPanel() {
  const [config, setConfig] = useState<TelegramConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'connector' | 'menu_builder'>('connector');

  // Customer Bot Form State
  const [custToken, setCustToken] = useState('');
  const [custUsername, setCustUsername] = useState('');
  const [custShowToken, setCustShowToken] = useState(false);
  const [savingCust, setSavingCust] = useState(false);
  const [editingCust, setEditingCust] = useState(false);

  // Agent Bot Form State
  const [agentToken, setAgentToken] = useState('');
  const [agentUsername, setAgentUsername] = useState('');
  const [agentChatId, setAgentChatId] = useState('');
  const [agentShowToken, setAgentShowToken] = useState(false);
  const [savingAgent, setSavingAgent] = useState(false);
  const [editingAgent, setEditingAgent] = useState(false);

  // Agent Deep-Link Pairing State
  const [pairingLink, setPairingLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Rotation State
  const [rotatingBot, setRotatingBot] = useState<'CUSTOMER' | 'AGENT' | null>(null);

  // Reply Keyboard Form State (0 to 8 buttons)
  const [replyButtons, setReplyButtons] = useState<TelegramReplyKeyboardButton[]>([]);
  const [savingKeyboard, setSavingKeyboard] = useState(false);

  // Greetings & Interactive Menu Form State (0 to 10 buttons)
  const [welcomeMsg, setWelcomeMsg] = useState('');
  const [returningMsg, setReturningMsg] = useState('');
  const [greetingButtons, setGreetingButtons] = useState<TelegramGreetingMenuButton[]>([]);
  const [savingGreetings, setSavingGreetings] = useState(false);
  const [availableSubMenus, setAvailableSubMenus] = useState<CustomSubMenuRef[]>([]);
  const [availableQuickResponses, setAvailableQuickResponses] = useState<QuickResponseRef[]>([]);

  // Core Business Flow Toggles (Enquiry, Appointment, Booking)
  const [showLeadFlow, setShowLeadFlow] = useState<boolean>(true);
  const [showAppointmentFlow, setShowAppointmentFlow] = useState<boolean>(false);
  const [showBookingFlow, setShowBookingFlow] = useState<boolean>(false);
  const [savingFlowToggles, setSavingFlowToggles] = useState<boolean>(false);

  // Talk to Human / Live Agent Support State
  const [showTalkToHuman, setShowTalkToHuman] = useState<boolean>(true);
  const [talkToHumanLabel, setTalkToHumanLabel] = useState<string>('👤 Talk to Human');

  // Custom Labels for Core Flows (Editable by admin)
  const [waLeadLabel, setWaLeadLabel] = useState<string>('📋 Enquire Now');
  const [waApptLabel, setWaApptLabel] = useState<string>('📅 Book Appointment');
  const [waBookingLabel, setWaBookingLabel] = useState<string>('✂️ Book Service');

  const loadConfig = async () => {
    setLoading(true);
    setError(null);
    const res = await fetchTelegramConfig();
    let initialButtons: TelegramGreetingMenuButton[] = [];
    if (res.error) {
      setError(res.error);
    } else {
      setConfig(res.data);
      if (res.data) {
        setCustUsername(res.data.customerBotUsername || '');
        setAgentUsername(res.data.agentBotUsername || '');
        setAgentChatId(res.data.agentTeamChatId ? String(res.data.agentTeamChatId) : '');
        setEditingCust(!res.data.customerBotConfigured);
        setEditingAgent(!res.data.agentBotConfigured);
        setReplyButtons(res.data.replyKeyboardButtons || []);
        setWelcomeMsg(res.data.welcomeMessage || '👋 Hello {name}! Welcome to {businessName}. How may we help you today?');
        setReturningMsg(res.data.returningMessage || '👋 Welcome back, {name}! How can we assist you today?');
        if (res.data.talkToHumanEnabled !== undefined) {
          setShowTalkToHuman(res.data.talkToHumanEnabled);
        }
        if (res.data.talkToHumanLabel) {
          setTalkToHumanLabel(res.data.talkToHumanLabel);
        }
        initialButtons = res.data.greetingMenuButtons || [];
      }
    }

    // 1. Load tenant flow labels, sub-menus and quick responses from WhatsAppConfig
    let leadLabel = '📋 Enquire Now';
    let apptLabel = '📅 Book Appointment';
    let bookingLabel = '✂️ Book Service';
    try {
      const waRes = await apiFetch<any>('/api/v1/whatsapp-config');
      if (waRes.data) {
        if (waRes.data.leadButtonLabel?.trim()) leadLabel = waRes.data.leadButtonLabel.trim();
        if (waRes.data.appointmentButtonLabel?.trim()) apptLabel = waRes.data.appointmentButtonLabel.trim();
        if (waRes.data.bookingButtonLabel?.trim()) bookingLabel = waRes.data.bookingButtonLabel.trim();
        setWaLeadLabel(leadLabel);
        setWaApptLabel(apptLabel);
        setWaBookingLabel(bookingLabel);

        if (waRes.data.customSubMenusJson) {
          const parsed = JSON.parse(waRes.data.customSubMenusJson);
          if (Array.isArray(parsed)) {
            setAvailableSubMenus(
              parsed.slice(0, 5).map((m: any, idx: number) => ({
                id: m.id || `custom_list_${idx + 1}`,
                triggerLabel: m.triggerLabel || `Sub-Menu ${idx + 1}`,
                headerTitle: m.headerTitle || `Our Options`,
                itemsCount: Array.isArray(m.items) ? m.items.length : 0,
              }))
            );
          }
        }
        if (waRes.data.customMessagesJson) {
          const parsedQ = JSON.parse(waRes.data.customMessagesJson);
          if (Array.isArray(parsedQ)) {
            setAvailableQuickResponses(
              parsedQ.slice(0, 6).map((m: any, idx: number) => ({
                id: m.id || `custom_msg_${idx + 1}`,
                internalName: m.internalName || m.shortcut || `Quick Response ${idx + 1}`,
                text: m.text || m.response || '',
                imageUrl: m.imageUrl || '',
              }))
            );
          }
        }
      }
    } catch { /* ignore */ }

    // 2. Load Core Flow Toggles from User Profile
    let isLeadOn = initialButtons.some(b => b.type === 'FLOW' && b.payload === 'lead');
    let isApptOn = initialButtons.some(b => b.type === 'FLOW' && b.payload === 'appointment');
    let isBookingOn = initialButtons.some(b => b.type === 'FLOW' && b.payload === 'booking');

    try {
      const profRes = await fetchCurrentUserProfile();
      if (profRes.data) {
        if (profRes.data.forceShowLeads !== undefined) isLeadOn = profRes.data.forceShowLeads;
        if (profRes.data.forceShowAppointment !== undefined) isApptOn = profRes.data.forceShowAppointment;
        if (profRes.data.forceShowBooking !== undefined) isBookingOn = profRes.data.forceShowBooking;
      }
    } catch { /* ignore */ }

    setShowLeadFlow(isLeadOn);
    setShowAppointmentFlow(isApptOn);
    setShowBookingFlow(isBookingOn);

    // Auto-populate flow buttons into greetingButtons so they auto-show in the Interactive Menu list
    const hasLeadInButtons = initialButtons.some(b => b.type === 'FLOW' && b.payload === 'lead');
    const hasApptInButtons = initialButtons.some(b => b.type === 'FLOW' && b.payload === 'appointment');
    const hasBookingInButtons = initialButtons.some(b => b.type === 'FLOW' && b.payload === 'booking');

    let merged = [...initialButtons];
    if (isLeadOn && !hasLeadInButtons && merged.length < 10) {
      merged.push({ text: leadLabel, type: 'FLOW', payload: 'lead' });
    }
    if (isApptOn && !hasApptInButtons && merged.length < 10) {
      merged.push({ text: apptLabel, type: 'FLOW', payload: 'appointment' });
    }
    if (isBookingOn && !hasBookingInButtons && merged.length < 10) {
      merged.push({ text: bookingLabel, type: 'FLOW', payload: 'booking' });
    }

    setGreetingButtons(merged);
    setLoading(false);
  };

  const effectiveSubMenus: CustomSubMenuRef[] = availableSubMenus.length > 0 ? availableSubMenus : [
    { id: 'custom_list_1', triggerLabel: 'Sub-Menu 1: Special Offers', headerTitle: 'Special Offers', itemsCount: 3 },
    { id: 'custom_list_2', triggerLabel: 'Sub-Menu 2: Support Services', headerTitle: 'Support Options', itemsCount: 3 },
    { id: 'custom_list_3', triggerLabel: 'Sub-Menu 3: Pricing Plans', headerTitle: 'Pricing Plans', itemsCount: 3 },
    { id: 'custom_list_4', triggerLabel: 'Sub-Menu 4: Branch Locations', headerTitle: 'Our Locations', itemsCount: 2 },
    { id: 'custom_list_5', triggerLabel: 'Sub-Menu 5: FAQ & Catalog', headerTitle: 'Quick Answers', itemsCount: 4 },
  ];

  const effectiveQuickResponses: QuickResponseRef[] = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const existing = availableQuickResponses[i];
      if (existing) return existing;
      return {
        id: `custom_msg_${i + 1}`,
        internalName: `Quick Response ${i + 1}`,
        text: '',
        imageUrl: '',
      };
    });
  }, [availableQuickResponses]);

  const handleSaveKeyboard = async () => {
    setSavingKeyboard(true);
    setError(null);
    const res = await updateReplyKeyboardButtons(replyButtons);
    setSavingKeyboard(false);
    if (res.error) {
      setError(res.error);
    } else {
      setConfig(res.data);
      setSuccessMsg(`Reply Keyboard updated (${replyButtons.length} / 8 buttons active)!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleAddButton = () => {
    if (replyButtons.length >= 8) return;
    setReplyButtons([...replyButtons, { text: 'New Button', type: 'TEXT' }]);
  };

  const handleRemoveButton = (index: number) => {
    setReplyButtons(replyButtons.filter((_, i) => i !== index));
  };

  const handleUpdateButton = (index: number, field: keyof TelegramReplyKeyboardButton, val: any) => {
    const updated = [...replyButtons];
    const cur = updated[index];
    if (field === 'type' && val === 'DIRECT_RESPONSE' && !cur.quickResponseId) {
      const firstQr = effectiveQuickResponses[0];
      updated[index] = {
        ...cur,
        type: val,
        quickResponseId: firstQr?.id || 'custom_msg_1',
        directResponse: firstQr?.text || cur.directResponse || '',
        imageUrl: firstQr?.imageUrl || cur.imageUrl || '',
      };
    } else {
      updated[index] = { ...cur, [field]: val };
    }
    setReplyButtons(updated);
  };

  const handleUpdateReplyButtonMulti = (index: number, patch: Partial<TelegramReplyKeyboardButton>) => {
    const updated = [...replyButtons];
    updated[index] = { ...updated[index], ...patch };
    setReplyButtons(updated);
  };

  const handleSaveGreetings = async () => {
    setSavingGreetings(true);
    setError(null);

    const res = await updateTelegramGreetings({
      welcomeMessage: welcomeMsg,
      returningMessage: returningMsg,
      greetingMenuButtons: greetingButtons,
      talkToHumanEnabled: showTalkToHuman,
      talkToHumanLabel: talkToHumanLabel,
    });

    // Sync any custom flow button labels to WhatsAppConfig so omnichannel labels stay identical
    const leadBtn = greetingButtons.find(b => b.type === 'FLOW' && b.payload === 'lead');
    const apptBtn = greetingButtons.find(b => b.type === 'FLOW' && b.payload === 'appointment');
    const bookBtn = greetingButtons.find(b => b.type === 'FLOW' && b.payload === 'booking');

    try {
      await apiFetch('/api/v1/whatsapp-config', {
        method: 'POST',
        body: JSON.stringify({
          leadButtonLabel: leadBtn?.text || waLeadLabel,
          appointmentButtonLabel: apptBtn?.text || waApptLabel,
          bookingButtonLabel: bookBtn?.text || waBookingLabel,
        }),
      });
    } catch { /* ignore */ }

    // Sync profile flow flags with what's actually active in greetingButtons
    try {
      await updateCurrentUserProfile({
        forceShowLeads: !!leadBtn,
        forceShowAppointment: !!apptBtn,
        forceShowBooking: !!bookBtn,
      });
      window.dispatchEvent(new CustomEvent('profileUpdated'));
    } catch { /* ignore */ }

    setSavingGreetings(false);
    if (res.error) {
      setError(res.error);
    } else {
      setConfig(res.data);
      setSuccessMsg(`Greeting messages & interactive menu (${greetingButtons.length} / 10 buttons) saved!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleAddGreetingButton = () => {
    if (greetingButtons.length >= 10) return;
    setGreetingButtons([
      ...greetingButtons,
      { text: 'New Option', type: 'CALLBACK', payload: '' },
    ]);
  };

  const handleRemoveGreetingButton = (index: number) => {
    const removedBtn = greetingButtons[index];
    const filtered = greetingButtons.filter((_, i) => i !== index);
    setGreetingButtons(filtered);

    // If it was a flow button, update toggle to false and sync profile
    if (removedBtn?.type === 'FLOW') {
      if (removedBtn.payload === 'lead') {
        setShowLeadFlow(false);
        updateCurrentUserProfile({ forceShowLeads: false }).catch(() => {});
      } else if (removedBtn.payload === 'appointment') {
        setShowAppointmentFlow(false);
        updateCurrentUserProfile({ forceShowAppointment: false }).catch(() => {});
      } else if (removedBtn.payload === 'booking') {
        setShowBookingFlow(false);
        updateCurrentUserProfile({ forceShowBooking: false }).catch(() => {});
      }
      window.dispatchEvent(new CustomEvent('profileUpdated'));
    }
  };

  const handleUpdateGreetingButton = (index: number, field: keyof TelegramGreetingMenuButton, val: any) => {
    const updated = [...greetingButtons];
    const cur = updated[index];
    if (field === 'type' && val === 'DIRECT_RESPONSE' && !cur.quickResponseId) {
      const firstQr = effectiveQuickResponses[0];
      updated[index] = {
        ...cur,
        type: val,
        quickResponseId: firstQr?.id || 'custom_msg_1',
        directResponse: firstQr?.text || cur.directResponse || '',
        imageUrl: firstQr?.imageUrl || cur.imageUrl || '',
      };
    } else {
      updated[index] = { ...cur, [field]: val };
    }

    // Keep wa custom labels in sync if editing text of a flow button
    if (field === 'text' && cur.type === 'FLOW') {
      if (cur.payload === 'lead') setWaLeadLabel(val);
      if (cur.payload === 'appointment') setWaApptLabel(val);
      if (cur.payload === 'booking') setWaBookingLabel(val);
    }

    // If type or payload changed to/from a FLOW
    const hasLead = updated.some(b => b.type === 'FLOW' && b.payload === 'lead');
    const hasAppt = updated.some(b => b.type === 'FLOW' && b.payload === 'appointment');
    const hasBooking = updated.some(b => b.type === 'FLOW' && b.payload === 'booking');
    setShowLeadFlow(hasLead);
    setShowAppointmentFlow(hasAppt);
    setShowBookingFlow(hasBooking);

    setGreetingButtons(updated);
  };

  const handleUpdateGreetingButtonMulti = (index: number, patch: Partial<TelegramGreetingMenuButton>) => {
    const updated = [...greetingButtons];
    updated[index] = { ...updated[index], ...patch };
    setGreetingButtons(updated);
  };

  const handleToggleFlow = async (flowKey: 'lead' | 'appointment' | 'booking', enabled: boolean) => {
    let profileKey: 'forceShowLeads' | 'forceShowAppointment' | 'forceShowBooking';
    let defaultLabel: string;
    let currentCustomLabel: string;

    if (flowKey === 'lead') {
      profileKey = 'forceShowLeads';
      defaultLabel = '📋 Enquire Now';
      currentCustomLabel = waLeadLabel;
      setShowLeadFlow(enabled);
    } else if (flowKey === 'appointment') {
      profileKey = 'forceShowAppointment';
      defaultLabel = '📅 Book Appointment';
      currentCustomLabel = waApptLabel;
      setShowAppointmentFlow(enabled);
    } else {
      profileKey = 'forceShowBooking';
      defaultLabel = '✂️ Book Service';
      currentCustomLabel = waBookingLabel;
      setShowBookingFlow(enabled);
    }

    // Auto-show or remove the flow button in the greetingButtons list
    setGreetingButtons((prev) => {
      if (enabled) {
        if (!prev.some(b => b.type === 'FLOW' && b.payload === flowKey)) {
          if (prev.length >= 10) {
            setError('Maximum 10 menu buttons reached. Remove an existing button to add this flow.');
            return prev;
          }
          const labelToUse = currentCustomLabel?.trim() || defaultLabel;
          return [...prev, { text: labelToUse, type: 'FLOW', payload: flowKey }];
        }
        return prev;
      } else {
        return prev.filter(b => !(b.type === 'FLOW' && b.payload === flowKey));
      }
    });

    setSavingFlowToggles(true);
    try {
      await updateCurrentUserProfile({ [profileKey]: enabled });
      setSuccessMsg(`Core flow "${flowKey}" ${enabled ? 'enabled and added to menu list' : 'disabled and removed from menu list'}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      window.dispatchEvent(new CustomEvent('profileUpdated'));
    } catch (e: any) {
      setError(e.message || 'Failed to update flow toggle');
    } finally {
      setSavingFlowToggles(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSaveCustomerBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custToken.trim() || !custUsername.trim()) {
      setError('Please provide bot token and bot username');
      return;
    }
    setSavingCust(true);
    setError(null);
    const cleanUsername = custUsername.trim().replace(/^@/, '');
    const res = await configureCustomerBot({
      botToken: custToken.trim(),
      botUsername: cleanUsername,
    });
    setSavingCust(false);
    if (res.error) {
      setError(res.error);
    } else {
      setConfig(res.data);
      setEditingCust(false);
      setCustToken('');
      setSuccessMsg('Customer bot webhook registered successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleSaveAgentBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentToken.trim() || !agentUsername.trim()) {
      setError('Please provide bot token and bot username');
      return;
    }
    setSavingAgent(true);
    setError(null);
    const cleanUsername = agentUsername.trim().replace(/^@/, '');
    const chatIdNum = agentChatId.trim() ? Number(agentChatId.trim()) : undefined;

    const res = await configureAgentBot({
      botToken: agentToken.trim(),
      botUsername: cleanUsername,
      teamChatId: chatIdNum,
    });
    setSavingAgent(false);
    if (res.error) {
      setError(res.error);
    } else {
      setConfig(res.data);
      setEditingAgent(false);
      setAgentToken('');
      setSuccessMsg('Agent bot webhook registered successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleRotateSecret = async (botType: 'CUSTOMER' | 'AGENT') => {
    if (!confirm(`Are you sure you want to rotate webhook secrets for the ${botType.toLowerCase()} bot? In-flight requests will remain valid during the 90-second grace window.`)) {
      return;
    }
    setRotatingBot(botType);
    setError(null);
    const res = await rotateTelegramSecret(botType);
    setRotatingBot(null);
    if (res.error) {
      setError(res.error);
    } else {
      setConfig(res.data);
      setSuccessMsg(`${botType === 'CUSTOMER' ? 'Customer' : 'Agent'} bot secret rotated cleanly with zero downtime!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleGeneratePairingLink = async () => {
    if (!config?.agentBotUsername) {
      setError('Please configure and save the Agent Bot first');
      return;
    }
    const user = getStoredUser<{ id: string }>();
    if (!user?.id) {
      setError('User profile not detected. Please refresh session.');
      return;
    }
    setGeneratingLink(true);
    setError(null);
    const res = await generateAgentBindingLink(config.agentBotUsername, user.id);
    setGeneratingLink(false);
    if (res.error) {
      setError(res.error);
    } else {
      setPairingLink(res.deepLink);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active & Verified
          </span>
        );
      case 'ROTATING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <RotateCw className="w-3.5 h-3.5 animate-spin" /> Rotating Secrets
          </span>
        );
      case 'ROTATION_FAILED':
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Action Required
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Pending Setup
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-indigo-500/10 border border-sky-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-500 flex items-center justify-center shrink-0">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Telegram Dual-Bot Integration
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-sky-500/20 text-sky-600 dark:text-sky-400">
                100% Free API
              </span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">
              Connect isolated customer-facing AI bots and internal agent operations bots. Features zero-downtime secret rotation, lead auto-capture, and two-way swipe-to-reply.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-gray-100/80 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-750 backdrop-blur-sm w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('connector')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'connector'
              ? 'bg-white dark:bg-gray-900 text-sky-600 dark:text-sky-400 shadow-sm border border-gray-200/60 dark:border-gray-700/60'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <Plug className="w-3.5 h-3.5" />
          <span>Connector</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
            {config?.customerBotConfigured && config?.agentBotConfigured
              ? '2 Connected'
              : config?.customerBotConfigured || config?.agentBotConfigured
              ? '1 Connected'
              : 'Setup'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('menu_builder')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'menu_builder'
              ? 'bg-white dark:bg-gray-900 text-sky-600 dark:text-sky-400 shadow-sm border border-gray-200/60 dark:border-gray-700/60'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Menu Builder</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
            {greetingButtons.length} Inline • {replyButtons.length} Reply
          </span>
        </button>
      </div>

      {/* TAB 1: CONNECTOR */}
      {activeTab === 'connector' && (
        <div className="space-y-6">
          {/* Two Bot Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Customer / Visitor Bot */}
            <GlassCard className="p-6 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base">Customer Support Bot</h3>
                    <p className="text-xs text-gray-500">Public bot for AI inquiries, leads & tickets</p>
                  </div>
                </div>
                {getStatusBadge(config?.customerBotStatus)}
              </div>

              {config?.customerBotConfigured && !editingCust ? (
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Bot Username:</span>
                      <a
                        href={`https://t.me/${config.customerBotUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-sky-500 hover:underline flex items-center gap-1"
                      >
                        @{config.customerBotUsername} <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Webhook Status:</span>
                      <span className="font-medium text-emerald-500 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" /> Two-Factor Authenticated
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingCust(true)}
                      className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      Update Credentials
                    </button>
                    <button
                      type="button"
                      disabled={rotatingBot === 'CUSTOMER'}
                      onClick={() => handleRotateSecret('CUSTOMER')}
                      className="px-4 py-2 text-sm font-medium rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 transition flex items-center gap-2"
                    >
                      {rotatingBot === 'CUSTOMER' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
                      Rotate Secrets
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveCustomerBot} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bot Token (from @BotFather)
                    </label>
                    <div className="relative">
                      <input
                        type={custShowToken ? 'text' : 'password'}
                        value={custToken}
                        onChange={(e) => setCustToken(e.target.value)}
                        placeholder="7123456789:AAH..."
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-10 focus:ring-2 focus:ring-sky-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setCustShowToken(!custShowToken)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        {custShowToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bot Username
                    </label>
                    <input
                      type="text"
                      value={custUsername}
                      onChange={(e) => setCustUsername(e.target.value)}
                      placeholder="AcmeSupportBot"
                      className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={savingCust}
                      className="px-5 py-2 text-sm font-medium rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition flex items-center gap-2"
                    >
                      {savingCust && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save & Register Webhook
                    </button>
                    {config?.customerBotConfigured && (
                      <button
                        type="button"
                        onClick={() => setEditingCust(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </GlassCard>

            {/* Card 2: Agent / Staff Operations Bot */}
            <GlassCard className="p-6 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base">Agent Operations Bot</h3>
                    <p className="text-xs text-gray-500">Internal bot for lead alerts & swipe-to-reply</p>
                  </div>
                </div>
                {getStatusBadge(config?.agentBotStatus)}
              </div>

              {config?.agentBotConfigured && !editingAgent ? (
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Bot Username:</span>
                      <a
                        href={`https://t.me/${config.agentBotUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-indigo-500 hover:underline flex items-center gap-1"
                      >
                        @{config.agentBotUsername} <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Team Chat ID:</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300 text-xs">
                        {config.agentTeamChatId ? String(config.agentTeamChatId) : 'Private Direct Messages'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingAgent(true)}
                      className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      Update Credentials
                    </button>
                    <button
                      type="button"
                      disabled={rotatingBot === 'AGENT'}
                      onClick={() => handleRotateSecret('AGENT')}
                      className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition flex items-center gap-2"
                    >
                      {rotatingBot === 'AGENT' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
                      Rotate Secrets
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveAgentBot} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Agent Bot Token (from @BotFather)
                    </label>
                    <div className="relative">
                      <input
                        type={agentShowToken ? 'text' : 'password'}
                        value={agentToken}
                        onChange={(e) => setAgentToken(e.target.value)}
                        placeholder="7987654321:AAH..."
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-10 focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setAgentShowToken(!agentShowToken)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        {agentShowToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bot Username
                      </label>
                      <input
                        type="text"
                        value={agentUsername}
                        onChange={(e) => setAgentUsername(e.target.value)}
                        placeholder="AcmeTeamBot"
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Team Group Chat ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={agentChatId}
                        onChange={(e) => setAgentChatId(e.target.value)}
                        placeholder="-100123456789"
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={savingAgent}
                      className="px-5 py-2 text-sm font-medium rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition flex items-center gap-2"
                    >
                      {savingAgent && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save & Register Webhook
                    </button>
                    {config?.agentBotConfigured && (
                      <button
                        type="button"
                        onClick={() => setEditingAgent(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </GlassCard>
          </div>

          {/* Section 3: Agent Pairing & Deep-Link Card */}
          {config?.agentBotConfigured && (
            <GlassCard className="p-6 space-y-4 border-l-4 border-l-indigo-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                      Connect Your Personal Telegram Account
                    </h3>
                    <p className="text-xs text-gray-500">
                      Generate a secure 48-character single-use link to receive personal alerts and swipe-to-reply on mobile.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={generatingLink}
                  onClick={handleGeneratePairingLink}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition flex items-center gap-2 shrink-0"
                >
                  {generatingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate My Telegram Link
                </button>
              </div>

              {pairingLink && (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Single-use link valid for 15 minutes:</span>
                    <span className="text-emerald-500 font-medium">Ready to Pair</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={pairingLink}
                      className="w-full text-xs font-mono p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(pairingLink)}
                      className="px-3.5 py-2.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center gap-1.5 shrink-0"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      {copiedLink ? 'Copied' : 'Copy'}
                    </button>
                    <a
                      href={pairingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2.5 text-xs font-medium rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition flex items-center gap-1.5 shrink-0"
                    >
                      Open <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </GlassCard>
          )}

          {/* Setup Guide / BotFather Instructions */}
          <GlassCard className="p-6 space-y-3 bg-gray-50/50 dark:bg-gray-900/40">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-sky-500" /> Quick BotFather Setup Guide
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs text-gray-600 dark:text-gray-400">
              <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50">
                <span className="font-bold text-gray-900 dark:text-white">Step 1: Open @BotFather</span>
                <p className="mt-1">Search for <span className="text-sky-500">@BotFather</span> on Telegram and send the command <code>/newbot</code>.</p>
              </div>
              <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50">
                <span className="font-bold text-gray-900 dark:text-white">Step 2: Copy Bot Token</span>
                <p className="mt-1">Follow the prompts to name your bot. Copy the API token provided (e.g. <code>7123...:AAH...</code>).</p>
              </div>
              <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50">
                <span className="font-bold text-gray-900 dark:text-white">Step 3: Save Here</span>
                <p className="mt-1">Paste the token and bot username above. Our backend will automatically configure the secured webhooks.</p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB 2: MENU BUILDER */}
      {activeTab === 'menu_builder' && (
        <div className="space-y-6">
          {!config?.customerBotConfigured && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>
                  Customer Bot is not configured yet. Configure your Bot in the <b>Connector</b> tab to activate these automated greetings & menus.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('connector')}
                className="px-3.5 py-1.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition shrink-0"
              >
                Go to Connector →
              </button>
            </div>
          )}

          {/* Card 0: Core Business Flows Dynamic Buttons Toggle Card */}
          <GlassCard className="p-5 border-l-4 border-l-emerald-500 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-950 dark:text-white flex items-center gap-2">
                  <span>⚡</span> Core Business Flow Buttons (Dynamic Greeting Menu)
                  {savingFlowToggles && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Enable any combination (1, 2, or all 3). Enabled flows automatically appear on your customer Telegram menu without needing manual button configuration.
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                  {[showLeadFlow, showAppointmentFlow, showBookingFlow, showTalkToHuman].filter(Boolean).length} / 4 Active
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Enquiry / Lead Capture */}
              <div className={`p-3 rounded-xl border transition-all ${
                showLeadFlow
                  ? 'bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-500/10'
                  : 'bg-gray-50/60 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 opacity-70'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    📋 Enquire Now
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showLeadFlow}
                      onChange={(e) => handleToggleFlow('lead', e.target.checked)}
                      disabled={savingFlowToggles}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                  Lead capture &amp; quotation request form.
                </p>
                {showLeadFlow && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 block">
                      Button Label Name (Editable):
                    </label>
                    <input
                      type="text"
                      value={greetingButtons.find(b => b.type === 'FLOW' && b.payload === 'lead')?.text ?? waLeadLabel}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWaLeadLabel(val);
                        setGreetingButtons(prev => prev.map(b => (b.type === 'FLOW' && b.payload === 'lead' ? { ...b, text: val } : b)));
                      }}
                      placeholder="📋 Enquire Now"
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-emerald-300 dark:border-emerald-700/60 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                )}
              </div>

              {/* 2. Book Appointment */}
              <div className={`p-3 rounded-xl border transition-all ${
                showAppointmentFlow
                  ? 'bg-sky-500/5 border-sky-500/30 dark:bg-sky-500/10'
                  : 'bg-gray-50/60 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 opacity-70'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    📅 Book Appointment
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAppointmentFlow}
                      onChange={(e) => handleToggleFlow('appointment', e.target.checked)}
                      disabled={savingFlowToggles}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-sky-500"></div>
                  </label>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                  Consultation &amp; appointment booking schedule.
                </p>
                {showAppointmentFlow && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-sky-700 dark:text-sky-300 block">
                      Button Label Name (Editable):
                    </label>
                    <input
                      type="text"
                      value={greetingButtons.find(b => b.type === 'FLOW' && b.payload === 'appointment')?.text ?? waApptLabel}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWaApptLabel(val);
                        setGreetingButtons(prev => prev.map(b => (b.type === 'FLOW' && b.payload === 'appointment' ? { ...b, text: val } : b)));
                      }}
                      placeholder="📅 Book Appointment"
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-sky-300 dark:border-sky-700/60 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                    />
                  </div>
                )}
              </div>

              {/* 3. Book Service */}
              <div className={`p-3 rounded-xl border transition-all ${
                showBookingFlow
                  ? 'bg-purple-500/5 border-purple-500/30 dark:bg-purple-500/10'
                  : 'bg-gray-50/60 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 opacity-70'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    ✂️ Book Service
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBookingFlow}
                      onChange={(e) => handleToggleFlow('booking', e.target.checked)}
                      disabled={savingFlowToggles}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
                  </label>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                  Service selection &amp; session booking flow.
                </p>
                {showBookingFlow && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-purple-700 dark:text-purple-300 block">
                      Button Label Name (Editable):
                    </label>
                    <input
                      type="text"
                      value={greetingButtons.find(b => b.type === 'FLOW' && b.payload === 'booking')?.text ?? waBookingLabel}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWaBookingLabel(val);
                        setGreetingButtons(prev => prev.map(b => (b.type === 'FLOW' && b.payload === 'booking' ? { ...b, text: val } : b)));
                      }}
                      placeholder="✂️ Book Service"
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-purple-300 dark:border-purple-700/60 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                    />
                  </div>
                )}
              </div>

              {/* 4. Talk to Human / Live Agent Handoff */}
              <div className={`p-3 rounded-xl border transition-all ${
                showTalkToHuman
                  ? 'bg-amber-500/5 border-amber-500/30 dark:bg-amber-500/10'
                  : 'bg-gray-50/60 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 opacity-70'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    👤 Talk to Human
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTalkToHuman}
                      onChange={(e) => setShowTalkToHuman(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                  </label>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                  Live human agent handoff with waiting queue support.
                </p>
                {showTalkToHuman && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-amber-700 dark:text-amber-300 block">
                      Button Label Name (Editable):
                    </label>
                    <input
                      type="text"
                      value={talkToHumanLabel}
                      onChange={(e) => setTalkToHumanLabel(e.target.value)}
                      placeholder="👤 Talk to Human"
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-amber-300 dark:border-amber-700/60 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                    />
                  </div>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Card 1: Customer Greetings & Interactive Menu Configuration (0 to 10 buttons) */}
          <GlassCard className="p-6 space-y-6 border-l-4 border-l-sky-500">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    Customer Greetings & Interactive Menu
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                      {greetingButtons.length} / 10 Buttons
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Define automated greeting responses when visitors send "hi", "hello", "hey", or "/start", plus up to 10 interactive menu buttons.
                  </p>
                </div>
              </div>

              {greetingButtons.length < 10 && (
                <button
                  type="button"
                  onClick={handleAddGreetingButton}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Menu Button
                </button>
              )}
            </div>

            {/* Greeting Messages Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    First-Time Welcome Message
                  </label>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono">
                    New visitor
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={welcomeMsg}
                  onChange={(e) => setWelcomeMsg(e.target.value)}
                  placeholder="👋 Hello {name}! Welcome to {businessName}. How may we help you today?"
                  className="w-full text-xs p-3 rounded-lg border border-gray-200 dark:border-gray-750 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
                />
                <p className="text-[11px] text-gray-400">
                  Supported variables: <code className="text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-1 py-0.5 rounded">{'{name}'}</code>, <code className="text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-1 py-0.5 rounded">{'{businessName}'}</code>
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Returning Visitor Greeting Message
                  </label>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                    Returning visitor
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={returningMsg}
                  onChange={(e) => setReturningMsg(e.target.value)}
                  placeholder="👋 Welcome back, {name}! How can we assist you today?"
                  className="w-full text-xs p-3 rounded-lg border border-gray-200 dark:border-gray-750 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
                />
                <p className="text-[11px] text-gray-400">
                  Supported variables: <code className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1 py-0.5 rounded">{'{name}'}</code>, <code className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1 py-0.5 rounded">{'{businessName}'}</code>
                </p>
              </div>
            </div>

            {/* Interactive Menu Buttons Editor */}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                    Interactive Greeting Menu Buttons (0 to 10 Buttons)
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Inline buttons shown directly under the greeting message. Clicking triggers instant AI answers or opens external links.
                  </p>
                </div>
              </div>

              {greetingButtons.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-750 text-center space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    No menu buttons configured (0 buttons). The bot will send greeting text only and wait for customer questions.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddGreetingButton}
                    className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add First Menu Button (Max 10)
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {greetingButtons.map((btn, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-855/60 border border-gray-200 dark:border-gray-750 flex flex-col md:flex-row items-stretch md:items-center gap-3"
                    >
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-semibold text-gray-400 w-6">#{index + 1}</span>
                        {btn.type === 'FLOW' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            ⚡ Flow
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-[150px]">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                            Button Text
                          </label>
                          {btn.type === 'FLOW' && (
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              Editable Flow Label
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={btn.text}
                          onChange={(e) => handleUpdateGreetingButton(index, 'text', e.target.value)}
                          placeholder="e.g. 📋 Enquire Now or 📅 Book Appointment"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                        />
                      </div>

                      <div className="w-full md:w-44">
                        <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 block mb-1">
                          Action Type
                        </label>
                        <select
                          value={btn.type}
                          onChange={(e) => handleUpdateGreetingButton(index, 'type', e.target.value as any)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                        >
                          <option value="CALLBACK">🤖 AI Query / Topic</option>
                          <option value="SUB_MENU">📂 Open Sub-Menu (1 to 5)</option>
                          <option value="DIRECT_RESPONSE">💬 Direct Message Reply</option>
                          <option value="FLOW">⚡ Trigger CRM Flow</option>
                          <option value="URL">🌐 External URL</option>
                        </select>
                      </div>

                      {btn.type === 'SUB_MENU' && (
                        <div className="flex-1 min-w-[200px]">
                          <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 block mb-1">
                            Link to Sub-Menu (Max 10 Options)
                          </label>
                          <select
                            value={btn.subMenuId || 'custom_list_1'}
                            onChange={(e) => handleUpdateGreetingButton(index, 'subMenuId', e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                          >
                            {effectiveSubMenus.map((sm, sIdx) => (
                              <option key={sm.id} value={sm.id}>
                                {sm.triggerLabel || `Sub-Menu ${sIdx + 1}`} ({sm.itemsCount} options)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {btn.type === 'DIRECT_RESPONSE' && (
                        <div className="flex-1 min-w-[230px] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 block">
                              Link to Quick Response (Slot 1–6)
                            </label>
                            <RouterLink
                              to="/settings/quick-responses?tab=button-replies"
                              target="_blank"
                              className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-0.5 font-semibold"
                            >
                              Manage Quick Responses <ExternalLink className="w-2.5 h-2.5" />
                            </RouterLink>
                          </div>
                          <select
                            value={btn.quickResponseId || 'custom_msg_1'}
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              const matched = effectiveQuickResponses.find((q) => q.id === selectedId);
                              handleUpdateGreetingButtonMulti(index, {
                                quickResponseId: selectedId,
                                directResponse: matched?.text || btn.directResponse || '',
                                imageUrl: matched?.imageUrl || btn.imageUrl || '',
                              });
                            }}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                          >
                            {effectiveQuickResponses.map((qr, qIdx) => (
                              <option key={qr.id} value={qr.id}>
                                Slot #{qIdx + 1}: {qr.internalName} {qr.text ? `— "${qr.text.slice(0, 30)}..."` : '(Empty slot)'}
                              </option>
                            ))}
                          </select>
                          {(() => {
                            const curQr = effectiveQuickResponses.find((q) => q.id === (btn.quickResponseId || 'custom_msg_1'));
                            if (!curQr || (!curQr.text && !btn.directResponse)) {
                              return (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400">
                                  ⚠️ This slot is currently empty.{' '}
                                  <RouterLink to="/settings/quick-responses?tab=button-replies" target="_blank" className="underline font-medium">
                                    Configure response text ↗
                                  </RouterLink>
                                </p>
                              );
                            }
                            return (
                              <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 text-[11px] text-gray-600 dark:text-gray-300">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                                    {curQr.internalName}
                                  </span>
                                  {curQr.imageUrl && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-medium">
                                      📷 Media attached
                                    </span>
                                  )}
                                </div>
                                <p className="line-clamp-2 italic text-gray-500 dark:text-gray-400">
                                  "{curQr.text || btn.directResponse}"
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {btn.type === 'FLOW' && (
                        <div className="flex-1 min-w-[200px]">
                          <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 block mb-1">
                            Target Flow Action
                          </label>
                          <select
                            value={btn.payload || 'lead'}
                            onChange={(e) => handleUpdateGreetingButton(index, 'payload', e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                          >
                            <option value="lead">📋 Enquire Now / Lead Capture</option>
                            <option value="appointment">📅 Book Consultation / Appointment</option>
                            <option value="booking">✂️ Book Service / Booking</option>
                            <option value="catalog">💼 View Products & Catalog</option>
                            <option value="cancel_flow">🛑 Cancel Current Flow</option>
                          </select>
                        </div>
                      )}

                      {btn.type === 'URL' && (
                        <div className="flex-1 min-w-[200px]">
                          <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 block mb-1">
                            Destination URL
                          </label>
                          <input
                            type="text"
                            value={btn.payload || ''}
                            onChange={(e) => handleUpdateGreetingButton(index, 'payload', e.target.value)}
                            placeholder="https://example.com/demo"
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                        </div>
                      )}

                      {btn.type === 'CALLBACK' && (
                        <div className="flex-1 min-w-[200px]">
                          <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 block mb-1">
                            AI Topic / Prompt
                          </label>
                          <input
                            type="text"
                            value={btn.payload || ''}
                            onChange={(e) => handleUpdateGreetingButton(index, 'payload', e.target.value)}
                            placeholder="e.g. What services and plans do you offer?"
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                        </div>
                      )}

                      <div className="flex items-end justify-end pt-1 md:pt-4">
                        <button
                          type="button"
                          onClick={() => handleRemoveGreetingButton(index)}
                          title="Delete Button"
                          className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Layout: {Math.ceil(greetingButtons.length / 2)} {Math.ceil(greetingButtons.length / 2) === 1 ? 'Row' : 'Rows'} (2 buttons/row)
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveGreetings}
                      disabled={savingGreetings}
                      className="px-5 py-2 text-xs font-semibold rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {savingGreetings && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Save Greetings & Menu ({greetingButtons.length} Buttons)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Card 2: Customer Bot Bottom Reply Keyboard Configuration (0 to 8 buttons) */}
          <GlassCard className="p-6 space-y-5 border-l-4 border-l-emerald-500">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    Customer Reply Keyboard (Persistent Menu)
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {replyButtons.length} / 8 Buttons
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Configure between 0 and 8 quick-action buttons displayed at the bottom of the customer's Telegram chat.
                  </p>
                </div>
              </div>

              {replyButtons.length < 8 && (
                <button
                  type="button"
                  onClick={handleAddButton}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Button
                </button>
              )}
            </div>

            {replyButtons.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-750 text-center space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  No quick-reply buttons configured (0 buttons). Customers will see the default Telegram typing keyboard.
                </p>
                <button
                  type="button"
                  onClick={handleAddButton}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add First Button (Max 8)
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {replyButtons.map((btn, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-850/60 border border-gray-200 dark:border-gray-750 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                  >
                    <span className="text-xs font-semibold text-gray-400 w-6">#{index + 1}</span>

                    <div className="flex-1">
                      <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 block mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        value={btn.text}
                        onChange={(e) => handleUpdateButton(index, 'text', e.target.value)}
                        placeholder="e.g. 📱 Share Contact or 💼 Products"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="w-full sm:w-48">
                      <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 block mb-1">
                        Action Type
                      </label>
                      <select
                        value={btn.type}
                        onChange={(e) => handleUpdateButton(index, 'type', e.target.value as any)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="TEXT">🤖 AI Query (Sends Text)</option>
                        <option value="SUB_MENU">📂 Open Sub-Menu (1 to 5)</option>
                        <option value="DIRECT_RESPONSE">💬 Direct Message Reply</option>
                        <option value="REQUEST_CONTACT">📱 1-Tap Phone Share</option>
                        <option value="REQUEST_LOCATION">📍 Share Location</option>
                      </select>
                    </div>

                    {btn.type === 'SUB_MENU' && (
                      <div className="flex-1 min-w-[180px]">
                        <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 block mb-1">
                          Linked Sub-Menu (Max 10 Options)
                        </label>
                        <select
                          value={btn.subMenuId || 'custom_list_1'}
                          onChange={(e) => handleUpdateButton(index, 'subMenuId', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          {effectiveSubMenus.map((sm, sIdx) => (
                            <option key={sm.id} value={sm.id}>
                              {sm.triggerLabel || `Sub-Menu ${sIdx + 1}`} ({sm.itemsCount} options)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {btn.type === 'DIRECT_RESPONSE' && (
                      <div className="flex-1 min-w-[230px] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 block">
                            Link to Quick Response (Slot 1–6)
                          </label>
                          <RouterLink
                            to="/settings/quick-responses?tab=button-replies"
                            target="_blank"
                            className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5 font-semibold"
                          >
                            Manage Quick Responses <ExternalLink className="w-2.5 h-2.5" />
                          </RouterLink>
                        </div>
                        <select
                          value={btn.quickResponseId || 'custom_msg_1'}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            const matched = effectiveQuickResponses.find((q) => q.id === selectedId);
                            handleUpdateReplyButtonMulti(index, {
                              quickResponseId: selectedId,
                              directResponse: matched?.text || btn.directResponse || '',
                              imageUrl: matched?.imageUrl || btn.imageUrl || '',
                            });
                          }}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          {effectiveQuickResponses.map((qr, qIdx) => (
                            <option key={qr.id} value={qr.id}>
                              Slot #{qIdx + 1}: {qr.internalName} {qr.text ? `— "${qr.text.slice(0, 30)}..."` : '(Empty slot)'}
                            </option>
                          ))}
                        </select>
                        {(() => {
                          const curQr = effectiveQuickResponses.find((q) => q.id === (btn.quickResponseId || 'custom_msg_1'));
                          if (!curQr || (!curQr.text && !btn.directResponse)) {
                            return (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400">
                                ⚠️ This slot is currently empty.{' '}
                                <RouterLink to="/settings/quick-responses?tab=button-replies" target="_blank" className="underline font-medium">
                                  Configure response text ↗
                                </RouterLink>
                              </p>
                            );
                          }
                          return (
                            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 text-[11px] text-gray-600 dark:text-gray-300">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="font-semibold text-gray-800 dark:text-gray-200">
                                  {curQr.internalName}
                                </span>
                                {curQr.imageUrl && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                                    📷 Media attached
                                  </span>
                                )}
                              </div>
                              <p className="line-clamp-2 italic text-gray-500 dark:text-gray-400">
                                "{curQr.text || btn.directResponse}"
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    <div className="flex items-end justify-end pt-1 sm:pt-4">
                      <button
                        type="button"
                        onClick={() => handleRemoveButton(index)}
                        title="Delete Button"
                        className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Layout: {Math.ceil(replyButtons.length / 2)} {Math.ceil(replyButtons.length / 2) === 1 ? 'Row' : 'Rows'} (2 buttons/row)
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveKeyboard}
                    disabled={savingKeyboard}
                    className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {savingKeyboard && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Reply Keyboard ({replyButtons.length} Buttons)
                  </button>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}

