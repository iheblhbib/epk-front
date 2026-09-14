import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { useCreateArtist } from '@/features/epks/hooks/useArtists'
import { useWorkspaceOnboarding } from '@/features/workspaces/hooks/useWorkspaces'
import { server } from '@/test/server'

const API_URL = 'http://localhost:8000'

describe('useCreateArtist', () => {
  it('refreshes the workspace onboarding checklist once an artist is created, without a page reload', async () => {
    let onboardingCalls = 0
    server.use(
      http.post(`${API_URL}/api/workspaces/1/artists`, () =>
        HttpResponse.json({ data: { id: 1, name: 'New Artist' } }, { status: 201 })
      ),
      http.get(`${API_URL}/api/workspaces/1/onboarding`, () => {
        onboardingCalls++
        const createArtistDone = onboardingCalls > 1
        return HttpResponse.json({
          data: {
            create_artist: createArtistDone,
            create_epk: false,
            customize_logo: false,
            invite_member: false,
            publish_epk: false,
            add_contact: false,
            upload_media: false,
            create_private_link: false,
            setup_custom_domain: false,
            view_analytics: false,
          },
        })
      })
    )

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    function wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }

    const { result: onboarding } = renderHook(() => useWorkspaceOnboarding(1), { wrapper })
    await waitFor(() => expect(onboarding.current.data?.create_artist).toBe(false))

    const { result: createArtist } = renderHook(() => useCreateArtist(1), { wrapper })
    createArtist.current.mutate({ name: 'New Artist' })

    await waitFor(() => expect(onboarding.current.data?.create_artist).toBe(true))
  })
})
