# Graph Report - wjdr  (2026-10-23)

## Corpus Check
- 464 files · ~261,738 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .css 2, .lock 1)

## Summary
- 3177 nodes · 6620 edges · 186 communities (172 shown, 14 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 259 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5496db74`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CharacterDetailView.vue
- invitationsRepository.ts
- ProfileView.vue
- throwIfError
- CampaignDetailView.vue
- weapon_attributes_setter.py
- offlineQueueRepository.ts
- EquipmentSlotPickerModal.vue
- safeErrorMessage
- useCampaignSessions.ts
- SessionNotesPanel.vue
- AuthForm.vue
- notificationsRepository.ts
- useCharacterCareer
- equipmentSlots.ts
- CharacterEquipmentDoll.vue
- routes.ts
- src/main.ts
- extract_spells.py
- careersRepository.ts
- HomeView.vue
- devDependencies
- compilerOptions
- CampaignListView.vue
- AccountPopover.vue
- CampaignTimelineSessionDetailView.vue
- themeTransition.test.ts
- useCampaignSessions
- useOptimisticUpdate
- CharacterListView.vue
- scripts
- CampaignCreateModal.vue
- useAuthStore
- CharacterCreateModal.vue
- NotificationsView.vue
- MissivesPopover.vue
- useRealtimeChannels
- campaignsRepository.ts
- storybook
- useRealtimeChannels.ts
- domain.ts
- CharacterMoneyCard.vue
- supabaseAuth.ts
- SessionNotesListCard.vue
- useSessionNotesFiltering.ts
- useCopyFeedback
- equipmentSlots.test.ts
- HealthHeart.vue
- NavBar.vue
- dependencies
- UI/UX Audit Post-Test Checklist (Playwright)
- campaignCodeRedirect.ts
- MarkdownEditor.vue
- CampaignSessionsSection.vue
- CharacteristicCard.vue
- @lucide/vue
- compilerOptions
- sessionsRepository.ts
- SessionNotesCreateCard.vue
- MobileLayout.vue
- useCharacterQuickSave
- useCharacterCatalogActions.ts
- secret-guard.cjs
- FortuneClover.vue
- Warhammer RPG App
- usePagination
- mockServiceWorker.js
- dice.ts
- upload_map_tiles.py
- CatalogAddModal.vue
- CompendiumInventoryView.vue
- CharacterItemsSection.vue
- Role
- CharacterValueCard.vue
- CompendiumCareerGraphView.vue
- charactersRepository.ts
- @storybook/vue3-vite
- wjdr
- db.ts
- utils/characterSheet.ts
- preview.ts
- CharacterSkillsPanel.vue
- MapView.vue
- mapTileCache.ts
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
- compendiumRepository.ts
- vercel.json
- CompendiumSpellsView.vue
- knip.json
- tsconfig.json
- CompendiumSkillsView.vue
- .mcp.json
- useCampaignManagement.ts
- useLeafletMap
- mapCities.ts
- MarkerFormModal.vue
- CompendiumTalentsView.vue
- useCharacterQuickSave.ts
- career_paths_extractor.py
- vitest
- stores/map.ts
- useCareerGraph.ts
- vue
- sessionNotesRepository.ts
- CharacterOverview.stories.ts
- scrape_cities.py
- MarkerFormModal.stories.ts
- useOfflineQueueSync
- useCampaignTable.ts
- profileRepository.ts
- types/map.ts
- handleSaveEdit
- CatalogAddModal.stories.ts
- SessionCreatePanel.vue
- useMapTileCache.ts
- CampaignSessionCompactRow.stories.ts
- useLeafletMap.ts
- associate
- useSessionNoteEditor.ts
- compendiumInventory.ts
- CareerChangeModal.stories.ts
- CharacterSyncStatus.stories.ts
- useCompendiumInventoryFilters.ts
- useCompendiumSpellFilters.ts
- mapTilesRepository.ts
- DescriptionModal.stories.ts
- AppCard.vue
- useMapTilePrefetch.ts
- CareerConfirmModal.stories.ts
- CharacteristicCard.stories.ts
- createTileCache
- mapSearchCities.test.ts
- insert_missing_spells
- useAppSplashDismiss.ts
- CharacterProfilePanel.stories.ts
- CompendiumEntryCard.vue
- getEquippedArmorsForSlot
- App.vue
- ThemeToggle.vue
- MapSearch.stories.ts
- wrap_query
- getWeaponForSlot
- fixtures/supabase.ts
- Update quick-facts
- MapLayerPanel.vue
- compendiumSpells.ts
- withRetry
- Git cascade
- CampaignDetailTabs.vue
- Role
- CampaignManagementSection.vue
- Role
- AppSplash.vue
- changeEmail
- knip-triage/SKILL.md
- wjdr

## God Nodes (most connected - your core abstractions)
1. `vue` - 154 edges
2. `vitest` - 104 edges
3. `throwIfError()` - 99 edges
4. `@lucide/vue` - 54 edges
5. `useAuthStore` - 38 edges
6. `safeErrorMessage()` - 38 edges
7. `pinia` - 33 edges
8. `useCampaignSessions()` - 31 edges
9. `@vueuse/core` - 30 edges
10. `useCharacterEquipment()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `Scripts` --references--> `load_env()`  [INFERRED]
  docs/data-pipeline.md → scripts/data/_common.py
- `3. Scripts Python (`scripts/data/`)` --references--> `load_env()`  [INFERRED]
  migrations/README.md → scripts/data/_common.py
- `Composables de la fiche personnage` --references--> `useCharacterCareer()`  [INFERRED]
  docs/architecture.md → src/composables/useCharacterCareer.ts
- `Composables de la fiche personnage` --references--> `useCharacterCatalogActions()`  [INFERRED]
  docs/architecture.md → src/composables/useCharacterCatalogActions.ts
- `Composables de la fiche personnage` --references--> `useCharacterDescriptionModal()`  [INFERRED]
  docs/architecture.md → src/composables/useCharacterDescriptionModal.ts

## Import Cycles
- None detected.

## Communities (186 total, 14 thin omitted)

### Community 0 - "CharacterDetailView.vue"
Cohesion: 0.08
Nodes (26): CatalogSection, emit, emit, model, props, TABS, prefetchFrequentAuthenticatedViews(), CharacterDetailView() (+18 more)

### Community 1 - "invitationsRepository.ts"
Cohesion: 0.16
Nodes (22): missing, supabase, createCampaignInvitations(), invitationMarker(), invitationTitle(), isInvitationForCampaign(), legacyInvitationTitle(), NotificationRow (+14 more)

### Community 2 - "ProfileView.vue"
Cohesion: 0.07
Nodes (28): browser-image-compression, ProfileView(), authStore, avatarCompressionOptions, avatarError, avatarLoadFailed, avatarSuccess, email (+20 more)

### Community 3 - "throwIfError"
Cohesion: 0.11
Nodes (42): ArmorLinkRow, characterLinksCache, cloneLinksBundle(), getArmorEncumbrance(), getWeaponEncumbrance(), groupByCharacter(), InventoryLinkTable, ItemLinkRow (+34 more)

### Community 4 - "CampaignDetailView.vue"
Cohesion: 0.05
Nodes (45): clearManagementState(), refreshMjData(), activeCampaignTab, archiveBusy, authStore, campaignId, CampaignTab, campaignTabs (+37 more)

### Community 5 - "weapon_attributes_setter.py"
Cohesion: 0.10
Nodes (8): configure_logging(), create_supabase_client(), load_env(), load_seed(), main(), push(), main(), populate_database()

### Community 6 - "offlineQueueRepository.ts"
Cohesion: 0.14
Nodes (24): nanoid, clearQueuedUpdates(), db, enqueueOfflineUpdate(), generateId, incrementQueuedRetry(), listQueuedUpdates(), mergePayload() (+16 more)

### Community 7 - "EquipmentSlotPickerModal.vue"
Cohesion: 0.11
Nodes (25): armorActionLabel(), availableWeapons, depthMarks, dialogRef, emit, equippedArmors, filteredWeapons, inventoryArmors (+17 more)

### Community 8 - "safeErrorMessage"
Cohesion: 0.22
Nodes (35): useCharacterEquipment(), ensureArmorCanBeEquipped(), onArmorQualityChange(), onDeleteArmor(), onDeleteWeapon(), onEquipArmorFromDoll(), onEquipWeaponFromDoll(), onUnequipArmorFromDoll() (+27 more)

### Community 9 - "useCampaignSessions.ts"
Cohesion: 0.11
Nodes (33): day, month, parsedDate, props, relativeLabel, status, emit, isToday (+25 more)

### Community 10 - "SessionNotesPanel.vue"
Cohesion: 0.06
Nodes (26): canCreateNote, createCardTitle, createContentError, createError, createForm, createFormView, creating, { draft, clearOnSuccess } (+18 more)

### Community 11 - "AuthForm.vue"
Cohesion: 0.06
Nodes (28): authFormStore, authStore, email, emailError, formSubmitted, identifier, identifierError, isLogin (+20 more)

### Community 12 - "notificationsRepository.ts"
Cohesion: 0.11
Nodes (26): check-password-strength, inputId, model, props, reveal, strength, errorMessage, props (+18 more)

### Community 13 - "useCharacterCareer"
Cohesion: 0.13
Nodes (21): CareerCharacter, useCharacterCareer(), applyCareerChange(), closeCareerConfirmModal(), closeCareerModal(), confirmCareerChange(), loadCareerPathOptions(), onCareerConfirmDialogClosed() (+13 more)

### Community 14 - "equipmentSlots.ts"
Cohesion: 0.21
Nodes (13): ArmorByLocation, ArmorDataLocation, ArmorSlotDefinition, ArmorSlotId, EquipmentSlotId, WeaponPreferredHand, WeaponSlotDefinition, WeaponSlotId (+5 more)

### Community 15 - "CharacterEquipmentDoll.vue"
Cohesion: 0.09
Nodes (18): activeSlotId, ArmorSlotView, armorViewById, armorViews, buildArmorSlotView(), buildWeaponSlotView(), emit, highlightedLocation (+10 more)

### Community 16 - "routes.ts"
Cohesion: 0.10
Nodes (18): buildLegacySessionDetailRedirect(), buildLegacySessionTimelineRedirect(), LEGACY_SESSIONS_INDEX_REDIRECT, appRoutes, CampaignDetailView(), MapView(), NotFoundView(), OldWorldMapView() (+10 more)

### Community 17 - "src/main.ts"
Cohesion: 0.21
Nodes (9): emit, onAnimationEnd(), viewBox, applyAppSplashCssVars(), getAppSplashViewBox(), app, pinia, themeStore (+1 more)

### Community 18 - "extract_spells.py"
Cohesion: 0.06
Nodes (23): apply_spell_fix_results(), clean_text(), compare(), execute_spell_enrichment(), execute_spells_fixes(), extract_row_fields(), fill_spell_duration_range(), get_spells() (+15 more)

### Community 19 - "careersRepository.ts"
Cohesion: 0.19
Nodes (15): FRENCH_SORT_OPTIONS, listAllCareerPaths(), listAllCareers(), listCareerCharacteristicsByCareerId(), listCareerPathCareersByFromCareerId(), mapCareerPathCareer(), normalizeCareerId(), useCareerGraphStore (+7 more)

### Community 20 - "HomeView.vue"
Cohesion: 0.11
Nodes (13): isAvailable, isFeatured, props, surfaceTag, HomeFeature, homeFeatures, HomePillar, homePillars (+5 more)

### Community 21 - "devDependencies"
Cohesion: 0.05
Nodes (37): devDependencies, @chromatic-com/storybook, daisyui, eslint, @eslint/js, eslint-plugin-storybook, eslint-plugin-vue, fake-indexeddb (+29 more)

### Community 22 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 23 - "CampaignListView.vue"
Cohesion: 0.10
Nodes (21): CampaignListView(), authStore, campaignCreateModalStore, campaigns, campaignsList, errorMessage, { feedbackMap, copyText, copyLink }, goToNextPage() (+13 more)

### Community 24 - "AccountPopover.vue"
Cohesion: 0.22
Nodes (9): ariaLabel, authStore, avatarUrl, displayName, emit, { isOpen, close, toggle }, { logout }, rootRef (+1 more)

### Community 25 - "CampaignTimelineSessionDetailView.vue"
Cohesion: 0.11
Nodes (21): @vueuse/router, CampaignTimelineSessionDetailView(), authStore, campaign, campaignId, errorMessage, formatCampaignSessionDate(), formatCampaignSessionDateCompact() (+13 more)

### Community 26 - "themeTransition.test.ts"
Cohesion: 0.23
Nodes (10): AnimatedThemeToggleOptions, getThemeTransitionClipPaths(), polygonCollapsed(), runAnimatedThemeToggle(), ThemeTransitionVariant, animate, removeProperty, root (+2 more)

### Community 27 - "useCampaignSessions"
Cohesion: 0.15
Nodes (19): useCampaignSessions(), cancelSessionEdit(), createCampaignSession(), deleteCampaignSession(), formatCampaignSessionDate(), formatCampaignSessionDateCompact(), formatCampaignSessionTitle(), getSessionDateStatus() (+11 more)

### Community 28 - "useOptimisticUpdate"
Cohesion: 0.19
Nodes (14): useLiveSave(), triggerSave(), triggerSaveNow(), MergePatch, SaveStatus, useOptimisticUpdate(), cancel(), flush() (+6 more)

### Community 29 - "CharacterListView.vue"
Cohesion: 0.11
Nodes (19): LoadingState, LoadingStateOptions, useLoadingState(), execute(), reset(), useSingleItemRedirect(), redirectIfSingle(), CharacterListView() (+11 more)

### Community 30 - "scripts"
Cohesion: 0.12
Nodes (16): scripts, build, build-storybook, coverage, dev, knip, lint, lint:fix (+8 more)

### Community 31 - "CampaignCreateModal.vue"
Cohesion: 0.12
Nodes (18): authStore, description, dialogRef, errorMessage, generateAlphaNumeric, generateCampaignCode(), lastFocusedElement, loading (+10 more)

### Community 32 - "useAuthStore"
Cohesion: 0.12
Nodes (25): pinia, UseCampaignManagementOptions, CurrentContext, CurrentContextInput, CurrentRole, resolveCurrentContext(), useCurrentContext(), useLogout() (+17 more)

### Community 33 - "CharacterCreateModal.vue"
Cohesion: 0.13
Nodes (14): close(), dialogRef, emit, errorMessage, gender, genderOptions, loading, name (+6 more)

### Community 34 - "NotificationsView.vue"
Cohesion: 0.10
Nodes (25): clearAllBusy(), useNotificationsLoad(), load(), UseNotificationsLoadOptions, NotificationsView(), deleteNotification(), extractNotificationSessionId(), getNotificationDisplayMessage() (+17 more)

### Community 35 - "MissivesPopover.vue"
Cohesion: 0.18
Nodes (14): emit, isActive, { isOpen, close, toggle }, { preview, unreadCount, error, refreshMissives, markMissiveAsRead }, rootRef, route, triggerRef, useMissivesInbox() (+6 more)

### Community 36 - "useRealtimeChannels"
Cohesion: 0.20
Nodes (13): useRealtimeChannels(), dispatchUpdate(), subscribe(), unsubscribe(), RealtimeEvent, RealtimeSyncSubscription, useRealtimeSync(), start() (+5 more)

### Community 37 - "campaignsRepository.ts"
Cohesion: 0.27
Nodes (12): createCampaign(), getCampaignById(), listCampaignsForUser(), listCampaignsForUserPaginated(), mapCampaign(), mapCampaignWriteError(), updateCampaignArchivedState(), isUuidLike() (+4 more)

### Community 38 - "storybook"
Cohesion: 0.29
Nodes (6): storybook, Empty, meta, Preview, Story, WithDraft

### Community 39 - "useRealtimeChannels.ts"
Cohesion: 0.16
Nodes (13): LINK_TABLES, useCharacterRealtime(), cancelDeferred(), requestExternalCharacterRefresh(), UseCharacterRealtimeOptions, RealtimeEvent, RealtimeTableSubscription, RealtimeUpdatePayload (+5 more)

### Community 40 - "domain.ts"
Cohesion: 0.11
Nodes (25): emit, encumbranceMultiplier, isOverloaded, props, props, resolvedDestinyTotal, CharacterLinks, UseCharacterEquipmentOptions (+17 more)

### Community 41 - "CharacterMoneyCard.vue"
Cohesion: 0.24
Nodes (14): closeSubtractDialog(), confirmSubtract(), emit, onCopperInput(), onGoldInput(), onMoneyFieldBlur(), onSilverInput(), onSubtractDialogClosed() (+6 more)

### Community 42 - "supabaseAuth.ts"
Cohesion: 0.05
Nodes (27): E2E with fake Supabase, Fixture, Rules, Verify, When, @playwright/test, armors, items (+19 more)

### Community 43 - "SessionNotesListCard.vue"
Cohesion: 0.27
Nodes (7): emit, expandedNoteIds, onEditDraftFieldInput(), onLinkedSessionFilterChange(), onSearchQueryUpdate(), props, SessionNoteEditDraft

### Community 44 - "useSessionNotesFiltering.ts"
Cohesion: 0.33
Nodes (10): computeSearchScore(), countOccurrences(), formatSessionDate(), formatSessionLabel(), useSessionNotesFiltering(), resolveSessionLabel(), UseSessionNotesFilteringOptions, SessionNote (+2 more)

### Community 45 - "useCopyFeedback"
Cohesion: 0.21
Nodes (9): useCopyFeedback(), copy(), copyLink(), copyText(), useCopyLink(), copyCampaignCode(), copyCampaignLink(), clipboard (+1 more)

### Community 46 - "equipmentSlots.test.ts"
Cohesion: 0.24
Nodes (10): armorByLocation, armorCoversLocation(), computeArmorByLocation(), countEquippedArmorsForLocation(), findConflictingArmors(), getArmorCoveredLocations(), getArmorStackLimitLocations(), isWeaponHand() (+2 more)

### Community 47 - "HealthHeart.vue"
Cohesion: 0.10
Nodes (18): clampedCurrentHp, currentHp, emit, heartBeatFrequency, hpColorClass, hpPercentage, isBeating, props (+10 more)

### Community 48 - "NavBar.vue"
Cohesion: 0.10
Nodes (17): msw, @pinia/testing, accountRef, authStore, isAuthenticated, { isScrolled }, missivesRef, mobileMenuOpen (+9 more)

### Community 49 - "dependencies"
Cohesion: 0.08
Nodes (24): dependencies, browser-image-compression, check-password-strength, @dagrejs/dagre, dexie, dompurify, graphology, graphology-shortest-path (+16 more)

### Community 50 - "UI/UX Audit Post-Test Checklist (Playwright)"
Cohesion: 0.14
Nodes (13): 10) Mobile-Specific Pass, 11) Desktop-Specific Pass, 1) App Shell, Semantics, Keyboard A11y, 2) Navbar Reactive States + Touch Targets, 3) Forms + Submit Feedback, 4) Character Detail Visual Tokens + Responsive Overflow, 5) Session List, Session Detail, and Notes Refresh, 6) Character Detail Realtime + Cache Stability (+5 more)

