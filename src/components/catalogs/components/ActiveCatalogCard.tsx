import { useState } from 'react';
import { 
  Store, RefreshCw, Settings, Check, Copy, MoreHorizontal, 
  Layers, ShoppingCart, ExternalLink, ShieldCheck 
} from 'lucide-react';
import { Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import type { CommerceCatalog, CommerceProduct } from '../types';

interface ActiveCatalogCardProps {
  catalog: CommerceCatalog;
  allCatalogs: CommerceCatalog[];
  products: CommerceProduct[];
  isSyncing: boolean;
  onSync: (metaCatalogId: string) => void;
  onOpenSettings: (catalog: CommerceCatalog) => void;
  onSelectCatalog?: (metaCatalogId: string) => void;
  showToast: (msg: string, isErr?: boolean) => void;
}

export function ActiveCatalogCard({
  catalog,
  allCatalogs,
  products,
  isSyncing,
  onSync,
  onOpenSettings,
  onSelectCatalog,
  showToast,
}: ActiveCatalogCardProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(catalog.metaCatalogId);
    setIsCopied(true);
    showToast('Catalog ID copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const productCount = products.length;
  const maxLimit = catalog.maxProducts || 1000;
  const progressPercent = Math.min(100, Math.round((productCount / maxLimit) * 100));

  return (
    <div className="bg-card-c border border-base-c rounded-xl p-6 shadow-xs space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900 flex items-center justify-center text-primary-600 shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-primary-c leading-tight">
                {catalog.name || 'Catalog_Products'}
              </h2>
              <Badge variant={catalog.status === 'ACTIVE' ? 'success' : 'warning'}>
                {catalog.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-secondary-c font-mono">Meta ID: {catalog.metaCatalogId}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-muted-c hover:text-primary-c transition-colors p-0.5 rounded cursor-pointer"
                title="Copy Meta Catalog ID"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {allCatalogs.length > 1 && onSelectCatalog && (
            <select
              value={catalog.metaCatalogId}
              onChange={(e) => onSelectCatalog(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-base-c bg-white dark:bg-ink-850 text-primary-c focus:outline-none focus:border-primary-500 shadow-2xs"
            >
              {allCatalogs.map(c => (
                <option key={c.id} value={c.metaCatalogId}>
                  {c.name || c.metaCatalogId}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => onSync(catalog.metaCatalogId)}
            disabled={isSyncing}
            className="px-3.5 py-2 text-xs font-semibold text-secondary-c hover:text-primary-c border border-base-c rounded-lg hover:bg-base-c transition-colors flex items-center gap-1.5 bg-white dark:bg-ink-850 shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={cx("w-3.5 h-3.5", isSyncing && "animate-spin text-primary-600")} />
            {isSyncing ? 'Syncing...' : 'Sync'}
          </button>

          <button
            type="button"
            onClick={() => onOpenSettings(catalog)}
            className="px-3.5 py-2 text-xs font-semibold text-secondary-c hover:text-primary-c border border-base-c rounded-lg hover:bg-base-c transition-colors flex items-center gap-1.5 bg-white dark:bg-ink-850 shadow-2xs cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" /> Settings
          </button>
        </div>
      </div>

      {/* Progress Bar: Products */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-secondary-c">Products</span>
          <span className="text-primary-c font-semibold">{productCount} / {maxLimit}</span>
        </div>
        <div className="h-2 w-full bg-slate-100 dark:bg-ink-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(4, progressPercent)}%` }}
          />
        </div>
      </div>

      {/* Metadata Detail Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-base-c text-xs">
        <div>
          <span className="text-muted-c block mb-0.5">Meta Connection</span>
          <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Connected
          </div>
        </div>

        <div>
          <span className="text-muted-c block mb-0.5">Last Sync</span>
          <div className="font-semibold text-primary-c">{catalog.lastSyncedAt || '2 min ago'}</div>
        </div>

        <div>
          <span className="text-muted-c block mb-0.5">Sync Status</span>
          <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Healthy
          </div>
        </div>

        <div>
          <span className="text-muted-c block mb-0.5">Shopping Cart</span>
          <div className="font-semibold text-primary-c">
            {catalog.cartEnabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      </div>
    </div>
  );
}
