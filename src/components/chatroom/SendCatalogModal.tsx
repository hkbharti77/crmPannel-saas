import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShoppingBag, Store, Search, Check, Send, Loader2, X, 
  Package, AlertCircle, Sparkles, Layers, Image as ImageIcon,
  RefreshCw
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { cx } from '@/lib/types';
import type { CommerceCatalog, CommerceProduct } from '@/components/catalogs/types';

interface SendCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerWaId: string;
  customerName?: string;
  onSuccess: (result: { type: 'single' | 'multi'; summary: string; waMessageId: string }) => void;
}

export function SendCatalogModal({
  isOpen,
  onClose,
  customerWaId,
  customerName,
  onSuccess,
}: SendCatalogModalProps) {
  const [catalogs, setCatalogs] = useState<CommerceCatalog[]>([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');
  const [products, setProducts] = useState<CommerceProduct[]>([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Send Mode: 'single' (SPM) or 'multi' (MPM)
  const [sendMode, setSendMode] = useState<'single' | 'multi'>('single');

  // Single Selection
  const [selectedProduct, setSelectedProduct] = useState<CommerceProduct | null>(null);

  // Multi Selection
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Form Fields
  const [searchQuery, setSearchQuery] = useState('');
  const [headerText, setHeaderText] = useState('Featured Collection');
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('Tap below to view items');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch all catalogs on open
  useEffect(() => {
    if (!isOpen) {
      setSelectedProduct(null);
      setSelectedProductIds(new Set());
      setSearchQuery('');
      setErrorMessage(null);
      return;
    }

    const loadCatalogs = async () => {
      setIsLoadingCatalogs(true);
      setErrorMessage(null);
      try {
        const res = await apiFetch<CommerceCatalog[]>('/api/v1/whatsapp/catalogs');
        if (res.data && res.data.length > 0) {
          setCatalogs(res.data);
          const firstCat = res.data[0];
          setSelectedCatalogId(firstCat.metaCatalogId || firstCat.id);
        } else {
          setCatalogs([]);
        }
      } catch (err: any) {
        console.error('Failed to load catalogs', err);
        setErrorMessage(err.message || 'Failed to load catalogs');
      } finally {
        setIsLoadingCatalogs(false);
      }
    };

    loadCatalogs();
  }, [isOpen]);

  // Fetch products when selected catalog changes
  useEffect(() => {
    if (!selectedCatalogId) {
      setProducts([]);
      return;
    }

    const currentCat = catalogs.find(
      c => c.metaCatalogId === selectedCatalogId || c.id === selectedCatalogId
    );
    // Prioritize metaCatalogId over internal DB UUID
    const lookupId = currentCat?.metaCatalogId || selectedCatalogId;

    const loadProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const res = await apiFetch<CommerceProduct[]>(`/api/v1/whatsapp/catalogs/${lookupId}/products`);
        if (res.data) {
          setProducts(res.data);
          if (res.data.length > 0) {
            setSelectedProduct(res.data[0]);
            setBodyText(`Check out our ${res.data[0].name}!`);
          }
        } else {
          setProducts([]);
        }
      } catch (err: any) {
        console.error('Failed to load catalog products', err);
        setErrorMessage(err.message || 'Failed to load products');
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, [selectedCatalogId, catalogs]);

  // Manual sync with Meta catalog
  const handleSyncCatalog = async () => {
    const currentCat = catalogs.find(
      c => c.metaCatalogId === selectedCatalogId || c.id === selectedCatalogId
    );
    const targetId = currentCat?.metaCatalogId || selectedCatalogId;
    if (!targetId) return;

    setIsSyncing(true);
    setErrorMessage(null);
    try {
      await apiFetch(`/api/v1/whatsapp/catalogs/${targetId}/sync`, { method: 'POST' });
      // Re-fetch catalogs and products
      const catRes = await apiFetch<CommerceCatalog[]>('/api/v1/whatsapp/catalogs');
      if (catRes.data) setCatalogs(catRes.data);
      const prodRes = await apiFetch<CommerceProduct[]>(`/api/v1/whatsapp/catalogs/${targetId}/products`);
      if (prodRes.data) {
        setProducts(prodRes.data);
        if (prodRes.data.length > 0 && !selectedProduct) {
          setSelectedProduct(prodRes.data[0]);
        }
      }
    } catch (err: any) {
      console.error('Sync failed', err);
      setErrorMessage(err.message || 'Failed to sync catalog');
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.productRetailerId.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  const activeCatalog = catalogs.find(
    c => c.metaCatalogId === selectedCatalogId || c.id === selectedCatalogId
  );

  const cleanPhone = customerWaId.replace(/[^0-9+]/g, '');

  // Toggle multi-product selection
  const handleToggleMultiProduct = (product: CommerceProduct) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(product.productRetailerId)) {
        next.delete(product.productRetailerId);
      } else {
        if (next.size >= 30) {
          return next;
        }
        next.add(product.productRetailerId);
      }
      return next;
    });
  };

  const handleSelectSingle = (product: CommerceProduct) => {
    setSelectedProduct(product);
    setBodyText(`Check out our ${product.name}!`);
  };

  // Submit Send
  const handleSend = async () => {
    if (!activeCatalog?.metaCatalogId) {
      setErrorMessage('No valid Meta Catalog ID linked.');
      return;
    }

    if (!cleanPhone || cleanPhone.replace(/[^0-9]/g, '').length < 10) {
      setErrorMessage('Customer phone number is invalid.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    const targetMetaCatalogId = activeCatalog.metaCatalogId;

    try {
      if (sendMode === 'single') {
        if (!selectedProduct) {
          setErrorMessage('Please select a product to send.');
          setIsSending(false);
          return;
        }

        const requestId = `spm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const res = await apiFetch<{
          status: string;
          waMessageId?: string;
          messageId?: string;
          error?: string;
        }>(`/api/v1/whatsapp/catalogs/${targetMetaCatalogId}/send-product`, {
          method: 'POST',
          body: JSON.stringify({
            requestId,
            waId: cleanPhone,
            productRetailerId: selectedProduct.productRetailerId,
            bodyText: bodyText.trim() || undefined,
          }),
        });

        if (res.error) {
          throw new Error(res.error);
        }

        onSuccess({
          type: 'single',
          summary: `${selectedProduct.name} (${selectedProduct.productRetailerId})`,
          waMessageId: res.data?.waMessageId || '',
        });
        onClose();

      } else {
        // Multi-Product (MPM)
        if (selectedProductIds.size === 0) {
          setErrorMessage('Please select at least 1 product (up to 30) to send.');
          setIsSending(false);
          return;
        }

        const requestId = `mpm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const retailerIds = Array.from(selectedProductIds);

        const res = await apiFetch<{
          status: string;
          waMessageId?: string;
          messageId?: string;
          error?: string;
        }>(`/api/v1/whatsapp/catalogs/${targetMetaCatalogId}/send-multi-product`, {
          method: 'POST',
          body: JSON.stringify({
            requestId,
            waId: cleanPhone,
            headerText: headerText.trim() || undefined,
            bodyText: bodyText.trim() || undefined,
            footerText: footerText.trim() || undefined,
            productRetailerIds: retailerIds,
          }),
        });

        if (res.error) {
          throw new Error(res.error);
        }

        onSuccess({
          type: 'multi',
          summary: `${retailerIds.length} items from ${activeCatalog.name}`,
          waMessageId: res.data?.waMessageId || '',
        });
        onClose();
      }
    } catch (err: any) {
      console.error('Failed to send product message:', err);
      setErrorMessage(err.message || 'Failed to send catalog product');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Card: Increased Width (max-w-5xl) & Decreased Height (max-h-[76vh] h-[460px]) */}
      <div className="relative z-10 w-full max-w-5xl max-h-[76vh] h-[460px] bg-card-c border border-base-c rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        
        {/* Single Clean Header */}
        <div className="flex items-center justify-between border-b border-base-c px-5 py-2.5 bg-slate-50/70 dark:bg-ink-900/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-soft">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-primary-c leading-tight">Send WhatsApp Catalog</h3>
                <span className="hidden sm:inline-block rounded-full bg-indigo-500/15 px-2 py-0.2 text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                  Official Commerce API
                </span>
              </div>
              <p className="text-[11px] text-muted-c">
                Sending to: <span className="font-semibold text-secondary-c">{customerName || 'Customer'}</span>{' '}
                <span className="font-mono text-[10px] opacity-75">({cleanPhone || customerWaId})</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:bg-slate-200 dark:hover:bg-ink-800 hover:text-primary-c transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Top Control Bar: Catalog Switcher + Sync + Mode Tabs + Search */}
        <div className="px-5 py-2 border-b border-base-c/70 bg-card-c shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Catalog Selector + Sync Button */}
          <div className="flex items-center gap-1.5 sm:max-w-xs flex-1">
            <Store className="h-3.5 w-3.5 text-muted-c shrink-0" />
            {isLoadingCatalogs ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-c">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                <span>Loading catalogs…</span>
              </div>
            ) : catalogs.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <select
                  value={selectedCatalogId}
                  onChange={e => setSelectedCatalogId(e.target.value)}
                  className="text-xs font-semibold rounded-lg border border-base-c bg-slate-50 dark:bg-ink-900 px-2.5 py-1 text-primary-c focus:outline-none focus:ring-1 focus:ring-indigo-500 flex-1 truncate"
                >
                  {catalogs.map(c => {
                    const catVal = c.metaCatalogId || c.id;
                    const count = c.productsCount !== undefined ? c.productsCount : 0;
                    return (
                      <option key={c.id} value={catVal}>
                        {c.name} ({count} {count === 1 ? 'item' : 'items'})
                      </option>
                    );
                  })}
                </select>
                <button
                  type="button"
                  onClick={handleSyncCatalog}
                  disabled={isSyncing || isLoadingProducts}
                  title="Sync with Meta"
                  className="p-1 rounded-md border border-base-c text-muted-c hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-ink-800 transition-colors cursor-pointer shrink-0"
                >
                  <RefreshCw className={cx("h-3 w-3", isSyncing && "animate-spin text-indigo-500")} />
                </button>
              </div>
            ) : (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">No catalogs found</span>
            )}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-muted-c" />
            <input
              type="text"
              placeholder="Search products by name, SKU, or category…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-base-c bg-slate-50 dark:bg-ink-900 placeholder:text-muted-c focus:outline-none focus:ring-1 focus:ring-indigo-500 text-primary-c"
            />
          </div>

          {/* Mode Switcher Pills */}
          <div className="flex items-center rounded-lg bg-slate-100 dark:bg-ink-900 p-0.5 border border-base-c shrink-0">
            <button
              onClick={() => setSendMode('single')}
              className={cx(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer',
                sendMode === 'single'
                  ? 'bg-white dark:bg-ink-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-muted-c hover:text-primary-c'
              )}
            >
              <Package className="h-3 w-3" />
              <span>Single (SPM)</span>
            </button>
            <button
              onClick={() => setSendMode('multi')}
              className={cx(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer',
                sendMode === 'multi'
                  ? 'bg-white dark:bg-ink-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-muted-c hover:text-primary-c'
              )}
            >
              <Layers className="h-3 w-3" />
              <span>Multi (MPM)</span>
              {selectedProductIds.size > 0 && (
                <span className="ml-1 rounded-full bg-indigo-500 text-white px-1.5 py-0.2 text-[9px] font-bold leading-none">
                  {selectedProductIds.size}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Error Banner if any */}
        {errorMessage && (
          <div className="mx-5 mt-2 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 shrink-0">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">{errorMessage}</span>
          </div>
        )}

        {/* Main Content 2-Column Layout */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-base-c/80 overflow-hidden">
          
          {/* Left Column: Products List */}
          <div className="md:col-span-7 h-full overflow-y-auto p-3.5 space-y-1.5 scrollbar-thin">
            {isLoadingProducts ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-c gap-2 py-10">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                <span className="text-xs">Loading catalog products…</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-c text-center py-10">
                <Package className="h-7 w-7 opacity-30 mb-1.5" />
                <p className="text-xs font-semibold">No products found</p>
                <p className="text-[11px] opacity-70 mt-0.5">Try searching with a different term or sync your catalog.</p>
              </div>
            ) : (
              filteredProducts.map(product => {
                const isSelected =
                  sendMode === 'single'
                    ? selectedProduct?.id === product.id
                    : selectedProductIds.has(product.productRetailerId);

                const priceNum = typeof product.price === 'number' ? product.price : parseFloat(String(product.price || 0));
                const currency = product.currency === 'INR' ? '₹' : product.currency === 'USD' ? '$' : (product.currency || '₹');

                return (
                  <div
                    key={product.id}
                    onClick={() => {
                      if (sendMode === 'single') {
                        handleSelectSingle(product);
                      } else {
                        handleToggleMultiProduct(product);
                      }
                    }}
                    className={cx(
                      'group flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer select-none',
                      isSelected
                        ? 'border-indigo-500/70 bg-indigo-50/60 dark:bg-indigo-950/30 ring-1 ring-indigo-500/30 shadow-xs'
                        : 'border-base-c/80 hover:border-indigo-500/40 bg-card-c hover:bg-slate-50/70 dark:hover:bg-ink-900/70'
                    )}
                  >
                    {/* Checkbox / Radio Indicator */}
                    <div
                      className={cx(
                        'grid h-4.5 w-4.5 shrink-0 place-items-center rounded border text-white transition-all',
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600'
                          : 'border-slate-300 dark:border-ink-700'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>

                    {/* Image Thumbnail */}
                    <div className="h-9 w-9 shrink-0 rounded-lg overflow-hidden border border-base-c/80 bg-slate-100 dark:bg-ink-900 grid place-items-center">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-3.5 w-3.5 text-muted-c opacity-50" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-semibold text-primary-c truncate">{product.name}</h4>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          {currency}{priceNum.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono text-muted-c truncate">
                          SKU: {product.productRetailerId}
                        </span>
                        {product.availability && (
                          <span
                            className={cx(
                              'text-[9px] font-semibold px-1.5 py-0.2 rounded-sm',
                              product.availability === 'in_stock'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/15 text-rose-600'
                            )}
                          >
                            {product.availability === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Custom Message Composer & Action Button */}
          <div className="md:col-span-5 h-full flex flex-col justify-between p-3.5 bg-slate-50/40 dark:bg-ink-900/40 overflow-y-auto">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary-c">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                <span>
                  {sendMode === 'single' ? 'Selected Product Preview' : 'Multi-Product Settings'}
                </span>
              </div>

              {sendMode === 'single' ? (
                <>
                  {selectedProduct ? (
                    <div className="rounded-xl border border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 flex items-center gap-2.5">
                      {selectedProduct.imageUrl ? (
                        <img src={selectedProduct.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover border border-base-c shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-ink-800 grid place-items-center shrink-0">
                          <Package className="h-5 w-5 text-muted-c" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-primary-c truncate">{selectedProduct.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {selectedProduct.currency === 'INR' ? '₹' : selectedProduct.currency === 'USD' ? '$' : (selectedProduct.currency || '₹')}
                            {(typeof selectedProduct.price === 'number' ? selectedProduct.price : parseFloat(String(selectedProduct.price || 0))).toFixed(2)}
                          </span>
                          <span className="text-[10px] font-mono text-muted-c truncate">
                            {selectedProduct.productRetailerId}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-base-c p-2.5 text-center text-xs text-muted-c">
                      Select a product from the left list to send
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-c mb-1">
                      Body Message (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={bodyText}
                      onChange={e => setBodyText(e.target.value)}
                      placeholder="Enter a message to accompany this product..."
                      className="w-full text-xs rounded-xl border border-base-c bg-card-c p-2 text-primary-c focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-xl border border-base-c bg-card-c p-2.5 text-xs flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-c">Products Selected:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {selectedProductIds.size} / 30 max
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-c mb-0.5">
                      Header Text
                    </label>
                    <input
                      type="text"
                      value={headerText}
                      onChange={e => setHeaderText(e.target.value)}
                      placeholder="e.g. Featured Collection"
                      className="w-full text-xs rounded-lg border border-base-c bg-card-c px-2.5 py-1 text-primary-c focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-c mb-0.5">
                      Body Text
                    </label>
                    <textarea
                      rows={2}
                      value={bodyText}
                      onChange={e => setBodyText(e.target.value)}
                      placeholder="e.g. Browse our latest catalog picks:"
                      className="w-full text-xs rounded-lg border border-base-c bg-card-c p-2 text-primary-c focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-c mb-0.5">
                      Footer Text
                    </label>
                    <input
                      type="text"
                      value={footerText}
                      onChange={e => setFooterText(e.target.value)}
                      placeholder="e.g. Tap below to view items"
                      className="w-full text-xs rounded-lg border border-base-c bg-card-c px-2.5 py-1 text-primary-c focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Send Action Button */}
            <div className="pt-2 border-t border-base-c/60 mt-2">
              <button
                onClick={handleSend}
                disabled={
                  isSending ||
                  isLoadingCatalogs ||
                  isLoadingProducts ||
                  (sendMode === 'single' ? !selectedProduct : selectedProductIds.size === 0)
                }
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all btn-tactile cursor-pointer"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Sending to WhatsApp…</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>
                      {sendMode === 'single'
                        ? 'Send Single Product'
                        : `Send Multi-Product (${selectedProductIds.size} items)`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