### Community 51 - "campaignCodeRedirect.ts"
Cohesion: 0.14
Nodes (19): getAuthToken(), getRequestOrigin(), getRequiredEnv(), handler(), rateLimiter, @supabase/supabase-js, CampaignCodeLookup, CampaignCodeResolutionContext (+11 more)

### Community 52 - "MarkdownEditor.vue"
Cohesion: 0.05
Nodes (32): dompurify, marked, html, props, isPreview, MarkdownFormat, mode, model (+24 more)

### Community 53 - "CampaignSessionsSection.vue"
Cohesion: 0.20
Nodes (10): emit, isCreatePanelOpen, openCreatePanel(), SessionCreateForm, SessionEditForm, SessionTimelineFilter, emit, onSessionEditFieldInput() (+2 more)

### Community 54 - "CharacteristicCard.vue"
Cohesion: 0.24
Nodes (11): cardToneClass, emit, onBaseInput(), onCardClick(), onTickDown(), onTickUp(), onTotalAdvancedInput(), props (+3 more)

### Community 55 - "@lucide/vue"
Cohesion: 0.14
Nodes (16): @lucide/vue, { campaign, campaignTo, sessionTo, navContext }, links, props, route, { logout }, { navContext }, open (+8 more)

### Community 56 - "compilerOptions"
Cohesion: 0.15
Nodes (12): @vue/tsconfig/tsconfig.dom.json, compilerOptions, erasableSyntaxOnly, noFallthroughCasesInSwitch, noImplicitAny, noUnusedLocals, noUnusedParameters, strict (+4 more)

