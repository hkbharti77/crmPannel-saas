import { Store, Box, RefreshCw, ShoppingCart } from 'lucide-react';
import type { CommerceCatalog, CommerceProduct } from '../types';

interface CatalogSummaryCardsProps {
  catalogs: CommerceCatalog[];
  products: CommerceProduct[];
  activeCatalog?: CommerceCatalog;
}

export function CatalogSummaryCards({ catalogs, products, activeCatalog }: CatalogSummaryCardsProps) {
  const isCartEnabled = activeCatalog ? activeCatalog.cartEnabled : catalogs.some(c => c.cartEnabled);
  const syncStatus = activeCatalog?.lastSyncedAt || 'Just now';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Catalogs */}
      <div className="bg-card-c border border-base-c rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-secondary-c mb-2">
          <span className="text-xs font-semibold text-secondary-c uppercase tracking-wider">Catalogs</span>
          <Store className="w-4 h-4 text-primary-500" />
        </div>
        <div className="text-2xl font-bold text-primary-c">{catalogs.length}</div>
        <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
          {catalogs.length > 0 ? 'Connected' : 'No Catalogs'}
        </div>
      </div>

      {/* 2. Products */}
      <div className="bg-card-c border border-base-c rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-secondary-c mb-2">
          <span className="text-xs font-semibold text-secondary-c uppercase tracking-wider">Products</span>
          <Box className="w-4 h-4 text-indigo-500" />
        </div>
        <div className="text-2xl font-bold text-primary-c">{products.length}</div>
        <div className="text-[11px] text-secondary-c font-medium mt-0.5">Across all catalogs</div>
      </div>

      {/* 3. Synced */}
      <div className="bg-card-c border border-base-c rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-secondary-c mb-2">
          <span className="text-xs font-semibold text-secondary-c uppercase tracking-wider">Synced</span>
          <RefreshCw className="w-4 h-4 text-sky-500" />
        </div>
        <div className="text-lg font-bold text-primary-c truncate">
          {catalogs.length > 0 ? syncStatus : 'Never'}
        </div>
        <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
          {catalogs.length > 0 ? 'Healthy' : 'Disconnected'}
        </div>
      </div>

      {/* 4. Shopping Cart */}
      <div className="bg-card-c border border-base-c rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-secondary-c mb-2">
          <span className="text-xs font-semibold text-secondary-c uppercase tracking-wider">Shopping Cart</span>
          <ShoppingCart className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="text-lg font-bold text-primary-c">
          {isCartEnabled ? 'Enabled' : 'Disabled'}
        </div>
        <div className="text-[11px] text-secondary-c font-medium mt-0.5">WhatsApp Shopping</div>
      </div>
    </div>
  );
}
