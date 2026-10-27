import React, { useEffect, useState, useMemo } from 'react';
import { Zap, Tag, Sparkles } from 'lucide-react';
import { cx } from '@/lib/types';

export interface CannedResponseItem {
  id: string;
  title: string;
  shortcut: string;
  content: string;
  category: string;
  usageCount?: number;
}

interface CannedResponsePopupProps {
  filterText: string; // The text typed after '/'
  onSelect: (item: CannedResponseItem) => void;
  onClose: () => void;
  contactName?: string;
  agentName?: string;
  theme?: 'whatsapp-dark' | 'whatsapp-light' | 'glass';
}

export const CannedResponsePopup: React.FC<CannedResponsePopupProps> = ({
  filterText,
  onSelect,
  onClose,
  contactName,
  agentName,
  theme = 'whatsapp-dark',
}) => {
  const [items, setItems] = useState<CannedResponseItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch canned responses
  useEffect(() => {
    let isMounted = true;
    const fetchResponses = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const url = filterText.trim()
          ? `/api/v1/canned-responses/search?q=${encodeURIComponent(filterText.trim())}`
          : '/api/v1/canned-responses';
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          setItems(data || []);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error('Failed to load canned responses:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchResponses();
    return () => {
      isMounted = false;
    };
  }, [filterText]);

  // Client-side fuzzy filter fallback if needed
  const filtered = useMemo(() => {
    if (!filterText.trim()) return items;
    const query = filterText.toLowerCase().replace(/^\//, '');
    return items.filter(
      (item) =>
        item.shortcut.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query)
    );
  }, [items, filterText]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length > 0 ? (prev + 1) % filtered.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length > 0 ? (prev - 1 + filtered.length) % filtered.length : 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (filtered.length > 0 && selectedIndex < filtered.length) {
          e.preventDefault();
          onSelect(filtered[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtered, selectedIndex, onSelect, onClose]);

  const getContainerStyle = () => {
    if (theme === 'whatsapp-dark') return 'bg-[#202c33] border-[#2a3942] text-[#e9edef] shadow-2xl';
    if (theme === 'whatsapp-light') return 'bg-[#ffffff] border-[#e9edef] text-[#111b21] shadow-xl';
    return 'bg-card-c/95 backdrop-blur-md border-base-c/80 text-primary-c shadow-xl';
  };

  const getItemStyle = (isSelected: boolean) => {
    if (theme === 'whatsapp-dark') {
      return isSelected ? 'bg-[#005c4b]/30 border-l-2 border-[#00a884]' : 'hover:bg-[#111b21]/40';
    }
    if (theme === 'whatsapp-light') {
      return isSelected ? 'bg-emerald-500/10 border-l-2 border-emerald-600' : 'hover:bg-slate-100/60';
    }
    return isSelected ? 'bg-primary-500/10 border-l-2 border-primary-500' : 'hover:bg-slate-100/40 dark:hover:bg-ink-800/40';
  };

  // Preview interpolation helper
  const renderPreview = (content: string) => {
    const cName = contactName || 'Customer';
    const aName = agentName || 'Agent';
    const resolved = content
      .replace(/\{\{contact\.name\}\}/g, cName)
      .replace(/\{\{contact_name\}\}/g, cName)
      .replace(/\{\{agent\.name\}\}/g, aName)
      .replace(/\{\{agent_name\}\}/g, aName);
    return resolved;
  };

  return (
    <div
      className={cx(
        'absolute bottom-full mb-2 left-0 right-0 max-h-72 flex flex-col rounded-2xl border overflow-hidden z-50 animate-slide-up',
        getContainerStyle()
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-base-c/20 text-xs font-semibold opacity-75">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <span>Canned Responses</span>
          {filterText && <span className="font-mono text-emerald-500 font-bold">/{filterText}</span>}
        </div>
        <span className="text-[10px] font-normal opacity-70">
          ↑↓ navigate • ↵ insert • Esc close
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto max-h-60 p-1 divide-y divide-base-c/10">
        {loading && filtered.length === 0 ? (
          <div className="py-6 text-center text-xs opacity-60">Searching snippets…</div>
        ) : filtered.length === 0 ? (
          <div className="py-6 text-center text-xs opacity-60 flex flex-col items-center gap-1">
            <Sparkles className="h-4 w-4 text-muted-c" />
            <span>No canned responses matching &ldquo;/{filterText}&rdquo;</span>
          </div>
        ) : (
          filtered.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cx(
                  'flex flex-col gap-1 px-3 py-2 cursor-pointer transition-colors rounded-lg',
                  getItemStyle(isSelected)
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      /{item.shortcut}
                    </span>
                    <span className="text-xs font-semibold truncate">{item.title}</span>
                  </div>
                  {item.category && (
                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider opacity-60">
                      <Tag className="h-2.5 w-2.5" />
                      {item.category}
                    </span>
                  )}
                </div>
                <p className="text-[11px] opacity-75 line-clamp-2 leading-relaxed">
                  {renderPreview(item.content)}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