### Community 57 - "sessionsRepository.ts"
Cohesion: 0.28
Nodes (11): createSession(), deleteSession(), getSessionById(), listSessionsForCampaign(), mapSession(), mapSessionWriteError(), updateSession(), SessionRow (+3 more)

### Community 58 - "SessionNotesCreateCard.vue"
Cohesion: 0.19
Nodes (9): { isMobile }, dialogRef, emit, { isMobile }, props, SessionNoteCreateForm, useDeviceBreakpoint(), UseDeviceBreakpointOptions (+1 more)

### Community 59 - "MobileLayout.vue"
Cohesion: 0.08
Nodes (24): vue-router, PopoverPanelOptions, usePopoverPanel(), close(), toggle(), { isMobile }, layoutComponent, { refresh } (+16 more)

### Community 60 - "useCharacterQuickSave"
Cohesion: 0.11
Nodes (22): Composables de la fiche personnage, useCharacterFeedback(), setActionSuccess(), emptyEditable(), useCharacterQuickSave(), collectDirtyFields(), markSavedEditable(), onMoneyCommit() (+14 more)

### Community 61 - "useCharacterCatalogActions.ts"
Cohesion: 0.11
Nodes (33): CATALOG_LABELS, CatalogSection, formatCatalogOptionLabel(), ItemQuality, useCharacterCatalogActions(), closeCatalogModal(), confirmCatalogAdd(), confirmItemCreate() (+25 more)

