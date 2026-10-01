import { useMemo, useState } from 'react'
import {
  SHOPPING_CATEGORIES, ingredientCategory, convertQuantity, formatQty,
  weekDays, fmtWeekLabel, addWeeks, thisMondayISO
} from '../data.js'

export default function ShoppingList({ recipes, plan, week, setWeek, optionsFor, checked, setChecked, pantry, setPantry }) {
  const [hidePantry, setHidePantry] = useState(true)
  const days = weekDays(week)

  const { groups, allKeys } = useMemo(() => {
    const map = new Map()
    for (const day of days) {
      for (const key of Object.keys(plan)) {
        const [date, slot] = key.split('|')
        if (date !== day) continue
        const entry = plan[key]
        const recipe = recipes.find(r => r.id === entry.recipeId)
        if (!recipe) continue
        const opts = optionsFor(recipe)
        if (!opts.includeInShoppingList) continue
        for (const ing of recipe.ingredients) {
          const conv = convertQuantity(ing.quantity, ing.unit, opts.unitSystem)
          const itemKey = `${ing.name.toLowerCase()}|${conv.unit || ''}`
          const existing = map.get(itemKey)
          if (existing) {
            existing.quantity = (existing.quantity || 0) + (Number(conv.qty) || 0)
            existing.sources.add(`${recipe.title}${slot ? ` (${day} ${slot})` : ''}`)
            if (ing.optional) existing.optionalOnly = existing.optionalOnly && true
            else existing.optionalOnly = false
          } else {
            map.set(itemKey, {
              itemKey,
              name: ing.name,
              quantity: Number(conv.qty) || 0,
              unit: conv.unit || '',
              notes: ing.notes || '',
              category: ingredientCategory(ing),
              optionalOnly: Boolean(ing.optional),
              sources: new Set([`${recipe.title} (${day} ${slot})`])
            })
          }
        }
      }
    }
    const items = [...map.values()]
    const groups = SHOPPING_CATEGORIES
      .map(cat => ({ cat, items: items.filter(i => i.category === cat) }))
      .filter(g => g.items.length > 0)
    const other = items.filter(i => !SHOPPING_CATEGORIES.includes(i.category))
    if (other.length) groups.push({ cat: 'Other', items: other })
    return { groups, allKeys: items.map(i => i.itemKey) }
  }, [days, plan, recipes, optionsFor])

  const toggleChecked = key =>
    setChecked(c => ({ ...c, [key]: !c[key] }))

  const togglePantry = name =>
    setPantry(p => p.includes(name) ? p.filter(n => n !== name) : [...p, name])

  const visibleGroups = hidePantry
    ? groups.map(g => ({ ...g, items: g.items.filter(i => !pantry.includes(i.name)) })).filter(g => g.items.length)
    : groups

  const totalItems = allKeys.length
  const checkedCount = allKeys.filter(k => checked[k]).length

  return (
    <section className="shopping">
      <div className="planner-head">
        <h2>Shopping list</h2>
        <div className="week-nav">
          <button className="btn btn-secondary" onClick={() => setWeek(addWeeks(week, -1))}>&lt; Prev week</button>
          <button className="btn btn-secondary" onClick={() => setWeek(thisMondayISO())}>This week</button>
          <button className="btn btn-secondary" onClick={() => setWeek(addWeeks(week, 1))}>Next week &gt;</button>
        </div>
      </div>
      <p className="week-label">Generated from the meal plan for {fmtWeekLabel(week)}</p>

      <div className="shopping-toolbar">
        <label className="check-line inline">
          <input type="checkbox" checked={hidePantry} onChange={e => setHidePantry(e.target.checked)} />
          Exclude ingredients I already have in my pantry
        </label>
        <span className="progress-note">{checkedCount} of {totalItems} items checked</span>
        <button className="btn btn-secondary" onClick={() => setChecked({})} disabled={checkedCount === 0}>
          Reset checked items
        </button>
      </div>

      {totalItems === 0 ? (
        <p className="empty-note">
          Nothing planned for this week yet. Add recipes to the planner and the shopping list will build itself.
        </p>
      ) : (
        <div className="shopping-groups">
          {visibleGroups.map(g => (
            <div key={g.cat} className="shopping-group">
              <h3>{g.cat}</h3>
              <ul>
                {g.items.map(item => {
                  const isChecked = Boolean(checked[item.itemKey])
                  const inPantry = pantry.includes(item.name)
                  return (
                    <li key={item.itemKey} className={`shop-item ${isChecked ? 'checked' : ''} ${inPantry ? 'in-pantry' : ''}`}>
                      <label className="shop-main">
                        <input type="checkbox" checked={isChecked} onChange={() => toggleChecked(item.itemKey)} />
                        <span className="shop-name">
                          <strong>{item.quantity ? `${formatQty(item.quantity)} ${item.unit}`.trim() : item.unit || ''} {item.name}</strong>
                          {item.notes && <em> — {item.notes}</em>}
                          {item.optionalOnly && <span className="tag-optional">optional</span>}
                        </span>
                      </label>
                      <span className="shop-sources" title={[...item.sources].join('\n')}>
                        {[...item.sources][0]}{item.sources.size > 1 ? ` +${item.sources.size - 1}` : ''}
                      </span>
                      <button
                        className={`btn btn-small ${inPantry ? 'btn-primary' : ''}`}
                        onClick={() => togglePantry(item.name)}
                        aria-pressed={inPantry}
                        title={inPantry ? 'Remove from pantry' : 'Mark as already in pantry'}
                      >
                        {inPantry ? 'In pantry' : 'Have it'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          {visibleGroups.length === 0 && totalItems > 0 && (
            <p className="empty-note">Every ingredient on this list is marked as in your pantry.</p>
          )}
        </div>
      )}
    </section>
  )
}
