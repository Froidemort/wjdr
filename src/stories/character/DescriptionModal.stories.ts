import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, screen, userEvent } from 'storybook/test'
import DescriptionModal from '../../components/character/DescriptionModal.vue'
import { openedDialog } from './openedDialog'

const meta: Meta<typeof DescriptionModal> = {
  title: 'Character/DescriptionModal',
  component: openedDialog(DescriptionModal) as typeof DescriptionModal,
  tags: ['autodocs'],
  args: { title: 'Corde', content: 'Dix mètres de corde de chanvre.', onClose: fn() },
}

export default meta
type Story = StoryObj<typeof DescriptionModal>

export const Default: Story = {
  play: async ({ args }) => {
    await expect(await screen.findByRole('heading', { name: 'Corde' })).toBeVisible()
    await expect(screen.getByText('Dix mètres de corde de chanvre.')).toBeVisible()

    await userEvent.click(screen.getAllByRole('button', { name: 'Fermer' })[0] as HTMLElement)

    await expect(args.onClose).toHaveBeenCalled()
  },
}

export const Empty: Story = {
  args: { title: null, content: null },
  play: async () => {
    await expect(await screen.findByRole('heading', { name: 'Description' })).toBeVisible()
    await expect(screen.getByText('Aucune description.')).toBeVisible()
  },
}

export const DialogIsLabelledByTitle: Story = {
  play: async () => {
    await expect(await screen.findByRole('dialog', { name: 'Corde' })).toBeVisible()
  },
}
