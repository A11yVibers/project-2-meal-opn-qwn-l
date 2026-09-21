import { useEffect, useId, useRef } from 'react'
import { IconCheck, IconClose, IconMinus, IconPlus } from './Icons.jsx'

export function Modal({ open, title, description, onClose, children, footer, size = 'md' }) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef(null)
  const restoreRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    restoreRef.current = document.activeElement
    const timer = window.setTimeout(() => {
      const panel = panelRef.current
      if (!panel) return
      const focusable = panel.querySelector(
        'input:not([type="hidden"]), select, textarea, button, [href], [tabindex]:not([tabindex="-1"])'
      )
      ;(focusable || panel).focus()
    }, 20)

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusables = Array.from(
        panelRef.current.querySelectorAll(
          'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null)
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      if (restoreRef.current && typeof restoreRef.current.focus === 'function') {
        restoreRef.current.focus()
      }
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        className={`modal-panel modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        ref={panelRef}
        tabIndex={-1}
      >
        <header className="modal-header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description ? <p id={descriptionId} className="modal-description">{description}</p> : null}
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog">
            <IconClose />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer ? <footer className="modal-footer">{footer}</footer> : null}
      </div>
    </div>
  )
}

export function Field({ label, hint, error, htmlFor, children, className = '' }) {
  return (
    <div className={`field ${className}`}>
      {label ? (
        <label className="field-label" htmlFor={htmlFor}>
          {label}
        </label>
      ) : null}
      {children}
      {hint && !error ? <p className="field-hint">{hint}</p> : null}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function NumberStepper({ value, onChange, min = 0, max = 999, step = 1, label, id }) {
  const commit = (next) => {
    const clamped = Math.min(max, Math.max(min, next))
    onChange(Number.isFinite(clamped) ? clamped : min)
  }
  return (
    <div className="stepper">
      <button
        type="button"
        className="icon-button stepper-button"
        onClick={() => commit((Number(value) || 0) - step)}
        disabled={(Number(value) || 0) <= min}
        aria-label={`Decrease ${label || 'value'}`}
      >
        <IconMinus />
      </button>
      <input
        id={id}
        className="input stepper-input"
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(Number(value)) ? Number(value) : ''}
        onChange={(event) => {
          const next = Number.parseFloat(event.target.value)
          onChange(Number.isFinite(next) ? next : '')
        }}
        onBlur={(event) => commit(Number.parseFloat(event.target.value) || min)}
        aria-label={label}
      />
      <button
        type="button"
        className="icon-button stepper-button"
        onClick={() => commit((Number(value) || 0) + step)}
        disabled={(Number(value) || 0) >= max}
        aria-label={`Increase ${label || 'value'}`}
      >
        <IconPlus />
      </button>
    </div>
  )
}

export function ToggleChip({ selected, onSelect, children, title }) {
  return (
    <button
      type="button"
      className={`chip-toggle ${selected ? 'is-selected' : ''}`}
      aria-pressed={selected}
      title={title}
      onClick={onSelect}
    >
      {selected ? <IconCheck width={14} height={14} /> : null}
      <span>{children}</span>
    </button>
  )
}

export function ToggleList({ options, selected = [], onChange, ariaLabel }) {
  const toggle = (id) => {
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id])
  }
  return (
    <div className="chip-row" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <ToggleChip key={option.id} selected={selected.includes(option.id)} onSelect={() => toggle(option.id)}>
          {option.name}
        </ToggleChip>
      ))}
    </div>
  )
}

export function Switch({ checked, onChange, label, description, id }) {
  return (
    <label className="switch" htmlFor={id}>
      <span className="switch-track">
        <input
          id={id}
          type="checkbox"
          className="switch-input"
          checked={Boolean(checked)}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="switch-thumb" aria-hidden="true" />
      </span>
      <span className="switch-text">
        <span className="switch-label">{label}</span>
        {description ? <span className="switch-description">{description}</span> : null}
      </span>
    </label>
  )
}

export function SegmentedControl({ options, value, onChange, ariaLabel }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={value === option.id}
          className={`segment ${value === option.id ? 'is-selected' : ''}`}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function MetaItem({ icon, children, label }) {
  return (
    <div className="meta-item">
      {icon}
      <span>
        {label ? <span className="meta-label">{label}</span> : null}
        <span className="meta-value">{children}</span>
      </span>
    </div>
  )
}
