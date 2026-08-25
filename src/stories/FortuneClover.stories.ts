import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import FortuneClover from '../components/ui/FortuneClover.vue'

const meta: Meta<typeof FortuneClover> = {
  title: 'Components/FortuneClover',
  component: FortuneClover,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    modelValue: { control: 'number' },
    maxPoints: { control: 'number' },
    maxPointsEditable: { control: 'boolean' },
    editable: { control: 'boolean' },
    variant: { control: 'radio', options: ['fortune', 'destin'] },
    ariaLabelPrefix: { control: 'text' },
    iconPath: { control: 'text' },
    iconViewBox: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof FortuneClover>

export const Default: Story = {
  render: (args) => ({
    components: { FortuneClover },
    setup() {
      const points = ref(args.modelValue)
      return { args, points }
    },
    template: `
      <div class="p-6 flex justify-center">
        <FortuneClover v-bind="args" v-model="points" />
      </div>
    `,
  }),
  args: {
    label: 'Fortune',
    modelValue: 2,
    maxPoints: 4,
    maxPointsEditable: true,
    editable: true,
    variant: 'fortune',
    ariaLabelPrefix: 'Point de fortune',
  },
}

export const Destiny: Story = {
  render: (args) => ({
    components: { FortuneClover },
    setup() {
      const points = ref(args.modelValue)
      return { args, points }
    },
    template: `
      <div class="p-6 flex justify-center">
        <FortuneClover v-bind="args" v-model="points" />
      </div>
    `,
  }),
  args: {
    label: 'Destin',
    modelValue: 2,
    maxPoints: 4,
    maxPointsEditable: false,
    editable: true,
    variant: 'destin',
    ariaLabelPrefix: 'Point de destin',
    iconPath:
      'M12 2l2.2 4.45 4.92.72-3.56 3.47.84 4.9L12 13.2l-4.4 2.34.84-4.9L4.88 7.17l4.92-.72L12 2z',
    iconViewBox: '0 0 24 24',
  },
}

export const ReadOnly: Story = {
  args: {
    label: 'Fortune',
    modelValue: 3,
    maxPoints: 4,
    maxPointsEditable: false,
    editable: false,
    variant: 'fortune',
    ariaLabelPrefix: 'Point de fortune',
  },
}