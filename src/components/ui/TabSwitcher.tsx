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
    <div className={cx("flex items-center bg-slate-50 dark:bg-ink-900/80 p-1 rounded-full w-max ring-1 ring-blue-200 dark:ring-blue-900/50", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cx(
              "flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all duration-200",
              isActive 
                ? "bg-white dark:bg-ink-800 text-blue-600 dark:text-blue-400 ring-1 ring-blue-400 shadow-sm" 
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            {tab.icon && (
              <span className={cx(isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500")}>
                {tab.icon}
              </span>
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
