export interface CommerceCatalog {
  id: string;
  metaCatalogId: string;
  name: string;
  status: string;
  isVisible: boolean;
  cartEnabled: boolean;
  onlinePaymentEnabled?: boolean;
  codEnabled?: boolean;
  productMessaging?: boolean;
  lastSyncedAt?: string;
  lastVerifiedAt?: string;
  productsCount?: number;
  maxProducts?: number;
}


export interface CommerceProduct {
  id: string;
  productRetailerId: string;
  name: string;
  description?: string;
  price: number; // in cents/paise (e.g. 99900 for 999.00)
  salePrice?: number;
  currency: string;
  imageUrl?: string;
  additionalImages?: string[];
  url?: string;
  category?: string;
  availability?: string; // 'in_stock' | 'out_of_stock'
  condition?: string; // 'new' | 'refurbished' | 'used'
  isActive: boolean;
  catalogId?: string;
  metaCatalogId?: string;
  metaProductId?: string;
  lastSyncedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductFormData {
  name: string;
  retailer_id: string;
  description: string;
  price: string;
  sale_price: string;
  currency: string;
  url: string;
  category: string;
  availability: string;
  condition: string;
  catalog_id: string;
  images: string[];
}
