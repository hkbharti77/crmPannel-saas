import { apiFetch } from './api';

export interface UserTeamMemberDTO {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  role: 'OWNER' | 'ADMIN' | 'AGENT';
  availabilityStatus?: 'ONLINE' | 'AWAY' | 'OFFLINE';
  accountStatus?: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  city?: string;
}

export interface AgentPerformanceDTO {
  agentId: string;
  displayName: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'AGENT';
  availabilityStatus?: 'ONLINE' | 'AWAY' | 'OFFLINE';
  avgResponseTimeMinutes: number;
  ticketResolutionRatePercent: number;
  totalDealsClosed: number;
  totalRevenueWon: number;
  activeAssignedWorkload: number;
}

export interface CreateStaffRequest {
  email: string;
  displayName: string;
  phone?: string;
  role: string; // 'ADMIN' | 'AGENT'
}

export async function fetchTeamMembers() {
  return apiFetch<UserTeamMemberDTO[]>('/api/v1/team/members');
}

export async function fetchTeamPerformance() {
  return apiFetch<AgentPerformanceDTO[]>('/api/v1/team/analytics/performance');
}

export async function inviteStaffUser(data: CreateStaffRequest) {
  return apiFetch<{ message?: string; id?: string }>('/api/v1/users/staff', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAgentAvailability(agentId: string, availabilityStatus: 'ONLINE' | 'AWAY' | 'OFFLINE') {
  return apiFetch<{ success: boolean; availabilityStatus: string }>(`/api/v1/team/members/${agentId}/availability`, {
    method: 'PATCH',
    body: JSON.stringify({ availabilityStatus }),
  });
}
