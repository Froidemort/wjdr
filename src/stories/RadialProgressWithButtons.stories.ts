import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import RadialProgressWithButtons from '../components/ui/RadialProgressWithButtons.vue'

const meta: Meta<typeof RadialProgressWithButtons> = {
  title: 'Components/RadialProgressWithButtons',
  component: RadialProgressWithButtons,
  tags: ['autodocs'],
  argTypes: {
    currentValue: { control: 'number' },
    maxValue: { control: 'number' },
    gapSize: { control: 'number' },
    editable: { control: 'boolean' },
    size: { control: 'text' }
}
}

export default meta
type Story = StoryObj<typeof RadialProgressWithButtons>

export const Default: Story = {
  render: (args) => ({
    components: { RadialProgressWithButtons },
    setup() {
      const points = ref(args.currentValue)
      return { args, points }
    },
    template: `
      <div class="p-6 flex justify-center">
        <RadialProgressWithButtons v-bind="args" :current-value="points" />
      </div>
    `,
  }),
  args: {
    currentValue: 2,
    maxValue: 4,
    gapSize: 2,
    editable: true,
    size: '12rem',
  },
}