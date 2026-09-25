import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Save, Send, Share2, MoreHorizontal, Code2, LayoutList,
  Sparkles, CheckCircle2, Loader2, AlertCircle, RefreshCw,
  Download, Upload, Maximize2, Minimize2, ChevronRight, Check
} from 'lucide-react';
import { MetaFlowScreen, FlowValidationError } from './types';
import {
  validateMetaFlowJson,
  screensToMetaFlowJson,
  convertSimpleFieldsToScreens,
  convertScreensToSimpleFields,
  createEmptyScreen
} from './metaFlowParser';
import { MetaFlowCodeEditor } from './MetaFlowCodeEditor';
import { MetaFlowVisualBuilder } from './MetaFlowVisualBuilder';
import { MetaFlowPhonePreview } from './MetaFlowPhonePreview';
import { MetaFlowDiagnosticsPanel } from './MetaFlowDiagnosticsPanel';
import { FlowCategoryType, FlowFieldItem } from '@/lib/whatsappFlowsApi';
import { cx } from '@/lib/types';

interface MetaFlowStudioProps {
  flowId: string | null;
  initialName: string;
  initialCategory: FlowCategoryType;
  initialFields: FlowFieldItem[];
  initialConfirmationMessage: string;
  onSaveDraft: (data: { name: string; category: FlowCategoryType; fields: FlowFieldItem[]; confirmationMessage: string; flowJson: string }) => Promise<void>;
  onPublish: (flowId?: string) => Promise<void>;
  onBack: () => void;
  onLoadMasterFields: (category: string) => Promise<void>;
  onOpenAiModal: () => void;
  actionLoading: string | null;
  showToast: (msg: string) => void;
}

