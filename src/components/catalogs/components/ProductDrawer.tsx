import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Box, X, UploadCloud, Link2, DollarSign, Tag, 
  Bold, Italic, List, ListOrdered, Link, Loader2, 
  ChevronDown, ChevronUp, AlertCircle, CheckCircle2, 
  Sparkles, Layers, Info, Plus
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { WhatsAppPreview } from './WhatsAppPreview';
import { cx } from '@/lib/types';
import type { CommerceCatalog, CommerceProduct, ProductFormData } from '../types';

interface ProductDrawerProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialProduct?: CommerceProduct | null;
  catalogs: CommerceCatalog[];
  activeCatalogId: string;
  defaultCurrency?: string;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string, isErr?: boolean) => void;
}

export function ProductDrawer({
  isOpen,
  mode,
  initialProduct,
  catalogs,
  activeCatalogId,
  defaultCurrency = 'INR',
  onClose,
  onSuccess,
  showToast,
}: ProductDrawerProps) {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    retailer_id: '',
    description: '',
    price: '',
    sale_price: '',
    currency: 'INR',
    url: '',
    category: 'Apparel & Clothing',
    availability: 'in stock',
    condition: 'new',
    catalog_id: activeCatalogId,
    images: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);
  const isScrollingByClick = useRef(false);

  const step1Ref = useRef<HTMLElement>(null);
  const step2Ref = useRef<HTMLElement>(null);
  const step3Ref = useRef<HTMLElement>(null);
  const step4Ref = useRef<HTMLElement>(null);
  const step5Ref = useRef<HTMLElement>(null);

  const stepRefs: Record<number, React.RefObject<HTMLElement | null>> = {
    1: step1Ref,
    2: step2Ref,
    3: step3Ref,
    4: step4Ref,
    5: step5Ref,
  };

  const handleStepClick = (stepId: number) => {
    setActiveStep(stepId);
    const targetEl = stepRefs[stepId]?.current;
    if (targetEl && formScrollRef.current) {
      isScrollingByClick.current = true;
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        isScrollingByClick.current = false;
      }, 600);
    }
  };

  const handleFormScroll = () => {
    if (isScrollingByClick.current || !formScrollRef.current) return;
    const containerTop = formScrollRef.current.getBoundingClientRect().top;
    
    const stepIds = [1, 2, 3, 4, 5];
    let currentStep = 1;
    for (const id of stepIds) {
      const el = stepRefs[id]?.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top - containerTop <= 140) {
          currentStep = id;
        }
      }
    }
    if (currentStep !== activeStep) {
      setActiveStep(currentStep);
    }
  };

  // Initialize form data on open or when initialProduct changes
  useEffect(() => {
    if (isOpen) {
      setActiveStep(1);
      if (formScrollRef.current) {
        formScrollRef.current.scrollTop = 0;
      }
      setApiError(null);
      setShowTechnicalDetails(false);
      if (mode === 'edit' && initialProduct) {
        const parsePriceInput = (val: number | string | undefined | null) => {
          if (val === undefined || val === null || val === '') return '';
          const num = typeof val === 'number' ? val : parseFloat(String(val));
          if (isNaN(num) || num <= 0) return '';
          return num.toFixed(2);
        };

        setFormData({
          name: initialProduct.name || '',
          retailer_id: initialProduct.productRetailerId || '',
          description: initialProduct.description || '',
          price: parsePriceInput(initialProduct.price) || '0.00',
          sale_price: parsePriceInput(initialProduct.salePrice),
          currency: initialProduct.currency || defaultCurrency || 'INR',
          url: initialProduct.url || '',
          category: initialProduct.category || 'Apparel & Clothing',
          availability: initialProduct.availability ? initialProduct.availability.toLowerCase().replace('_', ' ') : 'in stock',
          condition: initialProduct.condition ? initialProduct.condition.toLowerCase() : 'new',
          catalog_id: initialProduct.metaCatalogId || activeCatalogId,
          images: initialProduct.imageUrl ? [initialProduct.imageUrl, ...(initialProduct.additionalImages || [])] : [],
        });
      } else {
        setFormData({
          name: '',
          retailer_id: '',
          description: '',
          price: '',
          sale_price: '',
          currency: defaultCurrency || 'INR',
          url: '',
          category: 'Apparel & Clothing',
          availability: 'in stock',
          condition: 'new',
          catalog_id: activeCatalogId || (catalogs[0]?.metaCatalogId ?? ''),
          images: [],
        });
      }
    }
  }, [isOpen, mode, initialProduct, activeCatalogId, catalogs, defaultCurrency]);

  if (!isOpen) return null;

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setApiError(null);

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < Math.min(files.length, 5 - formData.images.length); i++) {
        const file = files[i];
        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('folder', 'commerce_products');

        const res = await apiFetch<{ url: string }>('/api/v1/upload', {
          method: 'POST',
          body: uploadData,
        });

        if (res.error) throw new Error(res.error);
        if (res.data?.url) {
          uploadedUrls.push(res.data.url);
        }
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls].slice(0, 5)
      }));
      showToast('Image(s) uploaded successfully');
    } catch (err: any) {
      showToast(err.message || 'Image upload failed', true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleApplyFormatting = (tag: 'bold' | 'italic' | 'bullet' | 'number' | 'link') => {
    const textarea = descTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = formData.description.substring(start, end);
    let replacement = '';

    if (tag === 'bold') replacement = `**${selected || 'bold text'}**`;
    if (tag === 'italic') replacement = `*${selected || 'italic text'}*`;
    if (tag === 'bullet') replacement = `\n• ${selected || 'item'}`;
    if (tag === 'number') replacement = `\n1. ${selected || 'item'}`;
    if (tag === 'link') replacement = `[${selected || 'link text'}](https://example.com)`;

    const updated = formData.description.substring(0, start) + replacement + formData.description.substring(end);
    setFormData(prev => ({ ...prev, description: updated }));
  };

  const autoGenerateSku = () => {
    const randomSku = `SKU-${Math.floor(10000 + Math.random() * 90000)}`;
    setFormData(prev => ({ ...prev, retailer_id: randomSku }));
  };

  const handleSubmit = async (isDraft = false) => {
    const targetCatalogId = formData.catalog_id || activeCatalogId;
    if (!targetCatalogId) {
      showToast('Please select a Meta Catalog', true);
      return;
    }

    if (!isDraft) {
      if (!formData.name.trim()) {
        showToast('Product Name is required', true);
        return;
      }
      if (!formData.price || isNaN(parseFloat(formData.price))) {
        showToast('Valid Price is required', true);
        return;
      }
      if (formData.images.length === 0) {
        showToast('At least one product image is required', true);
        return;
      }
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const priceInCents = Math.round(parseFloat(formData.price || '0') * 100);
      const salePriceInCents = formData.sale_price ? Math.round(parseFloat(formData.sale_price) * 100) : undefined;

      const normalizeAvailability = (val: string) => {
        const s = (val || '').toLowerCase().trim().replace(/_/g, ' ');
        if (s.includes('out')) return 'out of stock';
        if (s.includes('preorder')) return 'preorder';
        if (s.includes('order')) return 'available for order';
        if (s.includes('discontinued')) return 'discontinued';
        return 'in stock';
      };

      const normalizeCondition = (val: string) => {
        const s = (val || '').toLowerCase().trim();
        if (s === 'refurbished') return 'refurbished';
        if (s === 'used') return 'used';
        return 'new';
      };

      const payload = {
        retailer_id: formData.retailer_id.trim() || undefined,
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: priceInCents,
        sale_price: salePriceInCents,
        currency: formData.currency,
        url: formData.url.trim() || 'https://gyanvaniai.online',
        image_url: formData.images[0] || '',
        additional_image_urls: formData.images.slice(1).length > 0 ? formData.images.slice(1) : undefined,
        category: formData.category,
        availability: normalizeAvailability(formData.availability),
        condition: normalizeCondition(formData.condition),
      };

      const endpoint = `/api/v1/whatsapp/catalogs/${targetCatalogId}/products`;
      const res = await apiFetch<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.error) throw new Error(res.error);

      showToast(mode === 'edit' ? 'Product updated successfully' : 'Product added to Meta Catalog');
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to submit product to Meta';
      setApiError(errorMsg);
      showToast('Unable to publish product to Meta Catalog', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, label: 'Basic Information' },
    { id: 2, label: 'Pricing' },
    { id: 3, label: 'Product Media' },
    { id: 4, label: 'Product Details' },
    { id: 5, label: 'Meta Catalog' },
  ];

  const priceVal = parseFloat(formData.price) || 0;
  const saleVal = parseFloat(formData.sale_price) || 0;
  const hasDiscount = saleVal > 0 && saleVal < priceVal;
  const currencySymbol = formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'GBP' ? '£' : '₹';

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      {/* Full Viewport Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in" 
        onClick={onClose} 
      />

      {/* Main Drawer Container */}
      <div className="relative z-10 w-full lg:max-w-5xl bg-white dark:bg-ink-900 border-l border-base-c shadow-2xl flex flex-col h-full max-h-screen overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-base-c bg-slate-50/70 dark:bg-ink-850 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/50 border border-primary-100 dark:border-primary-900 flex items-center justify-center text-primary-600 shrink-0">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary-c">
                {mode === 'edit' ? 'Edit Product' : 'Add Product'}
              </h2>
              <p className="text-xs text-secondary-c">
                {mode === 'edit'
                  ? 'Update your product information and sync changes to Meta Catalog.'
                  : 'Create a product and publish it to your Meta Commerce Catalog.'}
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose} 
            className="p-2 text-muted-c hover:text-primary-c hover:bg-base-c rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body: 2 Columns */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          
          {/* Left / Center Form Area with Steps Navigation */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 border-r border-base-c">
            
            {/* Step Navigation Sidebar - Solidly Fixed */}
            <div className="w-full md:w-52 p-6 border-b md:border-b-0 md:border-r border-base-c bg-slate-50/40 dark:bg-ink-850 shrink-0 select-none overflow-hidden">
              <nav className="space-y-1.5 sticky top-0">
                {steps.map(step => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => handleStepClick(step.id)}
                    className={cx(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer",
                      activeStep === step.id
                        ? "bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-300 font-bold shadow-2xs"
                        : "text-secondary-c hover:text-primary-c hover:bg-base-c"
                    )}
                  >
                    <span className={cx(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors",
                      activeStep === step.id
                        ? "bg-primary-600 text-white shadow-2xs"
                        : "bg-slate-200 dark:bg-ink-750 text-secondary-c"
                    )}>
                      {step.id}
                    </span>
                    <span>{step.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Form Fields Area (Independently scrollable & synchronized) */}
            <div 
              ref={formScrollRef}
              onScroll={handleFormScroll}
              className="flex-1 p-8 space-y-10 max-w-2xl overflow-y-auto custom-scrollbar scroll-smooth min-h-0"
            >
              
              {/* STEP 1: Basic Information */}
              <section ref={step1Ref} id="step-1" className="space-y-4 scroll-mt-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-base-c">
                  <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600">
                    <Box className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-primary-c">Basic Information</h3>
                    <p className="text-[11px] text-secondary-c">Add the basic details about your product.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-primary-c mb-1.5">Product Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Classic T-Shirt"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-lg border border-base-c bg-input-c px-3.5 py-2.5 text-xs text-primary-c focus:border-primary-500 focus:outline-none shadow-2xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-primary-c">SKU / Retailer ID *</label>
                      <button
                        type="button"
                        onClick={autoGenerateSku}
                        className="text-[11px] font-semibold text-primary-600 hover:text-primary-700 cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> Auto-generate
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. SKU-12345"
                      value={formData.retailer_id}
                      onChange={(e) => setFormData({ ...formData, retailer_id: e.target.value })}
                      className="w-full rounded-lg border border-base-c bg-input-c px-3.5 py-2.5 text-xs text-primary-c focus:border-primary-500 focus:outline-none font-mono shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-primary-c mb-1.5">Description *</label>
                    
                    {/* Rich text formatting toolbar */}
                    <div className="border border-base-c rounded-t-lg bg-slate-50 dark:bg-ink-850 px-2 py-1 flex items-center gap-1">
                      <button 
                        type="button" 
                        onClick={() => handleApplyFormatting('bold')} 
                        className="p-1 rounded hover:bg-base-c text-secondary-c hover:text-primary-c cursor-pointer"
                        title="Bold"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleApplyFormatting('italic')} 
                        className="p-1 rounded hover:bg-base-c text-secondary-c hover:text-primary-c cursor-pointer"
                        title="Italic"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleApplyFormatting('bullet')} 
                        className="p-1 rounded hover:bg-base-c text-secondary-c hover:text-primary-c cursor-pointer"
                        title="Bullet List"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleApplyFormatting('number')} 
                        className="p-1 rounded hover:bg-base-c text-secondary-c hover:text-primary-c cursor-pointer"
                        title="Numbered List"
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleApplyFormatting('link')} 
                        className="p-1 rounded hover:bg-base-c text-secondary-c hover:text-primary-c cursor-pointer"
                        title="Insert Link"
                      >
                        <Link className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      ref={descTextareaRef}
                      maxLength={1000}
                      placeholder="Brief description of the product..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full rounded-b-lg border-x border-b border-base-c bg-input-c px-3.5 py-2.5 text-xs text-primary-c focus:border-primary-500 focus:outline-none min-h-[90px] resize-y shadow-2xs"
                    />
                    <div className="flex justify-end text-[10px] text-muted-c mt-1">
                      {formData.description.length}/1000
                    </div>
                  </div>
                </div>
              </section>

              {/* STEP 2: Pricing */}
              <section ref={step2Ref} id="step-2" className="space-y-4 scroll-mt-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-base-c">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-primary-c">Pricing</h3>
                    <p className="text-[11px] text-secondary-c">Set the price for your product.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-primary-c mb-1.5">Price *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-c font-bold">{currencySymbol}</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-base-c bg-input-c text-xs text-primary-c focus:border-primary-500 focus:outline-none shadow-2xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-primary-c">Currency *</label>
                      {mode === 'edit' && (
                        <span className="text-[10px] text-muted-c font-medium">Meta Immutable</span>
                      )}
                    </div>
                    <select
                      value={formData.currency}
                      disabled={mode === 'edit'}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className={cx(
                        "w-full px-3 py-2.5 rounded-lg border border-base-c bg-input-c text-xs text-primary-c focus:border-primary-500 focus:outline-none shadow-2xs font-semibold",
                        mode === 'edit' && "opacity-70 bg-slate-100 dark:bg-ink-850 cursor-not-allowed"
                      )}
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                    {mode === 'edit' && (
                      <p className="text-[10px] text-muted-c mt-1">
                        Meta does not allow changing currency of an existing product.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-primary-c mb-1.5">Sale Price (Optional)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-c font-bold">{currencySymbol}</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.sale_price}
                        onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                        className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-base-c bg-input-c text-xs text-primary-c focus:border-primary-500 focus:outline-none shadow-2xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {hasDiscount ? (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Customers will see {currencySymbol}{saleVal.toFixed(2)} (was {currencySymbol}{priceVal.toFixed(2)})
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-c">
                    Add a discounted price (optional).
                  </p>
                )}
              </section>

              {/* STEP 3: Product Media */}
              <section ref={step3Ref} id="step-3" className="space-y-4 scroll-mt-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-base-c">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600">
                    <UploadCloud className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-primary-c">Product Media</h3>
                    <p className="text-[11px] text-secondary-c">Upload product images. First image will be used as the main image.</p>
                  </div>
                </div>

                {/* Upload drag & drop zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleImageUpload(e.dataTransfer.files);
                  }}
                  className={cx(
                    "border-2 border-dashed rounded-xl p-6 text-center transition-colors flex flex-col items-center justify-center cursor-pointer",
                    isUploading ? "bg-slate-50 border-slate-300" : "bg-slate-50/50 dark:bg-ink-850 hover:bg-slate-100/80 border-slate-300 dark:border-ink-700 hover:border-primary-400"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files)}
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center text-primary-600">
                      <Loader2 className="w-7 h-7 animate-spin mb-2" />
                      <span className="text-xs font-semibold">Uploading image to storage...</span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-primary-500 mb-2" />
                      <h4 className="text-xs font-bold text-primary-c">Drag & drop product image here</h4>
                      <p className="text-[11px] text-secondary-c">or click to browse</p>
                      <span className="text-[10px] text-muted-c mt-1 font-medium">PNG, JPG up to 10MB</span>
                    </>
                  )}
                </div>

                {/* Image Thumbnails Gallery */}
                {formData.images.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {formData.images.map((imgUrl, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-lg border border-base-c overflow-hidden group shadow-2xs">
                        <img src={imgUrl} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                        
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-primary-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-2xs">
                            MAIN
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 bg-black/60 text-white hover:bg-red-600 p-0.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {formData.images.length < 5 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-20 h-20 rounded-lg border-2 border-dashed border-base-c hover:border-primary-400 bg-slate-50 dark:bg-ink-850 flex flex-col items-center justify-center text-secondary-c hover:text-primary-600 transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4 mb-0.5" />
                        <span className="text-[10px] font-semibold">Add Images</span>
                      </button>
                    )}
                  </div>
                )}
              </section>

              {/* STEP 4: Product Details */}
              <section ref={step4Ref} id="step-4" className="space-y-4 scroll-mt-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-base-c">
                  <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-600">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-primary-c">Product Details</h3>
                    <p className="text-[11px] text-secondary-c">Additional product information.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs font-semibold text-primary-c mb-1.5">Website URL</label>
                    <input
                      type="url"
                      placeholder="https://yourstore.com/products/item"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border border-base-c bg-input-c text-xs text-primary-c focus:border-primary-500 focus:outline-none shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-primary-c mb-1.5">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border border-base-c bg-input-c text-xs text-primary-c focus:border-primary-500 focus:outline-none shadow-2xs"
                    >
                      <option value="Apparel & Clothing">Apparel & Clothing</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Home & Kitchen">Home & Kitchen</option>
                      <option value="Beauty & Health">Beauty & Health</option>
                      <option value="Food & Beverages">Food & Beverages</option>
                      <option value="Services">Services</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-primary-c mb-1.5">Availability</label>
                    <select
                      value={formData.availability}
                      onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border border-base-c bg-input-c text-xs text-primary-c focus:border-primary-500 focus:outline-none shadow-2xs"
                    >
                      <option value="in stock">In Stock</option>
                      <option value="out of stock">Out of Stock</option>
                      <option value="preorder">Pre-Order</option>
                      <option value="available for order">Available for Order</option>
                      <option value="discontinued">Discontinued</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-primary-c mb-1.5">Condition</label>
                    <select
                      value={formData.condition}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border border-base-c bg-input-c text-xs text-primary-c focus:border-primary-500 focus:outline-none shadow-2xs"
                    >
                      <option value="new">New</option>
                      <option value="refurbished">Refurbished</option>
                      <option value="used">Used</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* STEP 5: Meta Catalog */}
              <section ref={step5Ref} id="step-5" className="space-y-4 scroll-mt-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-base-c">
                  <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-primary-c">Meta Catalog</h3>
                    <p className="text-[11px] text-secondary-c">Select the catalog where this product will be added.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-primary-c mb-1.5">Select Catalog *</label>
                  <select
                    value={formData.catalog_id}
                    onChange={(e) => setFormData({ ...formData, catalog_id: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-base-c bg-input-c text-xs text-primary-c focus:border-primary-500 focus:outline-none shadow-2xs font-semibold"
                  >
                    {catalogs.map(c => (
                      <option key={c.id} value={c.metaCatalogId}>
                        {c.name || c.metaCatalogId}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-secondary-c mt-1">
                    {mode === 'edit'
                      ? 'Changes will be synced directly to your Meta Commerce Catalog.'
                      : 'Products will be added directly to your Meta Commerce Catalog.'}
                  </p>
                </div>
              </section>

              {/* Error Message with Technical Details Accordion */}
              {apiError && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1 font-semibold">
                      Unable to {mode === 'edit' ? 'update' : 'add'} product to Meta Catalog.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                    className="text-[11px] text-red-600 hover:text-red-800 underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Technical Details</span>
                    {showTechnicalDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {showTechnicalDetails && (
                    <pre className="p-3 bg-red-100/50 dark:bg-red-950/60 rounded-lg text-[10px] font-mono whitespace-pre-wrap break-all text-red-800 dark:text-red-200">
                      {apiError}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: WhatsApp Live Preview */}
          <div className="w-full lg:w-80 p-6 bg-slate-50/50 dark:bg-ink-850 flex items-start justify-center shrink-0 border-t lg:border-t-0 overflow-y-auto custom-scrollbar min-h-0">
            <WhatsAppPreview formData={formData} mode={mode} />
          </div>
        </div>

        {/* Drawer Sticky Footer */}
        <div className="px-8 py-4 border-t border-base-c bg-slate-50/80 dark:bg-ink-850 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-secondary-c hover:text-primary-c border border-base-c rounded-lg hover:bg-base-c transition-colors bg-white dark:bg-ink-800 shadow-2xs cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting || !formData.name}
              className="px-4 py-2 text-xs font-semibold text-secondary-c hover:text-primary-c border border-base-c rounded-lg hover:bg-base-c transition-colors bg-white dark:bg-ink-800 shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              Save as Draft
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting || !formData.name || !formData.price || formData.images.length === 0}
              className="px-6 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{mode === 'edit' ? 'Updating product...' : 'Adding product...'}</span>
                </>
              ) : (
                <span>{mode === 'edit' ? 'Update Product' : 'Add to Meta Catalog'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

