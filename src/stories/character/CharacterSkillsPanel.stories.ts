import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, waitFor } from 'storybook/test'
import CharacterSkillsPanel from '../../components/character/CharacterSkillsPanel.vue'
import type { CharacterSkill } from '../../types/domain'

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

const meta: Meta<typeof CharacterSkillsPanel> = {
  title: 'Character/CharacterSkillsPanel',
  component: CharacterSkillsPanel,
  tags: ['autodocs'],
  args: {
    skills,
    editable: true,
    busyKey: null,
    successMessage: null,
    onAdd: fn(),
    onDelete: fn(),
    'onChange-mastery': fn(),
    'onShow-description': fn(),
  },
}

export default meta
type Story = StoryObj<typeof CharacterSkillsPanel>

export const ChooseMastery: Story = {
  play: async ({ args, canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Modifier la maîtrise de Perception' })
    await expect(trigger).toHaveTextContent('')
    await expect(canvas.getAllByText('Acquis')).toHaveLength(1)
    await userEvent.click(trigger)

    const options = canvas.getByRole('group', { name: 'Choisir le niveau de maîtrise' })
    await expect(options).toBeVisible()
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Acquis', pressed: true })).toHaveFocus())
    await expect(canvas.getByRole('button', { name: 'Fermer le choix du niveau de maîtrise' })).toBeVisible()

    await userEvent.click(canvas.getByRole('button', { name: '+10%' }))
    await expect(args['onChange-mastery']).toHaveBeenCalledWith('skill-perception', 2)
    await expect(options).not.toBeInTheDocument()
  },
}

export const LongNameWithAllBadgesAndActions: Story = {
  args: {
    skills: [
      {
        skillId: 'skill-long',
        name: 'Connaissances académiques',
        statCode: 'Int',
        specialization: 'Généalogie et héraldique des maisons nobles de l\u2019Empire',
        description: 'Étude approfondie.',
        masteryLevel: 3,
        isBasic: false,
      },
    ],
  },
  decorators: [() => ({ template: '<div style="max-width: 18rem"><story /></div>' })],
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 4 })).toBeVisible()
    await expect(canvas.getByText('Int')).toBeVisible()
    await expect(canvas.getByText('Avancée')).toBeVisible()
    await expect(canvas.getByLabelText('Niveau de maîtrise')).toHaveTextContent('+20%')
    await expect(canvas.getByRole('button', { name: /^Modifier la maîtrise de/ })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Afficher la description de la compétence' })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: /^Supprimer/ })).toBeInTheDocument()
  },
}

export const EscapeClosesMasteryWithoutChange: Story = {
  play: async ({ args, canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Modifier la maîtrise de Perception' })
    await userEvent.click(trigger)
    await canvas.findByRole('group', { name: 'Choisir le niveau de maîtrise' })

    await userEvent.keyboard('{Escape}')

    await expect(canvas.queryByRole('group', { name: 'Choisir le niveau de maîtrise' })).not.toBeInTheDocument()
    await expect(trigger).toHaveFocus()
    await expect(args['onChange-mastery']).not.toHaveBeenCalled()
  },
}
