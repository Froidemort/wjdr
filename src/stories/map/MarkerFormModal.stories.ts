import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, screen, userEvent, waitFor } from 'storybook/test'
import { defineComponent, h, ref } from 'vue'
import MarkerFormModal from '../../components/map/MarkerFormModal.vue'
import type { MarkerVisibility } from '../../types/map'
import { campaignMarker, markerTypes } from './fixtures'

/** The modal only calls showModal() on an open transition, so open it after mount. */
const OpenedModal = defineComponent({
  props: {
    marker: { type: Object, default: null },
    visibilities: { type: Array, default: () => ['private'] },
    onSubmit: { type: Function, default: undefined },
    saving: { type: Boolean, default: false },
  },
  setup(props) {
    const open = ref(false)
    setTimeout(() => {
      open.value = true
    }, 0)
    return () =>
      h(MarkerFormModal, {
        open: open.value,
        types: markerTypes,
        visibilities: props.visibilities as MarkerVisibility[],
        marker: props.marker as never,
        position: { lat: 10.5, lng: 20.25 },
        saving: props.saving,
        onSubmit: props.onSubmit as never,
        onClose: () => {
          open.value = false
        },
      })
  },
})

const meta: Meta<typeof OpenedModal> = {
  title: 'Map/MarkerFormModal',
  component: OpenedModal,
  tags: ['autodocs'],
  args: { onSubmit: fn() },
}

export default meta
type Story = StoryObj<typeof OpenedModal>

export const NewMarkerAsPlayer: Story = {
  play: async ({ args }) => {
    const dialog = await screen.findByRole('dialog', { name: 'Nouveau marqueur' })
    await expect(dialog).toBeVisible()
    await expect(screen.getByLabelText('Visibilité')).toBeDisabled()

    await userEvent.type(screen.getByLabelText('Nom'), '  Tour de guet ')
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await expect(args.onSubmit).toHaveBeenCalledWith({
      typeId: 't-city',
      name: 'Tour de guet',
      description: null,
      lat: 10.5,
      lng: 20.25,
      visibility: 'private',
    })
  },
}

export const NameRequired: Story = {
  play: async ({ args }) => {
    await screen.findByRole('dialog', { name: 'Nouveau marqueur' })
    // `required` would block native submit, so drive the form submit directly.
    const form = screen.getByLabelText('Nom').closest('form')!
    form.noValidate = true
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await expect(screen.getByText('Le nom est requis.')).toBeVisible()
    await expect(args.onSubmit).not.toHaveBeenCalled()
  },
}

export const EditAsMj: Story = {
  args: { marker: campaignMarker, visibilities: ['private', 'mj', 'players'] },
  play: async ({ args }) => {
    await screen.findByRole('dialog', { name: 'Modifier le marqueur' })
    await expect(screen.getByLabelText('Nom')).toHaveValue('Cache du contrebandier')
    await expect(screen.getByLabelText('Visibilité')).toBeEnabled()

    await userEvent.selectOptions(screen.getByLabelText('Visibilité'), 'mj')
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() =>
      expect(args.onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Cache du contrebandier', visibility: 'mj' }))
    )
  },
}

export const Saving: Story = {
  args: { saving: true },
  play: async () => {
    await screen.findByRole('dialog', { name: 'Nouveau marqueur' })
    await expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled()
  },
}
