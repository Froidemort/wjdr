<template>
  <nav
    class="navbar bg-base-200 border-b border-base-300 px-4 h-16 items-center justify-between"
  >
    <div class="flex-shrink-0">
      <router-link
        to="/"
        class="btn btn-ghost normal-case text-lg sm:text-xl font-warhammer tracking-wider text-secondary hover:bg-base-300"
      >
        WJDR CSM
      </router-link>
    </div>

    <div class="flex items-center gap-2">
      <ul
        class="menu menu-horizontal bg-base-100 rounded-box border border-base-300 p-1 gap-1 items-center"
      >
        <template v-if="isAuthenticated">
          <li>
            <router-link
              to="/character-sheet"
              class="tooltip tooltip-bottom"
              data-tip="Fiche Active"
            >
              <Scroll class="w-5 h-5" />
            </router-link>
          </li>
          <li>
            <router-link
              to="/characters"
              class="tooltip tooltip-bottom"
              data-tip="Mes Personnages"
            >
              <Users class="w-5 h-5" />
            </router-link>
          </li>

          <li>
            <router-link
              to="/profile"
              class="tooltip tooltip-bottom"
              data-tip="Mon Profil"
            >
              <ShieldUser class="w-5 h-5" />
            </router-link>
          </li>
        </template>

        <li>
          <router-link
            to="/about"
            class="tooltip tooltip-bottom"
            data-tip="À propos"
          >
            <Info class="w-5 h-5" />
          </router-link>
        </li>

        <li
          v-if="isAuthenticated"
          class="h-5 w-[1px] bg-base-300 mx-1 hidden sm:inline-block"
        ></li>

        <li v-if="isAuthenticated">
          <button
            @click="logout"
            class="tooltip tooltip-left text-error hover:bg-error/10"
            data-tip="Quitter le Vieux Monde"
          >
            <LogOut class="w-5 h-5" />
          </button>
        </li>
      </ul>

      <router-link
        v-if="!isAuthenticated"
        to="/login"
        class="btn btn-primary btn-sm font-warhammer uppercase tracking-wide px-2 sm:px-3 whitespace-nowrap"
      >
        <LogIn class="w-4 h-4 mr-1 hidden sm:inline-block" />
        <span class="text-xs sm:text-sm">S'enrôler</span>
      </router-link>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { Scroll, Users, ShieldUser, Info, LogIn, LogOut } from "@lucide/vue";

const isAuthenticated = ref(true);

const logout = () => {
  isAuthenticated.value = false;
};
</script>

<style scoped>
@reference "../theme/theme.css";

/* Uniformisation du survol */
.menu li a:hover,
.menu li button:hover {
  @apply bg-base-200 text-primary;
}

/* Gestion spécifique pour le bouton logout au survol */
.menu li button.text-error:hover {
  @apply bg-error/10 text-error;
}

/* Lien actif de Vue Router */
:deep(.router-link-active) {
  @apply !bg-primary/20 !text-primary;
}
</style>
