import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { AdminPaymentsPage } from '@/features/admin/pages/AdminPaymentsPage'
import { server } from '@/test/server'

const API_URL = 'http://localhost:8000'

function paymentsResponse() {
  return {
    data: [
      {
        id: 1,
        workspace: { id: 1, name: 'Acme Records' },
        status: 'paid',
        amount: 4900,
        amount_refunded: 0,
        currency: 'usd',
        hosted_invoice_url: 'https://invoice.stripe.com/i/test',
        invoice_created_at: '2026-01-01T00:00:00.000000Z',
      },
    ],
    meta: { current_page: 1, last_page: 1, total: 1 },
  }
}

function renderPage() {
  server.use(http.get(`${API_URL}/api/admin/payments`, () => HttpResponse.json(paymentsResponse())))
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminPaymentsPage />
    </QueryClientProvider>
  )
}

describe('AdminPaymentsPage', () => {
  it('lists payments with workspace name, amount, and status', async () => {
    renderPage()

    expect(await screen.findByText('Acme Records')).toBeInTheDocument()
    // Intl.NumberFormat(undefined, ...) follows the runtime's default
    // locale (real users see their own), so compute the same way rather
    // than hardcoding an en-US-shaped string. Some locales (e.g. fr-FR)
    // separate the symbol with a non-breaking space -- normalize it the
    // same way RTL's default text normalizer does to the DOM text, since
    // getByText only normalizes the node's text, not the query string.
    const expectedAmount = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' })
      .format(49)
      .replace(/\s+/g, ' ')
    expect(screen.getByText(expectedAmount)).toBeInTheDocument()
  })

  it('links to the hosted invoice', async () => {
    renderPage()

    const link = await screen.findByRole('link', { name: /view invoice/i })
    expect(link).toHaveAttribute('href', 'https://invoice.stripe.com/i/test')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('searches by workspace name', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Acme Records')

    // Registered after renderPage() (which registers its own GET handler
    // internally) so this one — the most recently added — wins for every
    // request from here on, per MSW's handler resolution order.
    let capturedSearch: string | null = null
    server.use(
      http.get(`${API_URL}/api/admin/payments`, ({ request }) => {
        capturedSearch = new URL(request.url).searchParams.get('search')
        return HttpResponse.json(paymentsResponse())
      })
    )

    await user.type(screen.getByPlaceholderText(/search/i), 'acme')

    await waitFor(() => expect(capturedSearch).toBe('acme'))
  })

  it('filters by status', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Acme Records')

    let capturedStatus: string | null = null
    server.use(
      http.get(`${API_URL}/api/admin/payments`, ({ request }) => {
        capturedStatus = new URL(request.url).searchParams.get('status')
        return HttpResponse.json(paymentsResponse())
      })
    )

    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: /failed/i }))

    await waitFor(() => expect(capturedStatus).toBe('failed'))
  })
})
