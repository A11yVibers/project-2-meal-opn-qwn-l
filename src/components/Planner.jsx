import { useState } from 'react'
import { MEAL_SLOTS } from '../data/catalog.js'
import {
  DAY_NAMES,
  DAY_SHORT,
  currentWeekStartIso,
  formatDayLabel,
  formatTime,
  formatWeekRange,
  isToday,
  shiftWeek,
  weekDates
} from '../lib/dates.js'
import { findAssignment } from '../lib/plan.js'
import { IconCalendar, IconChevronLeft, IconChevronRight, IconClose, IconEdit, IconPlus } from './Icons.jsx'
import { RecipeThumb } from './RecipeCatalog.jsx'
import RecipePickerModal from './RecipePickerModal.jsx'

const DEFAULT_TIMES = { Breakfast: '07:30', Lunch: '12:30', Dinner: '18:30', Snack: '15:30' }

export default function Planner({
  weekStart,
  onWeekStartChange,
  assignments,
  recipesById,
  recipes,
  onAssign,
  onRemove,
  onOpenRecipe,
  onNewRecipe,
  onOpenShopping,
  onClearWeek
}) {
  const [picker, setPicker] = useState(null)
  const dates = weekDates(weekStart)
  const weekAssignments = assignments.filter((item) => dates.includes(item.date))

  function openPicker(date, slot) {
    setPicker({ date, slot })
  }

  function handlePick(recipe) {
    if (!picker) return
    onAssign({
      date: picker.date,
      slot: picker.slot,
      recipeId: recipe.id,
      servings: recipe.servings,
      time: findAssignment(assignments, picker.date, picker.slot)?.time || DEFAULT_TIMES[picker.slot] || ''
    })
    setPicker(null)
  }

  return (
    <section className="planner" aria-labelledby="planner-heading">
      <header className="page-header">
        <div>
          <h1 id="planner-heading">Weekly meal planner</h1>
          <p className="page-subtitle">
            {weekAssignments.length} meal{weekAssignments.length === 1 ? '' : 's'} planned this week
          </p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="button button-ghost" onClick={onOpenShopping}>
            <IconCalendar width={15} height={15} /> Shopping list
          </button>
          {weekAssignments.length > 0 ? (
            <button type="button" className="button button-ghost" onClick={onClearWeek}>
              Clear week
            </button>
          ) : null}
        </div>
      </header>

      <div className="week-nav">
        <button type="button" className="icon-button" aria-label="Previous week" onClick={() => onWeekStartChange(shiftWeek(weekStart, -1))}>
          <IconChevronLeft />
        </button>
        <div className="week-nav-label">
          <strong>{formatWeekRange(weekStart)}</strong>
          <span>Monday to Sunday</span>
        </div>
        <button type="button" className="icon-button" aria-label="Next week" onClick={() => onWeekStartChange(shiftWeek(weekStart, 1))}>
          <IconChevronRight />
        </button>
        <button type="button" className="button button-secondary button-small" onClick={() => onWeekStartChange(currentWeekStartIso())}>
          This week
        </button>
      </div>

      <div className="planner-grid">
        {dates.map((date, dayIndex) => {
          const today = isToday(date)
          return (
            <section key={date} className={`day-column ${today ? 'is-today' : ''}`} aria-labelledby={`day-${date}`}>
              <div className="day-header">
                <h2 className="day-name" id={`day-${date}`}>
                  <span aria-hidden="true" className="day-name-short">{DAY_SHORT[dayIndex]}</span>
                  <span className="day-name-full">{DAY_NAMES[dayIndex]}</span>
                </h2>
                <span className="day-date">{formatDayLabel(date)}</span>
                {today ? <span className="pill pill-today">Today</span> : null}
              </div>
              <ul className="day-slots" role="list">
                {MEAL_SLOTS.map((slot) => {
                  const assignment = findAssignment(assignments, date, slot)
                  const recipe = assignment ? recipesById[assignment.recipeId] : null
                  return (
                    <li key={slot} className="slot">
                      <h3 className="slot-name" id={`slot-${date}-${slot}`}>{slot}</h3>
                      {recipe ? (
                        <div className="slot-filled" style={{ '--accent': recipe.accentColor }} aria-labelledby={`slot-${date}-${slot}`}>
                          <button type="button" className="slot-recipe" onClick={() => onOpenRecipe(recipe.id)}>
                            <RecipeThumb recipe={recipe} size="xs" />
                            <span className="slot-recipe-text">
                              <span className="slot-recipe-title">{recipe.title}</span>
                              <span className="slot-recipe-meta">
                                {assignment.servings ? `${assignment.servings} servings` : `Serves ${recipe.servings}`}
                                {assignment.time ? ` · ${formatTime(assignment.time)}` : ''}
                              </span>
                            </span>
                          </button>
                          <div className="slot-tools">
                            <button
                              type="button"
                              className="icon-button icon-small"
                              aria-label={`Replace ${recipe.title} for ${slot} on ${formatDayLabel(date)}`}
                              title="Replace"
                              onClick={() => openPicker(date, slot)}
                            >
                              <IconEdit width={15} height={15} />
                            </button>
                            <button
                              type="button"
                              className="icon-button icon-small"
                              aria-label={`Remove ${recipe.title} from ${slot} on ${formatDayLabel(date)}`}
                              title="Remove"
                              onClick={() => onRemove(date, slot)}
                            >
                              <IconClose width={15} height={15} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="slot-empty"
                          onClick={() => openPicker(date, slot)}
                          aria-label={`Add a recipe to ${slot} on ${formatDayLabel(date)}`}
                        >
                          <IconPlus width={15} height={15} />
                          <span>Add recipe</span>
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>

      <div className="planner-footer">
        <button type="button" className="button button-primary" onClick={onNewRecipe}>
          + New recipe
        </button>
        <button type="button" className="button button-ghost" onClick={onOpenShopping}>
          View shopping list
        </button>
      </div>

      <RecipePickerModal
        open={Boolean(picker)}
        date={picker?.date}
        slot={picker?.slot}
        recipes={recipes}
        onClose={() => setPicker(null)}
        onPick={handlePick}
        onNewRecipe={
          onNewRecipe
            ? () => {
                setPicker(null)
                onNewRecipe()
              }
            : null
        }
      />
    </section>
  )
}
