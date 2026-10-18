import { BookOpenText, Scroll, Users, type LucideIcon } from '@lucide/vue'

/** Contextual shortcuts resolved from the user's current campaign. */
export interface NavContext {
  role: 'mj' | 'player' | null
  campaignTo: string | null
  characterTo: string | null
}

export type NavTarget = string | ((context: NavContext) => string)

export interface NavLink {
  label: string
  icon: LucideIcon
  /** Omitted while the section is not shipped yet, which renders the entry as inert. */
  to?: NavTarget
  /** Path prefix marking the link active when `to` is dynamic. Defaults to the resolved `to`. */
  activePrefix?: string
  /** Also shown to signed-out visitors. */
  public?: boolean
}

export function resolveNavTo(link: NavLink, context: NavContext): string | undefined {
  return typeof link.to === 'function' ? link.to(context) : link.to
}

/** Centered navbar links — add entries here to extend main navigation. */
export const mainNavLinks: readonly NavLink[] = [
  {
    to: (context) => context.campaignTo ?? '/campaigns',
    activePrefix: '/campaigns',
    label: 'Campagnes',
    icon: Scroll,
  },
  {
    to: (context) =>
      context.role === 'player' && context.characterTo ? context.characterTo : '/characters',
    activePrefix: '/characters',
    label: 'Personnages',
    icon: Users,
  },
  { to: '/compendium', label: 'Compendium', icon: BookOpenText, public: true },
]
