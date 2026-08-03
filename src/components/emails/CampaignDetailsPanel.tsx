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
        name: dto.subject,
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
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-base-c pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-base-c bg-white text-secondary-c transition-colors hover:bg-slate-50 hover:text-primary-c dark:bg-ink-850 dark:hover:bg-ink-800 shadow-sm"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-primary-c tracking-tight">{campaign.name}</h2>
              <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', meta.color)}>
                <span className={cx('h-1.5 w-1.5 rounded-full', meta.dot)} />
                {meta.label}
              </span>
            </div>
            <p className="text-sm text-secondary-c mt-1 font-medium">{campaign.subject}</p>
          </div>
        </div>

        {/* State Aware Actions */}
        <div className="flex items-center gap-2">
          {(campaign.status === 'paused' || campaign.status === 'sending') && (
            <>
              {campaign.status === 'paused' ? (
                <button onClick={handleResume} disabled={actionLoading} className="flex items-center gap-1.5 rounded-lg border border-success-500/30 bg-success-500/10 px-3 py-1.5 text-sm font-semibold text-success-600 transition-colors hover:bg-success-500/20 disabled:opacity-50">
                  <Play className="h-4 w-4" /> {actionLoading ? 'Loading...' : 'Resume'}
                </button>
              ) : (
                <button onClick={handlePause} disabled={actionLoading} className="flex items-center gap-1.5 rounded-lg border border-warning-500/30 bg-warning-500/10 px-3 py-1.5 text-sm font-semibold text-warning-700 transition-colors hover:bg-warning-500/20 disabled:opacity-50">
                  <PauseCircle className="h-4 w-4" /> {actionLoading ? 'Loading...' : 'Pause'}
                </button>
              )}
            </>
          )}
          {(campaign.status === 'scheduled' || campaign.status === 'sending' || campaign.status === 'paused' || campaign.status === 'draft') && (
            <button onClick={handleCancel} disabled={actionLoading} className="flex items-center gap-1.5 rounded-lg border border-danger-500/30 bg-danger-500/10 px-3 py-1.5 text-sm font-semibold text-danger-600 transition-colors hover:bg-danger-500/20 disabled:opacity-50">
              <XCircle className="h-4 w-4" /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Campaign Details & Timeline */}
      <GlassCard className="p-6">
         <h3 className="text-sm font-bold text-primary-c mb-4 uppercase tracking-wider">Campaign Information</h3>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
              <p className="text-muted-c text-xs mb-1">Created At</p>
              <p className="font-semibold text-primary-c flex items-center gap-1">
                 <Clock className="h-3.5 w-3.5 text-secondary-c" />
                 {campaign.createdAt ? new Date(campaign.createdAt).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-muted-c text-xs mb-1">Scheduled For</p>
              <p className="font-semibold text-primary-c flex items-center gap-1">
                 <Clock className="h-3.5 w-3.5 text-warning-500" />
                 {campaign.scheduledAt ? campaign.scheduledAt : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-muted-c text-xs mb-1">Started At</p>
              <p className="font-semibold text-primary-c flex items-center gap-1">
                 <Play className="h-3.5 w-3.5 text-primary-500" />
                 {campaign.startedAt ? campaign.startedAt : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-muted-c text-xs mb-1">Completed At</p>
              <p className="font-semibold text-primary-c flex items-center gap-1">
                 <CheckCircle2 className="h-3.5 w-3.5 text-success-500" />
                 {campaign.completedAt ? campaign.completedAt : 'N/A'}
              </p>
            </div>
         </div>
      </GlassCard>

      {/* Progress Section (Only for active sending campaigns) */}
      {(campaign.status === 'sending' || campaign.status === 'paused' || campaign.status === 'cancelled') && (
        <GlassCard className="p-6 border-primary-500/30 shadow-soft-xl bg-gradient-to-r from-transparent to-primary-50/30 dark:to-primary-900/10">
          <div className="flex justify-between items-end mb-3">
             <h3 className="text-sm font-bold text-primary-c uppercase tracking-wider">Sending Progress</h3>
             <span className="text-xs font-semibold text-secondary-c">{campaign.processedRecipients || 0} / {campaign.totalRecipients || 0} processed</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-ink-700 rounded-full h-3 mb-3 overflow-hidden">
            <div 
              className={cx(
                "h-3 rounded-full transition-all duration-1000",
                campaign.status === 'paused' ? 'bg-warning-500' :
                campaign.status === 'cancelled' ? 'bg-danger-500' : 'bg-primary-500'
              )}
              style={{ width: `${Math.min(100, Math.max(0, ((campaign.processedRecipients || 0) / (campaign.totalRecipients || 1)) * 100))}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-muted-c">
             <span>{campaign.totalSent || 0} Delivered successfully</span>
             <span>{campaign.totalFailed || 0} Failed delivery</span>
          </div>
        </GlassCard>
      )}

      {/* Performance Funnel */}
      {(campaign.status === 'sent' || campaign.status === 'completed' || campaign.status === 'sending' || campaign.status === 'paused' || campaign.status === 'cancelled') && (
        <GlassCard className="p-6">
          <h3 className="text-sm font-bold text-primary-c mb-5 uppercase tracking-wider">Performance Funnel</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Sent */}
            <div className="flex flex-col gap-2 p-3">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                   <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                 </div>
                 <p className="text-sm font-semibold text-secondary-c">Delivered</p>
               </div>
               <div className="mt-2">
                 <p className="text-3xl font-bold text-primary-c tabular-nums">{campaign.totalSent || 0}</p>
                 <p className="text-xs text-muted-c mt-1 font-medium">Successfully dispatched</p>
               </div>
            </div>
            
            {/* Unique Opens */}
            <div className="flex flex-col gap-2 p-3">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                   <MailOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                 </div>
                 <p className="text-sm font-semibold text-secondary-c">Unique Opens</p>
               </div>
               <div className="mt-2 flex items-baseline gap-2">
                 <p className="text-3xl font-bold text-primary-c tabular-nums">{campaign.uniqueOpens || 0}</p>
                 <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">{campaign.openRate}%</span>
               </div>
               <p className="text-xs text-muted-c mt-1 font-medium">Estimated engagement</p>
            </div>
            
            {/* Unique Clicks */}
            <div className="flex flex-col gap-2 p-3">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                   <MousePointerClick className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                 </div>
                 <p className="text-sm font-semibold text-secondary-c">Unique Clicks</p>
               </div>
               <div className="mt-2 flex items-baseline gap-2">
                 <p className="text-3xl font-bold text-primary-c tabular-nums">{campaign.uniqueClicks || 0}</p>
                 <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-400">{campaign.clickRate}%</span>
               </div>
               <p className="text-xs text-muted-c mt-1 font-medium">Clicked links in email</p>
            </div>

            {/* Bounces/Unsubscribes */}
            <div className="flex flex-col justify-center gap-3 border-l border-base-c pl-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-danger-500" />
                  <span className="text-sm font-semibold text-secondary-c">Bounces</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary-c tabular-nums">{campaign.bounces || 0}</p>
                  <p className="text-[10px] font-bold text-danger-500">{campaign.bounceRate || 0}%</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LogOut className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold text-secondary-c">Unsubs</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary-c tabular-nums">{campaign.unsubscribes || 0}</p>
                  <p className="text-[10px] font-bold text-amber-500">{campaign.unsubscribeRate || 0}%</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
