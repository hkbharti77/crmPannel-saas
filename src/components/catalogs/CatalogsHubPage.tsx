import { useState } from 'react';
import { 
  Store, Link2, RefreshCw, Loader2, Plus, 
  ShoppingCart, Box, ArrowRight, Check, Copy, 
  Settings, Eye, CreditCard, Banknote, AlertTriangle,
  Info, ExternalLink, Sparkles, X
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Modal, Drawer, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import type { CommerceCatalog } from './types';

interface CatalogsHubPageProps {
  catalogs: CommerceCatalog[];
  isLoading: boolean;
  onOpenProducts: (catalogId: string) => void;
  onRefreshCatalogs: () => Promise<void>;
  showToast: (msg: string, isErr?: boolean) => void;
}

export function CatalogsHubPage({
  catalogs,
  isLoading,
  onOpenProducts,
  onRefreshCatalogs,
  showToast,
}: CatalogsHubPageProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(true);

  // Modals & Drawers
  const [isAddCatalogModalOpen, setIsAddCatalogModalOpen] = useState(false);
  const [addCatalogMode, setAddCatalogMode] = useState<'create' | 'connect'>('create');
  const [catalogSettingsOpenFor, setCatalogSettingsOpenFor] = useState<CommerceCatalog | null>(null);

  // Mutation states
  const [connectCatalogId, setConnectCatalogId] = useState('');
  const [newCatalogName, setNewCatalogName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    showToast('Catalog ID copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConnect = async () => {
    if (!connectCatalogId.trim()) return;
    setIsConnecting(true);
    try {
      const res = await apiFetch('/api/v1/whatsapp/catalogs/connect', {
        method: 'POST',
        body: JSON.stringify({ metaCatalogId: connectCatalogId.trim() }),
      });
      if (res.error) throw new Error(res.error);
      showToast('Catalog connected successfully!');
      const connectedId = connectCatalogId.trim();
      setConnectCatalogId('');
      setIsAddCatalogModalOpen(false);
      await onRefreshCatalogs();
      onOpenProducts(connectedId);
    } catch (err: any) {
      showToast(err.message || 'Failed to connect catalog', true);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCreate = async () => {
    if (!newCatalogName.trim()) return;
    setIsCreating(true);
    try {
      const res = await apiFetch<any>('/api/v1/whatsapp/catalogs/create', {
        method: 'POST',
        body: JSON.stringify({ name: newCatalogName.trim() }),
      });
      if (res.error) throw new Error(res.error);
      showToast('Catalog created and connected successfully!');
      setNewCatalogName('');
      setIsAddCatalogModalOpen(false);
      await onRefreshCatalogs();
      if (res.data?.metaCatalogId) {
        onOpenProducts(res.data.metaCatalogId);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create catalog', true);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDisconnect = async (metaCatalogId: string) => {
    setIsDisconnecting(true);
    try {
      const res = await apiFetch(`/api/v1/whatsapp/catalogs/${metaCatalogId}/disconnect`, { method: 'POST' });
      if (res.error) throw new Error(res.error);
      showToast('Catalog disconnected');
      setCatalogSettingsOpenFor(null);
      await onRefreshCatalogs();
    } catch (err: any) {
      showToast(err.message || 'Failed to disconnect catalog', true);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSync = async (metaCatalogId: string) => {
    setIsSyncing(prev => ({ ...prev, [metaCatalogId]: true }));
    try {
      const res = await apiFetch(`/api/v1/whatsapp/catalogs/${metaCatalogId}/sync`, { method: 'POST' });
      if (res.error) throw new Error(res.error);
      showToast('Products synced successfully with Meta!');
      await onRefreshCatalogs();
    } catch (err: any) {
      showToast(err.message || 'Failed to sync catalog', true);
    } finally {
      setIsSyncing(prev => ({ ...prev, [metaCatalogId]: false }));
    }
  };

  const updateSettings = async (
    catalog: CommerceCatalog, 
    isVisible: boolean, 
    cartEnabled: boolean,
    onlinePaymentEnabled?: boolean,
    codEnabled?: boolean
  ) => {
    try {
      const res = await apiFetch(`/api/v1/whatsapp/catalogs/${catalog.metaCatalogId}/settings`, {
        method: 'PUT',
        body: JSON.stringify({ 
          isVisible, 
          cartEnabled,
          onlinePaymentEnabled: onlinePaymentEnabled ?? catalog.onlinePaymentEnabled ?? true,
          codEnabled: codEnabled ?? catalog.codEnabled ?? false
        })
      });
      if (res.error) throw new Error(res.error);
      showToast('Catalog settings updated');
      await onRefreshCatalogs();
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings', true);
    }
  };


  const activeCatalog = catalogs[0];

  if (isLoading) {
    return <div className="p-16 flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary-c" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-primary-c">Commerce Catalogs</h1>
            {catalogs.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Meta Connected
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-secondary-c max-w-2xl">
            Manage your WhatsApp Business Commerce Catalogs and configure customer product visibility.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setAddCatalogMode('connect'); setIsAddCatalogModalOpen(true); }}
            className="px-4 py-2 text-xs font-semibold text-secondary-c hover:text-primary-c border border-base-c rounded-lg hover:bg-base-c transition-colors bg-card-c shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5" /> Connect Existing
          </button>
          <button 
            onClick={() => { setAddCatalogMode('create'); setIsAddCatalogModalOpen(true); }}
            className="px-4 py-2 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create New Catalog
          </button>
        </div>
      </div>

      {/* ── META COMMERCE SETUP & CONNECT GUIDE BANNER ── */}
      {showSetupGuide && (
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/15 px-2 py-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-3.5 h-3.5" /> Recommended Workflow
                </span>
                <h3 className="text-sm font-bold text-primary-c">
                  How to setup & connect your Meta Catalog (Takes 2 Minutes)
                </h3>
              </div>
              <p className="text-xs text-secondary-c leading-relaxed">
                Creating your catalog in Meta Commerce Manager and connecting via <strong>Catalog ID</strong> avoids Meta Business Manager API permission restrictions and connects instantly to your WhatsApp Business Account.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://business.facebook.com/commerce"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-soft transition-all"
              >
                <span>Open Meta Commerce</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setShowSetupGuide(false)}
                className="p-2 text-secondary-c hover:text-primary-c rounded-lg hover:bg-base-c transition-colors cursor-pointer"
                title="Dismiss guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-blue-500/15 text-xs text-secondary-c">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                1
              </div>
              <div>
                <strong className="text-primary-c block">Create or Select Catalog</strong>
                <span>Open Meta Commerce Manager and choose your catalog or click <em>Add Catalogue (E-commerce)</em>.</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                2
              </div>
              <div>
                <strong className="text-primary-c block">Copy Catalog ID</strong>
                <span>Click <strong>⚙️ Settings</strong> in Commerce Manager and copy the 15–16 digit <strong>Catalogue ID</strong> (or from URL).</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                3
              </div>
              <div>
                <strong className="text-primary-c block">Paste & Connect</strong>
                <span>Click <strong>Connect Existing</strong>, paste your Catalog ID, and start showcasing products on WhatsApp!</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card-c border border-base-c rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-secondary-c mb-2">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-primary-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">Catalogs</h3>
            </div>
            <Badge variant={catalogs.length > 0 ? "success" : "neutral"}>
              {catalogs.length > 0 ? "Active" : "None"}
            </Badge>
          </div>
          <p className="text-2xl font-bold text-primary-c">{catalogs.length}</p>
          <p className="text-[11px] text-secondary-c mt-1 font-medium">Connected to WABA</p>
        </div>

        <div className="bg-card-c border border-base-c rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-secondary-c mb-2">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">Status</h3>
            </div>
            <Badge variant="primary">Cloud API</Badge>
          </div>
          <p className="text-lg font-bold text-primary-c">Meta Commerce</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Graph v21.0 Ready</p>
        </div>

        <div className="bg-card-c border border-base-c rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-secondary-c mb-2">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">Shopping Cart</h3>
            </div>
            <Badge variant={activeCatalog?.cartEnabled ? "success" : "neutral"}>
              {activeCatalog?.cartEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <p className="text-lg font-bold text-primary-c">
            {activeCatalog?.cartEnabled ? 'Cart Active' : 'Direct Orders'}
          </p>
          <p className="text-[11px] text-secondary-c mt-1 font-medium">In-chat WhatsApp checkout</p>
        </div>

        <div className="bg-card-c border border-base-c rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-secondary-c mb-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-sky-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">Sync Status</h3>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <p className="text-sm font-semibold text-primary-c truncate mt-1">
            {activeCatalog?.lastSyncedAt || 'Ready to Sync'}
          </p>
          <p className="text-[11px] text-secondary-c mt-1 font-medium">Automatic background sync</p>
        </div>
      </div>

      {/* Connected Catalogs Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-primary-c">Connected Catalogs</h2>
          <span className="text-xs text-secondary-c">{catalogs.length} {catalogs.length === 1 ? 'Catalog' : 'Catalogs'}</span>
        </div>

        {catalogs.length === 0 ? (
          <div className="bg-card-c border border-dashed border-base-c rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 flex items-center justify-center mb-4 border border-primary-100 dark:border-primary-900">
              <Store className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-primary-c mb-1">No Meta Catalog Connected</h3>
            <p className="text-xs text-secondary-c mb-6 max-w-md">
              Connect your existing Meta Commerce Catalog or create a new catalog to start showcasing products and taking orders directly on WhatsApp.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button 
                onClick={() => { setAddCatalogMode('connect'); setIsAddCatalogModalOpen(true); }}
                className="px-5 py-2.5 text-xs font-semibold text-secondary-c hover:text-primary-c border border-base-c rounded-lg hover:bg-base-c transition-colors bg-white shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Link2 className="w-4 h-4" /> Connect Existing Catalog
              </button>
              <button 
                onClick={() => { setAddCatalogMode('create'); setIsAddCatalogModalOpen(true); }}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create New Catalog
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {catalogs.map(catalog => (
              <div 
                key={catalog.id}
                className="bg-card-c border border-base-c rounded-xl p-6 shadow-sm hover:border-primary-300 dark:hover:border-primary-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Catalog Title & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-ink-800 flex items-center justify-center text-primary-600 border border-base-c shrink-0">
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-primary-c leading-tight">
                          {catalog.name || 'Unnamed Catalog'}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs font-mono text-secondary-c">ID: {catalog.metaCatalogId}</span>
                          <button 
                            onClick={() => handleCopy(catalog.metaCatalogId)}
                            className="text-muted-c hover:text-primary-c p-0.5 rounded transition-colors cursor-pointer"
                            title="Copy Catalog ID"
                          >
                            {copiedId === catalog.metaCatalogId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <Badge variant={catalog.status === 'ACTIVE' ? 'success' : 'warning'}>
                      {catalog.status}
                    </Badge>
                  </div>

                  {/* Info Chips */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-base-c text-xs">
                    <div className="flex items-center gap-2 text-secondary-c">
                      <Eye className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                      <span>Visibility: <strong className="text-primary-c">{catalog.isVisible ? 'Visible' : 'Hidden'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-secondary-c">
                      <ShoppingCart className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Cart: <strong className="text-primary-c">{catalog.cartEnabled ? 'Enabled' : 'Disabled'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-secondary-c col-span-2">
                      <RefreshCw className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span>Last Synced: <strong className="text-primary-c">{catalog.lastSyncedAt || 'Never'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-3 pt-6 mt-4 border-t border-base-c">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSync(catalog.metaCatalogId)}
                      disabled={isSyncing[catalog.metaCatalogId]}
                      className="px-3 py-1.5 text-xs font-medium text-secondary-c hover:text-primary-c border border-base-c rounded-lg hover:bg-base-c transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      title="Sync with Meta"
                    >
                      <RefreshCw className={cx("w-3.5 h-3.5", isSyncing[catalog.metaCatalogId] && "animate-spin text-primary-600")} />
                      {isSyncing[catalog.metaCatalogId] ? 'Syncing...' : 'Sync'}
                    </button>
                    <button
                      onClick={() => setCatalogSettingsOpenFor(catalog)}
                      className="px-3 py-1.5 text-xs font-medium text-secondary-c hover:text-primary-c border border-base-c rounded-lg hover:bg-base-c transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Catalog Settings"
                    >
                      <Settings className="w-3.5 h-3.5" /> Settings
                    </button>
                  </div>

                  <button
                    onClick={() => onOpenProducts(catalog.metaCatalogId)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Box className="w-4 h-4" /> Manage Products <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Connect Catalog Modal */}
      <Modal
        isOpen={isAddCatalogModalOpen}
        onClose={() => setIsAddCatalogModalOpen(false)}
        title={addCatalogMode === 'create' ? "Create Meta Catalog" : "Connect Meta Catalog"}
      >
        <div className="flex bg-slate-100 dark:bg-ink-800 p-1 rounded-lg mb-6">
          <button 
            onClick={() => setAddCatalogMode('create')}
            className={cx("flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer", addCatalogMode === 'create' ? "bg-white dark:bg-ink-700 shadow text-primary-c" : "text-secondary-c hover:text-primary-c")}
          >
            Create New
          </button>
          <button 
            onClick={() => setAddCatalogMode('connect')}
            className={cx("flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer", addCatalogMode === 'connect' ? "bg-white dark:bg-ink-700 shadow text-primary-c" : "text-secondary-c hover:text-primary-c")}
          >
            Connect Existing
          </button>
        </div>

        {addCatalogMode === 'create' ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Important Note:</strong> Creating catalogs directly via API requires Full Admin rights on your Meta Business Portfolio. If you encounter permission errors, we recommend creating your catalog in <a href="https://business.facebook.com/commerce" target="_blank" rel="noreferrer" className="underline font-bold">Meta Commerce Manager ↗</a> and using the <strong>Connect Existing</strong> tab.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary-c mb-1.5">Catalog Name *</label>
              <input
                type="text"
                placeholder="e.g. Summer 2026 Collection"
                value={newCatalogName}
                onChange={(e) => setNewCatalogName(e.target.value)}
                className="w-full rounded-lg border border-base-c bg-input-c px-3 py-2 text-sm text-primary-c focus:border-primary-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={!newCatalogName.trim() || isCreating}
              className="w-full mt-6 flex justify-center items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create & Open Catalog
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-primary-c">
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <Info className="w-4 h-4" /> How to find your Meta Catalog ID:
                </span>
                <a
                  href="https://business.facebook.com/commerce"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  Open Commerce Manager <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-secondary-c pl-0.5 leading-relaxed">
                <li>Go to <strong>Meta Commerce Manager</strong> and open your catalog (or create one via <em>Add Catalogue</em>).</li>
                <li>In the left sidebar, click <strong>⚙️ Settings</strong> (Catalogue Settings).</li>
                <li>Copy the 15–16 digit <strong>Catalogue ID</strong> (or copy it from your browser URL).</li>
              </ol>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary-c mb-1.5">Meta Catalog ID *</label>
              <input
                type="text"
                placeholder="e.g. 1766687860918465"
                value={connectCatalogId}
                onChange={(e) => setConnectCatalogId(e.target.value)}
                className="w-full rounded-lg border border-base-c bg-input-c px-3 py-2 text-sm text-primary-c focus:border-primary-500 focus:outline-none font-mono"
              />
            </div>
            <button
              onClick={handleConnect}
              disabled={!connectCatalogId.trim() || isConnecting}
              className="w-full mt-6 flex justify-center items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              Connect & Open Catalog
            </button>
          </div>
        )}
      </Modal>

      {/* Catalog Settings Drawer */}
      <Drawer
        isOpen={!!catalogSettingsOpenFor}
        onClose={() => setCatalogSettingsOpenFor(null)}
        title="Catalog Configuration"
      >
        {catalogSettingsOpenFor && (
          <div className="space-y-8">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-muted-c uppercase tracking-wider">Catalog Details</h4>
              <div className="bg-slate-50 dark:bg-ink-850 border border-base-c rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-secondary-c">Name</span>
                  <span className="text-xs font-bold text-primary-c">{catalogSettingsOpenFor.name || 'Unnamed'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-secondary-c">Meta Catalog ID</span>
                  <span className="text-xs font-mono text-primary-c">{catalogSettingsOpenFor.metaCatalogId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-secondary-c">Status</span>
                  <Badge variant={catalogSettingsOpenFor.status === 'ACTIVE' ? 'success' : 'warning'}>{catalogSettingsOpenFor.status}</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-muted-c uppercase tracking-wider">WhatsApp Commerce Settings</h4>
              
              <div className="flex items-start justify-between gap-4 p-4 border border-base-c rounded-xl hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                <div>
                  <h5 className="text-sm font-bold text-primary-c mb-1">Catalog Visibility</h5>
                  <p className="text-xs text-secondary-c">Show this catalog on your WhatsApp business profile.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input type="checkbox" className="sr-only peer" checked={catalogSettingsOpenFor.isVisible} onChange={(e) => {
                     setCatalogSettingsOpenFor({ ...catalogSettingsOpenFor, isVisible: e.target.checked });
                     updateSettings(catalogSettingsOpenFor, e.target.checked, catalogSettingsOpenFor.cartEnabled);
                  }} />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>

              <div className="flex items-start justify-between gap-4 p-4 border border-base-c rounded-xl hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                <div>
                  <h5 className="text-sm font-bold text-primary-c mb-1">Shopping Cart</h5>
                  <p className="text-xs text-secondary-c">Allow customers to add multiple items to a cart in WhatsApp chat.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input type="checkbox" className="sr-only peer" checked={catalogSettingsOpenFor.cartEnabled} onChange={(e) => {
                     setCatalogSettingsOpenFor({ ...catalogSettingsOpenFor, cartEnabled: e.target.checked });
                     updateSettings(catalogSettingsOpenFor, catalogSettingsOpenFor.isVisible, e.target.checked);
                  }} />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>

              {/* Online Payment */}
              <div className="flex items-start justify-between gap-4 p-4 border border-base-c rounded-xl hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <h5 className="text-sm font-bold text-primary-c">Online Payment (Razorpay)</h5>
                    <Badge variant="success" className="text-[10px] px-1.5 py-0.2">Default ON</Badge>
                  </div>
                  <p className="text-xs text-secondary-c">Auto-generates Razorpay payment links (UPI, Cards, NetBanking) on cart checkout.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input type="checkbox" className="sr-only peer" checked={catalogSettingsOpenFor.onlinePaymentEnabled ?? true} onChange={(e) => {
                     const updated = { ...catalogSettingsOpenFor, onlinePaymentEnabled: e.target.checked };
                     setCatalogSettingsOpenFor(updated);
                     updateSettings(catalogSettingsOpenFor, catalogSettingsOpenFor.isVisible, catalogSettingsOpenFor.cartEnabled, e.target.checked, catalogSettingsOpenFor.codEnabled ?? false);
                  }} />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Cash on Delivery */}
              <div className="flex items-start justify-between gap-4 p-4 border border-base-c rounded-xl hover:border-amber-200 dark:hover:border-amber-800 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Banknote className="w-4 h-4 text-amber-600" />
                    <h5 className="text-sm font-bold text-primary-c">Cash on Delivery (COD)</h5>
                  </div>
                  <p className="text-xs text-secondary-c">Allow customers to choose cash payment on delivery.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input type="checkbox" className="sr-only peer" checked={catalogSettingsOpenFor.codEnabled ?? false} onChange={(e) => {
                     const updated = { ...catalogSettingsOpenFor, codEnabled: e.target.checked };
                     setCatalogSettingsOpenFor(updated);
                     updateSettings(catalogSettingsOpenFor, catalogSettingsOpenFor.isVisible, catalogSettingsOpenFor.cartEnabled, catalogSettingsOpenFor.onlinePaymentEnabled ?? true, e.target.checked);
                  }} />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {/* Both Disabled Alert */}
              {!(catalogSettingsOpenFor.onlinePaymentEnabled ?? true) && !(catalogSettingsOpenFor.codEnabled ?? false) && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Payment Configuration Required:</strong> Both payment methods are disabled. Cart orders will pause for manual customer follow-up.
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-base-c">

              <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider">Danger Zone</h4>
              <div className="border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 rounded-xl p-4">
                <h5 className="text-sm font-bold text-red-800 dark:text-red-300 mb-1">Disconnect Catalog</h5>
                <p className="text-xs text-red-600/80 dark:text-red-400/80 mb-4">
                  Disconnecting will remove this catalog from the CRM. Products inside Meta Business Manager will not be deleted.
                </p>
                <button
                  onClick={() => handleDisconnect(catalogSettingsOpenFor.metaCatalogId)}
                  disabled={isDisconnecting}
                  className="px-4 py-2 text-xs font-semibold text-red-700 dark:text-red-300 bg-white dark:bg-ink-900 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isDisconnecting ? 'Disconnecting...' : 'Disconnect Catalog'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
