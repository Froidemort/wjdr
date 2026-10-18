import { Backpack, Hammer, Network, Sparkles, Star, type LucideIcon } from '@lucide/vue'

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
  {
    title: 'Compétences',
    description: 'Compétences de base et avancées, avec leurs talents liés.',
    icon: Hammer,
    to: '/compendium/skills',
  },
  {
    title: 'Talents',
    description: 'Aptitudes spéciales et leurs compétences associées.',
    icon: Star,
    to: '/compendium/talents',
  },
]
