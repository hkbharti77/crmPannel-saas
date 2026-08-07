import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cx } from '@/lib/types';
import { fetchEmailCampaigns, fetchEmailTemplates, deleteEmailTemplate } from '@/lib/emailsApi';
import { Campaign, EmailTemplate, CAMPAIGN_STATUS_META } from './emailData';
import { GlassCard } from '@/components/ui/primitives';
import { CampaignDetailsPanel } from './CampaignDetailsPanel';
import { EmailTemplatesPanel } from './EmailTemplatesPanel';
import { TabSwitcher } from '@/components/ui/TabSwitcher';
import {
  Mail, LayoutTemplate, Plus, Search, Filter, Play, PauseCircle,
  XCircle, Copy, Trash2, ArrowRight, MousePointerClick, MailOpen, BarChart3, AlertCircle
} from 'lucide-react';

export function EmailsView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // URL State mapping
  const activeTab = searchParams.get('tab') === 'templates' ? 'templates' : 'campaigns';
  const selectedCampaignId = searchParams.get('id');

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'campaigns') {
        const res = await fetchEmailCampaigns(0, 100);
        if (res.error) throw new Error(res.error);
        if (res.data) {
          const mapped: Campaign[] = res.data.content.map(dto => {
            let status: Campaign['status'] = 'draft';
            if (dto.status === 'SENT') status = 'sent';
            else if (dto.status === 'SCHEDULED') status = 'scheduled';
            else if (dto.status === 'SENDING') status = 'sending';
            else if (dto.status === 'PAUSED') status = 'paused';
            else if (dto.status === 'CANCELLED') status = 'cancelled';
            else if (dto.status === 'COMPLETED') status = 'completed';
            else if (dto.status === 'FAILED') status = 'failed';
            return {
              id: dto.id,
              name: dto.name || dto.subject,
              subject: dto.subject,
              status,
              recipients: dto.totalRecipients || 0,
              totalRecipients: dto.totalRecipients || 0,
              processedRecipients: dto.processedRecipients || 0,
              totalSent: dto.totalSent || 0,
              totalFailed: dto.totalFailed || 0,
              openRate: dto.openRate || 0,
              clickRate: dto.clickRate || 0,
              uniqueOpens: dto.uniqueOpens || 0,
              uniqueClicks: dto.uniqueClicks || 0,
              bounces: dto.bounces || 0,
              unsubscribes: dto.unsubscribes || 0,
              createdAt: dto.createdAt,
              sentAt: dto.sentAt,
              template: dto.recipientMode || 'Manual'
            };
          });
          setCampaigns(mapped);
        }
      } else {
        const res = await fetchEmailTemplates();
        if (res.error) throw new Error(res.error);
        if (res.data) {
          // Cast DTO to UI model
          setTemplates(res.data.map((t: any) => ({
            id: t.id,
            name: t.name,
            subject: t.subject,
            body: t.content,
            category: t.interestCategory || 'announcement'
          })));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleTabChange = (tab: 'campaigns' | 'templates') => {
    setSearchParams(tab === 'campaigns' ? {} : { tab: 'templates' });
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    if (!campaigns.length) return { totalSent: 0, avgOpen: 0, avgClick: 0 };
    let totalSent = 0;
    let totalOpens = 0;
    let totalClicks = 0;
    campaigns.forEach(c => {
      totalSent += (c.totalSent || 0);
      totalOpens += (c.uniqueOpens || 0);
      totalClicks += (c.uniqueClicks || 0);
    });
    return {
      totalSent,
      avgOpen: totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0,
      avgClick: totalSent > 0 ? Math.round((totalClicks / totalSent) * 100) : 0
    };
  }, [campaigns]);

  // If a campaign is selected, render the details panel
  if (selectedCampaignId) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <CampaignDetailsPanel 
          campaignId={selectedCampaignId} 
          onBack={() => {
            searchParams.delete('id');
            setSearchParams(searchParams);
          }} 
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary-c sm:text-4xl">
            Email Center
          </h1>
          <p className="text-sm text-secondary-c mt-2 max-w-2xl">
            Manage your high-volume outbound campaigns and reusable HTML templates.
          </p>
        </div>
        <TabSwitcher
          tabs={[
            { id: 'campaigns', label: 'Campaigns', icon: <Mail className="h-4 w-4" /> },
            { id: 'templates', label: 'Templates', icon: <LayoutTemplate className="h-4 w-4" /> }
          ]}
          activeTab={activeTab}
          onChange={(id) => handleTabChange(id as any)}
        />
      </div>

      {error && (
        <div className="p-4 bg-danger-500/10 border border-danger-500/20 text-danger-700 dark:text-danger-400 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Campaigns Tab Content */}
      {activeTab === 'campaigns' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <GlassCard className="p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BarChart3 className="h-24 w-24 text-blue-500" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
                    <Mail className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-secondary-c uppercase tracking-widest">Total Sent</p>
                </div>
                <p className="text-4xl font-black text-primary-c tabular-nums tracking-tight">{loading ? '-' : metrics.totalSent}</p>
                <p className="text-xs text-muted-c mt-2 font-medium flex items-center gap-1">
                  Across <span className="text-primary-c font-bold">{campaigns.length}</span> campaigns
                </p>
              </div>
            </GlassCard>
            
            <GlassCard className="p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <MailOpen className="h-24 w-24 text-emerald-500" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                    <MailOpen className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-secondary-c uppercase tracking-widest">Avg Open Rate</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-primary-c tabular-nums tracking-tight">{loading ? '-' : `${metrics.avgOpen}`}</p>
                  <span className="text-xl font-bold text-muted-c">%</span>
                </div>
                <p className="text-xs text-muted-c mt-2 font-medium">Industry standard: ~20%</p>
              </div>
            </GlassCard>

            <GlassCard className="p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <MousePointerClick className="h-24 w-24 text-purple-500" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20">
                    <MousePointerClick className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-secondary-c uppercase tracking-widest">Avg Click Rate</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-primary-c tabular-nums tracking-tight">{loading ? '-' : `${metrics.avgClick}`}</p>
                  <span className="text-xl font-bold text-muted-c">%</span>
                </div>
                <p className="text-xs text-muted-c mt-2 font-medium">Based on unique clicks</p>
              </div>
            </GlassCard>
          </div>

          {/* Action Bar */}
          <div className="flex justify-between items-center bg-white dark:bg-ink-900 p-2 rounded-xl ring-1 ring-base-c shadow-sm">
            <div className="relative w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-c" />
              <input 
                type="text" 
                placeholder="Search campaigns..." 
                className="w-full pl-10 pr-4 py-2 bg-transparent text-sm text-primary-c focus:outline-none placeholder:text-muted-c font-medium"
              />
            </div>
            <div className="flex items-center gap-2 pr-1">
              <button className="flex items-center gap-2 px-3 py-2 text-secondary-c hover:bg-slate-100 dark:hover:bg-ink-800 rounded-lg text-sm font-semibold transition-colors">
                <Filter className="h-4 w-4" />
                Filter
              </button>
              <div className="w-px h-6 bg-base-c mx-1" />
              <button
                onClick={() => navigate('/emails/create')}
                className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-bold shadow-md shadow-primary-500/20 transition-all hover:shadow-primary-500/40"
              >
                <Plus className="h-4.5 w-4.5" />
                New Campaign
              </button>
            </div>
          </div>

          {/* Campaigns List */}
          <div className="flex flex-col gap-3">
            {loading ? (
              <GlassCard className="flex flex-col items-center justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-500 border-t-transparent mb-4" />
                <p className="font-bold text-sm text-primary-c">Loading campaigns...</p>
              </GlassCard>
            ) : campaigns.length === 0 ? (
              <GlassCard className="flex flex-col items-center justify-center py-24 text-center group">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-ink-800 dark:to-ink-900 text-muted-c mb-6 shadow-inner group-hover:scale-105 transition-transform duration-500">
                  <Mail className="h-10 w-10 text-primary-500/50" />
                </div>
                <h3 className="text-xl font-black text-primary-c mb-2 tracking-tight">No campaigns yet</h3>
                <p className="text-sm text-secondary-c mb-8 max-w-sm">Launch your first highly-targeted email sequence and start tracking engagement.</p>
                <button
                  onClick={() => navigate('/emails/create')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-accent text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all hover:-translate-y-0.5"
                >
                  <Plus className="h-5 w-5" />
                  Create Your First Campaign
                </button>
              </GlassCard>
            ) : (
              campaigns.map((campaign, idx) => {
                const meta = CAMPAIGN_STATUS_META[campaign.status] || CAMPAIGN_STATUS_META.draft;
                return (
                  <GlassCard 
                    key={campaign.id} 
                    className="p-4 sm:p-5 hover:border-primary-500/30 hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300 cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                    onClick={() => setSearchParams({ ...Object.fromEntries(searchParams.entries()), id: campaign.id })}
                  >
                    {/* Left: Icon & Title */}
                    <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
                      <div className="relative shrink-0 h-12 w-12 rounded-2xl bg-gradient-to-br from-primary-500/10 to-primary-600/5 flex items-center justify-center ring-1 ring-primary-500/20 group-hover:scale-105 transition-transform duration-300">
                        <Mail className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                        <div className={cx("absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-ink-900 shadow-sm", meta.dot)} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-primary-c text-base group-hover:text-primary-600 transition-colors truncate pr-4">{campaign.name}</h3>
                        <p className="text-xs text-secondary-c mt-0.5 truncate font-medium max-w-sm">{campaign.subject}</p>
                      </div>
                    </div>

                    {/* Middle: Stats */}
                    <div className="flex items-center gap-6 sm:gap-10 sm:px-10 sm:border-x border-base-c border-dashed shrink-0">
                      <div className="flex flex-col items-start sm:items-center">
                        <span className="text-[9px] uppercase font-bold text-muted-c tracking-widest mb-1.5">Delivered</span>
                        <span className="font-black text-primary-c text-lg sm:text-xl tabular-nums leading-none">{campaign.totalSent || 0}</span>
                      </div>
                      <div className="flex flex-col items-start sm:items-center">
                        <span className="text-[9px] uppercase font-bold text-muted-c tracking-widest mb-1.5">Open Rate</span>
                        <div className="flex items-center gap-1.5 leading-none">
                          <span className="font-black text-primary-c text-lg sm:text-xl tabular-nums">{campaign.openRate || 0}</span>
                          <span className="text-sm font-bold text-muted-c">%</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-start sm:items-center">
                        <span className="text-[9px] uppercase font-bold text-muted-c tracking-widest mb-1.5">Clicks</span>
                        <span className="font-black text-primary-c text-lg sm:text-xl tabular-nums leading-none">{campaign.uniqueClicks || 0}</span>
                      </div>
                    </div>

                    {/* Right: Status & Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 w-full sm:w-[140px]">
                      <span className={cx('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider', meta.color)}>
                        <span className={cx('h-1.5 w-1.5 rounded-full', campaign.status === 'sending' ? 'animate-pulse' : '', meta.dot)} />
                        {meta.label}
                      </span>
                      <div className="h-10 w-10 rounded-full bg-slate-50 dark:bg-ink-800 flex items-center justify-center text-muted-c group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 group-hover:text-primary-600 transition-all transform group-hover:translate-x-1 ring-1 ring-base-c group-hover:ring-primary-500/30 shadow-sm">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </div>
                  </GlassCard>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Templates Tab Content */}
      {activeTab === 'templates' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <EmailTemplatesPanel />
        </div>
      )}
    </div>
  );
}

export default EmailsView;
