import { BookOpenText, Scroll, Users, type LucideIcon } from '@lucide/vue'

export interface NavLink {
  label: string
  icon: LucideIcon
  /** Omitted while the section is not shipped yet, which renders the entry as inert. */
  to?: string
  /** Also shown to signed-out visitors. */
  public?: boolean
}

/** Centered navbar links — add entries here to extend main navigation. */
export const mainNavLinks: readonly NavLink[] = [
  { to: '/campaigns', label: 'Campagnes', icon: Scroll },
  { to: '/characters', label: 'Personnages', icon: Users },
  { to: '/compendium', label: 'Compendium', icon: BookOpenText, public: true },
]
