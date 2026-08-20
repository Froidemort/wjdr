import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Footer from '../components/ui/Footer.vue';


const meta: Meta<typeof Footer> = {
  title: 'Components/Footer',
  component: Footer,
  tags: ['autodocs'], // Génère automatiquement la doc
};

export default meta;

export const Default: StoryObj<typeof Footer> = {
    render: (args) => ({
      components: { Footer },
      setup() {
        return { args };
      },
      template: `
        <div class="p-6 flex justify-center">
          <Footer v-bind="args" />
        </div>
      `,
    }),
};
