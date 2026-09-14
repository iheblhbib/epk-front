import { Check, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useWorkspaceOnboarding } from '@/features/workspaces/hooks/useWorkspaces'
import type { WorkspaceOnboarding } from '@/types'

const STEPS: { key: keyof WorkspaceOnboarding; labelKey: string; href: string }[] = [
  { key: 'create_artist', labelKey: 'dashboard.onboarding.steps.createArtist', href: '/artists' },
  { key: 'create_epk', labelKey: 'dashboard.onboarding.steps.createEpk', href: '/epks' },
  { key: 'customize_logo', labelKey: 'dashboard.onboarding.steps.customizeLogo', href: '/settings' },
  { key: 'invite_member', labelKey: 'dashboard.onboarding.steps.inviteMember', href: '/team' },
  { key: 'publish_epk', labelKey: 'dashboard.onboarding.steps.publishEpk', href: '/epks' },
]

function dismissedKey(workspaceId: number): string {
  return `koraxx:onboarding-dismissed:${workspaceId}`
}

export function OnboardingChecklist({ workspaceId }: { workspaceId: number }) {
  const { t } = useTranslation()
  const { data } = useWorkspaceOnboarding(workspaceId)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(dismissedKey(workspaceId)) === 'true')
  const [collapsed, setCollapsed] = useState(false)

  if (!data || dismissed) return null

  const doneCount = STEPS.filter((step) => data[step.key]).length
  if (doneCount === STEPS.length) return null

  const handleDismiss = () => {
    localStorage.setItem(dismissedKey(workspaceId), 'true')
    setDismissed(true)
  }

  return (
    <div className="fixed bottom-4 end-4 z-40 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-lg">
      <div className="flex items-center justify-between gap-2 px-4 pt-3.5">
        <h2 className="font-heading text-sm font-semibold text-foreground">{t('dashboard.onboarding.title')}</h2>
        <div className="-me-1.5 flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={collapsed ? t('common.expand') : t('common.collapse')}
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={t('dashboard.onboarding.dismiss')} onClick={handleDismiss}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div
        role="progressbar"
        aria-label={t('dashboard.onboarding.title')}
        aria-valuenow={doneCount}
        aria-valuemin={0}
        aria-valuemax={STEPS.length}
        className="mx-4 mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(doneCount / STEPS.length) * 100}%` }}
        />
      </div>

      {!collapsed && (
        <div className="space-y-0.5 px-2.5 py-3">
          {STEPS.map((step) => {
            const done = data[step.key]

            return (
              <div key={step.key} className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5">
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${done ? 'border-primary bg-primary text-primary-foreground' : 'border-input'}`}
                >
                  {done && <Check className="size-3" />}
                </span>
                {done ? (
                  <span className="text-sm text-muted-foreground line-through">{t(step.labelKey)}</span>
                ) : (
                  <Link to={step.href} className="text-sm text-foreground hover:underline">
                    {t(step.labelKey)}
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
