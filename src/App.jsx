import { useEffect, useMemo, useState } from 'react'
import { SEED_RECIPES, DEFAULT_RECIPE_OPTIONS, MEAL_SLOTS } from './lib/data.js'
import { loadJson, saveJson } from './lib/storage.js'
import { startOfWeek, weekDates, toISODate } from './lib/dates.js'
import RecipeCatalog from './components/RecipeCatalog.jsx'
import RecipeDetail from './components/RecipeDetail.jsx'
import RecipeForm from './components/RecipeForm.jsx'
import Planner from './components/Planner.jsx'
import ShoppingList from './components/ShoppingList.jsx'

const TABS = [
  { id: 'catalog', label: 'Recipes' },
  { id: 'planner', label: 'Meal planner' },
  { id: 'shopping', label: 'Shopping list' },
]

export default function App() {
  const [tab, setTab] = useState('catalog')
  const [view, setView] = useState({ name: 'catalog' })
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))

  const [userRecipes, setUserRecipes] = useState(() => loadJson('userRecipes', []))
  const [mealPlan, setMealPlan] = useState(() => loadJson('mealPlan', {}))
  const [recipeOptions, setRecipeOptions] = useState(() => loadJson('recipeOptions', {}))
  const [shoppingState, setShoppingState] = useState(() =>
    loadJson('shoppingState', { checkedByWeek: {}, pantry: {}, hidePantry: false })
  )

  useEffect(() => saveJson('userRecipes', userRecipes), [userRecipes])
  useEffect(() => saveJson('mealPlan', mealPlan), [mealPlan])
  useEffect(() => saveJson('recipeOptions', recipeOptions), [recipeOptions])
  useEffect(() => saveJson('shoppingState', shoppingState), [shoppingState])

  const allRecipes = useMemo(() => [...SEED_RECIPES, ...userRecipes], [userRecipes])
  const recipeById = useMemo(() => new Map(allRecipes.map((r) => [r.id, r])), [allRecipes])

  const optionsFor = (recipeId) => ({ ...DEFAULT_RECIPE_OPTIONS, ...(recipeOptions[recipeId] || {}) })

  const setOptionsFor = (recipeId, opts) =>
    setRecipeOptions((prev) => ({ ...prev, [recipeId]: opts }))

  // ---- meal plan ----
  const assignToPlan = (dateISO, slot, recipeId, time) =>
    setMealPlan((prev) => ({
      ...prev,
      [dateISO]: { ...(prev[dateISO] || {}), [slot]: { recipeId, time: time || '' } },
    }))

  const removeFromPlan = (dateISO, slot) =>
    setMealPlan((prev) => {
      const day = { ...(prev[dateISO] || {}) }
      delete day[slot]
      const next = { ...prev }
      if (Object.keys(day).length) next[dateISO] = day
      else delete next[dateISO]
      return next
    })

  const weekDatesISO = useMemo(() => weekDates(weekStart).map(toISODate), [weekStart])

  const plannedEntries = useMemo(() => {
    const entries = []
    for (const date of weekDatesISO) {
      const day = mealPlan[date]
      if (!day) continue
      for (const slot of MEAL_SLOTS) {
        if (day[slot]) entries.push({ date, slot, recipeId: day[slot].recipeId, time: day[slot].time })
      }
    }
    return entries
  }, [weekDatesISO, mealPlan])

  const plannedIds = useMemo(() => new Set(plannedEntries.map((e) => e.recipeId)), [plannedEntries])

  const plannedSlotsForRecipe = (recipeId) => {
    const out = []
    for (const [date, day] of Object.entries(mealPlan)) {
      for (const [slot, entry] of Object.entries(day)) {
        if (entry.recipeId === recipeId) out.push({ date, slot, time: entry.time })
      }
    }
    return out.sort((a, b) => a.date.localeCompare(b.date))
  }

  // ---- shopping list state ----
  const wk = toISODate(weekStart)
  const checked = shoppingState.checkedByWeek[wk] || {}
  const toggleChecked = (key) =>
    setShoppingState((prev) => {
      const week = { ...(prev.checkedByWeek[wk] || {}) }
      if (week[key]) delete week[key]
      else week[key] = true
      return { ...prev, checkedByWeek: { ...prev.checkedByWeek, [wk]: week } }
    })
  const togglePantry = (key) =>
    setShoppingState((prev) => {
      const pantry = { ...prev.pantry }
      if (pantry[key]) delete pantry[key]
      else pantry[key] = true
      return { ...prev, pantry }
    })
  const clearChecked = () =>
    setShoppingState((prev) => ({ ...prev, checkedByWeek: { ...prev.checkedByWeek, [wk]: {} } }))

  // ---- recipe saving ----
  const handleSaveRecipe = (recipe, plan, options) => {
    setUserRecipes((prev) => [...prev, recipe])
    if (options) setOptionsFor(recipe.id, options)
    if (plan) assignToPlan(plan.date, plan.slot, recipe.id, plan.time)
    setView({ name: 'detail', recipeId: recipe.id })
    setTab('catalog')
  }

  const openRecipe = (recipeId) => {
    setView({ name: 'detail', recipeId })
    setTab('catalog')
    window.scrollTo({ top: 0 })
  }

  const currentRecipe = view.name === 'detail' ? recipeById.get(view.recipeId) : null

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand" onClick={() => { setTab('catalog'); setView({ name: 'catalog' }) }} role="button">
          <span className="brand-mark">🍽</span>
          <span className="brand-name">Mealboard</span>
          <span className="brand-sub">plan · cook · shop</span>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab${tab === t.id ? ' active' : ''}`}
              onClick={() => { setTab(t.id); setView({ name: t.id }) }}
            >
              {t.label}
              {t.id === 'planner' && plannedEntries.length > 0 && (
                <span className="tab-badge">{plannedEntries.length}</span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {tab === 'catalog' && view.name === 'catalog' && (
          <RecipeCatalog
            recipes={allRecipes}
            onOpen={openRecipe}
            onAdd={() => setView({ name: 'form' })}
            plannedIds={plannedIds}
          />
        )}

        {tab === 'catalog' && view.name === 'detail' && currentRecipe && (
          <RecipeDetail
            recipe={currentRecipe}
            options={optionsFor(currentRecipe.id)}
            onOptionsChange={(opts) => setOptionsFor(currentRecipe.id, opts)}
            onBack={() => setView({ name: 'catalog' })}
            onAssign={assignToPlan}
            plannedSlots={plannedSlotsForRecipe(currentRecipe.id)}
          />
        )}

        {tab === 'catalog' && view.name === 'form' && (
          <RecipeForm
            onSave={handleSaveRecipe}
            onCancel={() => setView({ name: 'catalog' })}
            initialWeekStart={weekStart}
          />
        )}

        {tab === 'planner' && (
          <Planner
            weekStart={weekStart}
            setWeekStart={setWeekStart}
            recipes={allRecipes}
            mealPlan={mealPlan}
            onAssign={assignToPlan}
            onRemove={removeFromPlan}
            onOpenRecipe={openRecipe}
          />
        )}

        {tab === 'shopping' && (
          <ShoppingList
            weekStart={weekStart}
            setWeekStart={setWeekStart}
            plannedEntries={plannedEntries}
            recipeById={recipeById}
            recipeOptions={recipeOptions}
            checked={checked}
            onToggleChecked={toggleChecked}
            pantry={shoppingState.pantry}
            onTogglePantry={togglePantry}
            hidePantry={shoppingState.hidePantry}
            onHidePantryChange={(v) => setShoppingState((p) => ({ ...p, hidePantry: v }))}
            onClearChecked={clearChecked}
          />
        )}
      </main>

      <footer className="app-footer muted small">
        Seed recipes &amp; lookups loaded from project-assets CSVs · your recipes, plan and list are saved in this browser
      </footer>
    </div>
  )
}
