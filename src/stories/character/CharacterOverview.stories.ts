import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent } from 'storybook/test'
import CharacterOverview from '../../components/character/CharacterOverview.vue'
import type { CharacterArmor, CharacterItem, CharacterStatValue } from '../../types/domain'

const stat = (statCode: string, baseValue: number, currentAdvanced = 0): CharacterStatValue => ({
  statCode,
  baseValue,
  currentAdvanced,
  totalAdvanced: 0,
  isSecondary: false,
})

const armor: CharacterArmor = {
  id: 'a1',
  armorId: 'arm-1',
  name: 'Cotte de mailles',
  description: null,
  isEquipped: true,
  quality: 'normal',
  encumbrance: 200,
  armorPoints: 2,
}

const rope: CharacterItem = {
  id: 'i1',
  itemId: 'item-1',
  name: 'Corde',
  description: null,
  quality: 'normal',
  encumbrance: 10,
  quantity: 3,
}

const meta: Meta<typeof CharacterOverview> = {
  title: 'Character/CharacterOverview',
  component: CharacterOverview,
  tags: ['autodocs'],
  args: {
    race: 'humain',
    stats: [stat('F', 30, 5), stat('E', 28, 4)],
    armors: [armor],
    weapons: [],
    items: [rope],
    values: {
      pvMax: 12,
      pvCurrent: 8,
      fortuneMax: 3,
      fortuneCurrent: 2,
      destinyMax: 2,
      destinyCurrent: 1,
      xpTotal: 100,
      xpAvailable: 40,
      insanityPoints: 1,
      moneyGold: 0,
      moneySilver: 0,
      moneyCopper: 0,
    },
    editable: true,
    busy: false,
    'onQuick-change': fn(),
  },
}

export default meta
type Story = StoryObj<typeof CharacterOverview>

export const ShowsDerivedStats: Story = {
  play: async ({ canvas }) => {
    const bf = canvas.getByLabelText('Bonus de Force 3')
    const be = canvas.getByLabelText("Bonus d'Endurance 3")
    await expect(bf).toBeVisible()
    await expect(bf).toHaveTextContent('BF 3')
    await expect(bf).toHaveAttribute('title', 'Bonus de Force 3')
    await expect(be).toBeVisible()
    await expect(be).toHaveTextContent('BE 3')
    await expect(be).toHaveAttribute('title', "Bonus d'Endurance 3")
    await expect(canvas.getByRole('progressbar', { name: 'Encombrement 230 sur 350' })).toBeVisible()
    const encumbranceBox = canvas.getByText(/Force × 10/).closest('article')
    await expect(encumbranceBox).not.toBeNull()
    await expect(encumbranceBox).not.toHaveTextContent(/\bB[FE]\b/)
    await expect(canvas.getByRole('heading', { name: 'Armes et armures équipées' })).toBeVisible()
  },
}

export const DwarfDoublesMaxEncumbrance: Story = {
  args: { race: 'nain' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('progressbar', { name: 'Encombrement 230 sur 700' })).toBeVisible()
    await expect(canvas.getByText(/Force × 20/)).toBeVisible()
  },
}

export const Overloaded: Story = {
  args: { stats: [stat('F', 10), stat('E', 10)] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('230 / 100')).toHaveClass('text-error')
  },
}

export const QuickEditFortuneEmitsNewValue: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Fortune, point 3' }))
    await expect(args['onQuick-change']).toHaveBeenCalledWith('fortuneCurrent', 3)
  },
}

export const QuickEditDestinyEmitsNewValue: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Destin, point 2' }))
    await expect(args['onQuick-change']).toHaveBeenCalledWith('destinyCurrent', 2)
  },
}

export const QuickEditMaxFortuneEmitsNewValue: Story = {
  play: async ({ canvas, args }) => {
    const input = canvas.getByLabelText('Maximum de fortune')
    await userEvent.clear(input)
    await userEvent.type(input, '5')
    await userEvent.tab()
    await expect(args['onQuick-change']).toHaveBeenCalledWith('fortuneMax', 5)
  },
}

export const QuickEditHealthEmitsNewValue: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Augmenter les points de blessures' }))
    await expect(args['onQuick-change']).toHaveBeenCalledWith('pvCurrent', 9)
  },
}

export const ReadOnlyHasNoQuickEditControls: Story = {
  args: { editable: false },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: 'Fortune, point 1' })).toBeNull()
    await expect(canvas.queryByLabelText('Maximum de fortune')).toBeNull()
    await expect(canvas.queryByRole('button', { name: 'Augmenter les points de blessures' })).toBeNull()
  },
}
