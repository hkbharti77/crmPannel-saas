import { useState, useEffect } from 'react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { GlassCard, Badge } from '@/components/ui/primitives';
import {
  FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, LogOut,
  Download, Upload, ExternalLink, ShieldCheck, Check, ArrowRight,
  Copy, Sparkles, RefreshCw, FileText, Database, Lock,
  Table, Layers, HelpCircle, Info, CheckCheck
} from 'lucide-react';
import { PanelHeader, SectionCard } from './_shared';
import {
  fetchSheetsStatus,
  exportLeadsToSheet,
  importLeadsFromSheet,
  fetchGoogleAuthUrl,
  disconnectGoogleIntegration,
  SheetsExportResponse,
  SheetsImportResponse
} from '@/lib/integrationsApi';

/* ─── Field Mapping Spec for Google Sheets ─── */
const FIELD_MAPPINGS = [
  { field: 'Lead Name', aliases: ['name', 'full_name', 'lead_name', 'contact_name'], required: true, example: 'Alex Morgan' },
  { field: 'Email Address', aliases: ['email', 'email_address', 'mail'], required: false, example: 'alex@company.com' },
  { field: 'Phone Number', aliases: ['phone', 'mobile', 'whatsapp', 'tel'], required: false, example: '+1 555-0199' },
  { field: 'Company', aliases: ['company', 'organization', 'business'], required: false, example: 'Acme Corp' },
  { field: 'Lead Status', aliases: ['status', 'stage', 'lead_status'], required: false, example: 'QUALIFIED' },
  { field: 'Deal Value', aliases: ['value', 'amount', 'deal_value', 'revenue'], required: false, example: '$12,500' },
  { field: 'Source / Campaign', aliases: ['source', 'lead_source', 'channel'], required: false, example: 'Website Form' },
];

