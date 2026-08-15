import type { RouteRecordRaw } from 'vue-router'
import {
  buildLegacySessionDetailRedirect,
  buildLegacySessionTimelineRedirect,
  LEGACY_SESSIONS_INDEX_REDIRECT,
} from './legacySessionRedirects'
import HomeView from './views/HomeView.vue'

const CharacterDetailView = () => import('./views/CharacterDetailView.vue')
const CampaignTimelineSessionDetailView = () => import('./views/CampaignTimelineSessionDetailView.vue')
const CharacterListView = () => import('./views/CharacterListView.vue')
const NotificationsView = () => import('./views/NotificationsView.vue')
const ProfileView = () => import('./views/ProfileView.vue')
const CampaignDetailView = () => import('./views/CampaignDetailView.vue')
const CampaignListView = () => import('./views/CampaignListView.vue')

export const appRoutes: RouteRecordRaw[] = [
  // Page d'accueil
  {
    path: '/',
    component: HomeView,
    meta: { requiresAuth: false, hideFooter: false},
  },
  // Liste des personnages avec quelques détails
  {
    path: '/characters',
    component: CharacterListView,
    meta: { requiresAuth: true, hideFooter: true},
  },
  // Liste des campagnes
  {
    path: '/campaigns',
    component: CampaignListView,
    meta: { requiresAuth: true, hideFooter: true},
  },
  // Page de détail d'un personnage, surtout utile pour un joueur qui veut gérer sa fiche pendant une partie
  {
    path: '/characters/:id',
    component: CharacterDetailView,
    props: true,
    meta: { requiresAuth: true, hideFooter: true },
  },
  {
    path: '/notifications',
    component: NotificationsView,
    meta: { requiresAuth: true, hideFooter: true },
  },
  {
    path: '/profile',
    component: ProfileView,
    meta: { requiresAuth: true, hideFooter: true },
  },
  // Page de détail d'une campagne, avec timeline des sessions datées.
  // La page permet de voir rapidement :
  // - le rôle qu'a l'utilisateur dans la campagne (PJ ou MJ)
  // - la liste des personnages avec leur nom, leur race et leur carrière actuelle.
  {
    path: '/campaigns/:id',
    component: CampaignDetailView,
    props: true,
    meta: { requiresAuth: true, hideFooter: true },
  },
  {
    path: '/campaigns/:campaignId/timeline/:sessionEntryId',
    component: CampaignTimelineSessionDetailView,
    props: true,
    meta: { requiresAuth: true, hideFooter: true },
  },
  // Redirect for legacy routes, will be removed in the future
  {
    path: '/sessions',
    redirect: LEGACY_SESSIONS_INDEX_REDIRECT,
  },
  {
    path: '/sessions/:id',
    redirect: (to) => buildLegacySessionDetailRedirect(to.params.id),
  },
  {
    path: '/sessions/:campaignId/timeline/:sessionEntryId',
    redirect: (to) =>
      buildLegacySessionTimelineRedirect(to.params.campaignId, to.params.sessionEntryId),
  },
]
