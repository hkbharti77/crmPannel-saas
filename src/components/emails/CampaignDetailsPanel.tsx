import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { Campaign, CAMPAIGN_STATUS_META } from './emailData';
import { pauseEmailCampaign, resumeEmailCampaign, cancelEmailCampaign, fetchEmailCampaignById, fetchCampaignInboundReplies, simulateCampaignInboundReply, EmailInboundMessageDTO } from '@/lib/emailsApi';
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
  MessageSquare,
  AlertTriangle,
  LogOut,
  XCircle,
  Eye,
  Inbox,
  X,
  Plus
} from 'lucide-react';

interface CampaignDetailsPanelProps {
  campaignId: string;
  onBack: () => void;
}

export function CampaignDetailsPanel({ campaignId, onBack }: CampaignDetailsPanelProps) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [replies, setReplies] = useState<EmailInboundMessageDTO[]>([]);
  const [selectedReply, setSelectedReply] = useState<EmailInboundMessageDTO | null>(null);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simFromEmail, setSimFromEmail] = useState('');
  const [simTextBody, setSimTextBody] = useState('');
  const [simSubmitting, setSimSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCampaign = async () => {
    try {
      const res = await fetchEmailCampaignById(campaignId);
      if (res.error) throw new Error(res.error);
      const dto = res.data;
      if (!dto) throw new Error('Campaign not found');

      // Load replies
      const repliesRes = await fetchCampaignInboundReplies(campaignId);
      if (repliesRes.data) {
        setReplies(repliesRes.data);
      }
      
      const formatDate = (dStr?: string) => dStr ? new Date(dStr).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : undefined;
      
      let status: Campaign['status'] = 'sent';
      const rawStatus = dto.status as string | undefined;
      if (rawStatus === 'DRAFT') status = 'draft';
      else if (rawStatus === 'SCHEDULED') status = 'scheduled';
      else if (rawStatus === 'SENDING') status = 'sending';
      else if (rawStatus === 'PAUSED') status = 'paused';
      else if (rawStatus === 'CANCELLED') status = 'cancelled';
      else if (rawStatus === 'COMPLETED') status = 'completed';
      else if (rawStatus === 'FAILED') status = 'failed';
      else if (rawStatus === 'UNKNOWN') status = 'unknown';
      else if (rawStatus === 'SENT') status = 'sent';

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
        uniqueRepliedCount: dto.uniqueRepliedCount || 0,
        totalReplyMessagesCount: dto.totalReplyMessagesCount || 0,
        replyRatePercentage: dto.replyRatePercentage || 0,
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
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaign();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  useEffect(() => {
    // Polling for active campaigns
    if (campaign && (campaign.status === 'sending')) {
      const interval = setInterval(() => {
        loadCampaign();
      }, 5000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {(campaign.status === 'sent' || campaign.status === 'completed' || campaign.status === 'sending' || campaign.status === 'paused' || campaign.status === 'cancelled') && (
        <div className="space-y-6">
          <h3 className="text-xs font-black text-primary-c uppercase tracking-widest pl-2">Engagement Funnel</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

            {/* Unique Replies */}
            <GlassCard className="p-6 relative overflow-hidden group hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
               <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 group-hover:rotate-12 transition-all duration-500">
                 <MessageSquare className="h-32 w-32 text-indigo-500" />
               </div>
               <div className="relative z-10">
                 <div className="flex items-center justify-between mb-6">
                   <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center ring-1 ring-indigo-500/20">
                     <MessageSquare className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                   </div>
                   <div className="flex items-center gap-1.5 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20">
                     <span className="text-sm font-black text-indigo-700 dark:text-indigo-400 tabular-nums">{campaign.replyRatePercentage || 0}%</span>
                     <span className="text-[10px] font-bold text-indigo-600/70 dark:text-indigo-400/70 uppercase">Rate</span>
                   </div>
                 </div>
                 <p className="text-[10px] font-black text-secondary-c uppercase tracking-widest mb-2">Unique Replies</p>
                 <div className="flex items-baseline gap-2">
                   <p className="text-5xl font-black text-primary-c tabular-nums tracking-tighter">{campaign.uniqueRepliedCount || 0}</p>
                 </div>
                 <p className="text-xs font-bold text-muted-c mt-3">{campaign.totalReplyMessagesCount || 0} total reply message{campaign.totalReplyMessagesCount === 1 ? '' : 's'} received</p>
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

          {/* Customer Email Replies List Section */}
          <GlassCard className="p-6 sm:p-8 mt-8 border-indigo-500/20 ring-1 ring-indigo-500/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-primary-c uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-500" />
                Customer Email Replies ({replies.length})
              </h3>
              <button
                onClick={() => setShowSimulateModal(true)}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Simulate Test Reply
              </button>
            </div>

            {replies.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-indigo-500/5 rounded-2xl border border-dashed border-indigo-500/20">
                <Inbox className="h-10 w-10 text-indigo-400 mb-3" />
                <p className="text-sm font-bold text-primary-c">No Email Replies Recorded Yet</p>
                <p className="text-xs text-secondary-c mt-1 max-w-md">When recipients reply to this campaign, their responses will automatically appear here with full thread details.</p>
              </div>
            ) : (
              <div className="divide-y divide-base-c rounded-xl border border-base-c overflow-hidden">
                {replies.map((reply) => (
                  <div key={reply.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/50 dark:hover:bg-ink-800/50 transition-colors">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-primary-c truncate">{reply.fromEmail}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          {reply.attributionStatus}
                        </span>
                        {reply.sentiment && reply.sentiment !== 'NEUTRAL' && (
                          <span className={cx(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                            reply.sentiment === 'GOOD' ? 'bg-success-500/10 text-success-600 dark:text-success-400 border-success-500/20' :
                            'bg-danger-500/10 text-danger-600 dark:text-danger-400 border-danger-500/20'
                          )}>
                            {reply.sentiment}
                          </span>
                        )}
                        {reply.sentiment === 'NEUTRAL' && (
                           <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20">
                             NEUTRAL
                           </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-secondary-c truncate">{reply.subject || 'Re: Campaign Reply'}</p>
                      <p className="text-xs text-muted-c line-clamp-2 italic">"{reply.replySnippet || reply.textBody || 'No text snippet'}"</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <span className="text-[11px] font-medium text-muted-c">
                        {new Date(reply.receivedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={() => setSelectedReply(reply)}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Message
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* Full Reply Viewer Modal */}
      {selectedReply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <GlassCard className="relative w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden p-6 sm:p-8 shadow-2xl border-indigo-500/30">
            <button
              onClick={() => setSelectedReply(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-secondary-c hover:bg-base-c transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                <MessageSquare className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-bold text-primary-c truncate">{selectedReply.fromEmail}</h4>
                <p className="text-xs text-muted-c">{new Date(selectedReply.receivedAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="border-t border-b border-base-c py-3 mb-4 space-y-1">
              <p className="text-xs font-bold text-secondary-c"><span className="text-muted-c font-normal">Subject:</span> {selectedReply.subject || 'No Subject'}</p>
              <p className="text-xs font-bold text-secondary-c"><span className="text-muted-c font-normal">Provider:</span> {selectedReply.provider} ({selectedReply.providerMessageId})</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="bg-slate-50 dark:bg-ink-950 p-4 rounded-xl border border-base-c font-mono text-xs text-primary-c whitespace-pre-wrap leading-relaxed">
                {selectedReply.textBody || selectedReply.replySnippet || 'No text content.'}
              </div>

              {selectedReply.htmlBody && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-c uppercase tracking-wider">HTML View</p>
                  <div 
                    className="bg-white p-4 rounded-xl border border-base-c text-sm text-slate-800 overflow-x-auto max-h-60"
                    dangerouslySetInnerHTML={{ __html: selectedReply.htmlBody }}
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedReply(null)}
                className="px-4 py-2 rounded-xl bg-primary-500 text-white font-bold text-xs hover:bg-primary-600 transition-all"
              >
                Close
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Simulate Test Inbound Reply Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <GlassCard className="relative w-full max-w-lg p-6 sm:p-8 shadow-2xl border-indigo-500/30 space-y-4">
            <button
              onClick={() => setShowSimulateModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-secondary-c hover:bg-base-c transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                <MessageSquare className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <h4 className="text-base font-bold text-primary-c">Simulate Inbound Email Reply</h4>
                <p className="text-xs text-muted-c">Test attribution and reply ingestion directly for this campaign</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-bold text-secondary-c mb-1 block">Sender Email (Customer Address)</label>
                <input
                  type="email"
                  placeholder="customer@company.com"
                  value={simFromEmail}
                  onChange={(e) => setSimFromEmail(e.target.value)}
                  className="form-input text-xs w-full"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-secondary-c mb-1 block">Reply Message Text</label>
                <textarea
                  rows={4}
                  placeholder="Hi, I am interested in this offer! Please send me more details."
                  value={simTextBody}
                  onChange={(e) => setSimTextBody(e.target.value)}
                  className="form-input text-xs w-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSimulateModal(false)}
                className="px-4 py-2 rounded-xl border border-base-c text-secondary-c text-xs font-bold hover:bg-base-c transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!simFromEmail.trim() || !simTextBody.trim() || simSubmitting}
                onClick={async () => {
                  if (!simFromEmail.trim() || !simTextBody.trim()) return;
                  setSimSubmitting(true);
                  const res = await simulateCampaignInboundReply(campaignId, simFromEmail.trim(), simTextBody.trim());
                  setSimSubmitting(false);
                  if (res.error) {
                    alert('Error: ' + res.error);
                  } else {
                    setShowSimulateModal(false);
                    setSimFromEmail('');
                    setSimTextBody('');
                    await loadCampaign();
                  }
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md"
              >
                {simSubmitting ? 'Submitting...' : 'Submit Test Reply'}
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
