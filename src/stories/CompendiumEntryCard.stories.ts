import type { Meta, StoryObj } from '@storybook/vue3-vite'
import CompendiumEntryCard from '../components/ui/CompendiumEntryCard.vue'

const meta: Meta<typeof CompendiumEntryCard> = {
  title: 'Components/CompendiumEntryCard',
  component: CompendiumEntryCard,
  tags: ['autodocs'],
}

export default meta

export const Weapon: StoryObj<typeof CompendiumEntryCard> = {
  args: {
    title: 'Épée',
    encumbrance: 100,
    highlight: { label: 'Dégâts', value: 'BF+4' },
    badges: ['Équilibrée', 'Parade'],
    description: 'Une lame courte et fiable.',
  },
}

export const ArmorLongDescription: StoryObj<typeof CompendiumEntryCard> = {
  args: {
    title: 'Cotte de mailles',
    encumbrance: 200,
    highlight: { label: 'Points d\'armure', value: '2' },
    badges: ['maille', 'corps', 'bras'],
    description: 'Une armure de mailles entrelacées qui protège le torse et les bras contre les coups tranchants. '.repeat(3),
  },
}
