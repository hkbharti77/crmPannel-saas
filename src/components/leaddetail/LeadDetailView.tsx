import { useState, useEffect, useCallback } from 'react';
import { GlassCard, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { LeadDetailHeader } from './LeadDetailHeader';
import { ActivityTimeline, NotesPanel, FilesPanel } from './DetailTabs';
import {
  fetchLeadById,
  fetchLeadNotes,
  createLeadNote,
  deleteLeadNote,
  fetchLeadAttachments,
  uploadLeadAttachment,
  deleteLeadAttachment,
  fetchLeadActivities,
  logCallActivity,
  reassignLeadOwner,
  recalculateLeadScore,
  updateLeadStatus,
  type LeadDTO,
  type LeadNoteDTO,
  type LeadAttachmentDTO,
  type LeadActivityDTO,
} from '@/lib/leadsApi';
import { fetchTeamMembers, type UserTeamMemberDTO } from '@/lib/teamApi';
import { createAppointment } from '@/lib/appointmentsApi';
import { createBooking } from '@/lib/bookingsApi';
import {
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  UserCheck,
  Radio,
  Sparkles,
  Clock,
  Activity as ActivityIcon,
  StickyNote,
  FolderOpen,
  X,
  Loader2,
  CalendarPlus,
  Users,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

type TabId = 'timeline' | 'notes' | 'files';

import { useParams, useNavigate, useLocation } from 'react-router-dom';

export function LeadDetailView() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const leadObj = routerLocation.state?.leadObj;
  const onBack = () => navigate('/pipeline');
  const [tab, setTab] = useState<TabId>('timeline');
  const [lead, setLead] = useState<LeadDTO | null>(leadObj || null);
  const [loading, setLoading] = useState(false);

  const [notes, setNotes] = useState<LeadNoteDTO[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);

  const [attachments, setAttachments] = useState<LeadAttachmentDTO[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);

  const [activities, setActivities] = useState<LeadActivityDTO[]>([]);

  // Modals
  const [showBookModal, setShowBookModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const activeLeadId = lead?.id || leadId;

  const loadData = useCallback(async () => {
    if (!activeLeadId || !activeLeadId.includes('-')) return;

    setLoading(true);
    const { data } = await fetchLeadById(activeLeadId);
    setLoading(false);
    if (data) setLead(data);

    // Notes
    setNotesLoading(true);
    fetchLeadNotes(activeLeadId).then((res) => {
      setNotesLoading(false);
      if (res.data?.content) setNotes(res.data.content);
    });

    // Attachments
    setAttachmentsLoading(true);
    fetchLeadAttachments(activeLeadId).then((res) => {
      setAttachmentsLoading(false);
      if (res.data?.content) setAttachments(res.data.content);
    });

    // Activities
    fetchLeadActivities(activeLeadId).then((res) => {
      if (res.data?.content) setActivities(res.data.content);
    });
  }, [activeLeadId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const phone = lead?.contact?.phone || lead?.contact?.waId || leadObj?.phone || 'N/A';
  const email = lead?.contact?.email || leadObj?.email || 'N/A';
  const location = lead?.contact?.source || 'N/A';
  const budget = lead?.dealValue ? `₹${lead.dealValue}` : 'Not specified';
  const enquiries = lead?.enquiries || [];
  const firstEnquiry = enquiries[0];
  const interest = firstEnquiry?.requirement || firstEnquiry?.serviceCategory || lead?.dealLabel || 'General Inquiry';
  const source = lead?.contact?.source || leadObj?.source || 'WhatsApp Ingress';
  const assignedTo = lead?.ownerName || leadObj?.assignedTo || 'Unassigned';
  const createdAtStr = lead?.createdAtHuman || 'Recently';
  const lastActivityStr = lead?.lastActivity ? new Date(lead.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently';
  const dealValueStr = lead?.dealValue ? `₹${lead.dealValue}` : '₹0';
  const currentScore = lead?.score != null ? lead.score : Math.min(95, 50 + enquiries.length * 15);
  const priority = currentScore >= 70 ? 'HIGH' : currentScore >= 40 ? 'MEDIUM' : 'LOW';
  const sentiment = currentScore >= 70 ? 'Positive' : currentScore >= 40 ? 'Neutral' : 'Needs Attention';
  const leadQuality = currentScore >= 70
    ? { label: 'GREEN', color: 'bg-success-500', text: 'High Intent & Engagement' }
    : currentScore >= 40
    ? { label: 'YELLOW', color: 'bg-warning-500', text: 'Moderate Engagement' }
    : { label: 'RED', color: 'bg-danger-500', text: 'Low Engagement' };

  // Note actions
  const handleAddNote = async (text: string) => {
    if (!activeLeadId) return;
    const res = await createLeadNote(activeLeadId, text);
    if (res.data) {
      setNotes((prev) => [res.data!, ...prev]);
      // Refresh activities
      fetchLeadActivities(activeLeadId).then((aRes) => {
        if (aRes.data?.content) setActivities(aRes.data.content);
      });
    } else if (res.error) {
      alert(`Failed to add note: ${res.error}`);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!activeLeadId) return;
    const res = await deleteLeadNote(activeLeadId, noteId);
    if (!res.error) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } else {
      alert(`Failed to delete note: ${res.error}`);
    }
  };

  // Attachment actions
  const handleUploadFile = async (file: File) => {
    if (!activeLeadId) return;
    const res = await uploadLeadAttachment(activeLeadId, file);
    if (res.data) {
      setAttachments((prev) => [res.data!, ...prev]);
      // Refresh activities
      fetchLeadActivities(activeLeadId).then((aRes) => {
        if (aRes.data?.content) setActivities(aRes.data.content);
      });
    } else if (res.error) {
      throw new Error(res.error);
    }
  };

  const handleDeleteFile = async (attachmentId: string) => {
    if (!activeLeadId) return;
    const res = await deleteLeadAttachment(activeLeadId, attachmentId);
    if (!res.error) {
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } else {
      alert(`Failed to delete attachment: ${res.error}`);
    }
  };

  // Quick Actions
  const handleCall = () => {
    if (!activeLeadId) return;
    logCallActivity(activeLeadId).then(() => {
      fetchLeadActivities(activeLeadId).then((aRes) => {
        if (aRes.data?.content) setActivities(aRes.data.content);
      });
    });
    if (phone && phone !== 'N/A') {
      window.location.href = `tel:${phone}`;
    }
  };

  const [rescoring, setRescoring] = useState(false);

  // Stage action
  const handleStageChange = async (newStage: string) => {
    if (!activeLeadId) return;
    const { data, error } = await updateLeadStatus(activeLeadId, newStage);
    if (data) {
      setLead(data);
      fetchLeadActivities(activeLeadId).then((aRes) => {
        if (aRes.data?.content) setActivities(aRes.data.content);
      });
    } else if (error) {
      alert(`Failed to update stage: ${error}`);
    }
  };

  const handleRecalculateScore = async () => {
    if (!activeLeadId) return;
    setRescoring(true);
    const { data, error } = await recalculateLeadScore(activeLeadId);
    setRescoring(false);
    if (data) {
      setLead((prev) => (prev ? { ...prev, score: data.totalScore } : null));
    } else if (error) {
      alert(`Failed to recalculate AI score: ${error}`);
    }
  };

  const tabs: { id: TabId; label: string; icon: typeof ActivityIcon; count?: number }[] = [
    { id: 'timeline', label: 'Timeline', icon: ActivityIcon, count: enquiries.length + activities.length },
    { id: 'notes', label: 'Notes', icon: StickyNote, count: notes.length },
    { id: 'files', label: 'Files', icon: FolderOpen, count: attachments.length },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 lg:p-6">
      <LeadDetailHeader
        lead={lead}
        onBack={onBack}
        onCall={handleCall}
        onBook={() => setShowBookModal(true)}
        onAssign={() => setShowAssignModal(true)}
        onStageChange={handleStageChange}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        {/* Left: tabbed content */}
        <div className="space-y-4">
          {/* Tab bar */}
          <div className="flex items-center gap-1.5 rounded-xl2 border border-base-c bg-card-c p-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cx(
                    'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all',
                    active
                      ? 'bg-gradient-accent text-white shadow-soft'
                      : 'text-secondary-c hover:text-primary-c',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" /> {t.label}
                  {t.count !== undefined && (
                    <span className={cx(
                      'grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold',
                      active ? 'bg-white/25' : 'bg-slate-100 text-muted-c dark:bg-ink-800',
                    )}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <GlassCard className="p-5">
            {tab === 'timeline' && <ActivityTimeline enquiries={enquiries} activities={activities} />}
            {tab === 'notes' && (
              <NotesPanel
                notes={notes}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
                loading={notesLoading}
              />
            )}
            {tab === 'files' && (
              <FilesPanel
                files={attachments}
                onUploadFile={handleUploadFile}
                onDeleteFile={handleDeleteFile}
                loading={attachmentsLoading}
              />
            )}
          </GlassCard>
        </div>

        {/* Right: info sidebar */}
        <div className="space-y-4">
          {/* Lead info */}
          <GlassCard className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-primary-c">Lead Information</h3>
            <div className="space-y-3">
              <InfoRow icon={Phone} label="Phone" value={phone} />
              <InfoRow icon={Mail} label="Email" value={email} />
              <InfoRow icon={MapPin} label="Location" value={location} />
              <InfoRow icon={DollarSign} label="Budget" value={budget} />
              <InfoRow icon={Target} label="Interest" value={interest} />
              <InfoRow icon={Radio} label="Source" value={source} />
              <InfoRow icon={UserCheck} label="Assigned to" value={assignedTo} />
              <InfoRow icon={Calendar} label="Created" value={createdAtStr} />
              <InfoRow icon={Clock} label="Last activity" value={lastActivityStr} />
            </div>
          </GlassCard>

          {/* Deal value + priority */}
          <GlassCard className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-primary-c">Deal Metrics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl2 bg-gradient-accent-soft p-3">
                <span className="text-xs text-secondary-c">Deal Value</span>
                <span className="text-xl font-bold text-primary-c tabular-nums">{dealValueStr}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary-c">AI Lead Score</span>
                <span className="rounded-full bg-primary-500/15 px-2.5 py-0.5 text-xs font-bold text-primary-600 dark:text-primary-400">
                  {lead?.score != null ? lead.score : Math.min(95, 50 + enquiries.length * 15)} / 100
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary-c">Priority</span>
                <Badge variant={priority === 'HIGH' ? 'danger' : priority === 'MEDIUM' ? 'warning' : 'neutral'}>
                  {priority}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary-c">Sentiment</span>
                <Badge variant={currentScore >= 70 ? 'success' : currentScore >= 40 ? 'warning' : 'danger'}>
                  {sentiment}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary-c">Lead Quality</span>
                <div className="flex items-center gap-1.5" title={leadQuality.text}>
                  <span className={cx('h-2.5 w-2.5 rounded-full', leadQuality.color)} />
                  <span className="text-xs font-semibold text-primary-c">{leadQuality.label}</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* AI insights */}
          <GlassCard className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-secondary-600 dark:text-secondary-400" />
                <h3 className="text-sm font-semibold text-primary-c">AI Insights</h3>
              </div>
              <button
                onClick={handleRecalculateScore}
                disabled={rescoring}
                className="flex items-center gap-1 text-[10px] font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 disabled:opacity-50"
                title="Recalculate AI Lead Score via backend API"
              >
                <RefreshCw className={cx("h-3 w-3", rescoring && "animate-spin")} />
                {rescoring ? "Scoring..." : "Recalculate"}
              </button>
            </div>
            <div className="space-y-2.5">
              <InsightRow
                icon={Sparkles}
                label="AI Lead Score"
                value={`${lead?.score != null ? lead.score : Math.min(95, 50 + enquiries.length * 15)} / 100`}
                color="text-primary-600 dark:text-primary-400"
              />
              <InsightRow
                icon={TrendingUp}
                label="Conversion probability"
                value={lead?.score ? `${Math.min(99, Math.max(25, lead.score))}%` : `${Math.min(95, 45 + enquiries.length * 15)}%`}
                color="text-success-600 dark:text-success-400"
              />
              <InsightRow
                icon={Clock}
                label="Best time to call"
                value={lead?.score && lead.score > 70 ? '10-12 AM' : '2-4 PM'}
                color="text-primary-600 dark:text-primary-400"
              />
              <InsightRow
                icon={ActivityIcon}
                label="Engagement score"
                value={(lead?.score && lead.score >= 70) || enquiries.length > 2 ? 'High' : enquiries.length > 0 ? 'Medium' : 'Normal'}
                color="text-warning-600 dark:text-warning-400"
              />
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Book Appointment Modal */}
      {showBookModal && (
        <LeadBookingModal
          leadName={lead?.contact?.name || 'Lead'}
          leadEmail={email}
          leadPhone={phone}
          onClose={() => setShowBookModal(false)}
          onSuccess={() => {
            setShowBookModal(false);
            loadData();
          }}
        />
      )}

      {/* Reassign Lead Modal */}
      {showAssignModal && activeLeadId && (
        <ReassignLeadModal
          leadId={activeLeadId}
          currentAssigned={assignedTo}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            setShowAssignModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function LeadBookingModal({
  leadName,
  leadEmail,
  leadPhone,
  onClose,
  onSuccess,
}: {
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [service, setService] = useState('Site Visit');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [timeStr, setTimeStr] = useState('11:00 AM');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMsg(null);

    const [aptRes] = await Promise.all([
      createAppointment({
        customerName: leadName,
        customerEmail: leadEmail !== 'Not provided' ? leadEmail : undefined,
        customerPhone: leadPhone !== 'N/A' ? leadPhone : undefined,
        serviceCategory: service,
        appointmentDate: dateStr,
        timeSlot: timeStr,
        notes,
      }),
      createBooking({
        service,
        preferredSlot: `${dateStr} ${timeStr}`,
        notes: `Booked for ${leadName} (${leadPhone}): ${notes}`,
        source: 'CRM Panel',
      }),
    ]);

    setSubmitting(false);

    if (aptRes.data) {
      onSuccess();
    } else {
      setErrorMsg(aptRes.error || 'Failed to schedule appointment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-base-c bg-card-c p-5 shadow-soft-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-accent text-white">
              <CalendarPlus className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary-c">Schedule Appointment</h3>
              <p className="text-xs text-muted-c">Book a slot for {leadName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-muted-c hover:text-primary-c"><X className="h-4 w-4" /></button>
        </div>

        {errorMsg && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-danger-500/20 bg-danger-500/10 p-2.5 text-xs text-danger-600">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-3 text-xs">
          <div>
            <label className="mb-1 block font-medium text-secondary-c">Service Category</label>
            <select value={service} onChange={(e) => setService(e.target.value)} className="form-input">
              <option value="Site Visit">Site Visit</option>
              <option value="Consultation">Consultation</option>
              <option value="Property Valuation">Property Valuation</option>
              <option value="Documentation Walkthrough">Documentation Walkthrough</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-medium text-secondary-c">Date</label>
              <input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} className="form-input" />
            </div>
            <div>
              <label className="mb-1 block font-medium text-secondary-c">Time Slot</label>
              <input type="text" value={timeStr} onChange={(e) => setTimeStr(e.target.value)} placeholder="11:00 AM" className="form-input" />
            </div>
          </div>
          <div>
            <label className="mb-1 block font-medium text-secondary-c">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Add appointment notes..." className="form-input resize-none" />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-base-c px-3 py-1.5 text-xs font-medium text-secondary-c">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-4 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-105"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReassignLeadModal({
  leadId,
  currentAssigned,
  onClose,
  onSuccess,
}: {
  leadId: string;
  currentAssigned: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [members, setMembers] = useState<UserTeamMemberDTO[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamMembers().then((res) => {
      setLoading(false);
      if (res.data) setMembers(res.data);
    });
  }, []);

  const handleSubmit = async () => {
    if (!selectedAgentId) return;
    setSubmitting(true);
    setErrorMsg(null);

    const res = await reassignLeadOwner(leadId, selectedAgentId);
    setSubmitting(false);

    if (res.data) {
      onSuccess();
    } else {
      setErrorMsg(res.error || 'Failed to reassign lead. (Only Owners/Admins can reassign)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-base-c bg-card-c p-5 shadow-soft-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-accent text-white">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary-c">Reassign Lead Owner</h3>
              <p className="text-xs text-muted-c">Currently assigned to {currentAssigned}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-muted-c hover:text-primary-c"><X className="h-4 w-4" /></button>
        </div>

        {errorMsg && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-danger-500/20 bg-danger-500/10 p-2.5 text-xs text-danger-600">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            <label className="block font-medium text-secondary-c">Select Agent / Admin</label>
            <select value={selectedAgentId} onChange={(e) => setSelectedAgentId(e.target.value)} className="form-input">
              <option value="">Select Team Member...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName || m.email} ({m.role})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-base-c px-3 py-1.5 text-xs font-medium text-secondary-c">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!selectedAgentId || submitting}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-4 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-105 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirm Reassign'}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-c" />
      <span className="text-xs text-muted-c">{label}</span>
      <span className="ml-auto truncate text-right text-xs font-medium text-primary-c max-w-[150px]">{value}</span>
    </div>
  );
}

function InsightRow({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-slate-50 p-2.5 dark:bg-ink-850/60">
      <Icon className={cx('h-4 w-4 shrink-0', color)} />
      <span className="text-xs text-secondary-c">{label}</span>
      <span className="ml-auto text-xs font-bold text-primary-c">{value}</span>
    </div>
  );
}
