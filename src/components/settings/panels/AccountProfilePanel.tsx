import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '@/lib/types';
import { Avatar } from '@/components/ui/primitives';
import {
  User, Mail, Phone, MapPin, Check,
  Loader2, AlertCircle, CheckCircle2,
  Copy, Bot, Settings as SettingsIcon, BookOpen, Eye, Navigation, Briefcase, ChevronDown, X,
} from 'lucide-react';
import { PanelHeader, FieldRow, Toggle, SaveBar, SectionCard } from './_shared';
import {
  fetchCurrentUserProfile, updateCurrentUserProfile, fetchBusinessCategories,
  fetchTimezones, fetchCountries, TimezoneOption, CountryOption
} from '@/lib/userApi';
import { useAuth } from '@/context/AuthContext';

/* ─── Account Profile Panel ─── */
export function AccountProfilePanel() {
  const { user } = useAuth();

  // Profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');

  // Categories dictionary fetched dynamically from GET /api/v1/business-categories
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string[]>>({});

  // Dynamic Timezones & Countries from GET /api/v1/timezones and /api/v1/countries
  const [timezonesList, setTimezonesList] = useState<TimezoneOption[]>([]);
  const [countriesList, setCountriesList] = useState<CountryOption[]>([]);

  // Business Information fields dropdown selection
  const [businessCategory, setBusinessCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');

  // App Modules Toggles
  const [forceShowLeads, setForceShowLeads] = useState(true);
  const [forceShowAppointment, setForceShowAppointment] = useState(true);
  const [forceShowBooking, setForceShowBooking] = useState(true);

  // Business Location & Region
  const [country, setCountry] = useState('IN');
  const [currency, setCurrency] = useState('INR');
  const [timezone, setTimezone] = useState(() => {
    return typeof window !== 'undefined' ? (Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata') : 'Asia/Kolkata';
  });

  // Business Location
  const [mapsLink, setMapsLink] = useState('');
  const [latitude, setLatitude] = useState('25.5941');
  const [longitude, setLongitude] = useState('85.1376');

  // Tenant / Business ID for Website Chat Widget
  const [businessId, setBusinessId] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Modal State for Documentation
  const [showDocModal, setShowDocModal] = useState(false);

  useEffect(() => {
    setLoading(true);

    // Fetch categories dropdown data, timezones, countries & profile from backend API in parallel
    Promise.all([
      fetchBusinessCategories(),
      fetchCurrentUserProfile(),
      fetchTimezones(),
      fetchCountries(),
    ]).then(([catRes, profRes, tzRes, countryRes]) => {
      setLoading(false);

      if (tzRes.data && tzRes.data.length > 0) {
        setTimezonesList(tzRes.data);
      }
      if (countryRes.data && countryRes.data.length > 0) {
        setCountriesList(countryRes.data);
      }

      let fetchedMap: Record<string, string[]> = {};
      if (catRes.data && Object.keys(catRes.data).length > 0) {
        fetchedMap = catRes.data;
        setCategoriesMap(fetchedMap);
      }

      if (profRes.data) {
        setName(profRes.data.displayName || user?.email?.split('@')[0] || '');
        setEmail(profRes.data.email || user?.email || '');
        setPhone(profRes.data.phone || '');
        setCompany(profRes.data.businessName || '');
        setCity(profRes.data.address || '');
        setBio(profRes.data.aboutUs || '');

        if (profRes.data.country) setCountry(profRes.data.country);
        if (profRes.data.currency) setCurrency(profRes.data.currency);
        if (profRes.data.timezone) setTimezone(profRes.data.timezone);

        const defaultCat = profRes.data.businessType || Object.keys(fetchedMap)[0] || '';
        const defaultSub = profRes.data.businessSubType || (defaultCat ? fetchedMap[defaultCat]?.[0] || '' : '');
        setBusinessCategory(defaultCat);
        setSubCategory(defaultSub);

        setForceShowLeads(profRes.data.forceShowLeads ?? true);
        setForceShowAppointment(profRes.data.forceShowAppointment ?? true);
        setForceShowBooking(profRes.data.forceShowBooking ?? true);

        if (profRes.data.latitude) setLatitude(String(profRes.data.latitude));
        if (profRes.data.longitude) setLongitude(String(profRes.data.longitude));

        setBusinessId(profRes.data.id || user?.id || '840c4a19-6805-4995-84f3-53c7baff658f');
      } else {
        setName(user?.user_metadata?.name || user?.email?.split('@')[0] || '');
        setEmail(user?.email || '');
        setCompany('Gyan VaniAi');
        setBusinessId(user?.id || '840c4a19-6805-4995-84f3-53c7baff658f');
        if (Object.keys(fetchedMap).length > 0) {
          const firstCat = Object.keys(fetchedMap)[0];
          setBusinessCategory(firstCat);
          setSubCategory(fetchedMap[firstCat]?.[0] || '');
        }
      }
    });
  }, [user]);

  // Available sub-categories for selected businessCategory
  const availableSubCategories = categoriesMap[businessCategory] || [];

  const handleCategoryChange = (newCat: string) => {
    setBusinessCategory(newCat);
    const subList = categoriesMap[newCat] || [];
    if (subList.length > 0 && !subList.includes(subCategory)) {
      setSubCategory(subList[0]);
    }
  };

  // Instant Auto-Save for App Modules Toggles
  const handleToggleLeads = async (val: boolean) => {
    setForceShowLeads(val);
    await updateCurrentUserProfile({ forceShowLeads: val });
    window.dispatchEvent(new Event('profileUpdated'));
  };

  const handleToggleAppointment = async (val: boolean) => {
    setForceShowAppointment(val);
    await updateCurrentUserProfile({ forceShowAppointment: val });
    window.dispatchEvent(new Event('profileUpdated'));
  };

  const handleToggleBooking = async (val: boolean) => {
    setForceShowBooking(val);
    await updateCurrentUserProfile({ forceShowBooking: val });
    window.dispatchEvent(new Event('profileUpdated'));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    const res = await updateCurrentUserProfile({
      displayName: name.trim(),
      phone: phone.trim(),
      businessName: company.trim(),
      businessType: businessCategory.trim(),
      businessSubType: subCategory.trim(),
      address: city.trim(),
      aboutUs: bio.trim(),
      country,
      currency,
      timezone,
      forceShowLeads,
      forceShowAppointment,
      forceShowBooking,
      latitude: isNaN(latNum) ? undefined : latNum,
      longitude: isNaN(lngNum) ? undefined : lngNum,
    });

    setSaving(false);

    if (res.error) {
      setError(`Failed to save profile: ${res.error}`);
    } else {
      window.dispatchEvent(new Event('profileUpdated'));
      setMessage('Account profile & business taxonomy configuration saved successfully!');
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const copyBusinessId = () => {
    navigator.clipboard.writeText(businessId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const apiBase = import.meta.env.VITE_API_BASE_URL || '';

  const snippetCode = `<link rel="stylesheet" href="${apiBase}/styles.css">
<script src="${apiBase}/chat-widget.js"
  data-business-id="${businessId}">
</script>`;

  const copySnippet = () => {
    navigator.clipboard.writeText(snippetCode);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  if (loading) {
    return (
      <SectionCard>
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="mt-3 text-xs text-muted-c">Loading user profile & categories from backend database…</p>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-5">
      {/* Personal Account Details Card */}
      <SectionCard>
        <PanelHeader title="Account Profile" desc="Manage your personal account details" icon={<User className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

        {message && (
          <div className="flex items-center gap-2 rounded-xl border border-success-500/20 bg-success-500/10 p-3 text-xs text-success-600 dark:text-success-400 mb-4">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-danger-500/20 bg-danger-500/10 p-3 text-xs text-danger-600 dark:text-danger-400 mb-4">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={name || email} size={80} />
          <div>
            <button className="rounded-lg bg-gradient-accent px-3 py-2 text-xs font-semibold text-white transition-transform hover:scale-105">
              Change Photo
            </button>
            <p className="mt-1.5 text-[11px] text-muted-c">JPG or PNG, max 2MB</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <InputField label="Full Name" icon={User} value={name} onChange={setName} />
          <InputField label="Email (Read-Only)" icon={Mail} value={email} onChange={() => { }} disabled />
          <InputField label="Phone" icon={Phone} value={phone} onChange={setPhone} />
          <InputField label="City / Address" icon={MapPin} value={city} onChange={setCity} />
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-medium text-secondary-c">Bio / About Business</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="form-input resize-none text-xs"
            placeholder="Brief description about yourself or your business…"
          />
        </div>
      </SectionCard>

      {/* Business Information Section Card */}
      <SectionCard>
        <PanelHeader
          title="Business Information"
          desc="Overview of your registered business entity and industry taxonomy"
          icon={<Briefcase className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
        />

        <div className="space-y-4 pt-1">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-secondary-c">Business Name</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Gyan VaniAi"
              className="w-full rounded-xl2 border border-base-c bg-card-c py-2.5 px-4 text-xs text-primary-c placeholder:text-muted-c focus:border-primary-500/50 focus:outline-none"
            />
          </div>

          {/* Business Category Dropdown */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-secondary-c">Business Category</label>
            <div className="relative">
              <select
                value={businessCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full appearance-none rounded-xl2 border border-base-c bg-card-c py-2.5 pl-4 pr-10 text-xs text-primary-c focus:border-primary-500/50 focus:outline-none"
              >
                {Object.keys(categoriesMap).map((catName) => (
                  <option key={catName} value={catName}>
                    {catName}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
            </div>
          </div>

          {/* Sub Category Dropdown */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-secondary-c">Sub Category</label>
            <div className="relative">
              <select
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full appearance-none rounded-xl2 border border-base-c bg-card-c py-2.5 pl-4 pr-10 text-xs text-primary-c focus:border-primary-500/50 focus:outline-none"
              >
                {availableSubCategories.length > 0 ? (
                  availableSubCategories.map((subName) => (
                    <option key={subName} value={subName}>
                      {subName}
                    </option>
                  ))
                ) : (
                  <option value={subCategory}>{subCategory}</option>
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Workspace Region & Timezone Card */}
      <SectionCard>
        <PanelHeader
          title="Workspace Region & Timezone"
          desc="Configure your workspace timezone, country, and currency for scheduling and pricing."
          icon={<Navigation className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Timezone Selector */}
          <div className="sm:col-span-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-secondary-c">Workspace Timezone</label>
              <button
                type="button"
                onClick={() => setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata')}
                className="text-[10px] text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                Use Browser Timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
              </button>
            </div>
            <div className="relative">
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full appearance-none rounded-xl2 border border-base-c bg-card-c py-2.5 pl-4 pr-10 text-xs text-primary-c focus:border-primary-500/50 focus:outline-none max-h-60"
              >
                {timezonesList.length > 0 ? (
                  timezonesList.map((tz) => (
                    <option key={tz.id} value={tz.id}>
                      {tz.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Asia/Kolkata">Asia/Kolkata (UTC+05:30)</option>
                    <option value="America/New_York">America/New_York (UTC-05:00)</option>
                    <option value="Europe/London">Europe/London (UTC+00:00)</option>
                  </>
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
            </div>
          </div>

          {/* Country Selector */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-secondary-c">Country / Region</label>
            <div className="relative">
              <select
                value={country}
                onChange={(e) => {
                  const selectedCode = e.target.value;
                  setCountry(selectedCode);
                  const matched = countriesList.find(c => c.code === selectedCode);
                  if (matched) {
                    if (matched.currency) setCurrency(matched.currency);
                    if (matched.defaultTimezone) setTimezone(matched.defaultTimezone);
                  }
                }}
                className="w-full appearance-none rounded-xl2 border border-base-c bg-card-c py-2.5 pl-4 pr-10 text-xs text-primary-c focus:border-primary-500/50 focus:outline-none"
              >
                {countriesList.length > 0 ? (
                  countriesList.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="IN">India (IN)</option>
                    <option value="US">United States (US)</option>
                    <option value="GB">United Kingdom (GB)</option>
                  </>
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
            </div>
          </div>

          {/* Currency Selector */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-secondary-c">Billing Currency</label>
            <div className="relative">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full appearance-none rounded-xl2 border border-base-c bg-card-c py-2.5 pl-4 pr-10 text-xs text-primary-c focus:border-primary-500/50 focus:outline-none"
              >
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="AED">AED (د.إ - UAE Dirham)</option>
                <option value="AUD">AUD ($ - Australian Dollar)</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
            </div>
          </div>
        </div>
      </SectionCard>


      {/* App Modules Section Card with Instant Auto-Save */}
      <SectionCard>
        <PanelHeader
          title="App Modules"
          desc="Enable or disable specific features based on your business needs."
          icon={<SettingsIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
        />

        <div className="space-y-4 pt-2">
          <FieldRow label="Leads & Pipeline Module" desc="Manage customer inquiries and sales pipeline">
            <Toggle checked={forceShowLeads} onChange={handleToggleLeads} />
          </FieldRow>

          <div className="border-t border-base-c" />

          <FieldRow label="Appointments Module" desc="Allow customers to schedule appointments">
            <Toggle checked={forceShowAppointment} onChange={handleToggleAppointment} />
          </FieldRow>

          <div className="border-t border-base-c" />

          <FieldRow label="Bookings Module" desc="Allow customers to book your services">
            <Toggle checked={forceShowBooking} onChange={handleToggleBooking} />
          </FieldRow>
        </div>
      </SectionCard>

      {/* Website Chat Widget Section Card */}
      <SectionCard>
        <PanelHeader
          title="Website Chat Widget"
          desc="Connect your website with AI-powered chat"
          icon={<Bot className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
        />

        <div className="space-y-4">
          {/* Business ID Box */}
          <div className="rounded-xl border border-base-c bg-slate-50/70 dark:bg-ink-850/60 p-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-c">BUSINESS ID</p>
              <p className="font-mono text-xs font-bold text-primary-c mt-0.5 select-all">{businessId}</p>
            </div>
            <button
              type="button"
              onClick={copyBusinessId}
              className="flex items-center gap-1.5 rounded-lg border border-base-c bg-card-c px-3 py-1.5 text-xs font-medium text-secondary-c hover:text-primary-c transition-colors"
            >
              {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedId ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {/* Installation Steps */}
          <div className="space-y-2 text-xs text-secondary-c">
            <div className="flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                1
              </span>
              <span className="font-semibold">Copy Code</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                2
              </span>
              <span className="font-semibold">Paste before closing body tag</span>
            </div>
          </div>

          {/* Code Snippet Box */}
          <div className="relative rounded-xl border border-base-c bg-[#0B141A] p-4 text-xs font-mono text-emerald-300">
            <div className="flex items-center justify-between mb-2 border-b border-white/10 pb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CODE SNIPPET</span>
              <button
                type="button"
                onClick={copySnippet}
                className="flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/30"
              >
                {copiedSnippet ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSnippet ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed overflow-x-auto text-[11px]">
              {snippetCode}
            </pre>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => window.open(`${apiBase}/test.html?businessId=${encodeURIComponent(businessId || '')}`, '_blank')}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 px-4 text-xs font-semibold text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors"
            >
              <Eye className="h-4 w-4" /> Open Live Widget Test Page (test.html)
            </button>
            <button
              type="button"
              onClick={() => setShowDocModal(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-base-c bg-card-c py-2.5 px-4 text-xs font-semibold text-secondary-c hover:text-primary-c hover:border-emerald-500/40"
            >
              <BookOpen className="h-4 w-4 text-emerald-500" /> Documentation
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Business Location Section Card */}
      <SectionCard>
        <PanelHeader
          title="Business Location"
          desc="These coordinates will be used to share your shop location on WhatsApp"
          icon={<MapPin className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
        />

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-secondary-c">Google Maps Link</label>
            <div className="relative">
              <Navigation className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
              <input
                value={mapsLink}
                onChange={(e) => setMapsLink(e.target.value)}
                placeholder="https://www.google.com/maps/..."
                className="w-full rounded-xl2 border border-base-c bg-card-c py-2.5 pl-9 pr-4 text-xs text-primary-c placeholder:text-muted-c"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-secondary-c">Latitude</label>
              <input
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g. 25.5941"
                className="form-input text-xs font-mono"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-secondary-c">Longitude</label>
              <input
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g. 85.1376"
                className="form-input text-xs font-mono"
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Save Action Bar */}
      <SectionCard>
        <SaveBar onSave={handleSave} saving={saving} />
      </SectionCard>

      {/* Website Chat Widget Documentation Modal (Matches User Screenshot 1-to-1) */}
      {showDocModal && (
        <WidgetDocModal businessId={businessId} onClose={() => setShowDocModal(false)} />
      )}
    </div>
  );
}

/* ─── Website Chat Widget Documentation Modal ─── */
function WidgetDocModal({ businessId, onClose }: { businessId: string; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'html' | 'react' | 'cms' | 'attributes'>('html');
  const [copiedDocSnippet, setCopiedDocSnippet] = useState(false);

  const apiBase = import.meta.env.VITE_API_BASE_URL || '';

  const htmlSnippet = `<link rel="stylesheet" href="${apiBase}/styles.css">
<script src="${apiBase}/chat-widget.js"
  data-business-id="${businessId}">
</script>`;

  const reactSnippet = `import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <link rel="stylesheet" href="${apiBase}/styles.css" />
        <Script
          src="${apiBase}/chat-widget.js"
          data-business-id="${businessId}"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}`;

  const copyDocCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDocSnippet(true);
    setTimeout(() => setCopiedDocSnippet(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-xl2 border border-base-c bg-card-c shadow-2xl animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-base-c px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📖</span>
            <div>
              <h3 className="text-base font-bold text-primary-c">Website Chat Widget Documentation</h3>
              <p className="text-xs text-muted-c">Complete integration guide for standard HTML, React, Next.js, WordPress & Shopify</p>
            </div>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation (Matches User Screenshot) */}
        <div className="flex items-center border-b border-base-c bg-slate-50/60 dark:bg-ink-850/40 px-6">
          <button
            onClick={() => setActiveTab('html')}
            className={cx(
              'border-b-2 py-3 px-4 text-xs font-bold transition-all',
              activeTab === 'html' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-secondary-c hover:text-primary-c',
            )}
          >
            HTML / JS
          </button>
          <button
            onClick={() => setActiveTab('react')}
            className={cx(
              'border-b-2 py-3 px-4 text-xs font-bold transition-all',
              activeTab === 'react' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-secondary-c hover:text-primary-c',
            )}
          >
            React / Next.js
          </button>
          <button
            onClick={() => setActiveTab('cms')}
            className={cx(
              'border-b-2 py-3 px-4 text-xs font-bold transition-all',
              activeTab === 'cms' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-secondary-c hover:text-primary-c',
            )}
          >
            WordPress & Shopify
          </button>
          <button
            onClick={() => setActiveTab('attributes')}
            className={cx(
              'border-b-2 py-3 px-4 text-xs font-bold transition-all',
              activeTab === 'attributes' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-secondary-c hover:text-primary-c',
            )}
          >
            Data Attributes
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">

          {/* TAB 1: HTML / JS */}
          {activeTab === 'html' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-primary-c">1. HTML Website Installation</h4>
                <p className="text-xs text-secondary-c mt-1">
                  Paste the following script tag right before the closing <code className="rounded bg-slate-200 dark:bg-ink-800 px-1 font-mono text-emerald-600 dark:text-emerald-400">&lt;/body&gt;</code> tag of your HTML pages:
                </p>
              </div>

              <div className="relative rounded-xl border border-base-c bg-[#0B141A] p-4 text-xs font-mono text-emerald-300 shadow-md">
                <button
                  type="button"
                  onClick={() => copyDocCode(htmlSnippet)}
                  className="absolute right-3 top-3 flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/30"
                >
                  {copiedDocSnippet ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedDocSnippet ? 'Copied!' : 'Copy'}</span>
                </button>
                <pre className="whitespace-pre-wrap leading-relaxed overflow-x-auto text-[11px]">
                  {htmlSnippet}
                </pre>
              </div>

              <div className="rounded-xl border border-base-c bg-slate-50/50 dark:bg-ink-850/40 p-4 space-y-2 text-xs">
                <h5 className="font-bold text-primary-c">How it works:</h5>
                <ul className="space-y-1.5 text-secondary-c">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Automatically renders a floating chat button in the bottom-right corner.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Syncs messages live with your CRM Inbox in real time via WebSockets.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Captures lead names, phone numbers, and inquiry details into your Pipeline.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: React / Next.js */}
          {activeTab === 'react' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-primary-c">2. Next.js & React Integration</h4>
                <p className="text-xs text-secondary-c mt-1">
                  In Next.js App Router or Pages Router, add the widget script via Next.js <code className="rounded bg-slate-200 dark:bg-ink-800 px-1 font-mono text-emerald-600 dark:text-emerald-400">&lt;Script&gt;</code>:
                </p>
              </div>

              <div className="relative rounded-xl border border-base-c bg-[#0B141A] p-4 text-xs font-mono text-emerald-300 shadow-md">
                <button
                  type="button"
                  onClick={() => copyDocCode(reactSnippet)}
                  className="absolute right-3 top-3 flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/30"
                >
                  {copiedDocSnippet ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedDocSnippet ? 'Copied!' : 'Copy'}</span>
                </button>
                <pre className="whitespace-pre-wrap leading-relaxed overflow-x-auto text-[11px]">
                  {reactSnippet}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: WordPress & Shopify */}
          {activeTab === 'cms' && (
            <div className="space-y-4 text-xs text-secondary-c">
              <div className="rounded-xl border border-base-c bg-card-c p-4 space-y-2">
                <h4 className="font-bold text-sm text-primary-c">WordPress Site Installation</h4>
                <ol className="list-decimal list-inside space-y-1 text-secondary-c">
                  <td>Install the free <strong>WPCode</strong> or <strong>Insert Headers and Footers</strong> plugin.</td>
                  <td>Navigate to <strong>Code Snippets → Header & Footer</strong> in your WP Admin sidebar.</td>
                  <td>Paste the HTML script snippet into the <strong>Footer</strong> box and click <strong>Save</strong>.</td>
                </ol>
              </div>

              <div className="rounded-xl border border-base-c bg-card-c p-4 space-y-2">
                <h4 className="font-bold text-sm text-primary-c">Shopify Store Installation</h4>
                <ol className="list-decimal list-inside space-y-1 text-secondary-c">
                  <td>In Shopify Admin, go to <strong>Online Store → Themes</strong>.</td>
                  <td>Click <strong>Actions (...) → Edit code</strong>.</td>
                  <td>Open <code className="font-mono text-emerald-600">theme.liquid</code>, paste the snippet right before <code className="font-mono text-emerald-600">&lt;/body&gt;</code>, and click <strong>Save</strong>.</td>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 4: Data Attributes & Rules */}
          {activeTab === 'attributes' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-primary-c">4. Widget Customization Data Attributes & Rules</h4>
                <p className="text-xs text-secondary-c mt-1">
                  Customize the widget behavior, position, theme, and branding by adding these HTML attributes to your <code className="rounded bg-slate-200 dark:bg-ink-800 px-1 font-mono text-emerald-600 dark:text-emerald-400">&lt;script&gt;</code> tag:
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-base-c bg-card-c">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-base-c bg-slate-100/60 dark:bg-ink-850/60 text-primary-c font-bold">
                      <th className="p-3 font-mono">Attribute</th>
                      <th className="p-3">Required</th>
                      <th className="p-3">Default Value</th>
                      <th className="p-3">Description & Rules</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-c font-mono text-[11px] text-secondary-c">
                    <tr>
                      <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">data-business-id</td>
                      <td className="p-3 text-rose-500 font-bold">REQUIRED</td>
                      <td className="p-3 text-muted-c">None</td>
                      <td className="p-3 font-sans">Your unique Tenant UUID from backend API to route leads to your CRM.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-sky-600 dark:text-sky-400">data-theme</td>
                      <td className="p-3 text-muted-c">Optional</td>
                      <td className="p-3">'auto'</td>
                      <td className="p-3 font-sans">Controls color theme: <code className="text-emerald-600">'light'</code>, <code className="text-emerald-600">'dark'</code>, or <code className="text-emerald-600">'auto'</code>.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-sky-600 dark:text-sky-400">data-position</td>
                      <td className="p-3 text-muted-c">Optional</td>
                      <td className="p-3">'bottom-right'</td>
                      <td className="p-3 font-sans">Screen corner placement: <code className="text-emerald-600">'bottom-right'</code> or <code className="text-emerald-600">'bottom-left'</code>.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-sky-600 dark:text-sky-400">data-primary-color</td>
                      <td className="p-3 text-muted-c">Optional</td>
                      <td className="p-3">Tenant Primary</td>
                      <td className="p-3 font-sans">Custom Hex color (e.g. <code className="text-emerald-600">#10B981</code>) for chat button & headers.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-sky-600 dark:text-sky-400">data-greeting</td>
                      <td className="p-3 text-muted-c">Optional</td>
                      <td className="p-3">Auto AI Greeting</td>
                      <td className="p-3 font-sans">Initial welcome message text displayed when customer opens widget.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t border-base-c px-6 py-4 bg-slate-50/50 dark:bg-ink-850/40">
          <button
            onClick={onClose}
            className="rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 text-xs shadow-md transition-transform hover:scale-105"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function InputField({
  label,
  icon: Icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  label: string;
  icon?: typeof User;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-secondary-c">{label}</label>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cx(
            'w-full rounded-xl2 border border-base-c bg-card-c py-2.5 pr-4 text-xs text-primary-c placeholder:text-muted-c transition-colors focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            Icon ? 'pl-9' : 'pl-4',
            disabled && 'bg-slate-100 dark:bg-ink-850 cursor-not-allowed opacity-75',
          )}
        />
      </div>
    </div>
  );
}
