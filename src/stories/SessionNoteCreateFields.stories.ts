import type { Meta, StoryObj } from '@storybook/vue3-vite'
import SessionNoteCreateFields from '../components/ui/SessionNoteCreateFields.vue'
import type { SessionSummary } from '../types/domain'

const sessions: SessionSummary[] = [
  { id: 'session-1', campaignId: 'campaign-1', date: '2026-09-12', name: 'La route de Middenheim', description: null, createdAt: null, updatedAt: null },
]

const meta: Meta<typeof SessionNoteCreateFields> = {
  title: 'Campaign/SessionNoteCreateFields',
  component: SessionNoteCreateFields,
  tags: ['autodocs'],
  args: {
    isSessionArchived: false,
    isMj: false,
    creating: false,
    createError: null,
    createContentError: null,
    createForm: { title: '', contentText: '', isVisible: false, sessionId: '' },
    sessions,
    selectedSessionId: null,
    formatSessionLabel: (session: SessionSummary) => session.name ?? session.date,
  },
  decorators: [() => ({ template: '<div class="max-w-md"><story /></div>' })],
}

export default meta

type Story = StoryObj<typeof SessionNoteCreateFields>

export const Default: Story = {}

export const WithDraftAsMj: Story = {
  args: { isMj: true, createForm: { title: '', contentText: '- Indice trouvé', isVisible: true, sessionId: '' } },
}

export const ContentError: Story = {
  args: { createContentError: 'Ajoutez un contenu texte.' },
}
