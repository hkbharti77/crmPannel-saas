import React, { useState, useEffect, useMemo } from 'react';
import {
  EmailBuilderDocument,
  EmailBlock,
  EmailBlockType,
  HeaderBlockData,
  HeroBlockData,
  TextBlockData,
  ButtonBlockData,
  ImageBlockData,
  Grid2BlockData,
  DividerBlockData,
  SpacerBlockData,
  SocialBlockData,
  FooterBlockData,
} from './types';
import {
  compileEmailHtml,
  createDefaultEmailDocument,
  validateEmailDocument,
} from './emailHtmlCompiler';
import {
  Layout,
  Type,
  Square,
  Image as ImageIcon,
  Columns,
  Minus,
  Maximize2,
  Share2,
  ShieldCheck,
  Smartphone,
  Monitor,
  Code2,
  Eye,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Plus,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface VisualEmailBuilderProps {
  initialJson?: string;
  initialHtml?: string;
  onChange?: (result: { html: string; builderJson: string }) => void;
  readOnly?: boolean;
}

export const VisualEmailBuilder: React.FC<VisualEmailBuilderProps> = ({
  initialJson,
  initialHtml,
  onChange,
  readOnly = false,
}) => {
  const [doc, setDoc] = useState<EmailBuilderDocument>(() => {
    if (initialJson) {
      try {
        const parsed = JSON.parse(initialJson);
        if (parsed.blocks && Array.isArray(parsed.blocks)) {
          return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse initial builder JSON, using default template', e);
      }
    }
    return createDefaultEmailDocument();
  });

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'mobile'>('desktop');
  const [activeInspectorTab, setActiveInspectorTab] = useState<'block' | 'canvas'>('block');
  const [rawHtmlCode, setRawHtmlCode] = useState<string>('');
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  // Compile HTML on doc changes and propagate
  const compiledHtml = useMemo(() => {
    return compileEmailHtml(doc);
  }, [doc]);

  const validation = useMemo(() => {
    return validateEmailDocument(doc);
  }, [doc]);

  useEffect(() => {
    setRawHtmlCode(compiledHtml);
    if (onChange) {
      onChange({
        html: compiledHtml,
        builderJson: JSON.stringify(doc),
      });
    }
  }, [compiledHtml, doc, onChange]);

  const selectedBlock = useMemo(() => {
    return doc.blocks.find((b) => b.id === selectedBlockId) || null;
  }, [doc.blocks, selectedBlockId]);

  // Block Manipulation Handlers
  const handleAddBlock = (type: EmailBlockType) => {
    const newId = 'block-' + Math.random().toString(36).substr(2, 9);
    let newBlockData: any = {};

    switch (type) {
      case 'header':
        newBlockData = {
          title: 'Brand Announcement',
          subtitle: 'Important Update',
          alignment: 'center',
          bgColor: '#ffffff',
          textColor: '#0f172a',
        } as HeaderBlockData;
        break;
      case 'hero':
        newBlockData = {
          headline: 'High-Converting Headline',
          subheadline: 'Engaging subheadline detailing your primary value proposition.',
          buttonText: 'Get Started',
          buttonUrl: 'https://example.com',
          bgColor: '#0f172a',
          textColor: '#ffffff',
        } as HeroBlockData;
        break;
      case 'text':
        newBlockData = {
          content: 'Add your personalized body copy here. You can use tags like {{name}} or {{email}}.',
          fontSize: 15,
          lineHeight: 1.6,
          color: '#334155',
          alignment: 'left',
        } as TextBlockData;
        break;
      case 'button':
        newBlockData = {
          text: 'Confirm Your Reservation',
          url: 'https://example.com/confirm',
          alignment: 'center',
          bgColor: '#2563eb',
          textColor: '#ffffff',
          borderRadius: 8,
          fullWidth: false,
        } as ButtonBlockData;
        break;
      case 'image':
        newBlockData = {
          imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80',
          alt: 'Featured Image',
          caption: 'Prime Architecture & Interior Design',
          alignment: 'center',
          maxWidth: 100,
        } as ImageBlockData;
        break;
      case 'grid2':
        newBlockData = {
          col1Title: 'Feature One',
          col1Text: 'Concise explanation of first core benefit or property amenity.',
          col2Title: 'Feature Two',
          col2Text: 'Concise explanation of second core benefit or property amenity.',
          bgColor: '#ffffff',
          textColor: '#0f172a',
        } as Grid2BlockData;
        break;
      case 'divider':
        newBlockData = {
          style: 'solid',
          color: '#e2e8f0',
          thickness: 1,
          marginY: 20,
        } as DividerBlockData;
        break;
      case 'spacer':
        newBlockData = {
          height: 24,
        } as SpacerBlockData;
        break;
      case 'social':
        newBlockData = {
          twitterUrl: 'https://twitter.com',
          linkedinUrl: 'https://linkedin.com',
          facebookUrl: 'https://facebook.com',
          alignment: 'center',
        } as SocialBlockData;
        break;
      case 'footer':
        newBlockData = {
          companyName: 'ChatCRM Realty Platform',
          address: '100 Innovation Parkway, New York, NY',
          unsubscribeNotice: '<a href="{{unsubscribe_link}}" style="color: #64748b; text-decoration: underline;">Unsubscribe</a> from future notifications.',
          textColor: '#94a3b8',
          bgColor: '#f8fafc',
        } as FooterBlockData;
        break;
    }

    const newBlock: EmailBlock = { id: newId, type, data: newBlockData };

    setDoc((prev) => {
      let insertIndex = prev.blocks.length;
      if (selectedBlockId) {
        const idx = prev.blocks.findIndex((b) => b.id === selectedBlockId);
        if (idx !== -1) insertIndex = idx + 1;
      }
      const updated = [...prev.blocks];
      updated.splice(insertIndex, 0, newBlock);
      return { ...prev, blocks: updated };
    });

    setSelectedBlockId(newId);
    setActiveInspectorTab('block');
  };

  const handleUpdateBlockData = (blockId: string, updatedFields: Partial<any>) => {
    setDoc((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) =>
        b.id === blockId ? { ...b, data: { ...b.data, ...updatedFields } } : b
      ),
    }));
  };

  const handleDeleteBlock = (blockId: string) => {
    setDoc((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== blockId),
    }));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const handleDuplicateBlock = (blockId: string) => {
    const target = doc.blocks.find((b) => b.id === blockId);
    if (!target) return;

    const clonedId = 'block-' + Math.random().toString(36).substr(2, 9);
    const clonedBlock: EmailBlock = {
      id: clonedId,
      type: target.type,
      data: JSON.parse(JSON.stringify(target.data)),
    };

    setDoc((prev) => {
      const idx = prev.blocks.findIndex((b) => b.id === blockId);
      const updated = [...prev.blocks];
      updated.splice(idx + 1, 0, clonedBlock);
      return { ...prev, blocks: updated };
    });
    setSelectedBlockId(clonedId);
  };

  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    setDoc((prev) => {
      const idx = prev.blocks.findIndex((b) => b.id === blockId);
      if (idx === -1) return prev;
      if (direction === 'up' && idx === 0) return prev;
      if (direction === 'down' && idx === prev.blocks.length - 1) return prev;

      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      const updated = [...prev.blocks];
      const [removed] = updated.splice(idx, 1);
      updated.splice(targetIdx, 0, removed);
      return { ...prev, blocks: updated };
    });
  };

  const handleInsertTag = (tag: string) => {
    if (!selectedBlock) return;
    if (selectedBlock.type === 'text') {
      const textData = selectedBlock.data as TextBlockData;
      handleUpdateBlockData(selectedBlock.id, {
        content: (textData.content || '') + ' ' + tag,
      });
    } else if (selectedBlock.type === 'footer') {
      const footerData = selectedBlock.data as FooterBlockData;
      handleUpdateBlockData(selectedBlock.id, {
        unsubscribeNotice: (footerData.unsubscribeNotice || '') + ' ' + tag,
      });
    }
  };

  return (
    <div className="flex flex-col h-[750px] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans shadow-xl">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Visual Email Designer
              {validation.isValid ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" /> Bulletproof Compliant
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-3 h-3" /> Compliance Alert
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500">Table-based responsive HTML compiler for universal email clients</p>
          </div>
        </div>

        {/* View & Device Toggles */}
        <div className="flex items-center gap-2">
          {/* Desktop / Mobile Switcher */}
          {viewMode === 'visual' && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setDevicePreview('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  devicePreview === 'desktop'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> Desktop
              </button>
              <button
                type="button"
                onClick={() => setDevicePreview('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  devicePreview === 'mobile'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Mobile
              </button>
            </div>
          )}

          {/* Visual vs Code Mode */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('visual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'visual'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Layout className="w-3.5 h-3.5" /> Visual
            </button>
            <button
              type="button"
              onClick={() => setViewMode('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'code'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" /> HTML Code
            </button>
          </div>

          {/* Live Preview Button */}
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 transition-all shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" /> Preview Client
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {viewMode === 'visual' ? (
          <>
            {/* Left Block Palette */}
            {!readOnly && (
              <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col p-4 overflow-y-auto">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                  Add Content Blocks
                </span>
                <div className="grid grid-cols-1 gap-2">
                  <PaletteButton
                    icon={<Type className="w-4 h-4 text-indigo-500" />}
                    title="Header Banner"
                    desc="Logo & branded title"
                    onClick={() => handleAddBlock('header')}
                  />
                  <PaletteButton
                    icon={<Sparkles className="w-4 h-4 text-amber-500" />}
                    title="Hero Showcase"
                    desc="Headline, image & CTA"
                    onClick={() => handleAddBlock('hero')}
                  />
                  <PaletteButton
                    icon={<Type className="w-4 h-4 text-blue-500" />}
                    title="Text / Paragraph"
                    desc="Rich body copy & tags"
                    onClick={() => handleAddBlock('text')}
                  />
                  <PaletteButton
                    icon={<Square className="w-4 h-4 text-emerald-500" />}
                    title="Action Button"
                    desc="Direct click conversion"
                    onClick={() => handleAddBlock('button')}
                  />
                  <PaletteButton
                    icon={<ImageIcon className="w-4 h-4 text-rose-500" />}
                    title="Single Image"
                    desc="Responsive photo block"
                    onClick={() => handleAddBlock('image')}
                  />
                  <PaletteButton
                    icon={<Columns className="w-4 h-4 text-purple-500" />}
                    title="2-Column Grid"
                    desc="Side-by-side features"
                    onClick={() => handleAddBlock('grid2')}
                  />
                  <PaletteButton
                    icon={<Minus className="w-4 h-4 text-slate-500" />}
                    title="Divider Line"
                    desc="Horizontal line breaker"
                    onClick={() => handleAddBlock('divider')}
                  />
                  <PaletteButton
                    icon={<Maximize2 className="w-4 h-4 text-teal-500" />}
                    title="Spacer Gap"
                    desc="Custom vertical padding"
                    onClick={() => handleAddBlock('spacer')}
                  />
                  <PaletteButton
                    icon={<Share2 className="w-4 h-4 text-cyan-500" />}
                    title="Social Links"
                    desc="Social media buttons"
                    onClick={() => handleAddBlock('social')}
                  />
                  <PaletteButton
                    icon={<ShieldCheck className="w-4 h-4 text-rose-600" />}
                    title="Compliance Footer"
                    desc="Address & mandatory unsub"
                    onClick={() => handleAddBlock('footer')}
                  />
                </div>
              </div>
            )}

            {/* Central Canvas Preview */}
            <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950/70 p-6 flex justify-center">
              <div
                style={{
                  maxWidth: devicePreview === 'mobile' ? '375px' : `${doc.settings.maxWidth}px`,
                  backgroundColor: doc.settings.bodyBg,
                }}
                className={`w-full transition-all duration-300 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col min-h-[500px] h-fit`}
              >
                {doc.blocks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                    <Layout className="w-12 h-12 mb-3 stroke-[1.5]" />
                    <p className="text-sm font-semibold">Your email canvas is currently empty</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      Click any block from the left palette to begin crafting your high-converting email.
                    </p>
                    <button
                      type="button"
                      onClick={() => setDoc(createDefaultEmailDocument())}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition"
                    >
                      Load Starter Template
                    </button>
                  </div>
                ) : (
                  doc.blocks.map((block, index) => {
                    const isSelected = selectedBlockId === block.id;
                    return (
                      <div
                        key={block.id}
                        onClick={() => setSelectedBlockId(block.id)}
                        className={`relative group cursor-pointer transition-all ${
                          isSelected
                            ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 z-10'
                            : 'hover:outline hover:outline-1 hover:outline-blue-300 dark:hover:outline-blue-700'
                        }`}
                      >
                        {/* Hover / Active Block Action Controls */}
                        {!readOnly && (
                          <div
                            className={`absolute right-2 top-2 items-center gap-1 bg-white/95 dark:bg-slate-900/95 shadow-md border border-slate-200 dark:border-slate-700 rounded-lg p-1 z-20 ${
                              isSelected ? 'flex' : 'hidden group-hover:flex'
                            }`}
                          >
                            <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5">
                              {block.type}
                            </span>
                            <button
                              type="button"
                              title="Move Up"
                              disabled={index === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveBlock(block.id, 'up');
                              }}
                              className="p-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 disabled:opacity-30 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Move Down"
                              disabled={index === doc.blocks.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveBlock(block.id, 'down');
                              }}
                              className="p-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 disabled:opacity-30 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Duplicate Block"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateBlock(block.id);
                              }}
                              className="p-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Delete Block"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBlock(block.id);
                              }}
                              className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50 dark:hover:bg-red-950/40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Render Block Content */}
                        <RenderCanvasBlock block={block} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Side Inspector */}
            {!readOnly && (
              <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-y-auto">
                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveInspectorTab('block')}
                    className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition ${
                      activeInspectorTab === 'block'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Block Inspector
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveInspectorTab('canvas')}
                    className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition ${
                      activeInspectorTab === 'canvas'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Canvas Global
                  </button>
                </div>

                <div className="p-4 flex-1">
                  {activeInspectorTab === 'block' ? (
                    selectedBlock ? (
                      <BlockInspectorForm
                        block={selectedBlock}
                        onUpdate={(fields) => handleUpdateBlockData(selectedBlock.id, fields)}
                        onInsertTag={handleInsertTag}
                      />
                    ) : (
                      <div className="text-center py-12 text-slate-400">
                        <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-medium">Select any block on the canvas to configure its properties.</p>
                      </div>
                    )
                  ) : (
                    <CanvasGlobalSettingsForm
                      settings={doc.settings}
                      onChange={(updated) =>
                        setDoc((prev) => ({
                          ...prev,
                          settings: { ...prev.settings, ...updated },
                        }))
                      }
                    />
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Code View Mode */
          <div className="flex-1 flex flex-col p-4 bg-slate-900 text-slate-100 font-mono text-xs overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-slate-400">Compiled Responsive Table HTML Markup</span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(rawHtmlCode)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-sans"
              >
                Copy HTML to Clipboard
              </button>
            </div>
            <textarea
              readOnly={readOnly}
              value={rawHtmlCode}
              onChange={(e) => setRawHtmlCode(e.target.value)}
              className="flex-1 w-full bg-slate-950 p-4 rounded-xl mt-3 text-slate-200 outline-none resize-none font-mono text-xs leading-relaxed border border-slate-800 focus:border-blue-500"
            />
          </div>
        )}
      </div>

      {/* Compliance / Personalization Helper Bar */}
      <div className="px-5 py-2.5 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Personalization Tags:</span>
          {['{{name}}', '{{email}}', '{{company}}', '{{unsubscribe_link}}'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleInsertTag(tag)}
              className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-mono hover:border-blue-500 hover:text-blue-600 transition"
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5" />
          Always test email on multiple devices before full dispatch
        </div>
      </div>

      {/* Modal Preview */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                Live Email Client Simulation
              </h3>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950 p-6 flex justify-center">
              <iframe
                title="Email Preview"
                srcDoc={compiledHtml}
                className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-slate-200"
                style={{ minHeight: '600px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// Subcomponents
// -------------------------------------------------------------

function PaletteButton({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-left transition-all group"
    >
      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <div>
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{title}</div>
        <div className="text-[11px] text-slate-400 leading-tight">{desc}</div>
      </div>
    </button>
  );
}

function RenderCanvasBlock({ block }: { block: EmailBlock }) {
  const d: any = block.data;

  switch (block.type) {
    case 'header':
      return (
        <div
          style={{ backgroundColor: d.bgColor || '#ffffff', textAlign: d.alignment || 'center' }}
          className="p-6"
        >
          {d.logoUrl && <img src={d.logoUrl} alt="Logo" className="max-h-10 mx-auto mb-2 inline-block" />}
          <div style={{ color: d.textColor || '#0f172a' }} className="text-xl font-extrabold tracking-tight">
            {d.title || 'Brand Title'}
          </div>
          {d.subtitle && <div className="text-xs uppercase tracking-wider text-slate-400 mt-1">{d.subtitle}</div>}
        </div>
      );

    case 'hero':
      return (
        <div
          style={{ backgroundColor: d.bgColor || '#0f172a', color: d.textColor || '#ffffff' }}
          className="p-8 text-center"
        >
          {d.imageUrl && (
            <img src={d.imageUrl} alt="Hero" className="w-full max-h-48 object-cover rounded-lg mb-4" />
          )}
          <h2 className="text-xl font-bold tracking-tight mb-2">{d.headline || 'Impactful Headline'}</h2>
          {d.subheadline && <p className="text-sm opacity-90 mb-4">{d.subheadline}</p>}
          {d.buttonText && (
            <span className="inline-block px-5 py-2.5 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-md">
              {d.buttonText}
            </span>
          )}
        </div>
      );

    case 'text':
      return (
        <div
          style={{
            textAlign: d.alignment || 'left',
            color: d.color || '#334155',
            fontSize: `${d.fontSize || 15}px`,
            lineHeight: d.lineHeight || 1.6,
          }}
          className="px-6 py-4"
          dangerouslySetInnerHTML={{ __html: d.content || '<p>Add content...</p>' }}
        />
      );

    case 'button':
      return (
        <div style={{ textAlign: d.alignment || 'center' }} className="px-6 py-4">
          <span
            style={{
              backgroundColor: d.bgColor || '#2563eb',
              color: d.textColor || '#ffffff',
              borderRadius: `${d.borderRadius ?? 8}px`,
              display: d.fullWidth ? 'block' : 'inline-block',
            }}
            className="px-6 py-3 font-bold text-sm shadow-md"
          >
            {d.text || 'Call to Action'}
          </span>
        </div>
      );

    case 'image':
      return (
        <div style={{ textAlign: d.alignment || 'center' }} className="px-6 py-4">
          <img
            src={d.imageUrl || 'https://via.placeholder.com/600x300'}
            alt={d.alt || 'Visual'}
            style={{ maxWidth: `${d.maxWidth || 100}%` }}
            className="rounded-lg inline-block object-cover shadow-sm"
          />
          {d.caption && <div className="text-xs text-slate-400 mt-1.5">{d.caption}</div>}
        </div>
      );

    case 'grid2':
      return (
        <div style={{ backgroundColor: d.bgColor || '#ffffff' }} className="px-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{d.col1Title}</h4>
              <p className="text-xs text-slate-500 mt-1">{d.col1Text}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{d.col2Title}</h4>
              <p className="text-xs text-slate-500 mt-1">{d.col2Text}</p>
            </div>
          </div>
        </div>
      );

    case 'divider':
      return (
        <div className="px-6" style={{ paddingBottom: `${d.marginY ?? 16}px`, paddingTop: `${d.marginY ?? 16}px` }}>
          <div
            style={{
              borderTopWidth: `${d.thickness || 1}px`,
              borderTopStyle: d.style || 'solid',
              borderTopColor: d.color || '#e2e8f0',
            }}
          />
        </div>
      );

    case 'spacer':
      return <div style={{ height: `${d.height || 24}px` }} />;

    case 'social':
      return (
        <div style={{ textAlign: d.alignment || 'center' }} className="px-6 py-3 text-xs font-bold text-blue-600">
          Twitter / X &nbsp;•&nbsp; LinkedIn &nbsp;•&nbsp; Facebook
        </div>
      );

    case 'footer':
      return (
        <div
          style={{ backgroundColor: d.bgColor || '#f8fafc', color: d.textColor || '#64748b' }}
          className="p-6 text-center text-xs border-t border-slate-200 dark:border-slate-800"
        >
          <div className="font-bold mb-1">{d.companyName}</div>
          <div className="text-[11px] text-slate-400 mb-2">{d.address}</div>
          <div
            className="text-[11px] text-slate-400"
            dangerouslySetInnerHTML={{ __html: d.unsubscribeNotice || '' }}
          />
        </div>
      );

    default:
      return null;
  }
}

function BlockInspectorForm({
  block,
  onUpdate,
  onInsertTag,
}: {
  block: EmailBlock;
  onUpdate: (fields: Partial<any>) => void;
  onInsertTag: (tag: string) => void;
}) {
  const d: any = block.data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200">
          Editing: {block.type}
        </span>
      </div>

      {block.type === 'header' && (
        <>
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Header Title</label>
            <input
              type="text"
              value={d.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Subtitle</label>
            <input
              type="text"
              value={d.subtitle || ''}
              onChange={(e) => onUpdate({ subtitle: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Logo Image URL</label>
            <input
              type="text"
              value={d.logoUrl || ''}
              onChange={(e) => onUpdate({ logoUrl: e.target.value })}
              placeholder="https://..."
              className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <AlignmentPicker value={d.alignment} onChange={(val) => onUpdate({ alignment: val })} />
        </>
      )}

      {block.type === 'hero' && (
        <>
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Headline</label>
            <input
              type="text"
              value={d.headline || ''}
              onChange={(e) => onUpdate({ headline: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Subheadline</label>
            <textarea
              rows={2}
              value={d.subheadline || ''}
              onChange={(e) => onUpdate({ subheadline: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Hero Image URL</label>
            <input
              type="text"
              value={d.imageUrl || ''}
              onChange={(e) => onUpdate({ imageUrl: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">CTA Text</label>
              <input
                type="text"
                value={d.buttonText || ''}
                onChange={(e) => onUpdate({ buttonText: e.target.value })}
                className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">CTA URL</label>
              <input
                type="text"
                value={d.buttonUrl || ''}
                onChange={(e) => onUpdate({ buttonUrl: e.target.value })}
                className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>
        </>
      )}

      {block.type === 'text' && (
        <>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">HTML Content</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onInsertTag('{{name}}')}
                  className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600"
                >
                  +name
                </button>
              </div>
            </div>
            <textarea
              rows={5}
              value={d.content || ''}
              onChange={(e) => onUpdate({ content: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Font Size (px)</label>
              <input
                type="number"
                value={d.fontSize || 15}
                onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Color</label>
              <input
                type="color"
                value={d.color || '#334155'}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="w-full h-8 mt-1 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
              />
            </div>
          </div>
          <AlignmentPicker value={d.alignment} onChange={(val) => onUpdate({ alignment: val })} />
        </>
      )}

      {block.type === 'button' && (
        <>
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Button Label</label>
            <input
              type="text"
              value={d.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Destination URL</label>
            <input
              type="text"
              value={d.url || ''}
              onChange={(e) => onUpdate({ url: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Background</label>
              <input
                type="color"
                value={d.bgColor || '#2563eb'}
                onChange={(e) => onUpdate({ bgColor: e.target.value })}
                className="w-full h-8 mt-1 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Text Color</label>
              <input
                type="color"
                value={d.textColor || '#ffffff'}
                onChange={(e) => onUpdate({ textColor: e.target.value })}
                className="w-full h-8 mt-1 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
              />
            </div>
          </div>
          <AlignmentPicker value={d.alignment} onChange={(val) => onUpdate({ alignment: val })} />
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="fullWidthCheck"
              checked={d.fullWidth || false}
              onChange={(e) => onUpdate({ fullWidth: e.target.checked })}
              className="rounded text-blue-600"
            />
            <label htmlFor="fullWidthCheck" className="text-xs text-slate-700 dark:text-slate-300">
              Full Width Button
            </label>
          </div>
        </>
      )}

      {block.type === 'image' && (
        <>
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Image URL</label>
            <input
              type="text"
              value={d.imageUrl || ''}
              onChange={(e) => onUpdate({ imageUrl: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Alt Description</label>
            <input
              type="text"
              value={d.alt || ''}
              onChange={(e) => onUpdate({ alt: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Caption</label>
            <input
              type="text"
              value={d.caption || ''}
              onChange={(e) => onUpdate({ caption: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <AlignmentPicker value={d.alignment} onChange={(val) => onUpdate({ alignment: val })} />
        </>
      )}

      {block.type === 'footer' && (
        <>
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Company Name</label>
            <input
              type="text"
              value={d.companyName || ''}
              onChange={(e) => onUpdate({ companyName: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Physical Address</label>
            <input
              type="text"
              value={d.address || ''}
              onChange={(e) => onUpdate({ address: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
              Unsubscribe HTML (Must have tag)
              <button
                type="button"
                onClick={() => onInsertTag('{{unsubscribe_link}}')}
                className="text-[10px] text-blue-600 font-semibold"
              >
                +link
              </button>
            </label>
            <textarea
              rows={3}
              value={d.unsubscribeNotice || ''}
              onChange={(e) => onUpdate({ unsubscribeNotice: e.target.value })}
              className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[11px]"
            />
          </div>
        </>
      )}
    </div>
  );
}

function AlignmentPicker({
  value,
  onChange,
}: {
  value: 'left' | 'center' | 'right';
  onChange: (val: 'left' | 'center' | 'right') => void;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 block">Alignment</label>
      <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
        {(['left', 'center', 'right'] as const).map((align) => (
          <button
            key={align}
            type="button"
            onClick={() => onChange(align)}
            className={`py-1 text-xs font-bold capitalize rounded transition ${
              value === align
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {align}
          </button>
        ))}
      </div>
    </div>
  );
}

function CanvasGlobalSettingsForm({
  settings,
  onChange,
}: {
  settings: any;
  onChange: (updated: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase text-slate-800 dark:text-slate-200">
        Canvas Global Settings
      </div>

      <div>
        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Max Container Width</label>
        <select
          value={settings.maxWidth || 600}
          onChange={(e) => onChange({ maxWidth: Number(e.target.value) })}
          className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
        >
          <option value={480}>480px (Narrow / Transactional)</option>
          <option value={600}>600px (Universal Standard)</option>
          <option value={640}>640px (Wide / Editorial)</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Outer Canvas Bg</label>
          <input
            type="color"
            value={settings.canvasBg || '#f8fafc'}
            onChange={(e) => onChange({ canvasBg: e.target.value })}
            className="w-full h-8 mt-1 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Email Card Body Bg</label>
          <input
            type="color"
            value={settings.bodyBg || '#ffffff'}
            onChange={(e) => onChange({ bodyBg: e.target.value })}
            className="w-full h-8 mt-1 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

export default VisualEmailBuilder;
