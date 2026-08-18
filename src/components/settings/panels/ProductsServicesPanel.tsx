import { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag, Plus, Trash2, Edit3, Loader2,
  CheckCircle, AlertCircle, Search, Image as ImageIcon, X, Upload,
  FileText, Video, File, ExternalLink,
} from 'lucide-react';
import { PanelHeader, SectionCard } from './_shared';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  fetchBusinessServices, createBusinessService, updateBusinessService, deleteBusinessService,
  type BusinessServiceItem,
} from '@/lib/businessServicesApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function resolveMediaUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const base = API_BASE_URL.replace(/\/$/, '');
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function ProductsServicesPanel() {
  const [items, setItems] = useState<BusinessServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({ isOpen: false, id: '', name: '' });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BusinessServiceItem | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    const res = await fetchBusinessServices();
    setLoading(false);
    if (res.data) {
      setItems(res.data);
    } else if (res.error) {
      setError(`Failed to load items: ${res.error}`);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setDescription('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowModal(true);
  };

  const openEditModal = (item: BusinessServiceItem) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description || '');
    setSelectedFile(null);
    setPreviewUrl(item.imageUrl ? resolveMediaUrl(item.imageUrl) : null);
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setError('Media / Document file size must be less than 50 MB');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    let res;
    if (editingItem) {
      res = await updateBusinessService(editingItem.id, name.trim(), description.trim(), selectedFile || undefined);
    } else {
      res = await createBusinessService(name.trim(), description.trim(), selectedFile || undefined);
    }

    setSaving(false);
    if (!res.error) {
      if (res.data?.imageUrl) {
        console.log('✅ [Cloudinary Upload Success] Product/Service Media URL:', res.data.imageUrl);
      }
      setMessage(editingItem ? 'Product/Service updated successfully!' : 'New Product/Service added successfully!');
      setShowModal(false);
      loadServices();
      setTimeout(() => setMessage(null), 3000);
    } else {
      setError(`Save failed: ${res.error}`);
    }
  };

  const handleDelete = (id: string, itemName: string) => {
    setDeleteModalState({ isOpen: true, id, name: itemName });
  };

  const confirmDelete = async () => {
    const { id, name } = deleteModalState;
    setDeleteModalState({ isOpen: false, id: '', name: '' });
    if (!id) return;

    setMessage(null);
    setError(null);
    const res = await deleteBusinessService(id);
    if (!res.error) {
      setMessage(`"${name}" deleted.`);
      loadServices();
      setTimeout(() => setMessage(null), 3000);
    } else {
      setError(`Delete failed: ${res.error}`);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {message && (
        <div className="flex items-center gap-2 rounded-xl2 border border-success-500/20 bg-success-500/10 px-4 py-3 text-sm font-medium text-success-700 dark:text-success-400">
          <CheckCircle className="h-4 w-4 shrink-0" /> {message}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl2 border border-danger-500/20 bg-danger-500/10 px-4 py-3 text-sm font-medium text-danger-700 dark:text-danger-400">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <SectionCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <PanelHeader
            title="Products & Services Catalog"
            desc="Manage the offerings, prices, and catalog items displayed to leads in chat flows."
            icon={<ShoppingBag className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
          />
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-xl2 bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all shrink-0"
          >
            <Plus className="h-4 w-4" /> Add Product / Service
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-c" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products & services by name or description…"
            className="form-input pl-9"
          />
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            <span className="ml-2 text-sm text-secondary-c">Loading catalog from backend…</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-xl2 border border-dashed border-base-c p-10 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-c mb-2 opacity-50" />
            <p className="text-sm font-medium text-primary-c">
              {searchQuery ? 'No matching products found.' : 'No products or services in catalog yet.'}
            </p>
            <p className="text-xs text-muted-c mt-1">
              Click the button above to add your first product or service item!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl2 border border-base-c bg-card-c p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  {item.imageUrl ? (
                    item.imageUrl.match(/\.(mp4|webm|mov|avi|3gp)($|\?)/i) ? (
                      <div className="grid h-16 w-16 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                        <Video className="h-7 w-7" />
                      </div>
                    ) : item.imageUrl.match(/\.(pdf|doc|docx|xls|xlsx|txt)($|\?)/i) ? (
                      <div className="grid h-16 w-16 place-items-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 border border-amber-500/20 shrink-0">
                        <FileText className="h-7 w-7" />
                      </div>
                    ) : (
                      <img
                        src={resolveMediaUrl(item.imageUrl)}
                        alt={item.name}
                        className="h-16 w-16 rounded-lg object-cover border border-base-c shrink-0"
                      />
                    )
                  ) : (
                    <div className="grid h-16 w-16 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                      <ShoppingBag className="h-7 w-7" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-primary-c truncate">{item.name}</h4>
                    <p className="text-xs text-secondary-c line-clamp-2 mt-1">
                      {item.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-base-c pt-3">
                  <span className="text-[10px] text-muted-c">
                    Updated {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'recently'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="flex items-center gap-1 rounded-lg border border-base-c px-2.5 py-1 text-xs font-medium text-secondary-c hover:text-primary-c"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-danger-500 hover:bg-danger-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-base-c bg-card-c p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary-c">
                {editingItem ? 'Edit Product / Service' : 'Add Product / Service'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted-c hover:text-primary-c">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-secondary-c">Title / Name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 3BHK Apartment or Consultation Call"
                  required
                  className="form-input"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-secondary-c">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details, pricing information, specifications..."
                  rows={3}
                  className="form-input resize-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-secondary-c">Media / Document Attachment (Image, Video, PDF, Docs - Max 50MB)</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer flex flex-col items-center justify-center rounded-xl2 border border-dashed border-base-c bg-slate-50 p-4 text-center hover:border-emerald-500/40 dark:bg-ink-850"
                >
                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-1.5">
                      {selectedFile.type.startsWith('image/') ? (
                        <img src={previewUrl || ''} alt="Preview" className="h-20 w-20 rounded-lg object-cover border border-base-c" />
                      ) : selectedFile.type.startsWith('video/') ? (
                        <div className="grid h-16 w-16 place-items-center rounded-xl bg-indigo-500/10 text-indigo-500">
                          <Video className="h-8 w-8" />
                        </div>
                      ) : (
                        <div className="grid h-16 w-16 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
                          <FileText className="h-8 w-8" />
                        </div>
                      )}
                      <p className="text-xs font-bold text-primary-c">{selectedFile.name}</p>
                      <p className="text-[10px] text-muted-c">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Click to change</p>
                    </div>
                  ) : previewUrl ? (
                    <div className="relative group flex flex-col items-center gap-1">
                      {previewUrl.match(/\.(mp4|webm|mov|avi|3gp)($|\?)/i) ? (
                        <div className="grid h-16 w-16 place-items-center rounded-xl bg-indigo-500/10 text-indigo-500">
                          <Video className="h-8 w-8" />
                        </div>
                      ) : previewUrl.match(/\.(pdf|doc|docx|xls|xlsx|txt)($|\?)/i) ? (
                        <div className="grid h-16 w-16 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
                          <FileText className="h-8 w-8" />
                        </div>
                      ) : (
                        <img src={previewUrl} alt="Preview" className="h-20 w-20 rounded-lg object-cover border border-base-c" />
                      )}
                      <p className="text-[11px] text-secondary-c truncate max-w-xs">{previewUrl}</p>
                      <p className="text-[10px] text-primary-600 font-medium">Click to replace file</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1.5 text-muted-c">
                        <ImageIcon className="h-6 w-6" />
                        <Video className="h-6 w-6" />
                        <FileText className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-semibold text-primary-c">Click to upload Image, Video, or Document</p>
                      <p className="text-[10px] text-muted-c">Supports JPG, PNG, WebP, MP4, PDF, DOCX up to 50MB</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-base-c px-4 py-2 text-xs font-medium text-secondary-c hover:text-primary-c"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        title="Delete Product / Service"
        message={`Are you sure you want to delete "${deleteModalState.name}"? This action cannot be undone.`}
        confirmText="Delete Item"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalState({ isOpen: false, id: '', name: '' })}
      />
    </div>
  );
}
