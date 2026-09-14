import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { useCreatePrivateLink } from '@/features/epks/hooks/usePrivateLinks'
import { useWorkspaceOnboarding } from '@/features/workspaces/hooks/useWorkspaces'
import { server } from '@/test/server'

const API_URL = 'http://localhost:8000'

describe('useCreatePrivateLink', () => {
  it('refreshes the workspace onboarding checklist once a private link is created, even though the mutation only knows the epk id', async () => {
    let onboardingCalls = 0
    server.use(
      http.post(`${API_URL}/api/epks/7/private-links`, () =>
        HttpResponse.json(
          {
            data: {
              id: 1,
              label: null,
              private_url: 'https://app.koraxx.fr/private/abc123',
              requires_password: false,
              expires_at: null,
              revoked_at: null,
              is_active: true,
              view_count: 0,
              last_viewed_at: null,
              created_at: '2026-09-14T00:00:00.000000Z',
            },
          },
          { status: 201 }
        )
      ),
      http.get(`${API_URL}/api/workspaces/1/onboarding`, () => {
        onboardingCalls++
        const createPrivateLinkDone = onboardingCalls > 1
        return HttpResponse.json({
          data: {
            create_artist: false,
            create_epk: false,
            customize_logo: false,
            invite_member: false,
            publish_epk: false,
            add_contact: false,
            upload_media: false,
            create_private_link: createPrivateLinkDone,
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
    await waitFor(() => expect(onboarding.current.data?.create_private_link).toBe(false))

    const { result: createPrivateLink } = renderHook(() => useCreatePrivateLink(7), { wrapper })
    createPrivateLink.current.mutate({})

    await waitFor(() => expect(onboarding.current.data?.create_private_link).toBe(true))
  })
})
