import { ingredientCategory } from '../data/catalog.js'
import { convertQuantity, fromBase, toBase, unitKind } from './measure.js'
import { weekDates } from './dates.js'

function mergeable(unitA, unitB) {
  if (unitA === unitB) return true
  const kind = unitKind(unitA)
  return (kind === 'weight' || kind === 'volume') && unitKind(unitB) === kind
}

function addItem(bucket, entry) {
  const existing = bucket.find((line) => mergeable(line.unit, entry.unit))
  if (!existing) {
    bucket.push({ ...entry })
    return
  }
  if (existing.unit === entry.unit) {
    existing.quantity += entry.quantity
  } else {
    const combined = toBase(existing.quantity, existing.unit) + toBase(entry.quantity, entry.unit)
    const converted = fromBase(combined, existing.unit)
    existing.quantity = Number.isFinite(converted) ? converted : existing.quantity + entry.quantity
  }
  existing.notes = mergeNotes(existing.notes, entry.notes)
  existing.optional = existing.optional && entry.optional
  if (!existing.recipes.includes(entry.recipeTitle)) existing.recipes.push(entry.recipeTitle)
}

function mergeNotes(a, b) {
  const list = String(a || '')
    .split(' · ')
    .map((note) => note.trim())
    .filter(Boolean)
  const extra = String(b || '').trim()
  if (extra && !list.includes(extra)) list.push(extra)
  return list.join(' · ')
}

export function buildShoppingList({ assignments = [], recipesById = {}, weekStartIso, pantry = [], excludePantry = false, categories = [] }) {
  const dates = new Set(weekDates(weekStartIso))
  const planned = assignments.filter((assignment) => dates.has(assignment.date))

  const buckets = new Map()
  const skipped = []

  planned.forEach((assignment) => {
    const recipe = recipesById[assignment.recipeId]
    if (!recipe) return
    if (recipe.options?.includeInShoppingList === false) {
      skipped.push({ recipeId: recipe.id, title: recipe.title, reason: 'Shopping list disabled for this recipe' })
      return
    }
    const scale =
      Number(assignment.servings) > 0 && Number(recipe.servings) > 0
        ? Number(assignment.servings) / Number(recipe.servings)
        : 1

    recipe.sections.forEach((section) => {
      section.items.forEach((item) => {
        const name = String(item.ingredientName || '').trim()
        if (!name) return
        const key = item.ingredientId || name.toLowerCase()
        const quantity = Number(item.quantity)
        if (!buckets.has(key)) {
          buckets.set(key, {
            key,
            name,
            category: ingredientCategory(name),
            lines: []
          })
        }
        addItem(buckets.get(key).lines, {
          quantity: Number.isFinite(quantity) ? quantity * scale : 0,
          hasQuantity: Number.isFinite(quantity),
          unit: item.unit || '',
          notes: item.notes || '',
          optional: Boolean(item.optional),
          recipes: [recipe.title],
          servings: assignment.servings ?? null,
          slot: assignment.slot,
          date: assignment.date
        })
      })
    })
  })

  const pantrySet = new Set(pantry)
  const items = []
  const held = []

  buckets.forEach((bucket) => {
    bucket.lines.forEach((line) => {
      const item = {
        id: `${bucket.key}|${line.unit || 'none'}`,
        key: bucket.key,
        name: bucket.name,
        category: bucket.category,
        quantity: line.hasQuantity ? Math.round(line.quantity * 1000) / 1000 : null,
        unit: line.unit,
        notes: line.notes,
        optional: line.optional,
        recipes: line.recipes,
        inPantry: pantrySet.has(bucket.key)
      }
      if (excludePantry && item.inPantry) held.push(item)
      else items.push(item)
    })
  })

  const order = categories.length ? categories : []
  const groups = []
  const grouped = new Map()
  items.forEach((item) => {
    if (!grouped.has(item.category)) {
      grouped.set(item.category, [])
      groups.push({ category: item.category, items: grouped.get(item.category) })
    }
    grouped.get(item.category).push(item)
  })
  groups.sort((a, b) => {
    const ai = order.indexOf(a.category)
    const bi = order.indexOf(b.category)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.category.localeCompare(b.category)
  })
  groups.forEach((group) => group.items.sort((a, b) => a.name.localeCompare(b.name)))

  return { groups, items, held, skipped, plannedCount: planned.length }
}

export function displayItemAmount(item, system) {
  if (item.quantity == null) return ''
  const converted = convertQuantity(item.quantity, item.unit, system)
  return { quantity: converted.quantity, unit: converted.unit }
}
