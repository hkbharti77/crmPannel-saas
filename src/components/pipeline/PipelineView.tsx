import { useState, useMemo, useEffect, useRef } from 'react';
import { cx } from '@/lib/types';
import { STAGE_CONFIG, type Lead } from './pipelineData';
import { PipelineStats } from './PipelineStats';
import { KanbanColumn } from './KanbanBoard';
import {
  fetchLeadsPaged,
  updateLeadStatus,
  downloadLeadsExport,
  type LeadDTO,
} from '@/lib/leadsApi';
import { Search, Plus, Download, RefreshCw, LayoutGrid, List as ListIcon, Mail, Calendar, ChevronDown, Check, X, Clock } from 'lucide-react';
import { PipelineTableView } from './PipelineTableView';
import { LeadEmailModal } from './LeadEmailModal';

type FilterId = 'all' | 'hot' | 'vip' | 'mine';

export type TimeRangePreset = 'ALL' | 'TODAY' | 'YESTERDAY' | '7D' | '30D' | 'THIS_MONTH' | 'CUSTOM';

const TIME_RANGE_OPTIONS: { id: TimeRangePreset; label: string }[] = [
  { id: 'ALL', label: 'All Time' },
  { id: 'TODAY', label: 'Today' },
  { id: 'YESTERDAY', label: 'Yesterday' },
  { id: '7D', label: 'Last 7 Days' },
  { id: '30D', label: 'Last 30 Days' },
  { id: 'THIS_MONTH', label: 'This Month' },
  { id: 'CUSTOM', label: 'Custom Range' },
];

function parseLeadDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const normalized = dateStr.includes(' ') && !dateStr.includes('T')
    ? dateStr.replace(' ', 'T')
    : dateStr;
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

function isWithinTimeRange(
  dateStr?: string,
  range: TimeRangePreset = 'ALL',
  customStart?: string,
  customEnd?: string
): boolean {
  if (range === 'ALL') return true;
  const leadDate = parseLeadDate(dateStr);
  if (!leadDate) return false;

  const now = new Date();

  if (range === 'TODAY') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return leadDate >= start && leadDate <= end;
  }

  if (range === 'YESTERDAY') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    return leadDate >= start && leadDate <= end;
  }

  if (range === '7D') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return leadDate >= start && leadDate <= end;
  }

  if (range === '30D') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return leadDate >= start && leadDate <= end;
  }

  if (range === 'THIS_MONTH') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return leadDate >= start && leadDate <= end;
  }

  if (range === 'CUSTOM') {
    if (customStart) {
      const [sY, sM, sD] = customStart.split('-').map(Number);
      const start = new Date(sY, sM - 1, sD, 0, 0, 0, 0);
      if (leadDate < start) return false;
    }
    if (customEnd) {
      const [eY, eM, eD] = customEnd.split('-').map(Number);
      const end = new Date(eY, eM - 1, eD, 23, 59, 59, 999);
      if (leadDate > end) return false;
    }
    return true;
  }

  return true;
}

function normalizeStage(status?: string): Lead['stage'] {
  if (!status) return 'NEW';
  const s = status.toUpperCase();
  if (s === 'NEW') return 'NEW';
  if (s === 'INTERESTED' || s === 'FOLLOW_UP' || s === 'CONTACTED') return 'CONTACTED';
  if (s === 'BOOKED' || s === 'QUALIFIED') return 'QUALIFIED';
  if (s === 'CLOSED_WON' || s === 'WON') return 'WON';
  if (s === 'CLOSED_LOST' || s === 'LOST') return 'LOST';
  return 'NEW';
}

import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';

