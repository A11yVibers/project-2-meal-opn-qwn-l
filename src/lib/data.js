import recipesCsv from '../../project-assets/recipes.csv?raw'
import recipeIngredientsCsv from '../../project-assets/recipe_ingredients.csv?raw'
import recipeStepsCsv from '../../project-assets/recipe_steps.csv?raw'
import ingredientsCsv from '../../project-assets/ingredients.csv?raw'
import unitsCsv from '../../project-assets/units.csv?raw'
import cuisinesCsv from '../../project-assets/cuisines.csv?raw'
import mealTypesCsv from '../../project-assets/meal_types.csv?raw'
import dietaryTagsCsv from '../../project-assets/dietary_tags.csv?raw'
import categoriesCsv from '../../project-assets/recipe_categories.csv?raw'
import { parseCsv, splitIds } from './csv.js'
import { APPROVED_IMAGES } from '../approved-images.js'

export const CUISINES = parseCsv(cuisinesCsv)
export const MEAL_TYPES = parseCsv(mealTypesCsv)
export const DIETARY_TAGS = parseCsv(dietaryTagsCsv)
export const CATEGORIES = parseCsv(categoriesCsv)
export const INGREDIENTS = parseCsv(ingredientsCsv)
export const UNITS = parseCsv(unitsCsv)

export const cuisineName = (id) => CUISINES.find((c) => c.cuisine_id === id)?.cuisine_name || id || ''
export const mealTypeName = (id) => MEAL_TYPES.find((m) => m.meal_type_id === id)?.meal_type_name || id || ''
export const dietaryTagName = (id) => DIETARY_TAGS.find((d) => d.dietary_tag_id === id)?.dietary_tag_name || id || ''
export const categoryName = (id) => CATEGORIES.find((c) => c.category_id === id)?.category_name || id || ''
export const ingredientById = (id) => INGREDIENTS.find((i) => i.ingredient_id === id)
export const ingredientCategory = (name, id) => ingredientById(id)?.shopping_category || 'Grains & pantry'

export const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

export const SPICE_LEVELS = [
  { value: 0, label: 'Not spicy' },
  { value: 1, label: 'Mild' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'Spicy' },
  { value: 4, label: 'Very spicy' },
  { value: 5, label: 'Extreme' },
]
export const spiceLabel = (v) => SPICE_LEVELS.find((s) => s.value === Number(v))?.label || 'Mild'

const seedRows = parseCsv(recipesCsv)
const seedIngredients = parseCsv(recipeIngredientsCsv)
const seedSteps = parseCsv(recipeStepsCsv)

function buildSeedRecipes() {
  return seedRows.map((r) => {
    const ingRows = seedIngredients
      .filter((i) => i.recipe_id === r.recipe_id)
      .sort((a, b) => Number(a.display_order) - Number(b.display_order))
    const sections = []
    for (const ing of ingRows) {
      let sec = sections.find((s) => s.name === ing.section_name)
      if (!sec) {
        sec = { name: ing.section_name || 'Main', items: [] }
        sections.push(sec)
      }
      sec.items.push({
        ingredientId: ing.ingredient_id || null,
        ingredientName: ing.ingredient_name,
        quantity: ing.quantity ? Number(ing.quantity) : null,
        unit: ing.unit || '',
        notes: ing.notes || '',
        optional: ing.optional === 'True',
      })
    }
    const steps = seedSteps
      .filter((s) => s.recipe_id === r.recipe_id)
      .sort((a, b) => Number(a.step_number) - Number(b.step_number))
      .map((s) => ({ instruction: s.instruction, timerMinutes: Number(s.timer_minutes) || null }))
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
      dietaryTagIds: splitIds(r.dietary_tag_ids),
      categoryIds: splitIds(r.category_ids),
      difficulty: Number(r.difficulty_1_to_5) || 1,
      spiceLevel: Number(r.spice_level_0_to_5) || 0,
      accentColor: r.accent_color || '#D97757',
      coverImageUrl: r.cover_image_url || '',
      includeInSuggestions: r.include_in_meal_suggestions === 'true',
      ingredientSections: sections,
      steps,
      isSeed: true,
    }
  })
}

export const SEED_RECIPES = buildSeedRecipes()

// Only remote URLs that appear in project-assets files or approved-images.js are allowed.
export const APPROVED_IMAGE_URLS = Array.from(
  new Set([APPROVED_IMAGES.placeholder, ...seedRows.map((r) => r.cover_image_url).filter(Boolean)])
)
export const PLACEHOLDER_IMAGE = APPROVED_IMAGES.placeholder

export const SHOPPING_CATEGORY_ORDER = [
  'Produce',
  'Meat & seafood',
  'Dairy & eggs',
  'Grains & pantry',
  'Oils & condiments',
  'Canned & jarred',
  'Spices',
]

export const DEFAULT_RECIPE_OPTIONS = {
  includeInShoppingList: true,
  showNutrition: true,
  allowSubstitutions: true,
  measurement: 'us',
}
