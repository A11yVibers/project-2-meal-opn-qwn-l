import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { INGREDIENTS } from '../data/catalog.js'
import { IconSearch } from './Icons.jsx'

export default function IngredientCombobox({ value, onSelect, placeholder = 'Search ingredients…', id }) {
  const [query, setQuery] = useState(value || '')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const listId = useId()
  const wrapperRef = useRef(null)

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  useEffect(() => {
    function onPointerDown(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return INGREDIENTS.slice(0, 40)
    return INGREDIENTS.filter((item) => item.name.toLowerCase().includes(needle)).slice(0, 40)
  }, [query])

  const exact = matches.find((item) => item.name.toLowerCase() === query.trim().toLowerCase())
  const showCustom = query.trim().length > 0 && !exact

  function choose(option) {
    onSelect(option)
    setQuery(option.name)
    setOpen(false)
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      const total = matches.length + (showCustom ? 1 : 0)
      if (total === 0) return
      const delta = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((current) => (current + delta + total) % total)
      return
    }
    if (event.key === 'Enter' && open) {
      event.preventDefault()
      if (showCustom && activeIndex === matches.length) {
        choose({ id: null, name: query.trim(), category: 'Other' })
      } else if (matches[activeIndex]) {
        choose(matches[activeIndex])
      }
      return
    }
    if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="combobox" ref={wrapperRef}>
      <span className="combobox-icon" aria-hidden="true">
        <IconSearch width={15} height={15} />
      </span>
      <input
        id={id}
        className="input combobox-input"
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && matches[activeIndex] ? `${listId}-opt-${activeIndex}` : undefined}
        placeholder={placeholder}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setActiveIndex(0)
          setOpen(true)
          if (!event.target.value.trim()) onSelect({ id: null, name: '' })
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (query.trim() && !exact) onSelect({ id: null, name: query.trim() })
        }}
      />
      {open ? (
        <ul className="combobox-list" id={listId} role="listbox" aria-label="Ingredients">
          {matches.map((item, index) => (
            <li
              key={item.id}
              id={`${listId}-opt-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={`combobox-option ${index === activeIndex ? 'is-active' : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => {
                event.preventDefault()
                choose(item)
              }}
            >
              <span>{item.name}</span>
              <span className="combobox-category">{item.category}</span>
            </li>
          ))}
          {showCustom ? (
            <li
              id={`${listId}-opt-${matches.length}`}
              role="option"
              aria-selected={activeIndex === matches.length}
              className={`combobox-option ${activeIndex === matches.length ? 'is-active' : ''}`}
              onMouseEnter={() => setActiveIndex(matches.length)}
              onMouseDown={(event) => {
                event.preventDefault()
                choose({ id: null, name: query.trim(), category: 'Other' })
              }}
            >
              <span>Use “{query.trim()}”</span>
              <span className="combobox-category">custom</span>
            </li>
          ) : null}
          {matches.length === 0 && !showCustom ? (
            <li className="combobox-empty">Type to add a custom ingredient</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  )
}
