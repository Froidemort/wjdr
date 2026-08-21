import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import FortuneClover from '../components/ui/FortuneClover.vue';

const meta: Meta<typeof FortuneClover> = {
  title: 'Components/FortuneClover',
  component: FortuneClover,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    modelValue: { control: 'number' },
    maxPoints: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof FortuneClover>;

// Story par défaut avec un état réactif pour tester le clic
export const Default: Story = {
  render: (args) => ({
    components: { FortuneClover },
    setup() {
      // On crée un state local lié aux props pour simuler le v-model
      const points = ref(args.modelValue);
      return { args, points };
    },
    template: `
      <div class="p-6 flex justify-center">
        <FortuneClover v-bind="args" v-model="points" />
      </div>
    `,
  }),
  args: {
    label: 'Points de Destin',
    modelValue: 2,
    maxPoints: 4,
  },
};

// Variante avec un max plus grand (ex: 6 points)
export const HighCapacity: Story = {
  render: (args) => ({
    components: { FortuneClover },
    setup() {
      const points = ref(args.modelValue);
      return { args, points };
    },
    template: `
      <div class="p-6 flex justify-center">
        <FortuneClover v-bind="args" v-model="points" />
      </div>
    `,
  }),
  args: {
    label: 'Points de Fortune',
    modelValue: 5,
    maxPoints: 6,
  },
};