export const MetaFlowStudio: React.FC<MetaFlowStudioProps> = ({
  flowId,
  initialName,
  initialCategory,
  initialFields,
  initialConfirmationMessage,
  onSaveDraft,
  onPublish,
  onBack,
  onLoadMasterFields,
  onOpenAiModal,
  actionLoading,
  showToast,
}) => {
  const [flowName, setFlowName] = useState(initialName || 'Customer Feedback Form');
  const [flowCategory, setFlowCategory] = useState<FlowCategoryType>(initialCategory || 'SURVEY');
  const [confirmationMessage, setConfirmationMessage] = useState(initialConfirmationMessage || 'Thank you! We have received your submission.');
  const [viewMode, setViewMode] = useState<'code' | 'visual'>('code');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Initialize screens
  const [screens, setScreens] = useState<MetaFlowScreen[]>(() => {
    if (initialFields && initialFields.length > 0) {
      return convertSimpleFieldsToScreens(initialFields, initialName, 'Please complete the form below:');
    }
    return [createEmptyScreen('MAIN_SCREEN', initialName || 'Customer Feedback Form', true)];
  });

  const [activeScreenId, setActiveScreenId] = useState<string>(() => {
    return screens[0]?.id || 'MAIN_SCREEN';
  });

  // Flow JSON text state
  const [jsonString, setJsonString] = useState<string>(() => {
    return screensToMetaFlowJson(screens, '7.0');
  });

  // Real-time validation errors
  const [validationErrors, setValidationErrors] = useState<FlowValidationError[]>([]);

  // Validate JSON whenever it changes
  useEffect(() => {
    const errs = validateMetaFlowJson(jsonString);
    setValidationErrors(errs);
  }, [jsonString]);

  // Handle JSON direct typing
  const handleJsonChange = (newJson: string) => {
    setJsonString(newJson);
    try {
      const parsed = JSON.parse(newJson);
      if (parsed && Array.isArray(parsed.screens) && parsed.screens.length > 0) {
        setScreens(parsed.screens);
        if (!parsed.screens.some((s: any) => s.id === activeScreenId)) {
          setActiveScreenId(parsed.screens[0].id);
        }
      }
    } catch {
      // Handled by validation errors
    }
  };

  // Handle Visual Screens Update
  const handleScreensUpdate = (newScreens: MetaFlowScreen[]) => {
    setScreens(newScreens);
    const compiled = screensToMetaFlowJson(newScreens, '7.0');
    setJsonString(compiled);
  };

  const handleRunValidation = () => {
    const errs = validateMetaFlowJson(jsonString);
    setValidationErrors(errs);
    if (errs.length === 0) {
      showToast('✅ Flow JSON verified with 0 errors!');
    } else {
      showToast(`⚠️ Found ${errs.length} validation issues.`);
    }
  };

  const handleSave = async () => {
    const simpleFields = convertScreensToSimpleFields(screens);
    await onSaveDraft({
      name: flowName,
      category: flowCategory,
      fields: simpleFields,
      confirmationMessage,
      flowJson: jsonString,
    });
  };

  const handleExportJson = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flowName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_flow.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported Meta Flow JSON');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleJsonChange(content);
        showToast('Imported Flow JSON successfully!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className={cx(
        'flex flex-col space-y-3 transition-all',
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#f0f2f5] dark:bg-[#18191a] p-4 lg:p-6 overflow-y-auto'
          : 'relative w-full'
      )}
    >
      {/* ─── META MANAGER STUDIO TOP BAR ─── */}
      <div className="surface px-4 py-2.5 rounded-xl border border-base-c shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Flow Identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 surface hover:bg-subtle-c text-primary-c rounded-lg border border-base-c shadow-xs transition"
            title="Back to Flows"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Meta Flows Icon */}
          <div className="w-8 h-8 rounded-lg bg-[#00a884] text-white flex items-center justify-center shrink-0 shadow-xs">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16 13H13V16C13 16.55 12.55 17 12 17C11.45 17 11 16.55 11 16V13H8C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11H11V8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8V11H16C16.55 11 17 11.45 17 12C17 12.55 16.55 13 16 13Z" />
            </svg>
          </div>

          <div className="flex flex-col min-w-0">
            {/* Breadcrumb line */}
            <div className="flex items-center gap-1 text-[10px] text-muted-c font-medium leading-none mb-1">
              <span className="text-secondary-c font-semibold">WhatsApp Manager</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span>Flows</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-primary-c font-semibold">Edit</span>
            </div>

            {/* Flow Name Input + Pill */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                placeholder="Flow Name…"
                className="text-xs font-bold text-primary-c bg-transparent border-0 hover:bg-subtle-c focus:bg-subtle-c px-1 py-0.5 rounded outline-none transition max-w-[200px] truncate"
              />
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-500/10 text-amber-600 border border-amber-500/25 uppercase">
                <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></span>
                Draft
              </span>
            </div>
          </div>
        </div>

        {/* Center: Mode Tabs */}
        <div className="flex items-center gap-1 bg-subtle-c p-0.5 rounded-lg border border-base-c">
          <button
            type="button"
            onClick={() => setViewMode('code')}
            className={cx(
              'flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition',
              viewMode === 'code' ? 'surface text-primary-c font-bold shadow-xs' : 'text-secondary-c hover:text-primary-c'
            )}
          >
            <Code2 className="w-3.5 h-3.5 text-blue-600" />
            <span>JSON Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('visual')}
            className={cx(
              'flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition',
              viewMode === 'visual' ? 'surface text-primary-c font-bold shadow-xs' : 'text-secondary-c hover:text-primary-c'
            )}
          >
            <LayoutList className="w-3.5 h-3.5 text-emerald-600" />
            <span>Form Builder</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={actionLoading === 'draft'}
            className="h-8 px-3.5 surface hover:bg-subtle-c text-primary-c text-xs font-semibold rounded-lg border border-base-c shadow-xs transition disabled:opacity-50 flex items-center gap-1"
          >
            {actionLoading === 'draft' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3.5 h-3.5 text-muted-c" />}
            <span>Save</span>
          </button>

          <button
            type="button"
            onClick={() => onPublish(flowId || undefined)}
            disabled={actionLoading === 'publish'}
            className="h-8 px-3.5 bg-[#00a884] hover:bg-[#008f70] text-white text-xs font-bold rounded-lg shadow-xs transition active:scale-95 disabled:opacity-50 flex items-center gap-1"
          >
            {actionLoading === 'publish' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Publish</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="h-8 w-8 surface hover:bg-subtle-c text-secondary-c hover:text-primary-c rounded-lg border border-base-c shadow-xs transition flex items-center justify-center"
            title="Export JSON"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(prev => !prev)}
            className="h-8 w-8 surface hover:bg-subtle-c text-secondary-c hover:text-primary-c rounded-lg border border-base-c shadow-xs transition flex items-center justify-center"
            title={isFullscreen ? 'Exit full screen' : 'Expand full screen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoreMenu(prev => !prev)}
              className="h-8 w-8 surface hover:bg-subtle-c text-secondary-c hover:text-primary-c rounded-lg border border-base-c shadow-xs transition flex items-center justify-center"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-44 surface rounded-xl border border-base-c shadow-soft-lg p-1 z-30 space-y-0.5 animate-in fade-in">
                <button
                  type="button"
                  onClick={() => { handleExportJson(); setShowMoreMenu(false); }}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-primary-c hover:bg-subtle-c rounded-lg flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-blue-500" /> Export Flow JSON
                </button>
                <label className="w-full text-left px-2.5 py-1.5 text-xs text-primary-c hover:bg-subtle-c rounded-lg flex items-center gap-2 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-emerald-500" /> Import Flow JSON
                  <input type="file" accept=".json" onChange={(e) => { handleImportJson(e); setShowMoreMenu(false); }} className="hidden" />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── STUDIO MAIN WORKSPACE (2-COLUMNS) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left Column: Editor / Form Builder + Diagnostics */}
        <div className="lg:col-span-8 space-y-3">
          {viewMode === 'code' ? (
            <div className="h-[460px]">
              <MetaFlowCodeEditor
                jsonString={jsonString}
                onChange={handleJsonChange}
                errors={validationErrors}
                onRunValidation={handleRunValidation}
                activeScreenId={activeScreenId}
              />
            </div>
          ) : (
            <MetaFlowVisualBuilder
              screens={screens}
              activeScreenId={activeScreenId}
              onSelectScreen={setActiveScreenId}
              onUpdateScreens={handleScreensUpdate}
              onLoadMasterFields={onLoadMasterFields}
              onOpenAiModal={onOpenAiModal}
            />
          )}

          {/* Bottom Dock */}
          <MetaFlowDiagnosticsPanel
            errors={validationErrors}
            screensCount={screens.length}
            onSelectScreen={setActiveScreenId}
          />
        </div>

        {/* Right Column: WhatsApp Mobile Preview */}
        <div className="lg:col-span-4 flex justify-center sticky top-4">
          <div className="w-full max-w-[320px] surface p-3 rounded-2xl border border-base-c shadow-xs flex flex-col items-center">
            <MetaFlowPhonePreview
              screens={screens}
              activeScreenId={activeScreenId}
              onSelectScreen={setActiveScreenId}
              flowName={flowName}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
