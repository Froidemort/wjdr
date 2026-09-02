import { BookOpenText, Scroll, Users, type LucideIcon } from '@lucide/vue'
import campaignsImage from '../assets/images/home-campaigns.webp'
import charactersImage from '../assets/images/home-characters.webp'
import compendiumImage from '../assets/images/home-compendium.webp'

export interface HomeFeature {
  numeral: string
  title: string
  description: string
  icon: LucideIcon
  image: string
  cta: string
  /** Primary entry point: rendered as a wide banner above the secondary cards. */
  featured?: boolean
  /** Omitted while the section is not shipped yet, which renders the card as inert. */
  to?: string
}

export const homeFeatures: readonly HomeFeature[] = [
  {
    numeral: 'I',
    title: 'Gestion de campagne',
    description:
      'Orchestrez vos tables, suivez la chronologie de vos sessions et consignez vos notes de partie.',
    icon: Scroll,
    image: campaignsImage,
    cta: 'Ouvrir mes campagnes',
    featured: true,
    to: '/campaigns',
  },
  {
    numeral: 'II',
    title: 'Fiches interactives',
    description:
      'Créez et modifiez vos héros en temps réel : caractéristiques, carrières, équipement et blessures.',
    icon: Users,
    image: charactersImage,
    cta: 'Ouvrir mes personnages',
    to: '/characters',
  },
  {
    numeral: 'III',
    title: 'Compendium',
    description:
      'Consultez règles, sorts, talents et objets du Vieux Monde dans une encyclopédie unifiée.',
    icon: BookOpenText,
    image: compendiumImage,
    cta: 'Bientôt disponible',
  },
]
