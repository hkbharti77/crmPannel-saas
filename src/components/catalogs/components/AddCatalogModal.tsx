import { useState } from 'react';
import { Store, Link2, Plus, Loader2, Info, ExternalLink } from 'lucide-react';
import { Modal } from '@/components/ui/primitives';
import { cx } from '@/lib/types';

interface AddCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCatalog: (name: string) => Promise<void>;
  onConnectCatalog: (metaCatalogId: string) => Promise<void>;
  showToast: (msg: string, isErr?: boolean) => void;
}

export function AddCatalogModal({
  isOpen,
  onClose,
  onCreateCatalog,
  onConnectCatalog,
  showToast,
}: AddCatalogModalProps) {
  const [mode, setMode] = useState<'create' | 'connect'>('create');
  const [newCatalogName, setNewCatalogName] = useState('');
  const [connectCatalogId, setConnectCatalogId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!newCatalogName.trim()) {
      showToast('Please enter a catalog name', true);
      return;
    }
    setIsLoading(true);
    try {
      await onCreateCatalog(newCatalogName.trim());
      setNewCatalogName('');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to create catalog', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!connectCatalogId.trim()) {
      showToast('Please enter a Meta Catalog ID', true);
      return;
    }
    setIsLoading(true);
    try {
      await onConnectCatalog(connectCatalogId.trim());
      setConnectCatalogId('');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to connect catalog', true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create New Meta Catalog' : 'Connect Existing Meta Catalog'}
    >
      <div className="space-y-6">
        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-100 dark:bg-ink-800 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={cx(
              "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer",
              mode === 'create'
                ? "bg-white dark:bg-ink-700 text-primary-c shadow-2xs"
                : "text-secondary-c hover:text-primary-c"
            )}
          >
            Create New Catalog
          </button>
          <button
            type="button"
            onClick={() => setMode('connect')}
            className={cx(
              "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer",
              mode === 'connect'
                ? "bg-white dark:bg-ink-700 text-primary-c shadow-2xs"
                : "text-secondary-c hover:text-primary-c"
            )}
          >
            Connect Existing Catalog
          </button>
        </div>

        {/* Form Fields */}
        {mode === 'create' ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Important:</strong> Direct catalog creation via API requires Full Admin rights on your Meta Business Portfolio. If you encounter permission errors, we recommend creating your catalog in <a href="https://business.facebook.com/commerce" target="_blank" rel="noreferrer" className="underline font-bold">Meta Commerce Manager ↗</a> and switching to the <strong>Connect Existing</strong> tab.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary-c mb-1.5">Catalog Name *</label>
              <input
                type="text"
                placeholder="e.g. Catalog_Products"
                value={newCatalogName}
                onChange={(e) => setNewCatalogName(e.target.value)}
                className="w-full rounded-lg border border-base-c bg-input-c px-3.5 py-2.5 text-xs text-primary-c focus:border-primary-500 focus:outline-none shadow-2xs"
              />
            </div>
            <button
              type="button"
              onClick={handleCreate}
              disabled={isLoading || !newCatalogName.trim()}
              className="w-full mt-6 py-2.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Catalog
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
                className="w-full rounded-lg border border-base-c bg-input-c px-3.5 py-2.5 text-xs text-primary-c focus:border-primary-500 focus:outline-none font-mono shadow-2xs"
              />
            </div>
            <button
              type="button"
              onClick={handleConnect}
              disabled={isLoading || !connectCatalogId.trim()}
              className="w-full mt-6 py-2.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              Connect Catalog
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
