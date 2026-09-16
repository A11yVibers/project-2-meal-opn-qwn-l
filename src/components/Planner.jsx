import { useMemo, useState } from 'react'
import { MEAL_SLOTS, PLACEHOLDER_IMAGE, mealTypeName } from '../lib/data.js'
import { weekDates, formatDayLabel, formatWeekRange, toISODate, addDays } from '../lib/dates.js'

export default function Planner({
  weekStart, setWeekStart, recipes, mealPlan, onAssign, onRemove, onOpenRecipe,
}) {
  const [picker, setPicker] = useState(null) // {date, slot} | null
  const [search, setSearch] = useState('')
  const [suggestedOnly, setSuggestedOnly] = useState(true)

  const days = useMemo(() => weekDates(weekStart), [weekStart])
  const recipeById = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes])
  const todayISO = toISODate(new Date())

  const candidates = recipes.filter((r) => {
    if (suggestedOnly && !r.includeInSuggestions) return false
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const slotEntry = (dateISO, slot) => mealPlan[dateISO]?.[slot]

  return (
    <section className="planner">
      <div className="planner-header">
        <div>
          <h2>Weekly meal planner</h2>
          <p className="muted">{formatWeekRange(weekStart)}</p>
        </div>
        <div className="week-nav">
          <button className="btn" onClick={() => setWeekStart(addDays(weekStart, -7))}>← Prev</button>
          <button className="btn" onClick={() => setWeekStart(startOfThisWeek())}>Today</button>
          <button className="btn" onClick={() => setWeekStart(addDays(weekStart, 7))}>Next →</button>
        </div>
      </div>

      <div className="planner-grid">
        <div className="planner-corner">Meal</div>
        {days.map((d) => {
          const iso = toISODate(d)
          return (
            <div key={iso} className={`planner-day-header${iso === todayISO ? ' today' : ''}`}>
              {formatDayLabel(d)}
            </div>
          )
        })}

        {MEAL_SLOTS.map((slot) => (
          <div key={slot} className="planner-row">
            <div className="planner-slot-label">{slot}</div>
            {days.map((d) => {
              const iso = toISODate(d)
              const entry = slotEntry(iso, slot)
              const recipe = entry ? recipeById.get(entry.recipeId) : null
              return (
                <div key={iso} className={`planner-cell${iso === todayISO ? ' today' : ''}`}>
                  {recipe ? (
                    <div
                      className="planned-card"
                      style={{ '--accent': recipe.accentColor }}
                      onClick={() => setPicker({ date: iso, slot, replace: true })}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') setPicker({ date: iso, slot, replace: true }) }}
                    >
                      <img src={recipe.coverImageUrl || PLACEHOLDER_IMAGE} alt="" />
                      <div className="planned-info">
                        <strong title={recipe.title}>{recipe.title}</strong>
                        {entry.time && <span className="muted small">{entry.time}</span>}
                      </div>
                      <div className="planned-actions" onClick={(e) => e.stopPropagation()}>
                        <button className="btn icon tiny" title="View recipe" onClick={() => onOpenRecipe(recipe.id)}>👁</button>
                        <button className="btn icon tiny danger" title="Remove from plan" onClick={() => onRemove(iso, slot)}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <button className="empty-slot" onClick={() => setPicker({ date: iso, slot })}>
                      +
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {picker && (
        <div className="modal-backdrop" onClick={() => setPicker(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {picker.replace ? 'Replace or remove' : 'Choose a recipe'} — {formatDayLabel(new Date(picker.date + 'T00:00:00'))}, {picker.slot}
              </h3>
              <button className="btn icon" onClick={() => setPicker(null)}>✕</button>
            </div>
            {picker.replace && (
              <button
                className="btn danger-outline full"
                onClick={() => { onRemove(picker.date, picker.slot); setPicker(null) }}
              >
                Remove from plan
              </button>
            )}
            <div className="picker-controls">
              <input
                type="search" autoFocus placeholder="Search recipes…"
                value={search} onChange={(e) => setSearch(e.target.value)}
              />
              <label className={`option-toggle${suggestedOnly ? ' on' : ''}`}>
                <input type="checkbox" checked={suggestedOnly} onChange={(e) => setSuggestedOnly(e.target.checked)} />
                Suggested only
              </label>
            </div>
            <ul className="picker-list">
              {candidates.length === 0 && <li className="muted">No recipes match.</li>}
              {candidates.map((r) => (
                <li key={r.id}>
                  <button
                    className="picker-item"
                    onClick={() => { onAssign(picker.date, picker.slot, r.id, ''); setPicker(null); setSearch('') }}
                  >
                    <img src={r.coverImageUrl || PLACEHOLDER_IMAGE} alt="" />
                    <span className="picker-item-info">
                      <strong>{r.title}</strong>
                      <span className="muted small">{mealTypeName(r.mealTypeId)}</span>
                    </span>
                    {r.includeInSuggestions && <span className="tag">Suggested</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}

function startOfThisWeek() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d
}
