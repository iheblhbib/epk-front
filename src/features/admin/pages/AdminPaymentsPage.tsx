import { ExternalLink, Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { CardGridSkeleton } from '@/components/common/LoadingSkeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AdminPagination } from '@/features/admin/components/AdminPagination'
import { useAdminPayments } from '@/features/admin/hooks/useAdmin'
import type { AdminPayment, PaymentStatus } from '@/types'

const STATUS_VARIANT: Record<PaymentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  paid: 'default',
  failed: 'destructive',
  void: 'outline',
  refunded: 'secondary',
}

function statusFilterItems(t: TFunction): Record<'all' | PaymentStatus, string> {
  return {
    all: t('admin.payments.allStatuses'),
    paid: t('admin.payments.statusLabels.paid'),
    failed: t('admin.payments.statusLabels.failed'),
    void: t('admin.payments.statusLabels.void'),
    refunded: t('admin.payments.statusLabels.refunded'),
  }
}

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100)
}

function PaymentRow({ payment }: { payment: AdminPayment }) {
  const { t } = useTranslation()

  return (
    <TableRow>
      <TableCell className="font-medium text-foreground">{payment.workspace?.name ?? '—'}</TableCell>
      <TableCell className="text-muted-foreground">
        {formatAmount(payment.amount, payment.currency)}
        {payment.status === 'refunded' && payment.amount_refunded > 0 && (
          <span className="ms-1.5 text-xs text-destructive">
            {t('admin.payments.refundedAmount', { amount: formatAmount(payment.amount_refunded, payment.currency) })}
          </span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={STATUS_VARIANT[payment.status]} className="capitalize">
          {t(`admin.payments.statusLabels.${payment.status}`)}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{new Date(payment.invoice_created_at).toLocaleDateString()}</TableCell>
      <TableCell className="text-end">
        {payment.hosted_invoice_url && (
          <a
            href={payment.hosted_invoice_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ExternalLink className="size-3.5" />
            {t('admin.payments.viewInvoice')}
          </a>
        )}
      </TableCell>
    </TableRow>
  )
}

export function AdminPaymentsPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | PaymentStatus>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useAdminPayments({
    search: search || undefined,
    status: status === 'all' ? undefined : status,
    from: from || undefined,
    to: to || undefined,
    page,
  })
  const filterItems = statusFilterItems(t)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">{t('admin.payments.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('admin.payments.description')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('admin.payments.searchPlaceholder')}
            className="ps-8"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
        </div>
        <Select
          items={filterItems}
          value={status}
          onValueChange={(value) => {
            setStatus(value as 'all' | PaymentStatus)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(filterItems).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          aria-label={t('admin.payments.fromDate')}
          value={from}
          onChange={(event) => {
            setFrom(event.target.value)
            setPage(1)
          }}
          className="w-40"
        />
        <Input
          type="date"
          aria-label={t('admin.payments.toDate')}
          value={to}
          onChange={(event) => {
            setTo(event.target.value)
            setPage(1)
          }}
          className="w-40"
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
                  <TableHead>{t('admin.payments.columns.workspace')}</TableHead>
                  <TableHead>{t('admin.payments.columns.amount')}</TableHead>
                  <TableHead>{t('admin.payments.columns.status')}</TableHead>
                  <TableHead>{t('admin.payments.columns.date')}</TableHead>
                  <TableHead className="text-end">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((payment) => (
                  <PaymentRow key={payment.id} payment={payment} />
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
