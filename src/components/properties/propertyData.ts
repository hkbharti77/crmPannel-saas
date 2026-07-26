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

export const PROPERTIES: Property[] = [
  {
    id: 'P-001',
    title: 'Skyline Residency 3BHK',
    type: 'Apartment',
    status: 'AVAILABLE',
    price: '₹1.2Cr',
    priceValue: 120,
    location: 'Banjara Hills',
    city: 'Hyderabad',
    beds: 3,
    baths: 2,
    area: '1,840 sqft',
    areaValue: 1840,
    image: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800',
    agent: 'Priya Sharma',
    listedDate: 'Jun 12, 2026',
    featured: true,
  },
  {
    id: 'P-002',
    title: 'Green Acres Villa',
    type: 'Villa',
    status: 'AVAILABLE',
    price: '₹2.8Cr',
    priceValue: 280,
    location: 'Whitefield',
    city: 'Bengaluru',
    beds: 4,
    baths: 4,
    area: '3,200 sqft',
    areaValue: 3200,
    image: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800',
    agent: 'Arjun Kapoor',
    listedDate: 'Jul 02, 2026',
    featured: true,
  },
  {
    id: 'P-003',
    title: 'Palm Grove Plot',
    type: 'Plot',
    status: 'RESERVED',
    price: '₹85L',
    priceValue: 85,
    location: 'ECIL Road',
    city: 'Hyderabad',
    beds: 0,
    baths: 0,
    area: '2,400 sqft',
    areaValue: 2400,
    image: 'https://images.pexels.com/photos/260931/pexels-photo-260931.jpeg?auto=compress&cs=tinysrgb&w=800',
    agent: 'Rahul Verma',
    listedDate: 'May 28, 2026',
    featured: false,
  },
  {
    id: 'P-004',
    title: 'Metro Square Commercial',
    type: 'Commercial',
    status: 'AVAILABLE',
    price: '₹4.5Cr',
    priceValue: 450,
    location: 'BKC',
    city: 'Mumbai',
    beds: 0,
    baths: 2,
    area: '5,000 sqft',
    areaValue: 5000,
    image: 'https://images.pexels.com/photos/325185/pexels-photo-325185.jpeg?auto=compress&cs=tinysrgb&w=800',
    agent: 'Sneha Patel',
    listedDate: 'Jul 10, 2026',
    featured: true,
  },
  {
    id: 'P-005',
    title: 'Lakeside Row House',
    type: 'Row House',
    status: 'SOLD',
    price: '₹1.6Cr',
    priceValue: 160,
    location: 'Powai',
    city: 'Mumbai',
    beds: 3,
    baths: 3,
    area: '2,100 sqft',
    areaValue: 2100,
    image: 'https://images.pexels.com/photos/1438832/pexels-photo-1438832.jpeg?auto=compress&cs=tinysrgb&w=800',
    agent: 'Priya Sharma',
    listedDate: 'Apr 18, 2026',
    featured: false,
  },
  {
    id: 'P-006',
    title: 'Sunset Boulevard 2BHK',
    type: 'Apartment',
    status: 'AVAILABLE',
    price: '₹68L',
    priceValue: 68,
    location: 'HSR Layout',
    city: 'Bengaluru',
    beds: 2,
    baths: 2,
    area: '1,240 sqft',
    areaValue: 1240,
    image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
    agent: 'Arjun Kapoor',
    listedDate: 'Jul 15, 2026',
    featured: false,
  },
  {
    id: 'P-007',
    title: 'Hill View Penthouse',
    type: 'Apartment',
    status: 'RESERVED',
    price: '₹3.2Cr',
    priceValue: 320,
    location: 'Kondapur',
    city: 'Hyderabad',
    beds: 4,
    baths: 4,
    area: '3,600 sqft',
    areaValue: 3600,
    image: 'https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=800',
    agent: 'Sneha Patel',
    listedDate: 'Jun 30, 2026',
    featured: true,
  },
  {
    id: 'P-008',
    title: 'Orchard Estate Villa',
    type: 'Villa',
    status: 'OFF_MARKET',
    price: '₹5.2Cr',
    priceValue: 520,
    location: 'Jubilee Hills',
    city: 'Hyderabad',
    beds: 5,
    baths: 5,
    area: '6,000 sqft',
    areaValue: 6000,
    image: 'https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg?auto=compress&cs=tinysrgb&w=800',
    agent: 'Rahul Verma',
    listedDate: 'Mar 05, 2026',
    featured: false,
  },
];

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
