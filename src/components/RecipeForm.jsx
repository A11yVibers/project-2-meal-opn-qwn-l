import { useMemo, useState } from 'react'
import {
  CUISINES, MEAL_TYPES, DIETARY_TAGS, CATEGORIES, INGREDIENTS, UNITS,
  SPICE_LEVELS, APPROVED_IMAGE_URLS, PLACEHOLDER_IMAGE, MEAL_SLOTS, DEFAULT_RECIPE_OPTIONS,
} from '../lib/data.js'
import { toISODate, startOfWeek, addDays, formatWeekRange } from '../lib/dates.js'
import RecipeOptionsMenu from './RecipeOptionsMenu.jsx'

const ACCENT_PRESETS = ['#D97757', '#8A9A5B', '#4F7CAC', '#C2607E', '#D9A441', '#6B8E8A', '#8E6BAF', '#B0532F']

function emptyItem() {
  return { ingredientId: null, ingredientName: '', quantity: '', unit: '', notes: '', optional: false }
}
function emptyStep() {
  return { instruction: '', timerMinutes: '' }
}

export default function RecipeForm({ onSave, onCancel, initialWeekStart }) {
  const [title, setTitle] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [cuisineId, setCuisineId] = useState('')
  const [mealTypeId, setMealTypeId] = useState('')
  const [dietaryTagIds, setDietaryTagIds] = useState([])
  const [categoryIds, setCategoryIds] = useState([])

  const [servings, setServings] = useState(4)
  const [prepMinutes, setPrepMinutes] = useState('')
  const [cookMinutes, setCookMinutes] = useState('')
  const [spiceLevel, setSpiceLevel] = useState(1)

  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [accentColor, setAccentColor] = useState(ACCENT_PRESETS[0])

  const [sections, setSections] = useState([{ name: 'Main', items: [emptyItem()] }])
  const [steps, setSteps] = useState([emptyStep()])

  const [includeInSuggestions, setIncludeInSuggestions] = useState(true)
  const [addToPlan, setAddToPlan] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [planDate, setPlanDate] = useState('')
  const [planSlot, setPlanSlot] = useState('Dinner')
  const [planTime, setPlanTime] = useState('18:30')

  const [options, setOptions] = useState({ ...DEFAULT_RECIPE_OPTIONS })
  const [error, setError] = useState('')

  const totalTime = (Number(prepMinutes) || 0) + (Number(cookMinutes) || 0)

  const ingredientByName = useMemo(() => {
    const map = new Map()
    INGREDIENTS.forEach((i) => map.set(i.ingredient_name.toLowerCase(), i))
    return map
  }, [])

  const toggleIn = (list, value, setter) =>
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

  // ---- ingredient section controls ----
  const updateSectionName = (sIdx, name) =>
    setSections((secs) => secs.map((s, i) => (i === sIdx ? { ...s, name } : s)))

  const updateItem = (sIdx, iIdx, patch) =>
    setSections((secs) => secs.map((s, i) => {
      if (i !== sIdx) return s
      const items = s.items.map((it, j) => {
        if (j !== iIdx) return it
        const next = { ...it, ...patch }
        if (patch.ingredientName !== undefined) {
          const match = ingredientByName.get(patch.ingredientName.trim().toLowerCase())
          next.ingredientId = match ? match.ingredient_id : null
          if (match && !next.unit) next.unit = ''
        }
        return next
      })
      return { ...s, items }
    }))

  const addItem = (sIdx) =>
    setSections((secs) => secs.map((s, i) => (i === sIdx ? { ...s, items: [...s.items, emptyItem()] } : s)))

  const removeItem = (sIdx, iIdx) =>
    setSections((secs) => secs.map((s, i) => {
      if (i !== sIdx) return s
      const items = s.items.filter((_, j) => j !== iIdx)
      return { ...s, items: items.length ? items : [emptyItem()] }
    }))

  const moveItem = (sIdx, iIdx, dir) =>
    setSections((secs) => secs.map((s, i) => {
      if (i !== sIdx) return s
      const j = iIdx + dir
      if (j < 0 || j >= s.items.length) return s
      const items = [...s.items]
      ;[items[iIdx], items[j]] = [items[j], items[iIdx]]
      return { ...s, items }
    }))

  const addSection = () => {
    const n = sections.length + 1
    setSections((secs) => [...secs, { name: `Section ${n}`, items: [emptyItem()] }])
  }

  const removeSection = (sIdx) =>
    setSections((secs) => (secs.length > 1 ? secs.filter((_, i) => i !== sIdx) : secs))

  const moveSection = (sIdx, dir) =>
    setSections((secs) => {
      const j = sIdx + dir
      if (j < 0 || j >= secs.length) return secs
      const next = [...secs]
      ;[next[sIdx], next[j]] = [next[j], next[sIdx]]
      return next
    })

  // ---- step controls ----
  const updateStep = (idx, patch) =>
    setSteps((st) => st.map((s, i) => (i === idx ? { ...s, ...patch } : s)))
  const addStep = () => setSteps((st) => [...st, emptyStep()])
  const removeStep = (idx) =>
    setSteps((st) => (st.length > 1 ? st.filter((_, i) => i !== idx) : st))
  const moveStep = (idx, dir) =>
    setSteps((st) => {
      const j = idx + dir
      if (j < 0 || j >= st.length) return st
      const next = [...st]
      ;[next[idx], next[j]] = [next[j], next[idx]]
      return next
    })

  const weekStart = addDays(initialWeekStart, weekOffset * 7)

  const handleSave = () => {
    if (!title.trim()) {
      setError('Please give the recipe a title.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const cleanSections = sections
      .map((s) => ({
        name: s.name.trim() || 'Main',
        items: s.items.filter((it) => it.ingredientName.trim()),
      }))
      .filter((s) => s.items.length > 0)
    const cleanSteps = steps
      .filter((s) => s.instruction.trim())
      .map((s) => ({ instruction: s.instruction.trim(), timerMinutes: Number(s.timerMinutes) || null }))

    const recipe = {
      id: `U-${Date.now()}`,
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      sourceName: sourceName.trim(),
      sourceUrl: sourceUrl.trim(),
      servings: Math.max(1, Number(servings) || 1),
      prepMinutes: Number(prepMinutes) || 0,
      cookMinutes: Number(cookMinutes) || 0,
      totalMinutes: totalTime,
      cuisineId,
      mealTypeId,
      dietaryTagIds,
      categoryIds,
      difficulty: 1,
      spiceLevel: Number(spiceLevel),
      accentColor,
      coverImageUrl,
      includeInSuggestions,
      ingredientSections: cleanSections,
      steps: cleanSteps,
      isSeed: false,
    }

    const plan = addToPlan && planDate
      ? { date: planDate, slot: planSlot, time: planTime }
      : null
    onSave(recipe, plan, options)
  }

  return (
    <section className="form-view">
      <div className="form-header">
        <h2>Add a new recipe</h2>
        <div className="form-header-actions">
          <RecipeOptionsMenu options={options} onChange={setOptions} label="Recipe options" />
          <button className="btn ghost" onClick={onCancel}>Cancel</button>
          <button className="btn primary" onClick={handleSave}>Save recipe</button>
        </div>
      </div>
      {error && <p className="error-banner">{error}</p>}

      <fieldset className="form-section">
        <legend>Recipe details</legend>
        <label className="field">
          <span>Recipe title *</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weeknight miso noodles" />
        </label>
        <label className="field">
          <span>Short description</span>
          <textarea rows={2} value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="One-line summary shown on the recipe card" />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Source name</span>
            <input value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="Blog, book, family…" />
          </label>
          <label className="field grow">
            <span>Source link</span>
            <input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://…" />
          </label>
        </div>
        <div className="field-row">
          <label className="field">
            <span>Cuisine</span>
            <select value={cuisineId} onChange={(e) => setCuisineId(e.target.value)}>
              <option value="">Select cuisine…</option>
              {CUISINES.map((c) => <option key={c.cuisine_id} value={c.cuisine_id}>{c.cuisine_name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Primary meal type</span>
            <select value={mealTypeId} onChange={(e) => setMealTypeId(e.target.value)}>
              <option value="">Select meal type…</option>
              {MEAL_TYPES.map((m) => <option key={m.meal_type_id} value={m.meal_type_id}>{m.meal_type_name}</option>)}
            </select>
          </label>
        </div>
        <div className="field">
          <span>Dietary suitability</span>
          <div className="check-grid">
            {DIETARY_TAGS.map((d) => (
              <label key={d.dietary_tag_id} className={dietaryTagIds.includes(d.dietary_tag_id) ? 'on' : ''}>
                <input
                  type="checkbox"
                  checked={dietaryTagIds.includes(d.dietary_tag_id)}
                  onChange={() => toggleIn(dietaryTagIds, d.dietary_tag_id, setDietaryTagIds)}
                />
                {d.dietary_tag_name}
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <span>Recipe categories</span>
          <div className="check-grid">
            {CATEGORIES.map((c) => (
              <label key={c.category_id} className={categoryIds.includes(c.category_id) ? 'on' : ''}>
                <input
                  type="checkbox"
                  checked={categoryIds.includes(c.category_id)}
                  onChange={() => toggleIn(categoryIds, c.category_id, setCategoryIds)}
                />
                {c.category_name}
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Timing &amp; yield</legend>
        <div className="field-row">
          <label className="field">
            <span>Servings</span>
            <div className="stepper">
              <button type="button" onClick={() => setServings((s) => Math.max(1, Number(s) - 1))}>−</button>
              <input
                type="number" min="1" value={servings}
                onChange={(e) => setServings(Math.max(1, Number(e.target.value) || 1))}
              />
              <button type="button" onClick={() => setServings((s) => Number(s) + 1)}>+</button>
            </div>
          </label>
          <label className="field">
            <span>Prep time (min)</span>
            <input type="number" min="0" value={prepMinutes} onChange={(e) => setPrepMinutes(e.target.value)} />
          </label>
          <label className="field">
            <span>Cook time (min)</span>
            <input type="number" min="0" value={cookMinutes} onChange={(e) => setCookMinutes(e.target.value)} />
          </label>
          <label className="field">
            <span>Total time (auto)</span>
            <input type="text" readOnly value={totalTime ? `${totalTime} min` : '—'} className="readonly" />
          </label>
        </div>
        <label className="field">
          <span>Spice level — {SPICE_LEVELS.find((s) => s.value === Number(spiceLevel))?.label}</span>
          <input
            type="range" min="0" max="5" step="1" value={spiceLevel}
            onChange={(e) => setSpiceLevel(Number(e.target.value))}
          />
          <div className="range-labels">
            <span>Not spicy</span><span>Mild</span><span>Medium</span><span>Spicy</span><span>Very spicy</span><span>Extreme</span>
          </div>
        </label>
      </fieldset>

      <fieldset className="form-section">
        <legend>Image &amp; appearance</legend>
        <div className="field">
          <span>Cover image (choose from approved remote images)</span>
          <div className="image-picker">
            <label className={`image-option${coverImageUrl === '' ? ' selected' : ''}`}>
              <input type="radio" name="cover" checked={coverImageUrl === ''} onChange={() => setCoverImageUrl('')} />
              <img src={PLACEHOLDER_IMAGE} alt="Placeholder" />
              <span>Placeholder</span>
            </label>
            {APPROVED_IMAGE_URLS.filter((u) => u !== PLACEHOLDER_IMAGE).map((url) => (
              <label key={url} className={`image-option${coverImageUrl === url ? ' selected' : ''}`}>
                <input type="radio" name="cover" checked={coverImageUrl === url} onChange={() => setCoverImageUrl(url)} />
                <img src={url} alt="Approved cover" />
                <span>Approved image</span>
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <span>Recipe card accent color</span>
          <div className="color-picker">
            {ACCENT_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                className={`swatch${accentColor === c ? ' selected' : ''}`}
                style={{ background: c }}
                onClick={() => setAccentColor(c)}
                aria-label={`Accent ${c}`}
              />
            ))}
            <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Ingredients</legend>
        {sections.map((sec, sIdx) => (
          <div key={sIdx} className="ing-section-block">
            <div className="ing-section-header">
              <input
                className="section-name"
                value={sec.name}
                onChange={(e) => updateSectionName(sIdx, e.target.value)}
                placeholder="Section name (Main, Sauce, Garnish…)"
              />
              <div className="row-actions">
                <button type="button" className="btn icon" title="Move section up" disabled={sIdx === 0} onClick={() => moveSection(sIdx, -1)}>↑</button>
                <button type="button" className="btn icon" title="Move section down" disabled={sIdx === sections.length - 1} onClick={() => moveSection(sIdx, 1)}>↓</button>
                <button type="button" className="btn icon danger" title="Remove section" disabled={sections.length === 1} onClick={() => removeSection(sIdx)}>✕</button>
              </div>
            </div>
            <div className="ing-header-row small muted">
              <span>Ingredient</span><span>Qty</span><span>Unit</span><span>Notes</span><span>Opt.</span><span />
            </div>
            {sec.items.map((item, iIdx) => (
              <div key={iIdx} className="ing-row">
                <input
                  list="ingredient-options"
                  value={item.ingredientName}
                  onChange={(e) => updateItem(sIdx, iIdx, { ingredientName: e.target.value })}
                  placeholder="Search ingredients…"
                />
                <input
                  className="qty" type="number" min="0" step="0.25" value={item.quantity}
                  onChange={(e) => updateItem(sIdx, iIdx, { quantity: e.target.value })}
                  placeholder="0"
                />
                <select value={item.unit} onChange={(e) => updateItem(sIdx, iIdx, { unit: e.target.value })}>
                  <option value="">—</option>
                  {UNITS.map((u) => <option key={u.unit_id} value={u.unit_name}>{u.unit_name}</option>)}
                </select>
                <input
                  value={item.notes}
                  onChange={(e) => updateItem(sIdx, iIdx, { notes: e.target.value })}
                  placeholder="minced, fresh…"
                />
                <label className="centered-check">
                  <input
                    type="checkbox" checked={item.optional}
                    onChange={(e) => updateItem(sIdx, iIdx, { optional: e.target.checked })}
                  />
                </label>
                <div className="row-actions">
                  <button type="button" className="btn icon" title="Move up" disabled={iIdx === 0} onClick={() => moveItem(sIdx, iIdx, -1)}>↑</button>
                  <button type="button" className="btn icon" title="Move down" disabled={iIdx === sec.items.length - 1} onClick={() => moveItem(sIdx, iIdx, 1)}>↓</button>
                  <button type="button" className="btn icon danger" title="Remove ingredient" onClick={() => removeItem(sIdx, iIdx)}>✕</button>
                </div>
              </div>
            ))}
            <button type="button" className="btn small" onClick={() => addItem(sIdx)}>+ Add ingredient</button>
          </div>
        ))}
        <datalist id="ingredient-options">
          {INGREDIENTS.map((i) => <option key={i.ingredient_id} value={i.ingredient_name} />)}
        </datalist>
        <button type="button" className="btn" onClick={addSection}>+ Add ingredient section</button>
      </fieldset>

      <fieldset className="form-section">
        <legend>Method</legend>
        {steps.map((step, idx) => (
          <div key={idx} className="step-row">
            <span className="step-number">{idx + 1}</span>
            <textarea
              rows={2} value={step.instruction}
              onChange={(e) => updateStep(idx, { instruction: e.target.value })}
              placeholder="Describe this step…"
            />
            <label className="timer-field">
              <span className="small muted">Timer (min)</span>
              <input
                type="number" min="0" value={step.timerMinutes}
                onChange={(e) => updateStep(idx, { timerMinutes: e.target.value })}
              />
            </label>
            <div className="row-actions">
              <button type="button" className="btn icon" title="Move up" disabled={idx === 0} onClick={() => moveStep(idx, -1)}>↑</button>
              <button type="button" className="btn icon" title="Move down" disabled={idx === steps.length - 1} onClick={() => moveStep(idx, 1)}>↓</button>
              <button type="button" className="btn icon danger" title="Remove step" onClick={() => removeStep(idx)}>✕</button>
            </div>
          </div>
        ))}
        <button type="button" className="btn small" onClick={addStep}>+ Add step</button>
      </fieldset>

      <fieldset className="form-section">
        <legend>Meal planning</legend>
        <label className={`option-toggle wide${includeInSuggestions ? ' on' : ''}`}>
          <input type="checkbox" checked={includeInSuggestions} onChange={(e) => setIncludeInSuggestions(e.target.checked)} />
          Make this recipe available in meal-plan suggestions
        </label>
        <label className={`option-toggle wide${addToPlan ? ' on' : ''}`}>
          <input type="checkbox" checked={addToPlan} onChange={(e) => {
            setAddToPlan(e.target.checked)
            if (e.target.checked && !planDate) setPlanDate(toISODate(weekStart))
          }} />
          Add this recipe to my meal plan immediately
        </label>
        {addToPlan && (
          <div className="plan-fields">
            <label className="field">
              <span>Planning week</span>
              <select value={weekOffset} onChange={(e) => {
                const off = Number(e.target.value)
                setWeekOffset(off)
                setPlanDate(toISODate(addDays(initialWeekStart, off * 7)))
              }}>
                <option value={0}>This week ({formatWeekRange(initialWeekStart)})</option>
                <option value={1}>Next week ({formatWeekRange(addDays(initialWeekStart, 7))})</option>
                <option value={2}>In 2 weeks ({formatWeekRange(addDays(initialWeekStart, 14))})</option>
              </select>
            </label>
            <label className="field">
              <span>Planned cooking date</span>
              <input type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)} />
            </label>
            <label className="field">
              <span>Planned serving time slot</span>
              <select value={planSlot} onChange={(e) => setPlanSlot(e.target.value)}>
                {MEAL_SLOTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Serving date &amp; time</span>
              <input type="time" value={planTime} onChange={(e) => setPlanTime(e.target.value)} />
            </label>
            <p className="muted small">
              {planDate
                ? `Will be planned on ${planDate} for ${planSlot}${planTime ? ` at ${planTime}` : ''}.`
                : 'Choose a date within the selected week.'}
            </p>
          </div>
        )}
      </fieldset>

      <div className="form-footer">
        <RecipeOptionsMenu options={options} onChange={setOptions} label="Recipe options" />
        <div className="grow" />
        <button className="btn ghost" onClick={onCancel}>Cancel</button>
        <button className="btn primary" onClick={handleSave}>Save recipe</button>
      </div>
    </section>
  )
}
