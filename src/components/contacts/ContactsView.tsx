import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Search, Loader2, AlertTriangle, Users, ChevronLeft, ChevronRight, Trash2, Plus, Filter, Download, MoreHorizontal, ArrowUpDown, Upload } from 'lucide-react';
import { fetchContacts, deleteContact, exportContacts, type ContactDTO } from '@/lib/contactsApi';
import { CreateContactModal } from './CreateContactModal';
import { ImportContactsModal } from './ImportContactsModal';

export function ContactsView() {
  const [contacts, setContacts] = useState<ContactDTO[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const loadContacts = useCallback(async () => {
    setLoading(true);
    const res = await fetchContacts();
    if (res.error) {
      setApiError(res.error);
    } else if (res.data) {
      setContacts(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const confirmDelete = async () => {
    if (!contactToDelete) return;
    
    setDeletingId(contactToDelete);
    const res = await deleteContact(contactToDelete);
    if (!res.error) {
      setContacts(prev => prev.filter(c => c.id !== contactToDelete));
      setSelectedContacts(prev => {
        const newSet = new Set(prev);
        newSet.delete(contactToDelete);
        return newSet;
      });
    } else {
      setApiError(res.error);
    }
    setDeletingId(null);
    setContactToDelete(null);
  };

  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [filterBotStatus, setFilterBotStatus] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = contacts;
    
    // Apply source filter
    if (filterSource !== 'ALL') {
      result = result.filter(c => (c.source || 'Manual').toUpperCase() === filterSource);
    }
    
    // Apply bot status filter
    if (filterBotStatus !== 'ALL') {
      const isPaused = filterBotStatus === 'PAUSED';
      result = result.filter(c => !!c.botPaused === isPaused);
    }

    // Apply search query
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(c => 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q))
      );
    }
    
    return result.reverse(); // Assuming insertion order, reverse for newest first
  }, [contacts, query, filterSource, filterBotStatus]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, filterSource, filterBotStatus]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedContacts(new Set(paginatedContacts.map(c => c.id)));
    } else {
      setSelectedContacts(new Set());
    }
  };

  const toggleSelect = (e: React.SyntheticEvent, id: string) => {
    e.stopPropagation();
    setSelectedContacts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const allSelected = paginatedContacts.length > 0 && selectedContacts.size === paginatedContacts.length;
  const isIndeterminate = selectedContacts.size > 0 && selectedContacts.size < paginatedContacts.length;

  const handleExport = async () => {
    setIsExporting(true);
    setApiError(null);
    const { error } = await exportContacts(query, filterSource, filterBotStatus);
    if (error) {
      setApiError(error);
    }
    setIsExporting(false);
  };

  return (
    <div className="w-full h-full animate-fade-in flex flex-col p-4 lg:p-6">
      {apiError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-danger-500/20 bg-danger-500/10 p-4 text-sm text-danger-600 dark:text-danger-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>Error loading contacts: {apiError}</span>
        </div>
      )}

      {/* Main Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col flex-1 overflow-hidden dark:border-ink-800 dark:bg-ink-950">
        
        {/* Unified Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 border-b border-slate-200 bg-white dark:border-ink-800 dark:bg-ink-950">
          <div className="relative w-full md:max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users by name, email, or phone…"
              className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-500 transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-ink-700 dark:bg-ink-900 dark:text-slate-100"
            />
          </div>
          
          <div className="flex w-full md:w-auto items-center gap-2 sm:gap-3 flex-wrap">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 sm:px-4 py-2 text-sm font-medium shadow-sm transition-colors btn-tactile ${
                showFilters || filterSource !== 'ALL' || filterBotStatus !== 'ALL'
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-ink-700 dark:bg-ink-900 dark:text-slate-300 dark:hover:bg-ink-800'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {(filterSource !== 'ALL' || filterBotStatus !== 'ALL') && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                  {(filterSource !== 'ALL' ? 1 : 0) + (filterBotStatus !== 'ALL' ? 1 : 0)}
                </span>
              )}
            </button>
            <button 
              onClick={handleExport}
              disabled={isExporting}
              title="Export Contacts CSV"
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 sm:px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-ink-700 dark:bg-ink-900 dark:text-slate-300 dark:hover:bg-ink-800 btn-tactile"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span className="hidden sm:inline">{isExporting ? 'Exporting…' : 'Export'}</span>
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              title="Import Contacts CSV"
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 sm:px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-ink-700 dark:bg-ink-900 dark:text-slate-300 dark:hover:bg-ink-800 btn-tactile"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 sm:px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 btn-tactile ml-auto md:ml-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add Contact</span>
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="border-b border-slate-200 bg-slate-50 p-5 dark:border-ink-800 dark:bg-ink-900/50">
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 max-w-4xl">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Source</label>
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-ink-700 dark:bg-ink-950 dark:text-slate-100"
                >
                  <option value="ALL">All Sources</option>
                  <option value="MANUAL">Manual</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="API">API</option>
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Bot Status</label>
                <select
                  value={filterBotStatus}
                  onChange={(e) => setFilterBotStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-ink-700 dark:bg-ink-950 dark:text-slate-100"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active (Bot Responds)</option>
                  <option value="PAUSED">Paused (Human Only)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto overflow-y-auto flex-1 bg-white dark:bg-ink-950 min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 dark:bg-ink-900">
              <tr className="border-b border-slate-200 dark:border-ink-800">
                <th className="px-6 py-3.5 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={input => {
                      if (input) input.indeterminate = isIndeterminate;
                    }}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-ink-600 dark:bg-ink-950"
                  />
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                    Contact <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Contact Info</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tags</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Source</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-ink-800">
              {loading && contacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-300 dark:text-slate-600" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-ink-900">
                      <Users className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">No contacts found</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedContacts.map(contact => {
                  const isActive = !contact.botPaused;
                  const isSelected = selectedContacts.has(contact.id);
                  
                  return (
                    <tr 
                      key={contact.id} 
                      onClick={() => navigate(`/contacts/${contact.id}`)}
                      className={`group cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-ink-900 ${isSelected ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                    >
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center h-full">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleSelect(e, contact.id)}
                            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-ink-600 dark:bg-ink-950"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm transition-transform group-hover:scale-105 ${isActive ? 'bg-indigo-600' : 'bg-slate-400 dark:bg-slate-600'}`}>
                            {contact.name ? contact.name.substring(0, 2).toUpperCase() : 'C'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-slate-900 truncate dark:text-slate-100">{contact.name || 'Unknown User'}</span>
                            <span className="text-xs text-slate-500 truncate dark:text-slate-400 mt-0.5">{contact.waId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col min-w-0">
                          {contact.email ? <span className="text-sm text-slate-700 truncate dark:text-slate-300">{contact.email}</span> : <span className="text-sm text-slate-400">-</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                          {contact.tags && contact.tags.length > 0 ? (
                            <>
                              {contact.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-ink-800 dark:text-slate-300 truncate">
                                  {tag}
                                </span>
                              ))}
                              {contact.tags.length > 2 && (
                                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-ink-800">
                                  +{contact.tags.length - 2}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-ink-800 dark:text-slate-300 uppercase">
                          {contact.source || 'Manual'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {contact.botPaused ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-ink-800 dark:text-slate-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                            Paused
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setContactToDelete(contact.id)}
                            disabled={deletingId === contact.id}
                            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors focus:bg-red-50 focus:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                            title="Delete User"
                          >
                            {deletingId === contact.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                          <button className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:bg-slate-100 dark:hover:bg-ink-800 dark:hover:text-slate-300">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3.5 dark:border-ink-800 dark:bg-ink-950">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Rows per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-md border-0 bg-transparent text-sm font-medium text-slate-900 focus:ring-0 dark:text-slate-100"
                  >
                    {[10, 25, 50, 100].map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <p className="text-sm text-slate-500">
                  Showing <span className="font-medium text-slate-900 dark:text-slate-100">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {Math.min(currentPage * itemsPerPage, filtered.length)}
                  </span>{' '}
                  of <span className="font-medium text-slate-900 dark:text-slate-100">{filtered.length}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 disabled:hover:bg-transparent dark:hover:bg-ink-800 dark:hover:text-slate-300 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center justify-center rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 disabled:hover:bg-transparent dark:hover:bg-ink-800 dark:hover:text-slate-300 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={contactToDelete !== null}
        title="Delete Contact"
        message="Are you sure you want to delete this contact? All associated data will be removed. This action cannot be undone."
        confirmText="Delete User"
        loading={deletingId !== null}
        onConfirm={confirmDelete}
        onCancel={() => setContactToDelete(null)}
      />

      {isCreateModalOpen && (
        <CreateContactModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            loadContacts();
          }}
        />
      )}

      {isImportModalOpen && (
        <ImportContactsModal
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            loadContacts();
          }}
        />
      )}
    </div>
  );
}
