import cuisinesCsv from '../../project-assets/cuisines.csv?raw'
import dietaryTagsCsv from '../../project-assets/dietary_tags.csv?raw'
import ingredientsCsv from '../../project-assets/ingredients.csv?raw'
import mealTypesCsv from '../../project-assets/meal_types.csv?raw'
import recipeCategoriesCsv from '../../project-assets/recipe_categories.csv?raw'
import recipeIngredientsCsv from '../../project-assets/recipe_ingredients.csv?raw'
import recipeStepsCsv from '../../project-assets/recipe_steps.csv?raw'
import recipesCsv from '../../project-assets/recipes.csv?raw'
import unitsCsv from '../../project-assets/units.csv?raw'

export const RAW_CSV = Object.freeze({
  cuisines: cuisinesCsv,
  dietaryTags: dietaryTagsCsv,
  ingredients: ingredientsCsv,
  mealTypes: mealTypesCsv,
  recipeCategories: recipeCategoriesCsv,
  recipeIngredients: recipeIngredientsCsv,
  recipeSteps: recipeStepsCsv,
  recipes: recipesCsv,
  units: unitsCsv
})

export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  const source = String(text).replace(/^\uFEFF/, '')

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i]
    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }
    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  const clean = rows.filter((r) => r.some((cell) => String(cell).trim() !== ''))
  if (clean.length === 0) return []
  const header = clean[0].map((h) => h.trim())
  return clean.slice(1).map((cells) => {
    const record = {}
    header.forEach((key, index) => {
      record[key] = (cells[index] ?? '').trim()
    })
    return record
  })
}

export function parseListField(value) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function parseBool(value) {
  return ['true', 'yes', '1'].includes(String(value ?? '').trim().toLowerCase())
}

export function parseNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