export function GoogleSheetsPanel({ embedded = false }: { embedded?: boolean } = {}) {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'mapping'>('export');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Export state
  const todayDate = new Date().toISOString().split('T')[0];
  const [exportTitle, setExportTitle] = useState(`CRMLite Leads Export - ${todayDate}`);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<SheetsExportResponse | null>(null);

  // Import state
  const [sheetInput, setSheetInput] = useState('');
  const [sheetRange, setSheetRange] = useState('Sheet1!A1:Z');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<SheetsImportResponse | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectedFeature = params.get('connected');
    const statusParam = params.get('status');
    const errorParam = params.get('error') || params.get('googleError');

    if (connectedFeature === 'sheets') {
      if (statusParam === 'partial') {
        setMessage('Google Sheets connected with partial permissions.');
      } else {
        setMessage('Google Sheets connected successfully! Bidirectional sync is now active.');
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (errorParam) {
      setError(`Google Sheets authorization failed: ${decodeURIComponent(errorParam)}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    const res = await fetchSheetsStatus();
    setLoading(false);
    if (res.data) {
      setConnected(res.data.connected);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    const res = await fetchGoogleAuthUrl('SHEETS');
    setConnecting(false);

    if (res.error) {
      setError(`Failed to initiate Google Sheets OAuth: ${res.error}`);
    } else if (res.data?.url) {
      window.location.href = res.data.url;
    }
  };

  const handleDisconnect = () => {
    setDisconnectModalOpen(true);
  };

  const confirmDisconnect = async () => {
    setDisconnectModalOpen(false);
    setDisconnecting(true);
    setError(null);
    const res = await disconnectGoogleIntegration('SHEETS');
    setDisconnecting(false);

    if (res.error) {
      setError(res.error);
    } else {
      setConnected(false);
      setExportResult(null);
      setImportResult(null);
      setMessage('Google Sheets disconnected successfully.');
    }
  };

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setExporting(true);
    setError(null);
    setMessage(null);

    const res = await exportLeadsToSheet(exportTitle.trim() || undefined);
    setExporting(false);

    if (res.error) {
      setError(`Export failed: ${res.error}`);
    } else if (res.data && res.data.success) {
      setExportResult(res.data);
      setMessage(`Export complete! Created Google Sheet with ${res.data.exportedRows} leads.`);
    }
  };

  const extractSpreadsheetId = (input: string): string => {
    const trimmed = input.trim();
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return trimmed;
  };

  const detectedId = sheetInput.trim() ? extractSpreadsheetId(sheetInput) : '';

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const spreadsheetId = extractSpreadsheetId(sheetInput);
    if (!spreadsheetId) {
      setError('Please provide a valid Google Spreadsheet URL or ID.');
      return;
    }

    setImporting(true);
    setError(null);
    setMessage(null);

    const res = await importLeadsFromSheet(spreadsheetId, sheetRange.trim() || undefined);
    setImporting(false);

    if (res.error) {
      setError(`Import failed: ${res.error}`);
    } else if (res.data && res.data.success) {
      setImportResult(res.data);
      setMessage(`Import successful: ${res.data.importedCount} new leads added, ${res.data.updatedCount} leads updated from ${res.data.totalRowsRead} rows.`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ── Header ── */}
      {!embedded && (
        <PanelHeader
          title="Google Sheets Pipeline"
          description="Enterprise bidirectional sync between CRMLite leads and Google Spreadsheets with encrypted OAuth tokens and schema validation."
          icon={<FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
        />
      )}

      {/* ── Security & Architecture Pills ── */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <Database className="w-3.5 h-3.5" /> Google Sheets API v4
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-ink-800 text-secondary-c border border-base-c">
          <Lock className="w-3.5 h-3.5 text-primary-500" /> AES-256-GCM Tokens
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-ink-800 text-secondary-c border border-base-c">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Multi-Tenant Isolated
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-ink-800 text-secondary-c border border-base-c">
          Scope: auth/spreadsheets
        </span>
      </div>

      {/* ── Status Alerts ── */}
      {message && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
            <span className="font-medium">{message}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-200 text-xs font-semibold uppercase px-2 py-1 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-200 text-xs font-semibold uppercase px-2 py-1 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Connection Banner Card ── */}
      <GlassCard className="p-6 border border-base-c relative overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            <span className="ml-3 text-sm text-secondary-c">Checking Google authorization status...</span>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <span
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-ink-900 ${
                    connected ? 'bg-emerald-500 shadow-sm' : 'bg-slate-400'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h4 className="text-base font-bold text-primary-c">Google Sheets Connection</h4>
                  <Badge variant={connected ? 'success' : 'neutral'}>
                    {connected ? 'Active & Authorized' : 'Not Connected'}
                  </Badge>
                </div>
                <p className="text-xs text-secondary-c mt-1 max-w-xl leading-relaxed">
                  {connected
                    ? 'Authorized to create, format, and read spreadsheets directly in your Google Workspace. Tokens are auto-refreshed seamlessly.'
                    : 'Connect your Google account to enable 1-click lead exports with formatted headers and auto-sized columns, or import leads from existing sheets.'}
                </p>

                {connected && (
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-c">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      <Check className="w-3.5 h-3.5" /> Read/Write Spreadsheets
                    </span>
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5" /> Auto-Token Refresh
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {connected ? (
                <>
                  <button
                    onClick={checkStatus}
                    className="p-2.5 rounded-xl border border-base-c text-secondary-c hover:text-primary-c hover:bg-slate-100 dark:hover:bg-ink-800 transition-colors btn-tactile"
                    title="Refresh connection status"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl transition-colors text-xs font-semibold btn-tactile"
                  >
                    {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                    Disconnect Integration
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl transition-all shadow-md shadow-emerald-600/20 text-sm font-semibold btn-tactile"
                >
                  {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                  Connect Google Sheets
                </button>
              )}
            </div>
          </div>
        )}
      </GlassCard>

      {/* ── Tabbed Operations (Only active when connected) ── */}
      {connected ? (
        <div className="space-y-6">
          {/* Navigation Segmented Control */}
          <div className="flex border-b border-base-c gap-8">
            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-colors relative ${
                activeTab === 'export'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-c hover:text-primary-c'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Export Leads to Sheets</span>
              {activeTab === 'export' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('import')}
              className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-colors relative ${
                activeTab === 'import'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-c hover:text-primary-c'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Import Leads from Sheet</span>
              {activeTab === 'import' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('mapping')}
              className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-colors relative ${
                activeTab === 'mapping'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-c hover:text-primary-c'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>Column Schema Guide</span>
              {activeTab === 'mapping' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          </div>

          {/* ──────── TAB 1: EXPORT ──────── */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <SectionCard title="Generate New Google Spreadsheet">
                <form onSubmit={handleExport} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-c mb-2">
                      Spreadsheet Document Title
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-c">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                      </div>
                      <input
                        type="text"
                        value={exportTitle}
                        onChange={(e) => setExportTitle(e.target.value)}
                        placeholder="e.g. CRMLite Pipeline Export"
                        className="form-input pl-10 pr-4 text-sm"
                        required
                      />
                    </div>

                    {/* Quick Title Shortcuts */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] text-muted-c">Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() => setExportTitle(`CRMLite Leads - Today (${todayDate})`)}
                        className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-ink-800 text-secondary-c hover:text-primary-c border border-base-c transition-colors"
                      >
                        Today's Date
                      </button>
                      <button
                        type="button"
                        onClick={() => setExportTitle(`Active Pipeline Leads - ${todayDate}`)}
                        className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-ink-800 text-secondary-c hover:text-primary-c border border-base-c transition-colors"
                      >
                        Pipeline Export
                      </button>
                      <button
                        type="button"
                        onClick={() => setExportTitle(`High Value Deals Export`)}
                        className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-ink-800 text-secondary-c hover:text-primary-c border border-base-c transition-colors"
                      >
                        High Value Deals
                      </button>
                    </div>
                  </div>

                  {/* Export Options & Features Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl border border-base-c bg-slate-50/50 dark:bg-ink-900/40">
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary-c">
                        <CheckCheck className="w-4 h-4 text-emerald-500" />
                        <span>Included Fields</span>
                      </div>
                      <p className="text-[11px] text-secondary-c mt-1">
                        Name, Email, Phone, Company, Status, Deal Value, and Lead Source.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-base-c bg-slate-50/50 dark:bg-ink-900/40">
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary-c">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        <span>Auto-Styled Sheets</span>
                      </div>
                      <p className="text-[11px] text-secondary-c mt-1">
                        Frozen Header Row 1, bold typography, emerald accents, and auto-sized column widths.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-base-c bg-slate-50/50 dark:bg-ink-900/40">
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary-c">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span>Ownership</span>
                      </div>
                      <p className="text-[11px] text-secondary-c mt-1">
                        Sheet is created directly in your Google Drive root with full private ownership.
                      </p>
                    </div>
                  </div>

                  {/* Export Result Card */}
                  {exportResult && (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <FileSpreadsheet className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-sm text-primary-c">{exportResult.title}</h5>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                {exportResult.exportedRows} Leads Exported
                              </span>
                            </div>
                            <span className="text-xs text-muted-c font-mono mt-0.5 block truncate max-w-sm">
                              ID: {exportResult.spreadsheetId}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(exportResult.spreadsheetUrl)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-base-c bg-card-c text-xs font-medium text-secondary-c hover:text-primary-c transition-colors btn-tactile"
                          >
                            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                          </button>
                          <a
                            href={exportResult.spreadsheetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/20 btn-tactile"
                          >
                            <span>Open in Google Sheets</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-base-c">
                    <span className="text-xs text-muted-c flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" /> Exports all leads belonging to your current organization.
                    </span>
                    <button
                      type="submit"
                      disabled={exporting}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 btn-tactile"
                    >
                      {exporting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating Spreadsheet...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Export & Create Spreadsheet</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </SectionCard>
            </div>
          )}

          {/* ──────── TAB 2: IMPORT ──────── */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              <SectionCard title="Import Leads from Google Spreadsheet">
                <form onSubmit={handleImport} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-c mb-2">
                        Google Sheet URL or Spreadsheet ID <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={sheetInput}
                        onChange={(e) => setSheetInput(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5n... or ID"
                        className="form-input text-xs font-mono"
                        required
                      />
                      {detectedId && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-mono truncate">
                          Detected Sheet ID: {detectedId}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-c mb-2">
                        Sheet Tab & Range
                      </label>
                      <input
                        type="text"
                        value={sheetRange}
                        onChange={(e) => setSheetRange(e.target.value)}
                        placeholder="Sheet1!A1:Z"
                        className="form-input text-xs font-mono"
                      />
                      <p className="text-[11px] text-muted-c mt-1">
                        Default: <code className="text-secondary-c font-mono">Sheet1!A1:Z</code>
                      </p>
                    </div>
                  </div>

                  {/* Header Auto-Detection Guide Card */}
                  <div className="p-4 rounded-xl border border-base-c bg-slate-50/50 dark:bg-ink-900/40 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary-c">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Smart Header Auto-Detection</span>
                    </div>
                    <p className="text-xs text-secondary-c leading-relaxed">
                      Row 1 must contain column names. Our importer automatically matches columns such as{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400">Name</strong>,{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400">Email</strong>,{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400">Phone</strong>,{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400">Company</strong>,{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400">Status</strong>, and{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400">Value</strong>.
                    </p>
                  </div>

                  {/* Import Results Grid */}
                  {importResult && (
                    <div className="p-5 rounded-2xl border border-base-c bg-card-c space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-sm text-primary-c flex items-center gap-2">
                          <CheckCheck className="w-4 h-4 text-emerald-500" />
                          Import Execution Summary
                        </h5>
                        <Badge variant="success">Completed</Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-xl border border-base-c bg-slate-50 dark:bg-ink-800">
                          <span className="text-[11px] font-medium text-muted-c block uppercase">Total Rows Read</span>
                          <span className="text-2xl font-extrabold text-primary-c">{importResult.totalRowsRead}</span>
                        </div>
                        <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block uppercase">New Leads</span>
                          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{importResult.importedCount}</span>
                        </div>
                        <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/10">
                          <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 block uppercase">Updated Leads</span>
                          <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{importResult.updatedCount}</span>
                        </div>
                        <div className="p-3 rounded-xl border border-base-c bg-slate-50 dark:bg-ink-800">
                          <span className="text-[11px] font-medium text-muted-c block uppercase">Skipped / Empty</span>
                          <span className="text-2xl font-extrabold text-secondary-c">{importResult.skippedCount}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-base-c">
                    <span className="text-xs text-muted-c">
                      Ensure your Google account has Viewer or Editor access to the spreadsheet.
                    </span>
                    <button
                      type="submit"
                      disabled={!sheetInput.trim() || importing}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed btn-tactile"
                    >
                      {importing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Reading & Ingesting Leads...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Import Leads from Google Sheet</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </SectionCard>
            </div>
          )}

          {/* ──────── TAB 3: SCHEMA GUIDE ──────── */}
          {activeTab === 'mapping' && (
            <SectionCard title="Google Sheets Column Mapping & Specification">
              <div className="space-y-4">
                <p className="text-xs text-secondary-c leading-relaxed">
                  When importing from a Google Sheet, CRMLite maps column headers (case-insensitive) to CRM Lead attributes. You can use standard names or common abbreviations:
                </p>

                <div className="overflow-x-auto rounded-xl border border-base-c">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-ink-800/80 border-b border-base-c text-secondary-c uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-3 px-4">CRM Attribute</th>
                        <th className="py-3 px-4">Accepted Column Names</th>
                        <th className="py-3 px-4">Requirement</th>
                        <th className="py-3 px-4">Example Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-base-c text-secondary-c">
                      {FIELD_MAPPINGS.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-ink-800/40 transition-colors">
                          <td className="py-3 px-4 font-semibold text-primary-c">{item.field}</td>
                          <td className="py-3 px-4 font-mono">
                            {item.aliases.map((alias, aIdx) => (
                              <span
                                key={aIdx}
                                className="inline-block mr-1.5 mb-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-ink-700 text-primary-c text-[11px]"
                              >
                                {alias}
                              </span>
                            ))}
                          </td>
                          <td className="py-3 px-4">
                            {item.required ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                Required
                              </span>
                            ) : (
                              <span className="text-muted-c text-[11px]">Optional</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-muted-c">{item.example}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 rounded-xl border border-base-c bg-slate-50/50 dark:bg-ink-900/40 space-y-1.5 text-xs text-secondary-c">
                  <div className="font-semibold text-primary-c flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-emerald-500" />
                    Duplicate Prevention & Merging
                  </div>
                  <p>
                    If a lead already exists in your workspace with matching Phone number or Email address, CRMLite updates the existing record with any newly supplied company, status, or deal values rather than creating a duplicate entry.
                  </p>
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      ) : (
        /* ── Offline Showcase Preview when disconnected ── */
        <SectionCard title="Enterprise Capabilities">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="p-5 rounded-2xl border border-base-c bg-slate-50/40 dark:bg-ink-900/30 space-y-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Download className="w-5 h-5" />
              </div>
              <h5 className="font-bold text-sm text-primary-c">Automated Lead Export</h5>
              <p className="text-xs text-secondary-c leading-relaxed">
                Export real-time CRM leads with one click directly into newly styled spreadsheets with frozen headers, formatted values, and zero manual CSV exports.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-base-c bg-slate-50/40 dark:bg-ink-900/30 space-y-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Upload className="w-5 h-5" />
              </div>
              <h5 className="font-bold text-sm text-primary-c">Intelligent Sheet Ingestion</h5>
              <p className="text-xs text-secondary-c leading-relaxed">
                Point to any Google Sheet link or ID. CRMLite reads, parses headers, normalizes phone numbers, and safely creates or updates leads while preserving multi-tenant isolation.
              </p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Disconnect Modal ── */}
      <ConfirmModal
        isOpen={disconnectModalOpen}
        title="Disconnect Google Sheets Integration"
        message="Are you sure you want to disconnect Google Sheets? CRMLite will revoke current OAuth permissions and will no longer be able to export or import sheets until reconnected."
        confirmText="Disconnect Integration"
        cancelText="Cancel"
        onConfirm={confirmDisconnect}
        onCancel={() => setDisconnectModalOpen(false)}
      />
    </div>
  );
}