### Community 62 - "secret-guard.cjs"
Cohesion: 0.23
Nodes (11): args, deny(), findSecret(), flatten(), fs, handle(), leaves(), META_KEYS (+3 more)

### Community 63 - "FortuneClover.vue"
Cohesion: 0.12
Nodes (17): activeTokenClass, emit, onMaxPointsInput(), props, resolvedMaxPoints, resolvedPoints, setPoints(), tokenGridStyle (+9 more)

### Community 64 - "Warhammer RPG App"
Cohesion: 0.04
Nodes (40): AGENTS, API Vercel, Architecture, Routes (`src/router/routes.ts`), Règles, Structure de `src/`, Données, Flux (+32 more)

### Community 65 - "usePagination"
Cohesion: 0.27
Nodes (8): PaginationNavigateOptions, PaginationOptions, usePagination(), goToNextPage(), goToPreviousPage(), nextPage(), previousPage(), resetPage()

### Community 66 - "mockServiceWorker.js"
Cohesion: 0.36
Nodes (8): activeClientIds, getResponse(), handleRequest(), IS_MOCKED_RESPONSE, resolveMainClient(), respondWithMock(), sendToClient(), serializeRequest()

### Community 67 - "dice.ts"
Cohesion: 0.36
Nodes (7): clampPercentileTarget(), evaluateBonusExpression(), isDoubleRoll(), resolvePercentileCheck(), ResolvePercentileCheckInput, ResolvePercentileCheckResult, rollPercentile()

### Community 68 - "upload_map_tiles.py"
Cohesion: 0.08
Nodes (11): build_index(), collect_tiles(), get_client(), is_duplicate(), is_transient(), list_existing(), list_existing_folder(), main() (+3 more)

### Community 69 - "CatalogAddModal.vue"
Cohesion: 0.06
Nodes (29): dialog, emit, emptyMessage, filterMode, FILTERS, isOnline, props, query (+21 more)

### Community 70 - "CompendiumInventoryView.vue"
Cohesion: 0.06
Nodes (29): CompendiumInventoryView(), activeList, activeTab, armorConfig, armorFilters, errorMessage, facetEntries, filters (+21 more)

### Community 71 - "CharacterItemsSection.vue"
Cohesion: 0.06
Nodes (34): emit, filter, filtered, filters, isOnline, props, stats, emit (+26 more)

### Community 72 - "Role"
Cohesion: 0.29
Nodes (6): Context, Memory, Report, Role, Rules, Tasks

