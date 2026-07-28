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
  action: string;
  actorName?: string;
  description?: string;
  details?: string;
  createdAt?: string;
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
