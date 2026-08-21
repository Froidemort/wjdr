import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { createTestingPinia } from '@pinia/testing';
import { http, HttpResponse } from 'msw';
import { fn } from 'storybook/test';
import NavBar from '../components/ui/NavBar.vue';
import { useAuthStore } from '../stores/auth'; // On importe le store pour l'instancier

const meta: Meta<typeof NavBar> = {
  title: 'Components/NavBar',
  component: NavBar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NavBar>;

// Une petite fonction utilitaire pour simuler un Spy et rendre Pinia Testing heureux
const dummySpy = fn;

const navbarMswHandlers = [
  http.head('*/rest/v1/notifications', () => {
    return new HttpResponse(null, {
      status: 200,
      headers: {
        'content-range': '0-0/0',
      },
    });
  }),
  http.get('*/rest/v1/notifications', ({ request }) => {
    const url = new URL(request.url);
    const select = url.searchParams.get('select') ?? '';

    if (select === 'id') {
      return new HttpResponse(null, {
        status: 200,
        headers: {
          'content-range': '0-0/0',
        },
      });
    }

    return HttpResponse.json([]);
  }),
];

// Story avec un utilisateur connecté
export const LoggedIn: Story = {
  parameters: {
    msw: {
      handlers: navbarMswHandlers,
    },
  },
  render: () => ({
    components: { NavBar },
    plugins: [
      createTestingPinia({
        createSpy: dummySpy,
        stubActions: false,
      }),
    ],
    setup() {
      // Simuler un utilisateur connecté dans le store Pinia
      const authStore = useAuthStore();
      authStore.user = {
        'id': `12345-${Math.random().toString(36).substr(2, 9)}`,
        'email': 'john.doe@example.com',
        'user_metadata': { 'full_name': 'John Doe' }
      } as never; // On instancie que ce dont on a besoin
      authStore.displayName = 'John Doe';
      authStore.avatarUrl = 'https://placehold.net/avatar.svg';
      authStore.initialized = true;
    },
    template: '<NavBar />',
  }),
};

// Story avec un utilisateur déconnecté
export const LoggedOut: Story = {
  parameters: {
    msw: {
      handlers: navbarMswHandlers,
    },
  },
  render: () => ({
    components: { NavBar },
    plugins: [
      createTestingPinia({
        createSpy: dummySpy,
        stubActions: false,
      }),
    ],
    setup() {
      const authStore = useAuthStore();
      authStore.user = null;
      authStore.session = null;
      authStore.displayName = '';
      authStore.avatarUrl = null;
      authStore.initialized = true;
    },
    template: '<NavBar />',
  }),
};