### Community 73 - "CharacterValueCard.vue"
Cohesion: 0.48
Nodes (6): emit, hasMax, onCurrentInput(), onMaxInput(), props, toNonNegativeInteger()

### Community 74 - "CompendiumCareerGraphView.vue"
Cohesion: 0.08
Nodes (28): @vue-flow/background, @vue-flow/controls, @vue-flow/core, buildCareerGraph(), layoutSubgraph(), predecessorsOf(), successorsOf(), CompendiumCareerGraphView() (+20 more)

### Community 75 - "charactersRepository.ts"
Cohesion: 0.22
Nodes (19): createCharacterForCampaign(), createInitialStats(), getCharacterById(), listCampaignCharacterSheets(), listCharactersByCampaign(), listCharactersForUser(), mapCharacter(), mapCharacterStat() (+11 more)

### Community 76 - "@storybook/vue3-vite"
Cohesion: 0.10
Nodes (18): @storybook/vue3-vite, Default, meta, CitiesToggle, HiddenCityTypeIsUnchecked, HiddenTypeIsUnchecked, meta, PoiSwitchOffDisablesAllTypeFilters (+10 more)

### Community 77 - "wjdr"
Cohesion: 0.29
Nodes (6): Commands, Layout, RTK, Rules, Skills, wjdr

### Community 78 - "db.ts"
Cohesion: 0.14
Nodes (16): CharacterGender, CharacterRace, CreateCharacterPayload, BasicProfileRow, CampaignMarkerRow, CampaignRow, CareerCharacteristicRow, CareerRow (+8 more)

### Community 79 - "utils/characterSheet.ts"
Cohesion: 0.09
Nodes (20): bonusEndurance, bonusForce, maxEncumbrance, totalEncumbrance, allExpanded, emit, expandedCodes, props (+12 more)

### Community 80 - "preview.ts"
Cohesion: 0.29
Nodes (4): msw-storybook-addon, @storybook/vue3, preview, supabaseClient

### Community 81 - "CharacterSkillsPanel.vue"
Cohesion: 0.09
Nodes (26): activeMasteryId, closeMastery(), emit, isOnline, MASTERY_LEVELS, MasteryLevel, onKeydown(), onPointerDown() (+18 more)

### Community 82 - "MapView.vue"
Cohesion: 0.07
Nodes (23): emit, open, pick(), props, query, MapSearchResult, { campaignId, role, userId }, editing (+15 more)

### Community 83 - "mapTileCache.ts"
Cohesion: 0.11
Nodes (14): dexie, db, MapTileDb, mapTileTable, TileRecord, requestPersistentStorage(), TileCache, TileCacheOptions (+6 more)

### Community 84 - "package.json"
Cohesion: 0.06
Nodes (38): msw, workerDirectory, name, private, type, version, @chromatic-com/storybook, daisyui (+30 more)

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
Cohesion: 0.25
Nodes (7): Rules, Tools, Verify, Warhammer domain, When, career(), character()

### Community 105 - "compendiumRepository.ts"
Cohesion: 0.17
Nodes (23): compareByNameAndSpecialization(), fetchAllRows(), fetchCompendiumSkills(), fetchCompendiumTalents(), mapLink(), mapLinks(), mapSkill(), mapTalent() (+15 more)

### Community 106 - "vercel.json"
Cohesion: 0.40
Nodes (4): framework, headers, rewrites, $schema

### Community 107 - "CompendiumSpellsView.vue"
Cohesion: 0.09
Nodes (19): canGoNext, canGoPrevious, Props, CompendiumSpellsView(), categorySearch, displayedDescription(), expandedDescriptions, filteredCategories (+11 more)

### Community 108 - "knip.json"
Cohesion: 0.33
Nodes (5): entry, ignore, ignoreExportsUsedInFile, $schema, tags

### Community 110 - "CompendiumSkillsView.vue"
Cohesion: 0.08
Nodes (21): CompendiumDialogLink, dialogRef, emit, props, SkillTypeFilter, CompendiumSkillsView(), CHARACTERISTIC_LABELS, characteristicLabel() (+13 more)

### Community 119 - "useCampaignManagement.ts"
Cohesion: 0.15
Nodes (19): useCampaignManagement(), acceptJoinRequest(), inviteSelectedUsers(), loadInvitations(), loadInviteCandidates(), loadJoinRequests(), rejectJoinRequest(), useConfirmAction() (+11 more)

### Community 121 - "useLeafletMap"
Cohesion: 0.15
Nodes (22): leaflet, container, emit, props, { ready, error, authRequired, setPins, setCities, setCitiesVisible, setSelectedCity, flyTo }, MapPin, useLeafletMap(), createCachedTileLayer() (+14 more)

### Community 122 - "mapCities.ts"
Cohesion: 0.13
Nodes (18): emit, altdorf, CenterEmitsEvent, CloseEmitsEvent, Full, meta, MinimalDetails, Story (+10 more)

### Community 123 - "MarkerFormModal.vue"
Cohesion: 0.11
Nodes (21): confirmingDelete, emit, props, VISIBILITY_LABELS, coordinates, dialogRef, emit, form (+13 more)

### Community 124 - "CompendiumTalentsView.vue"
Cohesion: 0.10
Nodes (18): @vueuse/core, useIncrementalReveal(), loadMore(), UseIncrementalRevealOptions, CompendiumTalentsView(), dialogBadges, errorMessage, isLoading (+10 more)

### Community 125 - "useCharacterQuickSave.ts"
Cohesion: 0.18
Nodes (21): CORE_COLUMNS, CORE_FIELDS, CoreColumns, CoreField, CorePatch, EditableCharacterState, StatPatch, UseCharacterQuickSaveOptions (+13 more)

### Community 126 - "career_paths_extractor.py"
Cohesion: 0.13
Nodes (8): check_pdf_structure(), extract_career_data(), get_careers(), get_id_from_name(), insert_career_data_to_db(), sanitize_characteristics(), sanitize_text(), wrap_query()

### Community 127 - "vitest"
Cohesion: 0.15
Nodes (9): vitest, FilterableTalent, useCompendiumTalentFilters(), compareByName(), compareFr(), searchPlaces(), normalizeSearchText(), slugify() (+1 more)

