import { useCallback, useEffect, useMemo, useState } from 'react'
import { MEAL_SLOTS, SEED_RECIPES, SHOPPING_CATEGORIES } from './data/catalog.js'
import { currentWeekStartIso, weekDates } from './lib/dates.js'
import { findAssignment, removeAssignment, upsertAssignment } from './lib/plan.js'
import { emptyRecipe, normalizeRecipe } from './lib/recipes.js'
import { buildShoppingList } from './lib/shopping.js'
import { createId, usePersistentState } from './lib/storage.js'
import RecipeCatalog from './components/RecipeCatalog.jsx'
import RecipeDetail from './components/RecipeDetail.jsx'
import RecipeForm from './components/RecipeForm.jsx'
import Planner from './components/Planner.jsx'
import ShoppingList from './components/ShoppingList.jsx'
import AddToPlanDialog from './components/AddToPlanDialog.jsx'
import { IconBook, IconCalendar, IconCart } from './components/Icons.jsx'

const NAV = [
  { id: 'catalog', label: 'Recipes', icon: IconBook },
  { id: 'planner', label: 'Meal plan', icon: IconCalendar },
  { id: 'shopping', label: 'Shopping list', icon: IconCart }
]

function defaultSettings() {
  return {
    measurementSystem: 'us',
    excludePantryItems: false,
    hideOptionalItems: false,
    weekStart: currentWeekStartIso()
  }
}

