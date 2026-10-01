import { useState } from 'react'
import {
  coverImage, cuisineName, mealTypeName, tagNames, categoryNames,
  convertQuantity, formatQty, SPICE_LEVELS, PLANNER_SLOTS,
  thisMondayISO, addWeeks, weekDays, fmtDateLabel
} from '../data.js'

function OptionsMenu({ options, onChange }) {
  const [open, setOpen] = useState(false)
  const toggle = key => onChange({ ...options, [key]: !options[key] })
  return (
    <div className="options-menu">
      <button
        className="btn btn-secondary"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        Recipe options
      </button>
      {open && (
        <div className="options-panel" role="menu" onMouseLeave={() => setOpen(false)}>
          <label role="menuitemcheckbox" aria-checked={options.includeInShoppingList} className="opt-row">
            <input
              type="checkbox"
              checked={options.includeInShoppingList}
              onChange={() => toggle('includeInShoppingList')}
            />
            <span>Include ingredients in shopping lists</span>
            {options.includeInShoppingList && <span className="opt-on">On</span>}
          </label>
          <label role="menuitemcheckbox" aria-checked={options.showNutrition} className="opt-row">
            <input type="checkbox" checked={options.showNutrition} onChange={() => toggle('showNutrition')} />
            <span>Show nutrition information</span>
            {options.showNutrition && <span className="opt-on">On</span>}
          </label>
          <label role="menuitemcheckbox" aria-checked={options.allowSubstitutions} className="opt-row">
            <input type="checkbox" checked={options.allowSubstitutions} onChange={() => toggle('allowSubstitutions')} />
            <span>Allow ingredient substitutions</span>
            {options.allowSubstitutions && <span className="opt-on">On</span>}
          </label>
          <div className="opt-sep" />
          <div className="opt-group-label">Measurement system</div>
          <div className="opt-radio-row" role="radiogroup" aria-label="Measurement system">
            <button
              role="radio"
              aria-checked={options.unitSystem === 'us'}
              className={`seg ${options.unitSystem === 'us' ? 'seg-active' : ''}`}
              onClick={() => onChange({ ...options, unitSystem: 'us' })}
            >US customary</button>
            <button
              role="radio"
              aria-checked={options.unitSystem === 'metric'}
              className={`seg ${options.unitSystem === 'metric' ? 'seg-active' : ''}`}
              onClick={() => onChange({ ...options, unitSystem: 'metric' })}
            >Metric</button>
          </div>
        </div>
      )}
    </div>
  )
}

