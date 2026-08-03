export type PropertyStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'OFF_MARKET';
export type PropertyType = 'Apartment' | 'Villa' | 'Plot' | 'Commercial' | 'Row House';

export type Property = {
  id: string;
  title: string;
  type: PropertyType;
  status: PropertyStatus;
  price: string;
  priceValue: number;
  location: string;
  city: string;
  beds: number;
  baths: number;
  area: string;
  areaValue: number;
  image: string;
  agent: string;
  listedDate: string;
  featured: boolean;
};

export const PROPERTIES: Property[] = [];

export const STATUS_META: Record<PropertyStatus, { label: string; dot: string; color: string }> = {
  AVAILABLE: { label: 'Available', dot: 'bg-success-500', color: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300' },
  RESERVED: { label: 'Reserved', dot: 'bg-warning-500', color: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300' },
  SOLD: { label: 'Sold', dot: 'bg-primary-500', color: 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300' },
  OFF_MARKET: { label: 'Off Market', dot: 'bg-slate-400', color: 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-400' },
};

export const TYPE_META: Record<PropertyType, { icon: string }> = {
  Apartment: { icon: 'Building2' },
  Villa: { icon: 'Home' },
  Plot: { icon: 'Square' },
  Commercial: { icon: 'Store' },
  'Row House': { icon: 'Home' },
};
