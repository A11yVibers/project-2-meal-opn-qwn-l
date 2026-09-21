import { useMemo, useState } from 'react'
import {
  ACCENT_SWATCHES,
  CUISINES,
  DIETARY_TAGS,
  INGREDIENTS,
  MEAL_TYPES,
  RECIPE_CATEGORIES,
  SPICE_LEVELS,
  UNITS
} from '../data/catalog.js'
import { PLACEHOLDER_IMAGE } from '../data/catalog.js'
import { currentWeekStartIso, formatWeekRange, fromIsoDate, shiftWeek, toIsoDate, weekDates, DAY_SHORT, formatDayLabel } from '../lib/dates.js'
import { MEASUREMENT_SYSTEMS, formatMinutes, totalMinutes } from '../lib/measure.js'
import { emptyIngredientItem, emptySection, emptyStep, validateRecipe } from '../lib/recipes.js'
import IngredientCombobox from './IngredientCombobox.jsx'
import RecipeOptionsMenu from './RecipeOptionsMenu.jsx'
import { IconChevronDown, IconChevronUp, IconImage, IconPlus, IconTrash } from './Icons.jsx'
import { Field, NumberStepper, Switch, ToggleList } from './ui.jsx'

const UNIT_NAMES = UNITS.map((unit) => unit.name)
const SECTION_PRESETS = ['Main', 'Sauce', 'Garnish', 'Vegetables', 'Seasoning', 'Marinade', 'Topping']

