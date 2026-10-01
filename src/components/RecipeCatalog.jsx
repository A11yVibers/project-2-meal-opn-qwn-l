import { coverImage, cuisineName, mealTypeName, formatQty } from '../data.js'

export default function RecipeCatalog({ recipes, optionsFor, onOpen, onNew }) {
  return (
    <section className="catalog">
      <div className="catalog-head">
        <h2>Recipe catalog <span className="count-badge">{recipes.length}</span></h2>
        <button className="btn btn-primary" onClick={onNew}>+ Add recipe</button>
      </div>
      <div className="recipe-grid">
        {recipes.map(r => {
          const opts = optionsFor(r)
          return (
            <article
              key={r.id}
              className="recipe-card"
              style={{ '--accent': r.accentColor }}
              onClick={() => onOpen(r.id)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(r.id) } }}
              tabIndex={0}
              role="button"
              aria-label={`Open recipe ${r.title}`}
            >
              <div className="card-img-wrap">
                <img src={coverImage(r)} alt={r.title} loading="lazy" />
                <span className="card-meal">{mealTypeName(r.mealTypeId)}</span>
              </div>
              <div className="card-body">
                <h3>{r.title}</h3>
                <p className="card-desc">{r.shortDescription}</p>
                <div className="card-meta">
                  <span title="Total time">{r.totalMinutes || (r.prepMinutes + r.cookMinutes)} min</span>
                  <span title="Servings">{formatQty(r.servings)} servings</span>
                  <span title="Cuisine">{cuisineName(r.cuisineId)}</span>
                </div>
                <div className="card-badges">
                  {r.spiceLevel > 0 && <span className="badge badge-spice">Spice {r.spiceLevel}/5</span>}
                  {opts.unitSystem === 'metric' && <span className="badge">Metric</span>}
                  {r.isSeed && <span className="badge badge-seed">Seeded</span>}
                  {!r.isSeed && <span className="badge badge-user">Yours</span>}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
