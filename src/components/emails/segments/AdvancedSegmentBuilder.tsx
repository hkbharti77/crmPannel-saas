import React from 'react';
import { AudienceFilterDTO, SegmentRuleDTO } from '@/lib/emailsApi';
import { Sliders, Plus, Trash2 } from 'lucide-react';
import { cx } from '@/lib/types';

interface AdvancedSegmentBuilderProps {
  filter: AudienceFilterDTO;
  onChange: (filter: AudienceFilterDTO) => void;
}

const FIELD_OPTIONS = [
  { value: 'contact.tags', label: 'Contact Tags' },
  { value: 'lead.status', label: 'Lead Status' },
  { value: 'contact.source', label: 'Contact Source' },
  { value: 'lead.dealValue', label: 'Lead Deal Value' },
  { value: 'lead.scoreGrade', label: 'Lead Score Grade' },
];

const OPERATOR_OPTIONS: Record<string, { value: string; label: string }[]> = {
  'contact.tags': [
    { value: 'CONTAINS_ANY', label: 'Contains Any' },
    { value: 'CONTAINS_ALL', label: 'Contains All' },
    { value: 'EXCLUDES', label: 'Excludes' },
  ],
  'lead.status': [
    { value: 'IN', label: 'Is One Of' },
  ],
  'contact.source': [
    { value: 'EQUALS', label: 'Equals' },
    { value: 'NOT_EQUALS', label: 'Not Equals' },
  ],
  'lead.dealValue': [
    { value: 'GREATER_THAN', label: 'Greater Than' },
    { value: 'LESS_THAN', label: 'Less Than' },
  ],
  'lead.scoreGrade': [
    { value: 'EQUALS', label: 'Equals' },
    { value: 'IN', label: 'Is One Of' },
  ],
};

export const AdvancedSegmentBuilder: React.FC<AdvancedSegmentBuilderProps> = ({ filter, onChange }) => {
  const handleAddRule = () => {
    onChange({
      ...filter,
      rules: [...(filter.rules || []), { field: 'contact.tags', operator: 'CONTAINS_ANY', value: [] }],
    });
  };

  const handleRemoveRule = (index: number) => {
    const newRules = [...(filter.rules || [])];
    newRules.splice(index, 1);
    onChange({ ...filter, rules: newRules });
  };

  const handleRuleChange = (index: number, key: keyof SegmentRuleDTO, val: any) => {
    const newRules = [...(filter.rules || [])];
    newRules[index] = { ...newRules[index], [key]: val };
    
    // Reset operator and value if field changes
    if (key === 'field') {
      newRules[index].operator = OPERATOR_OPTIONS[val]?.[0]?.value || 'EQUALS';
      newRules[index].value = val === 'lead.dealValue' ? 0 : [];
    }

    onChange({ ...filter, rules: newRules });
  };

  const handleValueChange = (index: number, rule: SegmentRuleDTO, valString: string) => {
    let finalVal: any = valString;
    if (['IN', 'CONTAINS_ANY', 'CONTAINS_ALL', 'EXCLUDES'].includes(rule.operator)) {
      finalVal = valString.split(',').map(s => s.trim()).filter(Boolean);
    } else if (rule.field === 'lead.dealValue') {
      finalVal = Number(valString);
    }
    handleRuleChange(index, 'value', finalVal);
  };

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-white dark:bg-ink-950 p-5 space-y-5 shadow-sm animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-base-c pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-primary-c">Advanced Audience Builder</h4>
            <p className="text-xs text-muted-c">Create dynamic segment rules using multi-attribute conditions.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-secondary-c">Match Logic:</span>
          <select
            className="rounded-xl border border-base-c bg-slate-50 dark:bg-ink-900 px-3 py-1.5 text-xs font-bold text-primary-c outline-none focus:border-amber-500"
            value={filter.logicalOperator || 'AND'}
            onChange={(e) => onChange({ ...filter, logicalOperator: e.target.value as 'AND' | 'OR' })}
          >
            <option value="AND" className="bg-white dark:bg-ink-900 text-primary-c">Match ALL Rules (AND)</option>
            <option value="OR" className="bg-white dark:bg-ink-900 text-primary-c">Match ANY Rule (OR)</option>
          </select>
        </div>
      </div>

      {/* Rules Container */}
      <div className="space-y-3">
        {(filter.rules || []).length === 0 ? (
          <div className="text-center py-6 border border-dashed border-base-c rounded-xl bg-slate-50/50 dark:bg-ink-900/30">
            <p className="text-xs text-muted-c">No conditions added yet. Click &quot;Add Condition&quot; to build dynamic segment rules.</p>
          </div>
        ) : (
          (filter.rules || []).map((rule, i) => {
            const displayValue = Array.isArray(rule.value) ? rule.value.join(', ') : rule.value ?? '';
            
            return (
              <div key={i} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-50 dark:bg-ink-900 p-3 rounded-xl border border-base-c">
                <select
                  className="block w-full sm:w-1/3 rounded-xl border border-base-c bg-white dark:bg-ink-950 px-3 py-2 text-xs font-bold text-primary-c outline-none focus:border-amber-500"
                  value={rule.field}
                  onChange={(e) => handleRuleChange(i, 'field', e.target.value)}
                >
                  {FIELD_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-white dark:bg-ink-900 text-primary-c">
                      {opt.label}
                    </option>
                  ))}
                </select>

                <select
                  className="block w-full sm:w-1/4 rounded-xl border border-base-c bg-white dark:bg-ink-950 px-3 py-2 text-xs font-bold text-primary-c outline-none focus:border-amber-500"
                  value={rule.operator}
                  onChange={(e) => handleRuleChange(i, 'operator', e.target.value)}
                >
                  {(OPERATOR_OPTIONS[rule.field] || []).map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-white dark:bg-ink-900 text-primary-c">
                      {opt.label}
                    </option>
                  ))}
                </select>

                <input
                  type={rule.field === 'lead.dealValue' ? 'number' : 'text'}
                  placeholder={Array.isArray(rule.value) ? 'Comma separated values...' : 'Enter value...'}
                  className="block w-full sm:flex-1 rounded-xl border border-base-c bg-white dark:bg-ink-950 px-3 py-2 text-xs font-medium text-primary-c placeholder:text-muted-c/60 outline-none focus:border-amber-500"
                  value={displayValue}
                  onChange={(e) => handleValueChange(i, rule, e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => handleRemoveRule(i)}
                  className="h-9 w-9 rounded-xl hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 text-muted-c flex items-center justify-center transition-colors shrink-0 border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                  title="Remove condition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Add Condition Button */}
      <button
        type="button"
        onClick={handleAddRule}
        className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-amber-500/40 hover:border-amber-500 shadow-2xs text-xs font-bold rounded-xl text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100/50 dark:hover:bg-amber-950/60 transition-all"
      >
        <Plus className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        Add Condition Rule
      </button>
    </div>
  );
};
