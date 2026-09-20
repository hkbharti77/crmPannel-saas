import { useState } from 'react';
import { 
  Store, RefreshCw, X, ShieldAlert, Eye, ShoppingCart, 
  MessageSquare, Loader2, Check, Copy, AlertTriangle,
  CreditCard, Banknote 
} from 'lucide-react';
import { Drawer, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import type { CommerceCatalog } from '../types';

interface CatalogSettingsDrawerProps {
  isOpen: boolean;
  catalog: CommerceCatalog | null;
  onClose: () => void;
  onSync: (metaCatalogId: string) => Promise<void>;
  onUpdateSettings: (
    metaCatalogId: string, 
    isVisible: boolean, 
    cartEnabled: boolean, 
    productMessaging?: boolean,
    onlinePaymentEnabled?: boolean,
    codEnabled?: boolean
  ) => Promise<void>;
  onDisconnect: (metaCatalogId: string) => Promise<void>;
  showToast: (msg: string, isErr?: boolean) => void;
}


export function CatalogSettingsDrawer({
  isOpen,
  catalog,
  onClose,
  onSync,
  onUpdateSettings,
  onDisconnect,
  showToast,
}: CatalogSettingsDrawerProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen || !catalog) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(catalog.metaCatalogId);
    setIsCopied(true);
    showToast('Catalog ID copied');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSyncClick = async () => {
    setIsSyncing(true);
    try {
      await onSync(catalog.metaCatalogId);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectClick = async () => {
    setIsDisconnecting(true);
    try {
      await onDisconnect(catalog.metaCatalogId);
      setShowDisconnectConfirm(false);
      onClose();
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Catalog Settings"
      className="sm:w-[480px]"
    >
      <div className="space-y-8 pb-4">
        
        {/* 1. Catalog Information */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-muted-c uppercase tracking-wider">Catalog Information</h4>
          <div className="bg-slate-50 dark:bg-ink-850 border border-base-c rounded-xl p-4 space-y-3.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-secondary-c font-medium">Catalog Name</span>
              <span className="font-bold text-primary-c">{catalog.name || 'Catalog_Products'}</span>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-secondary-c font-medium">Meta Catalog ID</span>
              <div className="flex items-center gap-1.5 font-mono text-primary-c font-semibold">
                <span>{catalog.metaCatalogId}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-muted-c hover:text-primary-c p-0.5 rounded cursor-pointer"
                  title="Copy ID"
                >
                  {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-secondary-c font-medium">Connection</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Connected
              </span>
            </div>
          </div>
        </div>

        {/* 2. Sync & Connection */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-muted-c uppercase tracking-wider">Sync & Connection</h4>
          <div className="flex items-center justify-between p-4 border border-base-c rounded-xl bg-slate-50/50 dark:bg-ink-850">
            <div>
              <div className="text-xs text-secondary-c">Last Sync</div>
              <div className="text-sm font-bold text-primary-c mt-0.5">{catalog.lastSyncedAt || '2 min ago'}</div>
            </div>

            <button
              type="button"
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="px-4 py-2 text-xs font-semibold text-primary-600 dark:text-primary-400 bg-white dark:bg-ink-900 border border-base-c rounded-lg hover:bg-base-c transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={cx("w-3.5 h-3.5", isSyncing && "animate-spin text-primary-600")} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>

        {/* 3. Commerce Settings */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-muted-c uppercase tracking-wider">Commerce Settings</h4>
          
          <div className="space-y-3">
            {/* Catalog Visibility */}
            <div className="flex items-start justify-between gap-3 p-4 border border-base-c rounded-xl">
              <div>
                <h5 className="text-sm font-bold text-primary-c mb-0.5">Catalog Visibility</h5>
                <p className="text-xs text-secondary-c">Show this catalog on your WhatsApp business profile.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={catalog.isVisible}
                  onChange={(e) => onUpdateSettings(catalog.metaCatalogId, e.target.checked, catalog.cartEnabled, catalog.productMessaging)}
                />
                <div className="w-9 h-5 bg-slate-300 dark:bg-ink-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {/* Shopping Cart */}
            <div className="flex items-start justify-between gap-3 p-4 border border-base-c rounded-xl">
              <div>
                <h5 className="text-sm font-bold text-primary-c mb-0.5">Shopping Cart</h5>
                <p className="text-xs text-secondary-c">Allow customers to add multiple products to a WhatsApp cart.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={catalog.cartEnabled}
                  onChange={(e) => onUpdateSettings(catalog.metaCatalogId, catalog.isVisible, e.target.checked, catalog.productMessaging)}
                />
                <div className="w-9 h-5 bg-slate-300 dark:bg-ink-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {/* Product Messaging */}
            <div className="flex items-start justify-between gap-3 p-4 border border-base-c rounded-xl">
              <div>
                <h5 className="text-sm font-bold text-primary-c mb-0.5">Product Messaging</h5>
                <p className="text-xs text-secondary-c">Allow products to be shared directly inside WhatsApp conversations.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={catalog.productMessaging ?? true}
                  onChange={(e) => onUpdateSettings(catalog.metaCatalogId, catalog.isVisible, catalog.cartEnabled, e.target.checked)}
                />
                <div className="w-9 h-5 bg-slate-300 dark:bg-ink-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* 3.5. Checkout & Payment Options */}
        <div className="space-y-3 pt-4 border-t border-base-c">
          <h4 className="text-xs font-bold text-secondary-c uppercase tracking-wider">Checkout & Payment Automation</h4>
          
          <div className="space-y-3">
            {/* Online Payment (Razorpay UPI, Cards, NetBanking) */}
            <div className="flex items-start justify-between gap-3 p-4 border border-base-c rounded-xl bg-surface-c">
              <div className="flex gap-3">
                <div className="p-2 h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h5 className="text-sm font-bold text-primary-c">Online Payment (Razorpay)</h5>
                    <Badge variant="success" className="text-[10px] px-1.5 py-0.5 font-bold">Default ON</Badge>
                  </div>
                  <p className="text-xs text-secondary-c leading-relaxed">
                    Auto-generates Razorpay payment links (UPI, Cards, NetBanking) upon cart submission to confirm orders immediately.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={catalog.onlinePaymentEnabled ?? true}
                  onChange={(e) => onUpdateSettings(
                    catalog.metaCatalogId,
                    catalog.isVisible,
                    catalog.cartEnabled,
                    catalog.productMessaging,
                    e.target.checked,
                    catalog.codEnabled ?? false
                  )}
                />
                <div className="w-9 h-5 bg-slate-300 dark:bg-ink-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Cash on Delivery (COD) */}
            <div className="flex items-start justify-between gap-3 p-4 border border-base-c rounded-xl bg-surface-c">
              <div className="flex gap-3">
                <div className="p-2 h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-primary-c mb-0.5">Cash on Delivery (COD)</h5>
                  <p className="text-xs text-secondary-c leading-relaxed">
                    Allow customers to select cash payment on delivery when placing cart orders.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={catalog.codEnabled ?? false}
                  onChange={(e) => onUpdateSettings(
                    catalog.metaCatalogId,
                    catalog.isVisible,
                    catalog.cartEnabled,
                    catalog.productMessaging,
                    catalog.onlinePaymentEnabled ?? true,
                    e.target.checked
                  )}
                />
                <div className="w-9 h-5 bg-slate-300 dark:bg-ink-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {/* Warning when both disabled */}
            {!(catalog.onlinePaymentEnabled ?? true) && !(catalog.codEnabled ?? false) && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block mb-0.5">Payment Configuration Required</strong>
                  Both Online Payment and COD are disabled. Cart orders will be held in <em>PAYMENT_CONFIGURATION_REQUIRED</em> status and customers will be notified to await manual team contact.
                </div>
              </div>
            )}
          </div>
        </div>


        {/* 4. Danger Zone */}
        <div className="space-y-3 pt-4 border-t border-base-c">
          <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider">Danger Zone</h4>
          
          <div className="border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 rounded-xl p-4 space-y-3">
            <div>
              <h5 className="text-sm font-bold text-red-800 dark:text-red-300">Disconnect Catalog</h5>
              <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">
                Disconnecting will unlink this catalog from your WhatsApp Business Account. Products in Meta will remain untouched.
              </p>
            </div>

            {!showDisconnectConfirm ? (
              <button
                type="button"
                onClick={() => setShowDisconnectConfirm(true)}
                className="px-4 py-2 text-xs font-semibold text-red-700 dark:text-red-300 bg-white dark:bg-ink-900 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
              >
                Disconnect Catalog
              </button>
            ) : (
              <div className="p-3 bg-white dark:bg-ink-900 border border-red-300 dark:border-red-800 rounded-lg space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4" /> Are you sure?
                </div>
                <p className="text-[11px] text-secondary-c">
                  This will immediately remove WhatsApp store access for this catalog.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDisconnectClick}
                    disabled={isDisconnecting}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isDisconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Confirm Disconnect
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDisconnectConfirm(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-secondary-c hover:text-primary-c bg-slate-100 dark:bg-ink-800 rounded-md transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </Drawer>
  );
}
