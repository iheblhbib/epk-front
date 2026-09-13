import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { AdminWorkspacesPage } from '@/features/admin/pages/AdminWorkspacesPage'
import { server } from '@/test/server'

const API_URL = 'http://localhost:8000'

function workspacesResponse(status: string, accessEndsAt: string | null = null) {
  return {
    data: [
      {
        id: 1,
        name: 'Acme Records',
        slug: 'acme-records',
        members_count: 3,
        epks_count: 2,
        plan: 'pro',
        subscription_status: status,
        access_ends_at: accessEndsAt,
        creator: { id: 1, name: 'Ada Lovelace' },
        created_at: '2026-01-01T00:00:00.000000Z',
      },
    ],
    meta: { current_page: 1, last_page: 1, total: 1 },
  }
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminWorkspacesPage />
    </QueryClientProvider>
  )
}

describe('AdminWorkspacesPage', () => {
  it('shows the subscription status for each workspace', async () => {
    server.use(http.get(`${API_URL}/api/admin/workspaces`, () => HttpResponse.json(workspacesResponse('active'))))

    renderPage()

    expect(await screen.findByText('Active')).toBeInTheDocument()
  })

  it('shows a canceled workspace with a distinct destructive-styled badge', async () => {
    server.use(http.get(`${API_URL}/api/admin/workspaces`, () => HttpResponse.json(workspacesResponse('canceled'))))

    renderPage()

    const badge = await screen.findByText('Canceled')
    expect(badge.className).toMatch(/destructive/)
  })

  it('shows the access-ends-at date in the expiration input when present', async () => {
    server.use(
      http.get(`${API_URL}/api/admin/workspaces`, () =>
        HttpResponse.json(workspacesResponse('trialing', '2026-02-14T00:00:00.000000Z'))
      )
    )

    renderPage()

    const input = (await screen.findByLabelText(/^access expiration$/i)) as HTMLInputElement
    expect(input.value).toBe('2026-02-14')
  })

  it('leaves the expiration input empty when the field is null', async () => {
    server.use(http.get(`${API_URL}/api/admin/workspaces`, () => HttpResponse.json(workspacesResponse('active', null))))

    renderPage()

    const input = (await screen.findByLabelText(/^access expiration$/i)) as HTMLInputElement
    await screen.findByText('Active')
    expect(input.value).toBe('')
  })

  it('updates the expiration when a new date is entered', async () => {
    let patchedBody: unknown = null
    server.use(
      http.get(`${API_URL}/api/admin/workspaces`, () => HttpResponse.json(workspacesResponse('active', null))),
      http.patch(`${API_URL}/api/admin/workspaces/1/expiration`, async ({ request }) => {
        patchedBody = await request.json()
        return HttpResponse.json({ data: { id: 1, access_ends_at: '2026-03-01T00:00:00.000000Z' } })
      })
    )
    const user = userEvent.setup()
    renderPage()

    const input = (await screen.findByLabelText(/^access expiration$/i)) as HTMLInputElement
    await user.clear(input)
    await user.type(input, '2026-03-01')
    await user.tab()

    await waitFor(() => expect(patchedBody).toEqual({ admin_access_until: '2026-03-01' }))
  })

  it('clears the expiration when the clear button is clicked', async () => {
    let patchedBody: unknown = null
    server.use(
      http.get(`${API_URL}/api/admin/workspaces`, () =>
        HttpResponse.json(workspacesResponse('active', '2026-02-14T00:00:00.000000Z'))
      ),
      http.patch(`${API_URL}/api/admin/workspaces/1/expiration`, async ({ request }) => {
        patchedBody = await request.json()
        return HttpResponse.json({ data: { id: 1, access_ends_at: null } })
      })
    )
    const user = userEvent.setup()
    renderPage()

    await screen.findByLabelText(/^access expiration$/i)
    await user.click(screen.getByRole('button', { name: /clear expiration/i }))

    await waitFor(() => expect(patchedBody).toEqual({ admin_access_until: null }))
  })
})
