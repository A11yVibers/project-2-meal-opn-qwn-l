import { useCallback, useMemo, useState } from 'react'
import { SEED_RECIPES, DEFAULT_RECIPE_OPTIONS, thisMondayISO } from './data.js'
import { usePersistentState } from './storage.js'
import RecipeCatalog from './components/RecipeCatalog.jsx'
import RecipeDetail from './components/RecipeDetail.jsx'
import RecipeForm from './components/RecipeForm.jsx'
import Planner from './components/Planner.jsx'
import ShoppingList from './components/ShoppingList.jsx'

const TABS = [
  { id: 'recipes', label: 'Recipes' },
  { id: 'planner', label: 'Meal planner' },
  { id: 'shopping', label: 'Shopping list' }
]

export default function App() {
  const [tab, setTab] = usePersistentState('tab', 'recipes')
  const [view, setView] = useState({ name: 'catalog' })
  const [userRecipes, setUserRecipes] = usePersistentState('userRecipes', [])
  const [optionOverrides, setOptionOverrides] = usePersistentState('recipeOptions', {})
  const [plan, setPlan] = usePersistentState('mealPlan', {})
  const [checked, setChecked] = usePersistentState('shoppingChecked', {})
  const [pantry, setPantry] = usePersistentState('pantry', [])
  const [week, setWeek] = usePersistentState('plannerWeek', thisMondayISO())

  const recipes = useMemo(() => [...SEED_RECIPES, ...userRecipes], [userRecipes])
  const optionsFor = useCallback(
    recipe => ({ ...DEFAULT_RECIPE_OPTIONS, ...(optionOverrides[recipe.id] || {}) }),
    [optionOverrides]
  )

  const openRecipe = id => { setView({ name: 'detail', id }); setTab('recipes') }

  const planCount = useMemo(
    () => Object.values(plan).filter(e => recipes.some(r => r.id === e.recipeId)).length,
    [plan, recipes]
  )

  const saveRecipe = (recipe, planEntry, options) => {
    setUserRecipes(list => {
      const idx = list.findIndex(r => r.id === recipe.id)
      if (idx >= 0) {
        const copy = [...list]
        copy[idx] = recipe
        return copy
      }
      return [...list, recipe]
    })
    setOptionOverrides(o => ({ ...o, [recipe.id]: options }))
    if (planEntry) {
      const key = `${planEntry.date}|${planEntry.slot}`
      setPlan(p => ({ ...p, [key]: { recipeId: recipe.id, date: planEntry.date, slot: planEntry.slot, time: planEntry.time } }))
      const d = new Date(planEntry.date + 'T00:00:00')
      const day = (d.getDay() + 6) % 7
      d.setDate(d.getDate() - day)
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      setWeek(iso)
    }
    openRecipe(recipe.id)
  }

  const deleteRecipe = id => {
    setUserRecipes(list => list.filter(r => r.id !== id))
    setPlan(p => Object.fromEntries(Object.entries(p).filter(([, e]) => e.recipeId !== id)))
    setView({ name: 'catalog' })
  }

  const addToPlanFromDetail = (recipeId, { date, slot, time }) => {
    setPlan(p => ({ ...p, [`${date}|${slot}`]: { recipeId, date, slot, time } }))
    setTab('planner')
    const d = new Date(date + 'T00:00:00')
    const day = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - day)
    setWeek(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }

  const detailRecipe = view.name === 'detail' ? recipes.find(r => r.id === view.id) : null

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <h1>Mealboard</h1>
        </div>
        <nav className="tabs" aria-label="Main navigation">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? 'tab-active' : ''}`}
              aria-current={tab === t.id ? 'page' : undefined}
              onClick={() => { setTab(t.id); if (t.id !== 'recipes') setView({ name: 'catalog' }) }}
            >
              {t.label}
              {t.id === 'planner' && planCount > 0 && <span className="tab-badge">{planCount}</span>}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {tab === 'recipes' && view.name === 'catalog' && (
          <RecipeCatalog
            recipes={recipes}
            optionsFor={optionsFor}
            onOpen={openRecipe}
            onNew={() => setView({ name: 'form' })}
          />
        )}
        {tab === 'recipes' && view.name === 'form' && (
          <RecipeForm
            initial={view.initial}
            onSave={saveRecipe}
            onCancel={() => view.initial ? openRecipe(view.initial.id) : setView({ name: 'catalog' })}
          />
        )}
        {tab === 'recipes' && view.name === 'detail' && detailRecipe && (
          <RecipeDetail
            recipe={detailRecipe}
            options={optionsFor(detailRecipe)}
            onOptionsChange={opts => setOptionOverrides(o => ({ ...o, [detailRecipe.id]: opts }))}
            onBack={() => setView({ name: 'catalog' })}
            onAddToPlan={entry => addToPlanFromDetail(detailRecipe.id, entry)}
            onEdit={r => setView({ name: 'form', initial: { ...r, savedOptions: optionsFor(r) } })}
            onDelete={deleteRecipe}
          />
        )}
        {tab === 'recipes' && view.name === 'detail' && !detailRecipe && (
          <p className="empty-note">Recipe not found. <button className="btn btn-secondary" onClick={() => setView({ name: 'catalog' })}>Back to catalog</button></p>
        )}
        {tab === 'planner' && (
          <Planner
            recipes={recipes}
            plan={plan}
            setPlan={setPlan}
            week={week}
            setWeek={setWeek}
            onOpenRecipe={openRecipe}
          />
        )}
        {tab === 'shopping' && (
          <ShoppingList
            recipes={recipes}
            plan={plan}
            week={week}
            setWeek={setWeek}
            optionsFor={optionsFor}
            checked={checked}
            setChecked={setChecked}
            pantry={pantry}
            setPantry={setPantry}
          />
        )}
      </main>

      <footer className="app-footer">
        Recipes, meal plans and shopping-list state are saved in your browser.
      </footer>
    </div>
  )
}
