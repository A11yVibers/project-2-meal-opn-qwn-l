import { APPROVED_IMAGES } from '../approved-images.js'
import { parseBool, parseCsv, parseListField, parseNumber, RAW_CSV } from './csv.js'

export const PLACEHOLDER_IMAGE = APPROVED_IMAGES.placeholder

export const CUISINES = parseCsv(RAW_CSV.cuisines).map((row) => ({
  id: row.cuisine_id,
  name: row.cuisine_name
}))

export const MEAL_TYPES = parseCsv(RAW_CSV.mealTypes).map((row) => ({
  id: row.meal_type_id,
  name: row.meal_type_name
}))

export const DIETARY_TAGS = parseCsv(RAW_CSV.dietaryTags).map((row) => ({
  id: row.dietary_tag_id,
  name: row.dietary_tag_name
}))

export const RECIPE_CATEGORIES = parseCsv(RAW_CSV.recipeCategories).map((row) => ({
  id: row.category_id,
  name: row.category_name
}))

export const OTHER_CATEGORY = 'Other'

export const INGREDIENTS = parseCsv(RAW_CSV.ingredients).map((row) => ({
  id: row.ingredient_id,
  name: row.ingredient_name,
  category: row.shopping_category || OTHER_CATEGORY
}))

export const UNITS = parseCsv(RAW_CSV.units).map((row) => ({
  id: row.unit_id,
  name: row.unit_name
}))

export const SHOPPING_CATEGORIES = [
  'Produce',
  'Meat & seafood',
  'Dairy & eggs',
  'Grains & pantry',
  'Oils & condiments',
  'Canned & jarred',
  'Spices',
  OTHER_CATEGORY
]

export const PLAN_SLOTS = MEAL_TYPES.filter((mealType) =>
  ['MT01', 'MT02', 'MT03', 'MT04'].includes(mealType.id)
).map((mealType) => mealType.name)

export const FALLBACK_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
export const MEAL_SLOTS = PLAN_SLOTS.length === 4 ? PLAN_SLOTS : FALLBACK_SLOTS

const INGREDIENT_BY_ID = new Map(INGREDIENTS.map((item) => [item.id, item]))
const INGREDIENT_BY_NAME = new Map(INGREDIENTS.map((item) => [item.name.toLowerCase(), item]))

export function ingredientCategory(name) {
  const match = INGREDIENT_BY_NAME.get(String(name ?? '').toLowerCase())
  return match?.category || OTHER_CATEGORY
}

export function ingredientById(id) {
  return INGREDIENT_BY_ID.get(id) || null
}

export function lookupName(list, id) {
  return list.find((item) => item.id === id)?.name || ''
}

export const cuisineName = (id) => lookupName(CUISINES, id)
export const mealTypeName = (id) => lookupName(MEAL_TYPES, id)
export const dietaryTagNames = (ids = []) => ids.map((id) => lookupName(DIETARY_TAGS, id)).filter(Boolean)
export const categoryNames = (ids = []) => ids.map((id) => lookupName(RECIPE_CATEGORIES, id)).filter(Boolean)

const ingredientRows = parseCsv(RAW_CSV.recipeIngredients)
const stepRows = parseCsv(RAW_CSV.recipeSteps)

function buildSeedSections(recipeId) {
  const rows = ingredientRows
    .filter((row) => row.recipe_id === recipeId)
    .sort((a, b) => parseNumber(a.display_order) - parseNumber(b.display_order))

  const sections = []
  const byName = new Map()
  rows.forEach((row) => {
    const sectionName = row.section_name || 'Ingredients'
    if (!byName.has(sectionName)) {
      const section = { id: `${recipeId}-${sectionName.toLowerCase().replace(/\W+/g, '-')}`, name: sectionName, items: [] }
      byName.set(sectionName, section)
      sections.push(section)
    }
    byName.get(sectionName).items.push({
      id: `${recipeId}-ing-${row.display_order}`,
      ingredientId: row.ingredient_id || null,
      ingredientName: row.ingredient_name || ingredientById(row.ingredient_id)?.name || '',
      quantity: row.quantity === '' ? null : parseNumber(row.quantity),
      unit: row.unit || '',
      notes: row.notes || '',
      optional: parseBool(row.optional)
    })
  })
  return sections
}

function buildSeedSteps(recipeId) {
  return stepRows
    .filter((row) => row.recipe_id === recipeId)
    .sort((a, b) => parseNumber(a.step_number) - parseNumber(b.step_number))
    .map((row) => ({
      id: `${recipeId}-step-${row.step_number}`,
      instruction: row.instruction || '',
      timerMinutes: parseNumber(row.timer_minutes)
    }))
}

export const SEED_RECIPES = parseCsv(RAW_CSV.recipes).map((row) => ({
  id: row.recipe_id,
  origin: 'seed',
  title: row.title,
  shortDescription: row.short_description,
  sourceName: row.source_name,
  sourceUrl: row.source_url,
  servings: parseNumber(row.servings, 4),
  prepMinutes: parseNumber(row.prep_time_minutes),
  cookMinutes: parseNumber(row.cook_time_minutes),
  totalMinutes: parseNumber(row.total_time_minutes),
  cuisineId: row.cuisine_id,
  mealTypeId: row.meal_type_id,
  dietaryTagIds: parseListField(row.dietary_tag_ids),
  categoryIds: parseListField(row.category_ids),
  difficulty: parseNumber(row.difficulty_1_to_5, 1),
  spiceLevel: parseNumber(row.spice_level_0_to_5),
  accentColor: row.accent_color || '#D97757',
  coverImageUrl: row.cover_image_url || '',
  includeInMealSuggestions: parseBool(row.include_in_meal_suggestions),
  sections: buildSeedSections(row.recipe_id),
  steps: buildSeedSteps(row.recipe_id),
  options: {
    includeInShoppingList: true,
    showNutrition: false,
    allowSubstitutions: false,
    measurementSystem: 'us'
  }
}))

export const SPICE_LEVELS = [
  { value: 0, label: 'Not spicy' },
  { value: 1, label: 'Mild' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'Spicy' },
  { value: 4, label: 'Hot' },
  { value: 5, label: 'Very spicy' }
]

export const ACCENT_SWATCHES = [
  '#D97757',
  '#8A9A5B',
  '#2F6F6B',
  '#B4553C',
  '#6C63A8',
  '#C08A2E',
  '#3D6E8C',
  '#A34A6B'
]
