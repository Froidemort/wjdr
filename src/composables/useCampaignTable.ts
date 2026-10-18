import { computed, watch, type Ref } from 'vue'
import {
  listCampaignCharacterSheets,
  type CampaignCharacterSheet,
} from '../services/charactersRepository'
import {
  buildCharacterTableHighlights,
  type CharacterTableHighlights,
} from '../utils/characterSheet'
import { useAsyncList } from './useAsyncList'

export interface CampaignTableEntry extends CampaignCharacterSheet {
  highlights: CharacterTableHighlights
}

interface UseCampaignTableOptions {
  campaignId: Ref<string | null>
  /** Sheets are only fetched while the MJ table is visible. */
  active: Ref<boolean>
}

export function useCampaignTable(options: UseCampaignTableOptions) {
  const { items, loading, error, load, clear } = useAsyncList<CampaignCharacterSheet>({
    errorMessage: 'Impossible de charger la table.',
    loadItems: async () => {
      const id = options.campaignId.value
      return id ? listCampaignCharacterSheets(id) : []
    },
  })

  const entries = computed<CampaignTableEntry[]>(() =>
    items.value.map((sheet) => ({
      ...sheet,
      highlights: buildCharacterTableHighlights({
        race: sheet.character.race,
        stats: sheet.stats,
        links: sheet.links,
      }),
    }))
  )

  async function reload(): Promise<void> {
    try {
      await load()
    } catch {
      // The message is exposed through `error`.
    }
  }

  watch(
    () => [options.active.value, options.campaignId.value] as const,
    ([active, campaignId], previous) => {
      if (!campaignId) {
        clear()
        return
      }
      if (previous && previous[1] !== campaignId) {
        clear()
      }
      if (active) {
        void reload()
      }
    },
    { immediate: true }
  )

  return { entries, loading, error, reload }
}
