# Graph Report - wjdr  (2026-10-17)

## Corpus Check
- 251 files · ~182,817 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 3, .css 2)

## Summary
- 1869 nodes · 3562 edges · 121 communities (108 shown, 13 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 103 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d78a46c4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CharacterDetailView.vue
- useCampaignManagement.ts
- ProfileView.vue
- characterLinksRepository.ts
- CampaignDetailView.vue
- career_paths_extractor.py
- offlineQueueRepository.ts
- EquipmentSlotPickerModal.vue
- setSectionSuccess
- useCampaignSessions.ts
- SessionNotesPanel.vue
- AuthForm.vue
- validation.ts
- charactersRepository.test.ts
- equipmentSlots.ts
- CharacterEquipmentDoll.vue
- routes.ts
- vue
- notificationsRepository.ts
- careersRepository.ts
- @lucide/vue
- devDependencies
- compilerOptions
- CampaignListView.vue
- vue-router
- CampaignTimelineSessionDetailView.vue
- ThemeToggle.vue
- useCampaignSessions
- useOptimisticUpdate
- CharacterListView.vue
- scripts
- CampaignCreateModal.vue
- auth.ts
- CharacterCreateModal.vue
- NotificationsView.vue
- useMissivesInbox.ts
- useRealtimeChannels
- campaignsRepository.ts
- Navbar.stories.ts
- useRealtimeChannels.ts
- domain.ts
- CharacterMoneyCard.vue
- ui-ux-audit.spec.ts
- SessionNotesListCard.vue
- SessionSummary
- vitest
- equipmentSlots.test.ts
- HealthHeart.vue
- NavBar.vue
- dependencies
- UI/UX Audit Post-Test Checklist (Playwright)
- campaignCodeRedirect.ts
- loadCharacter
- CampaignSessionsSection.vue
- CharacteristicCard.vue
- NavMobileMenu.vue
- compilerOptions
- sessionsRepository.ts
- SessionNotesCreateCard.vue
- @vueuse/core
- saveQuickFields
- catalogRepository.ts
- secret-guard.cjs
- FortuneClover.vue
- Warhammer RPG App
- usePagination
- mockServiceWorker.js
- dice.ts
- MissivesPopover.vue
- CampaignSummary
- isTwoHandedWeapon
- StateCycleBadge.vue
- Role
- CharacterValueCard.vue
- closeSkillMastery
- withRetry
- @storybook/vue3-vite
- wjdr
- charactersRepository.ts
- resetCatalogModalState
- preview.ts
- useNotificationsLoad.ts
- loadSessionDetail
- formatSessionNoteLabel
- package.json
- Role
- Role
- Role
- Role
- Role
- Add tests
- daisyUI + Tailwind UI
- Fix lint
- Lint, typecheck, hooks
- New component
- New migration
- New store
- Playwright e2e
- Review changes
- Storybook + Vitest
- Supabase data access
- Supabase migrations
- Vercel serverless
- Vue 3 + Pinia
- Warhammer domain
- SessionAccessRequest.vue
- vercel.json
- DataGrid.vue
- knip.json
- tsconfig.json
- AGENTS.md
- .mcp.json
- wjdr-migrations

## God Nodes (most connected - your core abstractions)
1. `vue` - 71 edges
2. `vitest` - 53 edges
3. `@lucide/vue` - 29 edges
4. `useCampaignSessions()` - 29 edges
5. `useCampaignManagement()` - 24 edges
6. `useAuthStore` - 24 edges
7. `setSectionSuccess()` - 22 edges
8. `invalidateCurrentLinksCache()` - 21 edges
9. `@vueuse/core` - 19 edges
10. `vue-router` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Tools` --references--> `useOfflineQueueSync()`  [INFERRED]
  .github/skills/pinia-dexie-offline/SKILL.md → src/composables/useOfflineQueueSync.ts
- `Rules` --references--> `useRealtimeSync()`  [INFERRED]
  .github/skills/pinia-dexie-offline/SKILL.md → src/composables/useRealtimeSync.ts
- `Rules` --references--> `useOfflineQueueSync()`  [INFERRED]
  .github/skills/pinia-dexie-offline/SKILL.md → src/composables/useOfflineQueueSync.ts
- `createSessions()` --calls--> `useCampaignSessions()`  [EXTRACTED]
  tests/unit/useCampaignSessions.test.ts → src/composables/useCampaignSessions.ts
- `createManagement()` --calls--> `useCampaignManagement()`  [EXTRACTED]
  tests/unit/useCampaignManagement.test.ts → src/composables/useCampaignManagement.ts

## Import Cycles
- None detected.

## Communities (121 total, 13 thin omitted)

### Community 0 - "CharacterDetailView.vue"
Cohesion: 0.02
Nodes (123): actionBusyKey, actionSuccessMessage, activeCharacterTab, activeSkillMasteryId, addingCatalog, allStatsSorted, ARMOR_EQUIPPED_OPTIONS, armorFilter (+115 more)

### Community 1 - "useCampaignManagement.ts"
Cohesion: 0.07
Nodes (48): emit, InvitationFilter, useCampaignManagement(), acceptJoinRequest(), clearManagementState(), inviteSelectedUsers(), loadInvitations(), loadInviteCandidates() (+40 more)

### Community 2 - "ProfileView.vue"
Cohesion: 0.06
Nodes (46): getProfileSettings(), isValidEmail(), normalizeEmail(), normalizeUsername(), ProfileSettings, reauthenticateWithPassword(), sanitizeFileName(), updateAccountPassword() (+38 more)

### Community 3 - "characterLinksRepository.ts"
Cohesion: 0.10
Nodes (41): addCharacterArmors(), addCharacterItems(), addCharacterSkills(), addCharacterTalents(), addCharacterWeapons(), ArmorLinkRow, CharacterLinksBundle, characterLinksCache (+33 more)

### Community 4 - "CampaignDetailView.vue"
Cohesion: 0.06
Nodes (29): activeCampaignTab, archiveBusy, authStore, campaignId, canCreateOwnCharacter, characterCreateModalRef, characterCreateSuccess, characterListFilter (+21 more)

### Community 5 - "career_paths_extractor.py"
Cohesion: 0.07
Nodes (17): check_pdf_structure(), extract_career_data(), get_careers(), get_id_from_name(), insert_career_data_to_db(), sanitize_characteristics(), sanitize_text(), wrap_query() (+9 more)

### Community 6 - "offlineQueueRepository.ts"
Cohesion: 0.08
Nodes (38): Offline-first sync, Rules, Tools, Verify, When, dexie, nanoid, useOfflineQueueSync() (+30 more)

### Community 7 - "EquipmentSlotPickerModal.vue"
Cohesion: 0.10
Nodes (30): armorActionLabel(), depthMarks, dialogRef, emit, equippedArmors, equippedArmorsOnSlot, equippedWeaponOnSlot, filteredWeapons (+22 more)

### Community 8 - "setSectionSuccess"
Cohesion: 0.20
Nodes (31): updateCharacterArmorEquipped(), updateCharacterWeaponEquipped(), findConflictingWeapons(), beginAction(), confirmDestructiveAction(), confirmItemCreate(), endAction(), ensureArmorCanBeEquipped() (+23 more)

### Community 9 - "useCampaignSessions.ts"
Cohesion: 0.13
Nodes (20): days, monthLabel, props, sessionsByDate, today, todayKey, visibleMonth, visibleYear (+12 more)

### Community 10 - "SessionNotesPanel.vue"
Cohesion: 0.05
Nodes (58): canCreateNote, canManageNote(), createCardTitle, createContentError, createError, createForm, creating, editContentError (+50 more)

### Community 11 - "AuthForm.vue"
Cohesion: 0.08
Nodes (23): authFormStore, authStore, email, emailError, formSubmitted, identifier, identifierError, isLogin (+15 more)

### Community 12 - "validation.ts"
Cohesion: 0.18
Nodes (15): inputId, model, props, reveal, strength, requestCampaignJoinByCode(), requestJoinCampaign(), getPasswordStrength() (+7 more)

### Community 13 - "charactersRepository.test.ts"
Cohesion: 0.20
Nodes (11): assertCharacterCampaignWritable(), replaceCharacterTotalAdvancedValues(), syncCharacterWoundsCore(), updateCharacterCareer(), updateCharacterStatCurrentAdvanced(), updateCharacterStatValues(), applyCareerChange(), builder() (+3 more)

### Community 14 - "equipmentSlots.ts"
Cohesion: 0.13
Nodes (21): encumbranceProgressMax, encumbranceProgressValue, isEncumbranceOverLimit, props, CharacterArmor, CharacterWeapon, ArmorByLocation, ArmorDataLocation (+13 more)

### Community 15 - "CharacterEquipmentDoll.vue"
Cohesion: 0.09
Nodes (20): activeSlotId, ArmorSlotView, armorViewById, armorViews, buildArmorSlotView(), buildWeaponSlotView(), emit, highlightedLocation (+12 more)

### Community 16 - "routes.ts"
Cohesion: 0.10
Nodes (20): buildLegacySessionDetailRedirect(), buildLegacySessionTimelineRedirect(), LEGACY_SESSIONS_INDEX_REDIRECT, appRoutes, CampaignDetailView(), CampaignListView(), CampaignTimelineSessionDetailView(), CharacterDetailView() (+12 more)

### Community 17 - "vue"
Cohesion: 0.07
Nodes (29): vue, authReady, authStore, { isOnline, pendingCount, isSyncing }, route, router, showSplash, showSyncIndicator (+21 more)

### Community 18 - "notificationsRepository.ts"
Cohesion: 0.25
Nodes (9): getNotificationDisplayTitle(), isJoinRequestForCampaign(), joinRequestCampaignMarker(), JoinRequestRow, listNotificationsForUserPaginated(), mapNotification(), NotificationRow, PaginatedNotifications (+1 more)

### Community 19 - "careersRepository.ts"
Cohesion: 0.23
Nodes (11): FRENCH_SORT_OPTIONS, listCareerCharacteristicsByCareerId(), listCareerPathCareersByFromCareerId(), mapCareerPathCareer(), normalizeCareerId(), normalizeStatCode(), CareerCharacteristic, CareerPathCareer (+3 more)

### Community 20 - "@lucide/vue"
Cohesion: 0.13
Nodes (11): @lucide/vue, isAvailable, isFeatured, props, surfaceTag, HomeFeature, homeFeatures, HomePillar (+3 more)

### Community 21 - "devDependencies"
Cohesion: 0.06
Nodes (33): devDependencies, @chromatic-com/storybook, daisyui, eslint, @eslint/js, eslint-plugin-storybook, eslint-plugin-vue, fake-indexeddb (+25 more)

### Community 22 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 23 - "CampaignListView.vue"
Cohesion: 0.11
Nodes (19): authStore, campaignCreateModalStore, campaigns, campaignsList, errorMessage, { feedbackMap, copyText, copyLink }, goToNextPage(), goToPreviousPage() (+11 more)

### Community 24 - "vue-router"
Cohesion: 0.14
Nodes (16): vue-router, ariaLabel, authStore, avatarUrl, displayName, emit, { isOpen, close, toggle }, onLogout() (+8 more)

### Community 25 - "CampaignTimelineSessionDetailView.vue"
Cohesion: 0.12
Nodes (19): @vueuse/router, authStore, campaign, campaignId, errorMessage, formatCampaignSessionDate(), formatCampaignSessionDateCompact(), getSessionDateStatus() (+11 more)

### Community 26 - "ThemeToggle.vue"
Cohesion: 0.15
Nodes (16): buttonRef, isDark, props, themeStore, toggleTheme(), useThemeStore, AnimatedThemeToggleOptions, getThemeTransitionClipPaths() (+8 more)

### Community 27 - "useCampaignSessions"
Cohesion: 0.26
Nodes (12): useCampaignSessions(), cancelSessionEdit(), createCampaignSession(), deleteCampaignSession(), formatCampaignSessionDate(), formatCampaignSessionTitle(), getSessionDateStatus(), hasSessionDateConflict() (+4 more)

### Community 28 - "useOptimisticUpdate"
Cohesion: 0.19
Nodes (14): useLiveSave(), triggerSave(), triggerSaveNow(), MergePatch, SaveStatus, useOptimisticUpdate(), cancel(), flush() (+6 more)

### Community 29 - "CharacterListView.vue"
Cohesion: 0.11
Nodes (15): model, LoadingState, LoadingStateOptions, useLoadingState(), execute(), CharacterListView(), authStore, charactersList (+7 more)

### Community 30 - "scripts"
Cohesion: 0.12
Nodes (16): scripts, build, build-storybook, coverage, dev, knip, lint, lint:fix (+8 more)

### Community 31 - "CampaignCreateModal.vue"
Cohesion: 0.15
Nodes (15): authStore, description, dialogRef, errorMessage, generateAlphaNumeric, generateCampaignCode(), lastFocusedElement, loading (+7 more)

### Community 32 - "auth.ts"
Cohesion: 0.13
Nodes (16): pinia, closeModal(), prefetchFrequentAuthenticatedViews(), router, AuthIdentifier, resolveIdentifier(), useAuthStore, AuthMode (+8 more)

### Community 33 - "CharacterCreateModal.vue"
Cohesion: 0.13
Nodes (14): close(), dialogRef, emit, errorMessage, gender, genderOptions, loading, name (+6 more)

### Community 34 - "NotificationsView.vue"
Cohesion: 0.13
Nodes (21): useBusyOperations(), clearAllBusy(), isBusy(), setBusy(), load(), NotificationsView(), deleteNotification(), extractNotificationSessionId() (+13 more)

### Community 35 - "useMissivesInbox.ts"
Cohesion: 0.22
Nodes (10): useAsyncList(), UseAsyncListOptions, useMissivesInbox(), loadUnreadCount(), markMissiveAsRead(), refreshMissives(), countUnreadNotifications(), listNotificationsForUser() (+2 more)

### Community 36 - "useRealtimeChannels"
Cohesion: 0.20
Nodes (13): useRealtimeChannels(), dispatchUpdate(), subscribe(), unsubscribe(), RealtimeEvent, RealtimeSyncSubscription, useRealtimeSync(), start() (+5 more)

### Community 37 - "campaignsRepository.ts"
Cohesion: 0.25
Nodes (13): createCampaign(), getCampaignById(), listCampaignsForUser(), listCampaignsForUserPaginated(), mapCampaign(), mapCampaignWriteError(), updateCampaignArchivedState(), CampaignRow (+5 more)

### Community 38 - "Navbar.stories.ts"
Cohesion: 0.22
Nodes (8): msw, @pinia/testing, storybook, LoggedIn, LoggedOut, meta, navbarMswHandlers, Story

### Community 39 - "useRealtimeChannels.ts"
Cohesion: 0.22
Nodes (6): @supabase/supabase-js, RealtimeEvent, RealtimeTableSubscription, RealtimeUpdatePayload, UseRealtimeChannelsOptions, dependencies

### Community 40 - "domain.ts"
Cohesion: 0.18
Nodes (11): CharacterListFilter, emit, props, sessionInfoOpenModel, props, resolvedDestinyTotal, CharacterCore, CharacterDetail (+3 more)

### Community 41 - "CharacterMoneyCard.vue"
Cohesion: 0.24
Nodes (14): closeSubtractDialog(), confirmSubtract(), emit, onCopperInput(), onGoldInput(), onMoneyFieldBlur(), onSilverInput(), onSubtractDialogClosed() (+6 more)

### Community 42 - "ui-ux-audit.spec.ts"
Cohesion: 0.12
Nodes (5): @playwright/test, @storybook/addon-vitest, @vitest/browser-playwright, RequestCounter, SCREENSHOT_DIR

### Community 43 - "SessionNotesListCard.vue"
Cohesion: 0.43
Nodes (6): emit, onEditDraftFieldInput(), onLinkedSessionFilterChange(), onSearchQueryUpdate(), props, SessionNoteEditDraft

### Community 44 - "SessionSummary"
Cohesion: 0.32
Nodes (11): computeSearchScore(), countOccurrences(), formatSessionDate(), formatSessionLabel(), useSessionNotesFiltering(), resolveSessionLabel(), UseSessionNotesFilteringOptions, SessionNote (+3 more)

### Community 45 - "vitest"
Cohesion: 0.20
Nodes (10): vitest, useCopyFeedback(), copy(), copyLink(), copyText(), useCopyLink(), copyCampaignCode(), copyCampaignLink() (+2 more)

### Community 46 - "equipmentSlots.test.ts"
Cohesion: 0.18
Nodes (15): filteredArmors, armorCoversLocation(), canEquipArmorStack(), computeArmorByLocation(), countEquippedArmorsForLocation(), filterArmorsForSlot(), findConflictingArmors(), getArmorCoveredLocations() (+7 more)

### Community 47 - "HealthHeart.vue"
Cohesion: 0.10
Nodes (17): clampedCurrentHp, currentHp, emit, heartBeatFrequency, hpColorClass, hpPercentage, isBeating, props (+9 more)

### Community 48 - "NavBar.vue"
Cohesion: 0.09
Nodes (20): accountRef, authStore, isAuthenticated, { isScrolled }, missivesRef, mobileMenuOpen, route, unreadCount (+12 more)

### Community 49 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, browser-image-compression, check-password-strength, dexie, @lucide/vue, nanoid, pinia, @pinia/testing (+7 more)

### Community 50 - "UI/UX Audit Post-Test Checklist (Playwright)"
Cohesion: 0.14
Nodes (13): 10) Mobile-Specific Pass, 11) Desktop-Specific Pass, 1) App Shell, Semantics, Keyboard A11y, 2) Navbar Reactive States + Touch Targets, 3) Forms + Submit Feedback, 4) Character Detail Visual Tokens + Responsive Overflow, 5) Session List, Session Detail, and Notes Refresh, 6) Character Detail Realtime + Cache Stability (+5 more)

### Community 51 - "campaignCodeRedirect.ts"
Cohesion: 0.15
Nodes (18): getAuthToken(), getRequestOrigin(), getRequiredEnv(), handler(), rateLimiter, CampaignCodeLookup, CampaignCodeResolutionContext, CampaignCodeResolutionResult (+10 more)

### Community 52 - "loadCharacter"
Cohesion: 0.17
Nodes (13): invalidateCharacterLinksCache(), getWoundsValueFromCharacterStats(), isSavingInProgress(), loadCharacter(), markSavedEditable(), onStatBaseChange(), onStatTick(), requestExternalCharacterRefresh() (+5 more)

### Community 53 - "CampaignSessionsSection.vue"
Cohesion: 0.20
Nodes (10): emit, onSessionCreateFieldInput(), props, SessionCreateForm, SessionEditForm, SessionTimelineFilter, emit, onSessionEditFieldInput() (+2 more)

### Community 54 - "CharacteristicCard.vue"
Cohesion: 0.23
Nodes (11): cardToneClass, emit, onBaseInput(), onTickDown(), onTickUp(), onTotalAdvancedInput(), props, tickStep (+3 more)

### Community 55 - "NavMobileMenu.vue"
Cohesion: 0.20
Nodes (7): links, route, authStore, open, router, mainNavLinks, NavLink

### Community 56 - "compilerOptions"
Cohesion: 0.15
Nodes (12): @vue/tsconfig/tsconfig.dom.json, compilerOptions, erasableSyntaxOnly, noFallthroughCasesInSwitch, noImplicitAny, noUnusedLocals, noUnusedParameters, strict (+4 more)

### Community 57 - "sessionsRepository.ts"
Cohesion: 0.36
Nodes (9): createSession(), deleteSession(), getSessionById(), listSessionsForCampaign(), mapSession(), mapSessionWriteError(), updateSession(), { fromMock } (+1 more)

### Community 58 - "SessionNotesCreateCard.vue"
Cohesion: 0.47
Nodes (5): emit, onCreate(), onCreateFieldInput(), props, SessionNoteCreateForm

### Community 59 - "@vueuse/core"
Cohesion: 0.10
Nodes (15): @vueuse/core, CampaignTab, emit, model, props, emit, model, props (+7 more)

### Community 60 - "saveQuickFields"
Cohesion: 0.24
Nodes (9): MoneyValues, useMoneyCoercion(), applyCoercion(), coerceMoney(), isEditableEqual(), onMoneyCommit(), onMoneySubtract(), onQuickValueChange() (+1 more)

### Community 61 - "catalogRepository.ts"
Cohesion: 0.26
Nodes (10): CATALOG_SELECT_BY_TABLE, createCatalogItem(), mapCatalogItem(), searchCatalog(), CatalogItem, CatalogRow, CatalogTableName, CreateCatalogItemInput (+2 more)

### Community 62 - "secret-guard.cjs"
Cohesion: 0.24
Nodes (10): args, deny(), findSecret(), flatten(), fs, handle(), leaves(), process (+2 more)

### Community 63 - "FortuneClover.vue"
Cohesion: 0.12
Nodes (17): activeTokenClass, emit, onMaxPointsInput(), props, resolvedMaxPoints, resolvedPoints, setPoints(), tokenGridStyle (+9 more)

### Community 64 - "Warhammer RPG App"
Cohesion: 0.18
Nodes (10): Base de données, Commandes utiles, Développement, Fonctionnalités, Notes, Prérequis, Stack, Storybook (+2 more)

### Community 65 - "usePagination"
Cohesion: 0.47
Nodes (6): usePagination(), goToNextPage(), goToPreviousPage(), nextPage(), previousPage(), resetPage()

### Community 66 - "mockServiceWorker.js"
Cohesion: 0.36
Nodes (8): activeClientIds, getResponse(), handleRequest(), IS_MOCKED_RESPONSE, resolveMainClient(), respondWithMock(), sendToClient(), serializeRequest()

### Community 67 - "dice.ts"
Cohesion: 0.36
Nodes (7): clampPercentileTarget(), evaluateBonusExpression(), isDoubleRoll(), resolvePercentileCheck(), ResolvePercentileCheckInput, ResolvePercentileCheckResult, rollPercentile()

### Community 68 - "MissivesPopover.vue"
Cohesion: 0.25
Nodes (8): emit, isActive, { isOpen, close, toggle }, { preview, unreadCount, error, refreshMissives, markMissiveAsRead }, rootRef, route, triggerRef, getNotificationDisplayMessage()

### Community 69 - "CampaignSummary"
Cohesion: 0.22
Nodes (8): UseCampaignManagementOptions, UseCampaignSessionsOptions, PaginatedCampaigns, CampaignSummary, campaign, createSessions(), dependencies, existingSession

### Community 70 - "isTwoHandedWeapon"
Cohesion: 0.29
Nodes (8): availableWeapons, isWeaponOnThisHand(), weaponHandsLabel(), weaponLocationHint(), weaponPrimaryLabel(), isTwoHandedWeapon(), normalizeWeaponName(), weaponEquippedOptions()

### Community 71 - "StateCycleBadge.vue"
Cohesion: 0.29
Nodes (7): BadgeStateOption, BadgeStateValue, currentIndex, currentOption, cycleState(), emit, props

### Community 72 - "Role"
Cohesion: 0.29
Nodes (6): Context, Memory, Report, Role, Rules, Tasks

### Community 73 - "CharacterValueCard.vue"
Cohesion: 0.48
Nodes (6): emit, hasMax, onCurrentInput(), onMaxInput(), props, toNonNegativeInteger()

### Community 74 - "closeSkillMastery"
Cohesion: 0.40
Nodes (5): closeSkillMastery(), onSkillMasteryKeydown(), onSkillMasteryPointerDown(), selectSkillMastery(), toggleSkillMastery()

### Community 75 - "withRetry"
Cohesion: 0.21
Nodes (14): getCharacterById(), listCharactersByCampaign(), listCharactersForUser(), mapCharacter(), mapCharacterStat(), normalizeNonNegativeInteger(), resolveCareerNames(), resolveOwnerAvatars() (+6 more)

### Community 76 - "@storybook/vue3-vite"
Cohesion: 0.25
Nodes (5): @storybook/vue3-vite, currentYear, Default, meta, config

### Community 77 - "wjdr"
Cohesion: 0.29
Nodes (6): Commands, Layout, RTK, Rules, Skills, wjdr

### Community 78 - "charactersRepository.ts"
Cohesion: 0.22
Nodes (15): createCharacterForCampaign(), createInitialStats(), resolveDefaultCareerId(), setCharacterWoundsStatCurrentAdvanced(), CharacterGender, CharacterRace, CreateCharacterPayload, BasicProfileRow (+7 more)

### Community 79 - "resetCatalogModalState"
Cohesion: 0.40
Nodes (6): closeCatalogModal(), onCatalogDialogClosed(), openCatalogModal(), resetCatalogModalState(), resetNewItemForm(), resetSelectedItemsSettings()

### Community 80 - "preview.ts"
Cohesion: 0.29
Nodes (4): msw-storybook-addon, @storybook/vue3, preview, supabaseClient

### Community 81 - "useNotificationsLoad.ts"
Cohesion: 0.33
Nodes (4): useNotificationsLoad(), UseNotificationsLoadOptions, NotificationItem, dependencies

### Community 82 - "loadSessionDetail"
Cohesion: 0.40
Nodes (5): loadSessionDetail(), onCharacterCreated(), {
  sessionCreateLoading,
  sessionCreateError,
  sessionCreateDateError,
  sessionCreateForm,
  sessionTimelineFilter,
  sessionDeleteBusyId,
  sessionEditId,
  sessionEditBusyId,
  sessionEditError,
  sessionEditDateError,
  sessionEditForm,
  sessionActionSuccessMessage,
  timelineSessions,
  nextSession,
  timelineStats,
  getSessionDateStatus,
  formatCampaignSessionDate,
  formatCampaignSessionDateCompact,
  formatCampaignSessionTitle,
  buildCampaignSessionDetailLink,
  createCampaignSession,
  startSessionEdit,
  cancelSessionEdit,
  saveSessionEdit,
  deleteCampaignSession,
}, { subscribe, unsubscribe }, toggleSessionArchivedState()

### Community 83 - "formatSessionNoteLabel"
Cohesion: 0.67
Nodes (3): formatCampaignSessionDateCompact(), focusNotesPanel(), formatSessionNoteLabel()

### Community 84 - "package.json"
Cohesion: 0.07
Nodes (33): msw, workerDirectory, name, private, type, version, browser-image-compression, check-password-strength (+25 more)

### Community 85 - "Role"
Cohesion: 0.33
Nodes (5): Context, Report, Role, Rules, Tasks

### Community 86 - "Role"
Cohesion: 0.33
Nodes (5): Context, Report, Role, Rules, Tasks

### Community 87 - "Role"
Cohesion: 0.33
Nodes (5): Context, Memory, Report, Role, Tasks

### Community 88 - "Role"
Cohesion: 0.33
Nodes (5): Context, Report, Role, Rules, Tasks

### Community 89 - "Role"
Cohesion: 0.33
Nodes (5): Checks, Context, Report, Role, Tasks

### Community 90 - "Add tests"
Cohesion: 0.33
Nodes (5): Add tests, Rules, Tools, Verify, When

### Community 91 - "daisyUI + Tailwind UI"
Cohesion: 0.33
Nodes (5): daisyUI + Tailwind UI, Rules, Tools, Verify, When

### Community 92 - "Fix lint"
Cohesion: 0.33
Nodes (5): Fix lint, Rules, Tools, Verify, When

### Community 93 - "Lint, typecheck, hooks"
Cohesion: 0.33
Nodes (5): Lint, typecheck, hooks, Rules, Tools, Verify, When

### Community 94 - "New component"
Cohesion: 0.33
Nodes (5): New component, Rules, Tools, Verify, When

### Community 95 - "New migration"
Cohesion: 0.33
Nodes (5): New migration, Rules, Tools, Verify, When

### Community 96 - "New store"
Cohesion: 0.33
Nodes (5): New store, Rules, Tools, Verify, When

### Community 97 - "Playwright e2e"
Cohesion: 0.33
Nodes (5): Playwright e2e, Rules, Tools, Verify, When

### Community 98 - "Review changes"
Cohesion: 0.33
Nodes (5): Review changes, Rules, Tools, Verify, When

### Community 99 - "Storybook + Vitest"
Cohesion: 0.33
Nodes (5): Rules, Storybook + Vitest, Tools, Verify, When

### Community 100 - "Supabase data access"
Cohesion: 0.33
Nodes (5): Rules, Supabase data access, Tools, Verify, When

### Community 101 - "Supabase migrations"
Cohesion: 0.33
Nodes (5): Rules, Supabase migrations, Tools, Verify, When

### Community 102 - "Vercel serverless"
Cohesion: 0.33
Nodes (5): Rules, Tools, Vercel serverless, Verify, When

### Community 103 - "Vue 3 + Pinia"
Cohesion: 0.33
Nodes (5): Rules, Tools, Verify, Vue 3 + Pinia, When

### Community 104 - "Warhammer domain"
Cohesion: 0.33
Nodes (5): Rules, Tools, Verify, Warhammer domain, When

### Community 105 - "SessionAccessRequest.vue"
Cohesion: 0.33
Nodes (5): errorMessage, props, requesting, sendRequest(), successMessage

### Community 106 - "vercel.json"
Cohesion: 0.40
Nodes (4): framework, headers, rewrites, $schema

### Community 107 - "DataGrid.vue"
Cohesion: 0.50
Nodes (3): canGoNext, canGoPrevious, Props

## Knowledge Gaps
- **16 isolated node(s):** `tailwindcss`, `@chromatic-com/storybook`, `@storybook/addon-a11y`, `@storybook/addon-docs`, `@storybook/addon-onboarding` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 932 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vue` connect `vue` to `CharacterDetailView.vue`, `useCampaignManagement.ts`, `ProfileView.vue`, `CampaignDetailView.vue`, `offlineQueueRepository.ts`, `EquipmentSlotPickerModal.vue`, `useCampaignSessions.ts`, `SessionNotesPanel.vue`, `AuthForm.vue`, `validation.ts`, `equipmentSlots.ts`, `CharacterEquipmentDoll.vue`, `routes.ts`, `@lucide/vue`, `CampaignListView.vue`, `vue-router`, `CampaignTimelineSessionDetailView.vue`, `ThemeToggle.vue`, `useOptimisticUpdate`, `CharacterListView.vue`, `CampaignCreateModal.vue`, `auth.ts`, `CharacterCreateModal.vue`, `NotificationsView.vue`, `useMissivesInbox.ts`, `useRealtimeChannels.ts`, `domain.ts`, `CharacterMoneyCard.vue`, `SessionSummary`, `vitest`, `HealthHeart.vue`, `NavBar.vue`, `CharacteristicCard.vue`, `NavMobileMenu.vue`, `@vueuse/core`, `saveQuickFields`, `FortuneClover.vue`, `MissivesPopover.vue`, `CampaignSummary`, `StateCycleBadge.vue`, `CharacterValueCard.vue`, `useNotificationsLoad.ts`, `package.json`, `SessionAccessRequest.vue`, `DataGrid.vue`?**
  _High betweenness centrality (0.219) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `useCampaignSessions()` (e.g. with `buildCampaignSessionDetailLink()` and `cancelSessionEdit()`) actually correct?**
  _`useCampaignSessions()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `tailwindcss`, `@chromatic-com/storybook`, `@storybook/addon-a11y` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CharacterDetailView.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.017088174982911826 - nodes in this community are weakly interconnected._
- **Why does `@lucide/vue` connect `@lucide/vue` to `CharacterDetailView.vue`, `ProfileView.vue`, `CampaignDetailView.vue`, `EquipmentSlotPickerModal.vue`, `useCampaignSessions.ts`, `validation.ts`, `equipmentSlots.ts`, `CharacterEquipmentDoll.vue`, `vue-router`, `ThemeToggle.vue`, `NotificationsView.vue`, `domain.ts`, `CharacterMoneyCard.vue`, `HealthHeart.vue`, `NavBar.vue`, `CampaignSessionsSection.vue`, `NavMobileMenu.vue`, `@vueuse/core`, `MissivesPopover.vue`, `package.json`, `SessionAccessRequest.vue`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Should `useCampaignManagement.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07179487179487179 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `vitest` to `useCampaignManagement.ts`, `ProfileView.vue`, `characterLinksRepository.ts`, `offlineQueueRepository.ts`, `useCampaignSessions.ts`, `SessionNotesPanel.vue`, `validation.ts`, `routes.ts`, `vue`, `notificationsRepository.ts`, `careersRepository.ts`, `vue-router`, `ThemeToggle.vue`, `useOptimisticUpdate`, `CharacterListView.vue`, `auth.ts`, `NotificationsView.vue`, `useMissivesInbox.ts`, `useRealtimeChannels`, `campaignsRepository.ts`, `useRealtimeChannels.ts`, `ui-ux-audit.spec.ts`, `SessionSummary`, `equipmentSlots.test.ts`, `NavBar.vue`, `campaignCodeRedirect.ts`, `sessionsRepository.ts`, `@vueuse/core`, `saveQuickFields`, `catalogRepository.ts`, `dice.ts`, `CampaignSummary`, `withRetry`, `useNotificationsLoad.ts`, `package.json`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._