### Community 128 - "stores/map.ts"
Cohesion: 0.22
Nodes (17): createCampaignMarker(), deleteCampaignMarker(), listBaseMarkers(), listCampaignMarkers(), listMarkerTypes(), mapBaseMarker(), mapCampaignMarker(), mapMarkerType() (+9 more)

### Community 129 - "useCareerGraph.ts"
Cohesion: 0.16
Nodes (19): @dagrejs/dagre, graphology, graphology-shortest-path, buildFromSubgraph(), buildPathSubgraph(), buildTowardSubgraph(), CareerGraphEdge, CareerGraphMode (+11 more)

### Community 130 - "vue"
Cohesion: 0.12
Nodes (10): vue, CharacterListFilter, emit, props, sessionInfoOpenModel, useCharacterDescriptionModal(), closeDescriptionModal(), resetDescriptionModalState() (+2 more)

### Community 131 - "sessionNotesRepository.ts"
Cohesion: 0.17
Nodes (19): buildSessionNotesChannelName(), buildSessionNotesRealtimeSubscriptions(), createSessionNote(), deleteSessionNote(), listSessionNotesForCampaign(), ListSessionNotesOptions, mapSessionNote(), mapSessionNoteWriteError() (+11 more)

### Community 132 - "CharacterOverview.stories.ts"
Cohesion: 0.10
Nodes (17): armor, DwarfDoublesMaxEncumbrance, meta, Overloaded, QuickEditDestinyEmitsNewValue, QuickEditFortuneEmitsNewValue, QuickEditHealthEmitsNewValue, QuickEditMaxFortuneEmitsNewValue (+9 more)

### Community 133 - "scrape_cities.py"
Cohesion: 0.16
Nodes (7): City, clean(), fetch_page(), main(), parse_cities(), parse_item(), parse_population()

### Community 134 - "MarkerFormModal.stories.ts"
Cohesion: 0.13
Nodes (17): baseMarker, campaignMarker, markerTypes, CloseButton, DeleteNeedsConfirmation, EditableCampaignMarker, meta, PendingMarkerHidesActions (+9 more)

### Community 135 - "useOfflineQueueSync"
Cohesion: 0.17
Nodes (14): Offline-first sync, Rules, Tools, Verify, When, useOfflineQueueSync(), flushQueue(), handleOnline() (+6 more)

### Community 136 - "useCampaignTable.ts"
Cohesion: 0.18
Nodes (11): emit, useAsyncList(), clear(), load(), UseAsyncListOptions, CampaignTableEntry, useCampaignTable(), reload() (+3 more)

### Community 137 - "profileRepository.ts"
Cohesion: 0.20
Nodes (16): getProfileSettings(), isValidEmail(), normalizeEmail(), normalizeUsername(), ProfileSettings, reauthenticateWithPassword(), sanitizeFileName(), updateAccountPassword() (+8 more)

### Community 138 - "types/map.ts"
Cohesion: 0.19
Nodes (13): CampaignMarkerPatch, MapMarker, MapRole, MarkerSource, MarkerVisibility, allowedVisibilities(), canEditMarker(), filterMarkers() (+5 more)

### Community 139 - "handleSaveEdit"
Cohesion: 0.24
Nodes (14): canManageNote(), handleDelete(), handleSaveEdit(), handleToggleArchived(), handleToggleVisibility(), loadNotes(), { subscribe }, useBusyOperations() (+6 more)

### Community 140 - "CatalogAddModal.stories.ts"
Cohesion: 0.12
Nodes (14): Adding, Creating, DialogIsLabelledByTitle, Empty, ItemsCreateMode, ItemsSearchMode, meta, OfflineDisablesConfirm (+6 more)

### Community 141 - "SessionCreatePanel.vue"
Cohesion: 0.15
Nodes (13): dateInputRef, emit, onInput(), onSubmit(), props, SessionCreatePanelForm, DateConflict, Empty (+5 more)

### Community 142 - "useMapTileCache.ts"
Cohesion: 0.25
Nodes (10): loadMapTileAvailability(), useMapTileCache(), MAP_TILE_CACHE_MAX_ENTRIES, MAP_TILE_CACHE_PREFIX, MAP_TILE_CACHE_VERSION, loadMapTileIndex(), decodeBase64(), hasIndexedTile() (+2 more)

### Community 143 - "CampaignSessionCompactRow.stories.ts"
Cohesion: 0.12
Nodes (13): baseSession, LongTitle, meta, Past, Story, Today, Upcoming, baseSession (+5 more)

### Community 144 - "useLeafletMap.ts"
Cohesion: 0.22
Nodes (10): LeafletMapHandlers, MAP_BOUNDS, MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, MAP_MAX_ZOOM, MAP_MIN_ZOOM, MAP_OVERSCALE_LEVELS, MAP_TILE_BUCKET (+2 more)

### Community 145 - "associate"
Cohesion: 0.15
Nodes (5): associate(), get_skills_talents_links(), sanitize_string_from_pdf(), sanitize_talents(), wrap_query()

### Community 146 - "useSessionNoteEditor.ts"
Cohesion: 0.22
Nodes (10): handleCreate(), resetCreateForm(), buildNoteDraftKey(), SessionNoteDraft, useSessionNoteDraft(), clearDraft(), clearOnSuccess(), useSessionNoteEditor() (+2 more)

### Community 147 - "compendiumInventory.ts"
Cohesion: 0.19
Nodes (12): fetchCompendiumArmors(), fetchCompendiumItems(), fetchCompendiumWeapons(), mapArmor(), mapItem(), mapWeapon(), useCompendiumInventoryStore, CompendiumArmor (+4 more)

### Community 148 - "CareerChangeModal.stories.ts"
Cohesion: 0.14
Nodes (13): Busy, DialogIsLabelledByTitle, EmptyAllSearch, EmptyPaths, Loading, meta, OfflineDisablesConfirm, SelectAndConfirm (+5 more)

### Community 149 - "CharacterSyncStatus.stories.ts"
Cohesion: 0.15
Nodes (11): emit, label, props, tone, ErrorOfflineDisablesRetry, ErrorWithRetry, meta, PendingOffline (+3 more)

### Community 150 - "useCompendiumInventoryFilters.ts"
Cohesion: 0.21
Nodes (8): CompendiumFilterConfig, normalizeText(), useCompendiumInventoryFilters(), UseCompendiumInventoryFiltersOptions, config, data, Entry, setup()

