import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Play,
  RefreshCw,
  FileSpreadsheet,
  Check,
  Zap,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { uploadContactsFile, type BulkUploadBatch } from '@/lib/bulkUploadApi';
import { fetchJourneys, type CustomerJourney } from '@/lib/journeyApi';
import { GlassCard } from '@/components/ui/primitives';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [columnMapping, setColumnMapping] = useState<{ name: string; phone: string; email: string }>({
    name: 'name',
    phone: 'phone',
    email: 'email',
  });
  const [selectedJourneyId, setSelectedJourneyId] = useState<string>('');
  const [journeys, setJourneys] = useState<CustomerJourney[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [batchResult, setBatchResult] = useState<BulkUploadBatch | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadJourneys();
    }
  }, [isOpen]);

  const loadJourneys = async () => {
    try {
      const data = await fetchJourneys();
      setJourneys(data.filter((j) => j.status === 'PUBLISHED' || j.status === 'DRAFT'));
    } catch (err) {
      console.error('Failed to load journeys:', err);
    }
  };

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV, Excel (.xlsx), or TXT file to upload');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const batch = await uploadContactsFile(file, columnMapping, selectedJourneyId || undefined);
      setBatchResult(batch);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to process bulk contact ingestion');
    } finally {
      setUploading(false);
    }
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 top-0 right-0 bottom-0 left-0 w-screen h-screen z-[9998] bg-slate-950/65 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 top-0 right-0 bottom-0 left-0 w-screen h-screen z-[9999] pointer-events-none flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <GlassCard className="pointer-events-auto relative w-full max-w-2xl bg-card-c border border-base-c shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-base-c bg-subtle-c/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-accent text-white shadow-md">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-primary-c">Bulk Contact Ingestion Engine</h3>
                <p className="text-xs text-muted-c">Upload CSV, Excel (.xlsx), or TXT & trigger omnichannel journeys</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-muted-c hover:text-primary-c rounded-lg hover:bg-subtle-c transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-xs font-semibold leading-relaxed">{error}</div>
              </div>
            )}

            {!batchResult ? (
              <>
                {/* File Dropzone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                    file
                      ? 'border-primary-500 bg-primary-500/5'
                      : 'border-base-c hover:border-primary-500/50 hover:bg-subtle-c/40'
                  }`}
                >
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls, .txt"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="bulk-file-input"
                  />
                  <label htmlFor="bulk-file-input" className="cursor-pointer space-y-3 block">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary-500/10 to-indigo-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 flex items-center justify-center shadow-xs">
                      <FileSpreadsheet className="w-7 h-7" />
                    </div>
                    {file ? (
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold mb-1">
                          <Check className="w-3.5 h-3.5" /> Ready for Processing
                        </span>
                        <p className="font-bold text-primary-c text-sm">{file.name}</p>
                        <p className="text-xs text-muted-c mt-0.5">
                          {(file.size / 1024).toFixed(1)} KB • Click or drop to change file
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-bold text-primary-c text-sm">Drag & drop your contact file here, or browse</p>
                        <p className="text-xs text-muted-c mt-1">Supports .CSV, .XLSX, .TXT up to 50MB per batch</p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Column Mapping Options */}
                <div className="space-y-3 bg-subtle-c/60 p-4 rounded-xl border border-base-c">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-c flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary-500" /> Dynamic Header Field Mapping
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-secondary-c block mb-1">Full Name Header</label>
                      <input
                        type="text"
                        value={columnMapping.name}
                        onChange={(e) => setColumnMapping({ ...columnMapping, name: e.target.value })}
                        className="form-input text-xs"
                        placeholder="e.g. name, full_name"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-secondary-c block mb-1">Phone Header</label>
                      <input
                        type="text"
                        value={columnMapping.phone}
                        onChange={(e) => setColumnMapping({ ...columnMapping, phone: e.target.value })}
                        className="form-input text-xs"
                        placeholder="e.g. phone, mobile"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-secondary-c block mb-1">Email Header</label>
                      <input
                        type="text"
                        value={columnMapping.email}
                        onChange={(e) => setColumnMapping({ ...columnMapping, email: e.target.value })}
                        className="form-input text-xs"
                        placeholder="e.g. email, mail"
                      />
                    </div>
                  </div>
                </div>

                {/* Auto Trigger Journey Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary-c flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Auto-Launch Journey Automation
                  </label>
                  <select
                    value={selectedJourneyId}
                    onChange={(e) => setSelectedJourneyId(e.target.value)}
                    className="form-input text-xs"
                  >
                    <option value="">None (Import contacts to CRM without launching journey)</option>
                    {journeys.map((j) => (
                      <option key={j.id} value={j.id}>
                        ⚡ {j.name} ({j.triggerEvent}) — {j.status}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              /* Result Summary Screen */
              <div className="space-y-6 text-center py-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-primary-c">Bulk Ingestion Successfully Queued</h4>
                  <p className="text-xs text-muted-c font-mono mt-1">Batch SHA-256 ID: {batchResult.id}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-subtle-c p-4 rounded-xl text-left border border-base-c">
                  <div>
                    <span className="text-[11px] text-muted-c block">Total File Rows</span>
                    <span className="text-lg font-black text-primary-c">{batchResult.totalRows}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-c block">Valid Rows</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{batchResult.validRows}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-c block">Ingested Contacts</span>
                    <span className="text-lg font-black text-primary-600 dark:text-primary-400">
                      {batchResult.importedContacts + batchResult.updatedContacts}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-c block">Validation Failed</span>
                    <span className="text-lg font-black text-rose-600 dark:text-rose-400">{batchResult.failedRows}</span>
                  </div>
                </div>

                {batchResult.failedRows > 0 && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Some rows failed validation. Download the failed rows CSV log for inspection.</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-base-c bg-subtle-c/50 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-secondary-c hover:text-primary-c transition-colors"
            >
              Close
            </button>
            {!batchResult ? (
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex items-center gap-2 rounded-xl bg-gradient-accent px-5 py-2 text-xs font-bold text-white shadow-md hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Processing Ingestion Batch...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Start Contact Ingestion
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  setFile(null);
                  setBatchResult(null);
                }}
                className="flex items-center gap-2 rounded-xl border border-base-c bg-card-c px-4 py-2 text-xs font-semibold text-primary-c shadow-sm hover:bg-subtle-c transition-all"
              >
                Upload Another File
              </button>
            )}
          </div>
        </GlassCard>
      </div>
    </>,
    document.body
  );
};
