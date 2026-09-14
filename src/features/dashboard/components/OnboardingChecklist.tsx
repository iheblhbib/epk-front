import { Check, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-base font-semibold text-foreground">{t('dashboard.onboarding.title')}</h2>
          <span className="text-sm text-muted-foreground">
            {doneCount}/{STEPS.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
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
      </CardHeader>
      {!collapsed && (
        <CardContent className="space-y-1">
          {STEPS.map((step) => {
            const done = data[step.key]

            return (
              <div key={step.key} className="flex items-center gap-2.5 py-1">
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
        </CardContent>
      )}
    </Card>
  )
}
