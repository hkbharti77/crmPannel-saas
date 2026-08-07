import { apiFetch } from './api';

export type PipelineStageCountDTO = {
  stageName: string;
  count: number;
  color: string;
};

export type RevenueReportDTO = {
  totalPipelineValue: number;
  receivedRevenue: number;
  pendingRevenue: number;
  totalDeals: number;
  paidDeals: number;
  pendingDeals: number;
  currency: string;
};

export type ActivityLogDTO = {
  id: string;
  // Activity detail
  activityType?: string;
  source?: string;
  summary?: string;
  // Actor info
  ownerName?: string;
  ownerEmail?: string;
  // Contact info
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  // Timestamp
  createdAt?: string;
  // Legacy fields (kept for backwards compat)
  action?: string;
  actorName?: string;
  description?: string;
};

export type DashboardMeetingDTO = {
  id: string;
  title?: string;
  date?: string;
  time?: string;
  dateTime?: string;
  contactName?: string;
  status?: string;
  meetingLink?: string;
  isBooking?: boolean;
};

export type DashboardAggregateDTO = {
  totalLeads: number;
  openTickets: number;
  closedLeads: number;
  todayMeetings: number;
  pipeline: PipelineStageCountDTO[];
  revenueReport?: RevenueReportDTO;
  recentActivity: ActivityLogDTO[];
  todayMeetingsList: DashboardMeetingDTO[];
  upcomingMeetingsList: DashboardMeetingDTO[];
};

export async function fetchDashboardAggregate(): Promise<{ data: DashboardAggregateDTO | null; error: string | null }> {
  const res = await apiFetch<DashboardAggregateDTO>('/api/v1/dashboard/aggregate');
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}
