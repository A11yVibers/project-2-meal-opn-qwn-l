import recipesCsv from '../project-assets/recipes.csv?raw'
import recipeIngredientsCsv from '../project-assets/recipe_ingredients.csv?raw'
import recipeStepsCsv from '../project-assets/recipe_steps.csv?raw'
import ingredientsCsv from '../project-assets/ingredients.csv?raw'
import unitsCsv from '../project-assets/units.csv?raw'
import cuisinesCsv from '../project-assets/cuisines.csv?raw'
import dietaryTagsCsv from '../project-assets/dietary_tags.csv?raw'
import mealTypesCsv from '../project-assets/meal_types.csv?raw'
import recipeCategoriesCsv from '../project-assets/recipe_categories.csv?raw'
import { APPROVED_IMAGES } from './approved-images.js'

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else field += c
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field); field = ''
    } else if (c === '\n') {
      row.push(field); field = ''
      if (row.some(v => v !== '')) rows.push(row)
      row = []
    } else if (c !== '\r') {
      field += c
    }
  }
  row.push(field)
  if (row.some(v => v !== '')) rows.push(row)
  const header = rows.shift()
  return rows.map(r => Object.fromEntries(header.map((h, idx) => [h, r[idx] ?? ''])))
}

export const CUISINES = parseCsv(cuisinesCsv)
export const DIETARY_TAGS = parseCsv(dietaryTagsCsv)
export const MEAL_TYPES = parseCsv(mealTypesCsv)
export const RECIPE_CATEGORIES = parseCsv(recipeCategoriesCsv)
export const INGREDIENTS = parseCsv(ingredientsCsv)
export const UNITS = parseCsv(unitsCsv)

const seedRecipes = parseCsv(recipesCsv)
const seedIngredients = parseCsv(recipeIngredientsCsv)
const seedSteps = parseCsv(recipeStepsCsv)

const byId = (arr, key) => Object.fromEntries(arr.map(r => [r[key], r]))
export const cuisineById = byId(CUISINES, 'cuisine_id')
export const tagById = byId(DIETARY_TAGS, 'dietary_tag_id')
export const mealTypeById = byId(MEAL_TYPES, 'meal_type_id')
export const categoryById = byId(RECIPE_CATEGORIES, 'category_id')
export const ingredientById = byId(INGREDIENTS, 'ingredient_id')
export const ingredientByName = Object.fromEntries(
  INGREDIENTS.map(i => [i.ingredient_name.toLowerCase(), i])
)

export const SHOPPING_CATEGORIES = [
  'Produce', 'Meat & seafood', 'Dairy & eggs', 'Grains & pantry',
  'Oils & condiments', 'Canned & jarred', 'Spices'
]

export const PLANNER_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

export const SPICE_LEVELS = ['None', 'Mild', 'Medium', 'Spicy', 'Very spicy', 'Fiery']

export const ACCENT_SWATCHES = [
  '#D97757', '#8A9A5B', '#4F7CAC', '#B5651D', '#7D5BA6', '#C2555A', '#3E7C6F', '#A8562C'
]

export const COVER_IMAGE_CHOICES = [
  { label: 'Placeholder (no image)', url: '' },
  ...Object.values(
    Object.fromEntries(
      seedRecipes
        .filter(r => r.cover_image_url)
        .map(r => [r.cover_image_url, { label: r.title, url: r.cover_image_url }])
    )
  )
]

export function normalizeSeedRecipe(r) {
  return {
    id: r.recipe_id,
    title: r.title,
    shortDescription: r.short_description,
    sourceName: r.source_name,
    sourceUrl: r.source_url,
    servings: Number(r.servings) || 4,
    prepMinutes: Number(r.prep_time_minutes) || 0,
    cookMinutes: Number(r.cook_time_minutes) || 0,
    totalMinutes: Number(r.total_time_minutes) || 0,
    cuisineId: r.cuisine_id,
    mealTypeId: r.meal_type_id,
    dietaryTagIds: r.dietary_tag_ids ? r.dietary_tag_ids.split(',').filter(Boolean) : [],
    categoryIds: r.category_ids ? r.category_ids.split(',').filter(Boolean) : [],
    difficulty: Number(r.difficulty_1_to_5) || 1,
    spiceLevel: Number(r.spice_level_0_to_5) || 0,
    accentColor: r.accent_color || '#D97757',
    coverImageUrl: r.cover_image_url || '',
    includeInMealSuggestions: r.include_in_meal_suggestions === 'true',
    isSeed: true,
    ingredients: seedIngredients
      .filter(i => i.recipe_id === r.recipe_id)
      .sort((a, b) => a.display_order - b.display_order)
      .map(i => ({
        section: i.section_name || 'Main',
        ingredientId: i.ingredient_id,
        name: i.ingredient_name,
        quantity: Number(i.quantity) || 0,
        unit: i.unit,
        notes: i.notes,
        optional: i.optional === 'True'
      })),
    steps: seedSteps
      .filter(s => s.recipe_id === r.recipe_id)
      .sort((a, b) => a.step_number - b.step_number)
      .map(s => ({
        instruction: s.instruction,
        timerMinutes: Number(s.timer_minutes) || 0
      }))
  }
}

