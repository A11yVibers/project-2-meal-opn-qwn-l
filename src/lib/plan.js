import { createId } from './storage.js'

export function assignmentId(date, slot) {
  return `${date}|${slot}`
}

export function findAssignment(assignments, date, slot) {
  return assignments.find((item) => item.date === date && item.slot === slot) || null
}

export function upsertAssignment(assignments, { date, slot, recipeId, servings = null, time = '' }) {
  const existing = findAssignment(assignments, date, slot)
  if (existing) {
    return assignments.map((item) =>
      item === existing ? { ...item, recipeId, servings, time: time || item.time || '' } : item
    )
  }
  return [
    ...assignments,
    { id: createId('plan'), date, slot, recipeId, servings, time: time || '' }
  ]
}

export function removeAssignment(assignments, date, slot) {
  return assignments.filter((item) => !(item.date === date && item.slot === slot))
}

export function assignmentsForDate(assignments, date) {
  return assignments.filter((item) => item.date === date)
}

export function countForWeek(assignments, dates) {
  const set = new Set(dates)
  return assignments.filter((item) => set.has(item.date)).length
}
