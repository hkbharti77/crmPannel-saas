import { useState, useMemo, useEffect } from 'react';
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
import { Search, Plus, Download, RefreshCw, LayoutGrid, List as ListIcon } from 'lucide-react';
import { PipelineTableView } from './PipelineTableView';

type FilterId = 'all' | 'hot' | 'vip' | 'mine';

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

export function PipelineView() {
  const navigate = useNavigate();
  const onOpenLead = (lead: Lead) => {
    navigate(`/leaddetail/${lead.id}`, { state: { leadObj: lead } });
  };
  const [leads, setLeads] = useState<Lead[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');
  const [dragStage, setDragStage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

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

  const filtered = useMemo(() => {
    const currentName = currentUser?.name || currentUser?.email || '';
    return leads.filter((l) => {
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
  }, [leads, filter, query, currentUser]);

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

  const counts = useMemo(() => {
    const currentName = currentUser?.name || currentUser?.email || '';
    return {
      all: leads.length,
      hot: leads.filter((l) => l.tags.includes('HOT')).length,
      vip: leads.filter((l) => l.tags.includes('VIP')).length,
      mine: currentName
        ? leads.filter((l) => l.assignedTo.toLowerCase().includes(currentName.toLowerCase()) || l.assignedTo === 'Agent').length
        : leads.length,
    };
  }, [leads, currentUser]);

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

          <button className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-2 text-xs font-semibold text-white transition-transform hover:scale-105">
            <Plus className="h-3.5 w-3.5" /> New Lead
          </button>
        </div>
      </div>

      {/* Stats */}
      <PipelineStats leads={leads} />

      {/* Search + filter tabs */}
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
    </div>
  );
}
