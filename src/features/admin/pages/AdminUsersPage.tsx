import { Search, ShieldCheck, ShieldOff, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { CardGridSkeleton } from '@/components/common/LoadingSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AdminPagination } from '@/features/admin/components/AdminPagination'
import { useAdminUsers, useDeleteAdminUser, useUpdateAdminUser } from '@/features/admin/hooks/useAdmin'
import { useAuth } from '@/providers/AuthProvider'
import type { AdminUser } from '@/types'

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { errors?: Record<string, string[]> } } }).response
    const firstError = response?.data?.errors ? Object.values(response.data.errors)[0]?.[0] : undefined
    if (firstError) return firstError
  }
  return fallback
}

function UserRow({ user }: { user: AdminUser }) {
  const { t } = useTranslation()
  const { user: currentUser } = useAuth()
  const updateUser = useUpdateAdminUser()
  const deleteUser = useDeleteAdminUser()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const isSelf = user.id === currentUser?.id
  const isSuspended = user.suspended_at !== null

  return (
    <TableRow>
      <TableCell className="font-medium text-foreground">
        {user.name}
        {isSelf && <span className="ms-1.5 text-xs text-muted-foreground">{t('admin.users.you')}</span>}
      </TableCell>
      <TableCell className="text-muted-foreground">{user.email}</TableCell>
      <TableCell>
        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
          {user.role === 'admin' ? t('admin.users.roleAdmin') : t('admin.users.roleUser')}
        </Badge>
      </TableCell>
      <TableCell>
        {isSuspended ? (
          <Badge variant="destructive">{t('admin.users.suspended')}</Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            {t('admin.users.active')}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-end">
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isSelf || updateUser.isPending}
            onClick={() =>
              updateUser.mutate(
                { userId: user.id, payload: { role: user.role === 'admin' ? 'user' : 'admin' } },
                { onError: () => toast.error(t('admin.users.roleUpdateError')) }
              )
            }
          >
            {user.role === 'admin' ? t('admin.users.revokeAdmin') : t('admin.users.makeAdmin')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isSelf || updateUser.isPending}
            onClick={() =>
              updateUser.mutate(
                { userId: user.id, payload: { suspended: !isSuspended } },
                { onError: () => toast.error(t('admin.users.updateError')) }
              )
            }
          >
            {isSuspended ? (
              <>
                <ShieldCheck className="size-4" />
                {t('admin.users.unsuspend')}
              </>
            ) : (
              <>
                <ShieldOff className="size-4" />
                {t('admin.users.suspend')}
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive"
            aria-label={t('admin.users.delete')}
            disabled={isSelf}
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </TableCell>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('admin.users.deleteConfirmTitle')}
        description={t('admin.users.deleteConfirmDescription', { name: user.name })}
        confirmLabel={t('common.delete')}
        destructive
        isLoading={deleteUser.isPending}
        onConfirm={() =>
          deleteUser.mutate(user.id, {
            onSuccess: () => {
              setConfirmOpen(false)
              toast.success(t('admin.users.deleted'))
            },
            onError: (error) => toast.error(extractErrorMessage(error, t('admin.users.deleteError'))),
          })
        }
      />
    </TableRow>
  )
}

export function AdminUsersPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useAdminUsers({ search: search || undefined, page })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">{t('admin.users.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.users.description')}</p>
      </div>

      <div className="relative w-full max-w-xs">
        <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('admin.users.searchPlaceholder')}
          className="ps-8"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
        />
      </div>

      {isLoading || !data ? (
        <CardGridSkeleton />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.users.columns.name')}</TableHead>
                  <TableHead>{t('admin.users.columns.email')}</TableHead>
                  <TableHead>{t('admin.users.columns.role')}</TableHead>
                  <TableHead>{t('admin.users.columns.status')}</TableHead>
                  <TableHead className="text-end">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((user) => (
                  <UserRow key={user.id} user={user} />
                ))}
              </TableBody>
            </Table>
          </div>
          <AdminPagination
            page={data.meta.current_page}
            lastPage={data.meta.last_page}
            total={data.meta.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
