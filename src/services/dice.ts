export interface PercentileCheckInput {
  baseTarget: number
  difficulty?: number
  modifier?: number
  roll?: number
}

export interface PercentileCheckResult {
  roll: number
  baseTarget: number
  effectiveTarget: number
  success: boolean
  margin: number
  tensMargin: number
  isDouble: boolean
}

export type BonusExpressionValues = Record<string, number>

const BONUS_EXPRESSION_PATTERN = /^([A-Z]+)([+-]\d+)?$/

function clampPercentileTarget(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.min(99, Math.max(0, Math.trunc(value)))
}

function normalizePercentileRoll(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error('Invalid percentile roll.')
  }

  const normalized = Math.trunc(value)
  if (normalized < 1 || normalized > 100) {
    throw new Error('Percentile roll must be between 1 and 100.')
  }

  return normalized
}

export function rollPercentile(random: () => number = Math.random): number {
  const result = Math.floor(random() * 100) + 1
  return normalizePercentileRoll(result)
}

export function resolvePercentileCheck(input: PercentileCheckInput): PercentileCheckResult {
  const roll = normalizePercentileRoll(input.roll ?? rollPercentile())
  const effectiveTarget = clampPercentileTarget(input.baseTarget + (input.difficulty ?? 0) + (input.modifier ?? 0))
  const margin = effectiveTarget - roll

  return {
    roll,
    baseTarget: Math.trunc(input.baseTarget),
    effectiveTarget,
    success: roll <= effectiveTarget,
    margin,
    tensMargin: Math.trunc(Math.abs(margin) / 10),
    isDouble: roll >= 11 && roll < 100 && roll % 11 === 0
  }
}

export function evaluateBonusExpression(expression: string, values: BonusExpressionValues): number {
  const normalized = expression.trim().toUpperCase()
  const match = BONUS_EXPRESSION_PATTERN.exec(normalized)

  if (!match) {
    throw new Error('Invalid bonus expression.')
  }

  const statKey = match[1]
  const modifier = match[2] ? Number(match[2]) : 0
  const statValue = values[statKey]

  if (!Number.isFinite(statValue)) {
    throw new Error(`Missing value for ${statKey}.`)
  }

  return Math.trunc(statValue) + modifier
}
