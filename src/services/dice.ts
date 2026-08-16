export interface ResolvePercentileCheckInput {
  baseTarget: number
  difficulty?: number
  modifier?: number
  roll: number
}

export interface ResolvePercentileCheckResult {
  roll: number
  baseTarget: number
  effectiveTarget: number
  success: boolean
  margin: number
  tensMargin: number
  isDouble: boolean
}

function clampPercentileTarget(value: number): number {
  return Math.max(1, Math.min(99, Math.floor(value)))
}

function isDoubleRoll(roll: number): boolean {
  if (roll < 11 || roll > 99) {
    return false
  }

  const tens = Math.floor(roll / 10)
  const ones = roll % 10
  return tens === ones
}

export function resolvePercentileCheck(
  input: ResolvePercentileCheckInput
): ResolvePercentileCheckResult {
  const baseTarget = Math.floor(input.baseTarget)
  const effectiveTarget = clampPercentileTarget(
    baseTarget + (input.difficulty ?? 0) + (input.modifier ?? 0)
  )
  const roll = Math.max(1, Math.min(100, Math.floor(input.roll)))
  const margin = effectiveTarget - roll

  return {
    roll,
    baseTarget,
    effectiveTarget,
    success: roll <= effectiveTarget,
    margin,
    tensMargin: Math.floor(Math.abs(margin) / 10),
    isDouble: isDoubleRoll(roll),
  }
}

export function evaluateBonusExpression(
  expression: string,
  bonuses: Record<string, number>
): number {
  const normalized = expression.trim().toUpperCase()
  const match = normalized.match(/^([A-Z]+)([+-]\d+)?$/)

  if (!match) {
    return 0
  }

  const statCode = match[1]
  const modifier = match[2] ? Number(match[2]) : 0
  const base = Number(bonuses[statCode] ?? 0)

  return base + modifier
}

export function rollPercentile(randomSource: () => number = Math.random): number {
  const raw = randomSource()
  const clamped = Math.max(0, Math.min(0.999999, raw))
  return Math.floor(clamped * 100) + 1
}
