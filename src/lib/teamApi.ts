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
  permissions?: string[];
  permissionVersion?: number;
  dailyLeadLimit?: number;
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
  permissions?: string[];
}

export interface PermissionAuditLogDTO {
  id: string;
  tenantId: string;
  agentId: string;
  changedById: string;
  action: string;
  oldPermissions: string[];
  newPermissions: string[];
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  permissionVersion: number;
  createdAt: string;
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

export async function updateStaffRole(agentId: string, role: 'OWNER' | 'ADMIN' | 'AGENT') {
  return apiFetch<{ success: boolean; role: string }>(`/api/v1/users/staff/${agentId}/role?role=${role}`, {
    method: 'PATCH',
  });
}

export async function updateAgentPermissions(
  agentId: string,
  permissions: string[],
  expectedVersion?: number,
  reason?: string
) {
  return apiFetch<UserTeamMemberDTO>(`/api/v1/users/staff/${agentId}/permissions`, {
    method: 'PATCH',
    body: JSON.stringify({ permissions, expectedVersion, reason }),
  });
}

export async function fetchAgentPermissionAudits(agentId: string) {
  return apiFetch<PermissionAuditLogDTO[]>(`/api/v1/users/staff/${agentId}/permissions/audits`);
}

export async function updateAgentDailyLimit(agentId: string, limit: number | null) {
  const query = limit !== null ? `?limit=${limit}` : '';
  return apiFetch<{ success: boolean; dailyLeadLimit: number | string }>(`/api/v1/users/staff/${agentId}/daily-limit${query}`, {
    method: 'PATCH',
  });
}
