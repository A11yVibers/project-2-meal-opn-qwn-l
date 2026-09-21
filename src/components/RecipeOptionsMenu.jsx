import { useEffect, useRef, useState } from 'react'
import { MEASUREMENT_SYSTEMS } from '../lib/measure.js'
import { IconCheck, IconSettings } from './Icons.jsx'

const TOGGLES = [
  {
    key: 'includeInShoppingList',
    label: 'Include ingredients in shopping lists',
    description: 'Planned meals add these items to the list'
  },
  {
    key: 'showNutrition',
    label: 'Show nutrition information',
    description: 'Display the per-serving nutrition panel'
  },
  {
    key: 'allowSubstitutions',
    label: 'Allow ingredient substitutions',
    description: 'Suggest swaps for missing ingredients'
  }
]

export default function RecipeOptionsMenu({ options, onChange, onSystemChange, label = 'Recipe options' }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function onPointerDown(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false)
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const setToggle = (key, next) => onChange({ ...options, [key]: next })
  const setSystem = (system) => {
    onChange({ ...options, measurementSystem: system })
    if (onSystemChange) onSystemChange(system)
  }

  return (
    <div className="options-menu" ref={wrapperRef}>
      <button
        type="button"
        ref={buttonRef}
        className="button button-secondary options-menu-trigger"
        aria-expanded={open}
        aria-controls="recipe-options-panel"
        id="recipe-options-trigger"
        onClick={() => setOpen((current) => !current)}
      >
        <IconSettings />
        <span>{label}</span>
      </button>
      {open ? (
        <div className="options-menu-panel" id="recipe-options-panel" role="group" aria-label={label}>
          <p className="options-menu-heading">Independently toggleable</p>
          {TOGGLES.map((toggle) => {
            const checked = Boolean(options[toggle.key])
            return (
              <button
                key={toggle.key}
                type="button"
                aria-pressed={checked}
                className={`options-menu-item ${checked ? 'is-selected' : ''}`}
                onClick={() => setToggle(toggle.key, !checked)}
              >
                <span className={`options-menu-check ${checked ? 'is-on' : ''}`} aria-hidden="true">
                  {checked ? <IconCheck width={13} height={13} /> : null}
                </span>
                <span className="options-menu-text">
                  <span className="options-menu-label">{toggle.label}</span>
                  <span className="options-menu-description">{toggle.description}</span>
                </span>
              </button>
            )
          })}

          <p className="options-menu-heading">Measurements (choose one)</p>
          <div className="options-menu-radio-group" role="radiogroup" aria-label="Measurement system">
            {MEASUREMENT_SYSTEMS.map((system) => {
              const selected = (options.measurementSystem || 'us') === system.id
              return (
                <button
                  key={system.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected ? 0 : -1}
                  className={`options-menu-radio ${selected ? 'is-selected' : ''}`}
                  onClick={() => setSystem(system.id)}
                >
                  <span className="radio-dot" aria-hidden="true">
                    {selected ? <span /> : null}
                  </span>
                  {system.label}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
