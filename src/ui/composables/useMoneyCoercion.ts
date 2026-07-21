import { computed, type Ref, ref } from 'vue'

interface MoneyValues {
  gold: number
  silver: number
  copper: number
}

// Exchange rates: 1 gold = 12 silver = 240 copper
const COPPER_PER_SILVER = 20
const COPPER_PER_GOLD = 240

export function useMoneyCoercion() {
  const isCoercing: Ref<boolean> = ref(false)

  /**
   * Converts money to normalized form (gold, silver, copper) with no remainders.
   * Algorithm: Convert all to copper total, then redistribute optimally.
   */
  function coerceMoney(gold: number, silver: number, copper: number): MoneyValues {
    // Clamp negative values
    const g = Math.max(0, Math.floor(gold))
    const s = Math.max(0, Math.floor(silver))
    const c = Math.max(0, Math.floor(copper))

    // Convert all to copper
    const totalCopper = g * COPPER_PER_GOLD + s * COPPER_PER_SILVER + c

    // Redistribute optimally
    const newGold = Math.floor(totalCopper / COPPER_PER_GOLD)
    const remainAfterGold = totalCopper % COPPER_PER_GOLD

    const newSilver = Math.floor(remainAfterGold / COPPER_PER_SILVER)
    const newCopper = remainAfterGold % COPPER_PER_SILVER

    return {
      gold: newGold,
      silver: newSilver,
      copper: newCopper,
    }
  }

  /**
   * Apply coercion with lock mechanism to prevent rapid updates.
   */
  async function applyCoercion(
    gold: number,
    silver: number,
    copper: number,
    delayMs: number = 300
  ): Promise<MoneyValues> {
    if (isCoercing.value) {
      return { gold, silver, copper }
    }

    isCoercing.value = true
    const coerced = coerceMoney(gold, silver, copper)

    // Lock fields briefly to prevent rapid successive updates
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    isCoercing.value = false

    return coerced
  }

  const isMoneyLocked = computed(() => isCoercing.value)

  return {
    coerceMoney,
    applyCoercion,
    isMoneyLocked,
  }
}
