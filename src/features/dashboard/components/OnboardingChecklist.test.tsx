import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { OnboardingChecklist } from '@/features/dashboard/components/OnboardingChecklist'
import { server } from '@/test/server'

const API_URL = 'http://localhost:8000'

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

function renderChecklist() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <OnboardingChecklist workspaceId={1} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('OnboardingChecklist', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows a progress bar reflecting completed steps and lists all 5 steps', async () => {
    server.use(http.get(`${API_URL}/api/workspaces/1/onboarding`, () => HttpResponse.json(onboardingResponse())))
    renderChecklist()

    const progressbar = await screen.findByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '0')
    expect(progressbar).toHaveAttribute('aria-valuemax', '5')
    expect(screen.getByText(/create your first artist/i)).toBeInTheDocument()
    expect(screen.getByText(/create your first epk/i)).toBeInTheDocument()
    expect(screen.getByText(/customize your workspace logo/i)).toBeInTheDocument()
    expect(screen.getByText(/invite a team member/i)).toBeInTheDocument()
    expect(screen.getByText(/publish your epk/i)).toBeInTheDocument()
  })

  it('shows completed steps with a done state and does not link them', async () => {
    server.use(
      http.get(`${API_URL}/api/workspaces/1/onboarding`, () =>
        HttpResponse.json(onboardingResponse({ create_artist: true }))
      )
    )
    renderChecklist()

    await waitFor(() => expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1'))
    expect(screen.queryByRole('link', { name: /create your first artist/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create your first epk/i })).toHaveAttribute('href', '/epks')
  })

  it('renders nothing once all steps are complete', async () => {
    server.use(
      http.get(`${API_URL}/api/workspaces/1/onboarding`, () =>
        HttpResponse.json(
          onboardingResponse({
            create_artist: true,
            create_epk: true,
            customize_logo: true,
            invite_member: true,
            publish_epk: true,
          })
        )
      )
    )
    const { container } = renderChecklist()

    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })

  it('renders nothing once dismissed, and remembers the dismissal', async () => {
    server.use(http.get(`${API_URL}/api/workspaces/1/onboarding`, () => HttpResponse.json(onboardingResponse())))
    const user = userEvent.setup()
    const { container } = renderChecklist()

    await screen.findByRole('progressbar')
    await user.click(screen.getByRole('button', { name: /dismiss/i }))

    await waitFor(() => expect(container).toBeEmptyDOMElement())
    expect(localStorage.getItem('koraxx:onboarding-dismissed:1')).toBe('true')
  })
})
