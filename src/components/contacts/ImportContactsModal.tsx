import { useState, useRef } from 'react';
import { X, Upload, FileText, Download, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Papa from 'papaparse';
import { importContactsBatch, type ContactImportRowDTO, type ImportResultDTO } from '@/lib/contactsApi';

interface ImportContactsModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'UPLOAD' | 'PREVIEW' | 'IMPORTING' | 'RESULTS';

interface ParsedRow {
  file: string;
  row: number;
  name?: string;
  email?: string;
  waId: string;
  tags?: string[];
  isValid: boolean;
  errors: string[];
}

export function ImportContactsModal({ onClose, onSuccess }: ImportContactsModalProps) {
  const [step, setStep] = useState<Step>('UPLOAD');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importResult, setImportResult] = useState<ImportResultDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files).filter(f => f.name.endsWith('.csv')));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files).filter(f => f.name.endsWith('.csv')));
    }
  };

  const handleDownloadTemplate = () => {
    const template = 'name,whatsapp_number,email,tags\nRahul Kumar,+919876543210,rahul@example.com,"Customer,Hot Lead"';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const processFiles = async (files: File[]) => {
    setError(null);
    setStep('PREVIEW');
    
    const allParsed: ParsedRow[] = [];
    
    for (const file of files) {
      await new Promise<void>((resolve) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const rows = results.data as Record<string, string>[];
            
            rows.forEach((r, index) => {
              // Map defensive headers
              const waId = r.whatsapp_number || r['WhatsApp Number'] || r.phone || r.phone_number || r.waId;
              const name = r.name || r.Name || r.Full_Name || r['Full Name'];
              const email = r.email || r.Email;
              const tagsStr = r.tags || r.Tags;
              
              const rowErrors: string[] = [];
              if (!waId || String(waId).trim() === '') {
                rowErrors.push('Missing WhatsApp number');
              }
              
              allParsed.push({
                file: file.name,
                row: index + 2, // 1-based index + header
                name: name ? String(name).trim() : undefined,
                email: email ? String(email).trim() : undefined,
                waId: waId ? String(waId).trim() : '',
                tags: tagsStr ? String(tagsStr).split(',').map(t => t.trim()).filter(t => t.length > 0) : [],
                isValid: rowErrors.length === 0,
                errors: rowErrors
              });
            });
            resolve();
          },
          error: (err) => {
            setError(`Error parsing ${file.name}: ${err.message}`);
            resolve();
          }
        });
      });
    }

    setParsedRows(allParsed);
  };

  const handleImport = async () => {
    setStep('IMPORTING');
    
    const validRows = parsedRows.filter(r => r.isValid);
    
    // Convert to DTO
    const batch: ContactImportRowDTO[] = validRows.map(r => ({
      file: r.file,
      row: r.row,
      name: r.name,
      email: r.email,
      waId: r.waId!,
      tags: r.tags
    }));

    // Chunking to 500 contacts per batch
    const chunkSize = 500;
    const finalResult: ImportResultDTO = {
      total: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < batch.length; i += chunkSize) {
      const chunk = batch.slice(i, i + chunkSize);
      const res = await importContactsBatch(chunk);
      if (res.error) {
        setError(`Import failed: ${res.error}`);
        setStep('PREVIEW');
        return;
      }
      
      if (res.data) {
        finalResult.total += res.data.total;
        finalResult.created += res.data.created;
        finalResult.updated += res.data.updated;
        finalResult.skipped += res.data.skipped;
        finalResult.failed += res.data.failed;
        finalResult.errors = [...finalResult.errors, ...res.data.errors];
      }
    }

    // Add frontend validation errors to final result
    const invalidRows = parsedRows.filter(r => !r.isValid);
    finalResult.total += invalidRows.length;
    finalResult.failed += invalidRows.length;
    invalidRows.forEach(r => {
      finalResult.errors.push({
        file: r.file,
        row: r.row,
        field: 'validation',
        code: 'FRONTEND_VALIDATION',
        message: r.errors.join(', ')
      });
    });

    setImportResult(finalResult);
    setStep('RESULTS');
  };

  const handleDownloadErrorReport = () => {
    if (!importResult || importResult.errors.length === 0) return;
    
    const csv = Papa.unparse(importResult.errors);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import_errors.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm dark:bg-black/60" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200 dark:border-ink-800 dark:bg-ink-950 max-h-[90vh] overflow-y-auto">
        
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Import Contacts</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors dark:hover:bg-ink-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {step === 'UPLOAD' && (
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center transition-colors hover:border-slate-300 dark:border-ink-800 dark:bg-ink-900/50">
              <div className="mb-4 rounded-full bg-blue-100 p-3 dark:bg-blue-500/10">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Download Template</h3>
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                Start with our CSV template to ensure your columns are formatted correctly.
              </p>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-ink-700 dark:bg-ink-900 dark:text-slate-300 dark:hover:bg-ink-800"
              >
                <Download className="h-4 w-4" />
                Template.csv
              </button>
            </div>

            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/50 p-6 text-center transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-primary-900/30 dark:bg-primary-900/10 dark:hover:border-primary-800/50"
            >
              <input 
                type="file" 
                multiple 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <div className="mb-4 rounded-full bg-primary-100 p-3 dark:bg-primary-900/30">
                <Upload className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">Upload CSV</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Drag and drop your CSV files here, or click to browse. Multiple files supported.
              </p>
            </div>
          </div>
        )}

        {step === 'PREVIEW' && (
          <div className="space-y-6">
            <div className="flex gap-4 p-4 bg-slate-50 rounded-xl dark:bg-ink-900">
              <div className="flex-1">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Detected</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{parsedRows.length}</p>
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500 dark:text-slate-400">Valid Rows</p>
                <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{parsedRows.filter(r => r.isValid).length}</p>
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500 dark:text-slate-400">Invalid Rows</p>
                <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{parsedRows.filter(r => !r.isValid).length}</p>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-ink-800">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 sticky top-0 dark:bg-ink-900">
                  <tr className="border-b border-slate-200 dark:border-ink-800">
                    <th className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300">Name</th>
                    <th className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300">WhatsApp</th>
                    <th className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-ink-800">
                  {parsedRows.slice(0, 50).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-ink-900/50">
                      <td className="px-4 py-2 text-slate-900 dark:text-slate-100">{row.name || '-'}</td>
                      <td className="px-4 py-2 text-slate-900 dark:text-slate-100">{row.waId || '-'}</td>
                      <td className="px-4 py-2">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CheckCircle className="h-3 w-3" /> Ready</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400" title={row.errors.join(', ')}><XCircle className="h-3 w-3" /> Invalid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <p className="text-xs text-slate-500 text-center">Showing up to 50 rows preview</p>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-ink-800">
              <button
                onClick={() => setStep('UPLOAD')}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-ink-800"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={parsedRows.filter(r => r.isValid).length === 0}
                className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
              >
                Import {parsedRows.filter(r => r.isValid).length} Contacts
              </button>
            </div>
          </div>
        )}

        {step === 'IMPORTING' && (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-12 w-12 animate-spin text-primary-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Importing Contacts...</h3>
            <p className="text-sm text-slate-500 mt-2">Please wait while we process your files.</p>
          </div>
        )}

        {step === 'RESULTS' && importResult && (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-200 dark:bg-ink-900 dark:border-ink-800">
              <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Import Complete</h3>
              <p className="text-slate-600 dark:text-slate-400">{importResult.total} rows processed</p>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="flex flex-col items-center p-4 bg-emerald-50 rounded-lg dark:bg-emerald-900/10">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{importResult.created}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Created</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg dark:bg-blue-900/10">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{importResult.updated}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-800 dark:text-blue-300">Updated</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-slate-100 rounded-lg dark:bg-ink-800">
                <span className="text-2xl font-bold text-slate-600 dark:text-slate-400">{importResult.skipped}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Skipped</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg dark:bg-red-900/10">
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">{importResult.failed}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-red-800 dark:text-red-300">Failed</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-slate-200 dark:border-ink-800">
              {importResult.errors.length > 0 ? (
                <button
                  onClick={handleDownloadErrorReport}
                  className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <Download className="h-4 w-4" />
                  Download Error Report
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
