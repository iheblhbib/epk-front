import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Topbar } from '@/components/layout/Topbar'
import { AuthProvider } from '@/providers/AuthProvider'
import { server } from '@/test/server'

const API_URL = 'http://localhost:8000'

function mockBaseline(avatarUrl: string | null) {
  server.use(
    http.get(`${API_URL}/api/user`, () =>
      HttpResponse.json({
        data: {
          id: 1,
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          role: 'user',
          avatar_url: avatarUrl,
          email_verified_at: '2026-01-01T00:00:00.000000Z',
        },
      })
    ),
    http.get(`${API_URL}/api/workspaces`, () => HttpResponse.json({ data: [] })),
    http.get(`${API_URL}/api/invitations`, () => HttpResponse.json({ data: [] })),
    http.get(`${API_URL}/api/notifications/unread-count`, () => HttpResponse.json({ count: 0 }))
  )
}

function renderTopbar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          <Topbar />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Topbar', () => {
  it('shows the real uploaded avatar photo when the user has one', async () => {
    mockBaseline('https://example.com/avatar.webp')
    renderTopbar()

    const trigger = await screen.findByRole('button', { name: 'Ada Lovelace' })
    expect(within(trigger).getByRole('img')).toHaveAttribute('src', 'https://example.com/avatar.webp')
  })

  it('falls back to initials when the user has no avatar', async () => {
    mockBaseline(null)
    renderTopbar()

    const trigger = await screen.findByRole('button', { name: 'Ada Lovelace' })
    expect(within(trigger).getByText('AL')).toBeInTheDocument()
    expect(within(trigger).queryByRole('img')).not.toBeInTheDocument()
  })
})
