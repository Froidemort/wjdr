import type { Meta, StoryObj } from '@storybook/vue3-vite';
import HealthHeart from '../components/ui/HealthHeart.vue';

const meta: Meta<typeof HealthHeart> = {
  title: 'Components/HealthHeart',
  component: HealthHeart,
  tags: ['autodocs'], // Génère automatiquement la doc
  argTypes: {
    modelValue: { control: 'number' },
    maxHp: { control: 'number' },
    label: { control: 'text' },
    mobileLabel: { control: 'text' },
    editable: { control: 'boolean' },
  },
};

export default meta;

export const Default: StoryObj<typeof HealthHeart> = {
  args: {
    modelValue: 10,
    maxHp: 15,
  },
};

// Story spécifique pour tester le mode "attention" (orange) c'est à dire moins de la moitié des points de vie
export const LowHealth: StoryObj<typeof HealthHeart> = {
  args: {
    modelValue: 6,
    maxHp: 15,
  },
};

// Story spécifique pour tester le mode "danger" (Rouge)
export const CriticalHealth: StoryObj<typeof HealthHeart> = {
  args: {
    modelValue: 2,
    maxHp: 15,
  },
};

export const ReadOnly: StoryObj<typeof HealthHeart> = {
  args: {
    modelValue: 8,
    maxHp: 15,
    editable: false,
  },
};

export const NarrowEditable: StoryObj<typeof HealthHeart> = {
  render: (args) => ({
    components: { HealthHeart },
    setup: () => ({ args }),
    template: '<div class="max-w-xs"><HealthHeart v-bind="args" /></div>',
  }),
  args: {
    modelValue: 1,
    maxHp: 15,
    label: 'Points de Blessures',
    mobileLabel: 'Blessures',
  },
};

export const Empty: StoryObj<typeof HealthHeart> = {
  args: {
    modelValue: 0,
    maxHp: 0,
    editable: false,
  },
};