import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent } from 'storybook/test'
import CareerGraphOptionsPanel from '../../components/career/CareerGraphOptionsPanel.vue'

const meta: Meta<typeof CareerGraphOptionsPanel> = {
  title: 'Career/CareerGraphOptionsPanel',
  component: CareerGraphOptionsPanel,
  tags: ['autodocs'],
  args: {
    careers: [
      { id: 'c-1', name: 'Apprenti sorcier' },
      { id: 'c-2', name: 'Sorcier' },
    ],
    mode: 'chemin',
    start: '',
    end: '',
    noPathFound: false,
    onReset: fn(),
  },
}

export default meta
type Story = StoryObj<typeof CareerGraphOptionsPanel>

export const PathMode: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('group', { name: 'Départ' })).toBeVisible()
    await expect(canvas.getByRole('group', { name: 'Arrivée' })).toBeVisible()
  },
}

export const TowardMode: Story = {
  args: { mode: 'vers' },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('group', { name: 'Départ' })).toBeNull()
    await expect(canvas.getByRole('group', { name: 'Arrivée' })).toBeVisible()
  },
}

export const FromMode: Story = {
  args: { mode: 'depuis' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('group', { name: 'Départ' })).toBeVisible()
    await expect(canvas.queryByRole('group', { name: 'Arrivée' })).toBeNull()
  },
}

export const NoPathFound: Story = {
  args: { noPathFound: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent('Aucun chemin possible')
  },
}

export const ResetEmitsEvent: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Réinitialiser' }))
    await expect(args.onReset).toHaveBeenCalled()
  },
}
