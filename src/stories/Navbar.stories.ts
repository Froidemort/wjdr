import type { Meta, StoryObj } from '@storybook/vue3-vite';
import NavBar from '../components/ui/NavBar.vue';
import { useAuthStore } from '../stores/auth';

const meta: Meta<typeof NavBar> = {
  title: 'Components/NavBar',
  component: NavBar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NavBar>;

// Story avec un utilisateur connecté
export const LoggedIn: Story = {
  render: () => ({
    components: { NavBar },
    setup() {
      const authStore = useAuthStore();
      // On force l'état connecté pour la démo
      authStore.isAuthenticated = true; // (ou la méthode de login de ton store)
      return {};
    },
    template: '<NavBar />',
  }),
};

// Story avec un utilisateur déconnecté
export const LoggedOut: Story = {
  render: () => ({
    components: { NavBar },
    setup() {
      const authStore = useAuthStore();
      authStore.isAuthenticated = false;
      return {};
    },
    template: '<NavBar />',
  }),
};