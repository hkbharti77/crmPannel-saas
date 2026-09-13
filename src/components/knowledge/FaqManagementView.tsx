import { useState, useEffect, useRef, useMemo } from 'react';
import { cx } from '@/lib/types';
import {
  HelpCircle, Plus, Search, Trash2, Edit3, CheckCircle,
  AlertCircle, Sparkles, RefreshCw, Zap, Loader2, X,
  Upload, FileText, Download, FileSpreadsheet, Layers, Check,
  ChevronLeft, ChevronRight, AlertTriangle, MessageSquare,
  BarChart3, CheckCircle2, ArrowUpRight
} from 'lucide-react';
import {
  fetchFaqs, createFaq, updateFaq, deleteFaq, createBatchFaqs,
  deleteAllFaqs, batchDeleteFaqs, type FaqItemDto
} from '@/lib/faqApi';

export function FaqManagementView() {
  const [faqs, setFaqs] = useState<FaqItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Multi-Select & Bulk Delete State
  const [selectedFaqIds, setSelectedFaqIds] = useState<string[]>([]);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);

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

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const categories = useMemo(() => {
    return Array.from(new Set(['General', ...faqs.map(f => f.category || 'General')]));
  }, [faqs]);

  // Analytics Metrics
  const faqStats = useMemo(() => {
    const activeCount = faqs.filter(f => f.isActive !== false).length;
    const totalHits = faqs.reduce((acc, f) => acc + (f.hitCount || 0), 0);
    const highHitCount = faqs.filter(f => (f.hitCount || 0) > 5).length;
    return { activeCount, totalHits, highHitCount, totalCategories: categories.length };
  }, [faqs, categories]);

  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => {
      const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (faq.keywords && faq.keywords.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCat = selectedCategory === 'ALL' || (faq.category || 'General') === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [faqs, searchQuery, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredFaqs.length / itemsPerPage));
  const paginatedFaqs = useMemo(() => {
    return filteredFaqs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredFaqs, currentPage, itemsPerPage]);

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
      setSelectedFaqIds(prev => prev.filter(i => i !== id));
    } else {
      setNotification({ type: 'error', msg: res.error });
    }
  };

  // Multi-Selection Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedFaqIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllPage = () => {
    const pageIds = paginatedFaqs.map(f => f.id!).filter(Boolean);
    const allSelected = pageIds.length > 0 && pageIds.every(id => selectedFaqIds.includes(id));
    if (allSelected) {
      setSelectedFaqIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedFaqIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredFaqs.map(f => f.id!).filter(Boolean);
    setSelectedFaqIds(allFilteredIds);
  };

  const handleClearSelection = () => {
    setSelectedFaqIds([]);
  };

  const handleBatchDeleteSubmit = async () => {
    if (selectedFaqIds.length === 0) return;
    setBatchDeleting(true);
    const res = await batchDeleteFaqs(selectedFaqIds);
    setBatchDeleting(false);
    setShowBatchDeleteModal(false);

    if (res.data?.success) {
      setNotification({ type: 'success', msg: `Successfully deleted ${res.data.deletedCount} FAQ items!` });
      setFaqs(prev => prev.filter(f => f.id && !selectedFaqIds.includes(f.id)));
      setSelectedFaqIds([]);
    } else {
      setNotification({ type: 'error', msg: res.error || 'Failed to delete selected FAQs.' });
    }
  };

  const handleDeleteAllSubmit = async () => {
    setDeletingAll(true);
    const res = await deleteAllFaqs();
    setDeletingAll(false);
    setShowDeleteAllModal(false);

    if (res.data?.success) {
      setNotification({ type: 'success', msg: `All ${res.data.deletedCount} FAQs have been permanently deleted!` });
      setFaqs([]);
      setSelectedFaqIds([]);
    } else {
      setNotification({ type: 'error', msg: res.error || 'Failed to delete all FAQs.' });
    }
  };

  // Bulk Upload Templates & Processors
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
      } catch (_e) {
        // Fallback to CSV
      }
    }

    const lines = raw.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return [];

    const items: Partial<FaqItemDto>[] = [];
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
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-2xl border border-base-c/80 bg-card-c p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-soft">
                <Zap className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-primary-c">Verified High-Confidence FAQ Engine</h2>
              <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold">
                85% Match Fast Path
              </span>
            </div>
            <p className="text-xs text-muted-c max-w-2xl leading-relaxed">
              Pre-approved answers matching customer queries with &ge;85% vector similarity respond instantly with zero LLM API cost &amp; zero latency.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {faqs.length > 0 && (
              <button
                onClick={() => setShowDeleteAllModal(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all shrink-0"
                title="Delete all FAQs permanently"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete All ({faqs.length})
              </button>
            )}
            <button
              onClick={() => {
                setBulkFiles([]);
                setParsedFaqs([]);
                setShowBulkModal(true);
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-base-c/80 bg-card-c px-3.5 py-2 text-xs font-bold text-primary-c hover:bg-slate-100 dark:hover:bg-ink-800 transition-all shrink-0"
            >
              <Upload className="h-3.5 w-3.5 text-indigo-500" /> Bulk Import FAQs
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-soft transition-all shrink-0"
            >
              <Plus className="h-4 w-4" /> Add Single FAQ
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={cx(
          "flex items-center justify-between rounded-xl border p-4 text-xs font-semibold transition-all",
          notification.type === 'success'
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
        )}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            <span>{notification.msg}</span>
          </div>
          <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Controls & Category Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions, answers or keywords..."
            className="w-full rounded-xl border border-base-c/80 bg-card-c pl-10 pr-4 py-2 text-xs sm:text-sm text-primary-c placeholder:text-muted-c focus:border-emerald-500 focus:outline-none transition-all shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs text-muted-c font-semibold shrink-0">Category:</span>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={cx(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0 btn-tactile",
              selectedCategory === 'ALL'
                ? "bg-emerald-600 text-white shadow-soft font-bold"
                : "border border-base-c/80 bg-card-c text-secondary-c hover:text-primary-c"
            )}
          >
            All ({faqs.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cx(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0 btn-tactile",
                selectedCategory === cat
                  ? "bg-emerald-600 text-white shadow-soft font-bold"
                  : "border border-base-c/80 bg-card-c text-secondary-c hover:text-primary-c"
              )}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={loadFaqs}
            className="rounded-lg border border-base-c/80 bg-card-c p-2 text-muted-c hover:text-primary-c transition-all shrink-0"
            title="Refresh FAQs"
          >
            <RefreshCw className={cx("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Dynamic Multi-Selection Floating Action Bar */}
      {selectedFaqIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-primary-c shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="flex h-6 items-center rounded-full bg-emerald-600 px-3 text-[11px] font-bold text-white shadow-xs">
              {selectedFaqIds.length} Selected
            </span>
            <span className="text-secondary-c">
              Selected <strong>{selectedFaqIds.length}</strong> of <strong>{filteredFaqs.length}</strong> FAQs
            </span>
          </div>

          <div className="flex items-center gap-2">
            {selectedFaqIds.length < filteredFaqs.length && (
              <button
                onClick={handleSelectAllFiltered}
                className="rounded-xl border border-emerald-500/30 bg-card-c px-3 py-1.5 font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all text-xs"
              >
                Select All {filteredFaqs.length} Filtered
              </button>
            )}
            <button
              onClick={handleClearSelection}
              className="rounded-xl border border-base-c/80 bg-card-c px-3 py-1.5 font-bold text-muted-c hover:text-primary-c transition-all text-xs"
            >
              Clear Selection
            </button>
            <button
              onClick={() => setShowBatchDeleteModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-rose-700 transition-all text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Selected ({selectedFaqIds.length})
            </button>
          </div>
        </div>
      )}

      {/* FAQ Data Table with 10-Row Pagination */}
      {loading ? (
        <div className="grid h-56 place-items-center rounded-2xl border border-base-c/80 bg-card-c">
          <div className="flex items-center gap-2 text-xs text-muted-c">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" /> Loading FAQ Database...
          </div>
        </div>
      ) : filteredFaqs.length === 0 ? (
        <div className="grid h-56 place-items-center rounded-2xl border border-dashed border-base-c/80 bg-card-c p-6 text-center">
          <div className="space-y-2">
            <HelpCircle className="mx-auto h-10 w-10 text-muted-c opacity-40" />
            <p className="text-base font-bold text-primary-c">No FAQs Found</p>
            <p className="text-xs text-muted-c max-w-sm mx-auto">
              {searchQuery ? "No FAQ matched your search query." : "Add or bulk upload FAQs to activate the high-confidence 85% fast-path."}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-base-c/80 bg-card-c shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-base-c/80 bg-slate-100/60 dark:bg-ink-950/50 text-[11px] font-bold text-muted-c uppercase tracking-wider">
                  <th className="py-3.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={paginatedFaqs.length > 0 && paginatedFaqs.every(f => f.id && selectedFaqIds.includes(f.id))}
                      onChange={handleSelectAllPage}
                      className="rounded border-base-c text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer align-middle"
                      title="Select all on current page"
                    />
                  </th>
                  <th className="py-3.5 px-4 w-24">Status</th>
                  <th className="py-3.5 px-4 min-w-[240px]">Question (Vector Trigger)</th>
                  <th className="py-3.5 px-4 min-w-[320px]">Direct Response Answer</th>
                  <th className="py-3.5 px-4 w-28">Category</th>
                  <th className="py-3.5 px-4 w-32">Keywords</th>
                  <th className="py-3.5 px-4 text-center w-16">Hits</th>
                  <th className="py-3.5 px-4 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-c/70">
                {paginatedFaqs.map(faq => {
                  const isSelected = !!(faq.id && selectedFaqIds.includes(faq.id));
                  return (
                    <tr
                      key={faq.id}
                      className={cx(
                        "hover:bg-slate-100/50 dark:hover:bg-ink-850/40 transition-colors",
                        isSelected && "bg-emerald-500/10 dark:bg-emerald-500/15",
                        !faq.isActive && "opacity-60 bg-slate-500/5"
                      )}
                    >
                      {/* Checkbox Column */}
                      <td className="py-3.5 px-3 text-center align-top">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => faq.id && handleToggleSelect(faq.id)}
                          className="rounded border-base-c text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer align-middle"
                        />
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4 align-top">
                        <button
                          onClick={() => handleToggleActive(faq)}
                          className={cx(
                            "rounded-full px-2.5 py-1 text-[10px] font-bold cursor-pointer transition-all border",
                            faq.isActive
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                              : "bg-slate-500/15 text-muted-c border-slate-500/30 hover:bg-slate-500/25"
                          )}
                          title={faq.isActive ? "Click to deactivate" : "Click to activate"}
                        >
                          {faq.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Question */}
                      <td className="py-3.5 px-4 align-top font-bold text-primary-c">
                        <div className="flex items-start gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{faq.question}</span>
                        </div>
                      </td>

                      {/* Answer */}
                      <td className="py-3.5 px-4 align-top text-secondary-c max-w-md">
                        <div className="line-clamp-3 whitespace-pre-line leading-relaxed text-xs" title={faq.answer}>
                          {faq.answer}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 align-top">
                        <span className="inline-block rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 text-[10px] font-bold">
                          {faq.category || 'General'}
                        </span>
                      </td>

                      {/* Keywords */}
                      <td className="py-3.5 px-4 align-top text-muted-c text-[11px] max-w-[140px] truncate" title={faq.keywords || ''}>
                        {faq.keywords ? (
                          <span className="font-mono text-[10px] text-muted-c">{faq.keywords}</span>
                        ) : (
                          <span className="opacity-40">-</span>
                        )}
                      </td>

                      {/* Hits */}
                      <td className="py-3.5 px-4 align-top text-center">
                        <span className="inline-flex items-center justify-center rounded-full bg-slate-100 dark:bg-ink-800 px-2 py-0.5 text-[11px] font-bold text-primary-c tabular-nums">
                          {faq.hitCount || 0}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(faq)}
                            className="rounded-lg border border-base-c/80 p-1.5 text-muted-c hover:text-emerald-600 hover:bg-emerald-500/10 transition-all"
                            title="Edit FAQ"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          {deleteConfirmId === faq.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => faq.id && handleDelete(faq.id)}
                                className="rounded-lg bg-rose-600 text-white px-2 py-1 text-[10px] font-bold hover:bg-rose-700 transition-all"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="rounded-lg border border-base-c/80 p-1 text-muted-c hover:text-primary-c"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => faq.id && setDeleteConfirmId(faq.id)}
                              className="rounded-lg border border-base-c/80 p-1.5 text-muted-c hover:text-rose-600 hover:bg-rose-500/10 transition-all"
                              title="Delete FAQ"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 10-Row Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-base-c/80 px-4 py-3 bg-card-c text-xs text-muted-c">
            <div>
              Showing <strong className="text-primary-c">{((currentPage - 1) * itemsPerPage) + 1}</strong> to <strong className="text-primary-c">{Math.min(currentPage * itemsPerPage, filteredFaqs.length)}</strong> of <strong className="text-primary-c">{filteredFaqs.length}</strong> FAQs
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="flex items-center gap-1 rounded-lg border border-base-c/80 bg-card-c px-3 py-1.5 text-xs font-semibold text-primary-c hover:bg-slate-100 dark:hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>

              <span className="px-2 font-medium text-xs">
                Page <strong className="text-primary-c">{currentPage}</strong> of <strong className="text-primary-c">{totalPages}</strong>
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="flex items-center gap-1 rounded-lg border border-base-c/80 bg-card-c px-3 py-1.5 text-xs font-semibold text-primary-c hover:bg-slate-100 dark:hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
          <div className="w-full max-w-lg rounded-2xl border border-base-c/80 bg-card-c p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-base-c/80 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-500" />
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
                <label className="font-bold text-primary-c">Question (Triggers 85% Vector Match)</label>
                <input
                  type="text"
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="e.g. What are your store operating hours?"
                  className="w-full rounded-xl border border-base-c/80 bg-card-c px-3 py-2 text-xs text-primary-c focus:border-emerald-500 focus:outline-none mt-1"
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
                  className="w-full rounded-xl border border-base-c/80 bg-card-c p-3 text-xs text-primary-c focus:border-emerald-500 focus:outline-none mt-1"
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
                    className="w-full rounded-xl border border-base-c/80 bg-card-c px-3 py-2 text-xs text-primary-c focus:border-emerald-500 focus:outline-none mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-primary-c">Keywords (Optional)</label>
                  <input
                    type="text"
                    value={formKeywords}
                    onChange={(e) => setFormKeywords(e.target.value)}
                    placeholder="e.g. hours, open, time"
                    className="w-full rounded-xl border border-base-c/80 bg-card-c px-3 py-2 text-xs text-primary-c focus:border-emerald-500 focus:outline-none mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-base-c/80">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-base-c/80 px-4 py-2 text-xs font-bold text-muted-c hover:text-primary-c"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-soft transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  {editingFaq ? 'Save Changes' : 'Create & Index Vector'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK UPLOAD MODAL SCREEN */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-base-c/80 bg-card-c p-6 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-base-c/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary-c">Bulk FAQ Import &amp; Vector Ingestion</h3>
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
              <div className="rounded-2xl border border-base-c/80 bg-slate-50/50 dark:bg-ink-900/40 p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <FileSpreadsheet className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-bold text-primary-c">1. Download Templates</h4>
                  </div>
                  <p className="text-xs text-muted-c leading-relaxed">
                    Download sample FAQ file templates containing pre-formatted headers (<code className="text-emerald-600 dark:text-emerald-400 font-mono">Question, Answer, Category, Keywords</code>).
                  </p>

                  <div className="rounded-xl border border-base-c/80 bg-card-c p-3 text-[11px] font-mono space-y-1 text-muted-c">
                    <div className="font-bold text-primary-c">Supported Headers:</div>
                    <div>• Question (Required)</div>
                    <div>• Answer (Required)</div>
                    <div>• Category (Optional - default 'General')</div>
                    <div>• Keywords (Optional)</div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-base-c/80">
                  <button
                    onClick={() => downloadTemplate('csv')}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-base-c/80 bg-card-c px-4 py-2.5 text-xs font-bold text-primary-c hover:border-emerald-500/40 transition-all"
                  >
                    <Download className="h-4 w-4 text-emerald-500" /> Download CSV Format Template (.csv)
                  </button>
                  <button
                    onClick={() => downloadTemplate('excel')}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-base-c/80 bg-card-c px-4 py-2.5 text-xs font-bold text-primary-c hover:border-indigo-500/40 transition-all"
                  >
                    <Download className="h-4 w-4 text-indigo-500" /> Download Excel Format Template (.txt/.csv)
                  </button>
                </div>
              </div>

              {/* CARD 2: DRAG & DROP MULTI-FILE UPLOAD */}
              <div className="rounded-2xl border border-base-c/80 bg-slate-50/50 dark:bg-ink-900/40 p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400">
                      <Layers className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-bold text-primary-c">2. Multi-File Drag &amp; Drop</h4>
                  </div>

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
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-base-c/80 bg-card-c hover:border-emerald-500/50"
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
                      <Upload className="mx-auto h-7 w-7 text-emerald-500" />
                      <p className="text-xs font-bold text-primary-c">
                        Drag &amp; Drop multiple files here, or <span className="text-emerald-600 dark:text-emerald-400 underline">Browse</span>
                      </p>
                      <p className="text-[10px] text-muted-c">Supports multiple .CSV files at once</p>
                    </div>
                  </div>

                  {bulkFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-primary-c">
                        <span>Selected Files ({bulkFiles.length})</span>
                        <span className="text-emerald-500">{parsedFaqs.length} FAQs Parsed</span>
                      </div>

                      <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                        {bulkFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-lg border border-base-c/80 bg-card-c p-2 text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                              <span className="truncate font-medium text-primary-c">{file.name}</span>
                              <span className="text-[10px] text-muted-c">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveBulkFile(idx); }}
                              className="text-muted-c hover:text-rose-500 p-1"
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
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-3 text-xs font-bold text-white shadow-soft transition-all disabled:opacity-40"
                >
                  {bulkUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {bulkUploading ? 'Generating Embeddings...' : `Upload & Vector Index ${parsedFaqs.length} FAQs`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE FAQ DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-base-c/80 bg-card-c p-6 space-y-4 shadow-2xl text-center">
            <Trash2 className="mx-auto h-10 w-10 text-rose-500" />
            <h3 className="text-base font-bold text-primary-c">Delete FAQ Item</h3>
            <p className="text-xs text-muted-c">Are you sure you want to delete this FAQ item from the knowledge store?</p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-base-c/80 px-4 py-2 text-xs font-bold text-muted-c hover:text-primary-c"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH DELETE CONFIRMATION MODAL */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-base-c/80 bg-card-c p-6 space-y-4 shadow-2xl text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-primary-c">Delete Selected FAQs?</h3>
            <p className="text-xs text-muted-c">
              Are you sure you want to permanently delete <strong>{selectedFaqIds.length}</strong> selected FAQ items from your knowledge base?
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBatchDeleteModal(false)}
                disabled={batchDeleting}
                className="rounded-xl border border-base-c/80 px-4 py-2 text-xs font-bold text-muted-c hover:text-primary-c"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBatchDeleteSubmit}
                disabled={batchDeleting}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50"
              >
                {batchDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {batchDeleting ? 'Deleting...' : `Delete ${selectedFaqIds.length} FAQs`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ALL CONFIRMATION MODAL */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-base-c/80 bg-card-c p-6 space-y-4 shadow-2xl text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 mx-auto">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-primary-c">Delete Entire FAQ Database?</h3>
            <p className="text-xs text-muted-c leading-relaxed">
              ⚠️ This will permanently remove all <strong className="text-primary-c">{faqs.length} FAQ items</strong> and their vector embeddings from your workspace. This action <strong className="text-rose-500">cannot be undone</strong>.
            </p>
            <div className="flex justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                disabled={deletingAll}
                className="rounded-xl border border-base-c/80 px-5 py-2.5 text-xs font-bold text-muted-c hover:text-primary-c"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAllSubmit}
                disabled={deletingAll}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-soft hover:bg-rose-700 disabled:opacity-50"
              >
                {deletingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {deletingAll ? 'Deleting All FAQs...' : `Yes, Delete All ${faqs.length} FAQs`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
