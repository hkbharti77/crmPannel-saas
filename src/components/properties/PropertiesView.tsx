import { useState, useMemo } from 'react';
import { GlassCard, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import {
  PROPERTIES,
  STATUS_META,
  type Property,
  type PropertyStatus,
  type PropertyType,
} from './propertyData';
import {
  Search,
  Plus,
  Building2,
  Home,
  Square,
  Store,
  MapPin,
  Bed,
  Bath,
  Maximize,
  SlidersHorizontal,
  Star,
} from 'lucide-react';

const TYPE_ICONS: Record<PropertyType, typeof Building2> = {
  Apartment: Building2,
  Villa: Home,
  Plot: Square,
  Commercial: Store,
  'Row House': Home,
};

type StatusFilter = PropertyStatus | 'ALL';
type TypeFilter = PropertyType | 'ALL';

export function PropertiesView() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  const filtered = useMemo(() => {
    return PROPERTIES.filter((p) => {
      const matchesSearch =
        !query ||
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.location.toLowerCase().includes(query.toLowerCase()) ||
        p.city.toLowerCase().includes(query.toLowerCase()) ||
        p.id.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchesType = typeFilter === 'ALL' || p.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [query, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const total = PROPERTIES.length;
    const available = PROPERTIES.filter((p) => p.status === 'AVAILABLE').length;
    const reserved = PROPERTIES.filter((p) => p.status === 'RESERVED').length;
    const sold = PROPERTIES.filter((p) => p.status === 'SOLD').length;
    const totalValue = PROPERTIES.reduce((s, p) => s + p.priceValue, 0);
    return { total, available, reserved, sold, totalValue };
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary-c">Properties</h2>
          <p className="mt-0.5 text-sm text-secondary-c">
            Manage your property inventory and listings.
          </p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-2 text-xs font-semibold text-white transition-transform hover:scale-105">
          <Plus className="h-3.5 w-3.5" /> Add Property
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Listings" value={stats.total} accent="text-primary-600 dark:text-primary-400" />
        <StatCard label="Available" value={stats.available} accent="text-success-600 dark:text-success-400" />
        <StatCard label="Reserved" value={stats.reserved} accent="text-warning-600 dark:text-warning-400" />
        <StatCard label="Portfolio Value" value={`₹${stats.totalValue}Cr+`} accent="text-secondary-600 dark:text-secondary-400" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, location, or ID…"
            className="w-full rounded-xl2 border border-base-c bg-card-c py-2.5 pl-10 pr-4 text-sm text-primary-c placeholder:text-muted-c transition-colors focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-c" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="rounded-lg border border-base-c bg-card-c px-2.5 py-2 text-xs text-secondary-c focus:border-primary-500/40 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="Apartment">Apartment</option>
            <option value="Villa">Villa</option>
            <option value="Plot">Plot</option>
            <option value="Commercial">Commercial</option>
            <option value="Row House">Row House</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-base-c bg-card-c px-2.5 py-2 text-xs text-secondary-c focus:border-primary-500/40 focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="SOLD">Sold</option>
            <option value="OFF_MARKET">Off Market</option>
          </select>
        </div>

        <div className="flex rounded-lg border border-base-c p-0.5">
          {(['grid', 'list'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setLayout(m)}
              className={cx(
                'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                layout === m ? 'bg-gradient-accent text-white' : 'text-secondary-c hover:text-primary-c',
              )}
            >
              {m === 'grid' ? 'Grid' : 'List'}
            </button>
          ))}
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(['ALL', 'AVAILABLE', 'RESERVED', 'SOLD', 'OFF_MARKET'] as StatusFilter[]).map((s) => {
          const count = s === 'ALL' ? PROPERTIES.length : PROPERTIES.filter((p) => p.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cx(
                'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                statusFilter === s
                  ? 'bg-gradient-accent text-white shadow-soft'
                  : 'border border-base-c text-secondary-c hover:border-primary-500/30 hover:text-primary-c',
              )}
            >
              {s === 'ALL' ? 'All' : STATUS_META[s as PropertyStatus].label}
              <span className={cx(
                'grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold',
                statusFilter === s ? 'bg-white/25' : 'bg-slate-100 text-muted-c dark:bg-ink-800',
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Properties */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-12 w-12 text-muted-c/30" />
          <p className="mt-3 text-sm text-muted-c">No properties match your filters</p>
        </div>
      ) : layout === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <PropertyRow key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <GlassCard className="p-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-c">{label}</p>
      <p className={cx('mt-1 text-2xl font-bold tabular-nums', accent)}>{value}</p>
    </GlassCard>
  );
}

function PropertyCard({ property }: { property: Property }) {
  const statusMeta = STATUS_META[property.status];
  const TypeIcon = TYPE_ICONS[property.type];

  return (
    <GlassCard hover className="overflow-hidden">
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={property.image}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold', statusMeta.color)}>
            <span className={cx('h-1.5 w-1.5 rounded-full', statusMeta.dot)} />
            {statusMeta.label}
          </span>
        </div>
        {property.featured && (
          <div className="absolute right-3 top-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-accent px-2 py-0.5 text-[10px] font-bold text-white">
              <Star className="h-2.5 w-2.5 fill-current" /> Featured
            </span>
          </div>
        )}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          <TypeIcon className="h-3.5 w-3.5 text-white/90" />
          <span className="text-xs font-medium text-white/90">{property.type}</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-primary-c">{property.title}</h3>
          <span className="text-[10px] font-bold text-muted-c">{property.id}</span>
        </div>

        <p className="mt-1 flex items-center gap-1 text-xs text-secondary-c">
          <MapPin className="h-3 w-3 text-muted-c" />
          {property.location}, {property.city}
        </p>

        <p className="mt-3 text-lg font-bold text-primary-c">{property.price}</p>

        {/* Specs */}
        <div className="mt-3 flex items-center gap-4 border-t border-base-c pt-3 text-xs text-secondary-c">
          {property.beds > 0 && (
            <span className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5 text-muted-c" /> {property.beds}
            </span>
          )}
          {property.baths > 0 && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5 text-muted-c" /> {property.baths}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Maximize className="h-3.5 w-3.5 text-muted-c" /> {property.area}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] text-muted-c">Listed {property.listedDate}</span>
          <Badge variant="neutral">{property.agent}</Badge>
        </div>
      </div>
    </GlassCard>
  );
}

function PropertyRow({ property }: { property: Property }) {
  const statusMeta = STATUS_META[property.status];
  const TypeIcon = TYPE_ICONS[property.type];

  return (
    <GlassCard hover className="flex items-center gap-4 p-3">
      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg">
        <img src={property.image} alt={property.title} className="h-full w-full object-cover" loading="lazy" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <TypeIcon className="h-3.5 w-3.5 shrink-0 text-muted-c" />
          <h3 className="truncate text-sm font-bold text-primary-c">{property.title}</h3>
          <span className="shrink-0 text-[10px] font-bold text-muted-c">{property.id}</span>
        </div>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-secondary-c">
          <MapPin className="h-3 w-3 shrink-0 text-muted-c" />
          {property.location}, {property.city}
        </p>
      </div>

      <div className="hidden items-center gap-4 text-xs text-secondary-c sm:flex">
        {property.beds > 0 && <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5 text-muted-c" /> {property.beds}</span>}
        {property.baths > 0 && <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5 text-muted-c" /> {property.baths}</span>}
        <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5 text-muted-c" /> {property.area}</span>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-primary-c">{property.price}</p>
        <span className={cx('mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold', statusMeta.color)}>
          {statusMeta.label}
        </span>
      </div>
    </GlassCard>
  );
}
