import { useState, useEffect, useMemo, useRef } from 'react';
import { GlassCard } from '@/components/ui/primitives';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { cx } from '@/lib/types';
import {
  fetchBusinessServices,
  createBusinessService,
  updateBusinessService,
  deleteBusinessService,
  type BusinessServiceItem,
} from '@/lib/businessServicesApi';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Edit3,
  Search,
  Image as ImageIcon,
  Video,
  FileText,
  Upload,
  X,
  ExternalLink,
  SlidersHorizontal,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function resolveMediaUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const base = API_BASE_URL.replace(/\/$/, '');
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function isVideoUrl(url?: string): boolean {
  if (!url) return false;
  return /\.(mp4|webm|mov|avi|3gp)($|\?)/i.test(url);
}

export function isDocUrl(url?: string): boolean {
  if (!url) return false;
  return /\.(pdf|doc|docx|xls|xlsx|txt)($|\?)/i.test(url);
}

type MediaTypeFilter = 'ALL' | 'IMAGE' | 'VIDEO' | 'DOC' | 'TEXT_ONLY';

export function PropertiesView() {
  const [items, setItems] = useState<BusinessServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [mediaFilter, setMediaFilter] = useState<MediaTypeFilter>('ALL');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BusinessServiceItem | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({ isOpen: false, id: '', name: '' });

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    const res = await fetchBusinessServices();
    setLoading(false);
    if (res.data) {
      setItems(res.data);
    } else if (res.error) {
      setError(`Failed to load catalog items: ${res.error}`);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = query.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.id && item.id.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (mediaFilter === 'ALL') return true;
      if (mediaFilter === 'VIDEO') return isVideoUrl(item.imageUrl);
      if (mediaFilter === 'DOC') return isDocUrl(item.imageUrl);
      if (mediaFilter === 'IMAGE') return item.imageUrl && !isVideoUrl(item.imageUrl) && !isDocUrl(item.imageUrl);
      if (mediaFilter === 'TEXT_ONLY') return !item.imageUrl;

      return true;
    });
  }, [items, query, mediaFilter]);

  const stats = useMemo(() => {
    const total = items.length;
    const images = items.filter((i) => i.imageUrl && !isVideoUrl(i.imageUrl) && !isDocUrl(i.imageUrl)).length;
    const videos = items.filter((i) => isVideoUrl(i.imageUrl)).length;
    const docs = items.filter((i) => isDocUrl(i.imageUrl)).length;
    return { total, images, videos, docs };
  }, [items]);

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
    setName(item.name || '');
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
    if (res.data) {
      setMessage(`Successfully ${editingItem ? 'updated' : 'added'} "${name}"`);
      setShowModal(false);
      loadItems();
      setTimeout(() => setMessage(null), 4000);
    } else {
      setError(res.error || 'Failed to save item');
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    const res = await deleteBusinessService(id);
    setSaving(false);
    if (!res.error) {
      setMessage('Item removed successfully');
      loadItems();
      setTimeout(() => setMessage(null), 3000);
    } else {
      setError(`Failed to delete: ${res.error}`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-primary-c">Products & Services Catalog</h2>
            <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">
              Web & WhatsApp Sync
            </span>
          </div>
          <p className="mt-0.5 text-sm text-secondary-c">
            Manage your inventory, property listings, services, and media assets for AI Chat Widget and WhatsApp bot.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadItems}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-base-c bg-card-c px-3 py-2 text-xs font-medium text-secondary-c transition-colors hover:bg-surface-subtle hover:text-primary-c disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={cx('h-3.5 w-3.5', loading && 'animate-spin')} /> Refresh
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3.5 py-2 text-xs font-semibold text-white shadow-soft transition-transform hover:scale-105"
          >
            <Plus className="h-4 w-4" /> Add Product / Service
          </button>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300 animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Catalog Items" value={stats.total} icon={ShoppingBag} accent="text-primary-600 dark:text-primary-400" />
        <StatCard label="Images & Graphics" value={stats.images} icon={ImageIcon} accent="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Video Previews" value={stats.videos} icon={Video} accent="text-amber-600 dark:text-amber-400" />
        <StatCard label="Attached Documents" value={stats.docs} icon={FileText} accent="text-cyan-600 dark:text-cyan-400" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, services, properties by name or description…"
            className="w-full rounded-xl border border-base-c bg-card-c py-2.5 pl-10 pr-4 text-sm text-primary-c placeholder:text-muted-c transition-colors focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-c" />
          <select
            value={mediaFilter}
            onChange={(e) => setMediaFilter(e.target.value as MediaTypeFilter)}
            className="rounded-lg border border-base-c bg-card-c px-2.5 py-2 text-xs text-secondary-c focus:border-primary-500/40 focus:outline-none"
          >
            <option value="ALL">All Media Types ({items.length})</option>
            <option value="IMAGE">Images ({stats.images})</option>
            <option value="VIDEO">Videos ({stats.videos})</option>
            <option value="DOC">Documents ({stats.docs})</option>
            <option value="TEXT_ONLY">Text Only</option>
          </select>
        </div>

        <div className="flex rounded-lg border border-base-c p-0.5">
          {(['grid', 'list'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setLayout(m)}
              className={cx(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                layout === m ? 'bg-gradient-accent text-white shadow-soft' : 'text-secondary-c hover:text-primary-c',
              )}
            >
              {m === 'grid' ? 'Grid' : 'List'}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          <p className="mt-3 text-sm text-muted-c">Loading catalog items…</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary-500/10 text-primary-500">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-base font-bold text-primary-c">No Catalog Items Found</h3>
          <p className="mt-1 max-w-md text-xs text-secondary-c">
            {query || mediaFilter !== 'ALL'
              ? 'No products or services match your active search filters.'
              : 'Add your first product, service, or property to showcase in the website chat widget and WhatsApp bot.'}
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 flex items-center gap-1.5 rounded-lg bg-gradient-accent px-4 py-2 text-xs font-semibold text-white shadow-soft transition-transform hover:scale-105"
          >
            <Plus className="h-4 w-4" /> Add First Item
          </button>
        </GlassCard>
      ) : layout === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <CatalogGridCard
              key={item.id}
              item={item}
              onEdit={() => openEditModal(item)}
              onDelete={() => setDeleteModalState({ isOpen: true, id: item.id, name: item.name })}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <CatalogListRow
              key={item.id}
              item={item}
              onEdit={() => openEditModal(item)}
              onDelete={() => setDeleteModalState({ isOpen: true, id: item.id, name: item.name })}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-base-c bg-card-c p-6 shadow-xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-base-c pb-4">
              <div>
                <h3 className="text-lg font-bold text-primary-c">
                  {editingItem ? 'Edit Product / Service' : 'Add New Product or Service'}
                </h3>
                <p className="text-xs text-secondary-c">
                  This item will appear in your website chat widget and WhatsApp catalog flow.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-muted-c transition-colors hover:bg-surface-subtle hover:text-primary-c"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-primary-c">Name / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Calling Agent Services, 3BHK Luxury Villa, SEO Growth Plan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-base-c bg-surface-subtle px-3.5 py-2.5 text-sm text-primary-c placeholder:text-muted-c focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-c">Description / Details</label>
                <textarea
                  rows={3}
                  placeholder="Provide features, specifications, pricing details, or deliverables…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-base-c bg-surface-subtle px-3.5 py-2.5 text-sm text-primary-c placeholder:text-muted-c focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-c">Media Asset (Image, Video, or Document)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-base-c bg-surface-subtle/50 p-4 transition-colors hover:border-primary-500/50 hover:bg-surface-subtle"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                    className="hidden"
                  />
                  {previewUrl ? (
                    <div className="relative flex flex-col items-center gap-2">
                      {isVideoUrl(previewUrl) || selectedFile?.type.startsWith('video/') ? (
                        <div className="flex items-center gap-2 text-xs font-semibold text-primary-600">
                          <Video className="h-6 w-6" /> Video File Selected
                        </div>
                      ) : isDocUrl(previewUrl) || selectedFile?.type.includes('pdf') ? (
                        <div className="flex items-center gap-2 text-xs font-semibold text-primary-600">
                          <FileText className="h-6 w-6" /> Document File Selected
                        </div>
                      ) : (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="h-32 w-48 rounded-lg object-cover shadow-sm"
                        />
                      )}
                      <span className="text-[11px] text-muted-c">Click to change selected file</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400">
                        <Upload className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-semibold text-primary-c">Click to upload photo, video or document</span>
                      <span className="text-[11px] text-muted-c">PNG, JPG, MP4, PDF, DOC up to 50MB</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-base-c pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-secondary-c transition-colors hover:bg-surface-subtle hover:text-primary-c"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-accent px-5 py-2 text-xs font-semibold text-white shadow-soft transition-transform hover:scale-105 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editingItem ? 'Update Item' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        title="Delete Catalog Item"
        message={`Are you sure you want to delete "${deleteModalState.name}"? This action cannot be undone and will remove it from the chat widget and WhatsApp menu.`}
        confirmText="Delete Item"
        confirmVariant="danger"
        isLoading={saving}
        onConfirm={() => {
          handleDelete(deleteModalState.id);
          setDeleteModalState({ isOpen: false, id: '', name: '' });
        }}
        onCancel={() => setDeleteModalState({ isOpen: false, id: '', name: '' })}
      />
    </div>
  );
}

// ── Supporting Components ───────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: typeof ShoppingBag;
  accent: string;
}) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-c">{label}</p>
        <Icon className={cx('h-4 w-4', accent)} />
      </div>
      <p className={cx('mt-1 text-2xl font-bold tabular-nums', accent)}>{value}</p>
    </GlassCard>
  );
}

