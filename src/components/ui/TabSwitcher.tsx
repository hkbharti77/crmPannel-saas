import React, { ReactNode } from 'react';
import { cx } from '@/lib/types';

export interface TabOption {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabSwitcherProps {
  tabs: TabOption[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function TabSwitcher({ tabs, activeTab, onChange, className }: TabSwitcherProps) {
  return (
    <div className="w-full max-w-full overflow-x-auto scrollbar-none py-0.5">
      <div className={cx("flex items-center bg-slate-50 dark:bg-ink-900/80 p-1 rounded-full w-max ring-1 ring-blue-200 dark:ring-blue-900/50 flex-nowrap", className)}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cx(
                "flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 shrink-0 whitespace-nowrap btn-tactile",
                isActive 
                  ? "bg-white dark:bg-ink-800 text-blue-600 dark:text-blue-400 ring-1 ring-blue-400 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              {tab.icon && (
                <span className={cx("shrink-0", isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500")}>
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
