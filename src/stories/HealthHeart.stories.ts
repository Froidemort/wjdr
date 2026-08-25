import type { Meta, StoryObj } from '@storybook/vue3-vite'
import HealthHeart from '../components/ui/HealthHeart.vue'

const meta: Meta<typeof HealthHeart> = {
  title: 'Components/HealthHeart',
  component: HealthHeart,
  tags: ['autodocs'],
  argTypes: {
    modelValue: { control: 'number' },
    maxHp: { control: 'number' },
    label: { control: 'text' },
    editable: { control: 'boolean' },
  },
}

export default meta

export const Default: StoryObj<typeof HealthHeart> = {
  args: {
    modelValue: 10,
    maxHp: 15,
    label: 'Blessures',
    editable: true,
  },
}

export const LowHealth: StoryObj<typeof HealthHeart> = {
  args: {
    modelValue: 6,
    maxHp: 15,
    label: 'Blessures',
    editable: true,
  },
}

export const CriticalHealth: StoryObj<typeof HealthHeart> = {
  args: {
    modelValue: 2,
    maxHp: 15,
    label: 'Blessures',
    editable: true,
  },
}

export const ReadOnly: StoryObj<typeof HealthHeart> = {
  args: {
    modelValue: 8,
    maxHp: 12,
    label: 'Blessures',
    editable: false,
  },
}