export default function App() {
  const [userRecipes, setUserRecipes] = usePersistentState('recipes', [])
  const [overrides, setOverrides] = usePersistentState('recipe-overrides', {})
  const [assignments, setAssignments] = usePersistentState('assignments', [])
  const [checked, setChecked] = usePersistentState('shopping-checked', {})
  const [pantry, setPantry] = usePersistentState('pantry', [])
  const [settings, setSettings] = usePersistentState('settings', defaultSettings)

  const [view, setView] = useState('catalog')
  const [activeRecipeId, setActiveRecipeId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [planTarget, setPlanTarget] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [view, activeRecipeId])

  const seedRecipes = useMemo(
    () => SEED_RECIPES.map((recipe) => normalizeRecipe({ ...recipe, ...(overrides[recipe.id] || {}) })),
    [overrides]
  )

  const normalizedUserRecipes = useMemo(
    () => userRecipes.map((recipe) => normalizeRecipe(recipe)),
    [userRecipes]
  )

  const recipes = useMemo(
    () => [...seedRecipes, ...normalizedUserRecipes].sort((a, b) => a.title.localeCompare(b.title)),
    [seedRecipes, normalizedUserRecipes]
  )

  const recipesById = useMemo(() => new Map(recipes.map((recipe) => [recipe.id, recipe])), [recipes])
  const recipeLookup = useMemo(() => Object.fromEntries(recipes.map((recipe) => [recipe.id, recipe])), [recipes])

  const weekStart = settings.weekStart || currentWeekStartIso()
  const weekDatesList = useMemo(() => weekDates(weekStart), [weekStart])

  const plannedCounts = useMemo(() => {
    const counts = {}
    const dates = new Set(weekDatesList)
    assignments.forEach((assignment) => {
      if (!dates.has(assignment.date)) return
      counts[assignment.recipeId] = (counts[assignment.recipeId] || 0) + 1
    })
    return counts
  }, [assignments, weekDatesList])

  const shopping = useMemo(
    () =>
      buildShoppingList({
        assignments,
        recipesById: recipeLookup,
        weekStartIso: weekStart,
        pantry,
        excludePantry: Boolean(settings.excludePantryItems),
        categories: SHOPPING_CATEGORIES
      }),
    [assignments, recipeLookup, weekStart, pantry, settings.excludePantryItems]
  )

  const shoppingCount = shopping.items.filter((item) => (settings.hideOptionalItems ? !item.optional : true)).length
  const uncheckedCount = shopping.items.filter(
    (item) => (settings.hideOptionalItems ? !item.optional : true) && !checked[item.id]
  ).length

  const navigate = useCallback((nextView, recipeId = null) => {
    setView(nextView)
    setActiveRecipeId(recipeId)
    setEditing(null)
  }, [])

  function openRecipe(recipeId) {
    navigate('detail', recipeId)
  }

  function startNewRecipe() {
    setEditing(emptyRecipe())
    setActiveRecipeId(null)
    setView('form')
  }

  function startEditRecipe(recipe) {
    setEditing(normalizeRecipe({ ...recipe }))
    setActiveRecipeId(recipe.id)
    setView('form')
  }

  function persistRecipe(recipe) {
    if (recipe.origin === 'user') {
      setUserRecipes((current) => {
        const exists = current.some((item) => item.id === recipe.id)
        const record = { ...recipe, origin: 'user', updatedAt: new Date().toISOString() }
        return exists ? current.map((item) => (item.id === recipe.id ? record : item)) : [...current, record]
      })
    } else {
      setOverrides((current) => ({
        ...current,
        [recipe.id]: {
          ...(current[recipe.id] || {}),
          options: recipe.options,
          includeInMealSuggestions: recipe.includeInMealSuggestions,
          coverImageUrl: recipe.coverImageUrl,
          accentColor: recipe.accentColor
        }
      }))
    }
  }

  function applyOptions(recipeId, options) {
    const recipe = recipesById.get(recipeId)
    if (!recipe) return
    persistRecipe({ ...recipe, options })
  }

  function handleSaveRecipe(recipe, planIntent) {
    const saved = { ...recipe, origin: recipe.origin === 'seed' ? 'seed' : 'user' }
    if (saved.origin === 'user' && !saved.createdAt) saved.createdAt = new Date().toISOString()
    saved.id = saved.id || createId('recipe')
    persistRecipe(saved)

    if (planIntent?.date && planIntent?.slot) {
      setAssignments((current) =>
        upsertAssignment(current, {
          date: planIntent.date,
          slot: planIntent.slot,
          recipeId: saved.id,
          servings: planIntent.servings ?? saved.servings,
          time: planIntent.time || ''
        })
      )
      setSettings((current) => ({ ...current, weekStart: weekStartOf(planIntent.date) }))
      setToast({ tone: 'success', message: `${saved.title} saved and added to the plan.` })
    } else {
      setToast({ tone: 'success', message: `${saved.title} saved to your recipe catalog.` })
    }
    navigate('detail', saved.id)
  }

  function handleDeleteRecipe(recipe) {
    const confirmed = window.confirm(`Delete “${recipe.title}”? It will also be removed from every meal plan.`)
    if (!confirmed) return
    setUserRecipes((current) => current.filter((item) => item.id !== recipe.id))
    setAssignments((current) => current.filter((assignment) => assignment.recipeId !== recipe.id))
    setToast({ tone: 'info', message: `${recipe.title} deleted.` })
    navigate('catalog')
  }

  function handleAssign({ date, slot, recipeId, servings = null, time = '' }) {
    setAssignments((current) => upsertAssignment(current, { date, slot, recipeId, servings, time }))
    const recipe = recipesById.get(recipeId)
    setToast({ tone: 'success', message: `${recipe?.title || 'Recipe'} planned for ${slot.toLowerCase()}.` })
  }

  function handleRemove(date, slot) {
    const existing = findAssignment(assignments, date, slot)
    setAssignments((current) => removeAssignment(current, date, slot))
    if (existing) {
      setToast({ tone: 'info', message: `Removed from ${slot.toLowerCase()} plan.` })
    }
  }

  function handleClearWeek() {
    const confirmed = window.confirm('Remove every recipe from this week?')
    if (!confirmed) return
    const dates = new Set(weekDatesList)
    setAssignments((current) => current.filter((assignment) => !dates.has(assignment.date)))
    setToast({ tone: 'info', message: 'This week was cleared.' })
  }

  function toggleChecked(itemId) {
    setChecked((current) => {
      const next = { ...current }
      if (next[itemId]) delete next[itemId]
      else next[itemId] = true
      return next
    })
  }

  function togglePantry(key) {
    setPantry((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]))
  }

  const activeRecipe = activeRecipeId ? recipesById.get(activeRecipeId) : null

  return (
    <div className="app">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">🍽</span>
            <span className="brand-text">
              <strong>Mealboard</strong>
              <span>Plan the week, cook from the catalog, shop the list</span>
            </span>
          </div>
          <nav className="app-nav" aria-label="Main">
            {NAV.map((item) => {
              const Icon = item.icon
              const active = view === item.id || (item.id === 'catalog' && (view === 'detail' || view === 'form'))
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-button ${active ? 'is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => navigate(item.id)}
                >
                  <Icon width={16} height={16} />
                  <span>{item.label}</span>
                  {item.id === 'shopping' && uncheckedCount > 0 ? (
                    <span className="nav-count" aria-label={`${uncheckedCount} items to buy`}>{uncheckedCount}</span>
                  ) : null}
                  {item.id === 'planner' ? (
                    <span className="nav-count nav-count-muted" aria-label="meals planned this week">
                      {weekDatesList.reduce((total, date) => total + MEAL_SLOTS.filter((slot) => findAssignment(assignments, date, slot)).length, 0)}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </nav>
          <button type="button" className="button button-primary header-cta" onClick={startNewRecipe}>
            + New recipe
          </button>
        </div>
      </header>

      <main id="main" className="app-main">
        {view === 'catalog' ? (
          <RecipeCatalog
            recipes={recipes}
            plannedCounts={plannedCounts}
            onOpen={openRecipe}
            onNewRecipe={startNewRecipe}
            onPlan={(recipe) => setPlanTarget({ recipe })}
          />
        ) : null}

        {view === 'detail' && activeRecipe ? (
          <RecipeDetail
            recipe={activeRecipe}
            assignments={assignments}
            defaultSystem={settings.measurementSystem}
            onBack={() => navigate('catalog')}
            onEdit={startEditRecipe}
            onDelete={handleDeleteRecipe}
            onAddToPlan={(recipe) => setPlanTarget({ recipe })}
            onOpenPlanDate={(date) => {
              setSettings((current) => ({ ...current, weekStart: weekStartOf(date) }))
              navigate('planner')
            }}
            onOptionsChange={(options) => applyOptions(activeRecipe.id, options)}
          />
        ) : null}

        {view === 'detail' && !activeRecipe ? (
          <div className="empty-state">
            <p>That recipe is no longer available.</p>
            <button type="button" className="button button-primary" onClick={() => navigate('catalog')}>
              Back to catalog
            </button>
          </div>
        ) : null}

        {view === 'form' && editing ? (
          <RecipeForm
            key={editing.id}
            initial={editing}
            onSave={handleSaveRecipe}
            onCancel={() => navigate(activeRecipeId ? 'detail' : 'catalog', activeRecipeId)}
            onDelete={handleDeleteRecipe}
          />
        ) : null}

        {view === 'planner' ? (
          <Planner
            weekStart={weekStart}
            onWeekStartChange={(next) => setSettings((current) => ({ ...current, weekStart: next }))}
            assignments={assignments}
            recipes={recipes}
            recipesById={recipeLookup}
            onAssign={handleAssign}
            onRemove={handleRemove}
            onOpenRecipe={openRecipe}
            onNewRecipe={startNewRecipe}
            onOpenShopping={() => navigate('shopping')}
            onClearWeek={handleClearWeek}
          />
        ) : null}

        {view === 'shopping' ? (
          <ShoppingList
            assignments={assignments}
            recipesById={recipeLookup}
            weekStart={weekStart}
            checked={checked}
            pantry={pantry}
            settings={settings}
            onToggleChecked={toggleChecked}
            onCheckAll={() => {
              const next = { ...checked }
              shopping.items.forEach((item) => {
                next[item.id] = true
              })
              setChecked(next)
            }}
            onClearChecked={() => setChecked({})}
            onTogglePantry={togglePantry}
            onSettingChange={(changes) => setSettings((current) => ({ ...current, ...changes }))}
            onOpenPlanner={() => navigate('planner')}
            onOpenRecipe={openRecipe}
          />
        ) : null}
      </main>

      <footer className="app-footer">
        <p>
          Seed recipes and lookup data are read from <code>project-assets/</code> CSV files. Your recipes, plan and
          shopping-list state are stored in this browser only ({shoppingCount} items on this week’s list).
        </p>
      </footer>

      {planTarget?.recipe ? (
        <AddToPlanDialog
          open
          recipe={planTarget.recipe}
          assignments={assignments}
          initialDate={planTarget.date}
          initialSlot={planTarget.slot}
          onClose={() => setPlanTarget(null)}
          onConfirm={(details) => {
            handleAssign({ ...details, recipeId: planTarget.recipe.id })
            setPlanTarget(null)
          }}
        />
      ) : null}

      <div className="toast-region" role="status" aria-live="polite">
        {toast ? <p className={`toast toast-${toast.tone}`}>{toast.message}</p> : null}
      </div>
    </div>
  )
}

function weekStartOf(iso) {
  const [year, month, day] = String(iso).split('-').map(Number)
  const date = new Date(year, (month || 1) - 1, day || 1)
  const shift = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - shift)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mm}-${dd}`
}
