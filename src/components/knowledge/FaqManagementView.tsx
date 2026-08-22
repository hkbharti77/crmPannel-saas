import { useState, useEffect, useRef } from 'react';
import { cx } from '@/lib/types';
import {
  HelpCircle, Plus, Search, Trash2, Edit3, CheckCircle,
  AlertCircle, Sparkles, RefreshCw, Zap, Loader2, X,
  Upload, FileText, Download, FileSpreadsheet, Layers, Check,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { fetchFaqs, createFaq, updateFaq, deleteFaq, createBatchFaqs, type FaqItemDto } from '@/lib/faqApi';

export function FaqManagementView() {
  const [faqs, setFaqs] = useState<FaqItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // 10-Row Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Single Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItemDto | null>(null);
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formKeywords, setFormKeywords] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Bulk Upload Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [parsedFaqs, setParsedFaqs] = useState<Partial<FaqItemDto>[]>([]);
  const [bulkDragOver, setBulkDragOver] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  // Status Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const loadFaqs = async () => {
    setLoading(true);
    const res = await fetchFaqs();
    setLoading(false);
    if (res.data) {
      setFaqs(res.data);
    }
  };

  useEffect(() => {
    loadFaqs();
  }, []);

  // Reset pagination to page 1 on search or category filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const categories = Array.from(new Set(['General', ...faqs.map(f => f.category || 'General')]));

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (faq.keywords && faq.keywords.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'ALL' || (faq.category || 'General') === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalPages = Math.max(1, Math.ceil(filteredFaqs.length / itemsPerPage));
  const paginatedFaqs = filteredFaqs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenCreate = () => {
    setEditingFaq(null);
    setFormQuestion('');
    setFormAnswer('');
    setFormCategory('General');
    setFormKeywords('');
    setShowModal(true);
  };

  const handleOpenEdit = (faq: FaqItemDto) => {
    setEditingFaq(faq);
    setFormQuestion(faq.question);
    setFormAnswer(faq.answer);
    setFormCategory(faq.category || 'General');
    setFormKeywords(faq.keywords || '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim() || !formAnswer.trim()) return;

    setSaving(true);
    let res;
    if (editingFaq && editingFaq.id) {
      res = await updateFaq(editingFaq.id, {
        question: formQuestion.trim(),
        answer: formAnswer.trim(),
        category: formCategory.trim(),
        keywords: formKeywords.trim(),
      });
    } else {
      res = await createFaq({
        question: formQuestion.trim(),
        answer: formAnswer.trim(),
        category: formCategory.trim(),
        keywords: formKeywords.trim(),
        isActive: true,
      });
    }
    setSaving(false);

    if (res.error) {
      setNotification({ type: 'error', msg: res.error });
    } else {
      setNotification({ type: 'success', msg: editingFaq ? 'FAQ updated successfully!' : 'FAQ created & vector indexed!' });
      setShowModal(false);
      loadFaqs();
    }
  };

  const handleToggleActive = async (faq: FaqItemDto) => {
    if (!faq.id) return;
    const res = await updateFaq(faq.id, { isActive: !faq.isActive });
    if (res.data) {
      setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, isActive: !f.isActive } : f));
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deleteFaq(id);
    setDeleteConfirmId(null);
    if (!res.error) {
      setNotification({ type: 'success', msg: 'FAQ item removed.' });
      setFaqs(prev => prev.filter(f => f.id !== id));
    } else {
      setNotification({ type: 'error', msg: res.error });
    }
  };

  // ─────────────────────────────────────────────────────────────
  // BULK UPLOAD HANDLERS
  // ─────────────────────────────────────────────────────────────
  const downloadTemplate = (format: 'csv' | 'excel') => {
    const csvContent = 
      `Question,Answer,Category,Keywords\n` +
      `"What are your operating hours?","We are open Monday to Friday from 9 AM to 6 PM EST.","General","hours, open, timing"\n` +
      `"Where is your office located?","Our global headquarters is located at 100 Tech Boulevard, Suite 400.","General","location, office, address"\n` +
      `"What is your refund policy?","Refunds can be requested within 30 days of purchase through our billing portal.","Billing","refund, return, money back"\n`;

    const blob = new Blob([csvContent], { type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `faq_upload_template.${format === 'csv' ? 'csv' : 'txt'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvText = (text: string): Partial<FaqItemDto>[] => {
    const raw = text.trim();
    if (!raw) return [];

    // Try parsing as JSON first
    if (raw.startsWith('[') && raw.endsWith(']')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => item && (item.question || item.q)).map(item => ({
            question: (item.question || item.q || '').trim(),
            answer: (item.answer || item.a || '').trim(),
            category: item.category || 'General',
            keywords: item.keywords || '',
            isActive: item.isActive !== false,
          }));
        }
      } catch (e) {
        // Fallback to CSV
      }
    }

    const lines = raw.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return [];

    const items: Partial<FaqItemDto>[] = [];
    
    // Check if the first line is a header
    const firstLineLower = lines[0].toLowerCase();
    const hasHeader = firstLineLower.includes('question') && (firstLineLower.includes('answer') || firstLineLower.includes('category'));
    const startIndex = hasHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      let row: string[] = [];
      if (line.includes('\t')) {
        row = line.split('\t').map(c => c.trim().replace(/^"|"$/g, ''));
      } else if (line.includes(';') && !line.includes(',')) {
        row = line.split(';').map(c => c.trim().replace(/^"|"$/g, ''));
      } else {
        const matches = line.match(/(?:^|,)(?:"([^"]*)"|([^,]*))/g);
        if (matches) {
          row = matches.map(cell => {
            let val = cell.replace(/^,/, '').trim();
            if (val.startsWith('"') && val.endsWith('"')) {
              val = val.substring(1, val.length - 1);
            }
            return val;
          });
        }
      }

      if (row.length >= 2 && row[0] && row[1]) {
        items.push({
          question: row[0].trim(),
          answer: row[1].trim(),
          category: row[2] ? row[2].trim() : 'General',
          keywords: row[3] ? row[3].trim() : '',
          isActive: true,
        });
      } else if (row.length === 1 && row[0]) {
        const parts = row[0].split(/\s*->\s*|\s*\|\s*|\s*:\s*(?=A:)/i);
        if (parts.length >= 2) {
          items.push({
            question: parts[0].replace(/^q:\s*/i, '').trim(),
            answer: parts[1].replace(/^a:\s*/i, '').trim(),
            category: 'General',
            keywords: '',
            isActive: true,
          });
        }
      }
    }
    return items;
  };

  const handleProcessFiles = async (filesList: FileList | File[]) => {
    const files = Array.from(filesList);
    setBulkFiles(prev => [...prev, ...files]);

    let accumulated: Partial<FaqItemDto>[] = [];
    for (const file of files) {
      try {
        const text = await file.text();
        const parsed = parseCsvText(text);
        accumulated = [...accumulated, ...parsed];
      } catch (err) {
        console.error('Error reading file:', file.name, err);
      }
    }
    setParsedFaqs(prev => [...prev, ...accumulated]);
  };

  const handleRemoveBulkFile = (index: number) => {
    setBulkFiles(prev => prev.filter((_, i) => i !== index));
    if (bulkFiles.length <= 1) {
      setParsedFaqs([]);
    }
  };

  const handleBulkSubmit = async () => {
    if (parsedFaqs.length === 0) return;

    setBulkUploading(true);
    const res = await createBatchFaqs(parsedFaqs);
    setBulkUploading(false);

    if (res.error) {
      setNotification({ type: 'error', msg: `Bulk upload error: ${res.error}` });
    } else {
      setNotification({ type: 'success', msg: `Successfully imported & indexed ${res.data?.length || parsedFaqs.length} FAQs!` });
      setShowBulkModal(false);
      setBulkFiles([]);
      setParsedFaqs([]);
      loadFaqs();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-base-c bg-card-c p-6 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-500/15 text-primary-500">
                <Zap className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-primary-c">High-Confidence FAQ Engine</h2>
              <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold">
                85% Threshold Fast Path
              </span>
            </div>
            <p className="text-xs text-muted-c">
              Pre-approved FAQ answers matching user queries with &ge;85% vector similarity respond instantly with zero LLM API cost & zero latency.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setBulkFiles([]);
                setParsedFaqs([]);
                setShowBulkModal(true);
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-base-c bg-card-c px-4 py-2.5 text-xs font-bold text-primary-c hover:bg-slate-100 dark:hover:bg-ink-850 shadow-sm transition-all"
            >
              <Upload className="h-4 w-4 text-sky-500" /> Bulk Upload FAQs
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-accent px-4 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-90 transition-all"
            >
              <Plus className="h-4 w-4" /> Add Single FAQ
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={cx(
          "flex items-center justify-between rounded-xl border p-4 text-xs font-medium transition-all",
          notification.type === 'success'
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "border-danger-500/30 bg-danger-500/10 text-danger-500"
        )}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            <span>{notification.msg}</span>
          </div>
          <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs, keywords, or answers..."
            className="w-full rounded-xl border border-base-c bg-card-c pl-9 pr-4 py-2 text-xs text-primary-c focus:border-primary-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-muted-c font-medium shrink-0">Category:</span>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={cx(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0",
              selectedCategory === 'ALL'
                ? "bg-primary-500 text-white shadow-sm"
                : "border border-base-c bg-card-c text-muted-c hover:text-primary-c"
            )}
          >
            All ({faqs.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cx(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0",
                selectedCategory === cat
                  ? "bg-primary-500 text-white shadow-sm"
                  : "border border-base-c bg-card-c text-muted-c hover:text-primary-c"
              )}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={loadFaqs}
            className="rounded-lg border border-base-c bg-card-c p-1.5 text-muted-c hover:text-primary-c transition-all shrink-0"
            title="Refresh FAQs"
          >
            <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* FAQ Data Table with 10-Row Pagination */}
      {loading ? (
        <div className="grid h-48 place-items-center rounded-2xl border border-base-c bg-card-c">
          <div className="flex items-center gap-2 text-xs text-muted-c">
            <Loader2 className="h-5 w-5 animate-spin text-primary-500" /> Loading FAQ Database...
          </div>
        </div>
      ) : filteredFaqs.length === 0 ? (
        <div className="grid h-48 place-items-center rounded-2xl border border-dashed border-base-c bg-card-c p-6 text-center">
          <div className="space-y-2">
            <HelpCircle className="mx-auto h-8 w-8 text-muted-c opacity-50" />
            <p className="text-sm font-semibold text-primary-c">No FAQs Found</p>
            <p className="text-xs text-muted-c max-w-sm mx-auto">
              {searchQuery ? "No FAQ matched your search query." : "Add or bulk upload FAQs to activate the high-confidence 85% fast-path."}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-base-c bg-card-c shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-base-c bg-slate-500/5 text-[11px] font-bold text-muted-c uppercase tracking-wider">
                  <th className="py-3 px-4 w-20">Status</th>
                  <th className="py-3 px-4 min-w-[220px]">Question</th>
                  <th className="py-3 px-4 min-w-[300px]">Answer</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Keywords</th>
                  <th className="py-3 px-4 text-center">Hits</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-c">
                {paginatedFaqs.map(faq => (
                  <tr
                    key={faq.id}
                    className={cx(
                      "hover:bg-slate-500/5 transition-colors",
                      !faq.isActive && "opacity-60 bg-slate-500/5"
                    )}
                  >
                    {/* Status Toggle */}
                    <td className="py-3.5 px-4 align-top">
                      <button
                        onClick={() => handleToggleActive(faq)}
                        className={cx(
                          "rounded-full px-2.5 py-1 text-[10px] font-bold cursor-pointer transition-all",
                          faq.isActive ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25" : "bg-slate-500/15 text-muted-c hover:bg-slate-500/25"
                        )}
                        title={faq.isActive ? "Click to deactivate" : "Click to activate"}
                      >
                        {faq.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Question */}
                    <td className="py-3.5 px-4 align-top font-bold text-primary-c">
                      {faq.question}
                    </td>

                    {/* Answer */}
                    <td className="py-3.5 px-4 align-top text-secondary-c max-w-sm">
                      <div className="line-clamp-3 whitespace-pre-line" title={faq.answer}>
                        {faq.answer}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 align-top">
                      <span className="inline-block rounded-full bg-primary-500/10 text-primary-500 px-2.5 py-0.5 text-[10px] font-bold">
                        {faq.category || 'General'}
                      </span>
                    </td>

                    {/* Keywords */}
                    <td className="py-3.5 px-4 align-top text-muted-c text-[11px] max-w-[140px] truncate" title={faq.keywords || ''}>
                      {faq.keywords ? faq.keywords : <span className="opacity-40">-</span>}
                    </td>

                    {/* Hits */}
                    <td className="py-3.5 px-4 align-top text-center font-bold text-primary-c">
                      {faq.hitCount || 0}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(faq)}
                          className="rounded-lg border border-base-c p-1.5 text-muted-c hover:text-primary-500 hover:bg-primary-500/10 transition-all"
                          title="Edit FAQ"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        {deleteConfirmId === faq.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => faq.id && handleDelete(faq.id)}
                              className="rounded-lg bg-danger-500 text-white px-2 py-1 text-[10px] font-bold hover:bg-danger-600 transition-all"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="rounded-lg border border-base-c p-1 text-muted-c hover:text-primary-c"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => faq.id && setDeleteConfirmId(faq.id)}
                            className="rounded-lg border border-base-c p-1.5 text-muted-c hover:text-danger-500 hover:bg-danger-500/10 transition-all"
                            title="Delete FAQ"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 10-Row Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-base-c px-4 py-3 bg-card-c text-xs text-muted-c">
            <div>
              Showing <strong className="text-primary-c">{((currentPage - 1) * itemsPerPage) + 1}</strong> to <strong className="text-primary-c">{Math.min(currentPage * itemsPerPage, filteredFaqs.length)}</strong> of <strong className="text-primary-c">{filteredFaqs.length}</strong> FAQs
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="flex items-center gap-1 rounded-lg border border-base-c px-3 py-1.5 text-xs font-semibold text-primary-c hover:bg-slate-100 dark:hover:bg-ink-850 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>

              <span className="px-2 font-medium text-xs">
                Page <strong className="text-primary-c">{currentPage}</strong> of <strong className="text-primary-c">{totalPages}</strong>
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="flex items-center gap-1 rounded-lg border border-base-c px-3 py-1.5 text-xs font-semibold text-primary-c hover:bg-slate-100 dark:hover:bg-ink-850 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE FAQ CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-base-c bg-card-c p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-base-c pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary-500" />
                <h3 className="text-base font-bold text-primary-c">
                  {editingFaq ? 'Edit FAQ Item' : 'Add New FAQ Item'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 text-muted-c hover:text-primary-c">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-primary-c">Question (Triggers 85% Similarity Match)</label>
                <input
                  type="text"
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="e.g. What are your store operating hours?"
                  className="w-full rounded-xl border border-base-c bg-card-c px-3 py-2 text-xs text-primary-c focus:border-primary-500 focus:outline-none mt-1"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-primary-c">Verified Direct Response Answer</label>
                <textarea
                  rows={4}
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  placeholder="Enter exact pre-approved response to return directly without LLM hallucination..."
                  className="w-full rounded-xl border border-base-c bg-card-c p-3 text-xs text-primary-c focus:border-primary-500 focus:outline-none mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-primary-c">Category</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Pricing, General, Returns"
                    className="w-full rounded-xl border border-base-c bg-card-c px-3 py-2 text-xs text-primary-c focus:border-primary-500 focus:outline-none mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-primary-c">Keywords (Optional)</label>
                  <input
                    type="text"
                    value={formKeywords}
                    onChange={(e) => setFormKeywords(e.target.value)}
                    placeholder="e.g. hours, open, time"
                    className="w-full rounded-xl border border-base-c bg-card-c px-3 py-2 text-xs text-primary-c focus:border-primary-500 focus:outline-none mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-base-c">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-base-c px-4 py-2 text-xs font-bold text-muted-c hover:text-primary-c"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-gradient-accent px-5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  {editingFaq ? 'Save Changes' : 'Create & Index Vector'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* BULK UPLOAD MODAL SCREEN WITH TWO CARDS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-base-c bg-card-c p-6 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-base-c pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/15 text-sky-500">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary-c">Bulk FAQ Import & Vector Ingestion</h3>
                  <p className="text-xs text-muted-c">Upload multiple CSV/Excel files to batch index FAQs into the vector database.</p>
                </div>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="rounded-lg p-1 text-muted-c hover:text-primary-c">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* TWO CARDS GRID */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* CARD 1: DOWNLOAD TEMPLATES */}
              <div className="rounded-2xl border border-base-c bg-slate-50/50 dark:bg-ink-850/40 p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-500">
                      <FileSpreadsheet className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-bold text-primary-c">Card 1: Download Templates</h4>
                  </div>
                  <p className="text-xs text-secondary-c leading-relaxed">
                    Download sample FAQ file templates containing pre-formatted headers (<code className="text-primary-500 font-mono">Question, Answer, Category, Keywords</code>).
                  </p>

                  <div className="rounded-xl border border-base-c bg-card-c p-3 text-[11px] font-mono space-y-1 text-muted-c">
                    <div className="font-bold text-primary-c">Supported Headers:</div>
                    <div>• Question (Required)</div>
                    <div>• Answer (Required)</div>
                    <div>• Category (Optional - default 'General')</div>
                    <div>• Keywords (Optional)</div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-base-c">
                  <button
                    onClick={() => downloadTemplate('csv')}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-base-c bg-card-c px-4 py-2.5 text-xs font-bold text-primary-c hover:border-primary-500/40 transition-all"
                  >
                    <Download className="h-4 w-4 text-emerald-500" /> Download CSV Format Template (.csv)
                  </button>
                  <button
                    onClick={() => downloadTemplate('excel')}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-base-c bg-card-c px-4 py-2.5 text-xs font-bold text-primary-c hover:border-primary-500/40 transition-all"
                  >
                    <Download className="h-4 w-4 text-sky-500" /> Download Excel Format Template (.txt/.csv)
                  </button>
                </div>
              </div>

              {/* CARD 2: DRAG & DROP MULTI-FILE UPLOAD */}
              <div className="rounded-2xl border border-base-c bg-slate-50/50 dark:bg-ink-850/40 p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-purple-500/15 text-purple-500">
                      <Layers className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-bold text-primary-c">Card 2: Multi-File Drag & Drop</h4>
                  </div>

                  {/* Dropzone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setBulkDragOver(true); }}
                    onDragLeave={() => setBulkDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setBulkDragOver(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleProcessFiles(e.dataTransfer.files);
                      }
                    }}
                    onClick={() => bulkFileInputRef.current?.click()}
                    className={cx(
                      "grid h-36 place-items-center rounded-2xl border-2 border-dashed p-4 text-center cursor-pointer transition-all",
                      bulkDragOver
                        ? "border-primary-500 bg-primary-500/10"
                        : "border-base-c bg-card-c hover:border-primary-500/50"
                    )}
                  >
                    <input
                      ref={bulkFileInputRef}
                      type="file"
                      multiple
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleProcessFiles(e.target.files);
                        }
                      }}
                    />

                    <div className="space-y-1">
                      <Upload className="mx-auto h-7 w-7 text-primary-500" />
                      <p className="text-xs font-bold text-primary-c">
                        Drag & Drop multiple files here, or <span className="text-primary-500 underline">Browse</span>
                      </p>
                      <p className="text-[10px] text-muted-c">Supports multiple .CSV files at once</p>
                    </div>
                  </div>

                  {/* File List & Parsed Summary */}
                  {bulkFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-primary-c">
                        <span>Selected Files ({bulkFiles.length})</span>
                        <span className="text-emerald-500">{parsedFaqs.length} FAQs Parsed</span>
                      </div>

                      <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                        {bulkFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-lg border border-base-c bg-card-c p-2 text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="h-4 w-4 text-primary-500 shrink-0" />
                              <span className="truncate font-medium text-primary-c">{file.name}</span>
                              <span className="text-[10px] text-muted-c">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveBulkFile(idx); }}
                              className="text-muted-c hover:text-danger-500 p-1"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleBulkSubmit}
                  disabled={parsedFaqs.length === 0 || bulkUploading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-accent px-5 py-3 text-xs font-bold text-white shadow-md hover:opacity-90 transition-all disabled:opacity-40"
                >
                  {bulkUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {bulkUploading ? 'Generating Embeddings...' : `Upload & Vector Index ${parsedFaqs.length} FAQs`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-base-c bg-card-c p-6 space-y-4 shadow-2xl text-center">
            <Trash2 className="mx-auto h-10 w-10 text-danger-500" />
            <h3 className="text-base font-bold text-primary-c">Delete FAQ Item</h3>
            <p className="text-xs text-muted-c">Are you sure you want to delete this FAQ item from the knowledge store?</p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-base-c px-4 py-2 text-xs font-bold text-muted-c"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="rounded-xl bg-danger-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-danger-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
