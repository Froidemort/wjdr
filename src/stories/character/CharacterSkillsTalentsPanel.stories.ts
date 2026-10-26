import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import CharacterSkillsTalentsPanel from '../../components/character/CharacterSkillsTalentsPanel.vue'
import type { CharacterSkill, CharacterTalent } from '../../types/domain'

const skills: CharacterSkill[] = [
  {
    skillId: 'skill-perception',
    name: 'Perception',
    statCode: 'I',
    specialization: null,
    description: 'Repérer les détails importants.',
    masteryLevel: 1,
    isBasic: true,
  },
]

const talents: CharacterTalent[] = [
  {
    talentId: 'talent-ambidextre',
    name: 'Ambidextre',
    specialization: null,
    description: 'Utiliser les deux mains sans malus.',
  },
]

const meta: Meta<typeof CharacterSkillsTalentsPanel> = {
  title: 'Character/CharacterSkillsTalentsPanel',
  component: CharacterSkillsTalentsPanel,
  tags: ['autodocs'],
  args: {
    skills,
    talents,
    editable: true,
    busyKey: null,
    skillsMessage: null,
    talentsMessage: null,
    'onAdd-skills': fn(),
    'onAdd-talents': fn(),
    'onDelete-skill': fn(),
    'onDelete-talent': fn(),
    'onChange-mastery': fn(),
    'onShow-description': fn(),
  },
}

export default meta
type Story = StoryObj<typeof CharacterSkillsTalentsPanel>

export const DeleteSkillAsksForConfirmation: Story = {
  play: async ({ args, canvas }) => {
    canvas.getByRole('button', { name: 'Supprimer Perception' }).focus()
    await userEvent.keyboard('{Enter}')

    const dialog = within(await canvas.findByRole('dialog', { name: 'Supprimer la compétence ?' }))
    await expect(dialog.getByText('Perception')).toBeVisible()
    await expect(args['onDelete-skill']).not.toHaveBeenCalled()

    await userEvent.click(canvas.getByRole('button', { name: 'Supprimer' }))

    await expect(args['onDelete-skill']).toHaveBeenCalledWith('skill-perception')
  },
}

export const CancelSkillDeletionEmitsNothing: Story = {
  play: async ({ args, canvas }) => {
    canvas.getByRole('button', { name: 'Supprimer Perception' }).focus()
    await userEvent.keyboard('{Enter}')
    await canvas.findByRole('heading', { name: 'Supprimer la compétence ?' })

    await userEvent.click(canvas.getByRole('button', { name: 'Annuler' }))

    await expect(canvas.queryByRole('heading', { name: 'Supprimer la compétence ?' })).not.toBeInTheDocument()
    await expect(args['onDelete-skill']).not.toHaveBeenCalled()
  },
}

export const DeleteTalentAsksForConfirmation: Story = {
  play: async ({ args, canvas }) => {
    canvas.getByRole('button', { name: 'Supprimer Ambidextre' }).focus()
    await userEvent.keyboard('{Enter}')

    const dialog = within(await canvas.findByRole('dialog', { name: 'Supprimer le talent ?' }))
    await expect(dialog.getByText('Ambidextre')).toBeVisible()
    await expect(args['onDelete-talent']).not.toHaveBeenCalled()

    await userEvent.click(canvas.getByRole('button', { name: 'Supprimer' }))

    await expect(args['onDelete-talent']).toHaveBeenCalledWith('talent-ambidextre')
  },
}

export const CancelTalentDeletionEmitsNothing: Story = {
  play: async ({ args, canvas }) => {
    canvas.getByRole('button', { name: 'Supprimer Ambidextre' }).focus()
    await userEvent.keyboard('{Enter}')
    await canvas.findByRole('heading', { name: 'Supprimer le talent ?' })

    await userEvent.click(canvas.getByRole('button', { name: 'Annuler' }))

    await expect(canvas.queryByRole('heading', { name: 'Supprimer le talent ?' })).not.toBeInTheDocument()
    await expect(args['onDelete-talent']).not.toHaveBeenCalled()
  },
}

export const CloseButtonDismissesWithoutDeleting: Story = {
  play: async ({ args, canvas }) => {
    canvas.getByRole('button', { name: 'Supprimer Perception' }).focus()
    await userEvent.keyboard('{Enter}')
    const dialog = within(await canvas.findByRole('dialog', { name: 'Supprimer la compétence ?' }))

    await userEvent.click(dialog.getAllByRole('button', { name: 'Fermer' })[0] as HTMLElement)

    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument()
    await expect(args['onDelete-skill']).not.toHaveBeenCalled()
  },
}

export const BackdropDismissesWithoutDeleting: Story = {
  play: async ({ args, canvas, canvasElement }) => {
    canvas.getByRole('button', { name: 'Supprimer Ambidextre' }).focus()
    await userEvent.keyboard('{Enter}')
    await canvas.findByRole('dialog', { name: 'Supprimer le talent ?' })

    const backdrop = canvasElement.querySelector<HTMLElement>('.modal-backdrop button')
    await userEvent.click(backdrop as HTMLElement)

    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument()
    await expect(args['onDelete-talent']).not.toHaveBeenCalled()
  },
}

export const ReadOnlyHidesDeleteButtons: Story = {
  args: { editable: false },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button', { name: /^Supprimer/ })).not.toBeInTheDocument()
  },
}
