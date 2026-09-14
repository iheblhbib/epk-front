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
      add_contact: false,
      upload_media: false,
      create_private_link: false,
      setup_custom_domain: false,
      view_analytics: false,
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

  it('shows a progress bar reflecting completed steps across all 10 steps', async () => {
    server.use(http.get(`${API_URL}/api/workspaces/1/onboarding`, () => HttpResponse.json(onboardingResponse())))
    renderChecklist()

    const progressbar = await screen.findByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '0')
    expect(progressbar).toHaveAttribute('aria-valuemax', '10')
  })

  it('lists all three group headers', async () => {
    server.use(http.get(`${API_URL}/api/workspaces/1/onboarding`, () => HttpResponse.json(onboardingResponse())))
    renderChecklist()

    await screen.findByRole('progressbar')
    expect(screen.getByText(/set up your workspace/i)).toBeInTheDocument()
    expect(screen.getByText(/create your first epk/i)).toBeInTheDocument()
    expect(screen.getByText(/share and track your results/i)).toBeInTheDocument()
  })

  it('opens the first group with an incomplete step by default, keeping the others collapsed', async () => {
    server.use(http.get(`${API_URL}/api/workspaces/1/onboarding`, () => HttpResponse.json(onboardingResponse())))
    renderChecklist()

    await screen.findByRole('progressbar')
    expect(screen.getByText(/customize your workspace logo/i)).toBeInTheDocument()
    expect(screen.queryByText(/upload a media file/i)).not.toBeInTheDocument()
  })

  it('auto-advances the open group once every step in it is complete, and strikes through its header', async () => {
    server.use(
      http.get(`${API_URL}/api/workspaces/1/onboarding`, () =>
        HttpResponse.json(onboardingResponse({ customize_logo: true, invite_member: true, add_contact: true }))
      )
    )
    renderChecklist()

    await screen.findByRole('progressbar')
    expect(screen.getByText(/upload a media file/i)).toBeInTheDocument()
    expect(screen.queryByText(/customize your workspace logo/i)).not.toBeInTheDocument()
    expect(screen.getByText(/set up your workspace/i)).toHaveClass('line-through')
  })

  it('opens a different group when its header is clicked, closing the previously open one', async () => {
    server.use(http.get(`${API_URL}/api/workspaces/1/onboarding`, () => HttpResponse.json(onboardingResponse())))
    const user = userEvent.setup()
    renderChecklist()

    await screen.findByRole('progressbar')
    await user.click(screen.getByRole('button', { name: /share and track your results/i }))

    expect(screen.getByText(/create a private share link/i)).toBeInTheDocument()
    expect(screen.queryByText(/customize your workspace logo/i)).not.toBeInTheDocument()
  })

  it('shows a completed step with a done state and does not link it', async () => {
    server.use(
      http.get(`${API_URL}/api/workspaces/1/onboarding`, () =>
        HttpResponse.json(onboardingResponse({ customize_logo: true }))
      )
    )
    renderChecklist()

    await waitFor(() => expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1'))
    expect(screen.queryByRole('link', { name: /customize your workspace logo/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /invite a team member/i })).toHaveAttribute('href', '/team')
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
            add_contact: true,
            upload_media: true,
            create_private_link: true,
            setup_custom_domain: true,
            view_analytics: true,
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
