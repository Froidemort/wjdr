export type CharacterTabId = 'profile' | 'skills' | 'talents' | 'inventory'

export interface CharacterQuickValues {
  pvMax: number
  pvCurrent: number
  fortuneMax: number
  fortuneCurrent: number
  destinyCurrent: number
  destinyMax: number
  xpTotal: number
  xpAvailable: number
  insanityPoints: number
  moneyGold: number
  moneySilver: number
  moneyCopper: number
}

export type CharacterQuickField = keyof CharacterQuickValues
