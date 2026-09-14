import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AuthProvider } from '@/providers/AuthProvider'
import { server } from '@/test/server'

const API_URL = 'http://localhost:8000'

const workspace = {
  id: 1,
  name: 'Acme Records',
  slug: 'acme-records',
  description: null,
  logo_url: null,
  my_role: 'owner',
  members_count: 1,
  created_at: '2026-01-01T00:00:00.000000Z',
  updated_at: '2026-01-01T00:00:00.000000Z',
}

function onboardingResponse(overrides: Partial<Record<string, boolean>> = {}) {
  return {
    data: {
      create_artist: false,
      create_epk: false,
      customize_logo: false,
      invite_member: false,
      publish_epk: false,
      ...overrides,
    },
  }
}

function mockBaseline() {
  server.use(
    http.get(`${API_URL}/api/user`, () =>
      HttpResponse.json({
        data: {
          id: 1,
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          role: 'user',
          avatar_url: null,
          email_verified_at: '2026-01-01T00:00:00.000000Z',
        },
      })
    ),
    http.get(`${API_URL}/api/workspaces`, () => HttpResponse.json({ data: [workspace] })),
    http.get(`${API_URL}/api/invitations`, () => HttpResponse.json({ data: [] })),
    http.get(`${API_URL}/api/notifications/unread-count`, () => HttpResponse.json({ count: 0 })),
    http.get(`${API_URL}/api/workspaces/1/onboarding`, () => HttpResponse.json(onboardingResponse()))
  )
}

function renderLayout(initialPath: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(
    [{ element: <DashboardLayout />, children: [{ path: '/epks', element: <p>EPKs page content</p> }] }],
    { initialEntries: [initialPath] }
  )
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  )
}

describe('DashboardLayout', () => {
  it('shows the onboarding checklist on a routed page other than the dashboard home', async () => {
    mockBaseline()
    renderLayout('/epks')

    expect(await screen.findByText('EPKs page content')).toBeInTheDocument()
    expect(await screen.findByRole('progressbar')).toBeInTheDocument()
  })
})
