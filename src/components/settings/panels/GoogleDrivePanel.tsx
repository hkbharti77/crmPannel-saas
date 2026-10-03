import { useState, useEffect, useRef } from 'react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { GlassCard, Badge } from '@/components/ui/primitives';
import {
  HardDrive, Loader2, CheckCircle2, AlertCircle, LogOut,
  Upload, FileText, ExternalLink, ShieldCheck, RefreshCw, Folder, FileCheck,
  Lock, Database, Check, Search, Grid, List, Copy, FolderPlus,
  FileSpreadsheet, Image as ImageIcon, File, Sparkles, Info, ShieldAlert
} from 'lucide-react';
import { PanelHeader, SectionCard } from './_shared';
import {
  fetchDriveStatus,
  uploadDriveFile,
  listDriveFiles,
  fetchGoogleAuthUrl,
  disconnectGoogleIntegration,
  GoogleDriveFile
} from '@/lib/integrationsApi';

/* ─── Folder Presets ─── */
const FOLDER_PRESETS = [
  'CRMLite Documents',
  'Client Agreements',
  'KYC & Identity',
  'Proposals & Quotes',
  'Invoices & Receipts',
];

export function GoogleDrivePanel({ embedded = false }: { embedded?: boolean } = {}) {
  const [activeTab, setActiveTab] = useState<'upload' | 'explorer' | 'security'>('upload');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [folderName, setFolderName] = useState('CRMLite Documents');
  const [customFolder, setCustomFolder] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedResult, setUploadedResult] = useState<{ fileName: string; webViewLink: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Files list state
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectedFeature = params.get('connected');
    const statusParam = params.get('status');
    const errorParam = params.get('error') || params.get('googleError');

    if (connectedFeature === 'drive') {
      if (statusParam === 'partial') {
        setMessage('Google Drive connected with partial permissions.');
      } else {
        setMessage('Google Drive connected successfully! Sandboxed cloud storage is now active.');
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (errorParam) {
      setError(`Google Drive authorization failed: ${decodeURIComponent(errorParam)}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    const res = await fetchDriveStatus();
    setLoading(false);
    if (res.data) {
      setConnected(res.data.connected);
      if (res.data.connected) {
        loadFiles();
      }
    }
  };

  const loadFiles = async () => {
    setLoadingFiles(true);
    const res = await listDriveFiles(50);
    setLoadingFiles(false);
    if (res.data) {
      setFiles(res.data);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    const res = await fetchGoogleAuthUrl('DRIVE');
    setConnecting(false);

    if (res.error) {
      setError(`Failed to initiate Google Drive OAuth: ${res.error}`);
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
    const res = await disconnectGoogleIntegration('DRIVE');
    setDisconnecting(false);

    if (res.error) {
      setError(res.error);
    } else {
      setConnected(false);
      setFiles([]);
      setMessage('Google Drive disconnected successfully.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadedResult(null);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setUploadedResult(null);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);

    const res = await uploadDriveFile(selectedFile, folderName.trim() || undefined);
    setUploading(false);

    if (res.error) {
      setError(`Upload failed: ${res.error}`);
    } else if (res.data && res.data.success) {
      setUploadedResult({
        fileName: res.data.fileName,
        webViewLink: res.data.webViewLink,
      });
      setMessage(`Successfully stored "${res.data.fileName}" in Google Drive folder "${folderName}".`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadFiles();
    }
  };

  const formatFileSize = (bytes?: number | string) => {
    if (!bytes) return '';
    const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (isNaN(num)) return '';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Filter files by search query
  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-rose-500" />;
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
    if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext || '')) return <ImageIcon className="w-4 h-4 text-purple-500" />;
    return <File className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ── Header ── */}
      {!embedded && (
        <PanelHeader
          title="Google Drive Storage Pipeline"
          description="Enterprise cloud document storage with per-tenant isolation, sandboxed OAuth permissions, and direct document linking."
          icon={<HardDrive className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
        />
      )}

      {/* ── Security Architecture Pills ── */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <Database className="w-3.5 h-3.5" /> Drive API v3
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-ink-800 text-secondary-c border border-base-c">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Sandboxed: drive.file
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-ink-800 text-secondary-c border border-base-c">
          <Lock className="w-3.5 h-3.5 text-primary-500" /> AES-256-GCM Tokens
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-ink-800 text-secondary-c border border-base-c">
          Tenant Isolated Storage
        </span>
      </div>

      {/* ── Notifications ── */}
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

      {/* ── Connection Hero Card ── */}
      <GlassCard className="p-6 border border-base-c relative overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-3 text-sm text-secondary-c">Checking Google authorization status...</span>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent border border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-sm">
                  <HardDrive className="w-7 h-7" />
                </div>
                <span
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-ink-900 ${
                    connected ? 'bg-emerald-500 shadow-sm' : 'bg-slate-400'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h4 className="text-base font-bold text-primary-c">Google Drive Workspace</h4>
                  <Badge variant={connected ? 'success' : 'neutral'}>
                    {connected ? 'Active & Authorized' : 'Not Connected'}
                  </Badge>
                </div>
                <p className="text-xs text-secondary-c mt-1 max-w-xl leading-relaxed">
                  {connected
                    ? 'Authorized with sandboxed drive.file permissions. CRMLite can safely upload and organize client documents in your company folders without accessing any private files.'
                    : 'Connect your corporate Google account to store client contracts, proposals, and KYC attachments in designated Drive folders.'}
                </p>

                {connected && (
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-c">
                    <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                      <Check className="w-3.5 h-3.5" /> Sandboxed Read/Write
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> AES-256 Token Encryption
                    </span>
                    <span className="flex items-center gap-1.5 font-mono">
                      {files.length} Synced Files
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
                    Disconnect Drive
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl transition-all shadow-md shadow-blue-600/20 text-sm font-semibold btn-tactile"
                >
                  {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
                  Connect Google Drive
                </button>
              )}
            </div>
          </div>
        )}
      </GlassCard>

      {/* ── Tabbed Workspace ── */}
      {connected ? (
        <div className="space-y-6">
          {/* Segmented Control */}
          <div className="flex border-b border-base-c gap-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-colors relative ${
                activeTab === 'upload'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-muted-c hover:text-primary-c'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
              {activeTab === 'upload' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('explorer')}
              className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-colors relative ${
                activeTab === 'explorer'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-muted-c hover:text-primary-c'
              }`}
            >
              <Folder className="w-4 h-4" />
              <span>Drive File Explorer</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                {files.length}
              </span>
              {activeTab === 'explorer' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-colors relative ${
                activeTab === 'security'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-muted-c hover:text-primary-c'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Security & Sandbox</span>
              {activeTab === 'security' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
          </div>

          {/* ──────── TAB 1: UPLOAD ──────── */}
          {activeTab === 'upload' && (
            <SectionCard title="Store Document in Google Drive">
              <form onSubmit={handleUpload} className="space-y-5">
                {/* Folder Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-c">
                      Target Folder in Google Drive
                    </label>
                    <button
                      type="button"
                      onClick={() => setCustomFolder(!customFolder)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      {customFolder ? 'Pick from Presets' : '+ Custom Folder Name'}
                    </button>
                  </div>

                  {customFolder ? (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-c">
                        <Folder className="w-4 h-4 text-blue-500" />
                      </div>
                      <input
                        type="text"
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        placeholder="e.g. 2026 Client Contracts"
                        className="form-input pl-10 pr-4 text-sm"
                        required
                      />
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {FOLDER_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setFolderName(preset)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                            folderName === preset
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-card-c border-base-c text-secondary-c hover:text-primary-c hover:bg-slate-50 dark:hover:bg-ink-800'
                          }`}
                        >
                          <Folder className="w-3.5 h-3.5" />
                          <span>{preset}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-muted-c mt-1.5">
                    If this folder does not exist in your Drive root, CRMLite will automatically create it for you.
                  </p>
                </div>

                {/* Drag & Drop Upload Zone */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-c mb-2">
                    Select File to Upload
                  </label>

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                        : 'border-base-c hover:border-blue-500/50 bg-slate-50/50 dark:bg-ink-900/40 hover:bg-slate-50 dark:hover:bg-ink-900/70'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-sm">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-semibold text-primary-c">
                        {selectedFile ? (
                          <span className="text-blue-600 dark:text-blue-400">{selectedFile.name}</span>
                        ) : (
                          <span>Click to browse or drag and drop file here</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-c">
                        Supported files: PDF, DOCX, XLSX, PNG, JPG (up to 25MB)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selected File Details Banner */}
                {selectedFile && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400">
                        {getFileIcon(selectedFile.name)}
                      </div>
                      <div>
                        <span className="font-bold text-primary-c block">{selectedFile.name}</span>
                        <span className="text-muted-c font-mono">Size: {formatFileSize(selectedFile.size)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-muted-c hover:text-rose-500 text-xs font-semibold px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Uploaded Success Card */}
                {uploadedResult && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-bold text-sm text-primary-c">{uploadedResult.fileName}</h5>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            Stored in folder: {folderName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(uploadedResult.webViewLink)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-base-c bg-card-c text-xs font-medium text-secondary-c hover:text-primary-c transition-colors btn-tactile"
                        >
                          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedLink ? 'Copied Link!' : 'Copy Drive Link'}</span>
                        </button>
                        <a
                          href={uploadedResult.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/20 btn-tactile"
                        >
                          <span>Open in Drive</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Action */}
                <div className="flex items-center justify-between pt-2 border-t border-base-c">
                  <span className="text-xs text-muted-c flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> Files are encrypted and uploaded via official Google Drive API.
                  </span>
                  <button
                    type="submit"
                    disabled={!selectedFile || uploading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed btn-tactile"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading to Drive...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload File to Drive</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </SectionCard>
          )}

          {/* ──────── TAB 2: EXPLORER ──────── */}
          {activeTab === 'explorer' && (
            <SectionCard title="Synced Google Drive Files">
              {/* Search & View Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="relative flex-1 max-w-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-c">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search documents by name..."
                    className="form-input pl-9 pr-3 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <div className="flex items-center rounded-xl border border-base-c p-0.5 bg-card-c">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === 'list'
                          ? 'bg-blue-600 text-white'
                          : 'text-muted-c hover:text-primary-c'
                      }`}
                      title="List View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-blue-600 text-white'
                          : 'text-muted-c hover:text-primary-c'
                      }`}
                      title="Grid View"
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={loadFiles}
                    disabled={loadingFiles}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-base-c text-xs font-medium text-secondary-c hover:text-primary-c transition-colors btn-tactile"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingFiles ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {loadingFiles ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  <span className="ml-3 text-xs text-secondary-c">Loading Drive documents...</span>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-12 text-muted-c text-xs space-y-2">
                  <HardDrive className="w-10 h-10 mx-auto text-slate-400 opacity-40" />
                  <p className="font-semibold text-primary-c">No documents found</p>
                  <p className="text-[11px] max-w-sm mx-auto">
                    {searchQuery ? 'No documents match your search query.' : 'Upload client agreements, proposals, or contracts using the Upload tab above.'}
                  </p>
                </div>
              ) : viewMode === 'list' ? (
                /* List View */
                <div className="divide-y divide-base-c rounded-xl border border-base-c overflow-hidden">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-ink-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-ink-800 shrink-0">
                          {getFileIcon(file.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-primary-c truncate">{file.name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-c mt-0.5">
                            {file.size && <span>{formatFileSize(file.size)}</span>}
                            {file.size && file.createdTime && <span>•</span>}
                            {file.createdTime && (
                              <span>{new Date(file.createdTime).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {file.webViewLink && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(file.webViewLink!)}
                            className="p-2 rounded-xl border border-base-c text-secondary-c hover:text-primary-c bg-card-c transition-colors btn-tactile"
                            title="Copy Drive link"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm btn-tactile"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Grid View */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-4 rounded-xl border border-base-c bg-card-c hover:border-blue-500/30 hover:shadow-soft transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-ink-800">
                          {getFileIcon(file.name)}
                        </div>
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-c hover:text-blue-500 transition-colors"
                            title="Open in Drive"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-primary-c truncate" title={file.name}>
                          {file.name}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-muted-c mt-1 font-mono">
                          <span>{formatFileSize(file.size)}</span>
                          {file.createdTime && <span>{new Date(file.createdTime).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}

          {/* ──────── TAB 3: SECURITY & SANDBOX ──────── */}
          {activeTab === 'security' && (
            <SectionCard title="Enterprise Security & Privacy Architecture">
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Sandboxed Permission Guarantee (drive.file scope)</span>
                  </div>
                  <p className="text-xs text-secondary-c leading-relaxed">
                    CRMLite requests only the restricted <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-ink-800 font-mono text-[11px] text-primary-c">https://www.googleapis.com/auth/drive.file</code> scope. Under Google Cloud security policies, this grants access <strong>strictly and exclusively</strong> to files and folders created or opened by CRMLite. CRMLite can never see, read, modify, or delete your existing Google Drive documents, personal photos, or financial files.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl border border-base-c bg-slate-50/50 dark:bg-ink-900/40 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary-c">
                      <Lock className="w-4 h-4 text-blue-500" />
                      <span>AES-256 Encryption</span>
                    </div>
                    <p className="text-[11px] text-secondary-c leading-relaxed">
                      All OAuth refresh tokens are encrypted at rest with AES-256-GCM authenticated encryption before being persisted to the database.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-base-c bg-slate-50/50 dark:bg-ink-900/40 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary-c">
                      <Database className="w-4 h-4 text-blue-500" />
                      <span>Tenant Isolation</span>
                    </div>
                    <p className="text-[11px] text-secondary-c leading-relaxed">
                      Every file reference is tagged with your organization's unique Tenant ID, strictly preventing cross-tenant leakage.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-base-c bg-slate-50/50 dark:bg-ink-900/40 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary-c">
                      <ShieldAlert className="w-4 h-4 text-blue-500" />
                      <span>Revocation Control</span>
                    </div>
                    <p className="text-[11px] text-secondary-c leading-relaxed">
                      You can instantly revoke CRMLite's access anytime using the Disconnect button or directly from your Google Account Security Dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      ) : (
        /* ── Disconnected Showcase Preview ── */
        <SectionCard title="Enterprise Cloud Storage Capabilities">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="p-5 rounded-2xl border border-base-c bg-slate-50/40 dark:bg-ink-900/30 space-y-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Upload className="w-5 h-5" />
              </div>
              <h5 className="font-bold text-sm text-primary-c">Direct Client Document Storage</h5>
              <p className="text-xs text-secondary-c leading-relaxed">
                Upload proposals, signed contracts, KYC identification, and lead attachments directly into designated Google Drive folders with zero manual syncing.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-base-c bg-slate-50/40 dark:bg-ink-900/30 space-y-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h5 className="font-bold text-sm text-primary-c">Zero-Trust Privacy & Sandboxing</h5>
              <p className="text-xs text-secondary-c leading-relaxed">
                Restricted to the official <code className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">drive.file</code> scope. CRMLite can only view documents it creates, leaving all other private Google Drive documents completely untouched.
              </p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Disconnect Modal ── */}
      <ConfirmModal
        isOpen={disconnectModalOpen}
        title="Disconnect Google Drive Integration"
        message="Are you sure you want to disconnect Google Drive? CRMLite will revoke access tokens and will no longer be able to upload agreements or documents directly to Drive until reconnected."
        confirmText="Disconnect Integration"
        cancelText="Cancel"
        onConfirm={confirmDisconnect}
        onCancel={() => setDisconnectModalOpen(false)}
      />
    </div>
  );
}
