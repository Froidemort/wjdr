export type CharacterRace = 'elfe' | 'halfling' | 'humain' | 'nain'

export type CharacterGender = 'masculin' | 'féminin'

export interface CreateCharacterPayload {
  userId: string
  sessionId: string
  name: string
  race: CharacterRace
  gender: CharacterGender
}

export interface CharacterCore {
  id: string
  name: string
  race: string
  gender: CharacterGender
  sessionId: string
  userId: string
  careerId: string
  pvCurrent: number
  pvMax: number
  fortuneCurrent: number
  fortuneMax: number
  destinyCurrent: number
  xpTotal: number
  xpAvailable: number
  insanityPoints: number
  moneyGold: number
  moneySilver: number
  moneyCopper: number
}