### Community 151 - "useCompendiumSpellFilters.ts"
Cohesion: 0.19
Nodes (8): FilterableSpell, normalize(), SpellSortOrder, useCompendiumSpellFilters(), resetDifficultyRange(), resetFilters(), UseCompendiumSpellFiltersOptions, TestSpell

### Community 152 - "mapTilesRepository.ts"
Cohesion: 0.24
Nodes (9): getMapTileUrl(), currentToken(), fetchMapTile(), MapTilesAuthError, refreshToken(), request(), auth, coords (+1 more)

### Community 153 - "DescriptionModal.stories.ts"
Cohesion: 0.18
Nodes (9): dialog, emit, titleId, Default, DialogIsLabelledByTitle, Empty, meta, Story (+1 more)

### Community 154 - "AppCard.vue"
Cohesion: 0.21
Nodes (7): props, safeAvatarUrl, emit, model, props, sanitizeAvatarUrl(), displayAvatarUrl

### Community 155 - "useMapTilePrefetch.ts"
Cohesion: 0.26
Nodes (9): buildQueue(), RunToken, useMapTilePrefetch(), cancel(), start(), MAP_PREFETCH_CONCURRENCY, MAP_PREFETCH_MAX_ZOOM, mocks (+1 more)

### Community 156 - "CareerConfirmModal.stories.ts"
Cohesion: 0.18
Nodes (10): ApplyProfile, Busy, Cancel, DialogIsLabelledByTitle, meta, OfflineDisablesActions, SkipProfile, Story (+2 more)

### Community 157 - "CharacteristicCard.stories.ts"
Cohesion: 0.17
Nodes (11): Compact, CompactClickEmitsToggle, ExpandedBodyClickEmitsToggle, ExpandedEditableBaseValueChange, ExpandedEditableSecondaryTicksByOne, ExpandedEditableTicksByFive, ExpandedReadOnly, ExpandedTitleClickEmitsToggle (+3 more)

### Community 158 - "createTileCache"
Cohesion: 0.35
Nodes (11): E2E, createTileCache(), attempt(), getTile(), has(), load(), purgeOldVersions(), read() (+3 more)

### Community 159 - "mapSearchCities.test.ts"
Cohesion: 0.22
Nodes (7): isCity(), listCities(), load(), valid, altdorf, rows, withNulls

### Community 160 - "insert_missing_spells"
Cohesion: 0.24
Nodes (4): get_existing_spell_keys(), insert_missing_spells(), load_spells(), spell_key()

### Community 161 - "useAppSplashDismiss.ts"
Cohesion: 0.24
Nodes (8): useAppSplashDismiss(), dismiss(), onAnimationEnd(), tryDismiss(), UseAppSplashDismissOptions, APP_SPLASH, testState, TimeoutCall

### Community 162 - "CharacterProfilePanel.stories.ts"
Cohesion: 0.18
Nodes (9): AllCompactByDefault, ClickingACardExpandsItOnly, ClickingAnExpandedCardCollapsesItBack, EmptyStats, meta, stats, Story, ToggleAllCompactsEveryCardAgain (+1 more)

### Community 163 - "CompendiumEntryCard.vue"
Cohesion: 0.20
Nodes (8): description, expanded, isLong, props, shownDescription, ArmorLongDescription, meta, Weapon

### Community 164 - "getEquippedArmorsForSlot"
Cohesion: 0.27
Nodes (10): equippedArmorsOnSlot, filteredArmors, isArmorSlot, slotHitRange, slotLabel, filterArmorsForSlot(), getArmorSlot(), getEquippedArmorsForSlot() (+2 more)

### Community 165 - "App.vue"
Cohesion: 0.22
Nodes (7): authReady, authStore, { isOnline, pendingCount, isSyncing }, route, router, showSplash, showSyncIndicator

### Community 166 - "ThemeToggle.vue"
Cohesion: 0.28
Nodes (7): buttonRef, isDark, props, themeStore, toggleTheme(), ThemeName, useThemeStore

### Community 167 - "MapSearch.stories.ts"
Cohesion: 0.22
Nodes (8): altdorf, Closed, meta, NoResult, PickingAResultEmitsAndClearsTheQuery, ShowsResultsWhileTyping, Story, taverne

### Community 168 - "wrap_query"
Cohesion: 0.36
Nodes (3): get_weapon_attributes(), get_weapons(), wrap_query()

### Community 169 - "getWeaponForSlot"
Cohesion: 0.29
Nodes (8): slotAriaLabel(), equippedWeaponOnSlot, isWeaponSlot, targetHand, getWeaponForHand(), getWeaponForSlot(), getWeaponSlot(), isWeaponSlotId()

### Community 170 - "fixtures/supabase.ts"
Cohesion: 0.29
Nodes (6): builder(), Builder, { fromMock }, createSupabaseQueryBuilder(), SupabaseMockResult, SupabaseQueryBuilder

### Community 172 - "Update quick-facts"
Cohesion: 0.29
Nodes (6): Format, Report, Sections and sources, Steps, Update quick-facts, When

### Community 173 - "MapLayerPanel.vue"
Cohesion: 0.33
Nodes (5): showCampaign, showCities, MapPrefetchState, ICONS, resolveMarkerIcon()

### Community 174 - "compendiumSpells.ts"
Cohesion: 0.38
Nodes (5): fetchCompendiumSpells(), mapSpell(), useCompendiumSpellsStore, CompendiumSpell, { fetchSpells }

### Community 175 - "withRetry"
Cohesion: 0.38
Nodes (5): DEFAULT_TRANSIENT_KEYWORDS, isTransientError(), RetryableError, RetryOptions, withRetry()

### Community 176 - "Git cascade"
Cohesion: 0.33
Nodes (5): Git cascade, Report, Rules, Steps, When

### Community 177 - "CampaignDetailTabs.vue"
Cohesion: 0.33
Nodes (5): CampaignTab, emit, mobileTabs, model, props

### Community 178 - "Role"
Cohesion: 0.40
Nodes (4): Method, Report, Role, Rules

### Community 179 - "CampaignManagementSection.vue"
Cohesion: 0.40
Nodes (4): emit, InvitationFilter, SessionInvitation, JoinRequestItem