export function PipelineView() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  const onOpenLead = (lead: Lead) => {
    navigate(`/leaddetail/${lead.id}`, { state: { leadObj: lead } });
  };
  const [leads, setLeads] = useState<Lead[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');
  const [timeRange, setTimeRange] = useState<TimeRangePreset>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showTimeRangeDropdown, setShowTimeRangeDropdown] = useState(false);
  const timeRangeRef = useRef<HTMLDivElement>(null);

  const [dragStage, setDragStage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Close time range dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (timeRangeRef.current && !timeRangeRef.current.contains(event.target as Node)) {
        setShowTimeRangeDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modal State for Won/Lost
  const [showWonModal, setShowWonModal] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [pendingDropLead, setPendingDropLead] = useState<{ id: string; stage: string } | null>(null);
  const [dealValueInput, setDealValueInput] = useState('');
  const [lostReasonInput, setLostReasonInput] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING'>('PAID');
  const [sendPaymentLink, setSendPaymentLink] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'EMAIL' | 'WHATSAPP' | 'BOTH'>('WHATSAPP');
  const [paymentLinkUrl, setPaymentLinkUrl] = useState('');

  const loadLeads = async (pageToFetch = page, searchQuery = query) => {
    setLoading(true);
    const { data } = await fetchLeadsPaged(pageToFetch, 100, undefined, searchQuery || undefined);
    setLoading(false);

    if (data && data.content && data.content.length > 0) {
      const converted: Lead[] = data.content.map((dto: LeadDTO) => {
        const contactName = dto.contact?.name || dto.contact?.waId || dto.leadNumber || 'Lead';
        const dealVal = (dto.dealValue != null && dto.dealValue > 0) ? `₹${dto.dealValue.toLocaleString('en-IN')}` : '₹0';
        const scoreVal = dto.score != null ? dto.score : 50;
        const isHot = scoreVal >= 70;
        const tags = dto.contact?.tags || (isHot ? ['HOT'] : ['NEW']);

        return {
          id: dto.id,
          name: contactName,
          company: dto.dealLabel || dto.contact?.source || 'Direct Lead',
          phone: dto.contact?.phone || dto.contact?.waId || 'N/A',
          stage: normalizeStage(dto.status),
          value: dealVal,
          priority: isHot ? 'HIGH' : 'MEDIUM',
          score: scoreVal,
          source: (dto.contact?.source as Lead['source']) || 'WhatsApp',
          tags,
          assignedTo: dto.ownerName || 'Agent',
          lastActivity: dto.createdAtHuman || 'Recently',
          nextAction: 'Follow up',
          nextActionDate: 'Today',
          hasUnread: dto.isNew || false,
          createdAt: dto.createdAt,
        };
      });
      setTotalPages(data.totalPages);
      setLeads(converted);
    } else {
      setLeads([]);
      setTotalPages(1);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(0);
      loadLeads(0, query);
    }, 500);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    loadLeads(page, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('crmlite_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const activeTimeRangeLabel = useMemo(() => {
    if (timeRange === 'CUSTOM') {
      if (customStartDate && customEndDate) {
        return `${customStartDate} → ${customEndDate}`;
      } else if (customStartDate) {
        return `From ${customStartDate}`;
      } else if (customEndDate) {
        return `Until ${customEndDate}`;
      }
      return 'Custom Range';
    }
    return TIME_RANGE_OPTIONS.find((o) => o.id === timeRange)?.label || 'All Time';
  }, [timeRange, customStartDate, customEndDate]);

  const filtered = useMemo(() => {
    const currentName = currentUser?.name || currentUser?.email || '';
    return leads.filter((l) => {
      if (!isWithinTimeRange(l.createdAt, timeRange, customStartDate, customEndDate)) {
        return false;
      }
      if (filter === 'hot' && !l.tags.includes('HOT')) return false;
      if (filter === 'vip' && !l.tags.includes('VIP')) return false;
      if (filter === 'mine' && currentName) {
        const isMine = l.assignedTo.toLowerCase().includes(currentName.toLowerCase()) || l.assignedTo === 'Agent';
        if (!isMine) return false;
      }
      if (query) {
        const q = query.toLowerCase();
        return (
          l.name.toLowerCase().includes(q) ||
          l.company.toLowerCase().includes(q) ||
          l.phone.includes(q)
        );
      }
      return true;
    });
  }, [leads, filter, query, currentUser, timeRange, customStartDate, customEndDate]);

  const handleDrop = async (stage: string) => {
    if (!dragStage) return;
    const lead = leads.find((l) => l.id === dragStage);
    if (!lead || lead.stage === stage) {
      setDragStage(null);
      setDragOver(null);
      return;
    }

    if (stage === 'WON') {
      setPendingDropLead({ id: dragStage, stage });
      setShowWonModal(true);
      setDragStage(null);
      setDragOver(null);
      return;
    }

    if (stage === 'LOST') {
      setPendingDropLead({ id: dragStage, stage });
      setShowLostModal(true);
      setDragStage(null);
      setDragOver(null);
      return;
    }

    // Normal optimistic update for other stages
    setLeads((prev) =>
      prev.map((l) =>
        l.id === dragStage ? { ...l, stage: stage as Lead['stage'] } : l,
      ),
    );

    setDragStage(null);
    setDragOver(null);

    // Backend sync
    if (dragStage.includes('-')) {
      await updateLeadStatus(dragStage, stage);
    }
  };

  const submitWon = async () => {
    if (!pendingDropLead) return;
    const { id, stage } = pendingDropLead;
    const dealVal = parseFloat(dealValueInput) || 0;
    
    // Optimistic update
    setLeads((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, stage: stage as Lead['stage'], value: `₹${dealVal.toLocaleString('en-IN')}` } : l,
      ),
    );
    
    setShowWonModal(false);
    setDealValueInput('');
    setPaymentStatus('PAID');
    setSendPaymentLink(false);
    setPaymentMethod('WHATSAPP');
    setPaymentLinkUrl('');
    setPendingDropLead(null);
    
    if (id.includes('-')) {
      await updateLeadStatus(id, stage, dealVal, undefined, paymentStatus, sendPaymentLink, paymentMethod, paymentLinkUrl);
    }
  };

  const submitLost = async () => {
    if (!pendingDropLead) return;
    const { id, stage } = pendingDropLead;
    
    // Optimistic update
    setLeads((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, stage: stage as Lead['stage'] } : l,
      ),
    );
    
    setShowLostModal(false);
    setLostReasonInput('');
    setPendingDropLead(null);
    
    if (id.includes('-')) {
      await updateLeadStatus(id, stage, undefined, lostReasonInput);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    await downloadLeadsExport('csv');
    setExporting(false);
  };

  const timeFilteredLeads = useMemo(() => {
    return leads.filter((l) => isWithinTimeRange(l.createdAt, timeRange, customStartDate, customEndDate));
  }, [leads, timeRange, customStartDate, customEndDate]);

  const counts = useMemo(() => {
    const currentName = currentUser?.name || currentUser?.email || '';
    return {
      all: timeFilteredLeads.length,
      hot: timeFilteredLeads.filter((l) => l.tags.includes('HOT')).length,
      vip: timeFilteredLeads.filter((l) => l.tags.includes('VIP')).length,
      mine: currentName
        ? timeFilteredLeads.filter((l) => l.assignedTo.toLowerCase().includes(currentName.toLowerCase()) || l.assignedTo === 'Agent').length
        : timeFilteredLeads.length,
    };
  }, [timeFilteredLeads, currentUser]);

  const filters: { id: FilterId; label: string; count: number }[] = [
    { id: 'all', label: 'All Leads', count: counts.all },
    { id: 'hot', label: 'Hot', count: counts.hot },
    { id: 'vip', label: 'VIP', count: counts.vip },
    { id: 'mine', label: 'Assigned to me', count: counts.mine },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary-c">Pipeline</h2>
          <p className="mt-0.5 text-sm text-secondary-c">
            Drag and drop leads between stages to update their status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-base-c bg-card-c p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={cx('flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors', viewMode === 'kanban' ? 'bg-primary-500 text-white shadow-soft' : 'text-secondary-c hover:text-primary-c')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cx('flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors', viewMode === 'table' ? 'bg-primary-500 text-white shadow-soft' : 'text-secondary-c hover:text-primary-c')}
            >
              <ListIcon className="h-3.5 w-3.5" />
              List
            </button>
          </div>

          <button
            onClick={() => loadLeads()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-base-c px-3 py-2 text-xs font-medium text-secondary-c transition-colors hover:text-primary-c"
            title="Refresh Leads"
          >
            <RefreshCw className={cx('h-3.5 w-3.5', loading && 'animate-spin')} />
            Refresh
          </button>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg border border-base-c px-3 py-2 text-xs font-medium text-secondary-c transition-colors hover:text-primary-c"
          >
            <Download className="h-3.5 w-3.5" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>

          <button
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition-all hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
          >
            <Mail className="h-3.5 w-3.5 text-amber-500" />
            Email Templates
          </button>

          <button className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-2 text-xs font-semibold text-white transition-transform hover:scale-105">
            <Plus className="h-3.5 w-3.5" /> New Lead
          </button>
        </div>
      </div>

      {/* Stats */}
      <PipelineStats leads={filtered} />

      {/* Search + filter tabs + time range */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search leads by name, company, or phone…"
              className="w-full rounded-xl2 border border-base-c bg-card-c py-2.5 pl-10 pr-4 text-sm text-primary-c placeholder:text-muted-c transition-colors focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {/* Time Range Selector Dropdown */}
          <div className="relative" ref={timeRangeRef}>
            <button
              type="button"
              onClick={() => setShowTimeRangeDropdown((prev) => !prev)}
              className={cx(
                'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all shadow-xs cursor-pointer',
                timeRange !== 'ALL'
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-500/40 dark:bg-primary-950/40 dark:text-primary-300 ring-2 ring-primary-500/20'
                  : 'border-base-c bg-card-c text-secondary-c hover:border-primary-500/30 hover:text-primary-c',
              )}
            >
              <Calendar className="h-4 w-4 text-primary-500" />
              <span>{activeTimeRangeLabel}</span>
              {timeRange !== 'ALL' ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setTimeRange('ALL');
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="ml-1 rounded-full p-0.5 hover:bg-primary-200 dark:hover:bg-primary-800 text-primary-600 dark:text-primary-300 cursor-pointer"
                  title="Clear time range filter"
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              ) : (
                <ChevronDown className={cx('h-3.5 w-3.5 text-muted-c transition-transform duration-200', showTimeRangeDropdown && 'rotate-180')} />
              )}
            </button>

            {/* Time Range Dropdown Menu */}
            {showTimeRangeDropdown && (
              <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-2xl border border-base-c bg-card-c p-3 shadow-xl animate-in fade-in-50 zoom-in-95">
                <div className="mb-2.5 flex items-center justify-between border-b border-base-c pb-2">
                  <span className="text-xs font-bold text-primary-c flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary-500" /> Filter by Time Range
                  </span>
                  {timeRange !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => {
                        setTimeRange('ALL');
                        setCustomStartDate('');
                        setCustomEndDate('');
                      }}
                      className="text-[11px] font-semibold text-primary-600 hover:underline dark:text-primary-400"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Presets */}
                <div className="grid grid-cols-2 gap-1 pb-1">
                  {TIME_RANGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setTimeRange(opt.id);
                        if (opt.id !== 'CUSTOM') {
                          setShowTimeRangeDropdown(false);
                        }
                      }}
                      className={cx(
                        'flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors text-left',
                        timeRange === opt.id
                          ? 'bg-primary-500 text-white font-semibold shadow-xs'
                          : 'text-secondary-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800',
                      )}
                    >
                      <span>{opt.label}</span>
                      {timeRange === opt.id && <Check className="h-3 w-3 shrink-0" />}
                    </button>
                  ))}
                </div>

                {/* Custom Date Inputs if CUSTOM is selected */}
                {timeRange === 'CUSTOM' && (
                  <div className="mt-2 space-y-2.5 rounded-xl border border-base-c bg-subtle-c/50 p-2.5" style={{ colorScheme: isDark ? 'dark' : 'light' }}>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-c">
                        From Date
                      </label>
                      <div className="relative flex items-center">
                        <input
                          ref={startInputRef}
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          onClick={(e) => {
                            try {
                              (e.target as HTMLInputElement).showPicker?.();
                            } catch {}
                          }}
                          style={{ colorScheme: isDark ? 'dark' : 'light' }}
                          className="date-input-custom w-full rounded-lg border border-base-c bg-card-c py-2 pl-3 pr-9 text-xs text-primary-c focus:border-primary-500 focus:outline-none cursor-pointer"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => {
                            try {
                              startInputRef.current?.showPicker?.();
                            } catch {}
                          }}
                          className="pointer-events-none absolute right-2.5 text-primary-500 dark:text-blue-400"
                        >
                          <Calendar className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-c">
                        To Date
                      </label>
                      <div className="relative flex items-center">
                        <input
                          ref={endInputRef}
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          onClick={(e) => {
                            try {
                              (e.target as HTMLInputElement).showPicker?.();
                            } catch {}
                          }}
                          style={{ colorScheme: isDark ? 'dark' : 'light' }}
                          className="date-input-custom w-full rounded-lg border border-base-c bg-card-c py-2 pl-3 pr-9 text-xs text-primary-c focus:border-primary-500 focus:outline-none cursor-pointer"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => {
                            try {
                              endInputRef.current?.showPicker?.();
                            } catch {}
                          }}
                          className="pointer-events-none absolute right-2.5 text-primary-500 dark:text-blue-400"
                        >
                          <Calendar className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomStartDate('');
                          setCustomEndDate('');
                        }}
                        className="rounded-lg border border-base-c px-2.5 py-1 text-[11px] font-medium text-secondary-c hover:text-primary-c"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowTimeRangeDropdown(false)}
                        className="rounded-lg bg-primary-500 px-3 py-1 text-[11px] font-bold text-white hover:bg-primary-600 shadow-xs"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none flex-nowrap">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cx(
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap btn-tactile',
                  filter === f.id
                    ? 'bg-gradient-accent text-white shadow-soft'
                    : 'border border-base-c text-secondary-c hover:border-primary-500/30 hover:text-primary-c',
                )}
              >
                {f.label}
                <span className={cx(
                  'grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold',
                  filter === f.id ? 'bg-white/25' : 'bg-slate-100 text-muted-c dark:bg-ink-800',
                )}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Time Range Chip if filtered */}
        {timeRange !== 'ALL' && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary-500/30 bg-primary-500/10 px-2.5 py-1 text-xs font-semibold text-primary-600 dark:text-primary-400">
              <Calendar className="h-3.5 w-3.5" />
              Time Range: <span>{activeTimeRangeLabel}</span>
              <span className="text-[11px] opacity-75">({filtered.length} leads matching)</span>
              <button
                type="button"
                onClick={() => {
                  setTimeRange('ALL');
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="ml-1 rounded-full p-0.5 hover:bg-primary-500/20"
                title="Reset time range filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Main View */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scroll-snap-x min-h-[500px]">
          {STAGE_CONFIG.map((col) => {
            const colLeads = filtered.filter((l) => l.stage === col.stage);
            return (
              <KanbanColumn
                key={col.stage}
                stage={col.stage}
                title={col.title}
                color={col.color}
                barColor={col.barColor}
                accent={col.accent}
                leads={colLeads}
                onOpenLead={onOpenLead}
                onDrop={handleDrop}
                isDragOver={dragOver === col.stage}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(col.stage);
                }}
                onDragLeave={() => setDragOver(null)}
                draggedLeadId={dragStage}
                onDragStart={(leadId) => setDragStage(leadId)}
              />
            );
          })}
        </div>
      ) : (
        <PipelineTableView
          leads={filtered}
          onOpenLead={onOpenLead}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          loading={loading}
        />
      )}

      {/* Won Modal */}
      {showWonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card-c p-6 shadow-xl">
            <h3 className="text-lg font-bold text-primary-c mb-2">Deal Won! 🎉</h3>
            <p className="text-sm text-secondary-c mb-4">Please enter the final deal value (in INR).</p>
            <input
              type="number"
              value={dealValueInput}
              onChange={(e) => setDealValueInput(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full rounded-lg border border-base-c bg-card-c p-2 text-primary-c focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              autoFocus
            />
            
            <div className="mt-4">
              <label className="text-sm font-medium text-secondary-c mb-2 block">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as 'PAID' | 'PENDING')}
                className="w-full rounded-lg border border-base-c bg-card-c p-2 text-primary-c focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="PAID">Received / Paid</option>
                <option value="PENDING">Pending / Unpaid</option>
              </select>
            </div>

            {paymentStatus === 'PENDING' && (
              <div className="mt-4 space-y-3">
                <label className="flex items-center gap-2 text-sm text-primary-c cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendPaymentLink}
                    onChange={(e) => setSendPaymentLink(e.target.checked)}
                    className="rounded border-base-c text-green-500 focus:ring-green-500"
                  />
                  Send Payment Link?
                </label>

                {sendPaymentLink && (
                  <div className="pl-6 space-y-3 border-l-2 border-base-c">
                    <div>
                      <label className="text-xs font-medium text-secondary-c mb-1 block">Payment Link URL</label>
                      <input
                        type="url"
                        value={paymentLinkUrl}
                        onChange={(e) => setPaymentLinkUrl(e.target.value)}
                        placeholder="https://razorpay.me/..."
                        className="w-full rounded-lg border border-base-c bg-card-c p-2 text-sm text-primary-c focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-secondary-c mb-1 block">Send Via</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as 'WHATSAPP' | 'EMAIL' | 'BOTH')}
                        className="w-full rounded-lg border border-base-c bg-card-c p-2 text-sm text-primary-c focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      >
                        <option value="WHATSAPP">WhatsApp Only</option>
                        <option value="EMAIL">Email Only</option>
                        <option value="BOTH">Both (WhatsApp & Email)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowWonModal(false);
                  setPendingDropLead(null);
                  setDealValueInput('');
                  setPaymentStatus('PAID');
                  setSendPaymentLink(false);
                  setPaymentMethod('WHATSAPP');
                  setPaymentLinkUrl('');
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-secondary-c hover:bg-base-c"
              >
                Cancel
              </button>
              <button
                onClick={submitWon}
                className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lost Modal */}
      {showLostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card-c p-6 shadow-xl">
            <h3 className="text-lg font-bold text-primary-c mb-2">Deal Lost</h3>
            <p className="text-sm text-secondary-c mb-4">Please provide a reason why this deal was lost.</p>
            <textarea
              value={lostReasonInput}
              onChange={(e) => setLostReasonInput(e.target.value)}
              placeholder="e.g. Price too high, went with competitor..."
              className="w-full rounded-lg border border-base-c bg-card-c p-2 text-primary-c focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[100px]"
              autoFocus
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowLostModal(false);
                  setPendingDropLead(null);
                  setLostReasonInput('');
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-secondary-c hover:bg-base-c"
              >
                Cancel
              </button>
              <button
                onClick={submitLost}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Email Templates Modal */}
      <LeadEmailModal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} />
    </div>
  );
}
