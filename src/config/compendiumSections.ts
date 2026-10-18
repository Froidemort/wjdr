import { Backpack, Network, Sparkles, type LucideIcon } from '@lucide/vue'

export interface CompendiumSection {
  title: string
  description: string
  icon: LucideIcon
  to: string
}

export const compendiumSections: readonly CompendiumSection[] = [
  {
    title: 'Inventaire',
    description: 'Armes, armures et équipements du Vieux Monde.',
    icon: Backpack,
    to: '/compendium/inventory',
  },
  {
    title: 'Carrières',
    description: 'Explorez les évolutions possibles d\'une carrière à l\'autre.',
    icon: Network,
    to: '/compendium/careers',
  },
  {
    title: 'Sorts',
    description: 'Magie et sortilèges, classés par domaine et difficulté.',
    icon: Sparkles,
    to: '/compendium/spells',
  },
]
