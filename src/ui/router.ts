import { createRouter, createWebHistory } from 'vue-router'

import HomeView from './views/HomeView.vue'
import CharacterDetailView from './views/CharacterDetailView.vue'
import CharacterEditorView from './views/CharacterEditorView.vue'
import CharacterListView from './views/CharacterListView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: HomeView
    },
    {
      path: '/characters',
      component: CharacterListView
    },
    {
      path: '/characters/:id',
      component: CharacterDetailView,
      props: true
    },
    {
      path: '/characters/:id/edit',
      component: CharacterEditorView,
      props: true
    }
  ]
})

export default router
