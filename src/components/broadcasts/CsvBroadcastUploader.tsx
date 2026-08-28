import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { cx } from '@/lib/types';
import {
  uploadCsvForBroadcast,
  fetchBroadcastFilterConfig,
  type BroadcastCsvUploadResult,
  type BroadcastFilterConfig,
} from '@/lib/broadcastsApi';
import {
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Phone,
  Columns3,
  Filter,
  Loader2,
  Trash2,
  Plus,
  Eye,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';

type AppliedFilter = {
  column: string;
  operator: string;
  value: string;
};

type Props = {
  onComplete: (data: {
    csvRecipients: Record<string, string | null>[];
    phoneColumn: string;
    appliedFilters: AppliedFilter[];
    filterMatchLogic?: 'AND' | 'OR';
    filteredCount: number;
  }) => void;
  onCancel: () => void;
};

// ─── Stat Card ─────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'emerald' | 'red' | 'amber';
}) {
  const textColorMap = {
    blue: 'text-indigo-600 dark:text-indigo-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    red: 'text-red-600 dark:text-red-400',
    amber: 'text-amber-600 dark:text-amber-400',
  };

  return (
    <div className="flex flex-col p-4 border border-slate-200 rounded-xl bg-white shadow-sm dark:border-ink-700 dark:bg-ink-900 transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider line-clamp-2 leading-snug">
          {label}
        </span>
        <span className={cx("shrink-0 h-4 w-4", textColorMap[color])}>
          {icon}
        </span>
      </div>
      <div className="text-xl font-bold text-slate-900 dark:text-white">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

// ─── Filter Value Dropdown with Auto-extracted Data Suggestions ─────────

function FilterValueDropdown({
  column,
  value,
  onChange,
  rows,
}: {
  column: string;
  value: string;
  onChange: (val: string) => void;
  rows: Record<string, string | null>[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract unique values for the selected column from uploaded rows
  const uniqueValues = useMemo(() => {
    if (!rows || !column) return [];
    const set = new Set<string>();
    for (const row of rows) {
      const val = (row[column] || '').toString().trim();
      if (val) set.add(val);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows, column]);

  // Filter unique values based on search query inside dropdown
  const filteredOptions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return uniqueValues;
    return uniqueValues.filter((item) => item.toLowerCase().includes(query));
  }, [uniqueValues, searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1 min-w-[160px]">
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          placeholder={
            column
              ? uniqueValues.length > 0
                ? `Pick or type value (${uniqueValues.length} in data)...`
                : 'Filter value...'
              : 'Select column first...'
          }
          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 pr-7 text-xs text-primary-c placeholder:text-slate-400 dark:border-ink-600 dark:bg-ink-900 dark:text-white dark:placeholder:text-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
        />
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
          tabIndex={-1}
          title="Toggle data values list"
        >
          <ChevronDown className={cx('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl dark:border-ink-600 dark:bg-ink-900 py-1">
          {/* Header info */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-ink-800 px-3 py-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            <span>
              {column ? `Values in "${column}"` : 'Select column'} ({uniqueValues.length} unique)
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-blue-500 hover:underline text-[10px]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Search bar inside dropdown if list is long */}
          {uniqueValues.length > 5 && (
            <div className="p-1.5 border-b border-slate-100 dark:border-ink-800">
              <div className="flex items-center rounded-md bg-slate-100 dark:bg-ink-800 px-2 py-1">
                <Search className="h-3 w-3 text-slate-400 mr-1.5 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search values in dataset..."
                  className="w-full bg-transparent text-xs text-primary-c dark:text-white focus:outline-none placeholder:text-slate-400"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Options List */}
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 italic text-center">
              {uniqueValues.length === 0
                ? 'No data values found for this column'
                : 'No matching values found'}
            </div>
          ) : (
            filteredOptions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  onChange(item);
                  setIsOpen(false);
                }}
                className={cx(
                  'w-full px-3 py-1.5 text-left text-xs transition-colors flex items-center justify-between',
                  value === item
                    ? 'bg-blue-50 text-blue-600 font-semibold dark:bg-blue-500/20 dark:text-blue-400'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-ink-800'
                )}
              >
                <span className="truncate">{item}</span>
                {value === item && <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 ml-2 shrink-0" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const OPERATORS = [
  { value: 'EQUALS', label: 'Equals' },
  { value: 'NOT_EQUALS', label: 'Not Equals' },
  { value: 'CONTAINS', label: 'Contains' },
  { value: 'STARTS_WITH', label: 'Starts With' },
  { value: 'IN', label: 'In (comma-separated)' },
];

export function CsvBroadcastUploader({ onComplete, onCancel }: Props) {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadResult, setUploadResult] = useState<BroadcastCsvUploadResult | null>(null);
  const [filterConfig, setFilterConfig] = useState<BroadcastFilterConfig | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>([]);
  const [filterMatchLogic, setFilterMatchLogic] = useState<'AND' | 'OR'>('AND');
  const [showInvalidRows, setShowInvalidRows] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load filter config on mount
  useEffect(() => {
    fetchBroadcastFilterConfig().then((res) => {
      if (res.data) setFilterConfig(res.data);
    });
  }, []);

  // ─── File Upload ────────────────────────────────────────────────────────

  const handleFileSelect = useCallback(async (file: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      setError('Please upload a .csv, .xlsx, or .xls file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10 MB limit');
      return;
    }

    setUploading(true);
    setError(null);

    const res = await uploadCsvForBroadcast(file);
    setUploading(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    setUploadResult(res.data);
    setStep(2);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  // ─── Filtering Logic ───────────────────────────────────────────────────

  const filteredRows = useMemo(() => {
    if (!uploadResult) return [];
    if (appliedFilters.length === 0) return uploadResult.validRows;

    const matchFn = filterMatchLogic === 'AND' ? 'every' : 'some';

    return uploadResult.validRows.filter((row) =>
      appliedFilters[matchFn]((filter) => {
        const cellValue = (row[filter.column] || '').toLowerCase().trim();
        const filterValue = filter.value.toLowerCase().trim();
        if (!filterValue) return true;

        switch (filter.operator) {
          case 'EQUALS':
            return cellValue === filterValue;
          case 'NOT_EQUALS':
            return cellValue !== filterValue;
          case 'CONTAINS':
            return cellValue.includes(filterValue);
          case 'STARTS_WITH':
            return cellValue.startsWith(filterValue);
          case 'IN':
            return filterValue
              .split(',')
              .map((v) => v.trim())
              .includes(cellValue);
          default:
            return cellValue === filterValue;
        }
      })
    );
  }, [uploadResult, appliedFilters, filterMatchLogic]);

  const addFilter = () => {
    const availableColumns = filterConfig?.filterColumns?.length
      ? filterConfig.filterColumns
      : uploadResult?.detectedColumns || [];
    const firstCol = availableColumns[0] || '';
    setAppliedFilters((prev) => [...prev, { column: firstCol, operator: 'EQUALS', value: '' }]);
  };

  const updateFilter = (index: number, field: keyof AppliedFilter, value: string) => {
    setAppliedFilters((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
  };

  const removeFilter = (index: number) => {
    setAppliedFilters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (!uploadResult) return;
    onComplete({
      csvRecipients: filteredRows,
      phoneColumn: uploadResult.phoneColumnName,
      appliedFilters,
      filterMatchLogic,
      filteredCount: filteredRows.length,
    });
  };

  // ─── Available filter columns ──────────────────────────────────────────

  const availableFilterColumns = useMemo(() => {
    if (filterConfig?.filterColumns?.length) {
      return filterConfig.filterColumns;
    }
    return uploadResult?.detectedColumns || [];
  }, [filterConfig, uploadResult]);

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-1">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-1">
            <div
              className={cx(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all',
                s < step
                  ? 'bg-emerald-500 text-white'
                  : s === step
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-200 text-slate-500 dark:bg-ink-700 dark:text-slate-400'
              )}
            >
              {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            {s < 3 && (
              <div
                className={cx(
                  'h-0.5 w-8 rounded-full transition-all',
                  s < step ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-ink-700'
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-xs text-secondary-c">
          {step === 1 && 'Upload File'}
          {step === 2 && 'Preview & Validate'}
          {step === 3 && 'Apply Filters'}
        </p>
      </div>

      {/* ─── Step 1: File Upload ─── */}
      {step === 1 && (
        <div className="space-y-3">
          <div
            className={cx(
              'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-all cursor-pointer',
              dragOver
                ? 'border-indigo-400 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-500/10'
                : 'border-slate-300 bg-white hover:border-indigo-300 hover:bg-slate-50 dark:border-ink-600 dark:bg-ink-900 dark:hover:border-indigo-500/50'
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-ink-800 text-slate-500 dark:text-slate-400 shadow-sm border border-slate-200 dark:border-ink-700">
                <Upload className="h-5 w-5" />
              </div>
            )}
            <div className="text-center mt-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {uploading ? 'Parsing dataset...' : 'Click or drag file to this area to upload'}
              </p>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Support for a single or bulk upload. Strictly CSV, XLS, or XLSX.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleInputChange}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
              <XCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={onCancel}
              className="rounded-lg px-4 py-2 text-sm font-medium text-secondary-c hover:text-primary-c transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 2: Preview & Validation ─── */}
      {step === 2 && uploadResult && (
        <div className="space-y-4">
          {/* Validation Stats */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard
              icon={<Columns3 className="h-4 w-4" />}
              label="Columns"
              value={uploadResult.detectedColumns.length}
              color="blue"
            />
            <StatCard
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Valid Phones"
              value={uploadResult.validPhoneCount}
              color="emerald"
            />
            <StatCard
              icon={<XCircle className="h-4 w-4" />}
              label="Invalid"
              value={uploadResult.invalidPhoneCount}
              color="red"
            />
            <StatCard
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Duplicates"
              value={uploadResult.duplicatePhoneCount}
              color="amber"
            />
          </div>

          {/* Phone Column Detection & Data Preview Trigger */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-4 dark:bg-ink-800 dark:border-ink-700">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Primary phone column: <span className="font-bold text-slate-900 dark:text-white px-1">{uploadResult.phoneColumnName}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowDataModal(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-ink-600 dark:bg-ink-800 dark:text-slate-300 dark:hover:bg-ink-700 dark:hover:text-white transition-all shadow-sm"
            >
              <Eye className="h-4 w-4" />
              Preview Data
            </button>
          </div>

          {/* Data Grid Modal */}
          {showDataModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl dark:bg-ink-900 border border-slate-200 dark:border-ink-700 overflow-hidden flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50 dark:border-ink-700 dark:bg-ink-800">
                  <div className="flex items-center gap-2">
                    <Columns3 className="h-5 w-5 text-slate-500" />
                    <span className="text-base font-semibold text-slate-800 dark:text-slate-200">Data Grid Preview</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-ink-900 px-3 py-1.5 rounded-md shadow-sm border border-slate-200 dark:border-ink-700">
                      Sample: {Math.min(5, uploadResult.totalRows)} / {uploadResult.totalRows} rows
                    </span>
                    <button
                      onClick={() => setShowDataModal(false)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-ink-700 dark:hover:text-slate-300 transition-colors"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-0">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 z-10 shadow-sm">
                      <tr className="border-b border-slate-200 dark:border-ink-700 bg-slate-100 dark:bg-ink-800">
                        {uploadResult.detectedColumns.slice(0, 10).map((col) => (
                          <th
                            key={col}
                            className={cx(
                              'whitespace-nowrap px-5 py-4 text-left font-semibold uppercase tracking-wider text-xs',
                              col === uploadResult.phoneColumnName
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300'
                                : 'text-slate-600 dark:text-slate-400'
                            )}
                          >
                            {col === uploadResult.phoneColumnName && '📞 '}
                            {col}
                          </th>
                        ))}
                        {uploadResult.detectedColumns.length > 10 && (
                          <th className="px-5 py-4 text-left text-slate-400 text-xs">
                            +{uploadResult.detectedColumns.length - 10} more
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-ink-800">
                      {uploadResult.sampleRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50 dark:hover:bg-ink-800/50 transition-colors"
                        >
                          {uploadResult.detectedColumns.slice(0, 10).map((col) => (
                            <td key={col} className={cx(
                              'whitespace-nowrap px-5 py-3 text-sm',
                              col === uploadResult.phoneColumnName
                                ? 'bg-indigo-50/30 text-indigo-900 font-bold font-mono dark:bg-indigo-500/5 dark:text-indigo-300'
                                : 'text-slate-700 dark:text-slate-300'
                            )}>
                              {row[col] || <span className="text-slate-300 dark:text-slate-600">—</span>}
                            </td>
                          ))}
                          {uploadResult.detectedColumns.length > 10 && (
                            <td className="px-5 py-3 text-slate-300 text-sm">...</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Invalid Rows (expandable) */}
          {uploadResult.invalidRows.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-white overflow-hidden shadow-sm dark:border-red-900/50 dark:bg-ink-900">
              <button
                className="flex w-full items-center justify-between px-4 py-3 text-left bg-red-50 hover:bg-red-100/50 dark:bg-red-500/5 dark:hover:bg-red-500/10 transition-colors"
                onClick={() => setShowInvalidRows((prev) => !prev)}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                    {uploadResult.invalidRows.length} Invalid Rows Excluded
                  </span>
                </div>
                {showInvalidRows ? (
                  <ChevronUp className="h-4 w-4 text-red-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-red-400" />
                )}
              </button>
              {showInvalidRows && (
                <div className="border-t border-red-100 dark:border-red-900/30">
                  <div className="max-h-40 overflow-y-auto bg-white dark:bg-ink-900">
                    {uploadResult.invalidRows.map((row, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between border-b border-slate-100 px-4 py-2 text-xs last:border-b-0 dark:border-ink-800"
                      >
                        <span className="text-slate-500 font-medium">Row {row.rowNumber}</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-ink-800 px-2 py-0.5 rounded">
                          {row.phone || '(empty)'}
                        </span>
                        <span className="text-red-500 font-medium">{row.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setStep(1);
                setUploadResult(null);
                setError(null);
              }}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-secondary-c hover:text-primary-c transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Re-upload
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // Skip filters if none configured — go straight to confirm
                  if (availableFilterColumns.length === 0) {
                    handleConfirm();
                  } else {
                    setStep(3);
                  }
                }}
                className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-600 transition-colors"
              >
                {availableFilterColumns.length === 0 ? 'Confirm' : 'Apply Filters'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Step 3: Apply Filters ─── */}
      {step === 3 && uploadResult && (
        <div className="space-y-4">
          {/* Filter Builder */}
          {/* Filter Builder */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-ink-700 dark:bg-ink-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 bg-slate-50 dark:border-ink-700 dark:bg-ink-800">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Data Filters</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-ink-700 dark:bg-ink-900 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setFilterMatchLogic('AND')}
                    className={cx(
                      'px-3 py-1 text-[11px] font-semibold rounded-md transition-all',
                      filterMatchLogic === 'AND'
                        ? 'bg-white text-indigo-700 shadow-sm dark:bg-ink-700 dark:text-indigo-400 border border-slate-200 dark:border-ink-600'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    )}
                  >
                    Match ALL
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMatchLogic('OR')}
                    className={cx(
                      'px-3 py-1 text-[11px] font-semibold rounded-md transition-all',
                      filterMatchLogic === 'OR'
                        ? 'bg-white text-indigo-700 shadow-sm dark:bg-ink-700 dark:text-indigo-400 border border-slate-200 dark:border-ink-600'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    )}
                  >
                    Match ANY
                  </button>
                </div>
                <button
                  onClick={addFilter}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 transition-colors border border-indigo-100 dark:border-indigo-500/20"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Rule
                </button>
              </div>
            </div>

            <div className="p-5 space-y-3 bg-white dark:bg-ink-900">
              {appliedFilters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Filter className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    No filters applied.
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    All <span className="font-bold text-slate-700 dark:text-slate-300">{uploadResult.validPhoneCount}</span> valid recipients will be included in this broadcast.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {appliedFilters.map((filter, idx) => (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2.5 dark:border-ink-800 dark:bg-ink-800/50"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-200 text-[10px] font-bold text-slate-500 dark:bg-ink-700 dark:text-slate-400">
                        {idx + 1}
                      </div>
                      
                      {/* Column Select */}
                      <select
                        value={filter.column}
                        onChange={(e) => {
                          updateFilter(idx, 'column', e.target.value);
                          updateFilter(idx, 'value', '');
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm dark:border-ink-700 dark:bg-ink-900 dark:text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      >
                        {availableFilterColumns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>

                      {/* Operator Select */}
                      <select
                        value={filter.operator}
                        onChange={(e) => updateFilter(idx, 'operator', e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm dark:border-ink-700 dark:bg-ink-900 dark:text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-32"
                      >
                        {OPERATORS.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>

                      {/* Auto-Extract Searchable Value Combobox */}
                      <div className="flex-1 min-w-[200px]">
                        <FilterValueDropdown
                          column={filter.column}
                          value={filter.value}
                          onChange={(val) => updateFilter(idx, 'value', val)}
                          rows={uploadResult.validRows}
                        />
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeFilter(idx)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-colors ml-auto"
                        title="Remove Rule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Filtered Result Summary */}
          <div
            className={cx(
              'flex items-center justify-between rounded-xl p-4',
              filteredRows.length > 0
                ? 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-500/10 dark:to-green-500/10'
                : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-500/10 dark:to-orange-500/10'
            )}
          >
            <div>
              <p className="text-sm font-semibold text-primary-c">
                {filteredRows.length > 0 ? '✅ Recipients after filtering' : '⚠️ No recipients match filters'}
              </p>
              <p className="text-xs text-secondary-c mt-0.5">
                {appliedFilters.length > 0
                  ? `${appliedFilters.length} filter(s) applied`
                  : 'No filters applied'}
              </p>
            </div>
            <div className="text-right">
              <span
                className={cx(
                  'text-2xl font-bold',
                  filteredRows.length > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {filteredRows.length}
              </span>
              <p className="text-xs text-secondary-c">of {uploadResult.validPhoneCount}</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-secondary-c hover:text-primary-c transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={filteredRows.length === 0}
              className={cx(
                'flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold shadow-lg transition-all',
                filteredRows.length > 0
                  ? 'bg-emerald-500 text-white shadow-emerald-500/25 hover:bg-emerald-600'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-ink-600 dark:text-slate-400'
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirm {filteredRows.length} Recipients
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
