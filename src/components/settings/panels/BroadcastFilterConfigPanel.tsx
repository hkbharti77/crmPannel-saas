import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import {
  fetchBroadcastFilterConfig,
  updateBroadcastFilterConfig,
  type BroadcastFilterConfig,
} from '@/lib/broadcastsApi';
import {
  Filter,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';

export function BroadcastFilterConfigPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newColumn, setNewColumn] = useState('');
  const [config, setConfig] = useState<BroadcastFilterConfig>({
    filterColumns: [],
    filterRules: [],
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const res = await fetchBroadcastFilterConfig();
    setLoading(false);
    if (res.data) {
      setConfig({
        filterColumns: res.data.filterColumns || [],
        filterRules: res.data.filterRules || [],
      });
    }
  };

  const handleAddColumn = () => {
    const trimmed = newColumn.trim().toLowerCase();
    if (!trimmed) return;
    if (config.filterColumns.includes(trimmed)) {
      setMessage({ type: 'error', text: `Column "${trimmed}" is already in the list.` });
      return;
    }
    setConfig((prev) => ({
      ...prev,
      filterColumns: [...prev.filterColumns, trimmed],
    }));
    setNewColumn('');
    setMessage(null);
  };

  const handleRemoveColumn = (col: string) => {
    setConfig((prev) => ({
      ...prev,
      filterColumns: prev.filterColumns.filter((c) => c !== col),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const res = await updateBroadcastFilterConfig(config);
    setSaving(false);

    if (res.error) {
      setMessage({ type: 'error', text: res.error });
    } else {
      setMessage({ type: 'success', text: 'Broadcast filter configuration saved successfully!' });
    }
  };

  if (loading) {
    return (
      <GlassCard className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-3 text-xs text-secondary-c">Loading broadcast filter configuration...</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-blue-500" />
          <h3 className="text-base font-bold text-primary-c">Broadcast Upload Filter Settings</h3>
        </div>
        <p className="mt-1 text-xs text-secondary-c">
          Define allowed filterable columns for CSV/Excel broadcast uploads. Users will be able to filter audience recipients based on these specific column values.
        </p>
      </div>

      {message && (
        <div
          className={cx(
            'flex items-center gap-2 rounded-xl p-3.5 text-xs font-semibold',
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-300'
          )}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filter Columns Card */}
      <GlassCard className="p-5 space-y-4">
        <div>
          <h4 className="text-sm font-bold text-primary-c">Filterable Column Names</h4>
          <p className="text-xs text-secondary-c mt-0.5">
            Add column headers (e.g. <code className="font-mono text-pink-500">city</code>,{' '}
            <code className="font-mono text-pink-500">plan</code>,{' '}
            <code className="font-mono text-pink-500">source</code>,{' '}
            <code className="font-mono text-pink-500">region</code>) that should appear in the broadcast upload filter builder.
          </p>
        </div>

        {/* Input & Add Button */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newColumn}
            onChange={(e) => setNewColumn(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddColumn();
              }
            }}
            placeholder="Enter column header name (e.g. city)"
            className="form-input text-xs flex-1"
          />
          <button
            onClick={handleAddColumn}
            disabled={!newColumn.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Column
          </button>
        </div>

        {/* Column Chips List */}
        <div className="pt-2">
          {config.filterColumns.length === 0 ? (
            <p className="text-center text-xs text-secondary-c py-6 italic border border-dashed border-slate-200 dark:border-ink-700 rounded-xl">
              No specific columns configured. All detected columns in uploaded files will be available for filtering.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {config.filterColumns.map((col) => (
                <div
                  key={col}
                  className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-bold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
                >
                  <Filter className="h-3 w-3 text-blue-500" />
                  <span>{col}</span>
                  <button
                    onClick={() => handleRemoveColumn(col)}
                    className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-gradient-accent px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{saving ? 'Saving Config...' : 'Save Configuration'}</span>
        </button>
      </div>
    </div>
  );
}
