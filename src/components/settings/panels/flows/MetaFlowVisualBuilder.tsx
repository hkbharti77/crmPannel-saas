import React, { useState } from 'react';
import {
  Plus, Trash2, ArrowUp, ArrowDown, ChevronRight, CheckCircle2,
  Type, AlignLeft, List, CheckSquare, Calendar, ToggleLeft, Link,
  Send, Sparkles, Layers, ShieldCheck, HelpCircle, GripVertical, Settings2, Copy
} from 'lucide-react';
import { MetaFlowScreen, MetaFlowComponent, FlowComponentType } from './types';
import { createDefaultComponent, createEmptyScreen } from './metaFlowParser';
import { FlowFieldItem } from '@/lib/whatsappFlowsApi';
import { cx } from '@/lib/types';

interface MetaFlowVisualBuilderProps {
  screens: MetaFlowScreen[];
  activeScreenId: string;
  onSelectScreen: (id: string) => void;
  onUpdateScreens: (screens: MetaFlowScreen[]) => void;
  onLoadMasterFields: (category: string) => void;
  onOpenAiModal: () => void;
}

export const MetaFlowVisualBuilder: React.FC<MetaFlowVisualBuilderProps> = ({
  screens,
  activeScreenId,
  onSelectScreen,
  onUpdateScreens,
  onLoadMasterFields,
  onOpenAiModal,
}) => {
  const [newScreenName, setNewScreenName] = useState('');
  const [showAddScreenModal, setShowAddScreenModal] = useState(false);
  const [selectedCompIndex, setSelectedCompIndex] = useState<number | null>(0);

  const activeScreen = screens.find(s => s.id === activeScreenId) || screens[0];

  const getScreenComponents = (screen: MetaFlowScreen): MetaFlowComponent[] => {
    if (!screen || !screen.layout || !screen.layout.children) return [];
    const formChild = screen.layout.children.find(c => c.type === 'Form');
    if (formChild && Array.isArray(formChild.children)) {
      return formChild.children;
    }
    return screen.layout.children;
  };

  const setScreenComponents = (newComponents: MetaFlowComponent[]) => {
    const updatedScreens = screens.map(s => {
      if (s.id !== activeScreen.id) return s;
      const isWrappedInForm = s.layout.children.some(c => c.type === 'Form');
      if (isWrappedInForm) {
        return {
          ...s,
          layout: {
            ...s.layout,
            children: s.layout.children.map(c => {
              if (c.type === 'Form') {
                return { ...c, children: newComponents };
              }
              return c;
            })
          }
        };
      }
      return {
        ...s,
        layout: {
          ...s.layout,
          children: newComponents
        }
      };
    });
    onUpdateScreens(updatedScreens);
  };

  const handleAddScreen = () => {
    if (!newScreenName.trim()) return;
    const cleanId = newScreenName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (screens.some(s => s.id === cleanId)) {
      alert('A screen with this ID already exists.');
      return;
    }
    const newScreen = createEmptyScreen(cleanId, newScreenName.trim(), false);
    onUpdateScreens([...screens, newScreen]);
    onSelectScreen(cleanId);
    setNewScreenName('');
    setShowAddScreenModal(false);
  };

  const handleDeleteScreen = (screenId: string) => {
    if (screens.length <= 1) {
      alert('A flow must have at least one screen.');
      return;
    }
    const remaining = screens.filter(s => s.id !== screenId);
    onUpdateScreens(remaining);
    if (activeScreenId === screenId) {
      onSelectScreen(remaining[0].id);
    }
  };

  const handleToggleTerminal = (screenId: string) => {
    const updated = screens.map(s => s.id === screenId ? { ...s, terminal: !s.terminal } : s);
    onUpdateScreens(updated);
  };

  const handleAddComponent = (type: FlowComponentType) => {
    const currentComponents = getScreenComponents(activeScreen);
    const newComp = createDefaultComponent(type);

    const footerIndex = currentComponents.findIndex(c => c.type === 'Footer');
    if (footerIndex >= 0 && type !== 'Footer') {
      const copy = [...currentComponents];
      copy.splice(footerIndex, 0, newComp);
      setScreenComponents(copy);
      setSelectedCompIndex(footerIndex);
    } else {
      setScreenComponents([...currentComponents, newComp]);
      setSelectedCompIndex(currentComponents.length);
    }
  };

  const handleUpdateComponent = (index: number, updated: MetaFlowComponent) => {
    const current = getScreenComponents(activeScreen);
    const copy = [...current];
    copy[index] = updated;
    setScreenComponents(copy);
  };

  const handleDeleteComponent = (index: number) => {
    const current = getScreenComponents(activeScreen);
    setScreenComponents(current.filter((_, i) => i !== index));
    if (selectedCompIndex === index) setSelectedCompIndex(null);
  };

  const handleMoveComponent = (index: number, direction: 'up' | 'down') => {
    const current = getScreenComponents(activeScreen);
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= current.length) return;
    const copy = [...current];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setScreenComponents(copy);
    setSelectedCompIndex(targetIdx);
  };

  const currentComponents = getScreenComponents(activeScreen);

  return (
    <div className="space-y-3.5">
      {/* ─── SCREENS NAV TABS ─── */}
      <div className="surface p-3.5 rounded-xl border border-base-c shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-primary-c uppercase tracking-wider">
              Flow Screens ({screens.length})
            </h4>
          </div>

          <button
            type="button"
            onClick={() => setShowAddScreenModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Screen</span>
          </button>
        </div>

        {/* Screen Chips Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {screens.map((screen, idx) => {
            const isActive = screen.id === activeScreen.id;
            return (
              <div
                key={screen.id}
                className={cx(
                  'group shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer',
                  isActive
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                    : 'surface border-base-c text-secondary-c hover:border-slate-400'
                )}
                onClick={() => onSelectScreen(screen.id)}
              >
                <span className="text-[10px] font-mono text-muted-c">#{idx + 1}</span>
                <span>{screen.title || screen.id}</span>

                {screen.terminal && (
                  <span className="px-1.5 py-0.2 text-[9px] bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded font-bold uppercase">
                    Terminal
                  </span>
                )}

                {screens.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteScreen(screen.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-500 text-muted-c transition p-0.5"
                    title="Delete screen"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── MASTER CRM PRESETS & AI ─── */}
      <div className="p-3.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
              Quick Form Templates & CRM Presets:
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenAiModal}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-400 hover:to-purple-400 text-xs font-bold rounded-lg shadow-xs transition active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Generate</span>
          </button>
        </div>

        {/* Preset Chips */}
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          <button
            type="button"
            onClick={() => onLoadMasterFields('appointment')}
            className="px-2.5 py-1 surface text-xs font-semibold rounded-lg border border-base-c hover:bg-subtle-c shadow-xs text-primary-c flex items-center gap-1"
          >
            <span>📅</span> Appointments
          </button>
          <button
            type="button"
            onClick={() => onLoadMasterFields('lead')}
            className="px-2.5 py-1 surface text-xs font-semibold rounded-lg border border-base-c hover:bg-subtle-c shadow-xs text-primary-c flex items-center gap-1"
          >
            <span>🎯</span> Lead Gen
          </button>
          <button
            type="button"
            onClick={() => onLoadMasterFields('support')}
            className="px-2.5 py-1 surface text-xs font-semibold rounded-lg border border-base-c hover:bg-subtle-c shadow-xs text-primary-c flex items-center gap-1"
          >
            <span>🎫</span> Helpdesk
          </button>
          <button
            type="button"
            onClick={() => onLoadMasterFields('feedback')}
            className="px-2.5 py-1 surface text-xs font-semibold rounded-lg border border-base-c hover:bg-subtle-c shadow-xs text-primary-c flex items-center gap-1"
          >
            <span>⭐</span> Reviews
          </button>
        </div>
      </div>

      {/* ─── ACTIVE SCREEN SETTINGS ─── */}
      <div className="surface p-4 rounded-xl border border-base-c space-y-3.5 shadow-xs">
        {/* Screen Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-base-c pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Settings2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-primary-c">Screen Settings:</span>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-500/20">
              {activeScreen.id}
            </span>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-secondary-c cursor-pointer select-none">
            <input
              type="checkbox"
              checked={activeScreen.terminal ?? false}
              onChange={() => handleToggleTerminal(activeScreen.id)}
              className="w-4 h-4 rounded border-base-c text-emerald-600 focus:ring-emerald-500"
            />
            <span>Terminal Screen (Concludes Flow)</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-secondary-c block mb-1">Screen Title</label>
            <input
              type="text"
              value={activeScreen.title || ''}
              onChange={(e) => {
                const updated = screens.map(s => s.id === activeScreen.id ? { ...s, title: e.target.value } : s);
                onUpdateScreens(updated);
              }}
              placeholder="e.g. Personal Details"
              className="w-full px-3 py-1.5 surface border border-base-c rounded-lg text-xs text-primary-c"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-secondary-c block mb-1">Screen ID (Unique Key)</label>
            <input
              type="text"
              value={activeScreen.id}
              disabled
              className="w-full px-3 py-1.5 bg-subtle-c border border-base-c rounded-lg text-xs font-mono text-muted-c"
            />
          </div>
        </div>
      </div>

      {/* ─── COMPONENT PALETTE (ADD ELEMENTS) ─── */}
      <div className="surface p-3.5 rounded-xl border border-base-c shadow-xs space-y-2.5">
        <h5 className="text-[11px] font-bold text-muted-c uppercase tracking-wider">
          + Add Form Element to {activeScreen.title || activeScreen.id}
        </h5>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          <button
            type="button"
            onClick={() => handleAddComponent('TextHeading')}
            className="flex items-center gap-1.5 p-2 surface hover:bg-subtle-c text-primary-c rounded-lg border border-base-c text-[11px] font-semibold shadow-xs"
          >
            <Type className="w-3.5 h-3.5 text-blue-500" />
            <span>Heading</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddComponent('TextBody')}
            className="flex items-center gap-1.5 p-2 surface hover:bg-subtle-c text-primary-c rounded-lg border border-base-c text-[11px] font-semibold shadow-xs"
          >
            <AlignLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Text Body</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddComponent('TextInput')}
            className="flex items-center gap-1.5 p-2 surface hover:bg-subtle-c text-primary-c rounded-lg border border-base-c text-[11px] font-semibold shadow-xs"
          >
            <Type className="w-3.5 h-3.5 text-emerald-500" />
            <span>Text Input</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddComponent('TextArea')}
            className="flex items-center gap-1.5 p-2 surface hover:bg-subtle-c text-primary-c rounded-lg border border-base-c text-[11px] font-semibold shadow-xs"
          >
            <AlignLeft className="w-3.5 h-3.5 text-purple-500" />
            <span>Textarea</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddComponent('Dropdown')}
            className="flex items-center gap-1.5 p-2 surface hover:bg-subtle-c text-primary-c rounded-lg border border-base-c text-[11px] font-semibold shadow-xs"
          >
            <List className="w-3.5 h-3.5 text-amber-500" />
            <span>Dropdown</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddComponent('RadioButtonsGroup')}
            className="flex items-center gap-1.5 p-2 surface hover:bg-subtle-c text-primary-c rounded-lg border border-base-c text-[11px] font-semibold shadow-xs"
          >
            <ToggleLeft className="w-3.5 h-3.5 text-indigo-500" />
            <span>Radio Group</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddComponent('CheckboxGroup')}
            className="flex items-center gap-1.5 p-2 surface hover:bg-subtle-c text-primary-c rounded-lg border border-base-c text-[11px] font-semibold shadow-xs"
          >
            <CheckSquare className="w-3.5 h-3.5 text-cyan-500" />
            <span>Checkboxes</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddComponent('DatePicker')}
            className="flex items-center gap-1.5 p-2 surface hover:bg-subtle-c text-primary-c rounded-lg border border-base-c text-[11px] font-semibold shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5 text-rose-500" />
            <span>Date Picker</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddComponent('OptIn')}
            className="flex items-center gap-1.5 p-2 surface hover:bg-subtle-c text-primary-c rounded-lg border border-base-c text-[11px] font-semibold shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Consent / Opt-In</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddComponent('Footer')}
            className="flex items-center gap-1.5 p-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-500/30 text-[11px] font-bold shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Footer</span>
          </button>
        </div>
      </div>

      {/* ─── SCREEN COMPONENTS LIST (DRAG / REORDER / EDIT) ─── */}
      <div className="surface p-4 rounded-xl border border-base-c space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-bold text-muted-c uppercase tracking-wider">
            Screen Elements ({currentComponents.length})
          </h5>
          <span className="text-[10px] text-muted-c">Click element to edit properties</span>
        </div>

        {currentComponents.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-c border border-dashed border-base-c rounded-lg">
            No components added to this screen yet. Click an element above to add it.
          </div>
        ) : (
          <div className="space-y-2.5">
            {currentComponents.map((comp, idx) => {
              const isSelected = selectedCompIndex === idx;

              return (
                <div
                  key={idx}
                  className={cx(
                    'p-3 rounded-lg border transition-all space-y-3',
                    isSelected
                      ? 'bg-subtle-c border-emerald-500 shadow-soft'
                      : 'surface border-base-c hover:border-slate-400'
                  )}
                  onClick={() => setSelectedCompIndex(idx)}
                >
                  {/* Element Header Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">
                        {comp.type}
                      </span>
                      <span className="text-xs font-bold text-primary-c">
                        {comp.label || comp.text || comp.name || 'Component'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleMoveComponent(idx, 'up'); }}
                        disabled={idx === 0}
                        className="p-1 text-muted-c hover:text-primary-c disabled:opacity-30 rounded hover:bg-subtle-c"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleMoveComponent(idx, 'down'); }}
                        disabled={idx === currentComponents.length - 1}
                        className="p-1 text-muted-c hover:text-primary-c disabled:opacity-30 rounded hover:bg-subtle-c"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteComponent(idx); }}
                        className="p-1 text-muted-c hover:text-rose-500 rounded hover:bg-rose-500/10"
                        title="Delete Element"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Element Property Fields */}
                  <div className="space-y-2.5 pt-1 border-t border-base-c/60">
                    {(comp.type === 'TextHeading' || comp.type === 'TextSubheading' || comp.type === 'TextBody' || comp.type === 'TextCaption') && (
                      <div>
                        <label className="text-[10px] font-semibold text-muted-c block mb-1">Display Text</label>
                        <input
                          type="text"
                          value={comp.text || ''}
                          onChange={(e) => handleUpdateComponent(idx, { ...comp, text: e.target.value })}
                          placeholder="Heading or instruction text…"
                          className="w-full px-2.5 py-1.5 surface border border-base-c rounded text-xs text-primary-c"
                        />
                      </div>
                    )}

                    {['TextInput', 'TextArea', 'Dropdown', 'RadioButtonsGroup', 'CheckboxGroup', 'DatePicker', 'OptIn'].includes(comp.type) && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-muted-c block mb-1">Field Label</label>
                            <input
                              type="text"
                              value={comp.label || ''}
                              onChange={(e) => handleUpdateComponent(idx, { ...comp, label: e.target.value })}
                              placeholder="e.g. Your Full Name"
                              className="w-full px-2.5 py-1.5 surface border border-base-c rounded text-xs text-primary-c"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-semibold text-muted-c block mb-1">Variable Name (Payload Key)</label>
                            <input
                              type="text"
                              value={comp.name || ''}
                              onChange={(e) => handleUpdateComponent(idx, { ...comp, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                              placeholder="e.g. full_name"
                              className="w-full px-2.5 py-1.5 surface border border-base-c rounded text-xs text-emerald-600 font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          {comp.type === 'TextInput' && (
                            <div className="flex items-center gap-2">
                              <label className="text-[10px] font-semibold text-muted-c">Input Type:</label>
                              <select
                                value={comp['input-type'] || 'text'}
                                onChange={(e) => handleUpdateComponent(idx, { ...comp, 'input-type': e.target.value as any })}
                                className="px-2 py-1 surface border border-base-c rounded text-xs"
                              >
                                <option value="text">Text</option>
                                <option value="email">Email</option>
                                <option value="phone">Phone Number</option>
                                <option value="number">Numeric</option>
                                <option value="password">Password</option>
                              </select>
                            </div>
                          )}

                          <label className="flex items-center gap-1.5 text-xs text-muted-c cursor-pointer">
                            <input
                              type="checkbox"
                              checked={comp.required ?? false}
                              onChange={(e) => handleUpdateComponent(idx, { ...comp, required: e.target.checked })}
                              className="rounded border-base-c text-emerald-600"
                            />
                            <span>Required Field</span>
                          </label>
                        </div>

                        {/* Options for Dropdown / Radio / Checkbox */}
                        {['Dropdown', 'RadioButtonsGroup', 'CheckboxGroup'].includes(comp.type) && (
                          <div className="pt-2 border-t border-base-c space-y-2">
                            <label className="text-[10px] font-semibold text-muted-c block">
                              Options ({comp['data-source']?.length || 0}):
                            </label>
                            <div className="space-y-1.5">
                              {(comp['data-source'] || []).map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={opt.title}
                                    onChange={(e) => {
                                      const updatedDs = [...(comp['data-source'] || [])];
                                      updatedDs[optIdx] = {
                                        id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                                        title: e.target.value
                                      };
                                      handleUpdateComponent(idx, { ...comp, 'data-source': updatedDs });
                                    }}
                                    placeholder="Option Title"
                                    className="flex-1 px-2.5 py-1 surface border border-base-c rounded text-xs"
                                  />
                                  <span className="text-[10px] font-mono text-muted-c">{opt.id}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedDs = (comp['data-source'] || []).filter((_, i) => i !== optIdx);
                                      handleUpdateComponent(idx, { ...comp, 'data-source': updatedDs });
                                    }}
                                    className="text-muted-c hover:text-rose-500 p-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  const currentDs = comp['data-source'] || [];
                                  const newOpt = { id: `opt_${currentDs.length + 1}`, title: `Option ${currentDs.length + 1}` };
                                  handleUpdateComponent(idx, { ...comp, 'data-source': [...currentDs, newOpt] });
                                }}
                                className="text-[11px] font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Add Option
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer / Action */}
                    {comp.type === 'Footer' && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-muted-c block mb-1">Button Label</label>
                            <input
                              type="text"
                              value={comp.label || ''}
                              onChange={(e) => handleUpdateComponent(idx, { ...comp, label: e.target.value })}
                              placeholder="Submit / Continue"
                              className="w-full px-2.5 py-1.5 surface border border-base-c rounded text-xs text-primary-c"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-semibold text-muted-c block mb-1">Click Action</label>
                            <select
                              value={comp['on-click-action']?.name || 'complete'}
                              onChange={(e) => {
                                const actionName = e.target.value as 'complete' | 'navigate' | 'data_exchange';
                                handleUpdateComponent(idx, {
                                  ...comp,
                                  'on-click-action': {
                                    name: actionName,
                                    ...(actionName === 'navigate' ? { next: { type: 'screen', name: screens.find(s => s.id !== activeScreen.id)?.id || 'MAIN_SCREEN' } } : {}),
                                    ...(actionName === 'complete' ? { payload: {} } : {})
                                  }
                                });
                              }}
                              className="w-full px-2.5 py-1.5 surface border border-base-c rounded text-xs"
                            >
                              <option value="complete">Complete (Submit & Finish Flow)</option>
                              <option value="navigate">Navigate (Go to Next Screen)</option>
                              <option value="data_exchange">Data Exchange (Call Server Endpoint)</option>
                            </select>
                          </div>
                        </div>

                        {comp['on-click-action']?.name === 'navigate' && (
                          <div>
                            <label className="text-[10px] font-semibold text-muted-c block mb-1">Target Screen to Navigate:</label>
                            <select
                              value={comp['on-click-action']?.next?.name || ''}
                              onChange={(e) => {
                                handleUpdateComponent(idx, {
                                  ...comp,
                                  'on-click-action': {
                                    ...comp['on-click-action'],
                                    name: 'navigate',
                                    next: { type: 'screen', name: e.target.value }
                                  }
                                });
                              }}
                              className="w-full px-2.5 py-1.5 surface border border-base-c rounded text-xs text-primary-c font-semibold"
                            >
                              {screens.map(s => (
                                <option key={s.id} value={s.id}>{s.title} ({s.id})</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── ADD SCREEN MODAL ─── */}
      {showAddScreenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm surface rounded-xl border border-base-c shadow-soft-lg p-5 space-y-4">
            <h4 className="text-sm font-bold text-primary-c flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" /> Add New WhatsApp Flow Screen
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-secondary-c block mb-1">Screen Name / Title</label>
                <input
                  type="text"
                  value={newScreenName}
                  onChange={(e) => setNewScreenName(e.target.value)}
                  placeholder="e.g. Appointment Slot Selection"
                  className="w-full px-3 py-2 surface border border-base-c rounded-lg text-xs text-primary-c"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-base-c">
              <button
                type="button"
                onClick={() => setShowAddScreenModal(false)}
                className="px-3 py-1.5 surface text-xs font-semibold text-secondary-c rounded-lg border border-base-c"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddScreen}
                disabled={!newScreenName.trim()}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50"
              >
                Create Screen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
