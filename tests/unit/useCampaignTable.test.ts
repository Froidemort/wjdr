import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

const listSheets = vi.hoisted(() => vi.fn())

vi.mock('../../src/services/charactersRepository', () => ({
  listCampaignCharacterSheets: listSheets,
}))

import { useCampaignTable } from '../../src/composables/useCampaignTable'

const flush = async () => {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

describe('useCampaignTable', () => {
  beforeEach(() => {
    listSheets.mockReset()
    listSheets.mockResolvedValue([])
  })

  it('does not fetch while the table tab is inactive', async () => {
    const active = ref(false)
    useCampaignTable({ campaignId: ref('c1'), active })
    await flush()
    expect(listSheets).not.toHaveBeenCalled()

    active.value = true
    await flush()
    expect(listSheets).toHaveBeenCalledWith('c1')
  })

  it('exposes an error message when the batch fetch fails', async () => {
    listSheets.mockRejectedValue(new Error('boom'))
    const { error, entries } = useCampaignTable({ campaignId: ref('c1'), active: ref(true) })
    await flush()
    expect(error.value).toBeTruthy()
    expect(entries.value).toEqual([])
  })

  it('skips fetching without a campaign id', async () => {
    useCampaignTable({ campaignId: ref(null), active: ref(true) })
    await flush()
    expect(listSheets).not.toHaveBeenCalled()
  })
})
