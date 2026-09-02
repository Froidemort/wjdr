import type { RouteRecordRaw } from 'vue-router'
import {
  buildLegacySessionDetailRedirect,
  buildLegacySessionTimelineRedirect,
  LEGACY_SESSIONS_INDEX_REDIRECT,
} from './legacySessionRedirects'
import HomeView from '../views/HomeView.vue'

const CharacterDetailView = () => import('../views/CharacterDetailView.vue')
const CampaignTimelineSessionDetailView = () => import('../views/CampaignTimelineSessionDetailView.vue')
const CharacterListView = () => import('../views/CharacterListView.vue')
const NotificationsView = () => import('../views/NotificationsView.vue')
const ProfileView = () => import('../views/ProfileView.vue')
const CampaignDetailView = () => import('../views/CampaignDetailView.vue')
const CampaignListView = () => import('../views/CampaignListView.vue')
const NotFoundView = () => import('../views/NotFoundView.vue')
const ResetPasswordView = () => import('../views/ResetPasswordView.vue')
const OldWorldMapView = () => import('../views/OldWorldMapView.vue')

export const appRoutes: RouteRecordRaw[] = [
  // Home page
  {
    path: '/',
    component: HomeView,
    meta: { requiresAuth: false, hideFooter: false},
  },
  // Static Old World reference map
  {
    path: '/old-world',
    component: OldWorldMapView,
    meta: { requiresAuth: false, hideFooter: false },
  },
  // Character list with summary details
  {
    path: '/characters',
    component: CharacterListView,
    meta: { requiresAuth: true, hideFooter: true, navSection: 'characters' },
  },
  // Campaign list
  {
    path: '/campaigns',
    component: CampaignListView,
    meta: { requiresAuth: true, hideFooter: true, navSection: 'campaigns' },
  },
  // Character detail page, mostly used by players during sessions
  {
    path: '/characters/:id',
    component: CharacterDetailView,
    props: true,
    meta: { requiresAuth: true, hideFooter: true },
  },
  {
    path: '/notifications',
    component: NotificationsView,
    meta: { requiresAuth: true, hideFooter: true, navSection: 'notifications' },
  },
  {
    path: '/profile',
    component: ProfileView,
    meta: { requiresAuth: true, hideFooter: true, navSection: 'profile' },
  },
  // Campaign detail page with dated session timeline.
  // Quick view includes:
  // - current user role in campaign (player or game master)
  // - character list with name, race, and current career.
  {
    path: '/campaigns/:id',
    component: CampaignDetailView,
    props: true,
    meta: { requiresAuth: true, hideFooter: true, navSection: 'campaigns' },
  },
  {
    path: '/campaigns/:campaignId/timeline/:sessionEntryId',
    component: CampaignTimelineSessionDetailView,
    props: true,
    meta: { requiresAuth: true, hideFooter: true, navSection: 'campaigns' },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: ResetPasswordView,
    meta: { requiresAuth: false, hideFooter: true, skipSplash: true },
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
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: { requiresAuth: false, hideFooter: false, skipSplash: true },
  },
]
