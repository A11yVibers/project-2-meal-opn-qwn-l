import { useMemo, useState } from 'react'
import { SHOPPING_CATEGORIES } from '../data/catalog.js'
import { buildShoppingList, displayItemAmount } from '../lib/shopping.js'
import { formatQuantity, MEASUREMENT_SYSTEMS } from '../lib/measure.js'
import { formatDayLabel, formatWeekRange, weekDates } from '../lib/dates.js'
import { IconCart, IconCheck, IconChevronDown } from './Icons.jsx'
import { SegmentedControl, Switch } from './ui.jsx'

export default function ShoppingList({
  assignments,
  recipesById,
  weekStart,
  checked,
  pantry,
  settings,
  onToggleChecked,
  onCheckAll,
  onClearChecked,
  onTogglePantry,
  onSettingChange,
  onOpenPlanner,
  onOpenRecipe
}) {
  const [collapsed, setCollapsed] = useState({})
  const [showHeld, setShowHeld] = useState(false)

  const list = useMemo(
    () =>
      buildShoppingList({
        assignments,
        recipesById,
        weekStartIso: weekStart,
        pantry,
        excludePantry: Boolean(settings.excludePantryItems),
        categories: SHOPPING_CATEGORIES
      }),
    [assignments, recipesById, weekStart, pantry, settings.excludePantryItems]
  )

  const system = settings.measurementSystem === 'metric' ? 'metric' : 'us'
  const totalItems = list.items.length
  const checkedItems = list.items.filter((item) => checked[item.id]).length
  const progress = totalItems ? Math.round((checkedItems / totalItems) * 100) : 0
  const plannedRecipes = useMemo(() => {
    const dates = new Set(weekDates(weekStart))
    const ids = new Set(
      assignments.filter((assignment) => dates.has(assignment.date)).map((assignment) => assignment.recipeId)
    )
    return Array.from(ids)
      .map((id) => recipesById[id])
      .filter(Boolean)
  }, [assignments, recipesById, weekStart])

  return (
    <section className="shopping" aria-labelledby="shopping-heading">
      <header className="page-header">
        <div>
          <h1 id="shopping-heading">Shopping list</h1>
          <p className="page-subtitle">
            {formatWeekRange(weekStart)} · generated from {plannedRecipes.length} planned recipe
            {plannedRecipes.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="button button-ghost" onClick={onOpenPlanner}>
            Open planner
          </button>
          {totalItems > 0 ? (
            <button type="button" className="button button-secondary" onClick={onCheckAll}>
              <IconCheck width={15} height={15} /> Check all
            </button>
          ) : null}
        </div>
      </header>

      {plannedRecipes.length > 0 ? (
        <ul className="source-recipes" aria-label="Recipes in this week's plan">
          {plannedRecipes.map((recipe) => (
            <li key={recipe.id}>
              <button
                type="button"
                className="source-recipe"
                style={{ '--accent': recipe.accentColor }}
                onClick={() => onOpenRecipe(recipe.id)}
              >
                {recipe.title}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="shopping-controls">
        <div className="control-block">
          <span className="control-label" id="shopping-units-label">Measurements</span>
          <SegmentedControl
            ariaLabel="Measurement system"
            options={MEASUREMENT_SYSTEMS.map((item) => ({ id: item.id, label: item.label }))}
            value={system}
            onChange={(next) => onSettingChange({ measurementSystem: next })}
          />
        </div>
        <div className="control-block">
          <Switch
            id="exclude-pantry"
            checked={Boolean(settings.excludePantryItems)}
            onChange={(next) => onSettingChange({ excludePantryItems: next })}
            label="Exclude pantry items"
            description="Hide ingredients you already have at home"
          />
        </div>
        <div className="control-block">
          <Switch
            id="hide-optional"
            checked={Boolean(settings.hideOptionalItems)}
            onChange={(next) => onSettingChange({ hideOptionalItems: next })}
            label="Hide optional ingredients"
            description="Skip items marked optional in recipes"
          />
        </div>
        {checkedItems > 0 ? (
          <button type="button" className="button button-ghost button-small" onClick={onClearChecked}>
            Uncheck all
          </button>
        ) : null}
      </div>

      {totalItems > 0 ? (
        <div className="progress-block">
          <div
            className="progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Shopping progress"
          >
            <span className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-text">
            {checkedItems} of {totalItems} items collected
          </span>
        </div>
      ) : null}

      {totalItems === 0 ? (
        <div className="empty-state">
          <IconCart width={28} height={28} />
          <p>
            {plannedRecipes.length === 0
              ? 'Nothing is planned for this week yet. Add recipes to the planner and the list builds itself.'
              : 'Every planned recipe has shopping-list ingredients turned off, or everything is already in your pantry.'}
          </p>
          <div className="empty-actions">
            <button type="button" className="button button-primary" onClick={onOpenPlanner}>
              Go to the planner
            </button>
          </div>
        </div>
      ) : (
        <div className="shopping-groups">
          {list.groups.map((group) => {
            const items = group.items.filter((item) => (settings.hideOptionalItems ? !item.optional : true))
            if (items.length === 0) return null
            const isCollapsed = Boolean(collapsed[group.category])
            const done = items.filter((item) => checked[item.id]).length
            const slug = group.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')
            return (
              <section key={group.category} className="shopping-group" aria-labelledby={`group-${slug}`}>
                <h2 className="shopping-group-header">
                  <button
                    type="button"
                    className="group-toggle"
                    aria-expanded={!isCollapsed}
                    aria-controls={`group-panel-${slug}`}
                    onClick={() => setCollapsed((current) => ({ ...current, [group.category]: !current[group.category] }))}
                  >
                    <span className="group-caret" aria-hidden="true">
                      <IconChevronDown width={16} height={16} />
                    </span>
                    <span id={`group-${slug}`} className="group-name">{group.category}</span>
                    <span className="group-count">
                      {done}/{items.length}
                    </span>
                  </button>
                </h2>
                {!isCollapsed ? (
                  <ul className="shopping-items" id={`group-panel-${slug}`} role="list">
                    {items.map((item) => {
                      const amount = displayItemAmount(item, system)
                      const isChecked = Boolean(checked[item.id])
                      return (
                        <li key={item.id} className={`shopping-item ${isChecked ? 'is-checked' : ''}`}>
                          <label className="shopping-item-main" htmlFor={`check-${item.id}`}>
                            <input
                              id={`check-${item.id}`}
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => onToggleChecked(item.id)}
                            />
                            <span className="shopping-item-check" aria-hidden="true">
                              {isChecked ? <IconCheck width={13} height={13} /> : null}
                            </span>
                            <span className="shopping-item-text">
                              <span className="shopping-item-name">
                                {item.name}
                                {item.optional ? <span className="pill pill-optional">optional</span> : null}
                              </span>
                              {item.notes ? <span className="shopping-item-notes">{item.notes}</span> : null}
                              <span className="shopping-item-recipes">
                                {item.recipes.map((title, index) => (
                                  <span key={`${title}-${index}`} className="mini-tag">{title}</span>
                                ))}
                              </span>
                            </span>
                            <span className="shopping-item-amount">
                              {amount ? `${formatQuantity(amount.quantity)} ${amount.unit || ''}`.trim() : ''}
                            </span>
                          </label>
                          <button
                            type="button"
                            className={`pantry-button ${item.inPantry ? 'is-on' : ''}`}
                            aria-pressed={item.inPantry}
                            title={item.inPantry ? 'Remove from pantry' : 'Mark as already in pantry'}
                            onClick={() => onTogglePantry(item.key)}
                          >
                            {item.inPantry ? 'In pantry' : 'Have it'}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
              </section>
            )
          })}
        </div>
      )}

      {list.held.length > 0 ? (
        <section className="shopping-held">
          <button
            type="button"
            className="group-toggle"
            aria-expanded={showHeld}
            onClick={() => setShowHeld((current) => !current)}
          >
            <span className="group-caret" aria-hidden="true">
              <IconChevronDown width={16} height={16} />
            </span>
            <span className="group-name">Already in your pantry ({list.held.length})</span>
          </button>
          {showHeld ? (
            <ul className="held-list" role="list">
              {list.held.map((item) => (
                <li key={item.id}>
                  <span>{item.name}</span>
                  <button type="button" className="link-button" onClick={() => onTogglePantry(item.key)}>
                    Put back on list
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {list.skipped.length > 0 ? (
        <p className="skipped-note">
          {list.skipped.map((entry) => entry.title).join(', ')} excluded — shopping list turned off in recipe options.
        </p>
      ) : null}

      {totalItems > 0 ? (
        <p className="shopping-updated">
          List covers {formatDayLabel(weekDates(weekStart)[0])} – {formatDayLabel(weekDates(weekStart)[6])} and updates
          automatically when the plan changes.
        </p>
      ) : null}
    </section>
  )
}
