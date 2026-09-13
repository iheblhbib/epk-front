import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteAdminEpk,
  deleteAdminUser,
  deleteAdminWorkspace,
  getAdminActivity,
  getAdminStats,
  listAdminEpks,
  listAdminUsers,
  listAdminWorkspaces,
  listAuditLogs,
  unpublishAdminEpk,
  updateAdminEpk,
  updateAdminUser,
  updateAdminWorkspaceExpiration,
  updateAdminWorkspacePlan,
} from '@/api/admin'
import type { EpkStatus, SubscriptionPlan, UserRole } from '@/types'

export function useAdminStats() {
  return useQuery({ queryKey: ['admin', 'stats'], queryFn: getAdminStats })
}

export function useAdminActivity() {
  return useQuery({ queryKey: ['admin', 'activity'], queryFn: getAdminActivity })
}

export function useAdminUsers(params: { search?: string; page?: number }) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => listAdminUsers(params),
    placeholderData: keepPreviousData,
  })
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: { role?: UserRole; suspended?: boolean } }) =>
      updateAdminUser(userId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export function useAdminWorkspaces(params: { search?: string; page?: number }) {
  return useQuery({
    queryKey: ['admin', 'workspaces', params],
    queryFn: () => listAdminWorkspaces(params),
    placeholderData: keepPreviousData,
  })
}

export function useDeleteAdminWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAdminWorkspace,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'workspaces'] }),
  })
}

export function useUpdateAdminWorkspacePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ workspaceId, plan }: { workspaceId: number; plan: SubscriptionPlan }) =>
      updateAdminWorkspacePlan(workspaceId, plan),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'workspaces'] }),
  })
}

export function useUpdateAdminWorkspaceExpiration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ workspaceId, adminAccessUntil }: { workspaceId: number; adminAccessUntil: string | null }) =>
      updateAdminWorkspaceExpiration(workspaceId, adminAccessUntil),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'workspaces'] }),
  })
}

export function useAdminEpks(params: { search?: string; status?: EpkStatus; page?: number }) {
  return useQuery({
    queryKey: ['admin', 'epks', params],
    queryFn: () => listAdminEpks(params),
    placeholderData: keepPreviousData,
  })
}

export function useUnpublishAdminEpk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: unpublishAdminEpk,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'epks'] }),
  })
}

export function useUpdateAdminEpk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ epkId, payload }: { epkId: number; payload: { title?: string; status?: EpkStatus } }) =>
      updateAdminEpk(epkId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'epks'] }),
  })
}

export function useDeleteAdminEpk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAdminEpk,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'epks'] }),
  })
}

export function useAuditLogs(params: { action?: string; page?: number }) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', params],
    queryFn: () => listAuditLogs(params),
    placeholderData: keepPreviousData,
  })
}
