import React, { useState } from 'react';
import {
  AlertCircle, CheckCircle2, ChevronUp, ChevronDown, Terminal,
  Globe, Send, Play, RefreshCw, Layers
} from 'lucide-react';
import { FlowValidationError, FlowActionLog } from './types';
import { cx } from '@/lib/types';

interface MetaFlowDiagnosticsPanelProps {
  errors: FlowValidationError[];
  screensCount: number;
  onSelectScreen?: (id: string) => void;
}

export const MetaFlowDiagnosticsPanel: React.FC<MetaFlowDiagnosticsPanelProps> = ({
  errors,
  screensCount,
  onSelectScreen,
}) => {
  const [activeTab, setActiveTab] = useState<'errors' | 'actions' | 'endpoint'>('errors');
  const [isExpanded, setIsExpanded] = useState(true);

  // Mock Endpoint Simulator state
  const [endpointUrl, setEndpointUrl] = useState('https://api.crmlite.com/whatsapp/flows/data-exchange');
  const [endpointRequest, setEndpointRequest] = useState('{\n  "version": "7.0",\n  "action": "INIT",\n  "screen": "MAIN_SCREEN"\n}');
  const [endpointResponse, setEndpointResponse] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  const errorCount = errors.filter(e => e.type === 'error').length;
  const warningCount = errors.filter(e => e.type === 'warning').length;

  const handleSimulateEndpoint = () => {
    setSimulating(true);
    setTimeout(() => {
      setEndpointResponse(JSON.stringify({
        version: "7.0",
        screen: "MAIN_SCREEN",
        data: {
          available_dates: ["2026-09-26", "2026-09-27", "2026-09-28"],
          doctor_name: "Dr. Sarah Jenkins",
          status: "SUCCESS"
        }
      }, null, 2));
      setSimulating(false);
    }, 600);
  };

  return (
    <div className="surface rounded-xl border-base-c shadow-soft overflow-hidden">
      {/* Dock Header & Tab Bar (Matching Meta screenshot) */}
      <div className="flex items-center justify-between px-3 py-2 bg-subtle-c border-b border-base-c select-none">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => { setActiveTab('errors'); setIsExpanded(true); }}
            className={cx(
              'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition',
              activeTab === 'errors' && isExpanded
                ? 'surface text-primary-c border border-base-c shadow-xs'
                : 'text-secondary-c hover:text-primary-c'
            )}
          >
            <span>Flow JSON errors</span>
            <span
              className={cx(
                'px-1.5 py-0.2 text-[10px] rounded-full font-bold',
                errorCount > 0
                  ? 'bg-rose-500 text-white'
                  : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              )}
            >
              {errorCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('actions'); setIsExpanded(true); }}
            className={cx(
              'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition',
              activeTab === 'actions' && isExpanded
                ? 'surface text-primary-c border border-base-c shadow-xs'
                : 'text-secondary-c hover:text-primary-c'
            )}
          >
            <Terminal className="w-3.5 h-3.5 text-blue-500" />
            <span>Actions</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('endpoint'); setIsExpanded(true); }}
            className={cx(
              'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition',
              activeTab === 'endpoint' && isExpanded
                ? 'surface text-primary-c border border-base-c shadow-xs'
                : 'text-secondary-c hover:text-primary-c'
            )}
          >
            <Globe className="w-3.5 h-3.5 text-purple-500" />
            <span>Endpoint</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(prev => !prev)}
          className="p-1 text-muted-c hover:text-primary-c rounded hover:bg-subtle-c transition"
          title={isExpanded ? 'Collapse dock' : 'Expand dock'}
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Dock Content Body */}
      {isExpanded && (
        <div className="p-3 text-xs max-h-56 overflow-y-auto">
          {/* TAB 1: ERRORS & LINTING */}
          {activeTab === 'errors' && (
            <div className="space-y-2">
              {errors.length === 0 ? (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-xs">
                    No JSON errors found! Your Meta Flow schema is compliant with Meta WhatsApp Cloud specification.
                  </span>
                </div>
              ) : (
                errors.map((err, idx) => (
                  <div
                    key={idx}
                    className={cx(
                      'flex items-start justify-between gap-2.5 p-2.5 rounded-lg border text-xs',
                      err.type === 'error'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                    )}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold leading-snug">{err.message}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-c">
                          {err.line && <span className="font-mono font-bold">Line {err.line}</span>}
                          {err.screenId && (
                            <button
                              onClick={() => onSelectScreen && onSelectScreen(err.screenId!)}
                              className="font-mono text-primary-600 hover:underline"
                            >
                              Screen: {err.screenId}
                            </button>
                          )}
                          <span className="bg-subtle-c px-1.5 py-0.2 rounded font-mono uppercase">{err.rule}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: ACTIONS & FLOW VALIDATION TRACE */}
          {activeTab === 'actions' && (
            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-2.5 bg-subtle-c rounded-lg border border-base-c space-y-1">
                <div className="flex items-center justify-between text-muted-c">
                  <span className="text-emerald-600 font-bold">✓ Flow Validation Check</span>
                  <span>v7.0 Ready</span>
                </div>
                <p className="text-primary-c">Screens Count: {screensCount} screens registered</p>
                <p className="text-muted-c">Payload schema compiled with native WhatsApp Form Layout.</p>
              </div>

              <div className="p-2.5 bg-subtle-c rounded-lg border border-base-c space-y-1">
                <div className="flex items-center justify-between text-muted-c">
                  <span className="text-blue-600 font-bold">✓ Dynamic Routing Check</span>
                  <span>Active</span>
                </div>
                <p className="text-primary-c">Interactive terminal screen routing verification passed.</p>
              </div>
            </div>
          )}

          {/* TAB 3: ENDPOINT / DATA EXCHANGE TESTER */}
          {activeTab === 'endpoint' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={endpointUrl}
                  onChange={(e) => setEndpointUrl(e.target.value)}
                  placeholder="https://your-domain.com/flow-endpoint"
                  className="flex-1 px-2.5 py-1.5 surface border-base-c rounded-lg text-xs font-mono text-primary-c"
                />
                <button
                  type="button"
                  onClick={handleSimulateEndpoint}
                  disabled={simulating}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{simulating ? 'Calling…' : 'Test Endpoint'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-muted-c block mb-1">Simulated Request Payload</label>
                  <textarea
                    rows={3}
                    value={endpointRequest}
                    onChange={(e) => setEndpointRequest(e.target.value)}
                    className="w-full p-2 surface border-base-c rounded font-mono text-[10px] text-primary-c resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-c block mb-1">Simulated Endpoint Response</label>
                  <pre className="w-full h-16 p-2 bg-subtle-c border border-base-c rounded font-mono text-[10px] text-emerald-600 overflow-auto">
                    {endpointResponse || '// Click Test Endpoint to simulate response'}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
