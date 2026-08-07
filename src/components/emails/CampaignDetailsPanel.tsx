import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { Campaign, CAMPAIGN_STATUS_META } from './emailData';
import { pauseEmailCampaign, resumeEmailCampaign, cancelEmailCampaign, fetchEmailCampaigns } from '@/lib/emailsApi';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  PauseCircle,
  Send,
  MailOpen,
  MousePointerClick,
  AlertTriangle,
  LogOut,
  XCircle
} from 'lucide-react';

interface CampaignDetailsPanelProps {
  campaignId: string;
  onBack: () => void;
}

export function CampaignDetailsPanel({ campaignId, onBack }: CampaignDetailsPanelProps) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCampaign = async () => {
    try {
      const res = await fetchEmailCampaigns(0, 100);
      if (res.error) throw new Error(res.error);
      const dto = res.data?.content.find(c => c.id === campaignId);
      if (!dto) throw new Error('Campaign not found');
      
      const formatDate = (dStr?: string) => dStr ? new Date(dStr).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : undefined;
      
      let status: Campaign['status'] = 'sent';
      if (dto.status === 'DRAFT') status = 'draft';
      else if (dto.status === 'SCHEDULED') status = 'scheduled';
      else if (dto.status === 'SENDING') status = 'sending';
      else if (dto.status === 'PAUSED') status = 'paused';
      else if (dto.status === 'CANCELLED') status = 'cancelled';
      else if (dto.status === 'COMPLETED') status = 'completed';
      else if (dto.status === 'FAILED') status = 'failed';
      else if (dto.status === 'SENT') status = 'sent';

      setCampaign({
        id: dto.id,
        name: dto.name || dto.subject,
        subject: dto.subject,
        status,
        recipients: dto.totalRecipients || dto.totalSent || 0,
        totalRecipients: dto.totalRecipients,
        processedRecipients: dto.processedRecipients,
        totalSent: dto.totalSent,
        totalFailed: dto.totalFailed,
        openRate: dto.openRate || 0,
        clickRate: dto.clickRate || 0,
        uniqueOpens: dto.uniqueOpens || 0,
        uniqueClicks: dto.uniqueClicks || 0,
        bounces: dto.bounces || 0,
        unsubscribes: dto.unsubscribes || 0,
        clickToOpenRate: dto.clickToOpenRate || 0,
        bounceRate: dto.bounceRate || 0,
        unsubscribeRate: dto.unsubscribeRate || 0,
        createdAt: dto.createdAt,
        sentAt: formatDate(dto.sentAt) || formatDate(dto.createdAt) || 'Just now',
        scheduledAt: formatDate(dto.scheduledAt),
        startedAt: formatDate(dto.startedAt),
        completedAt: formatDate(dto.completedAt),
        pausedAt: formatDate(dto.pausedAt),
        cancelledAt: formatDate(dto.cancelledAt),
        template: dto.recipientMode ? `Mode: ${dto.recipientMode}` : 'Custom Email',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaign();
  }, [campaignId]);

  useEffect(() => {
    // Polling for active campaigns
    if (campaign && (campaign.status === 'sending')) {
      const interval = setInterval(() => {
        loadCampaign();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [campaign?.status]);

  if (loading && !campaign) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" /></div>;
  }

  if (error || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertTriangle className="h-12 w-12 text-danger-500 mb-4" />
        <h3 className="text-lg font-bold text-primary-c">Error Loading Campaign</h3>
        <p className="text-secondary-c mb-6">{error || 'Campaign not found'}</p>
        <button onClick={onBack} className="rounded-lg bg-primary-500 px-4 py-2 text-white">Back to Campaigns</button>
      </div>
    );
  }

  const meta = CAMPAIGN_STATUS_META[campaign.status] || CAMPAIGN_STATUS_META.sent;

  const handlePause = async () => {
    if (actionLoading) return;
    if (confirm('Are you sure you want to pause this campaign?')) {
      setActionLoading(true);
      await pauseEmailCampaign(campaign.id);
      await loadCampaign();
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    if (actionLoading) return;
    if (confirm('Are you sure you want to resume this campaign?')) {
      setActionLoading(true);
      await resumeEmailCampaign(campaign.id);
      await loadCampaign();
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (actionLoading) return;
    if (confirm('Are you sure you want to cancel this campaign? Messages already handed to the email provider cannot be recalled.')) {
      setActionLoading(true);
      await cancelEmailCampaign(campaign.id);
      await loadCampaign();
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Hero */}
      <GlassCard className="relative overflow-hidden p-6 sm:p-8 border-none ring-1 ring-base-c shadow-md">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-6">
            <button 
              onClick={onBack}
              className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-base-c bg-white/50 backdrop-blur-md text-secondary-c transition-all hover:bg-white hover:text-primary-c dark:bg-ink-800/50 dark:hover:bg-ink-800 shadow-sm hover:shadow hover:-translate-x-0.5"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-black text-primary-c tracking-tight">{campaign.name}</h2>
                <span className={cx('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/5', meta.color)}>
                  <span className={cx('h-1.5 w-1.5 rounded-full', campaign.status === 'sending' ? 'animate-pulse' : '', meta.dot)} />
                  {meta.label}
                </span>
              </div>
              <p className="text-sm sm:text-base text-secondary-c mt-2 font-medium max-w-2xl">{campaign.subject}</p>
            </div>
          </div>

          {/* State Aware Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {(campaign.status === 'paused' || campaign.status === 'sending') && (
              <>
                {campaign.status === 'paused' ? (
                  <button onClick={handleResume} disabled={actionLoading} className="flex items-center gap-2 rounded-xl border border-success-500/30 bg-success-500/10 px-4 py-2.5 text-sm font-bold text-success-700 dark:text-success-400 transition-all hover:bg-success-500/20 hover:scale-105 shadow-sm disabled:opacity-50 disabled:hover:scale-100">
                    <Play className="h-4.5 w-4.5" /> {actionLoading ? 'Loading...' : 'Resume Campaign'}
                  </button>
                ) : (
                  <button onClick={handlePause} disabled={actionLoading} className="flex items-center gap-2 rounded-xl border border-warning-500/30 bg-warning-500/10 px-4 py-2.5 text-sm font-bold text-warning-700 dark:text-warning-400 transition-all hover:bg-warning-500/20 hover:scale-105 shadow-sm disabled:opacity-50 disabled:hover:scale-100">
                    <PauseCircle className="h-4.5 w-4.5" /> {actionLoading ? 'Loading...' : 'Pause Campaign'}
                  </button>
                )}
              </>
            )}
            {(campaign.status === 'scheduled' || campaign.status === 'sending' || campaign.status === 'paused' || campaign.status === 'draft') && (
              <button onClick={handleCancel} disabled={actionLoading} className="flex items-center gap-2 rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-2.5 text-sm font-bold text-danger-700 dark:text-danger-400 transition-all hover:bg-danger-500/20 hover:scale-105 shadow-sm disabled:opacity-50 disabled:hover:scale-100">
                <XCircle className="h-4.5 w-4.5" /> Cancel
              </button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Campaign Details & Timeline */}
      {/* Campaign Details & Timeline */}
      <GlassCard className="p-6 sm:p-8">
         <h3 className="text-xs font-black text-primary-c mb-6 uppercase tracking-widest flex items-center gap-2">
           <Clock className="h-4 w-4 text-primary-500" />
           Timeline & Settings
         </h3>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
            <div className="relative">
              <div className="absolute -left-3 top-2 bottom-0 w-px bg-base-c hidden md:block" />
              <p className="text-muted-c text-[10px] uppercase font-bold tracking-widest mb-1.5">Created At</p>
              <p className="font-bold text-primary-c">
                 {campaign.createdAt ? new Date(campaign.createdAt).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div className="relative">
              <div className="absolute -left-3 top-2 bottom-0 w-px bg-base-c hidden md:block" />
              <p className="text-muted-c text-[10px] uppercase font-bold tracking-widest mb-1.5">Scheduled For</p>
              <p className="font-bold text-primary-c">
                 {campaign.scheduledAt ? campaign.scheduledAt : 'Immediate'}
              </p>
            </div>
            <div className="relative">
              <div className="absolute -left-3 top-2 bottom-0 w-px bg-base-c hidden md:block" />
              <p className="text-muted-c text-[10px] uppercase font-bold tracking-widest mb-1.5">Started At</p>
              <p className="font-bold text-primary-c">
                 {campaign.startedAt ? campaign.startedAt : 'N/A'}
              </p>
            </div>
            <div className="relative">
              <div className="absolute -left-3 top-2 bottom-0 w-px bg-base-c hidden md:block" />
              <p className="text-muted-c text-[10px] uppercase font-bold tracking-widest mb-1.5">Completed At</p>
              <p className="font-bold text-primary-c">
                 {campaign.completedAt ? campaign.completedAt : 'N/A'}
              </p>
            </div>
         </div>
      </GlassCard>

      {/* Progress Section (Only for active sending campaigns) */}
      {(campaign.status === 'sending' || campaign.status === 'paused' || campaign.status === 'cancelled') && (
        <GlassCard className="p-6 sm:p-8 border-primary-500/30 shadow-xl shadow-primary-500/10 bg-gradient-to-br from-white to-primary-50/50 dark:from-ink-900 dark:to-primary-900/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Send className="h-32 w-32 text-primary-500" />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-end mb-4">
               <h3 className="text-xs font-black text-primary-c uppercase tracking-widest flex items-center gap-2">
                 <Play className="h-4 w-4 text-primary-500" />
                 Dispatch Progress
               </h3>
               <div className="flex items-center gap-2">
                 <span className="text-2xl font-black text-primary-c tabular-nums leading-none">{campaign.processedRecipients || 0}</span>
                 <span className="text-sm font-bold text-muted-c leading-none">/ {campaign.totalRecipients || 0}</span>
               </div>
            </div>
            <div className="w-full bg-slate-200 dark:bg-ink-800 rounded-full h-4 mb-4 overflow-hidden shadow-inner ring-1 ring-inset ring-black/5">
              <div 
                className={cx(
                  "h-full rounded-full transition-all duration-1000 relative overflow-hidden",
                  campaign.status === 'paused' ? 'bg-warning-500' :
                  campaign.status === 'cancelled' ? 'bg-danger-500' : 'bg-gradient-accent'
                )}
                style={{ width: `${Math.min(100, Math.max(0, ((campaign.processedRecipients || 0) / (campaign.totalRecipients || 1)) * 100))}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            <div className="flex justify-between text-xs font-bold text-secondary-c">
               <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success-500" /> {campaign.totalSent || 0} Delivered</span>
               <span className="flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5 text-danger-500" /> {campaign.totalFailed || 0} Failed</span>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Performance Funnel */}
      {/* Performance Funnel */}
      {(campaign.status === 'sent' || campaign.status === 'completed' || campaign.status === 'sending' || campaign.status === 'paused' || campaign.status === 'cancelled') && (
        <div className="space-y-4">
          <h3 className="text-xs font-black text-primary-c uppercase tracking-widest pl-2">Engagement Funnel</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Delivered */}
            <GlassCard className="p-6 relative overflow-hidden group hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
               <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 group-hover:rotate-12 transition-all duration-500">
                 <Send className="h-32 w-32 text-blue-500" />
               </div>
               <div className="relative z-10">
                 <div className="flex items-center justify-between mb-6">
                   <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20">
                     <Send className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                   </div>
                 </div>
                 <p className="text-[10px] font-black text-secondary-c uppercase tracking-widest mb-2">Total Delivered</p>
                 <div className="flex items-baseline gap-2">
                   <p className="text-5xl font-black text-primary-c tabular-nums tracking-tighter">{campaign.totalSent || 0}</p>
                 </div>
                 <p className="text-xs font-bold text-muted-c mt-3">Messages successfully reached inbox</p>
               </div>
            </GlassCard>
            
            {/* Unique Opens */}
            <GlassCard className="p-6 relative overflow-hidden group hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
               <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 group-hover:rotate-12 transition-all duration-500">
                 <MailOpen className="h-32 w-32 text-emerald-500" />
               </div>
               <div className="relative z-10">
                 <div className="flex items-center justify-between mb-6">
                   <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
                     <MailOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                   </div>
                   <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                     <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 tabular-nums">{campaign.openRate}%</span>
                     <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase">Rate</span>
                   </div>
                 </div>
                 <p className="text-[10px] font-black text-secondary-c uppercase tracking-widest mb-2">Unique Opens</p>
                 <div className="flex items-baseline gap-2">
                   <p className="text-5xl font-black text-primary-c tabular-nums tracking-tighter">{campaign.uniqueOpens || 0}</p>
                 </div>
                 <p className="text-xs font-bold text-muted-c mt-3">Recipients who opened the email</p>
               </div>
            </GlassCard>
            
            {/* Unique Clicks */}
            <GlassCard className="p-6 relative overflow-hidden group hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300">
               <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 group-hover:rotate-12 transition-all duration-500">
                 <MousePointerClick className="h-32 w-32 text-purple-500" />
               </div>
               <div className="relative z-10">
                 <div className="flex items-center justify-between mb-6">
                   <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center ring-1 ring-purple-500/20">
                     <MousePointerClick className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                   </div>
                   <div className="flex items-center gap-1.5 bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-500/20">
                     <span className="text-sm font-black text-purple-700 dark:text-purple-400 tabular-nums">{campaign.clickRate}%</span>
                     <span className="text-[10px] font-bold text-purple-600/70 dark:text-purple-400/70 uppercase">Rate</span>
                   </div>
                 </div>
                 <p className="text-[10px] font-black text-secondary-c uppercase tracking-widest mb-2">Unique Clicks</p>
                 <div className="flex items-baseline gap-2">
                   <p className="text-5xl font-black text-primary-c tabular-nums tracking-tighter">{campaign.uniqueClicks || 0}</p>
                 </div>
                 <p className="text-xs font-bold text-muted-c mt-3">Recipients who clicked a link</p>
               </div>
            </GlassCard>
          </div>

          {/* Bounces/Unsubscribes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <GlassCard className="p-5 flex flex-row items-center justify-between border-danger-500/10 bg-danger-50/30 dark:bg-danger-900/10">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-danger-500/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-danger-600 dark:text-danger-400" />
                </div>
                <div>
                  <p className="font-bold text-primary-c">Bounces</p>
                  <p className="text-xs font-medium text-secondary-c">Undeliverable addresses</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-primary-c tabular-nums leading-none">{campaign.bounces || 0}</p>
                <p className="text-xs font-bold text-danger-500 mt-1">{campaign.bounceRate || 0}% rate</p>
              </div>
            </GlassCard>

            <GlassCard className="p-5 flex flex-row items-center justify-between border-amber-500/10 bg-amber-50/30 dark:bg-amber-900/10">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <LogOut className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-bold text-primary-c">Unsubscribes</p>
                  <p className="text-xs font-medium text-secondary-c">Opted out of emails</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-primary-c tabular-nums leading-none">{campaign.unsubscribes || 0}</p>
                <p className="text-xs font-bold text-amber-500 mt-1">{campaign.unsubscribeRate || 0}% rate</p>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
