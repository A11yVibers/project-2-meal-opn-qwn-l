// Display-time conversion between US customary and metric measurements.
const TO_METRIC = {
  oz: { unit: 'g', factor: 28.3495 },
  lb: { unit: 'kg', factor: 0.453592 },
  cup: { unit: 'ml', factor: 240 },
  tbsp: { unit: 'ml', factor: 15 },
  tsp: { unit: 'ml', factor: 5 },
}
const TO_US = {
  g: { unit: 'oz', factor: 1 / 28.3495 },
  kg: { unit: 'lb', factor: 1 / 0.453592 },
  ml: { unit: 'cup', factor: 1 / 240 },
  L: { unit: 'cup', factor: 4.22675 },
}

export function convertQuantity(quantity, unit, measurement) {
  if (quantity == null || Number.isNaN(Number(quantity))) return { quantity, unit }
  const q = Number(quantity)
  const map = measurement === 'metric' ? TO_METRIC : TO_US
  const conv = map[unit]
  if (!conv) return { quantity: q, unit }
  return { quantity: roundNice(q * conv.factor), unit: conv.unit }
}

function roundNice(n) {
  if (n >= 100) return Math.round(n)
  if (n >= 10) return Math.round(n * 10) / 10
  return Math.round(n * 100) / 100
}

export function formatQuantity(q) {
  if (q == null || q === '' || Number.isNaN(Number(q))) return ''
  const n = Number(q)
  const rounded = Math.round(n * 100) / 100
  return String(rounded)
}

export function formatMinutes(mins) {
  const m = Number(mins) || 0
  if (m <= 0) return '—'
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `${h} hr ${rest} min` : `${h} hr`
}
