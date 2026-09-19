import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { cx } from '@/lib/types';
import {
  createWhatsAppTemplate,
  updateWhatsAppTemplate,
  fetchWhatsAppTemplates,
  generateAiWhatsAppTemplate,
  fetchPublishedWhatsAppFlows,
  type WhatsAppTemplateDto,
  type TemplateButtonDto,
  type PublishedWhatsAppFlowDto
} from '@/lib/broadcastsApi';
import {
  Check, Bold, Italic, Strikethrough, Code, Plus, Trash2,
  Image as ImageIcon, Video, File, Globe, Phone, MessageSquare, Loader2, ArrowLeft,
  LayoutTemplate, Settings, MousePointerClick, ChevronLeft, ChevronDown, MoreVertical, Smartphone,
  Sparkles, Lock, Workflow, CheckCircle2, AlertCircle, Search, X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/* ─── Helper: Parse variable indices in order ─── */
function parseVariableIndices(text: string): number[] {
  if (!text) return [];
  const matches = text.match(/\{\{(\d+)\}\}/g) || [];
  const numbers = matches.map(m => parseInt(m.replace(/[^0-9]/g, ''), 10));
  return Array.from(new Set(numbers)).sort((a, b) => a - b);
}

/* ─── Semantic Suggestion Pills ─── */
const SUGGESTED_SAMPLES = [
  'Himanshu',
  'ORD-82914',
  'Acme Corp',
  '25 Dec 2026',
  'Flat 20% OFF',
  '$49.99'
];

/* ─── Top Prioritized Languages (English #1, Hindi #2, followed by top popular) ─── */
export const TOP_POPULAR_LANGUAGES = [
  { code: 'en', name: 'English [en]' },
  { code: 'hi', name: 'Hindi (हिन्दी) [hi]' },
  { code: 'en_US', name: 'English (US) [en_US]' },
  { code: 'en_GB', name: 'English (UK) [en_GB]' },
  { code: 'en_IN', name: 'English (IND) [en_IN]' },
  { code: 'bn', name: 'Bengali (বাংলা) [bn]' },
  { code: 'mr', name: 'Marathi (मराठी) [mr]' },
  { code: 'te', name: 'Telugu (తెలుగు) [te]' },
  { code: 'ta', name: 'Tamil (தமிழ்) [ta]' },
  { code: 'gu', name: 'Gujarati (ગુજરાતી) [gu]' },
  { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ) [pa]' },
  { code: 'es', name: 'Spanish (Español) [es]' },
  { code: 'ar', name: 'Arabic (العربية) [ar]' },
];

/* ─── All Meta WhatsApp Official Supported Languages (Alphabetical) ─── */
export const META_SUPPORTED_LANGUAGES = [
  { code: 'af', name: 'Afrikaans [af]' },
  { code: 'sq', name: 'Albanian [sq]' },
  { code: 'ar', name: 'Arabic [ar]' },
  { code: 'ar_EG', name: 'Arabic (EGY) [ar_EG]' },
  { code: 'ar_AE', name: 'Arabic (UAE) [ar_AE]' },
  { code: 'ar_LB', name: 'Arabic (LBN) [ar_LB]' },
  { code: 'ar_MA', name: 'Arabic (MAR) [ar_MA]' },
  { code: 'ar_QA', name: 'Arabic (QAT) [ar_QA]' },
  { code: 'az', name: 'Azerbaijani [az]' },
  { code: 'be_BY', name: 'Belarusian [be_BY]' },
  { code: 'bn', name: 'Bengali [bn]' },
  { code: 'bn_IN', name: 'Bengali (IND) [bn_IN]' },
  { code: 'bg', name: 'Bulgarian [bg]' },
  { code: 'ca', name: 'Catalan [ca]' },
  { code: 'zh_CN', name: 'Chinese (CHN) [zh_CN]' },
  { code: 'zh_HK', name: 'Chinese (HKG) [zh_HK]' },
  { code: 'zh_TW', name: 'Chinese (TAI) [zh_TW]' },
  { code: 'hr', name: 'Croatian [hr]' },
  { code: 'cs', name: 'Czech [cs]' },
  { code: 'da', name: 'Danish [da]' },
  { code: 'prs_AF', name: 'Dari [prs_AF]' },
  { code: 'nl', name: 'Dutch [nl]' },
  { code: 'nl_BE', name: 'Dutch (BEL) [nl_BE]' },
  { code: 'en', name: 'English [en]' },
  { code: 'en_GB', name: 'English (UK) [en_GB]' },
  { code: 'en_US', name: 'English (US) [en_US]' },
  { code: 'en_AE', name: 'English (UAE) [en_AE]' },
  { code: 'en_AU', name: 'English (AUS) [en_AU]' },
  { code: 'en_CA', name: 'English (CAN) [en_CA]' },
  { code: 'en_GH', name: 'English (GHA) [en_GH]' },
  { code: 'en_IE', name: 'English (IRL) [en_IE]' },
  { code: 'en_IN', name: 'English (IND) [en_IN]' },
  { code: 'en_JAM', name: 'English (JAM) [en_JM]' },
  { code: 'en_MY', name: 'English (MYS) [en_MY]' },
  { code: 'en_NZ', name: 'English (NZL) [en_NZ]' },
  { code: 'en_QA', name: 'English (QAT) [en_QA]' },
  { code: 'en_SG', name: 'English (SGP) [en_SG]' },
  { code: 'en_UG', name: 'English (UGA) [en_UG]' },
  { code: 'en_ZA', name: 'English (ZAF) [en_ZA]' },
  { code: 'et', name: 'Estonian [et]' },
  { code: 'fil', name: 'Filipino [fil]' },
  { code: 'fi', name: 'Finnish [fi]' },
  { code: 'fr', name: 'French [fr]' },
  { code: 'fr_BE', name: 'French (BEL) [fr_BE]' },
  { code: 'fr_CA', name: 'French (CAN) [fr_CA]' },
  { code: 'fr_CH', name: 'French (CHE) [fr_CH]' },
  { code: 'fr_CI', name: 'French (CIV) [fr_CI]' },
  { code: 'fr_MA', name: 'French (MAR) [fr_MA]' },
  { code: 'ka', name: 'Georgian [ka]' },
  { code: 'de', name: 'German [de]' },
  { code: 'de_AT', name: 'German (AUT) [de_AT]' },
  { code: 'de_CH', name: 'German (CHE) [de_CH]' },
  { code: 'el', name: 'Greek [el]' },
  { code: 'gu', name: 'Gujarati [gu]' },
  { code: 'ha', name: 'Hausa [ha]' },
  { code: 'he', name: 'Hebrew [he]' },
  { code: 'hi', name: 'Hindi [hi]' },
  { code: 'hu', name: 'Hungarian [hu]' },
  { code: 'id', name: 'Indonesian [id]' },
  { code: 'ga', name: 'Irish [ga]' },
  { code: 'it', name: 'Italian [it]' },
  { code: 'ja', name: 'Japanese [ja]' },
  { code: 'kn', name: 'Kannada [kn]' },
  { code: 'kk', name: 'Kazakh [kk]' },
  { code: 'rw_RW', name: 'Kinyarwanda [rw_RW]' },
  { code: 'ko', name: 'Korean [ko]' },
  { code: 'ky_KG', name: 'Kyrgyz (Kyrgyzstan) [ky_KG]' },
  { code: 'lo', name: 'Lao [lo]' },
  { code: 'lv', name: 'Latvian [lv]' },
  { code: 'lt', name: 'Lithuanian [lt]' },
  { code: 'mk', name: 'Macedonian [mk]' },
  { code: 'ms', name: 'Malay [ms]' },
  { code: 'ml', name: 'Malayalam [ml]' },
  { code: 'mr', name: 'Marathi [mr]' },
  { code: 'nb', name: 'Norwegian [nb]' },
  { code: 'ps_AF', name: 'Pashto [ps_AF]' },
  { code: 'fa', name: 'Persian [fa]' },
  { code: 'pl', name: 'Polish [pl]' },
  { code: 'pt_BR', name: 'Portuguese (BR) [pt_BR]' },
  { code: 'pt_PT', name: 'Portuguese (POR) [pt_PT]' },
  { code: 'pa', name: 'Punjabi [pa]' },
  { code: 'ro', name: 'Romanian [ro]' },
  { code: 'ru', name: 'Russian [ru]' },
  { code: 'sr', name: 'Serbian [sr]' },
  { code: 'si_LK', name: 'Sinhala [si_LK]' },
  { code: 'sk', name: 'Slovak [sk]' },
  { code: 'sl', name: 'Slovenian [sl]' },
  { code: 'es', name: 'Spanish [es]' },
  { code: 'es_AR', name: 'Spanish (ARG) [es_AR]' },
  { code: 'es_CL', name: 'Spanish (CHL) [es_CL]' },
  { code: 'es_CO', name: 'Spanish (COL) [es_CO]' },
  { code: 'es_CR', name: 'Spanish (CRI) [es_CR]' },
  { code: 'es_DO', name: 'Spanish (DOM) [es_DO]' },
  { code: 'es_EC', name: 'Spanish (ECU) [es_EC]' },
  { code: 'es_HN', name: 'Spanish (HND) [es_HN]' },
  { code: 'es_MX', name: 'Spanish (MEX) [es_MX]' },
  { code: 'es_PA', name: 'Spanish (PAN) [es_PA]' },
  { code: 'es_PE', name: 'Spanish (PER) [es_PE]' },
  { code: 'es_ES', name: 'Spanish (SPA) [es_ES]' },
  { code: 'es_UY', name: 'Spanish (URY) [es_UY]' },
  { code: 'sw', name: 'Swahili [sw]' },
  { code: 'sv', name: 'Swedish [sv]' },
  { code: 'ta', name: 'Tamil [ta]' },
  { code: 'te', name: 'Telugu [te]' },
  { code: 'th', name: 'Thai [th]' },
  { code: 'tr', name: 'Turkish [tr]' },
  { code: 'uk', name: 'Ukrainian [uk]' },
  { code: 'ur', name: 'Urdu [ur]' },
  { code: 'uz', name: 'Uzbek [uz]' },
  { code: 'vi', name: 'Vietnamese [vi]' },
  { code: 'zu', name: 'Zulu [zu]' },
];

/* ─── Searchable & Scrollable Language Dropdown ─── */
function SearchableLanguageDropdown({
  value,
  onChange,
  disabled
}: {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedLang = useMemo(() => {
    return (
      TOP_POPULAR_LANGUAGES.find((l) => l.code === value) ||
      META_SUPPORTED_LANGUAGES.find((l) => l.code === value) || {
        code: value,
        name: value
      }
    );
  }, [value]);

  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase().trim();
    return META_SUPPORTED_LANGUAGES.filter(
      (l) => l.name.toLowerCase().includes(query) || l.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
            setSearchQuery('');
          }
        }}
        className={cx(
          "w-full flex items-center justify-between gap-2 rounded-xl border border-base-c px-4 py-2.5 text-sm transition-all outline-none text-left",
          disabled
            ? "bg-slate-100 dark:bg-ink-900/60 text-muted-c cursor-not-allowed border-dashed"
            : "bg-subtle-c text-primary-c hover:bg-card-c focus:bg-card-c focus:ring-2 focus:ring-primary-500/50 cursor-pointer shadow-2xs"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Globe className="h-4 w-4 shrink-0 text-primary-500" />
          <span className="truncate font-medium">{selectedLang.name}</span>
        </div>
        <ChevronDown
          className={cx(
            "h-4 w-4 shrink-0 text-muted-c transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-xl border border-base-c bg-card-c shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Bar */}
          <div className="p-2 border-b border-base-c bg-subtle-c/50">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-3.5 w-3.5 text-muted-c pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search language or code (e.g. Hindi, en, ar)..."
                className="w-full rounded-lg border border-base-c bg-card-c pl-8 pr-8 py-1.5 text-xs text-primary-c placeholder:text-muted-c outline-none focus:ring-2 focus:ring-primary-500/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-muted-c hover:text-primary-c"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Language List with max 10 visible items & smooth scrolling */}
          <div className="max-h-60 overflow-y-auto p-1.5 scrollbar-thin text-xs space-y-0.5">
            {filteredLanguages ? (
              filteredLanguages.length > 0 ? (
                filteredLanguages.map((lang) => {
                  const isSelected = lang.code === value;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        onChange(lang.code);
                        setIsOpen(false);
                      }}
                      className={cx(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors",
                        isSelected
                          ? "bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-bold"
                          : "text-primary-c hover:bg-subtle-c"
                      )}
                    >
                      <span className="truncate">{lang.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400 shrink-0 ml-2" />}
                    </button>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-muted-c">
                  No languages matching "{searchQuery}"
                </div>
              )
            ) : (
              <>
                {/* Top 10 Popular Section */}
                <div className="px-2.5 py-1 text-[10px] font-bold text-muted-c uppercase tracking-wider">
                  ⭐ Top Languages
                </div>
                {TOP_POPULAR_LANGUAGES.map((lang) => {
                  const isSelected = lang.code === value;
                  return (
                    <button
                      key={`top-${lang.code}`}
                      type="button"
                      onClick={() => {
                        onChange(lang.code);
                        setIsOpen(false);
                      }}
                      className={cx(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors",
                        isSelected
                          ? "bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-bold"
                          : "text-primary-c hover:bg-subtle-c"
                      )}
                    >
                      <span className="truncate">{lang.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}

                {/* All Languages Section */}
                <div className="px-2.5 pt-2.5 pb-1 text-[10px] font-bold text-muted-c uppercase tracking-wider border-t border-base-c mt-1.5">
                  🌐 All Languages (A-Z)
                </div>
                {META_SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = lang.code === value;
                  return (
                    <button
                      key={`all-${lang.code}`}
                      type="button"
                      onClick={() => {
                        onChange(lang.code);
                        setIsOpen(false);
                      }}
                      className={cx(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors",
                        isSelected
                          ? "bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-bold"
                          : "text-primary-c hover:bg-subtle-c"
                      )}
                    >
                      <span className="truncate">{lang.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── WhatsApp Text Formatter with Sample Substitution ─── */
function renderWhatsAppFormattedText(text: string, samples: string[] = []) {
  if (!text) return <span className="text-slate-400 italic">Message content preview...</span>;

  const lines = text.split('\n');

  return lines.map((line, lIdx) => {
    const parts: (string | JSX.Element)[] = [];
    const regex = /(\{\{\d+\}\})|(\*[^*]+\*)|(_[^_]+_)|(~[^~]+~)|(`[^`]+`)/g;
    let match;
    let lastIdx = 0;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIdx) {
        parts.push(line.substring(lastIdx, match.index));
      }

      const val = match[0];
      if (val.startsWith('{{')) {
        const varNum = parseInt(val.replace(/[^0-9]/g, ''), 10);
        const sampleVal = samples[varNum - 1];
        parts.push(
          <span
            key={match.index}
            className={cx(
              "mx-0.5 inline-block rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold transition-all border",
              sampleVal && sampleVal.trim()
                ? "bg-emerald-100 text-emerald-900 border-emerald-300 font-sans"
                : "bg-amber-100 text-amber-900 border-amber-300"
            )}
            title={`Variable ${val}${sampleVal ? ` → "${sampleVal}"` : ' (No sample provided)'}`}
          >
            {sampleVal && sampleVal.trim() ? sampleVal : val}
          </span>
        );
      } else if (val.startsWith('*') && val.endsWith('*')) {
        parts.push(<strong key={match.index} className="font-bold text-slate-900">{val.slice(1, -1)}</strong>);
      } else if (val.startsWith('_') && val.endsWith('_')) {
        parts.push(<em key={match.index} className="italic text-slate-800">{val.slice(1, -1)}</em>);
      } else if (val.startsWith('~') && val.endsWith('~')) {
        parts.push(<del key={match.index} className="line-through text-slate-500">{val.slice(1, -1)}</del>);
      } else if (val.startsWith('`') && val.endsWith('`')) {
        parts.push(<code key={match.index} className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-pink-600 border border-slate-200">{val.slice(1, -1)}</code>);
      }

      lastIdx = match.index + val.length;
    }
    if (lastIdx < line.length) {
      parts.push(line.substring(lastIdx));
    }
    return (
      <span key={lIdx}>
        {parts}
        {lIdx < lines.length - 1 && <br />}
      </span>
    );
  });
}

export default function CreateTemplateView() {
  const { user } = useAuth();
  const isPremium =
    user?.isSuperAdmin === true ||
    user?.role === 'SUPER_ADMIN' ||
    user?.planType?.toUpperCase() === 'PRO' ||
    user?.planType?.toUpperCase() === 'ENTERPRISE';
  const navigate = useNavigate();
  const { templateName } = useParams<{ templateName?: string }>();
  const location = useLocation();
  const locationState = location.state as { template?: WhatsAppTemplateDto } | undefined;
  const isEditMode = Boolean(templateName || locationState?.template);

  // Basic Template Info
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING');
  const [language, setLanguage] = useState('en');

  // Media & Header
  const [mediaSample, setMediaSample] = useState<'NONE' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'>('NONE');
  const [headerType, setHeaderType] = useState<'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO'>('NONE');
  const [headerContent, setHeaderContent] = useState('');
  const [headerSampleValues, setHeaderSampleValues] = useState<string[]>(['']);

  // Body & Footer
  const [bodyText, setBodyText] = useState('');
  const [bodySampleValues, setBodySampleValues] = useState<string[]>([]);
  const [footerText, setFooterText] = useState('');

  // Action Buttons
  const [buttonsList, setButtonsList] = useState<TemplateButtonDto[]>([]);

  // Published Flows for WhatsApp Flow buttons
  const [publishedFlows, setPublishedFlows] = useState<PublishedWhatsAppFlowDto[]>([]);
  const [loadingFlows, setLoadingFlows] = useState(false);

  // Form State
  const [submitting, setSubmitting] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Pre-populate data when in Edit Mode
  useEffect(() => {
    if (!isEditMode) return;

    const populateFromTemplate = (tpl: WhatsAppTemplateDto) => {
      setName(tpl.name || '');
      setCategory((tpl.category as 'MARKETING' | 'UTILITY' | 'AUTHENTICATION') || 'MARKETING');
      setLanguage(tpl.language || 'en_US');

      const hType = (tpl.headerType || 'NONE').toUpperCase();
      if (hType === 'IMAGE' || hType === 'VIDEO' || hType === 'DOCUMENT') {
        setMediaSample(hType as 'IMAGE' | 'VIDEO' | 'DOCUMENT');
        setHeaderType(hType as any);
      } else if (hType === 'TEXT') {
        setHeaderType('TEXT');
        setHeaderContent(tpl.headerContent || '');
        setHeaderSampleValues(tpl.headerSampleValues && tpl.headerSampleValues.length > 0 ? tpl.headerSampleValues : ['']);
      } else {
        setHeaderType('NONE');
        setMediaSample('NONE');
      }

      setBodyText(tpl.bodyText || '');
      if (tpl.bodySampleValues && tpl.bodySampleValues.length > 0) {
        setBodySampleValues(tpl.bodySampleValues);
      }
      setFooterText(tpl.footerText || '');
      if (tpl.buttons && Array.isArray(tpl.buttons)) {
        setButtonsList(tpl.buttons);
      }
    };

    if (locationState?.template) {
      populateFromTemplate(locationState.template);
    } else if (templateName) {
      const decoded = decodeURIComponent(templateName);
      fetchWhatsAppTemplates().then(res => {
        if (res.data) {
          const match = res.data.find(t => t.name.toLowerCase() === decoded.toLowerCase() || t.name.toLowerCase() === templateName.toLowerCase());
          if (match) populateFromTemplate(match);
        }
      });
    }
  }, [isEditMode, templateName, locationState]);

  // Fetch published flows on mount
  useEffect(() => {
    let active = true;
    setLoadingFlows(true);
    fetchPublishedWhatsAppFlows()
      .then(res => {
        if (active) {
          if (res.data) setPublishedFlows(res.data);
          setLoadingFlows(false);
        }
      })
      .catch(() => {
        if (active) setLoadingFlows(false);
      });
    return () => { active = false; };
  }, []);

  // Detect Body Variables
  const detectedBodyVars = useMemo(() => parseVariableIndices(bodyText), [bodyText]);
  const detectedHeaderVars = useMemo(() => {
    if (headerType === 'TEXT' && headerContent) {
      return parseVariableIndices(headerContent);
    }
    return [];
  }, [headerType, headerContent]);

  // Sync bodySampleValues length with detected variables
  useEffect(() => {
    const maxVar = detectedBodyVars.length > 0 ? Math.max(...detectedBodyVars) : 0;
    setBodySampleValues(prev => {
      const next = [...prev];
      while (next.length < maxVar) {
        const idx = next.length + 1;
        const suggestion = SUGGESTED_SAMPLES[(idx - 1) % SUGGESTED_SAMPLES.length] || `Value ${idx}`;
        next.push(suggestion);
      }
      return next;
    });
  }, [detectedBodyVars]);

  // Pre-flight checks
  const nameValid = /^[a-z0-9_]{1,512}$/.test(name.trim());
  const bodyValid = bodyText.trim().length > 0 && bodyText.length <= 1024;
  
  // Body sequential validation
  const bodyVarsSequential = detectedBodyVars.length === 0 || (
    detectedBodyVars[0] === 1 &&
    detectedBodyVars.every((v, i) => v === i + 1)
  );

  // Body samples filled
  const bodySamplesComplete = detectedBodyVars.length === 0 || (
    detectedBodyVars.every(v => !!(bodySampleValues[v - 1] && bodySampleValues[v - 1].trim()))
  );

  // Header variable check (Max 1 variable in text header)
  const headerVarsValid = detectedHeaderVars.length <= 1;
  const headerSamplesComplete = detectedHeaderVars.length === 0 || !!(headerSampleValues[0] && headerSampleValues[0].trim());

  // Buttons checks
  const flowButtons = buttonsList.filter(b => b.type === 'FLOW');
  const urlButtons = buttonsList.filter(b => b.type === 'URL');
  const flowCountValid = flowButtons.length <= 1;
  const urlCountValid = urlButtons.length <= 2;
  const buttonLabelsValid = buttonsList.every(b => b.text.trim().length > 0 && b.text.trim().length <= 25);
  
  // Dynamic URL & Sample validation
  const dynamicUrlsValid = urlButtons.every(b => {
    const isDynamic = b.url?.includes('{{1}}');
    if (isDynamic) {
      return !!b.urlSample && b.urlSample.trim().length > 0 &&
        (b.urlSample.startsWith('http://') || b.urlSample.startsWith('https://'));
    }
    return !!b.url && (b.url.startsWith('http://') || b.url.startsWith('https://'));
  });

  // Flow button validation
  const flowsValid = flowButtons.every(b => !!b.flowId && b.flowId.trim().length > 0);

  // Overall readiness
  const isFormReady = nameValid && bodyValid && bodyVarsSequential && bodySamplesComplete &&
    headerVarsValid && headerSamplesComplete && flowCountValid && urlCountValid &&
    buttonLabelsValid && dynamicUrlsValid && flowsValid;

  const canSubmit = isFormReady && !submitting;

  const insertFormatting = (prefix: string, suffix = prefix) => {
    const input = bodyRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = bodyText.substring(start, end) || 'text';
    const replacement = `${prefix}${selected}${suffix}`;

    const newText = bodyText.substring(0, start) + replacement + bodyText.substring(end);
    setBodyText(newText);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  const insertVariable = () => {
    const matches = bodyText.match(/\{\{\d+\}\}/g) || [];
    const nextVarNum = matches.length + 1;
    const varTag = `{{${nextVarNum}}}`;

    const input = bodyRef.current;
    if (input) {
      const start = input.selectionStart;
      const newText = bodyText.substring(0, start) + varTag + bodyText.substring(start);
      setBodyText(newText);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + varTag.length, start + varTag.length);
      }, 50);
    } else {
      setBodyText((prev) => prev + varTag);
    }
  };

  const handleAddButton = (type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'FLOW') => {
    if (buttonsList.length >= 3) return;

    if (type === 'QUICK_REPLY') {
      setButtonsList((prev) => [...prev, { type: 'QUICK_REPLY', text: '' }]);
    } else if (type === 'URL') {
      if (urlButtons.length >= 2) {
        alert("Meta allows a maximum of 2 URL buttons.");
        return;
      }
      setButtonsList((prev) => [...prev, { type: 'URL', text: '', url: 'https://' }]);
    } else if (type === 'PHONE_NUMBER') {
      setButtonsList((prev) => [...prev, { type: 'PHONE_NUMBER', text: '', phoneNumber: '+91' }]);
    } else if (type === 'FLOW') {
      if (flowButtons.length >= 1) {
        alert("Meta allows a maximum of 1 Flow button per template.");
        return;
      }
      const firstFlow = publishedFlows[0];
      setButtonsList((prev) => [
        ...prev,
        {
          type: 'FLOW',
          text: 'Open Flow',
          flowId: firstFlow ? firstFlow.metaFlowId : '',
          flowAction: 'navigate',
          navigateScreen: 'FIRST_SCREEN'
        }
      ]);
    }
  };

  const handleRemoveButton = (index: number) => {
    setButtonsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateButton = (index: number, field: keyof TemplateButtonDto, value: any) => {
    setButtonsList((prev) =>
      prev.map((btn, i) => (i === index ? { ...btn, [field]: value } : btn)),
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    if (!bodyVarsSequential) {
      alert("Body variables must start at {{1}} and be sequential with no missing numbers.");
      return;
    }

    if (!headerVarsValid) {
      alert("Header text can contain at most one variable ({{1}}).");
      return;
    }

    setSubmitting(true);

    const formattedName = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const validButtons = buttonsList
      .filter((b) => b.text.trim().length > 0)
      .map((b) => {
        if (b.type === 'FLOW') {
          return {
            type: 'FLOW',
            text: b.text.trim(),
            flowId: b.flowId?.trim(),
            flowAction: b.flowAction || 'navigate',
            navigateScreen: b.navigateScreen?.trim() || 'FIRST_SCREEN',
          };
        }
        if (b.type === 'URL') {
          const isDyn = b.url?.includes('{{1}}');
          return {
            type: 'URL',
            text: b.text.trim(),
            url: b.url?.trim(),
            urlSample: isDyn ? b.urlSample?.trim() : undefined,
          };
        }
        if (b.type === 'PHONE_NUMBER') {
          return {
            type: 'PHONE_NUMBER',
            text: b.text.trim(),
            phoneNumber: b.phoneNumber?.trim(),
          };
        }
        return {
          type: 'QUICK_REPLY',
          text: b.text.trim(),
        };
      });

    const dto: WhatsAppTemplateDto = {
      name: formattedName,
      category,
      language,
      headerType: mediaSample !== 'NONE' ? mediaSample : headerType,
      headerContent: headerType === 'TEXT' ? headerContent.trim() : undefined,
      headerSampleValues: detectedHeaderVars.length > 0 ? headerSampleValues.slice(0, 1) : undefined,
      bodyText: bodyText.trim(),
      bodySampleValues: detectedBodyVars.length > 0 ? detectedBodyVars.map((_, i) => bodySampleValues[i] || `Sample_${i + 1}`) : undefined,
      footerText: footerText.trim() || undefined,
      buttons: validButtons.length > 0 ? validButtons : undefined,
    };

    const res = isEditMode
      ? await updateWhatsAppTemplate(formattedName, dto)
      : await createWhatsAppTemplate(dto);
    setSubmitting(false);

    if (res.error) {
      alert(`Failed to ${isEditMode ? 'update' : 'create'} template: ${res.error}`);
      return;
    }
    if (res.data) {
      navigate('/broadcasts');
    }
  };

  const handleGenerateAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    const res = await generateAiWhatsAppTemplate(aiPrompt.trim());
    setAiLoading(false);

    if (res.error) {
      alert(`AI Generation Failed: ${res.error}`);
      return;
    }

    if (res.data) {
      if (res.data.name && !isEditMode) {
        const sanitized = res.data.name
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
        if (sanitized) setName(sanitized);
      } else if (!isEditMode) {
        const words = (res.data.bodyText || aiPrompt)
          .toLowerCase()
          .replace(/\{\{\d+\}\}/g, '')
          .replace(/[^a-z0-9\s]/g, ' ')
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 3)
          .join('_');
        const fallbackSlug = words || 'template';
        setName(`${fallbackSlug}_v${Math.floor(1000 + Math.random() * 9000)}`);
      }
      if (res.data.category) {
        setCategory(res.data.category as 'MARKETING' | 'UTILITY' | 'AUTHENTICATION');
      }
      if (res.data.language && !isEditMode) {
        setLanguage(res.data.language);
      } else if (!isEditMode && res.data.bodyText) {
        const hasHindi = /[\u0900-\u097F]/.test(res.data.bodyText) || aiPrompt.toLowerCase().includes('hindi');
        if (hasHindi) setLanguage('hi');
      }
      if (res.data.headerContent) {
        setHeaderType('TEXT');
        setHeaderContent(res.data.headerContent);
      }
      if (res.data.bodyText) setBodyText(res.data.bodyText);
      if (res.data.footerText) setFooterText(res.data.footerText);
      if (res.data.buttons && res.data.buttons.length > 0) {
        const mappedButtons = res.data.buttons.slice(0, 3).map((b) => ({
          ...b,
          phoneNumber: (b as any).phone_number || b.phoneNumber || (b.type === 'PHONE_NUMBER' ? '+919876543210' : undefined),
          url: (b as any).url || (b.type === 'URL' ? 'https://example.com' : undefined),
        }));
        setButtonsList(mappedButtons);
      } else {
        setButtonsList([]);
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full min-w-0 bg-base-c text-primary-c overflow-hidden">
      {/* Top Bar Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-base-c bg-card-c px-6 lg:px-8 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/broadcasts')} 
            className="flex h-9 w-9 items-center justify-center rounded-full border border-base-c text-secondary-c hover:bg-subtle-c hover:text-primary-c transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-primary-c">
                {isEditMode ? 'Edit WhatsApp Template' : 'Create WhatsApp Template'}
              </h1>
              {isEditMode && (
                <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  Editing Live Template
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-muted-c">
              {isEditMode 
                ? 'Modify template components, variable sample parameters, and re-submit to Meta review.' 
                : 'Design, configure sample parameters, and submit for Meta approval.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/broadcasts')} 
            className="rounded-lg px-5 py-2 text-sm font-semibold text-secondary-c hover:bg-subtle-c transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cx(
              'flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold shadow-sm transition-all',
              canSubmit 
                ? 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-ink-800 dark:text-slate-600'
            )}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditMode ? 'Save & Submit Changes' : 'Submit Template'}
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <div className="grid flex-1 min-w-0 overflow-hidden lg:grid-cols-[1fr_390px] xl:grid-cols-[1fr_430px]">
        
        {/* Left Column: Form Controls (Cleanly aligned without massive outer margins) */}
        <div className="min-w-0 overflow-y-auto p-6 lg:p-8 space-y-8 scrollbar-thin">
          <div className="w-full max-w-4xl space-y-8">

            {/* Meta Policy Notice in Edit Mode */}
            {isEditMode && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 flex items-start gap-4 text-xs shadow-xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-amber-950 dark:text-amber-100">
                      Meta Template Re-Review Notice
                    </h4>
                    <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                      Policy Rule
                    </span>
                  </div>
                  <p className="text-amber-900/90 dark:text-amber-200/90 leading-relaxed text-xs">
                    Under Meta Cloud API guidelines, modifying this template will update its components on Meta Graph API and re-initiate Meta review. The template status will transition to <strong className="text-amber-950 dark:text-amber-100">PENDING</strong> until approved.
                  </p>
                  <div className="flex items-center gap-4 pt-1 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                    <span className="flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Template Name Locked
                    </span>
                    <span className="flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Language Locked
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* AI Generator Section */}
            {isPremium ? (
              <section className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-primary-c">Generate with AI Builder</h3>
                    <p className="text-xs text-secondary-c">Let AI craft a Meta-compliant template with parameters and quick actions.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Write a promotional template for 20% off summer sale with tracking link..."
                    className="flex-1 rounded-xl border border-base-c bg-card-c px-4 py-2.5 text-sm text-primary-c focus:ring-2 focus:ring-primary-500/50 outline-none"
                    disabled={aiLoading}
                  />
                  <button
                    onClick={handleGenerateAi}
                    disabled={!aiPrompt.trim() || aiLoading}
                    className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {aiLoading ? 'Generating...' : 'Generate AI'}
                  </button>
                </div>
              </section>
            ) : (
              <section className="surface rounded-2xl p-5 border border-amber-200/50 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-900/10 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400">AI Builder Locked</h3>
                    <p className="text-xs text-secondary-c">Upgrade to PRO plan to unlock AI-powered template generation and automatic variable structuring.</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/settings?tab=billing')}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors"
                >
                  Upgrade to PRO
                </button>
              </section>
            )}

            {/* Template Identity Section */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <Settings className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-primary-c">Template Identity</h3>
                  <p className="text-xs text-secondary-c">Specify internal name, category, and language for Meta submission.</p>
                </div>
              </div>

              <div className="surface rounded-2xl p-6 space-y-5 shadow-sm border border-base-c">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-semibold text-primary-c">Template Name</label>
                      {!isEditMode && (
                        <button
                          type="button"
                          onClick={() => {
                            const words = (aiPrompt || bodyText || 'campaign_notice')
                              .toLowerCase()
                              .replace(/\{\{\d+\}\}/g, '')
                              .replace(/[^a-z0-9\s]/g, ' ')
                              .trim()
                              .split(/\s+/)
                              .filter(Boolean)
                              .slice(0, 3)
                              .join('_');
                            const slug = words || 'template';
                            setName(`${slug}_v${Math.floor(1 + Math.random() * 9)}`);
                          }}
                          className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-600 hover:bg-primary-100 dark:bg-primary-950/40 dark:text-primary-400 transition-colors"
                          title="Generate a template name"
                        >
                          <Sparkles className="h-3 w-3" /> Auto Name
                        </button>
                      )}
                      {isEditMode && (
                        <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                          (Locked per Meta Policy)
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-muted-c">
                      {name.length}/512 {nameValid && <Check className="inline-block h-3.5 w-3.5 text-emerald-500 ml-1" />}
                    </span>
                  </div>
                  <input
                    value={name}
                    onChange={(e) => !isEditMode && setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                    disabled={isEditMode}
                    placeholder="e.g. order_update_v1"
                    className={cx(
                      "w-full rounded-xl border border-base-c px-4 py-2.5 text-sm font-mono transition-all outline-none",
                      isEditMode
                        ? "bg-slate-100 dark:bg-ink-900/60 text-muted-c cursor-not-allowed border-dashed"
                        : "bg-subtle-c text-primary-c focus:bg-card-c focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                    )}
                  />
                  <p className="mt-2 text-xs text-muted-c">
                    {isEditMode 
                      ? "Template name is permanently locked by Meta Graph API policy." 
                      : "Only lowercase letters, numbers, and underscores are allowed by Meta."}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-primary-c">Category</label>
                    <select 
                      value={category} 
                      onChange={(e) => setCategory(e.target.value as 'MARKETING' | 'UTILITY' | 'AUTHENTICATION')} 
                      className="w-full rounded-xl border border-base-c bg-subtle-c px-4 py-2.5 text-sm text-primary-c focus:bg-card-c focus:ring-2 focus:ring-primary-500/50 outline-none cursor-pointer"
                    >
                      <option value="MARKETING">Marketing (Promos, Offers)</option>
                      <option value="UTILITY">Utility (Updates, Alerts)</option>
                      <option value="AUTHENTICATION">Authentication (OTPs)</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-primary-c">Language</label>
                      {isEditMode && (
                        <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                          (Locked)
                        </span>
                      )}
                    </div>
                    <SearchableLanguageDropdown 
                      value={language} 
                      onChange={setLanguage} 
                      disabled={isEditMode}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Message Content Section */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <LayoutTemplate className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-primary-c">Message Content</h3>
                  <p className="text-xs text-secondary-c">Design the header, body, and footer of your WhatsApp template.</p>
                </div>
              </div>
              
              <div className="surface rounded-2xl shadow-sm border border-base-c overflow-hidden p-6 space-y-6">
                {/* Media Header Selector */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-primary-c">Header Media (Optional)</label>
                  <select 
                    value={mediaSample} 
                    onChange={(e) => setMediaSample(e.target.value as 'NONE' | 'IMAGE' | 'VIDEO' | 'DOCUMENT')} 
                    className="w-full rounded-xl border border-base-c bg-subtle-c px-4 py-2.5 text-sm text-primary-c focus:bg-card-c focus:ring-2 focus:ring-primary-500/50 outline-none cursor-pointer"
                  >
                    <option value="NONE">No Media (Text or None)</option>
                    <option value="IMAGE">Image Header</option>
                    <option value="VIDEO">Video Header</option>
                    <option value="DOCUMENT">Document Header</option>
                  </select>
                </div>

                {/* Text Header */}
                {mediaSample === 'NONE' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-primary-c">Text Header (Optional)</label>
                      <span className="text-xs font-medium text-muted-c">{headerContent.length}/60</span>
                    </div>
                    <input
                      value={headerContent}
                      onChange={(e) => {
                        setHeaderContent(e.target.value);
                        if (e.target.value.trim() && headerType === 'NONE') setHeaderType('TEXT');
                      }}
                      placeholder="e.g. Special Offer for {{1}}!"
                      className="w-full rounded-xl border border-base-c bg-subtle-c px-4 py-2.5 text-sm text-primary-c focus:bg-card-c focus:ring-2 focus:ring-primary-500/50 transition-all outline-none"
                    />
                    {detectedHeaderVars.length > 0 && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          <span>Header Variable Sample Required by Meta</span>
                          <span>{headerSampleValues[0]?.trim() ? '✓ Valid' : 'Required'}</span>
                        </div>
                        <input
                          value={headerSampleValues[0] || ''}
                          onChange={(e) => setHeaderSampleValues([e.target.value])}
                          placeholder="Sample for header {{1}} (e.g. Himanshu)"
                          className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs text-primary-c focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-ink-900"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Body Editor */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-primary-c">Body Message <span className="text-danger-500">*</span></label>
                    <span className="text-xs font-medium text-muted-c">{bodyText.length}/1024</span>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-base-c focus-within:ring-2 focus-within:ring-primary-500/50 focus-within:border-primary-500 transition-all">
                    {/* Editor Toolbar */}
                    <div className="flex items-center justify-between bg-subtle-c border-b border-base-c px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => insertFormatting('*')} className="p-1.5 rounded-lg text-secondary-c hover:bg-card-c hover:text-primary-c transition-colors" title="Bold"><Bold className="h-4 w-4" /></button>
                        <button type="button" onClick={() => insertFormatting('_')} className="p-1.5 rounded-lg text-secondary-c hover:bg-card-c hover:text-primary-c transition-colors" title="Italic"><Italic className="h-4 w-4" /></button>
                        <button type="button" onClick={() => insertFormatting('~')} className="p-1.5 rounded-lg text-secondary-c hover:bg-card-c hover:text-primary-c transition-colors" title="Strikethrough"><Strikethrough className="h-4 w-4" /></button>
                        <div className="w-px h-4 bg-border-base mx-1" />
                        <button type="button" onClick={() => insertFormatting('`')} className="p-1.5 rounded-lg text-secondary-c hover:bg-card-c hover:text-primary-c transition-colors" title="Monospace"><Code className="h-4 w-4" /></button>
                      </div>
                      <button
                        type="button"
                        onClick={insertVariable}
                        className="flex items-center gap-1.5 rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-600 hover:bg-primary-100 transition-colors dark:bg-primary-500/10 dark:text-primary-400"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Variable
                      </button>
                    </div>
                    <textarea
                      ref={bodyRef}
                      value={bodyText}
                      onChange={(e) => setBodyText(e.target.value)}
                      rows={6}
                      placeholder="Type your message here. Personalize with variables like Hello {{1}}, your order {{2}} is ready!"
                      className="w-full bg-card-c p-4 text-sm leading-relaxed text-primary-c outline-none resize-y"
                    />
                  </div>
                </div>

                {/* Body Variables Sample Values Configurator */}
                {detectedBodyVars.length > 0 && (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-950/40 dark:bg-indigo-950/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                          {detectedBodyVars.length}
                        </span>
                        <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                          Meta Variable Sample Values ({detectedBodyVars.length} detected)
                        </span>
                      </div>
                      {!bodyVarsSequential && (
                        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Non-sequential variable numbering
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-secondary-c">
                      Meta requires realistic sample values for every variable before approving your template.
                    </p>

                    <div className="space-y-3">
                      {detectedBodyVars.map((varNum) => {
                        const valIdx = varNum - 1;
                        const currentVal = bodySampleValues[valIdx] || '';
                        return (
                          <div key={varNum} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-card-c p-3 rounded-lg border border-base-c">
                            <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 font-mono text-xs font-bold shrink-0">
                              {`{{${varNum}}}`}
                            </span>
                            <div className="flex-1 w-full flex items-center gap-2">
                              <input
                                value={currentVal}
                                onChange={(e) => {
                                  const next = [...bodySampleValues];
                                  next[valIdx] = e.target.value;
                                  setBodySampleValues(next);
                                }}
                                placeholder={`Sample for {{${varNum}}} (e.g. John Doe)`}
                                className="flex-1 rounded-md border border-base-c bg-subtle-c px-3 py-1.5 text-xs text-primary-c focus:bg-card-c focus:ring-1 focus:ring-primary-500 outline-none"
                              />
                              <div className="hidden md:flex items-center gap-1">
                                {SUGGESTED_SAMPLES.slice(0, 3).map((pill) => (
                                  <button
                                    key={pill}
                                    type="button"
                                    onClick={() => {
                                      const next = [...bodySampleValues];
                                      next[valIdx] = pill;
                                      setBodySampleValues(next);
                                    }}
                                    className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-ink-800 dark:text-slate-400 rounded px-1.5 py-0.5 transition-colors"
                                  >
                                    {pill}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Footer Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-primary-c">Footer (Optional)</label>
                    <span className="text-xs font-medium text-muted-c">{footerText.length}/60</span>
                  </div>
                  <input
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    placeholder="e.g. Reply STOP to opt-out"
                    className="w-full rounded-xl border border-base-c bg-subtle-c px-4 py-2.5 text-sm text-primary-c focus:bg-card-c focus:ring-2 focus:ring-primary-500/50 transition-all outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Action Buttons Section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
                    <MousePointerClick className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-primary-c">Interactive Action Buttons</h3>
                    <p className="text-xs text-secondary-c">Add up to 3 buttons: Quick replies, Call buttons, Dynamic Tracking URLs, or WhatsApp Flows.</p>
                  </div>
                </div>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
                  {buttonsList.length} / 3 Allowed
                </span>
              </div>

              <div className="surface rounded-2xl shadow-sm border border-base-c p-6 space-y-6">
                {/* Buttons Toolbar */}
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleAddButton('QUICK_REPLY')}
                    disabled={buttonsList.length >= 3}
                    className={cx(
                      'flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all',
                      buttonsList.length < 3 
                        ? 'border-base-c bg-card-c hover:border-emerald-400 hover:text-emerald-600 hover:shadow-sm' 
                        : 'border-base-c bg-subtle-c opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Plus className="h-3.5 w-3.5" /> Quick Reply
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleAddButton('URL')}
                    disabled={buttonsList.length >= 3 || urlButtons.length >= 2}
                    className={cx(
                      'flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all',
                      buttonsList.length < 3 && urlButtons.length < 2
                        ? 'border-base-c bg-card-c hover:border-sky-400 hover:text-sky-600 hover:shadow-sm' 
                        : 'border-base-c bg-subtle-c opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Globe className="h-3.5 w-3.5" /> Link (Static/Dynamic)
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleAddButton('PHONE_NUMBER')}
                    disabled={buttonsList.length >= 3}
                    className={cx(
                      'flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all',
                      buttonsList.length < 3 
                        ? 'border-base-c bg-card-c hover:border-purple-400 hover:text-purple-600 hover:shadow-sm' 
                        : 'border-base-c bg-subtle-c opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Phone className="h-3.5 w-3.5" /> Call Button
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddButton('FLOW')}
                    disabled={buttonsList.length >= 3 || flowButtons.length >= 1}
                    className={cx(
                      'flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all',
                      buttonsList.length < 3 && flowButtons.length < 1
                        ? 'border-violet-300 bg-violet-50 text-violet-700 hover:border-violet-500 hover:bg-violet-100 hover:shadow-sm dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800'
                        : 'border-base-c bg-subtle-c opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Workflow className="h-3.5 w-3.5 text-violet-600" /> WhatsApp Flow
                  </button>
                </div>

                {/* Configured Buttons List */}
                {buttonsList.length > 0 && (
                  <div className="space-y-4 pt-2">
                    {buttonsList.map((btn, idx) => {
                      const isDynamicUrl = btn.type === 'URL' && btn.url?.includes('{{1}}');

                      return (
                        <div key={idx} className="rounded-xl border border-base-c bg-subtle-c p-4 relative group transition-colors hover:border-primary-300 space-y-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveButton(idx)}
                            className="absolute -right-2 -top-2 rounded-full bg-card-c border border-base-c p-1.5 text-secondary-c hover:text-danger-500 hover:border-danger-200 shadow-sm transition-all opacity-0 group-hover:opacity-100 z-10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          
                          <div className="flex items-center justify-between">
                            <span className={cx(
                              "text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider",
                              btn.type === 'FLOW' ? "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200" :
                              btn.type === 'URL' ? "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-200" :
                              btn.type === 'PHONE_NUMBER' ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200" :
                              "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200"
                            )}>
                              {btn.type.replace('_', ' ')}
                            </span>
                            <span className="text-[11px] text-muted-c font-medium">
                              Text: {btn.text.length}/25 chars
                            </span>
                          </div>

                          {/* Button Label Input */}
                          <div>
                            <input
                              value={btn.text}
                              onChange={(e) => handleUpdateButton(idx, 'text', e.target.value.slice(0, 25))}
                              placeholder="Button Label (Max 25 characters)"
                              className="w-full rounded-lg border border-base-c bg-card-c px-3 py-2 text-xs font-semibold text-primary-c focus:border-primary-500 outline-none"
                            />
                          </div>

                          {/* URL Button Configuration */}
                          {btn.type === 'URL' && (
                            <div className="space-y-3 pt-1 border-t border-base-c">
                              <div className="flex items-center gap-4 text-xs font-medium text-secondary-c">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`url_mode_${idx}`}
                                    checked={!isDynamicUrl}
                                    onChange={() => {
                                      const cleanUrl = (btn.url || 'https://example.com').replace(/\{\{1\}\}/g, '').replace(/\/+$/, '');
                                      handleUpdateButton(idx, 'url', cleanUrl || 'https://');
                                      handleUpdateButton(idx, 'urlSample', undefined);
                                    }}
                                    className="text-primary-600 focus:ring-primary-500"
                                  />
                                  <span>Static URL</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`url_mode_${idx}`}
                                    checked={Boolean(isDynamicUrl)}
                                    onChange={() => {
                                      const base = (btn.url || 'https://example.com').replace(/\{\{1\}\}/g, '').replace(/\/+$/, '');
                                      handleUpdateButton(idx, 'url', `${base}/{{1}}`);
                                      handleUpdateButton(idx, 'urlSample', `${base}/track_12345`);
                                    }}
                                    className="text-primary-600 focus:ring-primary-500"
                                  />
                                  <span className="text-primary-600 font-semibold">Dynamic URL (Tracking {'{{1}}'})</span>
                                </label>
                              </div>

                              <div>
                                <label className="block text-[11px] font-medium text-secondary-c mb-1">Target URL</label>
                                <input
                                  value={btn.url || ''}
                                  onChange={(e) => handleUpdateButton(idx, 'url', e.target.value)}
                                  placeholder={isDynamicUrl ? "https://example.com/track/{{1}}" : "https://example.com"}
                                  className="w-full rounded-lg border border-base-c bg-card-c px-3 py-2 text-xs font-mono text-primary-c focus:border-primary-500 outline-none"
                                />
                              </div>

                              {isDynamicUrl && (
                                <div className="rounded-lg bg-sky-50 dark:bg-sky-950/20 p-3 border border-sky-200 dark:border-sky-900/50 space-y-1.5">
                                  <div className="flex items-center justify-between text-[11px] font-bold text-sky-800 dark:text-sky-300">
                                    <span>Meta Review Sample URL Required</span>
                                    <span>{btn.urlSample?.trim() ? '✓ Ready' : 'Required'}</span>
                                  </div>
                                  <input
                                    value={btn.urlSample || ''}
                                    onChange={(e) => handleUpdateButton(idx, 'urlSample', e.target.value)}
                                    placeholder="https://example.com/track/order_12345"
                                    className="w-full rounded-md border border-sky-300 bg-card-c px-3 py-1.5 text-xs font-mono text-primary-c focus:ring-2 focus:ring-sky-500 outline-none"
                                  />
                                  <p className="text-[10px] text-sky-600 dark:text-sky-400">
                                    Meta requires a complete working URL sample that demonstrates the resolved value for approval.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Call Button Configuration */}
                          {btn.type === 'PHONE_NUMBER' && (
                            <div>
                              <label className="block text-[11px] font-medium text-secondary-c mb-1">Phone Number (with Country Code)</label>
                              <input
                                value={btn.phoneNumber || ''}
                                onChange={(e) => handleUpdateButton(idx, 'phoneNumber', e.target.value)}
                                placeholder="+919876543210"
                                className="w-full rounded-lg border border-base-c bg-card-c px-3 py-2 text-xs font-mono text-primary-c focus:border-primary-500 outline-none"
                              />
                            </div>
                          )}

                          {/* Flow Button Configuration */}
                          {btn.type === 'FLOW' && (
                            <div className="space-y-3 pt-1 border-t border-base-c">
                              <div>
                                <label className="block text-[11px] font-semibold text-violet-800 dark:text-violet-300 mb-1">
                                  Select Published Flow
                                </label>
                                {loadingFlows ? (
                                  <div className="flex items-center gap-2 text-xs text-secondary-c py-1.5">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading published flows...
                                  </div>
                                ) : publishedFlows.length > 0 ? (
                                  <select
                                    value={btn.flowId || ''}
                                    onChange={(e) => handleUpdateButton(idx, 'flowId', e.target.value)}
                                    className="w-full rounded-lg border border-violet-200 bg-card-c px-3 py-2 text-xs text-primary-c focus:ring-2 focus:ring-violet-500 outline-none"
                                  >
                                    <option value="">-- Choose a published Flow --</option>
                                    {publishedFlows.map(f => (
                                      <option key={f.metaFlowId} value={f.metaFlowId}>
                                        {f.name} (Meta ID: {f.metaFlowId})
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300">
                                    No published flows found for this WhatsApp account. Go to the Flows Studio to create and publish a flow first.
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-medium text-secondary-c mb-1">Flow Action</label>
                                  <input
                                    value={btn.flowAction || 'navigate'}
                                    readOnly
                                    className="w-full rounded-lg border border-base-c bg-subtle-c px-3 py-1.5 text-xs text-secondary-c cursor-not-allowed"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-medium text-secondary-c mb-1">Starting Screen</label>
                                  <input
                                    value={btn.navigateScreen || 'FIRST_SCREEN'}
                                    onChange={(e) => handleUpdateButton(idx, 'navigateScreen', e.target.value)}
                                    placeholder="FIRST_SCREEN"
                                    className="w-full rounded-lg border border-base-c bg-card-c px-3 py-1.5 text-xs font-mono text-primary-c focus:border-primary-500 outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Pre-Flight Meta Approval Checklist Card */}
            <section className="surface rounded-2xl border border-base-c p-6 shadow-sm space-y-4 bg-gradient-to-br from-card-c to-subtle-c">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={cx("h-5 w-5", isFormReady ? "text-emerald-500" : "text-amber-500")} />
                  <h4 className="text-sm font-bold text-primary-c">Pre-Flight Meta Approval Audit</h4>
                </div>
                <span className={cx(
                  "text-xs font-bold px-2.5 py-1 rounded-full",
                  isFormReady ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                )}>
                  {isFormReady ? "Ready to Submit" : "Action Items Required"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                <div className="flex items-center gap-2">
                  {nameValid ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />}
                  <span className={nameValid ? "text-secondary-c" : "text-amber-600 font-semibold"}>
                    Valid template name (lowercase & underscores)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {bodyValid ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />}
                  <span className={bodyValid ? "text-secondary-c" : "text-amber-600 font-semibold"}>
                    Body content present (≤ 1024 chars)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {bodyVarsSequential ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />}
                  <span className={bodyVarsSequential ? "text-secondary-c" : "text-amber-600 font-semibold"}>
                    Variables sequential ({'{{1}}, {{2}}...'})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {bodySamplesComplete ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />}
                  <span className={bodySamplesComplete ? "text-secondary-c" : "text-amber-600 font-semibold"}>
                    All variable sample values provided
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {headerVarsValid && headerSamplesComplete ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />}
                  <span className={headerVarsValid && headerSamplesComplete ? "text-secondary-c" : "text-amber-600 font-semibold"}>
                    Header variables & sample valid
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {dynamicUrlsValid ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />}
                  <span className={dynamicUrlsValid ? "text-secondary-c" : "text-amber-600 font-semibold"}>
                    Dynamic URL samples valid (http/https)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {buttonLabelsValid && flowCountValid && urlCountValid ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />}
                  <span className={buttonLabelsValid && flowCountValid && urlCountValid ? "text-secondary-c" : "text-amber-600 font-semibold"}>
                    Button count & labels within limits (≤ 25 chars)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {flowsValid ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />}
                  <span className={flowsValid ? "text-secondary-c" : "text-amber-600 font-semibold"}>
                    Published Flow linked properly
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Right Column: Live Smartphone Preview */}
        <div className="bg-slate-50 dark:bg-ink-950 border-l border-base-c p-6 flex flex-col items-center justify-start overflow-y-auto">
          <div className="flex items-center justify-between w-full max-w-[340px] mb-6">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-primary-c uppercase tracking-wider">Live Preview</h4>
            </div>
            <span className="text-[11px] font-medium text-muted-c bg-card-c px-2 py-0.5 rounded-full border border-base-c">
              Sample View
            </span>
          </div>

          {/* WhatsApp Phone Mock */}
          <div className="relative w-full max-w-[340px] rounded-[2.5rem] border-[8px] border-slate-900 bg-[#E5DDD5] shadow-2xl overflow-hidden min-h-[580px] flex flex-col">
            {/* Phone Top Notch */}
            <div className="absolute top-0 inset-x-0 h-5 bg-slate-900 rounded-b-xl w-28 mx-auto z-20" />

            {/* WhatsApp App Bar */}
            <div className="bg-[#075E54] text-white pt-8 pb-2.5 px-3 flex items-center justify-between shadow-md z-10">
              <div className="flex items-center gap-2">
                <ChevronLeft className="h-5 w-5" />
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                  <div className="h-6 w-6 rounded-full bg-slate-200" />
                </div>
                <div>
                  <div className="font-bold text-xs leading-tight">GyanVaniAI Official</div>
                  <div className="text-[9px] text-white/80">Verified Business Account</div>
                </div>
              </div>
              <div className="flex gap-3">
                <Video className="h-4 w-4 opacity-80" />
                <Phone className="h-4 w-4 opacity-80" />
                <MoreVertical className="h-4 w-4 opacity-80" />
              </div>
            </div>

            {/* WhatsApp Chat Canvas */}
            <div className="flex-1 p-3.5 relative overflow-y-auto scrollbar-thin" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'cover' }}>
              
              {/* Date Badge */}
              <div className="flex justify-center mb-3">
                <span className="bg-[#E1F3FB] text-slate-600 text-[10px] px-2.5 py-0.5 rounded shadow-xs font-semibold">
                  TODAY
                </span>
              </div>

              {/* Chat Bubble with Tail */}
              <div className="flex justify-start">
                <div className="relative max-w-[270px] bg-white rounded-lg rounded-tl-none shadow-sm flex flex-col z-10 ml-1.5">
                  <div className="p-2.5 space-y-2">
                    {/* Media Header */}
                    {mediaSample === 'IMAGE' && (
                      <div className="h-32 w-full rounded bg-emerald-50 flex items-center justify-center border border-emerald-100">
                        <ImageIcon className="h-8 w-8 text-emerald-300" />
                      </div>
                    )}
                    {mediaSample === 'VIDEO' && (
                      <div className="h-32 w-full rounded bg-slate-800 flex items-center justify-center relative">
                        <div className="h-8 w-8 rounded-full bg-white/30 flex items-center justify-center backdrop-blur-xs">
                          <div className="w-0 h-0 border-t-6 border-t-transparent border-l-10 border-l-white border-b-6 border-b-transparent ml-1" />
                        </div>
                      </div>
                    )}
                    {mediaSample === 'DOCUMENT' && (
                      <div className="flex items-center gap-2 rounded bg-slate-100 p-2.5">
                        <div className="h-8 w-8 rounded bg-red-400 flex items-center justify-center">
                          <File className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="h-2 w-3/4 bg-slate-300 rounded mb-1" />
                          <div className="h-1.5 w-1/2 bg-slate-200 rounded" />
                        </div>
                      </div>
                    )}

                    {/* Text Header with Sample */}
                    {mediaSample === 'NONE' && headerContent.trim() && (
                      <p className="font-bold text-slate-900 text-[13px] px-1 pt-1 leading-snug">
                        {renderWhatsAppFormattedText(headerContent, headerSampleValues)}
                      </p>
                    )}

                    {/* Body Text with Live Sample Replacement */}
                    <div className="text-[13px] text-[#111b21] leading-relaxed px-1">
                      {renderWhatsAppFormattedText(bodyText, bodySampleValues)}
                    </div>

                    {/* Footer & Read Ticks */}
                    <div className="flex items-end justify-between gap-2 px-1 pt-0.5">
                      <p className="text-[10px] text-slate-500 truncate flex-1">
                        {footerText.trim()}
                      </p>
                      <div className="flex items-center gap-1 text-[9px] text-slate-400 shrink-0">
                        <span>12:45</span>
                        <Check className="h-3 w-3 text-emerald-600" />
                      </div>
                    </div>
                  </div>

                  {/* Appended Action Buttons */}
                  {buttonsList.length > 0 && (
                    <div className="border-t border-slate-100 bg-slate-50/50 rounded-b-lg overflow-hidden divide-y divide-slate-100">
                      {buttonsList.map((btn, idx) => (
                        <div key={idx} className="flex items-center justify-center gap-2 py-2 px-2.5 text-[13px] text-[#00A884] bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                          {btn.type === 'FLOW' ? (
                            <Workflow className="h-3.5 w-3.5 text-violet-600" />
                          ) : btn.type === 'URL' ? (
                            <Globe className="h-3.5 w-3.5" />
                          ) : btn.type === 'PHONE_NUMBER' ? (
                            <Phone className="h-3.5 w-3.5" />
                          ) : (
                            <MessageSquare className="h-3.5 w-3.5" />
                          )}
                          <span className="font-medium truncate">{btn.text || 'Button'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Phone Bottom Notch Indicator */}
            <div className="absolute bottom-1.5 inset-x-0 flex justify-center">
              <div className="h-1 w-20 bg-slate-900/20 rounded-full" />
            </div>
          </div>

          <p className="mt-4 text-[11px] text-muted-c text-center max-w-[280px]">
            Preview reflects recipient experience with variable sample substitution.
          </p>
        </div>
      </div>
    </div>
  );
}
