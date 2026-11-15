import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent } from 'storybook/test'
import CharacteristicCard from '../../components/ui/CharacteristicCard.vue'
import type { CharacterStatValue } from '../../types/domain'
import type { LinkedTalentDetail } from '../../utils/characterTalentReminders'

const stat: CharacterStatValue = {
  statCode: 'F',
  baseValue: 30,
  currentAdvanced: 5,
  totalAdvanced: 10,
  isSecondary: false,
}

const meta: Meta<typeof CharacteristicCard> = {
  title: 'Character/CharacteristicCard',
  component: CharacteristicCard,
  tags: ['autodocs'],
  args: {
    stat,
    editable: false,
    expanded: false,
    onToggle: fn(),
    'onTick-up': fn(),
    'onTick-down': fn(),
    'onUpdate-base': fn(),
    'onUpdate-total-advanced': fn(),
  },
}

export default meta
type Story = StoryObj<typeof CharacteristicCard>

export const Compact: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('F')).toBeVisible()
    await expect(canvas.getByText('35')).toBeVisible()
    await expect(canvas.queryByText('Valeur totale')).toBeNull()
  },
}

export const CompactClickEmitsToggle: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Afficher le détail/ }))
    await expect(args.onToggle).toHaveBeenCalledOnce()
  },
}

export const ExpandedReadOnly: Story = {
  args: { expanded: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Valeur totale')).toBeVisible()
    await expect(canvas.getByText('35')).toBeVisible()
    await expect(canvas.queryByLabelText('Valeur de base')).toBeNull()
  },
}

export const ExpandedTitleClickEmitsToggle: Story = {
  args: { expanded: true },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'F' }))
    await expect(args.onToggle).toHaveBeenCalledOnce()
  },
}

export const ExpandedBodyClickEmitsToggle: Story = {
  args: { expanded: true },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByText('Valeur totale'))
    await expect(args.onToggle).toHaveBeenCalledOnce()
  },
}

export const ExpandedEditableTicksByFive: Story = {
  args: { expanded: true, editable: true },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Augmenter l'avancement/ }))
    await expect(args['onTick-up']).toHaveBeenCalledWith({ statCode: 'F', step: 5 })

    await userEvent.click(canvas.getByRole('button', { name: /Diminuer l'avancement/ }))
    await expect(args['onTick-down']).toHaveBeenCalledWith({ statCode: 'F', step: 5 })

    // Clicking a control inside the expanded card must not also collapse it.
    await expect(args.onToggle).not.toHaveBeenCalled()
  },
}

export const ExpandedEditableSecondaryTicksByOne: Story = {
  args: { expanded: true, editable: true, stat: { ...stat, statCode: 'A', isSecondary: true } },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: /Augmenter l'avancement/ }))
    await expect(args['onTick-up']).toHaveBeenCalledWith({ statCode: 'A', step: 1 })
  },
}

export const WithLinkedTalentBadge: Story = {
  args: {
    expanded: true,
    linkedTalents: [
      { id: 'audition', name: 'Acuité auditive', description: 'Perception des sons +20%' } satisfies LinkedTalentDetail,
    ],
  },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole('button', { name: '1 talent lié à F' })).toBeVisible()

    await userEvent.click(canvas.getByRole('button', { name: /talent/ }))
    await expect(args.onToggle).not.toHaveBeenCalled()
  },
}

export const ExpandedWithLinkedTalentBadge: Story = {
  args: {
    expanded: true,
    linkedTalents: [
      { id: 'audition', name: 'Acuité auditive', description: 'Perception des sons +20%' } satisfies LinkedTalentDetail,
    ],
  },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole('button', { name: '1 talent lié à F' })).toBeVisible()

    // The badge sits inside the expanded <article>, so clicking it must not toggle the card.
    await userEvent.click(canvas.getByRole('button', { name: /talent/ }))
    await expect(args.onToggle).not.toHaveBeenCalled()
  },
}

export const ExpandedEditableBaseValueChange: Story = {
  args: { expanded: true, editable: true },
  play: async ({ canvas, args }) => {
    const input = canvas.getByLabelText('Valeur de base')
    await userEvent.clear(input)
    await userEvent.type(input, '35')
    await userEvent.tab()

    await expect(args['onUpdate-base']).toHaveBeenCalledWith({ statCode: 'F', baseValue: 35 })
  },
}
