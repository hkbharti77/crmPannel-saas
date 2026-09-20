import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '@/lib/api';
import { 
  Store, RefreshCw, Loader2, Plus, ArrowLeft, 
  Check, Copy, Settings, ShoppingCart, ShieldCheck 
} from 'lucide-react';
import { Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { ProductsSection } from './components/ProductsSection';
import { ProductDrawer } from './components/ProductDrawer';
import { CatalogSettingsDrawer } from './components/CatalogSettingsDrawer';
import { SendProductModal } from './components/SendProductModal';
import { SendMultiProductModal } from './components/SendMultiProductModal';
import { ProductBuyersDrawer } from './components/ProductBuyersDrawer';
import type { CommerceCatalog, CommerceProduct } from './types';

interface CatalogProductsPageProps {
  catalog: CommerceCatalog;
  allCatalogs: CommerceCatalog[];
  onBackToCatalogs: () => void;
  onSelectCatalog: (catalogId: string) => void;
  onRefreshCatalogs: () => Promise<void>;
  showToast: (msg: string, isErr?: boolean) => void;
}

export function CatalogProductsPage({
  catalog,
  allCatalogs,
  onBackToCatalogs,
  onSelectCatalog,
  onRefreshCatalogs,
  showToast,
}: CatalogProductsPageProps) {
  const [products, setProducts] = useState<CommerceProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals & Drawers state
  const [isCatalogSettingsOpen, setIsCatalogSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [productDrawerState, setProductDrawerState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    product: CommerceProduct | null;
  }>({
    isOpen: false,
    mode: 'create',
    product: null,
  });
  const [sendProductTarget, setSendProductTarget] = useState<CommerceProduct | null>(null);
  const [sendMultiTargets, setSendMultiTargets] = useState<CommerceProduct[]>([]);
  const [buyerDrawerProduct, setBuyerDrawerProduct] = useState<CommerceProduct | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    showToast('Catalog ID copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchProducts = useCallback(async (catalogId: string) => {
    setIsLoadingProducts(true);
    try {
      const res = await apiFetch<CommerceProduct[]>(`/api/v1/whatsapp/catalogs/${catalogId}/products`);
      if (res.data) {
        setProducts(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch products', err);
      showToast(err.message || 'Failed to fetch products', true);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    if (catalog?.metaCatalogId) {
      fetchProducts(catalog.metaCatalogId);
    }
  }, [catalog?.metaCatalogId, fetchProducts]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await apiFetch(`/api/v1/whatsapp/catalogs/${catalog.metaCatalogId}/sync`, { method: 'POST' });
      if (res.error) throw new Error(res.error);
      showToast('Products synced successfully with Meta!');
      await onRefreshCatalogs();
      await fetchProducts(catalog.metaCatalogId);
    } catch (err: any) {
      showToast(err.message || 'Failed to sync catalog', true);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async (metaCatalogId: string) => {
    const res = await apiFetch(`/api/v1/whatsapp/catalogs/${metaCatalogId}/disconnect`, { method: 'POST' });
    if (res.error) throw new Error(res.error);
    showToast('Catalog disconnected');
    await onRefreshCatalogs();
    onBackToCatalogs();
  };

  const handleUpdateSettings = async (
    metaCatalogId: string,
    isVisible: boolean,
    cartEnabled: boolean,
    productMessaging?: boolean,
    onlinePaymentEnabled?: boolean,
    codEnabled?: boolean
  ) => {
    const res = await apiFetch(`/api/v1/whatsapp/catalogs/${metaCatalogId}/settings`, {
      method: 'PUT',
      body: JSON.stringify({ 
        isVisible, 
        cartEnabled, 
        productMessaging,
        onlinePaymentEnabled: onlinePaymentEnabled ?? catalog.onlinePaymentEnabled ?? true,
        codEnabled: codEnabled ?? catalog.codEnabled ?? false
      })
    });
    if (res.error) throw new Error(res.error);
    showToast('Catalog settings updated');
    await onRefreshCatalogs();
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToCatalogs}
          className="inline-flex items-center gap-2 text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Catalogs
        </button>
        
        {allCatalogs.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-secondary-c font-semibold">Switch Catalog:</span>
            <select
              value={catalog.metaCatalogId}
              onChange={(e) => onSelectCatalog(e.target.value)}
              className="rounded-lg border border-base-c bg-white dark:bg-ink-850 px-3 py-1.5 text-xs font-semibold text-primary-c focus:outline-none focus:border-primary-500 shadow-2xs cursor-pointer"
            >
              {allCatalogs.map(c => (
                <option key={c.id} value={c.metaCatalogId}>
                  {c.name || c.metaCatalogId}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Catalog Context Banner Card */}
      <div className="bg-card-c border border-base-c rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900 flex items-center justify-center text-primary-600 shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-primary-c">{catalog.name || 'Catalog Products'}</h2>
                  <Badge variant={catalog.status === 'ACTIVE' ? 'success' : 'warning'}>
                    {catalog.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-secondary-c mt-0.5">
                  <span className="font-mono">Meta ID: {catalog.metaCatalogId}</span>
                  <button 
                    type="button"
                    onClick={() => handleCopy(catalog.metaCatalogId)}
                    className="text-muted-c hover:text-primary-c cursor-pointer"
                    title="Copy ID"
                  >
                    {copiedId === catalog.metaCatalogId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <span>•</span>
                  <span>WhatsApp Shopping: <strong className="text-primary-c">{catalog.cartEnabled ? 'Enabled' : 'Disabled'}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button 
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              className="px-3.5 py-2 text-xs font-semibold text-secondary-c hover:text-primary-c border border-base-c rounded-lg hover:bg-base-c transition-colors flex items-center gap-1.5 disabled:opacity-50 bg-white dark:bg-ink-850 shadow-2xs cursor-pointer"
            >
              <RefreshCw className={cx("w-3.5 h-3.5", isSyncing && "animate-spin text-primary-600")} />
              {isSyncing ? 'Syncing...' : 'Sync with Meta'}
            </button>

            <button 
              type="button"
              onClick={() => setIsCatalogSettingsOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-secondary-c hover:text-primary-c border border-base-c rounded-lg hover:bg-base-c transition-colors flex items-center gap-1.5 bg-white dark:bg-ink-850 shadow-2xs cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" /> Catalog Settings
            </button>

            <button 
              type="button"
              onClick={() => setProductDrawerState({ isOpen: true, mode: 'create', product: null })}
              className="px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <ProductsSection
        products={products}
        catalogs={allCatalogs}
        activeCatalog={catalog}
        isLoading={isLoadingProducts}
        onAddProduct={() => setProductDrawerState({ isOpen: true, mode: 'create', product: null })}
        onEditProduct={(p) => setProductDrawerState({ isOpen: true, mode: 'edit', product: p })}
        onSendProduct={(p) => setSendProductTarget(p)}
        onSendMultiProduct={(prods) => setSendMultiTargets(prods)}
        onViewBuyers={(p) => setBuyerDrawerProduct(p)}
        showToast={showToast}
      />

      {/* Add / Edit Product Drawer (matching Reference UI) */}
      <ProductDrawer
        isOpen={productDrawerState.isOpen}
        mode={productDrawerState.mode}
        initialProduct={productDrawerState.product}
        catalogs={allCatalogs}
        activeCatalogId={catalog.metaCatalogId}
        defaultCurrency={products[0]?.currency || 'INR'}
        onClose={() => setProductDrawerState(prev => ({ ...prev, isOpen: false }))}
        onSuccess={() => {
          fetchProducts(catalog.metaCatalogId);
        }}
        showToast={showToast}
      />

      {/* Single Product Send Modal */}
      <SendProductModal
        isOpen={!!sendProductTarget}
        product={sendProductTarget}
        catalogId={catalog.metaCatalogId}
        onClose={() => setSendProductTarget(null)}
        showToast={showToast}
      />

      {/* Multi Product Send Modal */}
      <SendMultiProductModal
        isOpen={sendMultiTargets.length > 0}
        products={sendMultiTargets}
        catalogId={catalog.metaCatalogId}
        onClose={() => setSendMultiTargets([])}
        showToast={showToast}
      />

      {/* Catalog Settings Drawer */}
      <CatalogSettingsDrawer
        isOpen={isCatalogSettingsOpen}
        catalog={catalog}
        onClose={() => setIsCatalogSettingsOpen(false)}
        onSync={handleSync}
        onUpdateSettings={handleUpdateSettings}
        onDisconnect={handleDisconnect}
        showToast={showToast}
      />

      {/* Product Buyers Drawer */}
      {buyerDrawerProduct && (
        <ProductBuyersDrawer
          metaCatalogId={catalog.metaCatalogId}
          sku={buyerDrawerProduct.productRetailerId}
          productName={buyerDrawerProduct.name || buyerDrawerProduct.productRetailerId}
          productImage={buyerDrawerProduct.imageUrl}
          onClose={() => setBuyerDrawerProduct(null)}
        />
      )}
    </div>
  );
}
