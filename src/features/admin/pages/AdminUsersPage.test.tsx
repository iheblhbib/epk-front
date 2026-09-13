import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { Toaster } from '@/components/ui/sonner'
import { AdminUsersPage } from '@/features/admin/pages/AdminUsersPage'
import { AuthProvider } from '@/providers/AuthProvider'
import { server } from '@/test/server'

const API_URL = 'http://localhost:8000'

// jsdom doesn't implement matchMedia; sonner's Toaster (via next-themes) needs it to mount.
window.matchMedia =
  window.matchMedia ||
  ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }))

function usersResponse() {
  return {
    data: [
      { id: 2, name: 'Jane Doe', email: 'jane@example.com', role: 'user', suspended_at: null, created_at: '2026-01-01T00:00:00.000000Z' },
    ],
    meta: { current_page: 1, last_page: 1, total: 1 },
  }
}

function renderPage() {
  server.use(
    http.get(`${API_URL}/api/admin/users`, () => HttpResponse.json(usersResponse())),
    http.get(`${API_URL}/api/user`, () =>
      HttpResponse.json({
        data: { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin', email_verified_at: '2026-01-01T00:00:00.000000Z' },
      })
    )
  )
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminUsersPage />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  )
}

describe('AdminUsersPage', () => {
  it('deletes a user after confirming', async () => {
    let deleteCalled = false
    server.use(http.delete(`${API_URL}/api/admin/users/2`, () => {
      deleteCalled = true
      return HttpResponse.json({ message: 'User deleted.' })
    }))
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Jane Doe')
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.click(await screen.findByRole('button', { name: /^delete$/i }))

    await waitFor(() => expect(deleteCalled).toBe(true))
  })

  it('shows the servers block-reason message when deletion is refused', async () => {
    server.use(
      http.delete(`${API_URL}/api/admin/users/2`, () =>
        HttpResponse.json(
          { message: 'The given data was invalid.', errors: { user: ['This user is the sole owner of Solo Records — transfer ownership or delete the workspace first.'] } },
          { status: 422 }
        )
      )
    )
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Jane Doe')
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.click(await screen.findByRole('button', { name: /^delete$/i }))

    expect(await screen.findByText(/sole owner of Solo Records/i)).toBeInTheDocument()
  })
})