export const SEED_RECIPES = seedRecipes.map(normalizeSeedRecipe)

export const DEFAULT_RECIPE_OPTIONS = {
  includeInShoppingList: true,
  showNutrition: false,
  allowSubstitutions: false,
  unitSystem: 'us'
}

export function resolveOptions(recipe, overrides) {
  return { ...DEFAULT_RECIPE_OPTIONS, ...(overrides[recipe.id] || {}) }
}

export function coverImage(recipe) {
  return recipe.coverImageUrl || APPROVED_IMAGES.placeholder
}

export function cuisineName(id) { return cuisineById[id]?.cuisine_name || 'Other' }
export function mealTypeName(id) { return mealTypeById[id]?.meal_type_name || '' }
export function tagNames(ids) { return ids.map(id => tagById[id]?.dietary_tag_name).filter(Boolean) }
export function categoryNames(ids) { return ids.map(id => categoryById[id]?.category_name).filter(Boolean) }

const round = (n, p = 2) => {
  const f = 10 ** p
  return Math.round(n * f) / f
}

const TO_METRIC = {
  oz: { unit: 'g', factor: 28.35 },
  lb: { unit: 'g', factor: 453.6 },
  cup: { unit: 'ml', factor: 240 },
  tbsp: { unit: 'ml', factor: 15 },
  tsp: { unit: 'ml', factor: 5 }
}
const TO_US = {
  g: { small: { unit: 'oz', factor: 1 / 28.35 }, big: { unit: 'lb', factor: 1 / 453.6 }, threshold: 450 },
  kg: { small: { unit: 'lb', factor: 2.2046 }, big: { unit: 'lb', factor: 2.2046 }, threshold: Infinity },
  ml: { small: { unit: 'tsp', factor: 1 / 5 }, big: { unit: 'cup', factor: 1 / 240 }, threshold: 60 },
  L: { small: { unit: 'cup', factor: 4.2268 }, big: { unit: 'cup', factor: 4.2268 }, threshold: Infinity }
}

export function convertQuantity(qty, unit, system) {
  if (!qty) return { qty, unit }
  if (system === 'metric') {
    const c = TO_METRIC[unit]
    if (!c) return { qty: round(qty), unit }
    const v = qty * c.factor
    return { qty: v >= 100 ? Math.round(v) : round(v, 1), unit: c.unit }
  }
  const c = TO_US[unit]
  if (!c) return { qty: round(qty), unit }
  const target = qty >= c.threshold ? c.big : c.small
  const v = qty * target.factor
  return { qty: v >= 10 ? round(v, 1) : round(v, 2), unit: target.unit }
}

export function formatQty(q) {
  if (q == null || q === '') return ''
  const n = Number(q)
  if (Number.isNaN(n)) return String(q)
  const fracs = { 0.25: '¼', 0.5: '½', 0.75: '¾', 0.33: '⅓', 0.67: '⅔' }
  const whole = Math.floor(n)
  const dec = round(n - whole, 2)
  for (const [k, g] of Object.entries(fracs)) {
    if (Math.abs(dec - Number(k)) < 0.03) return whole ? `${whole}${g}` : g
  }
  return String(round(n))
}

export function ingredientCategory(ing) {
  if (ing.ingredientId && ingredientById[ing.ingredientId]) {
    return ingredientById[ing.ingredientId].shopping_category
  }
  const byName = ingredientByName[(ing.name || '').toLowerCase()]
  return byName?.shopping_category || 'Grains & pantry'
}

// ---- date helpers ----
export function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
export function fromISODate(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export function startOfWeek(date) {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}
export function weekDays(mondayISO) {
  const mon = fromISODate(mondayISO)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return toISODate(d)
  })
}
export function addWeeks(mondayISO, n) {
  const d = fromISODate(mondayISO)
  d.setDate(d.getDate() + n * 7)
  return toISODate(d)
}
export function fmtDateLabel(iso) {
  return fromISODate(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}
export function fmtWeekLabel(mondayISO) {
  const days = weekDays(mondayISO)
  const a = fromISODate(days[0])
  const b = fromISODate(days[6])
  const fmt = d => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${fmt(a)} – ${fmt(b)}, ${b.getFullYear()}`
}
export function thisMondayISO() {
  return toISODate(startOfWeek(new Date()))
}
