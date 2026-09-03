import { Hammer, NotebookPen, Scroll, type LucideIcon } from '@lucide/vue'

export interface HomePillar {
  numeral: string
  title: string
  description: string
  icon: LucideIcon
  toBeDone: boolean
}

/** Piliers affichés dans la section d'accueil non-authentifiée. */
export const homePillars: readonly HomePillar[] = [
  {
    numeral: 'I',
    title: 'Campagnes',
    description:
      'Gestion des campagnes, sessions et personnages pour le MJ et les joueurs. Création de notes de campagnes.',
    icon: Scroll,
    toBeDone: false,
  },
  {
    numeral: 'II',
    title: 'Outils de jeu',
    description:
      'Outils pour le MJ et les joueurs : diagramme de carrières, carte du Vieux Monde interactive, ...',
    icon: Hammer,
    toBeDone: true,
  },
  {
    numeral: 'III',
    title: 'Règles et ressources',
    description:
      'Base de connaissance et de ressources : talents, compétences, objets, sorts...',
    icon: NotebookPen,
    toBeDone: true,
  },
] as const
