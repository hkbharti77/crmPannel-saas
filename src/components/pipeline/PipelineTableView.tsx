import { Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import type { Lead } from './pipelineData';
import { PRIORITY_STYLES } from './pipelineData';
import { ChevronLeft, ChevronRight, Clock, Sparkles } from 'lucide-react';

export function PipelineTableView({
  leads,
  onOpenLead,
  page,
  totalPages,
  onPageChange,
  loading,
}: {
  leads: Lead[];
  onOpenLead: (lead: Lead) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-xl border border-base-c bg-card-c shadow-soft">
        <table className="w-full text-left text-sm text-secondary-c">
          <thead className="bg-subtle-c text-xs font-semibold uppercase text-muted-c border-b border-base-c">
            <tr>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Score & Priority</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Last Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-c">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-c">
                  Loading leads...
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-c">
                  No leads found.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => onOpenLead(lead)}
                  className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-ink-850"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={lead.name} size={32} />
                      <div>
                        <div className="font-medium text-primary-c">{lead.name}</div>
                        <div className="text-xs text-muted-c">{lead.company} • {lead.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-secondary-c dark:bg-ink-800">
                      {lead.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-primary-c">
                    {lead.value}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="flex items-center gap-1 rounded bg-primary-500/15 px-1.5 py-0.5 text-[10px] font-bold text-primary-600 dark:text-primary-400">
                        <Sparkles className="h-3 w-3" /> Score {lead.score ?? 50}
                      </span>
                      <span className={cx('rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide', PRIORITY_STYLES[lead.priority])}>
                        {lead.priority}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {lead.assignedTo}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-c whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {lead.lastActivity}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between border-t border-base-c pt-4">
        <span className="text-sm text-muted-c">
          Page {page + 1} of {Math.max(1, totalPages)}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0 || loading}
            className="flex items-center gap-1 rounded-lg border border-base-c px-3 py-1.5 text-sm font-medium text-secondary-c hover:bg-subtle-c disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1 || loading}
            className="flex items-center gap-1 rounded-lg border border-base-c px-3 py-1.5 text-sm font-medium text-secondary-c hover:bg-subtle-c disabled:opacity-50"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