export default function RecipeForm({ initial, onSave, onCancel, onDelete }) {
  const [draft, setDraft] = useState(initial)
  const [errors, setErrors] = useState({})
  const [planEnabled, setPlanEnabled] = useState(false)
  const [weekStart, setWeekStart] = useState(currentWeekStartIso())
  const [planDate, setPlanDate] = useState(toIsoDate(new Date()))
  const [planSlot, setPlanSlot] = useState('Dinner')
  const [planTime, setPlanTime] = useState('18:30')
  const [imageError, setImageError] = useState(false)

  const dates = weekDates(weekStart)
  const patch = (changes) => setDraft((current) => ({ ...current, ...changes }))
  const patchOptions = (options) => setDraft((current) => ({ ...current, options: { ...current.options, ...options } }))

  const computedTotal = useMemo(() => totalMinutes(draft), [draft.prepMinutes, draft.cookMinutes])
  const previewImage = !imageError && draft.coverImageUrl ? draft.coverImageUrl : PLACEHOLDER_IMAGE

  function updateItem(sectionId, itemId, changes) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId
          ? { ...section, items: section.items.map((item) => (item.id === itemId ? { ...item, ...changes } : item)) }
          : section
      )
    }))
  }

  function addItem(sectionId) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId ? { ...section, items: [...section.items, emptyIngredientItem()] } : section
      )
    }))
  }

  function removeItem(sectionId, itemId) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === sectionId
          ? { ...section, items: section.items.filter((item) => item.id !== itemId) }
          : section
      )
    }))
  }

  function moveItem(sectionId, index, delta) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== sectionId) return section
        const items = [...section.items]
        const target = index + delta
        if (target < 0 || target >= items.length) return section
        const [moved] = items.splice(index, 1)
        items.splice(target, 0, moved)
        return { ...section, items }
      })
    }))
  }

  function addSection(name) {
    setDraft((current) => ({ ...current, sections: [...current.sections, emptySection(name)] }))
  }

  function updateSection(sectionId, changes) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section) => (section.id === sectionId ? { ...section, ...changes } : section))
    }))
  }

  function removeSection(sectionId) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.filter((section) => section.id !== sectionId)
    }))
  }

  function moveSection(index, delta) {
    setDraft((current) => {
      const sections = [...current.sections]
      const target = index + delta
      if (target < 0 || target >= sections.length) return current
      const [moved] = sections.splice(index, 1)
      sections.splice(target, 0, moved)
      return { ...current, sections }
    })
  }

  function updateStep(stepId, changes) {
    setDraft((current) => ({
      ...current,
      steps: current.steps.map((step) => (step.id === stepId ? { ...step, ...changes } : step))
    }))
  }

  function moveStep(index, delta) {
    setDraft((current) => {
      const steps = [...current.steps]
      const target = index + delta
      if (target < 0 || target >= steps.length) return current
      const [moved] = steps.splice(index, 1)
      steps.splice(target, 0, moved)
      return { ...current, steps }
    })
  }

  function removeStep(stepId) {
    setDraft((current) => ({ ...current, steps: current.steps.filter((step) => step.id !== stepId) }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateRecipe(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      const firstKey = Object.keys(nextErrors)[0]
      document.getElementById(`field-${firstKey}`)?.focus()
      document.getElementById(`field-${firstKey}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return
    }
    const cleaned = {
      ...draft,
      totalMinutes: computedTotal,
      sections: draft.sections.map((section) => ({
        ...section,
        name: section.name.trim() || 'Ingredients',
        items: section.items.filter((item) => String(item.ingredientName || '').trim())
      })),
      steps: draft.steps
        .filter((step) => String(step.instruction || '').trim())
        .map((step, index) => ({ ...step, number: index + 1 }))
    }
    onSave(cleaned, planEnabled ? { date: planDate, slot: planSlot, servings: cleaned.servings, time: planTime } : null)
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate style={{ '--accent': draft.accentColor }}>
      <header className="page-header form-header">
        <div>
          <h1 id="form-heading">{draft.origin === 'user' && draft.title ? `Edit: ${draft.title}` : 'New recipe'}</h1>
          <p className="page-subtitle">
            Saved to this browser only. Seed recipes from the supplied CSV data stay untouched.
          </p>
        </div>
        <div className="page-header-actions">
          <RecipeOptionsMenu options={draft.options} onChange={patchOptions} label="Recipe options" />
        </div>
      </header>

      <section className="panel form-section" aria-labelledby="section-details">
        <h2 id="section-details">1 · Recipe details</h2>
        <div className="form-grid">
          <Field label="Recipe title" htmlFor="field-title" error={errors.title} className="span-2">
            <input
              id="field-title"
              className="input"
              type="text"
              value={draft.title}
              onChange={(event) => patch({ title: event.target.value })}
              placeholder="e.g. Miso butter noodles"
              aria-required="true"
            />
          </Field>
          <Field label="Short description" htmlFor="field-description" className="span-2">
            <textarea
              id="field-description"
              className="input"
              rows={2}
              value={draft.shortDescription}
              onChange={(event) => patch({ shortDescription: event.target.value })}
              placeholder="One or two lines shown on the recipe card"
            />
          </Field>
          <Field label="Source name" htmlFor="field-source-name">
            <input
              id="field-source-name"
              className="input"
              type="text"
              value={draft.sourceName}
              onChange={(event) => patch({ sourceName: event.target.value })}
              placeholder="Blog, book or kitchen"
            />
          </Field>
          <Field label="Source link" htmlFor="field-sourceUrl" error={errors.sourceUrl}>
            <input
              id="field-sourceUrl"
              className="input"
              type="url"
              value={draft.sourceUrl}
              onChange={(event) => patch({ sourceUrl: event.target.value })}
              placeholder="https://"
            />
          </Field>
          <Field label="Cuisine" htmlFor="field-cuisine">
            <select
              id="field-cuisine"
              className="input"
              value={draft.cuisineId}
              onChange={(event) => patch({ cuisineId: event.target.value })}
            >
              <option value="">Select a cuisine</option>
              {CUISINES.map((cuisine) => (
                <option key={cuisine.id} value={cuisine.id}>{cuisine.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Primary meal type" htmlFor="field-meal-type">
            <select
              id="field-meal-type"
              className="input"
              value={draft.mealTypeId}
              onChange={(event) => patch({ mealTypeId: event.target.value })}
            >
              <option value="">Select a meal type</option>
              {MEAL_TYPES.map((meal) => (
                <option key={meal.id} value={meal.id}>{meal.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Dietary suitability (multiple)" className="span-2">
            <ToggleList
              ariaLabel="Dietary suitability"
              options={DIETARY_TAGS}
              selected={draft.dietaryTagIds}
              onChange={(ids) => patch({ dietaryTagIds: ids })}
            />
          </Field>
          <Field label="Recipe categories (multiple)" className="span-2">
            <ToggleList
              ariaLabel="Recipe categories"
              options={RECIPE_CATEGORIES}
              selected={draft.categoryIds}
              onChange={(ids) => patch({ categoryIds: ids })}
            />
          </Field>
        </div>
      </section>

      <section className="panel form-section" aria-labelledby="section-timing">
        <h2 id="section-timing">2 · Timing and yield</h2>
        <div className="form-grid">
          <Field label="Servings" htmlFor="field-servings" error={errors.servings}>
            <NumberStepper
              id="field-servings"
              value={draft.servings}
              min={1}
              max={48}
              label="Servings"
              onChange={(value) => patch({ servings: value })}
            />
          </Field>
          <Field label="Prep time (minutes)" htmlFor="field-prep">
            <input
              id="field-prep"
              className="input"
              type="number"
              min={0}
              max={1440}
              value={draft.prepMinutes}
              onChange={(event) => patch({ prepMinutes: Number(event.target.value) || 0 })}
            />
          </Field>
          <Field label="Cook time (minutes)" htmlFor="field-cook">
            <input
              id="field-cook"
              className="input"
              type="number"
              min={0}
              max={1440}
              value={draft.cookMinutes}
              onChange={(event) => patch({ cookMinutes: Number(event.target.value) || 0 })}
            />
          </Field>
          <Field label="Total time (automatic)" htmlFor="field-total" hint={`${formatMinutes(computedTotal)}`}>
            <input id="field-total" className="input" type="text" readOnly value={formatMinutes(computedTotal)} />
          </Field>
          <Field
            label={`Spice level — ${SPICE_LEVELS.find((item) => item.value === Number(draft.spiceLevel))?.label || 'Not spicy'}`}
            htmlFor="field-spice"
            className="span-2"
          >
            <input
              id="field-spice"
              className="range"
              type="range"
              min={0}
              max={5}
              step={1}
              value={draft.spiceLevel}
              onChange={(event) => patch({ spiceLevel: Number(event.target.value) })}
              aria-valuetext={SPICE_LEVELS.find((item) => item.value === Number(draft.spiceLevel))?.label}
            />
            <div className="range-scale" aria-hidden="true">
              {SPICE_LEVELS.map((item) => (
                <span key={item.value}>{item.label}</span>
              ))}
            </div>
          </Field>
          <Field label="Difficulty (1 easy – 5 hard)" htmlFor="field-difficulty">
            <input
              id="field-difficulty"
              className="input"
              type="number"
              min={1}
              max={5}
              value={draft.difficulty}
              onChange={(event) => patch({ difficulty: Math.min(5, Math.max(1, Number(event.target.value) || 1)) })}
            />
          </Field>
        </div>
      </section>

      <section className="panel form-section" aria-labelledby="section-image">
        <h2 id="section-image">3 · Image and appearance</h2>
        <div className="form-grid image-grid">
          <Field
            label="Cover image upload (remote URL)"
            htmlFor="field-cover"
            error={errors.coverImageUrl}
            hint="Paste an approved remote image URL. Leave empty to use the placeholder image. Local image files are never stored."
            className="span-2"
          >
            <div className="image-input-row">
              <input
                id="field-cover"
                className="input"
                type="url"
                value={draft.coverImageUrl}
                onChange={(event) => {
                  setImageError(false)
                  patch({ coverImageUrl: event.target.value })
                }}
                placeholder="https://…"
              />
              <button type="button" className="button button-ghost button-small" onClick={() => {
                setImageError(false)
                patch({ coverImageUrl: PLACEHOLDER_IMAGE })
              }}>
                Use placeholder
              </button>
              {draft.coverImageUrl ? (
                <button type="button" className="button button-ghost button-small" onClick={() => patch({ coverImageUrl: '' })}>
                  Clear
                </button>
              ) : null}
            </div>
          </Field>
          <div className="image-preview">
            <img
              src={previewImage}
              alt="Cover image preview"
              onError={() => setImageError(true)}
            />
            <span className="image-preview-caption">
              <IconImage width={14} height={14} />
              {imageError && draft.coverImageUrl ? 'Image could not load — placeholder shown' : 'Card thumbnail preview'}
            </span>
          </div>
          <Field label="Recipe card accent colour" className="span-2">
            <div className="swatch-row" role="radiogroup" aria-label="Recipe card accent colour">
              {ACCENT_SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  role="radio"
                  aria-checked={draft.accentColor === color}
                  aria-label={`Accent colour ${color}`}
                  className={`swatch ${draft.accentColor === color ? 'is-selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => patch({ accentColor: color })}
                />
              ))}
            </div>
            <div className="color-custom">
              <label className="field-label" htmlFor="field-accent">Custom hex</label>
              <input
                id="field-accent"
                className="input input-small"
                type="text"
                value={draft.accentColor}
                onChange={(event) => patch({ accentColor: event.target.value })}
                placeholder="#D97757"
              />
              <input
                className="input input-color"
                type="color"
                aria-label="Pick a custom accent colour"
                value={/^#[0-9a-f]{6}$/i.test(draft.accentColor) ? draft.accentColor : '#D97757'}
                onChange={(event) => patch({ accentColor: event.target.value })}
              />
            </div>
          </Field>
        </div>
      </section>

      <section className="panel form-section" aria-labelledby="section-ingredients">
        <div className="section-heading-row">
          <h2 id="section-ingredients">4 · Ingredients</h2>
          {errors.ingredients ? <p className="field-error" role="alert">{errors.ingredients}</p> : null}
        </div>

        {draft.sections.map((section, sectionIndex) => (
          <div key={section.id} className="ingredient-block">
            <div className="ingredient-block-header">
              <label className="visually-hidden" htmlFor={`section-name-${section.id}`}>Ingredient section name</label>
              <input
                id={`section-name-${section.id}`}
                className="input section-name-input"
                type="text"
                list="section-presets"
                value={section.name}
                onChange={(event) => updateSection(section.id, { name: event.target.value })}
                placeholder="Section name (Main, Sauce, Garnish…)"
              />
              <div className="row-tools">
                <button
                  type="button"
                  className="icon-button icon-small"
                  aria-label={`Move section ${section.name} up`}
                  disabled={sectionIndex === 0}
                  onClick={() => moveSection(sectionIndex, -1)}
                >
                  <IconChevronUp width={15} height={15} />
                </button>
                <button
                  type="button"
                  className="icon-button icon-small"
                  aria-label={`Move section ${section.name} down`}
                  disabled={sectionIndex === draft.sections.length - 1}
                  onClick={() => moveSection(sectionIndex, 1)}
                >
                  <IconChevronDown width={15} height={15} />
                </button>
                <button
                  type="button"
                  className="icon-button icon-small"
                  aria-label={`Remove section ${section.name}`}
                  disabled={draft.sections.length === 1}
                  onClick={() => removeSection(section.id)}
                >
                  <IconTrash width={15} height={15} />
                </button>
              </div>
            </div>

            <datalist id="section-presets">
              {SECTION_PRESETS.map((preset) => (
                <option key={preset} value={preset} />
              ))}
            </datalist>

            <ul className="ingredient-editor" role="list">
              {section.items.map((item, itemIndex) => (
                <li key={item.id} className="ingredient-editor-row">
                  <div className="ingredient-cell ingredient-cell-name">
                    <label className="visually-hidden" htmlFor={`ing-${item.id}`}>Ingredient</label>
                    <IngredientCombobox
                      id={`ing-${item.id}`}
                      value={item.ingredientName}
                      placeholder="Search ingredient…"
                      onSelect={(option) =>
                        updateItem(section.id, item.id, { ingredientId: option.id, ingredientName: option.name })
                      }
                    />
                  </div>
                  <div className="ingredient-cell ingredient-cell-qty">
                    <label className="visually-hidden" htmlFor={`qty-${item.id}`}>Quantity</label>
                    <input
                      id={`qty-${item.id}`}
                      className="input"
                      type="number"
                      min={0}
                      step="0.25"
                      placeholder="Qty"
                      value={item.quantity == null ? '' : item.quantity}
                      onChange={(event) =>
                        updateItem(section.id, item.id, {
                          quantity: event.target.value === '' ? null : Number(event.target.value)
                        })
                      }
                    />
                  </div>
                  <div className="ingredient-cell ingredient-cell-unit">
                    <label className="visually-hidden" htmlFor={`unit-${item.id}`}>Unit</label>
                    <input
                      id={`unit-${item.id}`}
                      className="input"
                      type="text"
                      list="unit-presets"
                      placeholder="Unit"
                      value={item.unit}
                      onChange={(event) => updateItem(section.id, item.id, { unit: event.target.value })}
                    />
                  </div>
                  <div className="ingredient-cell ingredient-cell-notes">
                    <label className="visually-hidden" htmlFor={`notes-${item.id}`}>Preparation notes</label>
                    <input
                      id={`notes-${item.id}`}
                      className="input"
                      type="text"
                      placeholder="Notes (minced, drained…)"
                      value={item.notes}
                      onChange={(event) => updateItem(section.id, item.id, { notes: event.target.value })}
                    />
                  </div>
                  <label className="checkbox-inline ingredient-cell-optional" htmlFor={`optional-${item.id}`}>
                    <input
                      id={`optional-${item.id}`}
                      type="checkbox"
                      checked={Boolean(item.optional)}
                      onChange={(event) => updateItem(section.id, item.id, { optional: event.target.checked })}
                    />
                    <span>Optional</span>
                  </label>
                  <div className="row-tools">
                    <button
                      type="button"
                      className="icon-button icon-small"
                      aria-label={`Move ${item.ingredientName || 'ingredient'} up`}
                      disabled={itemIndex === 0}
                      onClick={() => moveItem(section.id, itemIndex, -1)}
                    >
                      <IconChevronUp width={15} height={15} />
                    </button>
                    <button
                      type="button"
                      className="icon-button icon-small"
                      aria-label={`Move ${item.ingredientName || 'ingredient'} down`}
                      disabled={itemIndex === section.items.length - 1}
                      onClick={() => moveItem(section.id, itemIndex, 1)}
                    >
                      <IconChevronDown width={15} height={15} />
                    </button>
                    <button
                      type="button"
                      className="icon-button icon-small"
                      aria-label={`Remove ${item.ingredientName || 'ingredient'}`}
                      onClick={() => removeItem(section.id, item.id)}
                    >
                      <IconTrash width={15} height={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <datalist id="unit-presets">
              {UNIT_NAMES.map((unit) => (
                <option key={unit} value={unit} />
              ))}
            </datalist>

            <button type="button" className="button button-ghost button-small" onClick={() => addItem(section.id)}>
              <IconPlus width={15} height={15} /> Add another ingredient
            </button>
          </div>
        ))}

        <div className="add-section-row">
          <button type="button" className="button button-secondary" onClick={() => addSection('Sauce')}>
            <IconPlus width={15} height={15} /> Add ingredient section
          </button>
          <div className="preset-row" role="group" aria-label="Quick section presets">
            {SECTION_PRESETS.map((preset) => (
              <button key={preset} type="button" className="chip-toggle" onClick={() => addSection(preset)}>
                <span>+ {preset}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="field-hint">
          {INGREDIENTS.length} ingredients from the supplied data are searchable; typing a new name adds a custom
          ingredient to the “Other” shopping category.
        </p>
      </section>

      <section className="panel form-section" aria-labelledby="section-method">
        <div className="section-heading-row">
          <h2 id="section-method">5 · Method</h2>
          {errors.steps ? <p className="field-error" role="alert">{errors.steps}</p> : null}
        </div>
        <ol className="step-editor" role="list">
          {draft.steps.map((step, index) => (
            <li key={step.id} className="step-editor-row">
              <span className="step-number" aria-hidden="true">{index + 1}</span>
              <div className="step-editor-fields">
                <label className="visually-hidden" htmlFor={`step-${step.id}`}>Step {index + 1} instruction</label>
                <textarea
                  id={`step-${step.id}`}
                  className="input"
                  rows={2}
                  placeholder="Describe this step…"
                  value={step.instruction}
                  onChange={(event) => updateStep(step.id, { instruction: event.target.value })}
                />
                <div className="step-timer-field">
                  <label className="field-label" htmlFor={`timer-${step.id}`}>Timer (minutes, optional)</label>
                  <input
                    id={`timer-${step.id}`}
                    className="input input-small"
                    type="number"
                    min={0}
                    max={600}
                    value={step.timerMinutes}
                    onChange={(event) => updateStep(step.id, { timerMinutes: Number(event.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="row-tools">
                <button
                  type="button"
                  className="icon-button icon-small"
                  aria-label={`Move step ${index + 1} up`}
                  disabled={index === 0}
                  onClick={() => moveStep(index, -1)}
                >
                  <IconChevronUp width={15} height={15} />
                </button>
                <button
                  type="button"
                  className="icon-button icon-small"
                  aria-label={`Move step ${index + 1} down`}
                  disabled={index === draft.steps.length - 1}
                  onClick={() => moveStep(index, 1)}
                >
                  <IconChevronDown width={15} height={15} />
                </button>
                <button
                  type="button"
                  className="icon-button icon-small"
                  aria-label={`Remove step ${index + 1}`}
                  onClick={() => removeStep(step.id)}
                >
                  <IconTrash width={15} height={15} />
                </button>
              </div>
            </li>
          ))}
        </ol>
        <button type="button" className="button button-secondary" onClick={() => setDraft((current) => ({ ...current, steps: [...current.steps, emptyStep()] }))}>
          <IconPlus width={15} height={15} /> Add another step
        </button>
      </section>

      <section className="panel form-section" aria-labelledby="section-planning">
        <h2 id="section-planning">6 · Meal planning options</h2>
        <div className="planning-block">
          <Switch
            id="plan-suggestions"
            checked={Boolean(draft.includeInMealSuggestions)}
            onChange={(next) => patch({ includeInMealSuggestions: next })}
            label="Available in meal-plan suggestions"
            description="Show this recipe first when picking meals in the planner"
          />
          <Switch
            id="plan-add-now"
            checked={planEnabled}
            onChange={setPlanEnabled}
            label="Add this recipe to the meal plan after saving"
            description="Choose the planning week, cooking date, slot and serving time"
          />

          {planEnabled ? (
            <div className="planning-details">
              <div className="week-picker">
                <button type="button" className="icon-button" aria-label="Previous planning week" onClick={() => setWeekStart(shiftWeek(weekStart, -1))}>
                  ‹
                </button>
                <div className="week-picker-label">
                  <span className="week-picker-title">{formatWeekRange(weekStart)}</span>
                  <span className="week-picker-hint">Planning week</span>
                </div>
                <button type="button" className="icon-button" aria-label="Next planning week" onClick={() => setWeekStart(shiftWeek(weekStart, 1))}>
                  ›
                </button>
                <button type="button" className="button button-ghost button-small" onClick={() => {
                  setWeekStart(currentWeekStartIso())
                  setPlanDate(currentWeekStartIso())
                }}>
                  This week
                </button>
              </div>

              <div className="day-choice-row" role="radiogroup" aria-label="Planned cooking date">
                {dates.map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    role="radio"
                    aria-checked={day === planDate}
                    className={`day-choice ${day === planDate ? 'is-selected' : ''}`}
                    onClick={() => setPlanDate(day)}
                  >
                    <span className="day-choice-name">{DAY_SHORT[index]}</span>
                    <span className="day-choice-date">{formatDayLabel(day)}</span>
                  </button>
                ))}
              </div>

              <div className="field-row">
                <Field label="Planned cooking date" htmlFor="plan-date-input">
                  <input
                    id="plan-date-input"
                    className="input"
                    type="date"
                    value={planDate}
                    onChange={(event) => {
                      const next = event.target.value
                      setPlanDate(next)
                      if (next) {
                        const parsed = fromIsoDate(next)
                        setWeekStart(toIsoDate(new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate() - ((parsed.getDay() + 6) % 7))))
                      }
                    }}
                  />
                </Field>
                <Field label="Meal slot" htmlFor="plan-slot-input">
                  <select id="plan-slot-input" className="input" value={planSlot} onChange={(event) => setPlanSlot(event.target.value)}>
                    {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Planned serving time" htmlFor="plan-time-input">
                  <input
                    id="plan-time-input"
                    className="input"
                    type="time"
                    value={planTime}
                    onChange={(event) => setPlanTime(event.target.value)}
                  />
                </Field>
              </div>
              <p className="field-hint">
                Planning for {planDate ? formatDayLabel(planDate) : '—'} at {planTime || '—'} ({planSlot}). The shopping
                list updates as soon as the recipe is saved.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="panel form-section" aria-labelledby="section-options">
        <h2 id="section-options">7 · Recipe options</h2>
        <div className="options-inline">
          <div className="options-inline-toggles">
            <Switch
              id="opt-shopping"
              checked={Boolean(draft.options.includeInShoppingList)}
              onChange={(next) => patchOptions({ includeInShoppingList: next })}
              label="Include ingredients in generated shopping lists"
            />
            <Switch
              id="opt-nutrition"
              checked={Boolean(draft.options.showNutrition)}
              onChange={(next) => patchOptions({ showNutrition: next })}
              label="Show nutrition information"
            />
            <Switch
              id="opt-substitutions"
              checked={Boolean(draft.options.allowSubstitutions)}
              onChange={(next) => patchOptions({ allowSubstitutions: next })}
              label="Allow ingredient substitutions"
            />
          </div>
          <fieldset className="fieldset options-inline-radio">
            <legend className="fieldset-legend">Measurements (choose one)</legend>
            {MEASUREMENT_SYSTEMS.map((system) => (
              <label key={system.id} className={`radio-card ${draft.options.measurementSystem === system.id ? 'is-selected' : ''}`}>
                <input
                  type="radio"
                  name="measurement-system"
                  value={system.id}
                  checked={draft.options.measurementSystem === system.id}
                  onChange={() => patchOptions({ measurementSystem: system.id })}
                />
                <span>{system.label}</span>
              </label>
            ))}
          </fieldset>
        </div>
        <p className="field-hint">
          The same options are available from the compact Recipe options menu in the header and on every recipe page.
        </p>
      </section>

      <footer className="form-footer">
        {onDelete && draft.origin === 'user' ? (
          <button type="button" className="button button-danger" onClick={() => onDelete(draft)}>
            <IconTrash width={15} height={15} /> Delete recipe
          </button>
        ) : null}
        <span className="form-footer-spacer" />
        <button type="button" className="button button-ghost" onClick={onCancel}>Cancel</button>
        <button type="button" className="button button-primary" onClick={handleSubmit}>
          {draft.origin === 'user' && draft.title ? 'Save changes' : 'Add recipe'}
        </button>
      </footer>
    </form>
  )
}
