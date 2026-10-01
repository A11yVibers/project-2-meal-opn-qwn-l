import { useMemo, useState } from 'react'
import {
  CUISINES, MEAL_TYPES, DIETARY_TAGS, RECIPE_CATEGORIES, INGREDIENTS, UNITS,
  SPICE_LEVELS, COVER_IMAGE_CHOICES, ACCENT_SWATCHES, PLANNER_SLOTS,
  thisMondayISO, addWeeks, weekDays, fmtDateLabel, coverImage,
  DEFAULT_RECIPE_OPTIONS
} from '../data.js'
import { uid } from '../storage.js'

let keySeq = 0
const nextKey = () => `k${++keySeq}`

function newSection(name = 'Main') {
  return { key: nextKey(), name, items: [newItem()] }
}
function newItem() {
  return { key: nextKey(), ingredientId: '', name: '', quantity: 1, unit: 'piece', notes: '', optional: false }
}
function newStep() {
  return { key: nextKey(), instruction: '', timerMinutes: 0 }
}

function move(arr, i, dir) {
  const j = i + dir
  if (j < 0 || j >= arr.length) return arr
  const copy = [...arr]
  const [it] = copy.splice(i, 1)
  copy.splice(j, 0, it)
  return copy
}

export default function RecipeForm({ initial, onSave, onCancel }) {
  const editing = Boolean(initial)
  const [title, setTitle] = useState(initial?.title || '')
  const [shortDescription, setShortDescription] = useState(initial?.shortDescription || '')
  const [sourceName, setSourceName] = useState(initial?.sourceName || '')
  const [sourceUrl, setSourceUrl] = useState(initial?.sourceUrl || '')
  const [cuisineId, setCuisineId] = useState(initial?.cuisineId || CUISINES[0].cuisine_id)
  const [mealTypeId, setMealTypeId] = useState(initial?.mealTypeId || MEAL_TYPES[0].meal_type_id)
  const [dietaryTagIds, setDietaryTagIds] = useState(initial?.dietaryTagIds || [])
  const [categoryIds, setCategoryIds] = useState(initial?.categoryIds || [])

  const [servings, setServings] = useState(initial?.servings ?? 4)
  const [prepMinutes, setPrepMinutes] = useState(initial?.prepMinutes ?? 10)
  const [cookMinutes, setCookMinutes] = useState(initial?.cookMinutes ?? 20)
  const [spiceLevel, setSpiceLevel] = useState(initial?.spiceLevel ?? 1)
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? 1)
  const totalMinutes = (Number(prepMinutes) || 0) + (Number(cookMinutes) || 0)

  const [coverChoice, setCoverChoice] = useState(() => {
    const url = initial?.coverImageUrl || ''
    return url
  })
  const [accentColor, setAccentColor] = useState(initial?.accentColor || ACCENT_SWATCHES[0])

  const [sections, setSections] = useState(() =>
    initial
      ? groupIntoSections(initial.ingredients)
      : [newSection('Main')]
  )
  const [steps, setSteps] = useState(() =>
    initial && initial.steps.length
      ? initial.steps.map(s => ({ ...s, key: nextKey() }))
      : [newStep()]
  )

  const [includeInMealSuggestions, setIncludeInMealSuggestions] = useState(initial?.includeInMealSuggestions ?? true)
  const [addToPlanNow, setAddToPlanNow] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [planDate, setPlanDate] = useState(weekDays(thisMondayISO())[0])
  const [planSlot, setPlanSlot] = useState('Dinner')
  const [planTime, setPlanTime] = useState('18:30')

  const [options, setOptions] = useState(initial ? { ...DEFAULT_RECIPE_OPTIONS, ...(initial.savedOptions || {}) } : { ...DEFAULT_RECIPE_OPTIONS })
  const [errors, setErrors] = useState({})

  const monday = useMemo(() => addWeeks(thisMondayISO(), weekOffset), [weekOffset])
  const days = useMemo(() => weekDays(monday), [monday])
  const effectiveDate = days.includes(planDate) ? planDate : days[0]

  const toggleIn = (list, setList, v) =>
    setList(list.includes(v) ? list.filter(x => x !== v) : [...list, v])

  const updateItem = (si, ii, patch) =>
    setSections(secs => secs.map((s, i) =>
      i !== si ? s : { ...s, items: s.items.map((it, j) => j !== ii ? it : { ...it, ...patch }) }
    ))

  const onIngredientName = (si, ii, value) => {
    const match = INGREDIENTS.find(ing => ing.ingredient_name.toLowerCase() === value.toLowerCase())
    updateItem(si, ii, match
      ? { name: match.ingredient_name, ingredientId: match.ingredient_id }
      : { name: value, ingredientId: '' })
  }

  const submit = e => {
    e.preventDefault()
    const errs = {}
    if (!title.trim()) errs.title = 'Recipe title is required.'
    const hasIngredient = sections.some(s => s.items.some(it => it.name.trim()))
    if (!hasIngredient) errs.ingredients = 'Add at least one ingredient.'
    const hasStep = steps.some(s => s.instruction.trim())
    if (!hasStep) errs.steps = 'Add at least one method step.'
    setErrors(errs)
    if (Object.keys(errs).length) return

    const ingredients = sections.flatMap(s =>
      s.items
        .filter(it => it.name.trim())
        .map(it => ({
          section: s.name.trim() || 'Main',
          ingredientId: it.ingredientId || '',
          name: it.name.trim(),
          quantity: Number(it.quantity) || 0,
          unit: it.unit,
          notes: it.notes,
          optional: Boolean(it.optional)
        }))
    )
    const recipe = {
      id: initial?.id || uid('R'),
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      sourceName: sourceName.trim(),
      sourceUrl: sourceUrl.trim(),
      servings: Number(servings) || 1,
      prepMinutes: Number(prepMinutes) || 0,
      cookMinutes: Number(cookMinutes) || 0,
      totalMinutes,
      cuisineId,
      mealTypeId,
      dietaryTagIds,
      categoryIds,
      difficulty: Number(difficulty) || 1,
      spiceLevel: Number(spiceLevel) || 0,
      accentColor,
      coverImageUrl: coverChoice,
      includeInMealSuggestions,
      isSeed: Boolean(initial?.isSeed),
      ingredients,
      steps: steps
        .filter(s => s.instruction.trim())
        .map(s => ({ instruction: s.instruction.trim(), timerMinutes: Number(s.timerMinutes) || 0 }))
    }
    const plan = addToPlanNow
      ? { date: effectiveDate, slot: planSlot, time: planTime }
      : null
    onSave(recipe, plan, options)
  }

  return (
    <form className="recipe-form" onSubmit={submit} noValidate>
      <div className="form-head">
        <h2>{editing ? `Edit: ${initial.title}` : 'Add a new recipe'}</h2>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>

      <fieldset className="form-section">
        <legend>Recipe details</legend>
        <div className="field">
          <label htmlFor="f-title">Recipe title *</label>
          <input id="f-title" value={title} onChange={e => setTitle(e.target.value)} required />
          {errors.title && <p className="field-error" role="alert">{errors.title}</p>}
        </div>
        <div className="field">
          <label htmlFor="f-desc">Short description</label>
          <textarea id="f-desc" rows={2} value={shortDescription} onChange={e => setShortDescription(e.target.value)} />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="f-source-name">Source name</label>
            <input id="f-source-name" value={sourceName} onChange={e => setSourceName(e.target.value)} placeholder="e.g. Family notebook" />
          </div>
          <div className="field">
            <label htmlFor="f-source-url">Source link</label>
            <input id="f-source-url" type="url" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="f-cuisine">Cuisine</label>
            <select id="f-cuisine" value={cuisineId} onChange={e => setCuisineId(e.target.value)}>
              {CUISINES.map(c => <option key={c.cuisine_id} value={c.cuisine_id}>{c.cuisine_name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-mealtype">Primary meal type</label>
            <select id="f-mealtype" value={mealTypeId} onChange={e => setMealTypeId(e.target.value)}>
              {MEAL_TYPES.map(m => <option key={m.meal_type_id} value={m.meal_type_id}>{m.meal_type_name}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <span className="group-label" id="lbl-dietary">Dietary suitability</span>
          <div className="check-chips" role="group" aria-labelledby="lbl-dietary">
            {DIETARY_TAGS.map(t => (
              <label key={t.dietary_tag_id} className={`check-chip ${dietaryTagIds.includes(t.dietary_tag_id) ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={dietaryTagIds.includes(t.dietary_tag_id)}
                  onChange={() => toggleIn(dietaryTagIds, setDietaryTagIds, t.dietary_tag_id)}
                />
                {t.dietary_tag_name}
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <span className="group-label" id="lbl-cats">Recipe categories</span>
          <div className="check-chips" role="group" aria-labelledby="lbl-cats">
            {RECIPE_CATEGORIES.map(c => (
              <label key={c.category_id} className={`check-chip ${categoryIds.includes(c.category_id) ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={categoryIds.includes(c.category_id)}
                  onChange={() => toggleIn(categoryIds, setCategoryIds, c.category_id)}
                />
                {c.category_name}
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Timing and yield</legend>
        <div className="field-row">
          <div className="field">
            <label htmlFor="f-servings">Servings</label>
            <div className="stepper">
              <button type="button" aria-label="Decrease servings" onClick={() => setServings(s => Math.max(1, Number(s) - 1))}>−</button>
              <input id="f-servings" type="number" min="1" value={servings} onChange={e => setServings(Math.max(1, Number(e.target.value) || 1))} />
              <button type="button" aria-label="Increase servings" onClick={() => setServings(s => Number(s) + 1)}>+</button>
            </div>
          </div>
          <div className="field">
            <label htmlFor="f-prep">Prep time (min)</label>
            <input id="f-prep" type="number" min="0" value={prepMinutes} onChange={e => setPrepMinutes(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="f-cook">Cook time (min)</label>
            <input id="f-cook" type="number" min="0" value={cookMinutes} onChange={e => setCookMinutes(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="f-total">Total time</label>
            <input id="f-total" type="text" readOnly value={`${totalMinutes} min`} aria-describedby="total-hint" />
            <span id="total-hint" className="hint">Auto: prep + cook</span>
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="f-spice">Spice level: {SPICE_LEVELS[Number(spiceLevel)] || 'None'}</label>
            <input
              id="f-spice" type="range" min="0" max="5" step="1"
              value={spiceLevel} onChange={e => setSpiceLevel(e.target.value)}
              aria-valuetext={SPICE_LEVELS[Number(spiceLevel)] || 'None'}
            />
            <div className="range-labels"><span>Mild</span><span>Very spicy</span></div>
          </div>
          <div className="field">
            <label htmlFor="f-diff">Difficulty (1–5)</label>
            <input id="f-diff" type="range" min="1" max="5" step="1" value={difficulty} onChange={e => setDifficulty(e.target.value)} />
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Image and appearance</legend>
        <div className="field">
          <span className="group-label" id="lbl-cover">Cover image</span>
          <div className="cover-picker" role="radiogroup" aria-labelledby="lbl-cover">
            {COVER_IMAGE_CHOICES.map(c => (
              <button
                type="button"
                key={c.url || 'none'}
                role="radio"
                aria-checked={coverChoice === c.url}
                className={`cover-choice ${coverChoice === c.url ? 'cover-active' : ''}`}
                onClick={() => setCoverChoice(c.url)}
              >
                <img src={coverImage({ coverImageUrl: c.url })} alt="" />
                <span>{c.label}</span>
              </button>
            ))}
          </div>
          <p className="hint">Choose from approved remote images. Without one, the placeholder is used.</p>
        </div>
        <div className="field">
          <span className="group-label" id="lbl-accent">Recipe card accent color</span>
          <div className="swatch-row" role="radiogroup" aria-labelledby="lbl-accent">
            {ACCENT_SWATCHES.map(c => (
              <button
                type="button"
                key={c}
                role="radio"
                aria-checked={accentColor === c}
                aria-label={`Accent color ${c}`}
                className={`swatch ${accentColor === c ? 'swatch-active' : ''}`}
                style={{ background: c }}
                onClick={() => setAccentColor(c)}
              />
            ))}
            <label className="swatch-custom">
              <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} aria-label="Custom accent color" />
              Custom
            </label>
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Ingredients</legend>
        {errors.ingredients && <p className="field-error" role="alert">{errors.ingredients}</p>}
        {sections.map((sec, si) => (
          <div key={sec.key} className="ing-edit-section">
            <div className="ing-section-head">
              <label>
                Section name
                <input
                  value={sec.name}
                  onChange={e => setSections(secs => secs.map((s, i) => i !== si ? s : { ...s, name: e.target.value }))}
                  placeholder="Main / Sauce / Garnish"
                />
              </label>
              <div className="row-controls">
                <button type="button" className="btn btn-small" aria-label={`Move section ${sec.name || si + 1} up`} disabled={si === 0}
                  onClick={() => setSections(secs => move(secs, si, -1))}>↑</button>
                <button type="button" className="btn btn-small" aria-label={`Move section ${sec.name || si + 1} down`} disabled={si === sections.length - 1}
                  onClick={() => setSections(secs => move(secs, si, 1))}>↓</button>
                <button type="button" className="btn btn-small btn-danger" disabled={sections.length === 1}
                  onClick={() => setSections(secs => secs.filter((_, i) => i !== si))}>Remove section</button>
              </div>
            </div>
            <table className="ing-table">
              <thead>
                <tr><th>Ingredient</th><th>Quantity</th><th>Unit</th><th>Notes</th><th>Optional</th><th>Reorder / remove</th></tr>
              </thead>
              <tbody>
                {sec.items.map((it, ii) => (
                  <tr key={it.key}>
                    <td>
                      <input
                        list="ingredient-options"
                        value={it.name}
                        onChange={e => onIngredientName(si, ii, e.target.value)}
                        placeholder="Search ingredients..."
                        aria-label={`Ingredient name, section ${sec.name || si + 1}, row ${ii + 1}`}
                      />
                    </td>
                    <td>
                      <input type="number" min="0" step="0.25" value={it.quantity}
                        onChange={e => updateItem(si, ii, { quantity: e.target.value })}
                        aria-label={`Quantity, ${it.name || 'ingredient'} row ${ii + 1}`} />
                    </td>
                    <td>
                      <select value={it.unit} onChange={e => updateItem(si, ii, { unit: e.target.value })}
                        aria-label={`Unit, ${it.name || 'ingredient'} row ${ii + 1}`}>
                        <option value="">—</option>
                        {UNITS.map(u => <option key={u.unit_id} value={u.unit_name}>{u.unit_name}</option>)}
                      </select>
                    </td>
                    <td>
                      <input value={it.notes} onChange={e => updateItem(si, ii, { notes: e.target.value })}
                        placeholder="minced, drained..." aria-label={`Notes, ${it.name || 'ingredient'} row ${ii + 1}`} />
                    </td>
                    <td className="center">
                      <input type="checkbox" checked={it.optional} onChange={e => updateItem(si, ii, { optional: e.target.checked })}
                        aria-label={`Optional, ${it.name || 'ingredient'} row ${ii + 1}`} />
                    </td>
                    <td>
                      <div className="row-controls">
                        <button type="button" className="btn btn-small" aria-label="Move ingredient up" disabled={ii === 0}
                          onClick={() => setSections(secs => secs.map((s, i) => i !== si ? s : { ...s, items: move(s.items, ii, -1) }))}>↑</button>
                        <button type="button" className="btn btn-small" aria-label="Move ingredient down" disabled={ii === sec.items.length - 1}
                          onClick={() => setSections(secs => secs.map((s, i) => i !== si ? s : { ...s, items: move(s.items, ii, 1) }))}>↓</button>
                        <button type="button" className="btn btn-small btn-danger" aria-label="Remove ingredient"
                          onClick={() => setSections(secs => secs.map((s, i) => i !== si ? s : { ...s, items: s.items.filter((_, j) => j !== ii) }))}>×</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="btn btn-secondary"
              onClick={() => setSections(secs => secs.map((s, i) => i !== si ? s : { ...s, items: [...s.items, newItem()] }))}>
              + Add ingredient
            </button>
          </div>
        ))}
        <datalist id="ingredient-options">
          {INGREDIENTS.map(i => <option key={i.ingredient_id} value={i.ingredient_name}>{i.shopping_category}</option>)}
        </datalist>
        <button type="button" className="btn btn-secondary" onClick={() => setSections(secs => [...secs, newSection('')])}>
          + Add ingredient section
        </button>
      </fieldset>

      <fieldset className="form-section">
        <legend>Method</legend>
        {errors.steps && <p className="field-error" role="alert">{errors.steps}</p>}
        <ol className="step-editor">
          {steps.map((s, i) => (
            <li key={s.key}>
              <span className="step-num" aria-hidden="true">{i + 1}</span>
              <div className="step-fields">
                <textarea rows={2} value={s.instruction} placeholder="Describe this step..."
                  aria-label={`Step ${i + 1} instruction`}
                  onChange={e => setSteps(ss => ss.map((x, j) => j !== i ? x : { ...x, instruction: e.target.value }))} />
                <label className="timer-field">
                  Timer (min)
                  <input type="number" min="0" value={s.timerMinutes}
                    aria-label={`Step ${i + 1} timer minutes`}
                    onChange={e => setSteps(ss => ss.map((x, j) => j !== i ? x : { ...x, timerMinutes: e.target.value }))} />
                </label>
              </div>
              <div className="row-controls">
                <button type="button" className="btn btn-small" aria-label={`Move step ${i + 1} up`} disabled={i === 0}
                  onClick={() => setSteps(ss => move(ss, i, -1))}>↑</button>
                <button type="button" className="btn btn-small" aria-label={`Move step ${i + 1} down`} disabled={i === steps.length - 1}
                  onClick={() => setSteps(ss => move(ss, i, 1))}>↓</button>
                <button type="button" className="btn btn-small btn-danger" aria-label={`Remove step ${i + 1}`}
                  onClick={() => setSteps(ss => ss.length > 1 ? ss.filter((_, j) => j !== i) : ss)}>×</button>
              </div>
            </li>
          ))}
        </ol>
        <button type="button" className="btn btn-secondary" onClick={() => setSteps(ss => [...ss, newStep()])}>
          + Add step
        </button>
      </fieldset>

      <fieldset className="form-section">
        <legend>Meal planning options</legend>
        <label className="check-line">
          <input type="checkbox" checked={includeInMealSuggestions} onChange={e => setIncludeInMealSuggestions(e.target.checked)} />
          Make this recipe available in meal-plan suggestions
        </label>
        <label className="check-line">
          <input type="checkbox" checked={addToPlanNow} onChange={e => setAddToPlanNow(e.target.checked)} />
          Add this recipe to the meal plan immediately
        </label>
        {addToPlanNow && (
          <div className="plan-fields">
            <div className="field">
              <label htmlFor="pf-week">Planning week</label>
              <select id="pf-week" value={weekOffset} onChange={e => setWeekOffset(Number(e.target.value))}>
                <option value={0}>This week</option>
                <option value={1}>Next week</option>
                <option value={2}>In 2 weeks</option>
                <option value={3}>In 3 weeks</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="pf-date">Planned cooking date</label>
              <select id="pf-date" value={effectiveDate} onChange={e => setPlanDate(e.target.value)}>
                {days.map(d => <option key={d} value={d}>{fmtDateLabel(d)}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="pf-slot">Planned serving time</label>
              <select id="pf-slot" value={planSlot} onChange={e => setPlanSlot(e.target.value)}>
                {PLANNER_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="pf-time">Date &amp; time</label>
              <input id="pf-time" type="time" value={planTime} onChange={e => setPlanTime(e.target.value)} />
              <span className="hint">Served on {fmtDateLabel(effectiveDate)} at {planTime}</span>
            </div>
          </div>
        )}
      </fieldset>

      <fieldset className="form-section">
        <legend>Recipe options</legend>
        <div className="opt-grid">
          <label className={`check-line ${options.includeInShoppingList ? 'checked' : ''}`}>
            <input type="checkbox" checked={options.includeInShoppingList}
              onChange={e => setOptions(o => ({ ...o, includeInShoppingList: e.target.checked }))} />
            Include ingredients in generated shopping lists
          </label>
          <label className={`check-line ${options.showNutrition ? 'checked' : ''}`}>
            <input type="checkbox" checked={options.showNutrition}
              onChange={e => setOptions(o => ({ ...o, showNutrition: e.target.checked }))} />
            Show nutrition information
          </label>
          <label className={`check-line ${options.allowSubstitutions ? 'checked' : ''}`}>
            <input type="checkbox" checked={options.allowSubstitutions}
              onChange={e => setOptions(o => ({ ...o, allowSubstitutions: e.target.checked }))} />
            Allow ingredient substitutions
          </label>
          <div className="field">
            <span className="group-label" id="lbl-units">Measurements</span>
            <div className="opt-radio-row" role="radiogroup" aria-labelledby="lbl-units">
              <button type="button" role="radio" aria-checked={options.unitSystem === 'us'}
                className={`seg ${options.unitSystem === 'us' ? 'seg-active' : ''}`}
                onClick={() => setOptions(o => ({ ...o, unitSystem: 'us' }))}>US customary</button>
              <button type="button" role="radio" aria-checked={options.unitSystem === 'metric'}
                className={`seg ${options.unitSystem === 'metric' ? 'seg-active' : ''}`}
                onClick={() => setOptions(o => ({ ...o, unitSystem: 'metric' }))}>Metric</button>
            </div>
          </div>
        </div>
      </fieldset>

      <div className="form-footer">
        <button type="submit" className="btn btn-primary btn-large">
          {editing ? 'Save changes' : 'Add recipe'}
        </button>
        <button type="button" className="btn btn-secondary btn-large" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

function groupIntoSections(ingredients) {
  const secs = []
  for (const ing of ingredients || []) {
    let sec = secs.find(s => s.name === ing.section)
    if (!sec) { sec = { key: nextKey(), name: ing.section || 'Main', items: [] }; secs.push(sec) }
    sec.items.push({ ...ing, key: nextKey() })
  }
  return secs.length ? secs : [newSection('Main')]
}
