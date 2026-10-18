import { Castle, Flag, MapPin, Skull, StickyNote, type LucideIcon } from '@lucide/vue'

const ICONS: Record<string, LucideIcon> = { Castle, Flag, MapPin, Skull, StickyNote }

/** Resolves the lucide icon name stored on a marker type, defaulting to a pin. */
export function resolveMarkerIcon(name: string | null): LucideIcon {
  return (name && ICONS[name]) || MapPin
}
