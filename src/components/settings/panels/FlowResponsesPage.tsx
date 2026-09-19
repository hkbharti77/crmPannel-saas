import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, MessageSquare } from 'lucide-react';
import { fetchWhatsAppFlow, fetchFlowSubmissions, WhatsAppFlowItem } from '@/lib/whatsappFlowsApi';
import { FlowResponsesTable } from './FlowResponsesTable';

export function FlowResponsesPage() {
  const { flowId } = useParams();
  const navigate = useNavigate();
  const [flow, setFlow] = useState<WhatsAppFlowItem | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!flowId) return;
    loadData(flowId);
  }, [flowId]);

  const loadData = async (id: string) => {
    setLoading(true);
    try {
      const [flowRes, subsRes] = await Promise.all([
        fetchWhatsAppFlow(id),
        fetchFlowSubmissions(id)
      ]);
      if (flowRes.data) setFlow(flowRes.data.flow);
      if (subsRes.data) setSubmissions(subsRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load responses');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-base-c animate-in fade-in space-y-4 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg bg-surface-c border border-base-c text-secondary-c hover:text-primary-c hover:bg-subtle-c transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-primary-c flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-500" />
            Flow Responses
          </h1>
          <p className="text-sm text-secondary-c mt-0.5">
            {flow ? `Viewing submissions for "${flow.name}"` : 'Loading flow details...'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-surface-c border border-base-c rounded-xl">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
            <p className="text-sm text-secondary-c">Loading responses...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 bg-rose-500/10 border border-rose-500/20 rounded-xl p-6 text-center">
            <p className="text-sm font-semibold text-rose-600 mb-2">Error loading responses</p>
            <p className="text-xs text-rose-500/80">{error}</p>
            <button
              onClick={() => flowId && loadData(flowId)}
              className="mt-4 px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-rose-500"
            >
              Try Again
            </button>
          </div>
        ) : (
          <FlowResponsesTable submissions={submissions} />
        )}
      </div>
    </div>
  );
}
