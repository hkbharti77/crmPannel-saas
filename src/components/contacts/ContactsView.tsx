import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassCard, Badge } from '@/components/ui/primitives';
import {
  Search,
  Loader2,
  AlertTriangle,
  Users,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Plus,
  Filter,
  Download,
  ArrowUpDown,
  Upload,
  RefreshCw,
  MessageSquare,
  Bot,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  ExternalLink,
  X,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { fetchContacts, deleteContact, exportContacts, type ContactDTO } from '@/lib/contactsApi';
import { CreateContactModal } from './CreateContactModal';
import { ImportContactsModal } from './ImportContactsModal';

type QuickFilterType = 'ALL' | 'BOT_ACTIVE' | 'BOT_PAUSED' | 'WA_OPT_IN' | 'MAIL_OPT_IN' | 'SMS_OPT_IN' | 'MKT_OPT_OUT';

export function ContactsView() {
  const [contacts, setContacts] = useState<ContactDTO[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Advanced filters
  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [filterBotStatus, setFilterBotStatus] = useState<string>('ALL');
  const [filterMarketing, setFilterMarketing] = useState<string>('ALL');
  const [filterWaConsent, setFilterWaConsent] = useState<string>('ALL');
  const [filterEmailConsent, setFilterEmailConsent] = useState<string>('ALL');
  const [filterSmsConsent, setFilterSmsConsent] = useState<string>('ALL');

  const navigate = useNavigate();

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    const res = await fetchContacts();
    if (res.error) {
      setApiError(res.error);
    } else if (res.data) {
      setContacts(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const confirmDelete = async () => {
    if (!contactToDelete) return;
    setDeletingId(contactToDelete);
    const res = await deleteContact(contactToDelete);
    if (!res.error) {
      setContacts((prev) => prev.filter((c) => c.id !== contactToDelete));
      setSelectedContacts((prev) => {
        const next = new Set(prev);
        next.delete(contactToDelete);
        return next;
      });
    } else {
      setApiError(res.error);
    }
    setDeletingId(null);
    setContactToDelete(null);
  };

  const confirmBatchDelete = async () => {
    if (selectedContacts.size === 0) return;
    setIsBatchDeleting(true);
    const idsToDelete = Array.from(selectedContacts);
    let errorCount = 0;

    for (const id of idsToDelete) {
      const res = await deleteContact(id);
      if (res.error) {
        errorCount++;
      } else {
        setContacts((prev) => prev.filter((c) => c.id !== id));
      }
    }

    if (errorCount > 0) {
      setApiError(`Failed to delete ${errorCount} contact(s).`);
    }

    setSelectedContacts(new Set());
    setIsBatchDeleting(false);
    setShowBatchDeleteModal(false);
  };

  const copyToClipboard = (text: string, id: string, e: React.SyntheticEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const activeAdvancedFilterCount = useMemo(() => {
    let count = 0;
    if (filterSource !== 'ALL') count++;
    if (filterBotStatus !== 'ALL') count++;
    if (filterMarketing !== 'ALL') count++;
    if (filterWaConsent !== 'ALL') count++;
    if (filterEmailConsent !== 'ALL') count++;
    if (filterSmsConsent !== 'ALL') count++;
    return count;
  }, [filterSource, filterBotStatus, filterMarketing, filterWaConsent, filterEmailConsent, filterSmsConsent]);

  const resetFilters = () => {
    setFilterSource('ALL');
    setFilterBotStatus('ALL');
    setFilterMarketing('ALL');
    setFilterWaConsent('ALL');
    setFilterEmailConsent('ALL');
    setFilterSmsConsent('ALL');
    setQuickFilter('ALL');
    setQuery('');
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const total = contacts.length;
    const waVerified = contacts.filter((c) => (c.source || '').toUpperCase() === 'WHATSAPP' || !!c.waId).length;
    const botActive = contacts.filter((c) => !c.botPaused).length;
    const consentOpted = contacts.filter(
      (c) =>
        c.whatsappConsentStatus === 'OPTED_IN' ||
        c.emailConsentStatus === 'OPTED_IN' ||
        c.smsConsentStatus === 'OPTED_IN'
    ).length;
    return { total, waVerified, botActive, consentOpted };
  }, [contacts]);

  // Main filter pipeline
  const filtered = useMemo(() => {
    let result = [...contacts];

    // Quick filter preset
    if (quickFilter === 'BOT_ACTIVE') {
      result = result.filter((c) => !c.botPaused);
    } else if (quickFilter === 'BOT_PAUSED') {
      result = result.filter((c) => !!c.botPaused);
    } else if (quickFilter === 'WA_OPT_IN') {
      result = result.filter((c) => c.whatsappConsentStatus === 'OPTED_IN');
    } else if (quickFilter === 'MAIL_OPT_IN') {
      result = result.filter((c) => c.emailConsentStatus === 'OPTED_IN');
    } else if (quickFilter === 'SMS_OPT_IN') {
      result = result.filter((c) => c.smsConsentStatus === 'OPTED_IN');
    } else if (quickFilter === 'MKT_OPT_OUT') {
      result = result.filter((c) => !!c.marketingOptedOut || c.whatsappConsentStatus === 'OPTED_OUT');
    }

    // Advanced filters
    if (filterSource !== 'ALL') {
      result = result.filter((c) => (c.source || 'Manual').toUpperCase() === filterSource);
    }

    if (filterBotStatus !== 'ALL') {
      const isPaused = filterBotStatus === 'PAUSED';
      result = result.filter((c) => !!c.botPaused === isPaused);
    }

    if (filterMarketing !== 'ALL') {
      const isOptedOut = filterMarketing === 'OPTED_OUT';
      result = result.filter((c) => !!c.marketingOptedOut === isOptedOut);
    }

    if (filterWaConsent !== 'ALL') {
      result = result.filter((c) => (c.whatsappConsentStatus || 'UNKNOWN') === filterWaConsent);
    }

    if (filterEmailConsent !== 'ALL') {
      result = result.filter((c) => (c.emailConsentStatus || 'UNKNOWN') === filterEmailConsent);
    }

    if (filterSmsConsent !== 'ALL') {
      result = result.filter((c) => (c.smsConsentStatus || 'UNKNOWN') === filterSmsConsent);
    }

    // Query filter
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.phone && c.phone.toLowerCase().includes(q)) ||
          (c.waId && c.waId.toLowerCase().includes(q)) ||
          (c.bsuid && c.bsuid.toLowerCase().includes(q)) ||
          (c.tags && c.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // Sorting
    result.sort((a, b) => {
      const nameA = (a.name || a.waId || '').toLowerCase();
      const nameB = (b.name || b.waId || '').toLowerCase();
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

    return result;
  }, [
    contacts,
    quickFilter,
    filterSource,
    filterBotStatus,
    filterMarketing,
    filterWaConsent,
    filterEmailConsent,
    filterSmsConsent,
    query,
    sortOrder,
  ]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, quickFilter, filterSource, filterBotStatus, filterMarketing, filterWaConsent, filterEmailConsent, filterSmsConsent, itemsPerPage]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedContacts(new Set(paginatedContacts.map((c) => c.id)));
    } else {
      setSelectedContacts(new Set());
    }
  };

  const toggleSelect = (e: React.SyntheticEvent, id: string) => {
    e.stopPropagation();
    setSelectedContacts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = paginatedContacts.length > 0 && paginatedContacts.every((c) => selectedContacts.has(c.id));
  const isIndeterminate = paginatedContacts.some((c) => selectedContacts.has(c.id)) && !allSelected;

  const handleExport = async () => {
    setIsExporting(true);
    setApiError(null);
    const { error } = await exportContacts(query, filterSource, filterBotStatus, filterMarketing);
    if (error) {
      setApiError(error);
    }
    setIsExporting(false);
  };

  const quickFilterTabs: { key: QuickFilterType; label: string; count?: number }[] = [
    { key: 'ALL', label: 'All Contacts', count: contacts.length },
    { key: 'BOT_ACTIVE', label: 'AI Bot Active', count: metrics.botActive },
    { key: 'BOT_PAUSED', label: 'Bot Paused' },
    { key: 'WA_OPT_IN', label: 'WhatsApp Opt-In' },
    { key: 'MAIL_OPT_IN', label: 'Email Opt-In' },
    { key: 'SMS_OPT_IN', label: 'SMS Opt-In' },
    { key: 'MKT_OPT_OUT', label: 'Opted Out' },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8 animate-fade-in">
      {/* Enterprise Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/20 via-indigo-600/15 to-purple-600/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-md shadow-blue-500/5">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-primary-c lg:text-2xl">
                Contacts Directory
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="mt-0.5 text-xs text-secondary-c">
              Omni-channel identity resolution, WhatsApp messaging profiles & compliance consent directory.
            </p>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <button
            onClick={loadContacts}
            disabled={loading}
            title="Reload Contacts"
            className="inline-flex items-center gap-1.5 rounded-xl border border-base-c bg-card-c px-3 py-2 text-xs font-bold text-secondary-c hover:text-primary-c hover:border-primary-500/40 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            title="Export Directory to CSV"
            className="inline-flex items-center gap-1.5 rounded-xl border border-base-c bg-card-c px-3.5 py-2 text-xs font-bold text-secondary-c hover:text-primary-c hover:border-primary-500/40 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            title="Bulk CSV Contact Import"
            className="inline-flex items-center gap-1.5 rounded-xl border border-base-c bg-card-c px-3.5 py-2 text-xs font-bold text-secondary-c hover:text-primary-c hover:border-primary-500/40 shadow-xs transition-all cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-accent text-white px-4 py-2 text-xs font-bold shadow-md shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Contact</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {apiError && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-medium text-rose-600 dark:text-rose-400">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button onClick={() => setApiError(null)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Enterprise KPI Summary Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-4 flex items-center justify-between rounded-2xl border border-base-c bg-card-c shadow-xs hover:shadow-md transition-all">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-c">Total Contacts</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-primary-c tabular-nums">
              {metrics.total.toLocaleString('en-IN')}
            </p>
            <p className="mt-1 text-[11px] text-secondary-c">Registered CRM database</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center justify-between rounded-2xl border border-base-c bg-card-c shadow-xs hover:shadow-md transition-all">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-c">WhatsApp Profiles</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              {metrics.waVerified.toLocaleString('en-IN')}
            </p>
            <p className="mt-1 text-[11px] text-secondary-c">Verified messaging channels</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            <MessageSquare className="h-5 w-5" />
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center justify-between rounded-2xl border border-base-c bg-card-c shadow-xs hover:shadow-md transition-all">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-c">AI Bot Automation</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 tabular-nums">
              {metrics.botActive.toLocaleString('en-IN')}
            </p>
            <p className="mt-1 text-[11px] text-secondary-c">
              {metrics.total > 0 ? `${Math.round((metrics.botActive / metrics.total) * 100)}% auto-piloted` : '0% auto-piloted'}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
            <Bot className="h-5 w-5" />
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center justify-between rounded-2xl border border-base-c bg-card-c shadow-xs hover:shadow-md transition-all">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-c">Consent Opted-In</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400 tabular-nums">
              {metrics.consentOpted.toLocaleString('en-IN')}
            </p>
            <p className="mt-1 text-[11px] text-secondary-c">Compliant marketing opt-ins</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </GlassCard>
      </div>

      {/* Main Enterprise Contacts Container */}
      <GlassCard className="rounded-3xl border border-base-c bg-card-c shadow-xs overflow-hidden">
        {/* Top Control Bar: Search & Quick Filters */}
        <div className="p-5 border-b border-base-c space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, phone, email, WhatsApp ID or tags…"
                className="w-full rounded-xl border border-base-c bg-subtle-c/60 py-2.5 pl-10 pr-9 text-xs text-primary-c placeholder:text-muted-c transition-all focus:border-blue-500 focus:bg-card-c focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-c hover:text-primary-c cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Toggle & Sorter */}
            <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
              <button
                onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-base-c bg-card-c px-3 py-2 text-xs font-bold text-secondary-c hover:text-primary-c transition-all cursor-pointer"
                title={`Sort Name ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sort: {sortOrder === 'asc' ? 'A → Z' : 'Z → A'}</span>
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  showFilters || activeAdvancedFilterCount > 0
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'border-base-c bg-card-c text-secondary-c hover:text-primary-c'
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                <span>Filters</span>
                {activeAdvancedFilterCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-extrabold text-white">
                    {activeAdvancedFilterCount}
                  </span>
                )}
                <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick Filter Pill Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {quickFilterTabs.map((tab) => {
              const active = quickFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setQuickFilter(tab.key)}
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'border border-base-c bg-card-c text-secondary-c hover:text-primary-c hover:border-blue-500/30'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                        active ? 'bg-white/20 text-white' : 'bg-subtle-c text-muted-c'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Collapsible Advanced Filters Drawer */}
          {showFilters && (
            <div className="rounded-2xl border border-base-c bg-subtle-c/40 p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-base-c/60 pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-primary-c flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 text-blue-500" /> Advanced Filter Criteria
                </span>
                <button
                  onClick={resetFilters}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-muted-c">Origin Source</label>
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="w-full rounded-xl border border-base-c bg-card-c px-2.5 py-2 text-xs text-primary-c focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ALL">All Sources</option>
                    <option value="MANUAL">Manual Entry</option>
                    <option value="WHATSAPP">WhatsApp Inbound</option>
                    <option value="API">API Integration</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-muted-c">AI Bot State</label>
                  <select
                    value={filterBotStatus}
                    onChange={(e) => setFilterBotStatus(e.target.value)}
                    className="w-full rounded-xl border border-base-c bg-card-c px-2.5 py-2 text-xs text-primary-c focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ALL">All States</option>
                    <option value="ACTIVE">Bot Responding</option>
                    <option value="PAUSED">Human Takeover</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-muted-c">WhatsApp Consent</label>
                  <select
                    value={filterWaConsent}
                    onChange={(e) => setFilterWaConsent(e.target.value)}
                    className="w-full rounded-xl border border-base-c bg-card-c px-2.5 py-2 text-xs text-primary-c focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ALL">All WA</option>
                    <option value="OPTED_IN">Opted In</option>
                    <option value="OPTED_OUT">Opted Out</option>
                    <option value="UNKNOWN">Default / Unknown</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-muted-c">Email Consent</label>
                  <select
                    value={filterEmailConsent}
                    onChange={(e) => setFilterEmailConsent(e.target.value)}
                    className="w-full rounded-xl border border-base-c bg-card-c px-2.5 py-2 text-xs text-primary-c focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ALL">All Email</option>
                    <option value="OPTED_IN">Opted In</option>
                    <option value="OPTED_OUT">Opted Out</option>
                    <option value="UNKNOWN">Default / Unknown</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-muted-c">SMS Consent</label>
                  <select
                    value={filterSmsConsent}
                    onChange={(e) => setFilterSmsConsent(e.target.value)}
                    className="w-full rounded-xl border border-base-c bg-card-c px-2.5 py-2 text-xs text-primary-c focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ALL">All SMS</option>
                    <option value="OPTED_IN">Opted In</option>
                    <option value="OPTED_OUT">Opted Out</option>
                    <option value="UNKNOWN">Default / Unknown</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-muted-c">Marketing Scope</label>
                  <select
                    value={filterMarketing}
                    onChange={(e) => setFilterMarketing(e.target.value)}
                    className="w-full rounded-xl border border-base-c bg-card-c px-2.5 py-2 text-xs text-primary-c focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ALL">All Contacts</option>
                    <option value="OPTED_OUT">Opted Out Only</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floating Batch Selection Bar */}
        {selectedContacts.size > 0 && (
          <div className="bg-blue-600 text-white px-5 py-3 flex items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                {selectedContacts.size}
              </span>
              <span className="text-xs font-bold">
                {selectedContacts.size} contact{selectedContacts.size > 1 ? 's' : ''} selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedContacts(new Set())}
                className="rounded-xl bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={() => setShowBatchDeleteModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 px-3 py-1.5 text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Selected</span>
              </button>
            </div>
          </div>
        )}

        {/* Enterprise Data Table */}
        <div className="overflow-x-auto min-h-[380px]">
          <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
            <thead className="bg-subtle-c/80 sticky top-0 z-10 border-b border-base-c backdrop-blur-md">
              <tr>
                <th className="px-5 py-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-base-c text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-muted-c">
                  Contact & Identity
                </th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-muted-c">
                  Communication
                </th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-muted-c">
                  Compliance Consent
                </th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-muted-c">
                  Tags
                </th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-muted-c">
                  Origin
                </th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-muted-c">
                  Bot Status
                </th>
                <th className="px-5 py-3.5 text-right font-bold uppercase tracking-wider text-muted-c">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-base-c/60">
              {loading && contacts.length === 0 ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={`skel-row-${idx}`} className="animate-pulse">
                    <td className="px-5 py-4">
                      <Skeleton variant="rect" width={16} height={16} className="mx-auto rounded" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton variant="circle" width={38} height={38} />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton variant="text" width="60%" height={14} />
                          <Skeleton variant="text" width="40%" height={10} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton variant="text" width="75%" height={14} />
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton variant="rect" width={130} height={22} className="rounded-lg" />
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton variant="rect" width={90} height={20} className="rounded-md" />
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton variant="rect" width={55} height={20} className="rounded-md" />
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton variant="rect" width={65} height={22} className="rounded-full" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Skeleton variant="rect" width={32} height={32} className="ml-auto rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 px-6">
                    {contacts.length === 0 ? (
                      <EmptyState
                        icon={Users}
                        title="Your contacts directory is empty"
                        description="Start building your customer CRM by adding your first contact or importing via CSV file."
                        action={{
                          label: 'Add Contact',
                          onClick: () => setIsCreateModalOpen(true),
                          icon: Plus,
                        }}
                        secondaryAction={{
                          label: 'Import CSV',
                          onClick: () => setIsImportModalOpen(true),
                        }}
                      />
                    ) : (
                      <EmptyState
                        icon={Search}
                        title="No matching contacts found"
                        description="Try adjusting your keyword query, removing active filter chips, or clearing search criteria."
                        action={{
                          label: 'Reset Filters',
                          onClick: resetFilters,
                        }}
                      />
                    )}
                  </td>
                </tr>
              ) : (
                paginatedContacts.map((contact) => {
                  const isSelected = selectedContacts.has(contact.id);
                  const isBotActive = !contact.botPaused;
                  const initials = contact.name
                    ? contact.name
                        .split(' ')
                        .filter(Boolean)
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'C';

                  const identifier = contact.waId || contact.phone || contact.bsuid || '—';

                  return (
                    <tr
                      key={contact.id}
                      onClick={() => navigate(`/contacts/${contact.id}`)}
                      className={`group cursor-pointer transition-colors hover:bg-subtle-c/50 ${
                        isSelected ? 'bg-blue-500/5 dark:bg-blue-500/10' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleSelect(e, contact.id)}
                            className="h-4 w-4 rounded border-base-c text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                      </td>

                      {/* Contact Identity */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-bold text-xs shadow-xs transition-transform duration-200 group-hover:scale-105 ${
                              isBotActive
                                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
                                : 'bg-slate-200 text-slate-700 dark:bg-ink-800 dark:text-slate-300'
                            }`}
                          >
                            {initials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-primary-c group-hover:text-blue-600 transition-colors truncate">
                              {contact.name || 'Unnamed Contact'}
                            </span>
                            <span className="text-[11px] font-mono text-muted-c truncate mt-0.5">
                              {identifier}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Communication */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1 min-w-[140px]">
                          {contact.email ? (
                            <div className="flex items-center gap-1.5 text-secondary-c group/email">
                              <Mail className="h-3 w-3 text-muted-c shrink-0" />
                              <span className="truncate">{contact.email}</span>
                              <button
                                onClick={(e) => copyToClipboard(contact.email!, `mail-${contact.id}`, e)}
                                title="Copy email address"
                                className="opacity-0 group-hover/email:opacity-100 text-muted-c hover:text-primary-c transition-opacity cursor-pointer shrink-0"
                              >
                                {copiedId === `mail-${contact.id}` ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted-c">No email registered</span>
                          )}

                          {contact.phone || contact.waId ? (
                            <div className="flex items-center gap-1.5 text-muted-c group/phone">
                              <Phone className="h-3 w-3 shrink-0" />
                              <span className="font-mono text-[11px] truncate">
                                {contact.phone || contact.waId}
                              </span>
                              <button
                                onClick={(e) => copyToClipboard(contact.phone || contact.waId!, `phone-${contact.id}`, e)}
                                title="Copy phone number"
                                className="opacity-0 group-hover/phone:opacity-100 text-muted-c hover:text-primary-c transition-opacity cursor-pointer shrink-0"
                              >
                                {copiedId === `phone-${contact.id}` ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* Multi-Channel Consent Status */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap max-w-[240px]">
                          {/* WhatsApp Consent */}
                          <span
                            title={`WhatsApp Consent: ${contact.whatsappConsentStatus || 'UNKNOWN'}`}
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                              contact.whatsappConsentStatus === 'OPTED_IN'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : contact.whatsappConsentStatus === 'OPTED_OUT' || contact.marketingOptedOut
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
                            }`}
                          >
                            <span>WA:</span>
                            <span>
                              {contact.whatsappConsentStatus === 'OPTED_IN'
                                ? 'In'
                                : contact.whatsappConsentStatus === 'OPTED_OUT' || contact.marketingOptedOut
                                ? 'Out'
                                : 'Default'}
                            </span>
                          </span>

                          {/* Email Consent */}
                          <span
                            title={`Email Consent: ${contact.emailConsentStatus || 'UNKNOWN'}`}
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                              contact.emailConsentStatus === 'OPTED_IN'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : contact.emailConsentStatus === 'OPTED_OUT'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
                            }`}
                          >
                            <span>Mail:</span>
                            <span>
                              {contact.emailConsentStatus === 'OPTED_IN'
                                ? 'In'
                                : contact.emailConsentStatus === 'OPTED_OUT'
                                ? 'Out'
                                : 'Default'}
                            </span>
                          </span>

                          {/* SMS Consent */}
                          <span
                            title={`SMS Consent: ${contact.smsConsentStatus || 'UNKNOWN'}`}
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                              contact.smsConsentStatus === 'OPTED_IN'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : contact.smsConsentStatus === 'OPTED_OUT'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
                            }`}
                          >
                            <span>SMS:</span>
                            <span>
                              {contact.smsConsentStatus === 'OPTED_IN'
                                ? 'In'
                                : contact.smsConsentStatus === 'OPTED_OUT'
                                ? 'Out'
                                : 'Default'}
                            </span>
                          </span>
                        </div>
                      </td>

                      {/* Tags */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[170px]">
                          {contact.tags && contact.tags.length > 0 ? (
                            <>
                              {contact.tags.slice(0, 2).map((t) => (
                                <span
                                  key={t}
                                  className="inline-flex items-center rounded-md bg-subtle-c px-2 py-0.5 text-[10px] font-bold text-secondary-c truncate border border-base-c/60"
                                >
                                  {t}
                                </span>
                              ))}
                              {contact.tags.length > 2 && (
                                <span className="inline-flex items-center rounded-md bg-subtle-c px-1.5 py-0.5 text-[10px] font-bold text-muted-c border border-base-c/60">
                                  +{contact.tags.length - 2}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-c">—</span>
                          )}
                        </div>
                      </td>

                      {/* Origin */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-lg border border-base-c bg-subtle-c/80 px-2 py-1 text-[10px] font-bold text-secondary-c uppercase tracking-wider">
                          {contact.source || 'Manual'}
                        </span>
                      </td>

                      {/* Bot Status */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          {isBotActive ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 w-fit">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Bot Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 w-fit">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Paused
                            </span>
                          )}

                          {contact.marketingOptedOut && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[9px] font-bold text-rose-600 dark:text-rose-400 w-fit">
                              Mkt Opt-Out
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/contacts/${contact.id}`)}
                            title="Open Profile"
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-base-c bg-card-c text-secondary-c hover:text-blue-600 hover:border-blue-500/40 shadow-xs transition-all cursor-pointer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => setContactToDelete(contact.id)}
                            disabled={deletingId === contact.id}
                            title="Delete Contact"
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-base-c bg-card-c text-secondary-c hover:text-rose-600 hover:border-rose-500/40 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            {deletingId === contact.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Enterprise Pagination Bar */}
        {totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-base-c bg-subtle-c/40 p-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-c font-medium">Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-xl border border-base-c bg-card-c px-2 py-1 text-xs font-bold text-primary-c focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                {[10, 25, 50, 100].map((sz) => (
                  <option key={sz} value={sz}>
                    {sz}
                  </option>
                ))}
              </select>

              <span className="text-xs text-muted-c font-medium ml-2">
                Showing{' '}
                <strong className="text-primary-c">
                  {(currentPage - 1) * itemsPerPage + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-primary-c">
                  {Math.min(currentPage * itemsPerPage, filtered.length)}
                </strong>{' '}
                of <strong className="text-primary-c">{filtered.length}</strong> contacts
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-base-c bg-card-c text-secondary-c hover:text-primary-c disabled:opacity-40 disabled:hover:text-secondary-c shadow-xs transition-all cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="px-3 text-xs font-bold text-primary-c">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-base-c bg-card-c text-secondary-c hover:text-primary-c disabled:opacity-40 disabled:hover:text-secondary-c shadow-xs transition-all cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Delete Single Contact Modal */}
      <ConfirmModal
        isOpen={contactToDelete !== null}
        title="Delete Contact"
        message="Are you sure you want to delete this contact? All associated messaging logs, leads, and consent tokens will be permanently removed."
        confirmText="Delete Contact"
        loading={deletingId !== null}
        onConfirm={confirmDelete}
        onCancel={() => setContactToDelete(null)}
      />

      {/* Batch Delete Modal */}
      <ConfirmModal
        isOpen={showBatchDeleteModal}
        title={`Batch Delete ${selectedContacts.size} Contacts`}
        message={`Are you sure you want to permanently delete all ${selectedContacts.size} selected contacts? This action is irreversible.`}
        confirmText={`Delete ${selectedContacts.size} Contacts`}
        loading={isBatchDeleting}
        onConfirm={confirmBatchDelete}
        onCancel={() => setShowBatchDeleteModal(false)}
      />

      {/* Create Contact Modal */}
      {isCreateModalOpen && (
        <CreateContactModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            loadContacts();
          }}
        />
      )}

      {/* Import Contacts Modal */}
      {isImportModalOpen && (
        <ImportContactsModal
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            loadContacts();
          }}
        />
      )}
    </div>
  );
}
