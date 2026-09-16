export default function RecipeOptionsMenu({ options, onChange, label = 'Recipe options' }) {
  const toggle = (key) => onChange({ ...options, [key]: !options[key] })
  const setMeasurement = (measurement) => onChange({ ...options, measurement })

  return (
    <details className="options-menu">
      <summary className="btn ghost">{label} ▾</summary>
      <div className="options-menu-panel">
        <label className={`option-toggle${options.includeInShoppingList ? ' on' : ''}`}>
          <input
            type="checkbox"
            checked={options.includeInShoppingList}
            onChange={() => toggle('includeInShoppingList')}
          />
          Include ingredients in shopping lists
        </label>
        <label className={`option-toggle${options.showNutrition ? ' on' : ''}`}>
          <input
            type="checkbox"
            checked={options.showNutrition}
            onChange={() => toggle('showNutrition')}
          />
          Show nutrition information
        </label>
        <label className={`option-toggle${options.allowSubstitutions ? ' on' : ''}`}>
          <input
            type="checkbox"
            checked={options.allowSubstitutions}
            onChange={() => toggle('allowSubstitutions')}
          />
          Allow ingredient substitutions
        </label>
        <fieldset className="measurement-group">
          <legend>Measurements</legend>
          <label className={options.measurement === 'us' ? 'on' : ''}>
            <input
              type="radio"
              name={`measurement-${label}`}
              checked={options.measurement === 'us'}
              onChange={() => setMeasurement('us')}
            />
            US customary
          </label>
          <label className={options.measurement === 'metric' ? 'on' : ''}>
            <input
              type="radio"
              name={`measurement-${label}`}
              checked={options.measurement === 'metric'}
              onChange={() => setMeasurement('metric')}
            />
            Metric
          </label>
        </fieldset>
      </div>
    </details>
  )
}
