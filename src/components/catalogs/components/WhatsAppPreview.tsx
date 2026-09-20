import { Info, Image as ImageIcon, MessageCircle } from 'lucide-react';
import type { ProductFormData } from '../types';

interface WhatsAppPreviewProps {
  formData: ProductFormData;
  mode?: 'create' | 'edit';
}

export function WhatsAppPreview({ formData, mode = 'create' }: WhatsAppPreviewProps) {
  const mainImage = formData.images && formData.images.length > 0 ? formData.images[0] : '';
  const priceVal = parseFloat(formData.price) || 0;
  const salePriceVal = parseFloat(formData.sale_price) || 0;
  const currencySymbol = formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'GBP' ? '£' : '₹';

  const hasSale = salePriceVal > 0 && salePriceVal < priceVal;

  return (
    <div className="w-full max-w-xs space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-2xs">
          <MessageCircle className="w-3.5 h-3.5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-primary-c">WhatsApp Preview</h4>
          <p className="text-[11px] text-secondary-c">This is how your product will appear on WhatsApp.</p>
        </div>
      </div>

      {/* WhatsApp Product Card Container */}
      <div className="bg-white dark:bg-ink-900 border border-base-c rounded-2xl p-3.5 shadow-sm space-y-3 relative">
        {/* Status Badge */}
        <div className="flex justify-end">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Active
          </span>
        </div>

        {/* Product Image */}
        <div className="aspect-square w-full rounded-xl bg-slate-100 dark:bg-ink-800 border border-base-c flex items-center justify-center overflow-hidden">
          {mainImage ? (
            <img 
              src={mainImage} 
              alt={formData.name || 'Preview'} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 p-4">
              <ImageIcon className="w-10 h-10 stroke-[1.5] mb-1 text-slate-300" />
            </div>
          )}
        </div>

        {/* Title, Price, Description */}
        <div className="space-y-1.5">
          <h5 className="text-sm font-bold text-primary-c line-clamp-1 leading-snug">
            {formData.name.trim() || 'Product Name'}
          </h5>

          {/* Pricing Row */}
          <div className="flex items-baseline gap-2">
            {hasSale ? (
              <>
                <span className="text-sm font-bold text-primary-c">
                  {currencySymbol}{salePriceVal.toFixed(2)}
                </span>
                <span className="text-xs text-muted-c line-through">
                  {currencySymbol}{priceVal.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-sm font-bold text-primary-c">
                {currencySymbol}{priceVal.toFixed(2)}
              </span>
            )}
          </div>

          <p className="text-xs text-secondary-c line-clamp-2 leading-relaxed">
            {formData.description.trim() || 'Product description will appear here...'}
          </p>
        </div>

        {/* View Product Action */}
        <div className="pt-2">
          <div className="w-full py-2 text-center text-xs font-bold text-primary-600 dark:text-primary-400 bg-slate-50 dark:bg-ink-850 hover:bg-slate-100 rounded-lg border border-base-c transition-colors select-none">
            View Product
          </div>
        </div>
      </div>

      {/* Info Callout */}
      <div className="flex items-start gap-2 p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl text-[11px] text-blue-700 dark:text-blue-300">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="leading-snug">
          This is a preview. The final appearance may vary on WhatsApp depending on the customer's device.
        </p>
      </div>
    </div>
  );
}
