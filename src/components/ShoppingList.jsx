import { useMemo, useState } from 'react'
import {
  SHOPPING_CATEGORY_ORDER, ingredientCategory, PLACEHOLDER_IMAGE,
} from '../lib/data.js'
import { convertQuantity, formatQuantity } from '../lib/units.js'
import { weekDates, formatWeekRange, toISODate, addDays } from '../lib/dates.js'

export function buildShoppingItems(plannedEntries, recipeById, recipeOptions) {
  const merged = new Map()
  for (const { recipeId, date, slot } of plannedEntries) {
    const recipe = recipeById.get(recipeId)
    if (!recipe) continue
    const opts = recipeOptions[recipe.id] || {}
    if (opts.includeInShoppingList === false) continue
    const measurement = opts.measurement || 'us'
    for (const section of recipe.ingredientSections) {
      for (const item of section.items) {
        const key = `${item.ingredientId || item.ingredientName.toLowerCase()}|${item.unit}`
        if (!merged.has(key)) {
          merged.set(key, {
            key,
            ingredientId: item.ingredientId,
            name: item.ingredientName,
            unit: item.unit,
            quantity: 0,
            hasQuantity: false,
            notes: new Set(),
            optional: item.optional,
            recipes: new Set(),
            measurement,
            category: ingredientCategory(item.ingredientName, item.ingredientId),
          })
        }
        const entry = merged.get(key)
        const q = Number(item.quantity)
        if (item.quantity != null && item.quantity !== '' && !Number.isNaN(q)) {
          entry.quantity += q
          entry.hasQuantity = true
        }
        if (item.notes) entry.notes.add(item.notes)
        entry.recipes.add(`${recipe.title} (${date}, ${slot})`)
        entry.optional = entry.optional && item.optional
      }
    }
  }
  return Array.from(merged.values()).map((e) => ({ ...e, notes: Array.from(e.notes), recipes: Array.from(e.recipes) }))
}

export default function ShoppingList({
  weekStart, setWeekStart, plannedEntries, recipeById, recipeOptions,
  checked, onToggleChecked, pantry, onTogglePantry, hidePantry, onHidePantryChange, onClearChecked,
}) {
  const [measurement, setMeasurement] = useState('us')
  const [showPantry, setShowPantry] = useState(false)

  const items = useMemo(
    () => buildShoppingItems(plannedEntries, recipeById, recipeOptions),
    [plannedEntries, recipeById, recipeOptions]
  )

  const grouped = useMemo(() => {
    const groups = new Map()
    for (const item of items) {
      if (!groups.has(item.category)) groups.set(item.category, [])
      groups.get(item.category).push(item)
    }
    const ordered = SHOPPING_CATEGORY_ORDER
      .filter((c) => groups.has(c))
      .map((c) => [c, groups.get(c)])
    for (const [c, list] of groups) {
      if (!SHOPPING_CATEGORY_ORDER.includes(c)) ordered.push([c, list])
    }
    return ordered
  }, [items])

  const active = items.filter((i) => !pantry[i.key])
  const inPantry = items.filter((i) => pantry[i.key])
  const unchecked = active.filter((i) => !checked[i.key]).length

  const display = (item) => {
    const conv = convertQuantity(item.hasQuantity ? item.quantity : null, item.unit, measurement)
    const q = formatQuantity(conv.quantity)
    return [q, conv.unit].filter(Boolean).join(' ')
  }

  return (
    <section className="shopping">
      <div className="shopping-header">
        <div>
          <h2>Shopping list</h2>
          <p className="muted">
            {formatWeekRange(weekStart)} · {items.length} item{items.length === 1 ? '' : 's'} · {unchecked} remaining
          </p>
        </div>
        <div className="week-nav">
          <button className="btn" onClick={() => setWeekStart(addDays(weekStart, -7))}>← Prev</button>
          <button className="btn" onClick={() => setWeekStart(addDays(weekStart, 7))}>Next →</button>
        </div>
      </div>

      <div className="shopping-controls">
        <label className={`option-toggle${hidePantry ? ' on' : ''}`}>
          <input type="checkbox" checked={hidePantry} onChange={(e) => onHidePantryChange(e.target.checked)} />
          Exclude ingredients I already have (pantry)
        </label>
        <div className="measurement-switch">
          <button className={measurement === 'us' ? 'on' : ''} onClick={() => setMeasurement('us')}>US</button>
          <button className={measurement === 'metric' ? 'on' : ''} onClick={() => setMeasurement('metric')}>Metric</button>
        </div>
        <button className="btn ghost" onClick={onClearChecked} disabled={!items.some((i) => checked[i.key])}>
          Clear checked
        </button>
      </div>

      {items.length === 0 && (
        <div className="empty-state">
          <img className="empty-img" src={PLACEHOLDER_IMAGE} alt="" />
          <p className="muted">Nothing planned for this week yet. Add recipes in the planner and your shopping list appears here automatically.</p>
        </div>
      )}

      {grouped.map(([category, list]) => {
        const visible = list.filter((i) => !(hidePantry && pantry[i.key]))
        if (!visible.length) return null
        return (
          <div key={category} className="shopping-category">
            <h3>{category} <span className="muted small">({visible.length})</span></h3>
            <ul>
              {visible.map((item) => (
                <li key={item.key} className={checked[item.key] ? 'checked' : ''}>
                  <label className="shop-item">
                    <input
                      type="checkbox"
                      checked={!!checked[item.key]}
                      onChange={() => onToggleChecked(item.key)}
                    />
                    <span className="shop-qty">{display(item) || '—'}</span>
                    <span className="shop-name">
                      {item.name}
                      {item.optional && <span className="tag optional-tag">optional</span>}
                      {item.notes.length > 0 && <span className="muted small"> ({item.notes.join(', ')})</span>}
                    </span>
                    <span className="shop-recipes muted small">{item.recipes.length} recipe{item.recipes.length === 1 ? '' : 's'}</span>
                    <button
                      className="btn icon tiny"
                      title={pantry[item.key] ? 'Not in pantry anymore' : 'I have this in my pantry'}
                      onClick={() => onTogglePantry(item.key)}
                    >
                      {pantry[item.key] ? '↩' : '✓pantry'}
                    </button>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )
      })}

      {inPantry.length > 0 && (
        <div className="shopping-category pantry">
          <h3>
            <button className="btn ghost small" onClick={() => setShowPantry((s) => !s)}>
              {showPantry ? '▾' : '▸'} In pantry (excluded) — {inPantry.length}
            </button>
          </h3>
          {showPantry && (
            <ul>
              {inPantry.map((item) => (
                <li key={item.key} className="pantry-item">
                  <span>{item.name}</span>
                  <button className="btn icon tiny" onClick={() => onTogglePantry(item.key)}>↩ restore</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
