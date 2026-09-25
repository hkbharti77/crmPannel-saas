import React, { useState } from 'react';
import {
  RotateCcw, Moon, Sun, MoreVertical, X,
  ArrowLeft, CheckCircle2, ChevronDown, Check, ExternalLink,
  Settings, Wifi, Battery, Signal, Sparkles
} from 'lucide-react';
import { MetaFlowScreen, MetaFlowComponent } from './types';
import { cx } from '@/lib/types';

interface MetaFlowPhonePreviewProps {
  screens: MetaFlowScreen[];
  activeScreenId: string;
  onSelectScreen: (id: string) => void;
  flowName: string;
}

export const MetaFlowPhonePreview: React.FC<MetaFlowPhonePreviewProps> = ({
  screens,
  activeScreenId,
  onSelectScreen,
  flowName,
}) => {
  const [phoneTheme, setPhoneTheme] = useState<'light' | 'dark'>('light');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submissionSuccessPayload, setSubmissionSuccessPayload] = useState<any | null>(null);

  const activeScreen = screens.find(s => s.id === activeScreenId) || screens[0];

  const getScreenComponents = (screen: MetaFlowScreen): MetaFlowComponent[] => {
    if (!screen || !screen.layout || !screen.layout.children) return [];
    const formChild = screen.layout.children.find(c => c.type === 'Form');
    if (formChild && Array.isArray(formChild.children)) {
      return formChild.children;
    }
    return screen.layout.children;
  };

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFooterClick = (comp: MetaFlowComponent) => {
    const action = comp['on-click-action'];
    if (!action) return;

    if (action.name === 'navigate') {
      const targetScreen = action.next?.name;
      if (targetScreen && screens.some(s => s.id === targetScreen)) {
        onSelectScreen(targetScreen);
      }
    } else if (action.name === 'complete') {
      const payload: Record<string, any> = { ...formData };
      setSubmissionSuccessPayload(payload);
    }
  };

  const handleResetPreview = () => {
    setFormData({});
    setSubmissionSuccessPayload(null);
    if (screens.length > 0) {
      onSelectScreen(screens[0].id);
    }
  };

  const components = getScreenComponents(activeScreen);

  return (
    <div className="flex flex-col items-center justify-start w-full select-none overflow-hidden">
      {/* ─── META MANAGER PREVIEW HEADER (COMPACT & CLEAN) ─── */}
      <div className="w-full flex items-center justify-between gap-1 pb-2.5 mb-2.5 border-b border-base-c/70">
        <span className="text-xs font-bold text-primary-c shrink-0">Preview</span>

        <div className="flex items-center gap-1 min-w-0">
          <div className="relative min-w-0">
            <select
              value={activeScreen?.id || ''}
              onChange={(e) => onSelectScreen(e.target.value)}
              className="appearance-none surface text-[11px] font-bold text-primary-c pl-2 pr-6 h-7 rounded-md border border-base-c shadow-xs cursor-pointer focus:outline-none focus:border-emerald-500 transition max-w-[115px] truncate"
            >
              {screens.map(s => (
                <option key={s.id} value={s.id}>{s.id}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-muted-c absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={() => setPhoneTheme(prev => prev === 'light' ? 'dark' : 'light')}
            className="w-7 h-7 shrink-0 surface hover:bg-subtle-c text-muted-c hover:text-primary-c rounded-md border border-base-c shadow-xs transition flex items-center justify-center"
            title="Toggle Light/Dark Theme"
          >
            {phoneTheme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          <button
            type="button"
            onClick={handleResetPreview}
            className="w-7 h-7 shrink-0 surface hover:bg-subtle-c text-muted-c hover:text-primary-c rounded-md border border-base-c shadow-xs transition flex items-center justify-center"
            title="Reset Form State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─── ENTERPRISE DEVICE FRAME (PIXEL-PERFECT META SPEC) ─── */}
      <div className="relative w-full max-w-[290px] rounded-[34px] p-1.5 bg-[#1c2128] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)] border border-slate-700/50 flex flex-col">
        {/* Device Top Speaker & Front Camera */}
        <div className="h-4 flex items-center justify-between px-4 text-[9px] font-semibold text-slate-400">
          <span>9:41</span>
          <div className="w-12 h-1 bg-[#2d333b] rounded-full mx-auto" />
          <div className="flex items-center gap-1 text-slate-400">
            <Signal className="w-2.5 h-2.5" />
            <Wifi className="w-2.5 h-2.5" />
            <Battery className="w-3 h-3" />
          </div>
        </div>

        {/* WhatsApp Background Chat Strip (Simulating in-app modal overlay) */}
        <div className="rounded-[28px] overflow-hidden flex flex-col relative bg-[#0b141a] text-slate-100 shadow-inner">
          {/* WhatsApp Chat Top Header Behind Modal */}
          <div className="px-3 py-1.5 bg-[#1f2c34] flex items-center justify-between border-b border-[#2a3942]/60 opacity-85">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-[9px] font-bold text-white shadow-xs">
                W
              </div>
              <span className="text-[10px] font-semibold text-slate-200 truncate">WhatsApp Business</span>
            </div>
            <MoreVertical className="w-3 h-3 text-slate-400" />
          </div>

          {/* ─── NATIVE WHATSAPP FLOW MODAL SHEET ─── */}
          <div
            className={cx(
              'min-h-[460px] max-h-[520px] flex flex-col justify-between transition-colors shadow-2xl',
              phoneTheme === 'dark' ? 'bg-[#111b21] text-[#e9edef]' : 'bg-[#ffffff] text-[#111b21]'
            )}
          >
            {/* WhatsApp Flow In-App Title Bar */}
            <div
              className={cx(
                'px-3 py-2.5 flex items-center justify-between border-b transition-colors select-none sticky top-0 z-10',
                phoneTheme === 'dark'
                  ? 'bg-[#1f2c34] border-[#222e35] text-[#e9edef]'
                  : 'bg-[#ffffff] border-slate-100 text-[#111b21]'
              )}
            >
              <button
                type="button"
                onClick={() => {
                  const currentIdx = screens.findIndex(s => s.id === activeScreen?.id);
                  if (currentIdx > 0) onSelectScreen(screens[currentIdx - 1].id);
                }}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-white transition p-0.5"
              >
                {screens.findIndex(s => s.id === activeScreen?.id) > 0 ? (
                  <ArrowLeft className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </button>

              <h4 className="font-bold text-xs tracking-tight truncate max-w-[170px] text-center">
                {activeScreen?.title || flowName || 'FeedBack'}
              </h4>

              <div className="text-slate-400 p-0.5">
                <MoreVertical className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 p-3.5 space-y-3 overflow-y-auto max-h-[410px] scrollbar-thin">
              {components.map((comp, i) => {
                switch (comp.type) {
                  case 'TextHeading':
                    return (
                      <h2
                        key={i}
                        className={cx(
                          'text-base font-bold tracking-tight',
                          phoneTheme === 'dark' ? 'text-white' : 'text-slate-900'
                        )}
                      >
                        {comp.text || 'FeedBack'}
                      </h2>
                    );

                  case 'TextSubheading':
                    return (
                      <h3
                        key={i}
                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400"
                      >
                        {comp.text || 'Subheading Details'}
                      </h3>
                    );

                  case 'TextBody':
                    return (
                      <p
                        key={i}
                        className={cx(
                          'text-[11px] leading-relaxed',
                          phoneTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                        )}
                      >
                        {comp.text || 'Please complete the form below:'}
                      </p>
                    );

                  case 'TextCaption':
                    return (
                      <p
                        key={i}
                        className={cx(
                          'text-[9.5px] leading-tight',
                          phoneTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        )}
                      >
                        {comp.text || 'Note: Information submitted is protected.'}
                      </p>
                    );

                  case 'TextInput':
                    return (
                      <div key={i} className="space-y-0.5">
                        <label
                          className={cx(
                            'text-[10px] font-semibold flex items-center gap-0.5',
                            phoneTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                          )}
                        >
                          <span>{comp.label || comp.name || 'Input'}</span>
                          {comp.required && <span className="text-rose-500 font-bold">*</span>}
                        </label>
                        <input
                          type={comp['input-type'] === 'number' ? 'number' : comp['input-type'] === 'password' ? 'password' : 'text'}
                          value={formData[comp.name || ''] || ''}
                          onChange={(e) => handleInputChange(comp.name || '', e.target.value)}
                          placeholder={comp.label || (comp['input-type'] === 'email' ? 'Email Address' : comp['input-type'] === 'phone' ? 'Phone Number' : 'Enter text…')}
                          className={cx(
                            'w-full h-9 px-3 rounded-lg text-xs outline-none transition border shadow-2xs',
                            phoneTheme === 'dark'
                              ? 'bg-[#1f2c34] border-[#2a3942] text-white placeholder:text-slate-500 focus:border-[#00a884]'
                              : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#00a884]'
                          )}
                        />
                      </div>
                    );

                  case 'TextArea':
                    return (
                      <div key={i} className="space-y-0.5">
                        <label
                          className={cx(
                            'text-[10px] font-semibold flex items-center gap-0.5',
                            phoneTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                          )}
                        >
                          <span>{comp.label || comp.name || 'Comments'}</span>
                          {comp.required && <span className="text-rose-500 font-bold">*</span>}
                        </label>
                        <textarea
                          rows={2}
                          value={formData[comp.name || ''] || ''}
                          onChange={(e) => handleInputChange(comp.name || '', e.target.value)}
                          placeholder={comp.label || 'Your Comments / Details…'}
                          className={cx(
                            'w-full p-2.5 rounded-lg text-xs outline-none transition border shadow-2xs resize-none',
                            phoneTheme === 'dark'
                              ? 'bg-[#1f2c34] border-[#2a3942] text-white placeholder:text-slate-500 focus:border-[#00a884]'
                              : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#00a884]'
                          )}
                        />
                      </div>
                    );

                  case 'Dropdown':
                    return (
                      <div key={i} className="space-y-0.5">
                        <label
                          className={cx(
                            'text-[10px] font-semibold flex items-center gap-0.5',
                            phoneTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                          )}
                        >
                          <span>{comp.label || comp.name || 'Select'}</span>
                          {comp.required && <span className="text-rose-500 font-bold">*</span>}
                        </label>
                        <div className="relative">
                          <select
                            value={formData[comp.name || ''] || ''}
                            onChange={(e) => handleInputChange(comp.name || '', e.target.value)}
                            className={cx(
                              'w-full h-9 px-3 rounded-lg text-xs outline-none appearance-none transition border shadow-2xs',
                              phoneTheme === 'dark'
                                ? 'bg-[#1f2c34] border-[#2a3942] text-white focus:border-[#00a884]'
                                : 'bg-white border-slate-300 text-slate-900 focus:border-[#00a884]'
                            )}
                          >
                            <option value="">Select an option…</option>
                            {(comp['data-source'] || []).map(opt => (
                              <option key={opt.id} value={opt.id}>{opt.title}</option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    );

                  case 'RadioButtonsGroup':
                    return (
                      <div key={i} className="space-y-1">
                        <label
                          className={cx(
                            'text-[10px] font-semibold flex items-center gap-0.5',
                            phoneTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                          )}
                        >
                          <span>{comp.label || comp.name || 'Choose One'}</span>
                          {comp.required && <span className="text-rose-500 font-bold">*</span>}
                        </label>
                        <div className="space-y-1">
                          {(comp['data-source'] || []).map(opt => {
                            const isChecked = formData[comp.name || ''] === opt.id;
                            return (
                              <label
                                key={opt.id}
                                onClick={() => handleInputChange(comp.name || '', opt.id)}
                                className={cx(
                                  'flex items-center gap-2 p-2 rounded-lg border text-[11px] cursor-pointer transition shadow-2xs',
                                  isChecked
                                    ? 'border-[#00a884] bg-[#00a884]/10 font-bold text-[#00a884]'
                                    : phoneTheme === 'dark'
                                    ? 'bg-[#1f2c34] border-[#2a3942] text-slate-300 hover:border-slate-600'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                )}
                              >
                                <div
                                  className={cx(
                                    'w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all',
                                    isChecked ? 'border-[#00a884] bg-[#00a884]' : 'border-slate-400'
                                  )}
                                >
                                  {isChecked && <div className="w-1 h-1 rounded-full bg-white" />}
                                </div>
                                <span className="truncate">{opt.title}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );

                  case 'CheckboxGroup':
                    return (
                      <div key={i} className="space-y-1">
                        <label
                          className={cx(
                            'text-[10px] font-semibold flex items-center gap-0.5',
                            phoneTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                          )}
                        >
                          <span>{comp.label || comp.name || 'Select'}</span>
                          {comp.required && <span className="text-rose-500 font-bold">*</span>}
                        </label>
                        <div className="space-y-1">
                          {(comp['data-source'] || []).map(opt => {
                            const currentArr: string[] = formData[comp.name || ''] || [];
                            const isChecked = currentArr.includes(opt.id);
                            return (
                              <label
                                key={opt.id}
                                onClick={() => {
                                  const newArr = isChecked
                                    ? currentArr.filter(id => id !== opt.id)
                                    : [...currentArr, opt.id];
                                  handleInputChange(comp.name || '', newArr);
                                }}
                                className={cx(
                                  'flex items-center gap-2 p-2 rounded-lg border text-[11px] cursor-pointer transition shadow-2xs',
                                  isChecked
                                    ? 'border-[#00a884] bg-[#00a884]/10 font-bold text-[#00a884]'
                                    : phoneTheme === 'dark'
                                    ? 'bg-[#1f2c34] border-[#2a3942] text-slate-300 hover:border-slate-600'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                )}
                              >
                                <div
                                  className={cx(
                                    'w-3.5 h-3.5 rounded border flex items-center justify-center transition-all',
                                    isChecked ? 'border-[#00a884] bg-[#00a884] text-white' : 'border-slate-400'
                                  )}
                                >
                                  {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                                <span className="truncate">{opt.title}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );

                  case 'DatePicker':
                    return (
                      <div key={i} className="space-y-0.5">
                        <label
                          className={cx(
                            'text-[10px] font-semibold flex items-center gap-0.5',
                            phoneTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                          )}
                        >
                          <span>{comp.label || comp.name || 'Select Date'}</span>
                          {comp.required && <span className="text-rose-500 font-bold">*</span>}
                        </label>
                        <input
                          type="date"
                          value={formData[comp.name || ''] || ''}
                          onChange={(e) => handleInputChange(comp.name || '', e.target.value)}
                          className={cx(
                            'w-full h-9 px-3 rounded-lg text-xs outline-none transition border shadow-2xs',
                            phoneTheme === 'dark'
                              ? 'bg-[#1f2c34] border-[#2a3942] text-white focus:border-[#00a884]'
                              : 'bg-white border-slate-300 text-slate-900 focus:border-[#00a884]'
                          )}
                        />
                      </div>
                    );

                  case 'OptIn':
                    const isChecked = !!formData[comp.name || ''];
                    return (
                      <label
                        key={i}
                        onClick={() => handleInputChange(comp.name || '', !isChecked)}
                        className={cx(
                          'flex items-start gap-2 p-2 rounded-lg border text-[10.5px] cursor-pointer transition shadow-2xs',
                          isChecked
                            ? 'border-[#00a884] bg-[#00a884]/10 text-primary-c'
                            : phoneTheme === 'dark'
                            ? 'bg-[#1f2c34] border-[#2a3942] text-slate-300 hover:border-slate-600'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        )}
                      >
                        <div
                          className={cx(
                            'w-3.5 h-3.5 rounded border mt-0.5 shrink-0 flex items-center justify-center transition-all',
                            isChecked ? 'border-[#00a884] bg-[#00a884] text-white' : 'border-slate-400'
                          )}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="leading-snug">{comp.label || 'I agree to the terms and conditions.'}</span>
                      </label>
                    );

                  case 'EmbeddedLink':
                    return (
                      <a
                        key={i}
                        href={comp.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10.5px] text-[#00a884] font-semibold hover:underline flex items-center gap-1.5 pt-0.5"
                      >
                        <span>{comp.text || 'Learn more & terms'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    );

                  case 'Footer':
                    return (
                      <div key={i} className="pt-1.5 sticky bottom-0">
                        <button
                          type="button"
                          onClick={() => handleFooterClick(comp)}
                          className="w-full h-10 bg-[#00a884] hover:bg-[#008f70] active:scale-[0.98] text-white font-bold rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                        >
                          <span>{comp.label || 'Submit'}</span>
                        </button>
                      </div>
                    );

                  default:
                    return null;
                }
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── META AI SPARKLE & DISCLAIMER ─── */}
      <div className="mt-2.5 text-[10px] text-muted-c text-center flex items-center justify-center gap-1.5 select-none">
        <span>Rendering and interaction varies based on device.</span>
        <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 flex items-center justify-center text-white shrink-0">
          <Sparkles className="w-1.5 h-1.5" />
        </div>
      </div>

      {/* ─── SUBMISSION SIMULATION MODAL ─── */}
      {submissionSuccessPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md surface rounded-2xl border border-base-c shadow-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
              <h4 className="text-sm font-bold text-primary-c">WhatsApp Flow Submitted!</h4>
            </div>
            <p className="text-xs text-secondary-c">
              The Flow completed and captured the submitted form payload:
            </p>
            <pre className="p-3 bg-subtle-c rounded-xl border border-base-c text-[11px] font-mono overflow-x-auto text-emerald-600 max-h-48">
              {JSON.stringify(submissionSuccessPayload, null, 2)}
            </pre>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSubmissionSuccessPayload(null)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
