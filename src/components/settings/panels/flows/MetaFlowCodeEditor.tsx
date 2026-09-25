import React, { useState, useRef } from 'react';
import { Play, Copy, Check, Sparkles, CheckCircle2 } from 'lucide-react';
import { FlowValidationError } from './types';
import { cx } from '@/lib/types';

interface MetaFlowCodeEditorProps {
  jsonString: string;
  onChange: (value: string) => void;
  errors: FlowValidationError[];
  onRunValidation: () => void;
  activeScreenId?: string;
}

export const MetaFlowCodeEditor: React.FC<MetaFlowCodeEditorProps> = ({
  jsonString,
  onChange,
  errors,
  onRunValidation,
}) => {
  const [copied, setCopied] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lines = jsonString.split('\n');
  const errorLines = new Set(errors.map(e => e.line).filter((l): l is number => typeof l === 'number'));

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonString);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
    } catch {
      // ignore syntax error
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      // Insert 2 spaces
      const newValue = jsonString.substring(0, start) + '  ' + jsonString.substring(end);
      onChange(newValue);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const handleRunClick = () => {
    onRunValidation();
    setHasRun(true);
    setTimeout(() => setHasRun(false), 1800);
  };

  return (
    <div className="flex flex-col h-full bg-card-c rounded-xl overflow-hidden border border-base-c shadow-xs text-xs">
      {/* Editor Top Bar matching Meta Flow Manager */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-subtle-c border-b border-base-c select-none">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-primary-c">Editor</span>
          <span className="text-[10px] text-muted-c bg-card-c px-2 py-0.5 rounded border border-base-c font-mono">
            Meta Flow v7.0
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleFormat}
            className="px-2 py-1 bg-card-c hover:bg-subtle-c text-secondary-c hover:text-primary-c text-[11px] font-semibold rounded transition border border-base-c flex items-center gap-1"
            title="Format JSON"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Format</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="px-2 py-1 bg-card-c hover:bg-subtle-c text-secondary-c hover:text-primary-c text-[11px] font-semibold rounded transition border border-base-c flex items-center gap-1"
            title="Copy Code"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handleRunClick}
            className={cx(
              'px-3.5 py-1 text-white font-bold text-[11px] rounded-md shadow-xs flex items-center gap-1 transition active:scale-95',
              hasRun ? 'bg-emerald-600' : 'bg-[#1877f2] hover:bg-[#166fe5]'
            )}
            title="Run Validator"
          >
            {hasRun ? <CheckCircle2 className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
            <span>{hasRun ? 'Valid!' : 'Run'}</span>
          </button>
        </div>
      </div>

      {/* Editor Canvas with Line Numbers */}
      <div className="flex-1 flex relative overflow-hidden bg-[#fafafa] dark:bg-[#18191a]">
        {/* Line Numbers Gutter */}
        <div className="w-10 shrink-0 py-3 bg-[#f1f5f9] dark:bg-[#202124] border-r border-base-c select-none text-right pr-2 text-slate-400 dark:text-slate-500 font-mono text-[11px] leading-[20px] overflow-hidden">
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const hasError = errorLines.has(lineNum);
            return (
              <div
                key={i}
                className={cx(
                  'h-[20px] transition-colors',
                  hasError ? 'text-rose-500 font-bold bg-rose-500/20 px-1 rounded-xs' : ''
                )}
              >
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Textarea Code Input */}
        <div className="flex-1 relative overflow-auto">
          <textarea
            ref={textareaRef}
            value={jsonString}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className="w-full h-full min-h-[460px] p-3 font-mono text-[11.5px] leading-[20px] bg-transparent text-slate-800 dark:text-emerald-400 placeholder-slate-400 resize-none outline-none border-0 selection:bg-blue-500/20"
            style={{ tabSize: 2 }}
          />
        </div>
      </div>
    </div>
  );
};
