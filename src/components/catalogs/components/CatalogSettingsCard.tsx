import { useState } from 'react';
import { Eye, ShoppingCart, MessageSquare, SlidersHorizontal } from 'lucide-react';
import type { CommerceCatalog } from '../types';

interface CatalogSettingsCardProps {
  catalog: CommerceCatalog;
  onUpdateSettings: (isVisible: boolean, cartEnabled: boolean, productMessaging?: boolean) => Promise<void>;
}

export function CatalogSettingsCard({ catalog, onUpdateSettings }: CatalogSettingsCardProps) {
  const [isVisible, setIsVisible] = useState(catalog.isVisible);
  const [cartEnabled, setCartEnabled] = useState(catalog.cartEnabled);
  const [productMessaging, setProductMessaging] = useState(catalog.productMessaging ?? true);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (key: 'visibility' | 'cart' | 'messaging', val: boolean) => {
    let nextVis = isVisible;
    let nextCart = cartEnabled;
    let nextMsg = productMessaging;

    if (key === 'visibility') {
      setIsVisible(val);
      nextVis = val;
    } else if (key === 'cart') {
      setCartEnabled(val);
      nextCart = val;
    } else if (key === 'messaging') {
      setProductMessaging(val);
      nextMsg = val;
    }

    setIsUpdating(true);
    try {
      await onUpdateSettings(nextVis, nextCart, nextMsg);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-card-c border border-base-c rounded-xl p-6 shadow-xs space-y-5">
      <div className="flex items-center gap-2 text-primary-c">
        <SlidersHorizontal className="w-4 h-4 text-primary-600" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-secondary-c">Catalog Settings</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Catalog Visibility */}
        <div className="flex items-start justify-between gap-3 p-4 border border-base-c rounded-xl bg-slate-50/50 dark:bg-ink-850">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold text-sm text-primary-c">
              <Eye className="w-4 h-4 text-primary-500" />
              <span>Catalog Visibility</span>
            </div>
            <p className="text-xs text-secondary-c leading-relaxed">
              Show this catalog on your WhatsApp business profile.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={isVisible} 
              disabled={isUpdating}
              onChange={(e) => handleToggle('visibility', e.target.checked)} 
            />
            <div className="w-9 h-5 bg-slate-300 dark:bg-ink-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        {/* 2. Shopping Cart */}
        <div className="flex items-start justify-between gap-3 p-4 border border-base-c rounded-xl bg-slate-50/50 dark:bg-ink-850">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold text-sm text-primary-c">
              <ShoppingCart className="w-4 h-4 text-emerald-500" />
              <span>Shopping Cart</span>
            </div>
            <p className="text-xs text-secondary-c leading-relaxed">
              Allow customers to add multiple products to a WhatsApp cart.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={cartEnabled} 
              disabled={isUpdating}
              onChange={(e) => handleToggle('cart', e.target.checked)} 
            />
            <div className="w-9 h-5 bg-slate-300 dark:bg-ink-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        {/* 3. Product Messaging */}
        <div className="flex items-start justify-between gap-3 p-4 border border-base-c rounded-xl bg-slate-50/50 dark:bg-ink-850">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold text-sm text-primary-c">
              <MessageSquare className="w-4 h-4 text-sky-500" />
              <span>Product Messaging</span>
            </div>
            <p className="text-xs text-secondary-c leading-relaxed">
              Allow products to be shared directly inside WhatsApp conversations.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={productMessaging} 
              disabled={isUpdating}
              onChange={(e) => handleToggle('messaging', e.target.checked)} 
            />
            <div className="w-9 h-5 bg-slate-300 dark:bg-ink-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
}
