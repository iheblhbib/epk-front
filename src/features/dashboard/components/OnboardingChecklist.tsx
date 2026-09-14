import { Check, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useWorkspaceOnboarding } from '@/features/workspaces/hooks/useWorkspaces'
import { cn } from '@/lib/utils'
import type { WorkspaceOnboarding } from '@/types'

type Step = { key: keyof WorkspaceOnboarding; labelKey: string; href: string }

const GROUPS: { key: string; labelKey: string; steps: Step[] }[] = [
  {
    key: 'workspaceSetup',
    labelKey: 'dashboard.onboarding.groups.workspaceSetup',
    steps: [
      { key: 'customize_logo', labelKey: 'dashboard.onboarding.steps.customizeLogo', href: '/settings' },
      { key: 'invite_member', labelKey: 'dashboard.onboarding.steps.inviteMember', href: '/team' },
      { key: 'add_contact', labelKey: 'dashboard.onboarding.steps.addContact', href: '/contacts' },
    ],
  },
  {
    key: 'createEpk',
    labelKey: 'dashboard.onboarding.groups.createEpk',
    steps: [
      { key: 'create_artist', labelKey: 'dashboard.onboarding.steps.createArtist', href: '/artists' },
      { key: 'create_epk', labelKey: 'dashboard.onboarding.steps.createEpk', href: '/epks' },
      { key: 'upload_media', labelKey: 'dashboard.onboarding.steps.uploadMedia', href: '/media' },
      { key: 'publish_epk', labelKey: 'dashboard.onboarding.steps.publishEpk', href: '/epks' },
    ],
  },
  {
    key: 'shareAndGrow',
    labelKey: 'dashboard.onboarding.groups.shareAndGrow',
    steps: [
      { key: 'create_private_link', labelKey: 'dashboard.onboarding.steps.createPrivateLink', href: '/epks' },
      { key: 'setup_custom_domain', labelKey: 'dashboard.onboarding.steps.setupCustomDomain', href: '/epks' },
      { key: 'view_analytics', labelKey: 'dashboard.onboarding.steps.viewAnalytics', href: '/analytics' },
    ],
  },
]

const ALL_STEPS = GROUPS.flatMap((group) => group.steps)

function dismissedKey(workspaceId: number): string {
  return `koraxx:onboarding-dismissed:${workspaceId}`
}

function groupIsDone(data: WorkspaceOnboarding, group: (typeof GROUPS)[number]): boolean {
  return group.steps.every((step) => data[step.key])
}

export function OnboardingChecklist({ workspaceId }: { workspaceId: number }) {
  const { t } = useTranslation()
  const { data } = useWorkspaceOnboarding(workspaceId)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(dismissedKey(workspaceId)) === 'true')
  const [collapsed, setCollapsed] = useState(false)
  const [openGroupOverride, setOpenGroupOverride] = useState<string | null>(null)

  if (!data || dismissed) return null

  const doneCount = ALL_STEPS.filter((step) => data[step.key]).length
  if (doneCount === ALL_STEPS.length) return null

  const handleDismiss = () => {
    localStorage.setItem(dismissedKey(workspaceId), 'true')
    setDismissed(true)
  }

  const firstIncompleteGroupKey = GROUPS.find((group) => !groupIsDone(data, group))?.key ?? GROUPS[0].key
  const openGroupKey = openGroupOverride ?? firstIncompleteGroupKey

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
        aria-valuemax={ALL_STEPS.length}
        className="mx-4 mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(doneCount / ALL_STEPS.length) * 100}%` }}
        />
      </div>

      {!collapsed && (
        <div className="py-2">
          {GROUPS.map((group) => {
            const done = groupIsDone(data, group)
            const isOpen = group.key === openGroupKey

            return (
              <div key={group.key} className="border-b border-border last:border-b-0">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenGroupOverride(group.key)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-start"
                >
                  <span className={cn('text-sm font-medium', done ? 'text-muted-foreground line-through' : 'text-foreground')}>
                    {t(group.labelKey)}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="size-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                </button>

                {isOpen && (
                  <div className="space-y-0.5 bg-muted/40 px-2.5 pb-2.5">
                    {group.steps.map((step) => {
                      const stepDone = data[step.key]

                      return (
                        <div key={step.key} className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5">
                          <span
                            className={cn(
                              'flex size-5 shrink-0 items-center justify-center rounded-full',
                              stepDone ? 'bg-primary text-primary-foreground' : 'bg-border'
                            )}
                          >
                            {stepDone && <Check className="size-3" />}
                          </span>
                          {stepDone ? (
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
          })}
        </div>
      )}
    </div>
  )
}
