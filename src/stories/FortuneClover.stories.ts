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
    maxPointsEditable: { control: 'boolean' },
    editable: { control: 'boolean' },
    variant: { control: 'radio', options: ['fortune', 'destin'] },
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

export const ReadOnly: Story = {
  args: {
    label: 'Destin',
    modelValue: 2,
    maxPoints: 4,
    editable: false,
  },
};

export const FortuneEditableMax: Story = {
  render: (args) => ({
    components: { FortuneClover },
    setup() {
      const points = ref(args.modelValue);
      const maxPoints = ref(args.maxPoints);
      return { args, points, maxPoints };
    },
    template: '<div class="max-w-xs"><FortuneClover v-bind="args" v-model="points" :max-points="maxPoints" @update:max-points="maxPoints = $event" /></div>',
  }),
  args: {
    label: 'Fortune',
    modelValue: 4,
    maxPoints: 6,
    maxPointsEditable: true,
  },
};

export const Destin: Story = {
  args: {
    label: 'Destin',
    modelValue: 2,
    maxPoints: 4,
    variant: 'destin',
  },
};

export const NarrowReadOnly: Story = {
  render: (args) => ({
    components: { FortuneClover },
    setup: () => ({ args }),
    template: '<div class="max-w-xs"><FortuneClover v-bind="args" /></div>',
  }),
  args: {
    label: 'Destin',
    modelValue: 99,
    maxPoints: 4,
    variant: 'destin',
    editable: false,
  },
};