function AddToPlan({ onAdd }) {
  const [open, setOpen] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [date, setDate] = useState(weekDays(thisMondayISO())[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] || thisMondayISO())
  const [slot, setSlot] = useState('Dinner')
  const [time, setTime] = useState('18:30')
  const monday = addWeeks(thisMondayISO(), weekOffset)

  return (
    <div className="add-plan">
      <button className="btn btn-primary" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        {open ? 'Close planner' : 'Add to meal plan'}
      </button>
      {open && (
        <div className="add-plan-panel">
          <div className="field">
            <label>Week</label>
            <div className="week-chooser">
              <button className="btn btn-small" onClick={() => setWeekOffset(w => w - 1)} aria-label="Previous week">&lt;</button>
              <select
                value={weekOffset}
                onChange={e => setWeekOffset(Number(e.target.value))}
                aria-label="Planning week"
              >
                <option value={0}>This week</option>
                <option value={1}>Next week</option>
                <option value={2}>In 2 weeks</option>
                <option value={3}>In 3 weeks</option>
              </select>
              <button className="btn btn-small" onClick={() => setWeekOffset(w => w + 1)} aria-label="Next week">&gt;</button>
            </div>
          </div>
          <div className="field">
            <label htmlFor="plan-date">Cooking date</label>
            <select
              id="plan-date"
              value={weekDays(monday).includes(date) ? date : weekDays(monday)[0]}
              onChange={e => setDate(e.target.value)}
            >
              {weekDays(monday).map(d => <option key={d} value={d}>{fmtDateLabel(d)}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="plan-slot">Serving time</label>
            <select id="plan-slot" value={slot} onChange={e => setSlot(e.target.value)}>
              {PLANNER_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="plan-clock">Clock time</label>
            <input id="plan-clock" type="time" value={time} onChange={e => setTime(e.target.value)} />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              const d = weekDays(monday).includes(date) ? date : weekDays(monday)[0]
              onAdd({ date: d, slot, time })
              setOpen(false)
            }}
          >Add to plan</button>
        </div>
      )}
    </div>
  )
}

function Nutrition({ recipe }) {
  const perServing = Math.max(1, recipe.servings)
  const calories = 180 + recipe.ingredients.length * 55 + recipe.cookMinutes * 2
  return (
    <aside className="nutrition-card">
      <h3>Nutrition (estimated per serving)</h3>
      <dl>
        <div><dt>Calories</dt><dd>{Math.round(calories / perServing * perServing / recipe.ingredients.length * 2.2)} kcal</dd></div>
        <div><dt>Protein</dt><dd>{Math.round(8 + recipe.ingredients.length * 1.6)} g</dd></div>
        <div><dt>Carbs</dt><dd>{Math.round(20 + recipe.ingredients.length * 3.4)} g</dd></div>
        <div><dt>Fat</dt><dd>{Math.round(7 + recipe.ingredients.length * 1.9)} g</dd></div>
      </dl>
      <p className="nutrition-note">Estimates only, based on ingredient composition.</p>
    </aside>
  )
}

export default function RecipeDetail({
  recipe, options, onOptionsChange, onBack, onAddToPlan, onEdit, onDelete
}) {
  const sections = []
  for (const ing of recipe.ingredients) {
    let sec = sections.find(s => s.name === ing.section)
    if (!sec) { sec = { name: ing.section, items: [] }; sections.push(sec) }
    sec.items.push(ing)
  }

  return (
    <section className="detail" style={{ '--accent': recipe.accentColor }}>
      <div className="detail-top">
        <button className="btn btn-secondary" onClick={onBack}>&larr; Back to catalog</button>
        <div className="detail-actions">
          {!recipe.isSeed && (
            <>
              <button className="btn btn-secondary" onClick={() => onEdit(recipe)}>Edit</button>
              <button className="btn btn-danger" onClick={() => onDelete(recipe.id)}>Delete</button>
            </>
          )}
        </div>
      </div>

      <div className="detail-hero">
        <img className="detail-img" src={coverImage(recipe)} alt={recipe.title} />
        <div className="detail-info">
          <h2>{recipe.title}</h2>
          <p className="detail-desc">{recipe.shortDescription}</p>
          <div className="chip-row">
            <span className="chip">{cuisineName(recipe.cuisineId)}</span>
            <span className="chip">{mealTypeName(recipe.mealTypeId)}</span>
            {tagNames(recipe.dietaryTagIds).map(t => <span key={t} className="chip chip-tag">{t}</span>)}
            {categoryNames(recipe.categoryIds).map(c => <span key={c} className="chip chip-cat">{c}</span>)}
          </div>
          <div className="stat-row">
            <div className="stat"><span className="stat-label">Prep</span><strong>{recipe.prepMinutes} min</strong></div>
            <div className="stat"><span className="stat-label">Cook</span><strong>{recipe.cookMinutes} min</strong></div>
            <div className="stat"><span className="stat-label">Total</span><strong>{recipe.totalMinutes || recipe.prepMinutes + recipe.cookMinutes} min</strong></div>
            <div className="stat"><span className="stat-label">Servings</span><strong>{formatQty(recipe.servings)}</strong></div>
            <div className="stat"><span className="stat-label">Spice</span><strong>{SPICE_LEVELS[recipe.spiceLevel] || 'None'}</strong></div>
            <div className="stat"><span className="stat-label">Difficulty</span><strong>{recipe.difficulty}/5</strong></div>
          </div>
          {recipe.sourceName && (
            <p className="source-line">
              Source: {recipe.sourceUrl
                ? <a href={recipe.sourceUrl} target="_blank" rel="noreferrer">{recipe.sourceName}</a>
                : recipe.sourceName}
            </p>
          )}
          <div className="detail-controls">
            <AddToPlan onAdd={onAddToPlan} />
            <OptionsMenu options={options} onChange={onOptionsChange} />
          </div>
        </div>
      </div>

      <div className="detail-columns">
        <div className="detail-main">
          <div className="ingredients-block">
            <h3>Ingredients</h3>
            {sections.map(sec => (
              <div key={sec.name} className="ing-section">
                <h4>{sec.name}</h4>
                <ul>
                  {sec.items.map((ing, i) => {
                    const c = convertQuantity(ing.quantity, ing.unit, options.unitSystem)
                    return (
                      <li key={i}>
                        <span className="ing-qty">{formatQty(c.qty)} {c.unit !== ing.unit ? `${c.unit} ` : ing.unit ? `${ing.unit} ` : ''}</span>
                        <span className="ing-name">{ing.name}</span>
                        {ing.notes && <span className="ing-notes">({ing.notes})</span>}
                        {ing.optional && <span className="ing-optional">optional</span>}
                        {options.allowSubstitutions && !ing.optional && (
                          <span className="ing-sub" title="Substitutions allowed">substitutable</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="method-block">
            <h3>Method</h3>
            <ol className="steps">
              {recipe.steps.map((s, i) => (
                <li key={i}>
                  <span className="step-num" aria-hidden="true">{i + 1}</span>
                  <div>
                    <p>{s.instruction}</p>
                    {s.timerMinutes > 0 && <span className="step-timer">Timer: {s.timerMinutes} min</span>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
        {options.showNutrition && <Nutrition recipe={recipe} />}
      </div>
    </section>
  )
}
