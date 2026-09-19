import React, { useState, useEffect } from 'react';
import { X, Send, FormInput, FileText } from 'lucide-react';
import { fetchWhatsAppFlows, WhatsAppFlowItem } from '@/lib/whatsappFlowsApi';
import { apiFetch } from '@/lib/api';

interface SendFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  onSuccess: () => void;
}

export function SendFlowModal({ isOpen, onClose, contactId, onSuccess }: SendFlowModalProps) {
  const [flows, setFlows] = useState<WhatsAppFlowItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [selectedFlowId, setSelectedFlowId] = useState<string>('');
  const [headerText, setHeaderText] = useState('');
  const [bodyText, setBodyText] = useState('Please complete this form:');
  const [footerText, setFooterText] = useState('');
  const [ctaText, setCtaText] = useState('Open Form');
  
  const [toastMsg, setToastMsg] = useState<{message: string, variant: 'default'|'destructive'} | null>(null);

  const showToast = (message: string, variant: 'default'|'destructive' = 'default') => {
    setToastMsg({ message, variant });
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    if (isOpen) {
      loadFlows();
    } else {
      // reset state on close
      setSelectedFlowId('');
      setHeaderText('');
      setBodyText('Please complete this form:');
      setFooterText('');
      setCtaText('Open Form');
    }
  }, [isOpen]);

  const loadFlows = async () => {
    setFetching(true);
    try {
      const res = await fetchWhatsAppFlows();
      if (res.data) {
        // Only show flows that are actually published and active
        const activeFlows = res.data.filter(f => f.status === 'PUBLISHED' && f.activeMetaFlowId);
        setFlows(activeFlows);
      }
    } catch (err) {
      console.error('Failed to load flows', err);
      showToast('Failed to fetch WhatsApp Flows', 'destructive');
    } finally {
      setFetching(false);
    }
  };

  const handleSend = async () => {
    if (!selectedFlowId) return;
    
    setLoading(true);
    try {
      await apiFetch(`/api/v1/messages/${contactId}/flow`, {
        method: 'POST',
        body: JSON.stringify({
          flowId: selectedFlowId,
          headerText: headerText.trim() || undefined,
          bodyText: bodyText.trim() || undefined,
          footerText: footerText.trim() || undefined,
          ctaText: ctaText.trim() || 'Open Form',
          screen: 'MAIN_SCREEN'
        })
      });
      
      showToast('Flow sent successfully.');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to send Flow', 'destructive');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card-c rounded-2xl w-full max-w-lg shadow-2xl border border-base-c flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-c">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
              <FormInput className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-primary-c">Send WhatsApp Flow</h2>
          </div>
          <button onClick={onClose} className="p-2 text-muted-c hover:text-primary-c hover:bg-slate-500/10 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto custom-scrollbar flex-1 space-y-5">
          
          {/* Select Flow */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary-c block">Select Flow to Send *</label>
            {fetching ? (
              <div className="h-10 bg-surface-c animate-pulse rounded-lg border border-base-c flex items-center px-4">
                <span className="text-sm text-muted-c">Loading flows...</span>
              </div>
            ) : flows.length === 0 ? (
              <div className="p-4 bg-surface-c border border-dashed border-base-c rounded-xl text-center">
                <FileText className="h-8 w-8 text-muted-c mx-auto mb-2" />
                <p className="text-sm text-primary-c">No active Flows found</p>
                <p className="text-xs text-muted-c mt-1">You need to create and publish a flow first.</p>
              </div>
            ) : (
              <select
                value={selectedFlowId}
                onChange={(e) => setSelectedFlowId(e.target.value)}
                className="w-full bg-surface-c border border-base-c text-primary-c rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value="">-- Choose a published flow --</option>
                {flows.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.category})</option>
                ))}
              </select>
            )}
          </div>

          {/* Form Content */}
          <div className="space-y-4 pt-2">
             <div className="space-y-1.5">
               <label className="text-xs font-medium text-muted-c">Header Text (Optional)</label>
               <input
                 type="text"
                 value={headerText}
                 onChange={(e) => setHeaderText(e.target.value)}
                 placeholder="e.g., Welcome!"
                 className="w-full bg-surface-c border border-base-c text-primary-c placeholder:text-muted-c rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
               />
             </div>
             
             <div className="space-y-1.5">
               <label className="text-xs font-medium text-muted-c">Body Message</label>
               <textarea
                 value={bodyText}
                 onChange={(e) => setBodyText(e.target.value)}
                 rows={3}
                 className="w-full bg-surface-c border border-base-c text-primary-c rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none resize-none custom-scrollbar"
               />
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <label className="text-xs font-medium text-muted-c">Footer Text (Optional)</label>
                 <input
                   type="text"
                   value={footerText}
                   onChange={(e) => setFooterText(e.target.value)}
                   className="w-full bg-surface-c border border-base-c text-primary-c rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                 />
               </div>
               <div className="space-y-1.5">
                 <label className="text-xs font-medium text-muted-c">Button / CTA Text</label>
                 <input
                   type="text"
                   value={ctaText}
                   onChange={(e) => setCtaText(e.target.value)}
                   className="w-full bg-surface-c border border-base-c text-primary-c rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                 />
               </div>
             </div>
          </div>
          
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-base-c bg-slate-50/50 dark:bg-black/20 flex justify-end gap-3 rounded-b-2xl relative">
          
          {toastMsg && (
            <div className={`absolute left-6 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-md text-xs font-medium ${toastMsg.variant === 'destructive' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {toastMsg.message}
            </div>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-secondary-c bg-surface-c hover:bg-slate-500/10 hover:text-primary-c rounded-lg transition-colors border border-base-c"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedFlowId || loading}
            className="px-6 py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center shadow-lg shadow-indigo-500/20"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : (
              <span className="flex items-center">
                Send Flow
                <Send className="ml-2 h-4 w-4" />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
