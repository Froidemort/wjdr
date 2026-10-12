# Graph Report - wjdr  (2026-10-12)

## Corpus Check
- 211 files · ~157,326 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: .css 2)

## Summary
- 1547 nodes · 3244 edges · 85 communities (83 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 113 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- CharacterDetailView.vue cluster
- CampaignManagementSection.vue cluster
- profileRepository.ts cluster
- characterLinksRepository.ts cluster
- CampaignDetailView.vue cluster
- CompendiumInventoryView.vue cluster
- offlineQueueRepository.ts cluster
- EquipmentSlotPickerModal.vue cluster
- updateCharacterArmorEquipped() cluster
- CampaignSessionsCalendar.vue cluster
- SessionNotesPanel.vue cluster
- AuthForm.vue cluster
- PasswordInput.vue cluster
- charactersRepository.ts cluster
- CharacterDerivedStatsCard.vue cluster
- CharacterEquipmentDoll.vue cluster
- legacySessionRedirects.ts cluster
- AppSplash.vue cluster
- MissivesPopover.vue cluster
- careersRepository.ts cluster
- HomeFeatureCard.vue cluster
- compendiumRepository.ts cluster
- sessionNotesRepository.ts cluster
- CampaignListView.vue cluster
- AccountPopover.vue cluster
- CampaignTimelineSessionDetailView.vue cluster
- ThemeToggle.vue cluster
- useCampaignSessions.test.ts cluster
- useLiveSave.ts cluster
- PageFooter.vue cluster
- useBusyOperations.ts cluster
- CampaignCreateModal.vue cluster
- main.ts cluster
- CharacterCreateModal.vue cluster
- NotificationsView.vue cluster
- useAsyncList.ts cluster
- useNotificationsLoad.ts cluster
- campaignsRepository.ts cluster
- auth.ts cluster
- useRealtimeChannels.ts cluster
- CampaignOverviewSection.vue cluster
- CharacterMoneyCard.vue cluster
- compendium-inventory.spec.ts cluster
- DataGrid.vue cluster
- useSessionNotesFiltering.ts cluster
- useCopyFeedback.ts cluster
- equipmentSlots.test.ts cluster
- HealthHeart.vue cluster
- NavBar.vue cluster
- useCompendiumInventoryFilters.ts cluster
- ResetPasswordView.vue cluster
- campaignCodeRedirect.ts cluster
- invalidateCharacterLinksCache() cluster
- CampaignSessionsSection.vue cluster
- CharacteristicCard.vue cluster
- NavMainLinks.vue cluster
- MobileLayout.vue cluster
- sessionsRepository.ts cluster
- AppCard.vue cluster
- useDeviceBreakpoint.ts cluster
- useMoneyCoercion.ts cluster
- CompendiumEntryCard.vue cluster
- equippedArmorsOnSlot cluster
- FortuneClover.vue cluster
- useOfflineQueueSync.ts cluster
- usePagination.ts cluster
- App.vue cluster
- dice.ts cluster
- FortuneClover.stories.ts cluster
- useIncrementalReveal.ts cluster
- slotAriaLabel() cluster
- StateCycleBadge.vue cluster
- HealthHeart.stories.ts cluster
- CharacterValueCard.vue cluster
- updateCharacterSkillMastery() cluster
- retry.ts cluster
- Footer.vue cluster
- useSessionNoteEditor.ts cluster
- character.ts cluster
- closeCatalogModal() cluster
- campaignCodeApi.test.ts cluster
- CampaignDetailTabs.vue cluster
- loadSessionDetail() cluster
- formatCampaignSessionDateCompact() cluster

## God Nodes (most connected - your core abstractions)
1. `useCampaignSessions()` - 29 edges
2. `useCampaignManagement()` - 24 edges
3. `useAuthStore` - 24 edges
4. `setSectionSuccess()` - 22 edges
5. `invalidateCurrentLinksCache()` - 21 edges
6. `SessionSummary` - 18 edges
7. `supabase` - 17 edges
8. `loadCharacterLinks()` - 17 edges
9. `CampaignSummary` - 15 edges
10. `endAction()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `useCampaignCreateModalStore` --indirect_call--> `closeModal()`  [INFERRED]
  src/stores/campaignCreateModal.ts → src/components/ui/EquipmentSlotPickerModal.vue
- `createManagement()` --calls--> `useCampaignManagement()`  [EXTRACTED]
  tests/unit/useCampaignManagement.test.ts → src/composables/useCampaignManagement.ts
- `createSessions()` --calls--> `useCampaignSessions()`  [EXTRACTED]
  tests/unit/useCampaignSessions.test.ts → src/composables/useCampaignSessions.ts
- `setup()` --calls--> `useCompendiumInventoryFilters()`  [EXTRACTED]
  tests/unit/useCompendiumInventoryFilters.test.ts → src/composables/useCompendiumInventoryFilters.ts
- `createFiltering()` --calls--> `useSessionNotesFiltering()`  [EXTRACTED]
  tests/unit/useSessionNotesFiltering.test.ts → src/composables/useSessionNotesFiltering.ts

## Import Cycles
- None detected.

## Communities (85 total, 2 thin omitted)

### Community 0 - "CharacterDetailView.vue cluster"
Cohesion: 0.02
Nodes (123): actionBusyKey, actionSuccessMessage, activeCharacterTab, activeSkillMasteryId, addingCatalog, allStatsSorted, ARMOR_EQUIPPED_OPTIONS, armorFilter (+115 more)

### Community 1 - "CampaignManagementSection.vue cluster"
Cohesion: 0.05
Nodes (64): emit, InvitationFilter, useCampaignManagement(), acceptJoinRequest(), clearManagementState(), inviteSelectedUsers(), loadInvitations(), loadInviteCandidates() (+56 more)

### Community 2 - "profileRepository.ts cluster"
Cohesion: 0.06
Nodes (45): getProfileSettings(), isValidEmail(), normalizeEmail(), normalizeUsername(), ProfileSettings, reauthenticateWithPassword(), sanitizeFileName(), updateAccountPassword() (+37 more)

### Community 3 - "characterLinksRepository.ts cluster"
Cohesion: 0.10
Nodes (41): addCharacterArmors(), addCharacterItems(), addCharacterSkills(), addCharacterTalents(), addCharacterWeapons(), ArmorLinkRow, CharacterLinksBundle, characterLinksCache (+33 more)

### Community 4 - "CampaignDetailView.vue cluster"
Cohesion: 0.06
Nodes (29): activeCampaignTab, archiveBusy, authStore, campaignId, canCreateOwnCharacter, characterCreateModalRef, characterCreateSuccess, characterListFilter (+21 more)

### Community 5 - "CompendiumInventoryView.vue cluster"
Cohesion: 0.06
Nodes (28): activeList, activeTab, armorConfig, armorFilters, errorMessage, facetEntries, filters, isLoading (+20 more)

### Community 6 - "offlineQueueRepository.ts cluster"
Cohesion: 0.14
Nodes (23): clearQueuedUpdates(), db, enqueueOfflineUpdate(), generateId, incrementQueuedRetry(), listQueuedUpdates(), mergePayload(), notifyQueueChange() (+15 more)

### Community 7 - "EquipmentSlotPickerModal.vue cluster"
Cohesion: 0.10
Nodes (28): armorActionLabel(), availableWeapons, closeModal(), depthMarks, dialogRef, emit, equippedArmors, filteredWeapons (+20 more)

### Community 8 - "updateCharacterArmorEquipped() cluster"
Cohesion: 0.21
Nodes (30): updateCharacterArmorEquipped(), updateCharacterWeaponEquipped(), findConflictingWeapons(), beginAction(), confirmDestructiveAction(), confirmItemCreate(), endAction(), ensureArmorCanBeEquipped() (+22 more)

### Community 9 - "CampaignSessionsCalendar.vue cluster"
Cohesion: 0.13
Nodes (22): days, monthLabel, props, sessionsByDate, today, todayKey, visibleMonth, visibleYear (+14 more)

### Community 10 - "SessionNotesPanel.vue cluster"
Cohesion: 0.07
Nodes (24): canCreateNote, createCardTitle, createContentError, createError, createForm, creating, editContentError, { editNoteId, editError, editDraft, startEdit, cancelEdit, validateContent } (+16 more)

### Community 11 - "AuthForm.vue cluster"
Cohesion: 0.08
Nodes (23): authFormStore, authStore, email, emailError, formSubmitted, identifier, identifierError, isLogin (+15 more)

### Community 12 - "PasswordInput.vue cluster"
Cohesion: 0.11
Nodes (22): inputId, model, props, reveal, strength, errorMessage, props, requesting (+14 more)

### Community 13 - "charactersRepository.ts cluster"
Cohesion: 0.19
Nodes (22): assertCharacterCampaignWritable(), createCharacterForCampaign(), createInitialStats(), getCharacterById(), listCharactersByCampaign(), listCharactersForUser(), mapCharacter(), mapCharacterStat() (+14 more)

### Community 14 - "CharacterDerivedStatsCard.vue cluster"
Cohesion: 0.13
Nodes (21): encumbranceProgressMax, encumbranceProgressValue, isEncumbranceOverLimit, props, WeaponLinkRow, CharacterWeapon, ArmorByLocation, ArmorDataLocation (+13 more)

### Community 15 - "CharacterEquipmentDoll.vue cluster"
Cohesion: 0.10
Nodes (17): activeSlotId, ArmorSlotView, armorViewById, armorViews, buildArmorSlotView(), buildWeaponSlotView(), emit, highlightedLocation (+9 more)

### Community 16 - "legacySessionRedirects.ts cluster"
Cohesion: 0.13
Nodes (16): buildLegacySessionDetailRedirect(), buildLegacySessionTimelineRedirect(), LEGACY_SESSIONS_INDEX_REDIRECT, prefetchFrequentAuthenticatedViews(), appRoutes, CampaignDetailView(), CampaignListView(), CampaignTimelineSessionDetailView() (+8 more)

### Community 17 - "AppSplash.vue cluster"
Cohesion: 0.13
Nodes (16): emit, { exiting, prefersReducedMotion, onAnimationEnd }, props, emit, onAnimationEnd(), viewBox, useAppSplashDismiss(), dismiss() (+8 more)

### Community 18 - "MissivesPopover.vue cluster"
Cohesion: 0.14
Nodes (19): emit, isActive, { isOpen, close, toggle }, { preview, unreadCount, error, refreshMissives, markMissiveAsRead }, rootRef, route, triggerRef, getNotificationDisplayMessage() (+11 more)

### Community 19 - "careersRepository.ts cluster"
Cohesion: 0.14
Nodes (18): FRENCH_SORT_OPTIONS, listCareerCharacteristicsByCareerId(), listCareerPathCareersByFromCareerId(), mapCareerPathCareer(), normalizeCareerId(), normalizeStatCode(), CareerCharacteristic, CareerPathCareer (+10 more)

### Community 20 - "HomeFeatureCard.vue cluster"
Cohesion: 0.13
Nodes (10): isAvailable, isFeatured, props, surfaceTag, HomeFeature, homeFeatures, HomePillar, homePillars (+2 more)

### Community 21 - "compendiumRepository.ts cluster"
Cohesion: 0.21
Nodes (16): fetchCompendiumArmors(), fetchCompendiumItems(), fetchCompendiumWeapons(), mapArmor(), mapItem(), mapWeapon(), useCompendiumInventoryStore, CompendiumArmor (+8 more)

### Community 22 - "sessionNotesRepository.ts cluster"
Cohesion: 0.18
Nodes (18): buildSessionNotesChannelName(), buildSessionNotesRealtimeSubscriptions(), createSessionNote(), deleteSessionNote(), listSessionNotesForCampaign(), ListSessionNotesOptions, mapSessionNote(), mapSessionNoteWriteError() (+10 more)

### Community 23 - "CampaignListView.vue cluster"
Cohesion: 0.12
Nodes (18): authStore, campaignCreateModalStore, campaigns, campaignsList, errorMessage, { feedbackMap, copyText, copyLink }, goToNextPage(), goToPreviousPage() (+10 more)

### Community 24 - "AccountPopover.vue cluster"
Cohesion: 0.14
Nodes (15): ariaLabel, authStore, avatarUrl, displayName, emit, { isOpen, close, toggle }, onLogout(), rootRef (+7 more)

### Community 25 - "CampaignTimelineSessionDetailView.vue cluster"
Cohesion: 0.13
Nodes (16): authStore, campaign, campaignId, errorMessage, formatCampaignSessionDate(), formatCampaignSessionDateCompact(), getSessionDateStatus(), getSessionStatusClass() (+8 more)

### Community 26 - "ThemeToggle.vue cluster"
Cohesion: 0.15
Nodes (16): buttonRef, isDark, props, themeStore, toggleTheme(), useThemeStore, AnimatedThemeToggleOptions, getThemeTransitionClipPaths() (+8 more)

### Community 27 - "useCampaignSessions.test.ts cluster"
Cohesion: 0.18
Nodes (16): useCampaignSessions(), cancelSessionEdit(), createCampaignSession(), deleteCampaignSession(), formatCampaignSessionDate(), formatCampaignSessionTitle(), getSessionDateStatus(), hasSessionDateConflict() (+8 more)

### Community 28 - "useLiveSave.ts cluster"
Cohesion: 0.19
Nodes (14): useLiveSave(), triggerSave(), triggerSaveNow(), MergePatch, SaveStatus, useOptimisticUpdate(), cancel(), flush() (+6 more)

### Community 29 - "PageFooter.vue cluster"
Cohesion: 0.14
Nodes (13): LoadingState, LoadingStateOptions, useLoadingState(), execute(), authStore, charactersList, {
  data: characters,
  loading,
  error: errorMessage,
  execute,
}, filteredCharacters (+5 more)

### Community 30 - "useBusyOperations.ts cluster"
Cohesion: 0.20
Nodes (16): canManageNote(), handleCreate(), handleDelete(), handleSaveEdit(), handleToggleArchived(), handleToggleVisibility(), loadNotes(), { subscribe } (+8 more)

### Community 31 - "CampaignCreateModal.vue cluster"
Cohesion: 0.14
Nodes (15): authStore, description, dialogRef, errorMessage, generateAlphaNumeric, generateCampaignCode(), lastFocusedElement, loading (+7 more)

### Community 32 - "main.ts cluster"
Cohesion: 0.18
Nodes (9): app, pinia, themeStore, router, AuthMode, useAuthFormStore, useCampaignCreateModalStore, ThemeName (+1 more)

### Community 33 - "CharacterCreateModal.vue cluster"
Cohesion: 0.13
Nodes (14): close(), dialogRef, emit, errorMessage, gender, genderOptions, loading, name (+6 more)

### Community 34 - "NotificationsView.vue cluster"
Cohesion: 0.16
Nodes (15): clearAllBusy(), load(), NotificationsView(), extractNotificationSessionId(), markAllNotificationsRead(), authStore, { busyIds, isBusy, setBusy, clearBusy, clearAllBusy }, campaignIdOf() (+7 more)

### Community 35 - "useAsyncList.ts cluster"
Cohesion: 0.22
Nodes (9): useAsyncList(), UseAsyncListOptions, useMissivesInbox(), loadUnreadCount(), markMissiveAsRead(), refreshMissives(), countUnreadNotifications(), markNotificationRead() (+1 more)

### Community 36 - "useNotificationsLoad.ts cluster"
Cohesion: 0.16
Nodes (11): useNotificationsLoad(), UseNotificationsLoadOptions, RealtimeEvent, RealtimeSyncSubscription, useRealtimeSync(), start(), stop(), UseRealtimeSyncOptions (+3 more)

### Community 37 - "campaignsRepository.ts cluster"
Cohesion: 0.22
Nodes (14): createCampaign(), getCampaignById(), listCampaignsForUser(), listCampaignsForUserPaginated(), mapCampaign(), mapCampaignWriteError(), updateCampaignArchivedState(), CampaignRow (+6 more)

### Community 38 - "auth.ts cluster"
Cohesion: 0.16
Nodes (9): AuthIdentifier, resolveIdentifier(), useAuthStore, LoggedIn, LoggedOut, meta, navbarMswHandlers, Story (+1 more)

### Community 39 - "useRealtimeChannels.ts cluster"
Cohesion: 0.17
Nodes (11): RealtimeEvent, RealtimeTableSubscription, RealtimeUpdatePayload, useRealtimeChannels(), dispatchUpdate(), subscribe(), unsubscribe(), UseRealtimeChannelsOptions (+3 more)

### Community 40 - "CampaignOverviewSection.vue cluster"
Cohesion: 0.21
Nodes (10): CharacterListFilter, emit, props, sessionInfoOpenModel, props, resolvedDestinyTotal, CharacterCore, CharacterDetail (+2 more)

### Community 41 - "CharacterMoneyCard.vue cluster"
Cohesion: 0.24
Nodes (14): closeSubtractDialog(), confirmSubtract(), emit, onCopperInput(), onGoldInput(), onMoneyFieldBlur(), onSilverInput(), onSubtractDialogClosed() (+6 more)

### Community 42 - "compendium-inventory.spec.ts cluster"
Cohesion: 0.14
Nodes (5): armors, items, weapons, RequestCounter, SCREENSHOT_DIR

### Community 43 - "DataGrid.vue cluster"
Cohesion: 0.18
Nodes (10): canGoNext, canGoPrevious, Props, model, emit, onEditDraftFieldInput(), onLinkedSessionFilterChange(), onSearchQueryUpdate() (+2 more)

### Community 44 - "useSessionNotesFiltering.ts cluster"
Cohesion: 0.26
Nodes (12): resetCreateForm(), computeSearchScore(), countOccurrences(), formatSessionDate(), formatSessionLabel(), useSessionNotesFiltering(), resetLinkedSessionFilter(), resolveSessionLabel() (+4 more)

### Community 45 - "useCopyFeedback.ts cluster"
Cohesion: 0.21
Nodes (9): useCopyFeedback(), copy(), copyLink(), copyText(), useCopyLink(), copyCampaignCode(), copyCampaignLink(), clipboard (+1 more)

### Community 46 - "equipmentSlots.test.ts cluster"
Cohesion: 0.23
Nodes (11): armorCoversLocation(), canEquipArmorStack(), computeArmorByLocation(), countEquippedArmorsForLocation(), findConflictingArmors(), getArmorCoveredLocations(), getArmorStackLimitLocations(), isWeaponHand() (+3 more)

### Community 47 - "HealthHeart.vue cluster"
Cohesion: 0.18
Nodes (10): clampedCurrentHp, currentHp, emit, heartBeatFrequency, hpColorClass, hpPercentage, isBeating, props (+2 more)

### Community 48 - "NavBar.vue cluster"
Cohesion: 0.18
Nodes (10): accountRef, authStore, isAuthenticated, { isScrolled }, missivesRef, mobileMenuOpen, route, unreadCount (+2 more)

### Community 49 - "useCompendiumInventoryFilters.ts cluster"
Cohesion: 0.21
Nodes (8): CompendiumFilterConfig, normalizeText(), useCompendiumInventoryFilters(), UseCompendiumInventoryFiltersOptions, config, data, Entry, setup()

### Community 50 - "ResetPasswordView.vue cluster"
Cohesion: 0.15
Nodes (10): ResetPasswordView(), authStore, confirmation, localError, password, router, sessionReady, submitted (+2 more)

### Community 51 - "campaignCodeRedirect.ts cluster"
Cohesion: 0.27
Nodes (11): CampaignCodeLookup, CampaignCodeResolutionContext, CampaignCodeResolutionResult, CampaignCodeResolutionStatus, createInMemoryRateLimiter(), getClientIp(), isCampaignCodeIdentifier(), isUuidIdentifier() (+3 more)

### Community 52 - "invalidateCharacterLinksCache() cluster"
Cohesion: 0.17
Nodes (13): invalidateCharacterLinksCache(), getWoundsValueFromCharacterStats(), isSavingInProgress(), loadCharacter(), markSavedEditable(), onStatBaseChange(), onStatTick(), requestExternalCharacterRefresh() (+5 more)

### Community 53 - "CampaignSessionsSection.vue cluster"
Cohesion: 0.20
Nodes (10): emit, onSessionCreateFieldInput(), props, SessionCreateForm, SessionEditForm, SessionTimelineFilter, emit, onSessionEditFieldInput() (+2 more)

### Community 54 - "CharacteristicCard.vue cluster"
Cohesion: 0.23
Nodes (11): cardToneClass, emit, onBaseInput(), onTickDown(), onTickUp(), onTotalAdvancedInput(), props, tickStep (+3 more)

### Community 55 - "NavMainLinks.vue cluster"
Cohesion: 0.20
Nodes (7): links, route, authStore, open, router, mainNavLinks, NavLink

### Community 56 - "MobileLayout.vue cluster"
Cohesion: 0.18
Nodes (10): authStore, closeOptions(), isAuthenticated, { isScrolled }, navItems, onLogout(), optionsOpen, route (+2 more)

### Community 57 - "sessionsRepository.ts cluster"
Cohesion: 0.32
Nodes (10): createSession(), deleteSession(), getSessionById(), listSessionsForCampaign(), mapSession(), mapSessionWriteError(), updateSession(), CreateSessionInput (+2 more)

### Community 58 - "AppCard.vue cluster"
Cohesion: 0.22
Nodes (8): emit, model, props, emit, onCreate(), onCreateFieldInput(), props, SessionNoteCreateForm

### Community 59 - "useDeviceBreakpoint.ts cluster"
Cohesion: 0.22
Nodes (7): useDeviceBreakpoint(), UseDeviceBreakpointOptions, { isMobile }, layoutComponent, route, showFooter, mediaQuery

### Community 60 - "useMoneyCoercion.ts cluster"
Cohesion: 0.24
Nodes (9): MoneyValues, useMoneyCoercion(), applyCoercion(), coerceMoney(), isEditableEqual(), onMoneyCommit(), onMoneySubtract(), onQuickValueChange() (+1 more)

### Community 61 - "CompendiumEntryCard.vue cluster"
Cohesion: 0.20
Nodes (8): description, expanded, isLong, props, shownDescription, ArmorLongDescription, meta, Weapon

### Community 62 - "equippedArmorsOnSlot cluster"
Cohesion: 0.27
Nodes (10): equippedArmorsOnSlot, filteredArmors, isArmorSlot, slotHitRange, slotLabel, filterArmorsForSlot(), getArmorSlot(), getEquippedArmorsForSlot() (+2 more)

### Community 63 - "FortuneClover.vue cluster"
Cohesion: 0.27
Nodes (9): activeTokenClass, emit, onMaxPointsInput(), props, resolvedMaxPoints, resolvedPoints, setPoints(), tokenGridStyle (+1 more)

### Community 64 - "useOfflineQueueSync.ts cluster"
Cohesion: 0.33
Nodes (7): useOfflineQueueSync(), flushQueue(), handleOnline(), refreshPendingCount(), countQueuedUpdates(), subscribeOfflineQueueChanges(), dependencies

### Community 65 - "usePagination.ts cluster"
Cohesion: 0.27
Nodes (8): PaginationNavigateOptions, PaginationOptions, usePagination(), goToNextPage(), goToPreviousPage(), nextPage(), previousPage(), resetPage()

### Community 66 - "App.vue cluster"
Cohesion: 0.22
Nodes (7): authReady, authStore, { isOnline, pendingCount, isSyncing }, route, router, showSplash, showSyncIndicator

### Community 67 - "dice.ts cluster"
Cohesion: 0.36
Nodes (7): clampPercentileTarget(), evaluateBonusExpression(), isDoubleRoll(), resolvePercentileCheck(), ResolvePercentileCheckInput, ResolvePercentileCheckResult, rollPercentile()

### Community 68 - "FortuneClover.stories.ts cluster"
Cohesion: 0.22
Nodes (8): Default, Destin, FortuneEditableMax, HighCapacity, meta, NarrowReadOnly, ReadOnly, Story

### Community 69 - "useIncrementalReveal.ts cluster"
Cohesion: 0.36
Nodes (4): useIncrementalReveal(), loadMore(), UseIncrementalRevealOptions, mockedUseInfiniteScroll

### Community 70 - "slotAriaLabel() cluster"
Cohesion: 0.29
Nodes (8): slotAriaLabel(), equippedWeaponOnSlot, isWeaponSlot, targetHand, getWeaponForHand(), getWeaponForSlot(), getWeaponSlot(), isWeaponSlotId()

### Community 71 - "StateCycleBadge.vue cluster"
Cohesion: 0.29
Nodes (7): BadgeStateOption, BadgeStateValue, currentIndex, currentOption, cycleState(), emit, props

### Community 72 - "HealthHeart.stories.ts cluster"
Cohesion: 0.25
Nodes (7): CriticalHealth, Default, Empty, LowHealth, meta, NarrowEditable, ReadOnly

### Community 73 - "CharacterValueCard.vue cluster"
Cohesion: 0.48
Nodes (6): emit, hasMax, onCurrentInput(), onMaxInput(), props, toNonNegativeInteger()

### Community 74 - "updateCharacterSkillMastery() cluster"
Cohesion: 0.29
Nodes (7): updateCharacterSkillMastery(), closeSkillMastery(), onChangeSkillMastery(), onSkillMasteryKeydown(), onSkillMasteryPointerDown(), selectSkillMastery(), toggleSkillMastery()

### Community 75 - "retry.ts cluster"
Cohesion: 0.38
Nodes (5): DEFAULT_TRANSIENT_KEYWORDS, isTransientError(), RetryableError, RetryOptions, withRetry()

### Community 76 - "Footer.vue cluster"
Cohesion: 0.33
Nodes (3): currentYear, Default, meta

### Community 77 - "useSessionNoteEditor.ts cluster"
Cohesion: 0.40
Nodes (3): SessionNoteDraft, useSessionNoteEditor(), cancelEdit()

### Community 78 - "character.ts cluster"
Cohesion: 0.40
Nodes (5): CharacterGender, CharacterRace, CreateCharacterPayload, CharacterRow, CharacterWithCareerRow

### Community 79 - "closeCatalogModal() cluster"
Cohesion: 0.40
Nodes (6): closeCatalogModal(), onCatalogDialogClosed(), openCatalogModal(), resetCatalogModalState(), resetNewItemForm(), resetSelectedItemsSettings()

### Community 81 - "CampaignDetailTabs.vue cluster"
Cohesion: 0.40
Nodes (4): CampaignTab, emit, model, props

### Community 82 - "loadSessionDetail() cluster"
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

### Community 83 - "formatCampaignSessionDateCompact() cluster"
Cohesion: 0.67
Nodes (3): formatCampaignSessionDateCompact(), focusNotesPanel(), formatSessionNoteLabel()

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuthStore` connect `auth.ts cluster` to `CharacterDetailView.vue cluster`, `App.vue cluster`, `useAsyncList.ts cluster`, `CampaignDetailView.vue cluster`, `NotificationsView.vue cluster`, `profileRepository.ts cluster`, `AuthForm.vue cluster`, `NavBar.vue cluster`, `legacySessionRedirects.ts cluster`, `ResetPasswordView.vue cluster`, `CampaignListView.vue cluster`, `HomeFeatureCard.vue cluster`, `NavMainLinks.vue cluster`, `AccountPopover.vue cluster`, `CampaignTimelineSessionDetailView.vue cluster`, `MobileLayout.vue cluster`, `PageFooter.vue cluster`, `CampaignCreateModal.vue cluster`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `useCampaignSessions()` (e.g. with `buildCampaignSessionDetailLink()` and `cancelSessionEdit()`) actually correct?**
  _`useCampaignSessions()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Should `CharacterDetailView.vue cluster` be split into smaller, more focused modules?**
  _Cohesion score 0.017088174982911826 - nodes in this community are weakly interconnected._
- **Why does `useCampaignSessions()` connect `useCampaignSessions.test.ts cluster` to `CampaignManagementSection.vue cluster`, `CampaignDetailView.vue cluster`, `offlineQueueRepository.ts cluster`, `CampaignSessionsCalendar.vue cluster`, `formatCampaignSessionDateCompact() cluster`, `sessionsRepository.ts cluster`, `useLiveSave.ts cluster`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `useCampaignManagement()` (e.g. with `acceptJoinRequest()` and `clearInviteSelection()`) actually correct?**
  _`useCampaignManagement()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Should `CampaignManagementSection.vue cluster` be split into smaller, more focused modules?**
  _Cohesion score 0.05198358413132695 - nodes in this community are weakly interconnected._
- **Why does `useCampaignManagement()` connect `CampaignManagementSection.vue cluster` to `MissivesPopover.vue cluster`, `useAsyncList.ts cluster`, `CampaignDetailView.vue cluster`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._