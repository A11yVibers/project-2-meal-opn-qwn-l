import { useEffect, useState } from 'react'
import { MEAL_SLOTS } from '../data/catalog.js'
import { DAY_SHORT, currentWeekStartIso, formatDayLabel, formatWeekRange, fromIsoDate, shiftWeek, toIsoDate, weekDates } from '../lib/dates.js'
import { findAssignment } from '../lib/plan.js'
import { IconChevronLeft, IconChevronRight } from './Icons.jsx'
import { Modal, NumberStepper } from './ui.jsx'
import { RecipeThumb } from './RecipeCatalog.jsx'

export default function AddToPlanDialog({ open, recipe, assignments, initialDate, initialSlot, onClose, onConfirm }) {
  const [weekStart, setWeekStart] = useState(currentWeekStartIso())
  const [date, setDate] = useState(initialDate || toIsoDate(new Date()))
  const [slot, setSlot] = useState(initialSlot || 'Dinner')
  const [servings, setServings] = useState(recipe?.servings || 4)
  const [time, setTime] = useState('18:30')

  useEffect(() => {
    if (!open) return
    const existing = recipe && initialDate ? findAssignment(assignments, initialDate, initialSlot) : null
    setWeekStart(currentWeekStartIso())
    setDate(initialDate || toIsoDate(new Date()))
    setSlot(initialSlot || (recipe?.mealTypeId === 'MT01' ? 'Breakfast' : recipe?.mealTypeId === 'MT02' ? 'Lunch' : recipe?.mealTypeId === 'MT04' ? 'Snack' : 'Dinner'))
    setServings(recipe?.servings || 4)
    setTime(existing?.time || '18:30')
  }, [open, recipe, initialDate, initialSlot, assignments])

  if (!recipe) return null
  const dates = weekDates(weekStart)
  const selectedInWeek = dates.includes(date)

  return (
    <Modal
      open={open}
      title="Add to meal plan"
      description="Choose the week, day, meal slot and serving time for this recipe."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="button button-ghost" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="button button-primary"
            onClick={() => onConfirm({ date, slot, servings, time })}
            disabled={!date || !slot}
          >
            Add to plan
          </button>
        </>
      }
    >
      <div className="plan-recipe-summary" style={{ '--accent': recipe.accentColor }}>
        <RecipeThumb recipe={recipe} size="sm" />
        <div>
          <p className="plan-recipe-title">{recipe.title}</p>
          <p className="plan-recipe-meta">
            Serves {recipe.servings} · {slot}
          </p>
        </div>
      </div>

      <div className="week-picker">
        <button type="button" className="icon-button" aria-label="Previous week" onClick={() => setWeekStart(shiftWeek(weekStart, -1))}>
          <IconChevronLeft />
        </button>
        <div className="week-picker-label">
          <span className="week-picker-title">{formatWeekRange(weekStart)}</span>
          <span className="week-picker-hint">Planning week</span>
        </div>
        <button type="button" className="icon-button" aria-label="Next week" onClick={() => setWeekStart(shiftWeek(weekStart, 1))}>
          <IconChevronRight />
        </button>
        <button type="button" className="button button-ghost button-small" onClick={() => {
          const iso = currentWeekStartIso()
          setWeekStart(iso)
          setDate(iso)
        }}>
          This week
        </button>
      </div>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Planned cooking date</legend>
        <div className="day-choice-row" role="radiogroup" aria-label="Planned cooking date">
          {dates.map((day, index) => {
            const selected = day === date
            return (
              <button
                key={day}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`day-choice ${selected ? 'is-selected' : ''}`}
                onClick={() => setDate(day)}
              >
                <span className="day-choice-name">{DAY_SHORT[index]}</span>
                <span className="day-choice-date">{formatDayLabel(day)}</span>
              </button>
            )
          })}
        </div>
        <div className="field-row">
          <div className="field">
            <label className="field-label" htmlFor="plan-date">Specific date</label>
            <input
              id="plan-date"
              className="input"
              type="date"
              value={date}
              onChange={(event) => {
                const next = event.target.value
                setDate(next)
                if (next) setWeekStart(toIsoDate(new Date(fromIsoDate(next).getFullYear(), fromIsoDate(next).getMonth(), fromIsoDate(next).getDate())))
              }}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="plan-time">Serving time</label>
            <input id="plan-time" className="input" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
          </div>
        </div>
      </fieldset>

      <div className="field-row">
        <div className="field">
          <label className="field-label" htmlFor="plan-slot">Meal slot</label>
          <select id="plan-slot" className="input" value={slot} onChange={(event) => setSlot(event.target.value)}>
            {MEAL_SLOTS.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <span className="field-label" id="plan-servings-label">Servings to plan</span>
          <NumberStepper
            value={servings}
            min={1}
            max={24}
            onChange={setServings}
            label="Servings to plan"
            id="plan-servings"
          />
        </div>
      </div>

      {!selectedInWeek ? (
        <p className="field-hint">
          The selected date is outside the displayed week. Jump to it with “This week” or use the week arrows.
        </p>
      ) : null}
    </Modal>
  )
}
