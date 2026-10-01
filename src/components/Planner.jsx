import { useMemo, useState } from 'react'
import {
  PLANNER_SLOTS, addWeeks, weekDays, fmtDateLabel, fmtWeekLabel,
  thisMondayISO, toISODate, coverImage, mealTypeName, formatQty
} from '../data.js'

function RecipePicker({ recipes, onPick, onClose }) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? recipes.filter(r => r.title.toLowerCase().includes(s)) : recipes
  }, [q, recipes])
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-label="Choose a recipe" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Choose a recipe</h3>
          <button className="btn btn-small" onClick={onClose} aria-label="Close">×</button>
        </div>
        <input
          className="picker-search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search suggested recipes..."
          autoFocus
          aria-label="Search recipes"
        />
        <div className="picker-list">
          {filtered.length === 0 && <p className="empty-note">No suggested recipes match. Enable “available in meal-plan suggestions” on a recipe to see it here.</p>}
          {filtered.map(r => (
            <button key={r.id} className="picker-item" onClick={() => onPick(r.id)}>
              <img src={coverImage(r)} alt="" />
              <span className="picker-item-info">
                <strong>{r.title}</strong>
                <span>{mealTypeName(r.mealTypeId)} · {formatQty(r.servings)} servings · {r.totalMinutes || r.prepMinutes + r.cookMinutes} min</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Planner({ recipes, plan, setPlan, week, setWeek, onOpenRecipe }) {
  const [picking, setPicking] = useState(null)
  const days = weekDays(week)
  const suggestions = recipes.filter(r => r.includeInMealSuggestions)

  const assign = (date, slot, recipeId) => {
    setPlan(p => ({ ...p, [`${date}|${slot}`]: { recipeId, date, slot } }))
    setPicking(null)
  }
  const remove = (date, slot) => {
    setPlan(p => {
      const copy = { ...p }
      delete copy[`${date}|${slot}`]
      return copy
    })
  }

  return (
    <section className="planner">
      <div className="planner-head">
        <h2>Weekly meal planner</h2>
        <div className="week-nav">
          <button className="btn btn-secondary" onClick={() => setWeek(addWeeks(week, -1))}>&lt; Prev week</button>
          <button className="btn btn-secondary" onClick={() => setWeek(thisMondayISO())}>This week</button>
          <button className="btn btn-secondary" onClick={() => setWeek(addWeeks(week, 1))}>Next week &gt;</button>
        </div>
      </div>
      <p className="week-label">{fmtWeekLabel(week)}</p>

      <div className="planner-grid" role="grid" aria-label={`Meal plan for ${fmtWeekLabel(week)}`}>
        <div className="pg-corner" role="columnheader" />
        {days.map(d => {
          const isToday = d === toISODate(new Date())
          return (
            <div key={d} className={`pg-day ${isToday ? 'pg-today' : ''}`} role="columnheader">
              {fmtDateLabel(d)}
            </div>
          )
        })}
        {PLANNER_SLOTS.map(slot => (
          <div key={slot} className="pg-slotrow" role="row">
            <div className="pg-slotname" role="rowheader">{slot}</div>
            {days.map(d => {
              const entry = plan[`${d}|${slot}`]
              const recipe = entry ? recipes.find(r => r.id === entry.recipeId) : null
              return (
                <div key={d} className="pg-cell" role="gridcell">
                  {recipe ? (
                    <div className="slot-filled" style={{ '--accent': recipe.accentColor }}>
                      <button className="slot-title" onClick={() => onOpenRecipe(recipe.id)} title="View recipe">
                        {recipe.title}
                      </button>
                      {entry.time && <span className="slot-time">{entry.time}</span>}
                      <div className="slot-actions">
                        <button className="btn btn-small" onClick={() => setPicking({ date: d, slot })} aria-label={`Replace ${recipe.title}`}>Replace</button>
                        <button className="btn btn-small btn-danger" onClick={() => remove(d, slot)} aria-label={`Remove ${recipe.title} from ${d} ${slot}`}>Remove</button>
                      </div>
                    </div>
                  ) : (
                    <button className="slot-empty" onClick={() => setPicking({ date: d, slot })}
                      aria-label={`Add a recipe to ${slot} on ${fmtDateLabel(d)}`}>
                      +
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {picking && (
        <RecipePicker
          recipes={suggestions}
          onPick={id => assign(picking.date, picking.slot, id)}
          onClose={() => setPicking(null)}
        />
      )}
    </section>
  )
}
