import { useState, useMemo, useEffect } from 'react';
import { GlassCard, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { LEADS, STAGE_CONFIG, type Lead } from './pipelineData';
import { PipelineStats } from './PipelineStats';
import { KanbanColumn } from './KanbanBoard';
import {
  fetchLeadsPaged,
  updateLeadStatus,
  downloadLeadsExport,
  type LeadDTO,
} from '@/lib/leadsApi';
import { Search, SlidersHorizontal, Plus, Download, RefreshCw } from 'lucide-react';

type FilterId = 'all' | 'hot' | 'vip' | 'mine';

export function PipelineView({ onOpenLead }: { onOpenLead: (lead: Lead) => void }) {
  const [leads, setLeads] = useState<Lead[]>(LEADS);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');
  const [dragStage, setDragStage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadLeads = async () => {
    setLoading(true);
    const { data } = await fetchLeadsPaged(0, 100);
    setLoading(false);

    if (data && data.content && data.content.length > 0) {
      const converted: Lead[] = data.content.map((dto: LeadDTO) => {
        const contactName = dto.contact?.name || dto.contact?.waId || dto.leadNumber || 'Lead';
        const dealVal = dto.dealValue ? `₹${dto.dealValue}` : '₹50L';
        const isHot = dto.score && dto.score >= 70;
        const tags = dto.contact?.tags || (isHot ? ['HOT'] : ['NEW']);

        return {
          id: dto.id,
          name: contactName,
          company: dto.dealLabel || dto.contact?.source || 'Direct Lead',
          phone: dto.contact?.phone || dto.contact?.waId || 'N/A',
          stage: dto.status || 'NEW',
          value: dealVal,
          priority: isHot ? 'HIGH' : 'MEDIUM',
          source: (dto.contact?.source as any) || 'WhatsApp',
          tags,
          assignedTo: dto.ownerName || 'Agent',
          lastActivity: dto.createdAtHuman || 'Recently',
          nextAction: 'Follow up',
          nextActionDate: 'Today',
          hasUnread: dto.isNew || false,
        };
      });
      setLeads(converted);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (filter === 'hot' && !l.tags.includes('HOT')) return false;
      if (filter === 'vip' && !l.tags.includes('VIP')) return false;
      if (filter === 'mine' && l.assignedTo !== 'Arjun') return false;
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
  }, [leads, filter, query]);

  const handleDrop = async (stage: string) => {
    if (!dragStage) return;
    const lead = leads.find((l) => l.id === dragStage);
    if (!lead || lead.stage === stage) {
      setDragStage(null);
      setDragOver(null);
      return;
    }

    // Optimistic update
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

  const handleExport = async () => {
    setExporting(true);
    await downloadLeadsExport('csv');
    setExporting(false);
  };

  const counts = useMemo(() => {
    return {
      all: leads.length,
      hot: leads.filter((l) => l.tags.includes('HOT')).length,
      vip: leads.filter((l) => l.tags.includes('VIP')).length,
      mine: leads.filter((l) => l.assignedTo === 'Arjun').length,
    };
  }, [leads]);

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
          <button
            onClick={loadLeads}
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
        <div className="flex items-center gap-1.5">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cx(
                'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
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

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
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
            />
          );
        })}
      </div>
    </div>
  );
}
