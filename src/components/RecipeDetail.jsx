import { useMemo, useState } from 'react'
import {
  SPICE_LEVELS,
  categoryNames,
  cuisineName,
  dietaryTagNames,
  mealTypeName
} from '../data/catalog.js'
import { formatAmount, formatMinutes, totalMinutes } from '../lib/measure.js'
import { allIngredients, ingredientCount, recipeImage, scaleItem } from '../lib/recipes.js'
import { formatDayLabel, formatTime } from '../lib/dates.js'
import { IconClock, IconEdit, IconFlame, IconLink, IconTimer, IconTrash, IconUsers } from './Icons.jsx'
import { NumberStepper } from './ui.jsx'
import RecipeOptionsMenu from './RecipeOptionsMenu.jsx'
import { RecipeThumb } from './RecipeCatalog.jsx'

function NutritionPanel({ recipe, scale, system }) {
  const ingredients = allIngredients(recipe).filter((item) => String(item.ingredientName || '').trim())
  return (
    <section className="panel nutrition-panel" aria-labelledby="nutrition-heading">
      <h2 id="nutrition-heading">Nutrition information</h2>
      <p className="panel-note">
        The supplied recipe dataset does not include nutrient values, so this panel scales the recipe amounts per
        serving instead. Add your own values in the recipe form if you track them.
      </p>
      <dl className="nutrition-grid">
        <div>
          <dt>Servings shown</dt>
          <dd>{Math.max(1, Math.round(recipe.servings * scale))}</dd>
        </div>
        <div>
          <dt>Per serving</dt>
          <dd>{ingredients.length} ingredients</dd>
        </div>
        <div>
          <dt>Total time</dt>
          <dd>{formatMinutes(recipe.totalMinutes || totalMinutes(recipe))}</dd>
        </div>
      </dl>
      <ul className="nutrition-list" role="list">
        {ingredients.slice(0, 12).map((item) => (
          <li key={item.id}>
            <span>{item.ingredientName}</span>
            <span>
              {item.quantity == null
                ? 'to taste'
                : formatAmount(scaleItem(item, scale) / Math.max(1, recipe.servings * scale), item.unit, system)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function RecipeDetail({
  recipe,
  assignments,
  onBack,
  onEdit,
  onDelete,
  onAddToPlan,
  onOpenPlanDate,
  onOptionsChange,
  defaultSystem
}) {
  const [servings, setServings] = useState(recipe.servings)
  const system = recipe.options?.measurementSystem || defaultSystem || 'us'
  const scale = Number(recipe.servings) > 0 ? servings / recipe.servings : 1

  const planned = useMemo(
    () =>
      assignments
        .filter((assignment) => assignment.recipeId === recipe.id)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [assignments, recipe.id]
  )

  const spiceLabel = SPICE_LEVELS.find((item) => item.value === Number(recipe.spiceLevel))?.label || 'Not spicy'
  const total = recipe.totalMinutes || totalMinutes(recipe)
  const ingredients = ingredientCount(recipe)

  return (
    <section className="detail" aria-labelledby="detail-heading" style={{ '--accent': recipe.accentColor }}>
      <div className="detail-topbar">
        <button type="button" className="button button-ghost button-small" onClick={onBack}>
          ← Back to catalog
        </button>
        <div className="detail-actions">
          {recipe.origin === 'user' ? (
            <>
              <button type="button" className="button button-secondary button-small" onClick={() => onEdit(recipe)}>
                <IconEdit width={15} height={15} /> Edit
              </button>
              <button type="button" className="button button-danger button-small" onClick={() => onDelete(recipe)}>
                <IconTrash width={15} height={15} /> Delete
              </button>
            </>
          ) : (
            <span className="pill pill-seed">Seed recipe</span>
          )}
          <RecipeOptionsMenu options={recipe.options} onChange={onOptionsChange} />
        </div>
      </div>

      <header className="detail-hero">
        <div className="detail-hero-media">
          <img className="hero-image" src={recipeImage(recipe)} alt={`Photo of ${recipe.title}`} loading="lazy" />
        </div>
        <div className="detail-hero-body">
          <p className="detail-eyebrow">
            {[cuisineName(recipe.cuisineId), mealTypeName(recipe.mealTypeId)].filter(Boolean).join(' · ') || 'Recipe'}
            {recipe.origin === 'user' ? ' · Yours' : ''}
          </p>
          <h1 id="detail-heading">{recipe.title}</h1>
          {recipe.shortDescription ? <p className="detail-description">{recipe.shortDescription}</p> : null}

          <ul className="detail-meta" role="list">
            <li>
              <IconClock width={15} height={15} />
              <span>
                <span className="meta-label">Total</span>
                <span className="meta-value">{formatMinutes(total)}</span>
              </span>
            </li>
            <li>
              <IconTimer width={15} height={15} />
              <span>
                <span className="meta-label">Prep / cook</span>
                <span className="meta-value">
                  {formatMinutes(recipe.prepMinutes)} / {formatMinutes(recipe.cookMinutes)}
                </span>
              </span>
            </li>
            <li>
              <IconUsers width={15} height={15} />
              <span>
                <span className="meta-label">Servings</span>
                <span className="meta-value">{recipe.servings}</span>
              </span>
            </li>
            <li>
              <IconFlame width={15} height={15} />
              <span>
                <span className="meta-label">Spice</span>
                <span className="meta-value">{spiceLabel}</span>
              </span>
            </li>
          </ul>

          {recipe.dietaryTagIds?.length ? (
            <div className="chip-row" aria-label="Dietary suitability">
              {dietaryTagNames(recipe.dietaryTagIds).map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          ) : null}
          {recipe.categoryIds?.length ? (
            <div className="chip-row" aria-label="Recipe categories">
              {categoryNames(recipe.categoryIds).map((name) => (
                <span key={name} className="tag tag-outline">{name}</span>
              ))}
            </div>
          ) : null}

          <div className="detail-cta">
            <button type="button" className="button button-primary" onClick={() => onAddToPlan(recipe)}>
              Add to meal plan
            </button>
            {recipe.sourceUrl ? (
              <a className="button button-secondary" href={recipe.sourceUrl} target="_blank" rel="noreferrer noopener">
                <IconLink width={15} height={15} /> {recipe.sourceName || 'Source'}
              </a>
            ) : null}
            <span className="detail-cta-note">
              {recipe.includeInMealSuggestions ? 'Available in meal-plan suggestions' : 'Hidden from suggestions'}
            </span>
          </div>
        </div>
      </header>

      {planned.length > 0 ? (
        <section className="panel planned-panel" aria-labelledby="planned-heading">
          <h2 id="planned-heading">In your meal plan</h2>
          <ul className="planned-list" role="list">
            {planned.map((assignment) => (
              <li key={assignment.id || `${assignment.date}-${assignment.slot}`}>
                <button type="button" className="planned-item" onClick={() => onOpenPlanDate(assignment.date)}>
                  <span className="planned-date">{formatDayLabel(assignment.date)}</span>
                  <span className="planned-slot">{assignment.slot}</span>
                  <span className="planned-extra">
                    {assignment.servings ? `${assignment.servings} servings` : ''}
                    {assignment.time ? ` · ${formatTime(assignment.time)}` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="detail-columns">
        <div className="detail-main">
          <section className="panel" aria-labelledby="ingredients-heading">
            <div className="panel-header">
              <h2 id="ingredients-heading">Ingredients</h2>
              <div className="servings-control">
                <label className="field-label" htmlFor="detail-servings">Servings</label>
                <NumberStepper
                  id="detail-servings"
                  value={servings}
                  min={1}
                  max={48}
                  label="Servings"
                  onChange={(next) => setServings(Number(next) || 1)}
                />
                {scale !== 1 ? (
                  <button type="button" className="link-button" onClick={() => setServings(recipe.servings)}>
                    Reset
                  </button>
                ) : null}
              </div>
            </div>
            <p className="panel-note">
              {ingredients} ingredients · shown in {system === 'metric' ? 'metric' : 'US customary'} units
              {scale !== 1 ? ` · scaled ×${Math.round(scale * 100) / 100}` : ''}
            </p>
            {recipe.sections.map((section) => (
              <div key={section.id} className="ingredient-section">
                <h3 className="ingredient-section-title">{section.name}</h3>
                <ul className="ingredient-list" role="list">
                  {section.items
                    .filter((item) => String(item.ingredientName || '').trim())
                    .map((item) => (
                      <li key={item.id} className={`ingredient-row ${item.optional ? 'is-optional' : ''}`}>
                        <span className="ingredient-amount">
                          {item.quantity == null ? '' : formatAmount(scaleItem(item, scale), item.unit, system)}
                        </span>
                        <span className="ingredient-name">
                          {item.ingredientName}
                          {item.optional ? <span className="pill pill-optional">optional</span> : null}
                        </span>
                        {item.notes ? <span className="ingredient-notes">{item.notes}</span> : null}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
            {recipe.options?.allowSubstitutions ? (
              <p className="panel-note substitutions">
                Substitutions allowed: optional ingredients can be swapped or left out without changing the method.
              </p>
            ) : null}
          </section>

          <section className="panel" aria-labelledby="method-heading">
            <h2 id="method-heading">Method</h2>
            <ol className="steps" role="list">
              {recipe.steps.map((step, index) => (
                <li key={step.id} className="step">
                  <span className="step-number">{index + 1}</span>
                  <div className="step-body">
                    <p className="step-instruction">{step.instruction}</p>
                    {Number(step.timerMinutes) > 0 ? (
                      <span className="step-timer">
                        <IconTimer width={14} height={14} /> {formatMinutes(step.timerMinutes)}
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {recipe.options?.showNutrition ? (
            <NutritionPanel recipe={recipe} scale={scale} system={system} />
          ) : null}
        </div>

        <aside className="detail-side">
          <section className="panel side-panel" aria-labelledby="at-a-glance">
            <h2 id="at-a-glance">At a glance</h2>
            <dl className="side-list">
              <div>
                <dt>Cuisine</dt>
                <dd>{cuisineName(recipe.cuisineId) || '—'}</dd>
              </div>
              <div>
                <dt>Meal type</dt>
                <dd>{mealTypeName(recipe.mealTypeId) || '—'}</dd>
              </div>
              <div>
                <dt>Difficulty</dt>
                <dd>{recipe.difficulty} / 5</dd>
              </div>
              <div>
                <dt>Spice level</dt>
                <dd>{spiceLabel} ({recipe.spiceLevel}/5)</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>
                  {recipe.sourceUrl ? (
                    <a href={recipe.sourceUrl} target="_blank" rel="noreferrer noopener">
                      {recipe.sourceName || recipe.sourceUrl}
                    </a>
                  ) : (
                    recipe.sourceName || '—'
                  )}
                </dd>
              </div>
              <div>
                <dt>Accent colour</dt>
                <dd className="accent-preview">
                  <span className="swatch-preview" style={{ background: recipe.accentColor }} aria-hidden="true" />
                  {recipe.accentColor}
                </dd>
              </div>
            </dl>
          </section>

          <section className="panel side-panel" aria-labelledby="options-summary">
            <h2 id="options-summary">Recipe options</h2>
            <ul className="option-summary" role="list">
              <li className={recipe.options?.includeInShoppingList ? 'is-on' : ''}>
                Shopping list ingredients {recipe.options?.includeInShoppingList ? 'included' : 'excluded'}
              </li>
              <li className={recipe.options?.showNutrition ? 'is-on' : ''}>
                Nutrition panel {recipe.options?.showNutrition ? 'visible' : 'hidden'}
              </li>
              <li className={recipe.options?.allowSubstitutions ? 'is-on' : ''}>
                Substitutions {recipe.options?.allowSubstitutions ? 'allowed' : 'not allowed'}
              </li>
              <li className="is-on">
                {recipe.options?.measurementSystem === 'metric' ? 'Metric' : 'US customary'} measurements
              </li>
            </ul>
            <p className="panel-note">Use the Recipe options menu above to change these.</p>
          </section>

          <section className="panel side-panel" aria-labelledby="similar-heading">
            <h2 id="similar-heading">Plan tip</h2>
            <p className="panel-note">
              Planned {planned.length} time{planned.length === 1 ? '' : 's'} in saved weeks. Shopping list items are
              recalculated every time the plan changes.
            </p>
          </section>
        </aside>
      </div>
    </section>
  )
}
