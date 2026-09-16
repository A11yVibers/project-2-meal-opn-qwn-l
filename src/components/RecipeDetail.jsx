import { useState } from 'react'
import {
  cuisineName, mealTypeName, dietaryTagName, categoryName, ingredientCategory,
  PLACEHOLDER_IMAGE, SPICE_LEVELS, spiceLabel, MEAL_SLOTS,
} from '../lib/data.js'
import { convertQuantity, formatQuantity, formatMinutes } from '../lib/units.js'
import { toISODate, startOfWeek, addDays, formatDayLabel } from '../lib/dates.js'
import RecipeOptionsMenu from './RecipeOptionsMenu.jsx'

const SUBSTITUTIONS = {
  'Heavy cream': 'Coconut milk or Greek yogurt',
  'Parmesan cheese': 'Any hard cheese, or nutritional yeast',
  'Butter': 'Olive oil',
  'Soy sauce': 'Miso paste thinned with water, or salt',
  'Honey': 'Any mild syrup',
  'Greek yogurt': 'Heavy cream thinned slightly, or silken tofu',
  'Pasta': 'Noodles or rice',
  'Rice': 'Pasta, noodles, or potato',
  'Chicken breast': 'Chicken thigh',
  'Chicken thigh': 'Chicken breast',
  'Black pepper': 'Chili flakes (use less)',
  'Lemon': 'Any citrus or a splash of vinegar',
}

