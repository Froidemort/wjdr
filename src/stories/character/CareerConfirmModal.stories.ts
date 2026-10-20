import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, screen, userEvent } from 'storybook/test'
import CareerConfirmModal from '../../components/character/CareerConfirmModal.vue'
import { openedDialog } from './openedDialog'

const meta: Meta<typeof CareerConfirmModal> = {
  title: 'Character/CareerConfirmModal',
  component: openedDialog(CareerConfirmModal) as typeof CareerConfirmModal,
  tags: ['autodocs'],
  args: {
    careerName: 'Soldat',
    rows: [
      { statCode: 'CC', value: 10 },
      { statCode: 'CT', value: 5 },
    ],
    error: null,
    busy: false,
    onClose: fn(),
    onApply: fn(),
  },
}

export default meta
type Story = StoryObj<typeof CareerConfirmModal>

export const ApplyProfile: Story = {
  play: async ({ args }) => {
    await expect(await screen.findByRole('heading', { name: 'Appliquer le profil de carrière' })).toBeVisible()
    await expect(screen.getByText('Soldat')).toBeVisible()
    await expect(screen.getByText('CC')).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: 'Appliquer' }))

    await expect(args.onApply).toHaveBeenCalledWith(true)
  },
}

export const SkipProfile: Story = {
  play: async ({ args }) => {
    await userEvent.click(await screen.findByRole('button', { name: 'Ne pas appliquer' }))

    await expect(args.onApply).toHaveBeenCalledWith(false)
  },
}

export const Cancel: Story = {
  play: async ({ args }) => {
    await userEvent.click(await screen.findByRole('button', { name: 'Annuler' }))

    await expect(args.onClose).toHaveBeenCalled()
    await expect(args.onApply).not.toHaveBeenCalled()
  },
}

export const WithError: Story = {
  args: { error: 'Impossible de changer de carrière.' },
  play: async () => {
    await expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de changer de carrière.')
  },
}

export const Busy: Story = {
  args: { busy: true },
  play: async () => {
    await screen.findByRole('dialog')
    await expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled()
    await expect(screen.getByRole('button', { name: 'Appliquer' })).toBeDisabled()
    await expect(screen.getByRole('button', { name: 'Ne pas appliquer' })).toBeDisabled()
  },
}
