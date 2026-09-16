import { useMemo, useState } from 'react'
import {
  cuisineName, mealTypeName, PLACEHOLDER_IMAGE, spiceLabel,
} from '../lib/data.js'
import { formatMinutes } from '../lib/units.js'

export default function RecipeCatalog({ recipes, onOpen, onAdd, plannedIds }) {
  const [query, setQuery] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [mealType, setMealType] = useState('')

  const cuisines = useMemo(
    () => Array.from(new Set(recipes.map((r) => r.cuisineId).filter(Boolean))).sort(),
    [recipes]
  )
  const mealTypes = useMemo(
    () => Array.from(new Set(recipes.map((r) => r.mealTypeId).filter(Boolean))).sort(),
    [recipes]
  )

  const filtered = recipes.filter((r) => {
    if (cuisine && r.cuisineId !== cuisine) return false
    if (mealType && r.mealTypeId !== mealType) return false
    if (query) {
      const q = query.toLowerCase()
      const hay = [r.title, r.shortDescription, cuisineName(r.cuisineId), mealTypeName(r.mealTypeId)]
        .join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  return (
    <section className="catalog">
      <div className="catalog-header">
        <div>
          <h2>Recipe catalog</h2>
          <p className="muted">{filtered.length} recipe{filtered.length === 1 ? '' : 's'}</p>
        </div>
        <button className="btn primary" onClick={onAdd}>+ Add recipe</button>
      </div>

      <div className="catalog-filters">
        <input
          type="search"
          placeholder="Search recipes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
          <option value="">All cuisines</option>
          {cuisines.map((c) => <option key={c} value={c}>{cuisineName(c)}</option>)}
        </select>
        <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
          <option value="">All meal types</option>
          {mealTypes.map((m) => <option key={m} value={m}>{mealTypeName(m)}</option>)}
        </select>
      </div>

      {filtered.length === 0 && (
        <p className="muted empty-note">No recipes match your filters.</p>
      )}

      <div className="recipe-grid">
        {filtered.map((r) => (
          <article
            key={r.id}
            className="recipe-card"
            style={{ '--accent': r.accentColor }}
            onClick={() => onOpen(r.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onOpen(r.id) }}
          >
            <div className="recipe-card-img">
              <img src={r.coverImageUrl || PLACEHOLDER_IMAGE} alt={r.title} loading="lazy" />
              {plannedIds.has(r.id) && <span className="badge planned-badge">Planned</span>}
              {!r.isSeed && <span className="badge user-badge">Yours</span>}
            </div>
            <div className="recipe-card-body">
              <h3>{r.title}</h3>
              <p className="muted small">{r.shortDescription}</p>
              <div className="chip-row">
                <span className="chip">{mealTypeName(r.mealTypeId)}</span>
                <span className="chip">{cuisineName(r.cuisineId)}</span>
                <span className="chip">{formatMinutes(r.totalMinutes)}</span>
                <span className="chip">{r.servings} servings</span>
                {r.spiceLevel > 0 && <span className="chip">{spiceLabel(r.spiceLevel)}</span>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
