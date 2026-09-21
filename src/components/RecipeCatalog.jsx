import { useMemo, useState } from 'react'
import {
  CUISINES,
  DIETARY_TAGS,
  MEAL_TYPES,
  RECIPE_CATEGORIES,
  categoryNames,
  cuisineName,
  dietaryTagNames,
  mealTypeName
} from '../data/catalog.js'
import { SPICE_LEVELS } from '../data/catalog.js'
import { recipeImage } from '../lib/recipes.js'
import { formatMinutes, totalMinutes } from '../lib/measure.js'
import { IconCalendar, IconClock, IconFlame, IconUsers } from './Icons.jsx'

export function SpiceDots({ level }) {
  const label = SPICE_LEVELS.find((item) => item.value === Number(level))?.label || 'Not spicy'
  return (
    <span className="spice" title={`Spice level: ${label}`}>
      <IconFlame width={14} height={14} />
      <span className="spice-dots" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((dot) => (
          <span key={dot} className={`spice-dot ${dot <= Number(level) ? 'is-on' : ''}`} />
        ))}
      </span>
      <span className="visually-hidden">{label}</span>
    </span>
  )
}

export function RecipeThumb({ recipe, size = 'md' }) {
  const [failed, setFailed] = useState(false)
  const src = failed ? recipeImage(recipe) : recipe.coverImageUrl || recipeImage(recipe)
  return (
    <img
      className={`thumb thumb-${size}`}
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}

export function RecipeCard({ recipe, onOpen, onPlan, plannedCount = 0 }) {
  const total = recipe.totalMinutes || totalMinutes(recipe)
  const tags = dietaryTagNames(recipe.dietaryTagIds).slice(0, 3)

  return (
    <article className="recipe-card" style={{ '--accent': recipe.accentColor || '#D97757' }}>
      <button type="button" className="card-main" onClick={() => onOpen(recipe.id)}>
        <span className="card-media">
          <RecipeThumb recipe={recipe} />
          {plannedCount > 0 ? (
            <span className="card-badge" title={`Planned ${plannedCount} time(s) this week`}>
              <IconCalendar width={13} height={13} /> {plannedCount}
            </span>
          ) : null}
        </span>
        <span className="card-body">
          <span className="card-title">{recipe.title}</span>
          {recipe.shortDescription ? <span className="card-description">{recipe.shortDescription}</span> : null}
          <span className="card-meta">
            <span className="meta-pill">
              <IconClock width={13} height={13} /> {formatMinutes(total)}
            </span>
            <span className="meta-pill">
              <IconUsers width={13} height={13} /> {recipe.servings}
            </span>
            <SpiceDots level={recipe.spiceLevel} />
          </span>
          <span className="card-subtitle">
            {[cuisineName(recipe.cuisineId), mealTypeName(recipe.mealTypeId)].filter(Boolean).join(' · ') || 'Uncategorised'}
          </span>
          {tags.length ? (
            <span className="card-tags">
              {tags.map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </span>
          ) : null}
        </span>
      </button>
      <div className="card-actions">
        <button type="button" className="button button-ghost button-small" onClick={() => onPlan(recipe)}>
          <IconCalendar width={15} height={15} /> Add to plan
        </button>
        <button type="button" className="button button-ghost button-small" onClick={() => onOpen(recipe.id)}>
          View recipe
        </button>
      </div>
    </article>
  )
}

const SORTS = [
  { id: 'title', label: 'Title A–Z' },
  { id: 'time', label: 'Quickest first' },
  { id: 'newest', label: 'Newest first' },
  { id: 'servings', label: 'Servings' }
]

export default function RecipeCatalog({ recipes, onOpen, onPlan, plannedCounts, onNewRecipe }) {
  const [query, setQuery] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [mealType, setMealType] = useState('')
  const [category, setCategory] = useState('')
  const [dietary, setDietary] = useState('')
  const [sort, setSort] = useState('title')
  const [origin, setOrigin] = useState('all')

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const list = recipes.filter((recipe) => {
      if (origin === 'user' && recipe.origin !== 'user') return false
      if (origin === 'seed' && recipe.origin !== 'seed') return false
      if (cuisine && recipe.cuisineId !== cuisine) return false
      if (mealType && recipe.mealTypeId !== mealType) return false
      if (category && !(recipe.categoryIds || []).includes(category)) return false
      if (dietary && !(recipe.dietaryTagIds || []).includes(dietary)) return false
      if (!needle) return true
      const haystack = [
        recipe.title,
        recipe.shortDescription,
        cuisineName(recipe.cuisineId),
        mealTypeName(recipe.mealTypeId),
        ...categoryNames(recipe.categoryIds),
        ...dietaryTagNames(recipe.dietaryTagIds),
        ...(recipe.sections || []).flatMap((section) => section.items.map((item) => item.ingredientName))
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })

    return list.sort((a, b) => {
      if (sort === 'time') return (a.totalMinutes || totalMinutes(a)) - (b.totalMinutes || totalMinutes(b))
      if (sort === 'newest') return String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
      if (sort === 'servings') return (b.servings || 0) - (a.servings || 0)
      return a.title.localeCompare(b.title)
    })
  }, [recipes, query, cuisine, mealType, category, dietary, sort, origin])

  const activeFilters = [cuisine, mealType, category, dietary, query, origin !== 'all' ? origin : ''].filter(Boolean).length

  function clearFilters() {
    setQuery('')
    setCuisine('')
    setMealType('')
    setCategory('')
    setDietary('')
    setOrigin('all')
  }

  return (
    <section className="catalog" aria-labelledby="catalog-heading">
      <header className="page-header">
        <div>
          <h1 id="catalog-heading">Recipe catalog</h1>
          <p className="page-subtitle">
            {recipes.length} recipes · {recipes.filter((recipe) => recipe.origin === 'user').length} created by you
          </p>
        </div>
        <button type="button" className="button button-primary" onClick={onNewRecipe}>
          + New recipe
        </button>
      </header>

      <div className="filters" role="search">
        <div className="filter filter-grow">
          <label className="visually-hidden" htmlFor="catalog-search">Search recipes</label>
          <input
            id="catalog-search"
            className="input"
            type="search"
            placeholder="Search title, ingredient, cuisine…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="filter">
          <label className="visually-hidden" htmlFor="filter-cuisine">Cuisine</label>
          <select id="filter-cuisine" className="input" value={cuisine} onChange={(event) => setCuisine(event.target.value)}>
            <option value="">All cuisines</option>
            {CUISINES.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>
        <div className="filter">
          <label className="visually-hidden" htmlFor="filter-meal">Meal type</label>
          <select id="filter-meal" className="input" value={mealType} onChange={(event) => setMealType(event.target.value)}>
            <option value="">All meal types</option>
            {MEAL_TYPES.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>
        <div className="filter">
          <label className="visually-hidden" htmlFor="filter-category">Category</label>
          <select id="filter-category" className="input" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {RECIPE_CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>
        <div className="filter">
          <label className="visually-hidden" htmlFor="filter-dietary">Dietary</label>
          <select id="filter-dietary" className="input" value={dietary} onChange={(event) => setDietary(event.target.value)}>
            <option value="">All diets</option>
            {DIETARY_TAGS.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>
        <div className="filter">
          <label className="visually-hidden" htmlFor="filter-origin">Source</label>
          <select id="filter-origin" className="input" value={origin} onChange={(event) => setOrigin(event.target.value)}>
            <option value="all">Seed + my recipes</option>
            <option value="user">My recipes only</option>
            <option value="seed">Seed recipes only</option>
          </select>
        </div>
        <div className="filter">
          <label className="visually-hidden" htmlFor="filter-sort">Sort</label>
          <select id="filter-sort" className="input" value={sort} onChange={(event) => setSort(event.target.value)}>
            {SORTS.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="filter-status" aria-live="polite">
        Showing {filtered.length} of {recipes.length} recipes
        {activeFilters ? (
          <button type="button" className="link-button" onClick={clearFilters}>Clear filters</button>
        ) : null}
      </p>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No recipes match those filters.</p>
          <div className="empty-actions">
            <button type="button" className="button button-secondary" onClick={clearFilters}>Clear filters</button>
            <button type="button" className="button button-primary" onClick={onNewRecipe}>Create a recipe</button>
          </div>
        </div>
      ) : (
        <ul className="card-grid" role="list">
          {filtered.map((recipe) => (
            <li key={recipe.id}>
              <RecipeCard
                recipe={recipe}
                onOpen={onOpen}
                onPlan={onPlan}
                plannedCount={plannedCounts[recipe.id] || 0}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
