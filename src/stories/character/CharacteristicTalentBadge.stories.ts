import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent } from 'storybook/test'
import CharacteristicTalentBadge from '../../components/ui/CharacteristicTalentBadge.vue'
import type { LinkedTalentDetail } from '../../utils/characterTalentReminders'

const audition: LinkedTalentDetail = {
  id: 'audition',
  name: 'Acuité auditive',
  description: 'Perception des sons +20%',
}

const orientation: LinkedTalentDetail = {
  id: 'orientation',
  name: 'Sens de l’orientation (urbaine)',
  description: null,
}

const meta: Meta<typeof CharacteristicTalentBadge> = {
  title: 'Character/CharacteristicTalentBadge',
  component: CharacteristicTalentBadge,
  tags: ['autodocs'],
  args: {
    statCode: 'INT',
    talents: [audition],
  },
}

export default meta
type Story = StoryObj<typeof CharacteristicTalentBadge>

export const SingularLabel: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '1 talent lié' })).toBeVisible()
  },
}

export const PluralLabel: Story = {
  args: { talents: [audition, orientation] },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '2 talents liés' })).toBeVisible()
  },
}

export const ClickOpensPanel: Story = {
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: '1 talent lié' })
    await expect(button).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(button)

    await expect(button).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByText('Acuité auditive')).toBeVisible()
    await expect(canvas.getByText('Perception des sons +20%')).toBeVisible()
  },
}

export const EscapeClosesPanel: Story = {
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: '1 talent lié' })
    await userEvent.click(button)
    await expect(button).toHaveAttribute('aria-expanded', 'true')

    await userEvent.keyboard('{Escape}')

    await expect(button).toHaveAttribute('aria-expanded', 'false')
  },
}
