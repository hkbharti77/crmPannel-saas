import React, { useState, useEffect, useMemo } from 'react';
import { Tag, Users, CheckCircle2, XCircle, X, AlertTriangle } from 'lucide-react';
import { cx } from '@/lib/types';
import { apiFetch } from '@/lib/api';

interface TagSegmentFilter {
  version: number;
  matchMode: 'ANY' | 'ALL';
  includeTags: string[];
  excludeTags: string[];
}

interface TagSegmentBuilderProps {
  value: string; // Serialized JSON
  onChange: (value: string) => void;
}

export function TagSegmentBuilder({ value, onChange }: TagSegmentBuilderProps) {
  const [filter, setFilter] = useState<TagSegmentFilter>(() => {
    try {
      if (!value) return { version: 1, matchMode: 'ANY', includeTags: [], excludeTags: [] };
      if (!value.startsWith('{')) {
        // Legacy fallback
        const tags = value.split(',').map(t => t.trim()).filter(Boolean);
        return { version: 1, matchMode: 'ANY', includeTags: tags, excludeTags: [] };
      }
      return JSON.parse(value);
    } catch {
      return { version: 1, matchMode: 'ANY', includeTags: [], excludeTags: [] };
    }
  });

  const [preview, setPreview] = useState<{ matched: number; excluded: number; eligible: number } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>(['vip', 'newsletter', 'customer', 'prospect', 'churned', 'blocked', 'lead', 'partner', 'active', 'inactive']);

  useEffect(() => {
    // Fetch available tags for autocomplete from backend
    apiFetch<string[]>('/api/v1/contacts/tags/all').then(res => {
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        // Merge fetched tags with default tags uniquely
        const merged = Array.from(new Set([...res.data, ...['vip', 'newsletter', 'customer', 'prospect', 'churned', 'blocked', 'lead', 'partner', 'active', 'inactive']]));
        setAvailableTags(merged);
      }
    });
  }, []);

  // Sync to parent when local state changes
  useEffect(() => {
    const json = JSON.stringify(filter);
    if (json !== value) {
      onChange(json);
    }
    
    // Debounced preview fetch
    const timeout = setTimeout(() => {
      fetchPreview(filter);
    }, 800);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchPreview = async (currentFilter: TagSegmentFilter) => {
    setPreviewLoading(true);
    try {
      const res = await apiFetch<{ matched: number; excluded: number; eligible: number }>('/api/v1/custom-emails/audience/preview', {
        method: 'POST',
        body: JSON.stringify({
          recipientMode: 'TAGGED',
          tagsFilter: currentFilter
        })
      });
      if (!res.error && res.data) {
        setPreview(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPreviewLoading(false);
    }
  };

  const updateFilter = (updates: Partial<TagSegmentFilter>) => {
    setFilter(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-white dark:bg-ink-950 p-5 space-y-6 shadow-sm animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-base-c pb-3">
        <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Tag className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-primary-c">Enterprise Audience Segment</h4>
          <p className="text-xs text-muted-c">Build dynamic audience rules using inclusion and exclusion logic.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Builder */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Match Mode Selector */}
          <div>
            <label className="text-xs font-bold text-secondary-c mb-2 block">Include contacts matching:</label>
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-ink-900 border border-base-c">
              <button
                type="button"
                onClick={() => updateFilter({ matchMode: 'ANY' })}
                className={cx(
                  'px-4 py-1.5 rounded-lg text-xs font-bold transition-all',
                  filter.matchMode === 'ANY' ? 'bg-indigo-600 text-white shadow-sm' : 'text-muted-c hover:text-primary-c'
                )}
              >
                Match ANY (OR)
              </button>
              <button
                type="button"
                onClick={() => updateFilter({ matchMode: 'ALL' })}
                className={cx(
                  'px-4 py-1.5 rounded-lg text-xs font-bold transition-all',
                  filter.matchMode === 'ALL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-muted-c hover:text-primary-c'
                )}
              >
                Match ALL (AND)
              </button>
            </div>
            <p className="text-[11px] text-muted-c mt-1.5">
              {filter.matchMode === 'ANY' ? 'Contact must have AT LEAST ONE of the include tags.' : 'Contact must have ALL of the include tags.'}
            </p>
          </div>

          {/* Include Tags */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Tags to INCLUDE
            </label>
            <TagChipInput 
              tags={filter.includeTags} 
              onTagsChange={tags => updateFilter({ includeTags: tags })} 
              placeholder="e.g. vip, newsletter (Press Enter)"
              accent="emerald"
              availableTags={availableTags}
            />
          </div>

          {/* Exclude Tags */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5" /> Tags to EXCLUDE (Always Wins)
            </label>
            <TagChipInput 
              tags={filter.excludeTags} 
              onTagsChange={tags => updateFilter({ excludeTags: tags })} 
              placeholder="e.g. churned, blocked (Press Enter)"
              accent="rose"
              availableTags={availableTags}
            />
          </div>
        </div>

        {/* Right Column: Summary & Preview */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Logic Summary */}
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 space-y-3">
            <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Segment Logic
            </h5>
            
            <div className="text-xs font-mono text-slate-700 dark:text-slate-300 space-y-1.5 leading-relaxed bg-white/60 dark:bg-ink-900/60 p-3 rounded-lg border border-indigo-500/10">
              {filter.includeTags.length === 0 ? (
                <div><span className="text-emerald-600 font-bold">ALL</span> Eligible Contacts</div>
              ) : (
                <div>
                  {filter.includeTags.map((t, i) => (
                    <span key={i}>
                      <span className="font-bold text-emerald-600">{t}</span>
                      {i < filter.includeTags.length - 1 && (
                        <span className="text-indigo-400 font-bold px-1.5">{filter.matchMode === 'ANY' ? 'OR' : 'AND'}</span>
                      )}
                    </span>
                  ))}
                </div>
              )}

              {filter.excludeTags.length > 0 && (
                <div className="pt-1.5 mt-1.5 border-t border-indigo-500/10">
                  <span className="text-rose-500 font-bold pr-1.5">EXCLUDING</span>
                  {filter.excludeTags.map((t, i) => (
                    <span key={i}>
                      <span className="font-bold text-rose-600">{t}</span>
                      {i < filter.excludeTags.length - 1 && (
                        <span className="text-indigo-400 font-bold px-1.5">OR</span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Audience Preview */}
          <div className="rounded-xl border border-base-c bg-slate-50 dark:bg-ink-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-secondary-c flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Estimated Audience
              </h5>
              {previewLoading && <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-ping"></span>}
            </div>

            {preview ? (
              <div className="space-y-2 text-xs font-medium">
                <div className="flex justify-between text-muted-c">
                  <span>Matched Base</span>
                  <span>{preview.matched.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-500">
                  <span>Excluded / Suppressed</span>
                  <span>- {preview.excluded.toLocaleString()}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-base-c flex justify-between font-bold text-lg text-primary-c">
                  <span>Final Audience</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{preview.eligible.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-muted-c">
                Waiting for input...
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Tag Chip Input Subcomponent
// ----------------------------------------------------------------------

interface TagChipInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder: string;
  accent: 'emerald' | 'rose';
  availableTags?: string[];
}

function TagChipInput({ tags, onTagsChange, placeholder, accent, availableTags = [] }: TagChipInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const suggestions = useMemo(() => {
    const search = inputValue.trim().toLowerCase();
    const filtered = availableTags.filter(t => !tags.includes(t));
    
    if (!search) {
      return filtered.slice(0, 10);
    }
    
    return filtered.filter(t => t.toLowerCase().includes(search)).slice(0, 10);
  }, [inputValue, availableTags, tags]);

  const colors = {
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    rose: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
  };

  const handleAdd = (val: string) => {
    const cleaned = val.trim().toLowerCase();
    if (!cleaned) return;
    
    if (cleaned.length > 50) {
      setError('Tag is too long (max 50 chars)');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (tags.includes(cleaned)) {
      setError(`"${cleaned}" is already added.`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    onTagsChange([...tags, cleaned]);
    setInputValue('');
    setError(null);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      // If suggestions are visible and we press enter, add the top suggestion or the typed value
      if (showSuggestions && suggestions.length > 0) {
        handleAdd(suggestions[0]);
      } else {
        handleAdd(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      handleRemove(tags[tags.length - 1]);
    }
  };

  const handleRemove = (tagToRemove: string) => {
    onTagsChange(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="space-y-1.5">
      <div className="min-h-[44px] p-1.5 rounded-xl border border-base-c bg-white dark:bg-ink-950 flex flex-wrap gap-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
        {tags.map(tag => (
          <span 
            key={tag} 
            className={cx(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all',
              colors[accent]
            )}
          >
            {tag}
            <button 
              type="button" 
              onClick={() => handleRemove(tag)}
              className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <div className="flex-1 relative min-w-[120px]">
          <input
            value={inputValue}
            onChange={e => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              setTimeout(() => {
                if (inputValue) handleAdd(inputValue);
                setShowSuggestions(false);
              }, 200); // small delay to allow clicking a suggestion
            }}
            placeholder={tags.length === 0 ? placeholder : ''}
            className="w-full bg-transparent text-xs outline-none px-2 py-1 placeholder:text-muted-c/60"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-1.5 w-full min-w-[200px] z-50 rounded-xl bg-white dark:bg-ink-900 border border-base-c shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-muted-c bg-slate-50 dark:bg-ink-850 border-b border-base-c">
                Tag Suggestions
              </div>
              <div className="max-h-40 overflow-y-auto py-1 scrollbar-thin">
                {suggestions.map((sug: string) => (
                  <button
                    key={sug}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleAdd(sug);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs font-bold text-primary-c hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-between"
                  >
                    <span>{sug}</span>
                    <Tag className="h-3 w-3 text-muted-c opacity-50" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {error && (
        <p className="text-[10px] font-bold text-rose-500 animate-fade-in flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}
