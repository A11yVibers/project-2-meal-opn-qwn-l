import { useMemo, useState } from 'react'
import { cuisineName, mealTypeName } from '../data/catalog.js'
import { formatMinutes } from '../lib/measure.js'
import { formatDayLabel, formatTime } from '../lib/dates.js'
import { Modal } from './ui.jsx'
import { RecipeThumb } from './RecipeCatalog.jsx'

export default function RecipePickerModal({ open, date, slot, recipes, onClose, onPick, onNewRecipe }) {
  const [query, setQuery] = useState('')
  const [onlySuggestions, setOnlySuggestions] = useState(false)

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return recipes
      .filter((recipe) => (onlySuggestions ? recipe.includeInMealSuggestions : true))
      .filter((recipe) => {
        if (!needle) return true
        return [recipe.title, cuisineName(recipe.cuisineId), mealTypeName(recipe.mealTypeId), recipe.shortDescription]
          .join(' ')
          .toLowerCase()
          .includes(needle)
      })
      .sort((a, b) => {
        const aSuggested = a.includeInMealSuggestions ? 0 : 1
        const bSuggested = b.includeInMealSuggestions ? 0 : 1
        return aSuggested - bSuggested || a.title.localeCompare(b.title)
      })
  }, [recipes, query, onlySuggestions])

  return (
    <Modal
      open={open}
      title={`Choose a recipe for ${slot || 'this slot'}`}
      description={date ? `${formatDayLabel(date)}${slot ? ` · ${slot}` : ''}` : undefined}
      onClose={onClose}
      size="lg"
      footer={
        onNewRecipe ? (
          <button type="button" className="button button-ghost" onClick={onNewRecipe}>
            Create a new recipe instead
          </button>
        ) : null
      }
    >
      <div className="picker-toolbar">
        <label className="visually-hidden" htmlFor="picker-search">Search recipes</label>
        <input
          id="picker-search"
          className="input"
          type="search"
          placeholder="Search recipes…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <label className="checkbox-inline">
          <input
            type="checkbox"
            checked={onlySuggestions}
            onChange={(event) => setOnlySuggestions(event.target.checked)}
          />
          <span>Suggestions only</span>
        </label>
      </div>

      {results.length === 0 ? (
        <p className="empty-inline">No recipes match. Try clearing the search or create a new recipe.</p>
      ) : (
        <ul className="picker-list" role="list">
          {results.map((recipe) => (
            <li key={recipe.id}>
              <button type="button" className="picker-item" onClick={() => onPick(recipe)} style={{ '--accent': recipe.accentColor }}>
                <RecipeThumb recipe={recipe} size="sm" />
                <span className="picker-text">
                  <span className="picker-title">
                    {recipe.title}
                    {recipe.includeInMealSuggestions ? <span className="pill pill-suggest">suggested</span> : null}
                  </span>
                  <span className="picker-meta">
                    {[cuisineName(recipe.cuisineId), mealTypeName(recipe.mealTypeId), formatMinutes(recipe.totalMinutes)]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                <span className="picker-action">Assign</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

export function SlotTimeLabel({ time }) {
  return time ? <span className="slot-time">{formatTime(time)}</span> : null
}
