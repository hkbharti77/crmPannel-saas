import { useState, useMemo } from 'react';
import { 
  Box, Search, Plus, Upload, Filter, MoreHorizontal, 
  ArrowUpDown, Image as ImageIcon, ChevronLeft, ChevronRight, 
  Edit, Trash2, ExternalLink, Check, Copy, RefreshCw, Send,
  ShoppingCart, Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import type { CommerceCatalog, CommerceProduct } from '../types';

interface ProductsSectionProps {
  products: CommerceProduct[];
  catalogs: CommerceCatalog[];
  activeCatalog?: CommerceCatalog;
  isLoading: boolean;
  onAddProduct: () => void;
  onEditProduct: (product: CommerceProduct) => void;
  onImportProducts?: () => void;
  onSendProduct?: (product: CommerceProduct) => void;
  onSendMultiProduct?: (products: CommerceProduct[]) => void;
  onViewBuyers?: (product: CommerceProduct) => void;
  showToast: (msg: string, isErr?: boolean) => void;
}

export function ProductsSection({
  products,
  catalogs,
  activeCatalog,
  isLoading,
  onAddProduct,
  onEditProduct,
  onImportProducts,
  onSendProduct,
  onSendMultiProduct,
  onViewBuyers,
  showToast,
}: ProductsSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Draft' | 'Out of Sync'>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc' | 'name'>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const itemsPerPage = 8;

  const handleToggleSelectAll = () => {
    if (paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.has(p.id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProducts.map(p => p.id)));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopySku = (sku: string) => {
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    showToast('SKU copied to clipboard');
    setTimeout(() => setCopiedSku(null), 2000);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let list = [...products];

    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) || 
        (p.productRetailerId && p.productRetailerId.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Filter
    if (activeFilter === 'Active') {
      list = list.filter(p => p.isActive);
    } else if (activeFilter === 'Draft') {
      list = list.filter(p => !p.isActive);
    } else if (activeFilter === 'Out of Sync') {
      list = list.filter(p => !p.metaProductId);
    }

    // Sort
    if (sortBy === 'price_asc') {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'name') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return list;
  }, [products, searchTerm, activeFilter, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProducts.slice(start, start + itemsPerPage);
  }, [filteredAndSortedProducts, currentPage, itemsPerPage]);

  const selectedProductsList = useMemo(() => {
    return products.filter(p => selectedIds.has(p.id));
  }, [products, selectedIds]);

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-primary-c">Products</h3>
          <p className="text-xs text-secondary-c">
            Manage products available in your WhatsApp Commerce Catalog.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onImportProducts || (() => showToast('Product import via CSV coming soon'))}
            className="px-3.5 py-2 text-xs font-semibold text-secondary-c hover:text-primary-c border border-base-c rounded-lg hover:bg-base-c transition-colors bg-white dark:bg-ink-850 shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" /> Import Products
          </button>

          <button
            type="button"
            onClick={onAddProduct}
            className="px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Main Table Card Container */}
      <div className="bg-card-c border border-base-c rounded-xl shadow-xs overflow-hidden">
        
        {/* Toolbar: Search, Filters, Sort */}
        <div className="p-4 border-b border-base-c bg-slate-50/60 dark:bg-ink-850 flex flex-col md:flex-row gap-3.5 items-stretch md:items-center justify-between">
          
          {/* Search Input */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-c" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-base-c bg-white dark:bg-ink-900 text-primary-c focus:border-primary-500 focus:outline-none shadow-2xs"
            />
          </div>

          {/* Filter Pills & Sort Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-200/70 dark:bg-ink-800 p-0.5 rounded-lg">
              {(['All', 'Active', 'Draft', 'Out of Sync'] as const).map(filter => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => { setActiveFilter(filter); setCurrentPage(1); }}
                  className={cx(
                    "px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap",
                    activeFilter === filter
                      ? "bg-white dark:bg-ink-700 text-primary-c shadow-2xs"
                      : "text-secondary-c hover:text-primary-c"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-base-c bg-white dark:bg-ink-900 text-secondary-c focus:outline-none focus:border-primary-500 shadow-2xs"
              >
                <option value="recent">Recently Added</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name">Name: A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Table Content */}
        {products.length === 0 ? (
          /* Empty State */
          <div className="p-16 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-ink-800 flex items-center justify-center text-slate-400">
              <Box className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-primary-c">No products yet</h4>
            <p className="text-xs text-secondary-c max-w-sm">
              Add products to your Meta Commerce Catalog and start sharing them with customers on WhatsApp.
            </p>
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={onAddProduct}
                className="px-5 py-2.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
              <button
                type="button"
                onClick={onImportProducts || (() => showToast('Product import via CSV coming soon'))}
                className="px-5 py-2.5 text-xs font-semibold text-secondary-c hover:text-primary-c border border-base-c rounded-lg hover:bg-base-c transition-colors bg-white dark:bg-ink-800 shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4" /> Import Products
              </button>
            </div>
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="p-12 text-center text-sm text-secondary-c">
            No products match your search or filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/80 dark:bg-ink-850 text-xs text-muted-c font-semibold border-b border-base-c uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.has(p.id))}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-base-c text-primary-600 focus:ring-primary-500 cursor-pointer"
                      title="Select all on this page"
                    />
                  </th>
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-6 py-3.5">SKU</th>
                  <th className="px-6 py-3.5">Price</th>
                  <th className="px-6 py-3.5">Catalog</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Last Synced</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-c">
                {paginatedProducts.map(product => {
                  const catalogName = activeCatalog?.name || 'Catalog_Products';
                  const currencySymbol = product.currency === 'USD' ? '$' : product.currency === 'EUR' ? '€' : '₹';
                  const priceNum = typeof product.price === 'number' ? product.price : parseFloat(String(product.price || 0));
                  const salePriceNum = product.salePrice ? (typeof product.salePrice === 'number' ? product.salePrice : parseFloat(String(product.salePrice))) : 0;
                  const hasSale = salePriceNum > 0 && salePriceNum < priceNum;
                  const isSelected = selectedIds.has(product.id);

                  return (
                    <tr 
                      key={product.id} 
                      className={cx(
                        "hover:bg-slate-50/70 dark:hover:bg-ink-800/60 transition-colors group",
                        isSelected && "bg-primary-50/40 dark:bg-primary-950/20"
                      )}
                    >
                      {/* Selection Checkbox */}
                      <td className="px-4 py-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(product.id)}
                          className="w-4 h-4 rounded border-base-c text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                      </td>

                      {/* Product Thumbnail & Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-ink-800 border border-base-c overflow-hidden shrink-0 flex items-center justify-center">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-primary-c group-hover:text-primary-600 transition-colors">
                              {product.name}
                            </div>
                            <div className="text-[11px] text-secondary-c truncate max-w-xs">
                              {product.description || 'No description'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-6 py-4 text-xs font-mono text-secondary-c font-medium">
                        <div className="flex items-center gap-1.5">
                          <span>{product.productRetailerId}</span>
                          <button
                            type="button"
                            onClick={() => handleCopySku(product.productRetailerId)}
                            className="text-muted-c hover:text-primary-c p-0.5 rounded cursor-pointer"
                            title="Copy SKU"
                          >
                            {copiedSku === product.productRetailerId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4">
                        {hasSale ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              {currencySymbol}{salePriceNum.toFixed(2)}
                            </span>
                            <span className="text-[11px] text-muted-c line-through">
                              {currencySymbol}{priceNum.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-primary-c">
                            {currencySymbol}{priceNum.toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Catalog */}
                      <td className="px-6 py-4 text-xs font-medium text-secondary-c">
                        {catalogName}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {product.isActive ? 'Active' : 'Draft'}
                        </span>
                      </td>

                      {/* Last Synced */}
                      <td className="px-6 py-4 text-xs text-secondary-c">
                        {product.lastSyncedAt || activeCatalog?.lastSyncedAt || '2 min ago'}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Buyers badge */}
                          <button
                            type="button"
                            onClick={() => onViewBuyers?.(product)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors cursor-pointer"
                            title="View customers who ordered this product"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            Buyers
                          </button>
                          {onSendProduct && (
                            <button
                              type="button"
                              onClick={() => onSendProduct(product)}
                              className="p-1.5 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-secondary-c hover:text-emerald-600 transition-colors cursor-pointer"
                              title="Send to WhatsApp (SPM)"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onEditProduct(product)}
                            className="p-1.5 rounded-md hover:bg-base-c text-secondary-c hover:text-primary-600 transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditProduct(product)}
                            className="p-1.5 rounded-md hover:bg-base-c text-muted-c hover:text-primary-c transition-colors cursor-pointer"
                            title="More Actions"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Floating Multi-Product Action Bar */}
        {selectedIds.size > 0 && onSendMultiProduct && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-ink-850 border border-primary-500/30 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
              <span className="text-xs font-bold text-primary-c">
                {selectedIds.size} {selectedIds.size === 1 ? 'product' : 'products'} selected
              </span>
            </div>
            <div className="h-4 w-px bg-base-c" />
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs font-medium text-secondary-c hover:text-primary-c transition-colors cursor-pointer"
            >
              Clear selection
            </button>
            <button
              type="button"
              onClick={() => onSendMultiProduct(selectedProductsList)}
              className="px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Send Multi-Product ({selectedIds.size})
            </button>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredAndSortedProducts.length > itemsPerPage && (
          <div className="p-4 border-t border-base-c bg-slate-50/40 dark:bg-ink-850 flex items-center justify-between text-xs text-secondary-c">
            <span>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedProducts.length)} of {filteredAndSortedProducts.length} products
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-md border border-base-c bg-white dark:bg-ink-800 hover:bg-base-c disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-semibold text-primary-c">{currentPage} / {totalPages}</span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 rounded-md border border-base-c bg-white dark:bg-ink-800 hover:bg-base-c disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