function CatalogGridCard({
  item,
  onEdit,
  onDelete,
}: {
  item: BusinessServiceItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const mediaUrl = item.imageUrl ? resolveMediaUrl(item.imageUrl) : '';
  const isVideo = isVideoUrl(mediaUrl);
  const isDoc = isDocUrl(mediaUrl);

  return (
    <GlassCard hover className="group flex flex-col overflow-hidden">
      {/* Media Banner */}
      <div className="relative h-44 w-full overflow-hidden bg-surface-muted">
        {mediaUrl ? (
          isVideo ? (
            <div className="relative h-full w-full">
              <video src={mediaUrl} className="h-full w-full object-cover" muted preload="metadata" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                  <Video className="h-3.5 w-3.5" /> Video Preview
                </span>
              </div>
            </div>
          ) : isDoc ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
              <FileText className="h-10 w-10 text-primary-500" />
              <span className="text-xs font-semibold text-primary-c">Document Attached</span>
              <a
                href={mediaUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-primary-600 hover:underline"
              >
                View File <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ) : (
            <img
              src={mediaUrl}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          )
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-muted-c/40">
            <ShoppingBag className="h-10 w-10" />
            <span className="mt-1 text-[11px] font-medium">No media uploaded</span>
          </div>
        )}

        <div className="absolute right-3 top-3 flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onEdit}
            className="grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-slate-700 shadow-sm transition-transform hover:scale-105 dark:bg-slate-900/90 dark:text-slate-200"
            title="Edit item"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-rose-600 shadow-sm transition-transform hover:scale-105 dark:bg-slate-900/90"
            title="Delete item"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-primary-c">{item.name}</h3>
        </div>

        <p className="mt-1.5 flex-1 line-clamp-3 text-xs leading-relaxed text-secondary-c">
          {item.description || 'No detailed description provided.'}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-base-c pt-3 text-[11px] text-muted-c">
          <span className="font-mono text-[10px]">ID: {item.id.slice(0, 8)}</span>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="text-primary-600 hover:underline">Edit</button>
            <span>•</span>
            <button onClick={onDelete} className="text-rose-600 hover:underline">Delete</button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function CatalogListRow({
  item,
  onEdit,
  onDelete,
}: {
  item: BusinessServiceItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const mediaUrl = item.imageUrl ? resolveMediaUrl(item.imageUrl) : '';
  const isVideo = isVideoUrl(mediaUrl);
  const isDoc = isDocUrl(mediaUrl);

  return (
    <GlassCard hover className="flex items-center gap-4 p-3.5">
      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
        {mediaUrl ? (
          isVideo ? (
            <div className="flex h-full w-full items-center justify-center bg-black/40">
              <Video className="h-5 w-5 text-white" />
            </div>
          ) : isDoc ? (
            <div className="flex h-full w-full items-center justify-center text-primary-500">
              <FileText className="h-5 w-5" />
            </div>
          ) : (
            <img src={mediaUrl} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-c/40">
            <ShoppingBag className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-bold text-primary-c">{item.name}</h4>
        <p className="mt-0.5 truncate text-xs text-secondary-c">
          {item.description || 'No detailed description provided.'}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onEdit}
          className="rounded-lg border border-base-c p-2 text-secondary-c transition-colors hover:bg-surface-subtle hover:text-primary-c"
          title="Edit"
        >
          <Edit3 className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg border border-base-c p-2 text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </GlassCard>
  );
}