### Community 180 - "Role"
Cohesion: 0.50
Nodes (3): Method, Report, Role

### Community 181 - "AppSplash.vue"
Cohesion: 0.67
Nodes (3): emit, { exiting, prefersReducedMotion, onAnimationEnd }, props

### Community 182 - "changeEmail"
Cohesion: 0.67
Nodes (3): changeEmail(), normalizeField(), saveUsername()

## Knowledge Gaps
- **20 isolated node(s):** `tailwindcss`, `@chromatic-com/storybook`, `@storybook/addon-a11y`, `@storybook/addon-docs`, `@storybook/addon-mcp` (+15 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1589 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vue` connect `vue` to `CharacterDetailView.vue`, `ProfileView.vue`, `CampaignDetailView.vue`, `EquipmentSlotPickerModal.vue`, `useCampaignSessions.ts`, `SessionNotesPanel.vue`, `AuthForm.vue`, `notificationsRepository.ts`, `useCharacterCareer`, `CharacterEquipmentDoll.vue`, `routes.ts`, `src/main.ts`, `careersRepository.ts`, `HomeView.vue`, `CampaignListView.vue`, `AccountPopover.vue`, `CampaignTimelineSessionDetailView.vue`, `useCampaignSessions`, `useOptimisticUpdate`, `CharacterListView.vue`, `CampaignCreateModal.vue`, `useAuthStore`, `CharacterCreateModal.vue`, `NotificationsView.vue`, `MissivesPopover.vue`, `useRealtimeChannels.ts`, `domain.ts`, `CharacterMoneyCard.vue`, `SessionNotesListCard.vue`, `useSessionNotesFiltering.ts`, `useCopyFeedback`, `HealthHeart.vue`, `NavBar.vue`, `MarkdownEditor.vue`, `CampaignSessionsSection.vue`, `CharacteristicCard.vue`, `@lucide/vue`, `SessionNotesCreateCard.vue`, `MobileLayout.vue`, `useCharacterQuickSave`, `useCharacterCatalogActions.ts`, `FortuneClover.vue`, `usePagination`, `CatalogAddModal.vue`, `CompendiumInventoryView.vue`, `CharacterItemsSection.vue`, `CharacterValueCard.vue`, `CompendiumCareerGraphView.vue`, `utils/characterSheet.ts`, `CharacterSkillsPanel.vue`, `MapView.vue`, `package.json`, `compendiumRepository.ts`, `CompendiumSpellsView.vue`, `CompendiumSkillsView.vue`, `useCampaignManagement.ts`, `useLeafletMap`, `MarkerFormModal.vue`, `CompendiumTalentsView.vue`, `useCharacterQuickSave.ts`, `vitest`, `stores/map.ts`, `CharacterOverview.stories.ts`, `MarkerFormModal.stories.ts`, `useOfflineQueueSync`, `useCampaignTable.ts`, `handleSaveEdit`, `SessionCreatePanel.vue`, `useLeafletMap.ts`, `useSessionNoteEditor.ts`, `compendiumInventory.ts`, `CharacterSyncStatus.stories.ts`, `useCompendiumInventoryFilters.ts`, `useCompendiumSpellFilters.ts`, `DescriptionModal.stories.ts`, `AppCard.vue`, `useMapTilePrefetch.ts`, `useAppSplashDismiss.ts`, `CompendiumEntryCard.vue`, `App.vue`, `ThemeToggle.vue`, `compendiumSpells.ts`, `CampaignDetailTabs.vue`, `AppSplash.vue`?**
  _High betweenness centrality (0.302) - this node is a cross-community bridge._
- **What connects `tailwindcss`, `@chromatic-com/storybook`, `@storybook/addon-a11y` to the rest of the system?**
  _20 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CharacterDetailView.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.08045977011494253 - nodes in this community are weakly interconnected._
- **Why does `load_env()` connect `weapon_attributes_setter.py` to `Warhammer RPG App`, `upload_map_tiles.py`, `career_paths_extractor.py`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Should `ProfileView.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `vitest` to `stores/map.ts`, `invitationsRepository.ts`, `useCareerGraph.ts`, `throwIfError`, `sessionNotesRepository.ts`, `vue`, `offlineQueueRepository.ts`, `CharacterOverview.stories.ts`, `useCampaignTable.ts`, `useCampaignSessions.ts`, `types/map.ts`, `profileRepository.ts`, `AuthForm.vue`, `handleSaveEdit`, `useMapTileCache.ts`, `useCharacterCareer`, `routes.ts`, `notificationsRepository.ts`, `useSessionNoteEditor.ts`, `careersRepository.ts`, `compendiumInventory.ts`, `useCompendiumInventoryFilters.ts`, `useCompendiumSpellFilters.ts`, `mapTilesRepository.ts`, `AppCard.vue`, `themeTransition.test.ts`, `useCampaignSessions`, `useOptimisticUpdate`, `CharacterListView.vue`, `mapSearchCities.test.ts`, `useAuthStore`, `CampaignCreateModal.vue`, `NotificationsView.vue`, `useAppSplashDismiss.ts`, `useMapTilePrefetch.ts`, `campaignsRepository.ts`, `MissivesPopover.vue`, `useRealtimeChannels.ts`, `domain.ts`, `useOfflineQueueSync`, `fixtures/supabase.ts`, `useRealtimeChannels`, `useSessionNotesFiltering.ts`, `useCopyFeedback`, `compendiumSpells.ts`, `equipmentSlots.test.ts`, `withRetry`, `NavBar.vue`, `campaignCodeRedirect.ts`, `MarkdownEditor.vue`, `@lucide/vue`, `sessionsRepository.ts`, `SessionNotesCreateCard.vue`, `MobileLayout.vue`, `useCharacterQuickSave`, `useCharacterCatalogActions.ts`, `usePagination`, `dice.ts`, `CharacterItemsSection.vue`, `utils/characterSheet.ts`, `mapTileCache.ts`, `package.json`, `compendiumRepository.ts`, `useCampaignManagement.ts`, `useLeafletMap`, `mapCities.ts`, `MarkerFormModal.vue`, `CompendiumTalentsView.vue`, `useCharacterQuickSave.ts`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Should `throwIfError` be split into smaller, more focused modules?**
  _Cohesion score 0.113107822410148 - nodes in this community are weakly interconnected._