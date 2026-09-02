import { Scroll, Users, type LucideIcon } from '@lucide/vue'

export interface NavLink {
  to: string
  label: string
  icon: LucideIcon
}

/** Centered navbar links — add entries here to extend main navigation. */
export const mainNavLinks: readonly NavLink[] = [
  { to: '/campaigns', label: 'Campagnes', icon: Scroll },
  { to: '/characters', label: 'Personnages', icon: Users },
]
