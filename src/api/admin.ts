import { apiClient } from '@/api/client'
import type {
  AdminActivityEntry,
  AdminEpk,
  AdminStats,
  AdminUser,
  AdminWorkspace,
  ApiPaginated,
  ApiResource,
  AuditLogEntry,
  EpkStatus,
  SubscriptionPlan,
  UserRole,
} from '@/types'

export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await apiClient.get<ApiResource<AdminStats>>('/api/admin/stats')
  return data.data
}

export async function getAdminActivity(): Promise<AdminActivityEntry[]> {
  const { data } = await apiClient.get<ApiResource<AdminActivityEntry[]>>('/api/admin/activity')
  return data.data
}

export async function listAdminUsers(params: { search?: string; page?: number }): Promise<ApiPaginated<AdminUser>> {
  const { data } = await apiClient.get<ApiPaginated<AdminUser>>('/api/admin/users', { params })
  return data
}

export async function updateAdminUser(
  userId: number,
  payload: { role?: UserRole; suspended?: boolean }
): Promise<AdminUser> {
  const { data } = await apiClient.patch<ApiResource<AdminUser>>(`/api/admin/users/${userId}`, payload)
  return data.data
}

export async function deleteAdminUser(userId: number): Promise<void> {
  await apiClient.delete(`/api/admin/users/${userId}`)
}

export async function listAdminWorkspaces(params: {
  search?: string
  page?: number
}): Promise<ApiPaginated<AdminWorkspace>> {
  const { data } = await apiClient.get<ApiPaginated<AdminWorkspace>>('/api/admin/workspaces', { params })
  return data
}

export async function deleteAdminWorkspace(workspaceId: number): Promise<void> {
  await apiClient.delete(`/api/admin/workspaces/${workspaceId}`)
}

export async function updateAdminWorkspacePlan(workspaceId: number, plan: SubscriptionPlan): Promise<void> {
  await apiClient.patch(`/api/admin/workspaces/${workspaceId}/subscription`, { plan })
}

export async function updateAdminWorkspaceExpiration(workspaceId: number, adminAccessUntil: string | null): Promise<void> {
  await apiClient.patch(`/api/admin/workspaces/${workspaceId}/expiration`, { admin_access_until: adminAccessUntil })
}

export async function listAdminEpks(params: {
  search?: string
  status?: EpkStatus
  page?: number
}): Promise<ApiPaginated<AdminEpk>> {
  const { data } = await apiClient.get<ApiPaginated<AdminEpk>>('/api/admin/epks', { params })
  return data
}

export async function unpublishAdminEpk(epkId: number): Promise<void> {
  await apiClient.post(`/api/admin/epks/${epkId}/unpublish`)
}

export async function updateAdminEpk(
  epkId: number,
  payload: { title?: string; status?: EpkStatus }
): Promise<void> {
  await apiClient.patch(`/api/admin/epks/${epkId}`, payload)
}

export async function deleteAdminEpk(epkId: number): Promise<void> {
  await apiClient.delete(`/api/admin/epks/${epkId}`)
}

export async function listAuditLogs(params: { action?: string; page?: number }): Promise<ApiPaginated<AuditLogEntry>> {
  const { data } = await apiClient.get<ApiPaginated<AuditLogEntry>>('/api/admin/audit-logs', { params })
  return data
}
