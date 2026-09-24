import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare, Send, FileText, Settings, Sparkles, CheckCircle2, Server, ShieldCheck } from 'lucide-react';
import { GlassCard } from '@/components/ui/primitives';
import { TabSwitcher } from '@/components/ui/TabSwitcher';
import { SmsCampaignsPanel } from './SmsCampaignsPanel';
import { SmsTemplatesPanel } from './SmsTemplatesPanel';
import { SmsProvidersPanel } from '../settings/panels/SmsProvidersPanel';
import { fetchSmsCampaigns, fetchSmsTemplates, fetchSmsProviders } from '@/lib/smsApi';
import { SmsCampaign, SmsTemplate, MaskedSmsProvider } from '@/types/sms';

export function SmsView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = tabParam === 'templates' ? 'templates' : tabParam === 'providers' ? 'providers' : 'campaigns';

  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([]);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [providers, setProviders] = useState<MaskedSmsProvider[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const [cData, tData, pData] = await Promise.all([
        fetchSmsCampaigns(),
        fetchSmsTemplates(),
        fetchSmsProviders(),
      ]);
      setCampaigns(Array.isArray(cData) ? cData : []);
      setTemplates(Array.isArray(tData) ? tData : []);
      setProviders(Array.isArray(pData) ? pData : []);
    } catch {
      // Ignore background metric fetch error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [activeTab]);

  const metrics = useMemo(() => {
    const totalDispatched = campaigns.reduce((acc, c) => acc + (c.deliveredCount || 0), 0);
    const activeProviders = providers.filter((p) => p.status === 'CONNECTED').length;
    return { totalDispatched, templatesCount: templates.length, activeProviders };
  }, [campaigns, templates, providers]);

  const handleTabChange = (id: string) => {
    setSearchParams(id === 'campaigns' ? {} : { tab: id });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header Section styled according to standard CRM design flow */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-blue-600/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-primary-c">SMS Campaigns & Gateway Engine</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Multi-Gateway Active
              </span>
            </div>
            <p className="mt-0.5 text-xs text-secondary-c">
              Dispatch high-throughput SMS broadcasts, manage DLT-approved templates, and configure Twilio, MSG91 & Fast2SMS credentials.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <TabSwitcher
            tabs={[
              { id: 'campaigns', label: `Campaigns (${campaigns.length})`, icon: <Send className="h-4 w-4" /> },
              { id: 'templates', label: `DLT Templates (${templates.length})`, icon: <FileText className="h-4 w-4" /> },
              { id: 'providers', label: `SMS Gateways (${providers.length})`, icon: <Settings className="h-4 w-4" /> },
            ]}
            activeTab={activeTab}
            onChange={handleTabChange}
          />
        </div>
      </div>

      {/* KPI Metrics Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-5 relative overflow-hidden group transition-all duration-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/15 rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-c">SMS Delivered</p>
                <p className="text-2xl font-bold tabular-nums text-primary-c tracking-tight mt-0.5">
                  {loading ? '-' : metrics.totalDispatched.toLocaleString()}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md text-indigo-600 bg-indigo-500/10">
              {campaigns.length} Campaigns
            </span>
          </div>
        </GlassCard>

        <GlassCard className="p-5 relative overflow-hidden group transition-all duration-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/15 rounded-2xl text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-c">DLT Templates</p>
                <p className="text-2xl font-bold tabular-nums text-primary-c tracking-tight mt-0.5">
                  {loading ? '-' : metrics.templatesCount}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md text-emerald-600 bg-emerald-500/10">
              Approved
            </span>
          </div>
        </GlassCard>

        <GlassCard className="p-5 relative overflow-hidden group transition-all duration-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/15 rounded-2xl text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-c">Connected Gateways</p>
                <p className="text-2xl font-bold tabular-nums text-primary-c tracking-tight mt-0.5">
                  {loading ? '-' : providers.length}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md text-blue-600 bg-blue-500/10">
              {metrics.activeProviders} Active
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {activeTab === 'campaigns' && <SmsCampaignsPanel />}
        {activeTab === 'templates' && <SmsTemplatesPanel />}
        {activeTab === 'providers' && <SmsProvidersPanel />}
      </div>
    </div>
  );
}