export default function RecipeDetail({
  recipe, options, onOptionsChange, onBack, onAssign, plannedSlots,
}) {
  const [date, setDate] = useState(toISODate(new Date()))
  const [slot, setSlot] = useState(MEAL_SLOTS[2])
  const [time, setTime] = useState('18:30')
  const [added, setAdded] = useState(false)

  const measurement = options.measurement
  const fmtIng = (item) => {
    const conv = convertQuantity(item.quantity, item.unit, measurement)
    const q = formatQuantity(conv.quantity)
    return [q, conv.unit].filter(Boolean).join(' ')
  }

  const plannedHere = plannedSlots.filter((p) => p.recipeId === recipe.id)

  const handleAdd = () => {
    onAssign(date, slot, recipe.id, time)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const quickDates = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(new Date()), i))

  return (
    <section className="detail">
      <button className="btn ghost back-btn" onClick={onBack}>← Back to catalog</button>

      <div className="detail-hero" style={{ '--accent': recipe.accentColor }}>
        <img src={recipe.coverImageUrl || PLACEHOLDER_IMAGE} alt={recipe.title} />
        <div className="detail-hero-info">
          <h2>{recipe.title}</h2>
          {recipe.shortDescription && <p className="muted">{recipe.shortDescription}</p>}
          <div className="chip-row">
            <span className="chip accent-chip">{mealTypeName(recipe.mealTypeId)}</span>
            <span className="chip">{cuisineName(recipe.cuisineId)}</span>
            {recipe.dietaryTagIds.map((t) => <span key={t} className="chip">{dietaryTagName(t)}</span>)}
            {recipe.categoryIds.map((c) => <span key={c} className="chip outline">{categoryName(c)}</span>)}
          </div>
          {recipe.sourceUrl && (
            <p className="small">
              Source: <a href={recipe.sourceUrl} target="_blank" rel="noreferrer">{recipe.sourceName || recipe.sourceUrl}</a>
            </p>
          )}
          {!recipe.sourceUrl && recipe.sourceName && <p className="small muted">Source: {recipe.sourceName}</p>}
        </div>
      </div>

      <div className="detail-columns">
        <div className="detail-main">
          <div className="stat-strip">
            <div className="stat"><span className="stat-label">Servings</span><strong>{recipe.servings}</strong></div>
            <div className="stat"><span className="stat-label">Prep</span><strong>{formatMinutes(recipe.prepMinutes)}</strong></div>
            <div className="stat"><span className="stat-label">Cook</span><strong>{formatMinutes(recipe.cookMinutes)}</strong></div>
            <div className="stat"><span className="stat-label">Total</span><strong>{formatMinutes(recipe.totalMinutes)}</strong></div>
            <div className="stat">
              <span className="stat-label">Spice</span>
              <strong>{spiceLabel(recipe.spiceLevel)}</strong>
              <span className="spice-dots" aria-hidden>
                {SPICE_LEVELS.slice(1).map((s) => (
                  <span key={s.value} className={s.value <= recipe.spiceLevel ? 'dot on' : 'dot'} />
                ))}
              </span>
            </div>
          </div>

          <h3>Ingredients {measurement === 'metric' ? <span className="muted small">(metric)</span> : <span className="muted small">(US customary)</span>}</h3>
          {recipe.ingredientSections.map((sec) => (
            <div key={sec.name} className="ingredient-section">
              <h4>{sec.name}</h4>
              <ul>
                {sec.items.map((item, i) => (
                  <li key={i}>
                    <span className="ing-qty">{fmtIng(item)}</span>
                    <span className="ing-name">
                      {item.ingredientName}
                      {item.notes && <span className="muted"> — {item.notes}</span>}
                      {item.optional && <span className="tag optional-tag">optional</span>}
                    </span>
                    {options.allowSubstitutions && SUBSTITUTIONS[item.ingredientName] && (
                      <span className="muted small substitution">sub: {SUBSTITUTIONS[item.ingredientName]}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <h3>Method</h3>
          <ol className="steps">
            {recipe.steps.map((step, i) => (
              <li key={i}>
                <p>{step.instruction}</p>
                {step.timerMinutes ? <span className="timer-chip">⏱ {formatMinutes(step.timerMinutes)}</span> : null}
              </li>
            ))}
          </ol>

          {options.showNutrition && (
            <div className="nutrition-panel">
              <h3>Nutrition (estimated, per serving)</h3>
              <div className="nutrition-grid">
                <div><strong>~{Math.round(estimateCalories(recipe) / Math.max(1, recipe.servings))}</strong><span>kcal</span></div>
                <div><strong>~{estimateMacros(recipe).protein}</strong><span>g protein</span></div>
                <div><strong>~{estimateMacros(recipe).carbs}</strong><span>g carbs</span></div>
                <div><strong>~{estimateMacros(recipe).fat}</strong><span>g fat</span></div>
              </div>
              <p className="muted small">Estimates based on ingredient composition; not lab-analyzed.</p>
            </div>
          )}
        </div>

        <aside className="detail-side">
          <div className="side-card">
            <div className="side-card-header">
              <h3>Recipe options</h3>
            </div>
            <RecipeOptionsMenu options={options} onChange={onOptionsChange} label="Options" />
          </div>

          <div className="side-card">
            <h3>Add to meal plan</h3>
            <label className="field">
              <span>Cooking date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <div className="quick-dates">
              {quickDates.map((d) => (
                <button
                  key={toISODate(d)}
                  className={`chip quick-date${toISODate(d) === date ? ' selected' : ''}`}
                  onClick={() => setDate(toISODate(d))}
                >
                  {formatDayLabel(d)}
                </button>
              ))}
            </div>
            <label className="field">
              <span>Serving time slot</span>
              <select value={slot} onChange={(e) => setSlot(e.target.value)}>
                {MEAL_SLOTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Serving time</span>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </label>
            <p className="muted small">
              Planned for {formatDayLabel(new Date(date + 'T00:00:00'))} at {time} ({slot})
            </p>
            <button className="btn primary full" onClick={handleAdd}>
              {added ? 'Added to plan ✓' : 'Add to meal plan'}
            </button>
            {plannedHere.length > 0 && (
              <ul className="planned-list small">
                {plannedHere.map((p, i) => (
                  <li key={i}>
                    {formatDayLabel(new Date(p.date + 'T00:00:00'))} · {p.slot}
                    {p.time ? ` · ${p.time}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}

const KCAL_BY_CATEGORY = {
  'Produce': 30, 'Meat & seafood': 220, 'Dairy & eggs': 120,
  'Grains & pantry': 200, 'Oils & condiments': 90, 'Canned & jarred': 130, 'Spices': 5,
}

function allItems(recipe) {
  return recipe.ingredientSections.flatMap((s) => s.items)
}

function estimateCalories(recipe) {
  return allItems(recipe).reduce((sum, item) => {
    const cat = ingredientCategory(item.ingredientName, item.ingredientId)
    const qty = Number(item.quantity) || 1
    return sum + (KCAL_BY_CATEGORY[cat] ?? 100) * Math.min(qty, 4)
  }, 0)
}

function estimateMacros(recipe) {
  const cal = estimateCalories(recipe)
  const servings = Math.max(1, recipe.servings)
  return {
    protein: Math.round((cal * 0.25) / 4 / servings),
    carbs: Math.round((cal * 0.45) / 4 / servings),
    fat: Math.round((cal * 0.3) / 9 / servings),
  }
}
