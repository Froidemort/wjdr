import { createRouter, createWebHistory } from '@ionic/vue-router'

import CharacterDetailView from './views/CharacterDetailView.vue'
import CharacterEditorView from './views/CharacterEditorView.vue'
import CharacterListView from './views/CharacterListView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: CharacterListView
    },
    {
      path: '/character/:id',
      component: CharacterDetailView,
      props: true
    },
    {
      path: '/character/:id/edit',
      component: CharacterEditorView,
      props: true
    }
  ]
})

export default router
