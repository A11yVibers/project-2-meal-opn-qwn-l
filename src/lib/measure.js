export const MEASUREMENT_SYSTEMS = [
  { id: 'us', label: 'US customary' },
  { id: 'metric', label: 'Metric' }
]

const WEIGHT_TO_GRAMS = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 }
const VOLUME_TO_ML = { ml: 1, L: 1000, tsp: 4.929, tbsp: 14.787, cup: 236.588 }

const UNIT_KIND = {}
Object.keys(WEIGHT_TO_GRAMS).forEach((unit) => {
  UNIT_KIND[unit] = 'weight'
})
Object.keys(VOLUME_TO_ML).forEach((unit) => {
  UNIT_KIND[unit] = 'volume'
})
;['piece', 'clove', 'can', 'package', 'pinch', 'to taste'].forEach((unit) => {
  UNIT_KIND[unit] = 'count'
})

export function unitKind(unit) {
  return UNIT_KIND[unit] || 'count'
}

export function toBase(quantity, unit) {
  if (!Number.isFinite(quantity)) return null
  if (unitKind(unit) === 'weight') return quantity * WEIGHT_TO_GRAMS[unit]
  if (unitKind(unit) === 'volume') return quantity * VOLUME_TO_ML[unit]
  return quantity
}

export function fromBase(value, unit) {
  if (!Number.isFinite(value)) return null
  if (unitKind(unit) === 'weight') return value / WEIGHT_TO_GRAMS[unit]
  if (unitKind(unit) === 'volume') return value / VOLUME_TO_ML[unit]
  return value
}

const METRIC_MAP = {
  oz: { unit: 'g', factor: WEIGHT_TO_GRAMS.oz },
  lb: { unit: 'g', factor: WEIGHT_TO_GRAMS.lb },
  cup: { unit: 'ml', factor: VOLUME_TO_ML.cup },
  tbsp: { unit: 'ml', factor: VOLUME_TO_ML.tbsp },
  tsp: { unit: 'ml', factor: VOLUME_TO_ML.tsp },
  L: { unit: 'ml', factor: 1000 },
  kg: { unit: 'g', factor: 1000 }
}

const US_MAP = {
  g: { unit: 'oz', factor: 1 / WEIGHT_TO_GRAMS.oz },
  kg: { unit: 'lb', factor: WEIGHT_TO_GRAMS.kg / WEIGHT_TO_GRAMS.lb },
  ml: { unit: 'tbsp', factor: 1 / VOLUME_TO_ML.tbsp },
  L: { unit: 'cup', factor: 1000 / VOLUME_TO_ML.cup }
}

function tidy(quantity, unit) {
  if (unit === 'g' && quantity >= 1000) return { quantity: quantity / 1000, unit: 'kg' }
  if (unit === 'ml' && quantity >= 1000) return { quantity: quantity / 1000, unit: 'L' }
  if (unit === 'oz' && quantity >= 16) return { quantity: quantity / 16, unit: 'lb' }
  if (unit === 'tbsp' && quantity >= 8) return { quantity: quantity / 8, unit: 'cup' }
  return { quantity, unit }
}

export function convertQuantity(quantity, unit, system) {
  if (!Number.isFinite(quantity) || !unit) return { quantity, unit }
  const map = system === 'metric' ? METRIC_MAP : US_MAP
  const rule = map[unit]
  if (!rule) return tidy(quantity, unit)
  return tidy(quantity * rule.factor, rule.unit)
}

const FRACTIONS = [
  { value: 0.125, text: '⅛' },
  { value: 0.25, text: '¼' },
  { value: 0.333, text: '⅓' },
  { value: 0.375, text: '⅜' },
  { value: 0.5, text: '½' },
  { value: 0.667, text: '⅔' },
  { value: 0.75, text: '¾' }
]

export function formatQuantity(value) {
  if (!Number.isFinite(value)) return ''
  if (value === 0) return '0'
  const rounded = Math.round(value * 100) / 100
  if (rounded >= 20) return String(Math.round(rounded))
  const whole = Math.floor(rounded)
  const remainder = rounded - whole
  if (remainder < 0.06) return String(whole)
  const fraction = FRACTIONS.reduce(
    (best, candidate) =>
      Math.abs(candidate.value - remainder) < Math.abs(best.value - remainder) ? candidate : best,
    FRACTIONS[0]
  )
  if (Math.abs(fraction.value - remainder) > 0.08) {
    return String(Math.round(rounded * 10) / 10)
  }
  return whole > 0 ? `${whole}${fraction.text}` : fraction.text
}

export function formatAmount(quantity, unit, system) {
  const converted = convertQuantity(Number(quantity), unit, system)
  const amount = formatQuantity(converted.quantity)
  if (!amount) return ''
  return converted.unit ? `${amount} ${converted.unit}` : amount
}

export function formatMinutes(minutes) {
  const total = Number(minutes) || 0
  if (total <= 0) return '—'
  if (total < 60) return `${Math.round(total)} min`
  const hours = Math.floor(total / 60)
  const mins = Math.round(total % 60)
  return mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`
}

export function totalMinutes(recipe) {
  return (Number(recipe?.prepMinutes) || 0) + (Number(recipe?.cookMinutes) || 0)
}
