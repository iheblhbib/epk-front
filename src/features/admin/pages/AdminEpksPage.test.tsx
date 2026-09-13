import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { AdminEpksPage } from '@/features/admin/pages/AdminEpksPage'
import { server } from '@/test/server'

const API_URL = 'http://localhost:8000'

function epksResponse() {
  return {
    data: [
      {
        id: 1,
        title: 'Summer Tour EPK',
        slug: 'summer-tour',
        status: 'draft',
        workspace: { id: 1, name: 'Acme Records' },
        artist: { id: 1, name: 'Ada Lovelace' },
        published_at: null,
        created_at: '2026-01-01T00:00:00.000000Z',
      },
    ],
    meta: { current_page: 1, last_page: 1, total: 1 },
  }
}

function renderPage() {
  server.use(http.get(`${API_URL}/api/admin/epks`, () => HttpResponse.json(epksResponse())))
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminEpksPage />
    </QueryClientProvider>
  )
}

describe('AdminEpksPage', () => {
  it('edits the title on blur', async () => {
    let patchedBody: unknown = null
    server.use(
      http.patch(`${API_URL}/api/admin/epks/1`, async ({ request }) => {
        patchedBody = await request.json()
        return HttpResponse.json({ data: { id: 1, title: 'New Title', status: 'draft' } })
      })
    )
    const user = userEvent.setup()
    renderPage()

    const titleInput = await screen.findByDisplayValue('Summer Tour EPK')
    await user.clear(titleInput)
    await user.type(titleInput, 'New Title')
    await user.tab()

    await waitFor(() => expect(patchedBody).toEqual({ title: 'New Title' }))
  })

  it('changes the status via the select', async () => {
    let patchedBody: unknown = null
    server.use(
      http.patch(`${API_URL}/api/admin/epks/1`, async ({ request }) => {
        patchedBody = await request.json()
        return HttpResponse.json({ data: { id: 1, title: 'Summer Tour EPK', status: 'archived' } })
      })
    )
    const user = userEvent.setup()
    renderPage()

    await screen.findByDisplayValue('Summer Tour EPK')
    const comboboxes = screen.getAllByRole('combobox')
    await user.click(comboboxes[comboboxes.length - 1])
    await user.click(await screen.findByRole('option', { name: /archived/i }))

    await waitFor(() => expect(patchedBody).toEqual({ status: 'archived' }))
  })

  it('deletes an epk after confirming', async () => {
    let deleteCalled = false
    server.use(http.delete(`${API_URL}/api/admin/epks/1`, () => {
      deleteCalled = true
      return HttpResponse.json({ message: 'EPK deleted.' })
    }))
    const user = userEvent.setup()
    renderPage()

    await screen.findByDisplayValue('Summer Tour EPK')
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.click(await screen.findByRole('button', { name: /^delete$/i }))

    await waitFor(() => expect(deleteCalled).toBe(true))
  })
})
