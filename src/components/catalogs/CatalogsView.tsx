import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { Toast } from '@/components/ui/primitives';
import { CatalogsHubPage } from './CatalogsHubPage';
import { CatalogProductsPage } from './CatalogProductsPage';
import type { CommerceCatalog } from './types';

export function CatalogsView() {
  const [catalogs, setCatalogs] = useState<CommerceCatalog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ msg: string, isErr: boolean } | null>(null);

  const showToast = (msg: string, isErr = false) => {
    setToastMessage({ msg, isErr });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchCatalogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch<CommerceCatalog[]>('/api/v1/whatsapp/catalogs');
      if (res.error) throw new Error(res.error);
      const data = res.data || [];
      setCatalogs(data);
    } catch (error: any) {
      console.error('Failed to fetch catalogs', error);
      showToast(error.message || 'Failed to fetch catalogs', true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogs();
  }, [fetchCatalogs]);

  const activeCatalog = catalogs.find(c => c.metaCatalogId === selectedCatalogId);

  return (
    <div className="mx-auto max-w-7xl p-6 pb-16">
      {toastMessage && (
        <Toast 
          message={toastMessage.msg} 
          isError={toastMessage.isErr} 
          onClose={() => setToastMessage(null)} 
        />
      )}

      {/* When a catalog is selected, show ONLY the dedicated Catalog Products Workspace (Page 2) */}
      {selectedCatalogId && activeCatalog ? (
        <CatalogProductsPage
          catalog={activeCatalog}
          allCatalogs={catalogs}
          onBackToCatalogs={() => setSelectedCatalogId(null)}
          onSelectCatalog={(catalogId) => setSelectedCatalogId(catalogId)}
          onRefreshCatalogs={fetchCatalogs}
          showToast={showToast}
        />
      ) : (
        /* Otherwise, show ONLY the Catalogs Hub Page (Page 1) */
        <CatalogsHubPage
          catalogs={catalogs}
          isLoading={isLoading}
          onOpenProducts={(catalogId) => setSelectedCatalogId(catalogId)}
          onRefreshCatalogs={fetchCatalogs}
          showToast={showToast}
        />
      )}
    </div>
  );
}
