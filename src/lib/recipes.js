import { PLACEHOLDER_IMAGE } from '../data/catalog.js'
import { totalMinutes } from './measure.js'
import { createId } from './storage.js'

export function emptyIngredientItem() {
  return {
    id: createId('ing'),
    ingredientId: null,
    ingredientName: '',
    quantity: null,
    unit: '',
    notes: '',
    optional: false
  }
}

export function emptySection(name = 'Main') {
  return { id: createId('sec'), name, items: [emptyIngredientItem()] }
}

export function emptyStep() {
  return { id: createId('step'), instruction: '', timerMinutes: 0 }
}

export function defaultRecipeOptions() {
  return {
    includeInShoppingList: true,
    showNutrition: false,
    allowSubstitutions: false,
    measurementSystem: 'us'
  }
}

export function emptyRecipe() {
  return {
    id: createId('recipe'),
    origin: 'user',
    title: '',
    shortDescription: '',
    sourceName: '',
    sourceUrl: '',
    servings: 4,
    prepMinutes: 0,
    cookMinutes: 0,
    totalMinutes: 0,
    cuisineId: '',
    mealTypeId: '',
    dietaryTagIds: [],
    categoryIds: [],
    difficulty: 1,
    spiceLevel: 1,
    accentColor: '#D97757',
    coverImageUrl: '',
    includeInMealSuggestions: true,
    sections: [emptySection('Main')],
    steps: [emptyStep()],
    options: defaultRecipeOptions(),
    createdAt: new Date().toISOString()
  }
}

export function normalizeRecipe(raw = {}) {
  const options = { ...defaultRecipeOptions(), ...(raw.options || {}) }
  const sections = Array.isArray(raw.sections) && raw.sections.length
    ? raw.sections
    : [emptySection('Main')]

  return {
    ...emptyRecipe(),
    ...raw,
    options,
    servings: Number(raw.servings) > 0 ? Number(raw.servings) : 1,
    prepMinutes: Number(raw.prepMinutes) || 0,
    cookMinutes: Number(raw.cookMinutes) || 0,
    totalMinutes: Number(raw.totalMinutes) || totalMinutes(raw),
    spiceLevel: Number.isFinite(Number(raw.spiceLevel)) ? Number(raw.spiceLevel) : 0,
    difficulty: Number(raw.difficulty) || 1,
    dietaryTagIds: Array.isArray(raw.dietaryTagIds) ? raw.dietaryTagIds : [],
    categoryIds: Array.isArray(raw.categoryIds) ? raw.categoryIds : [],
    sections: sections.map((section) => ({
      id: section.id || createId('sec'),
      name: section.name || 'Ingredients',
      items: (Array.isArray(section.items) ? section.items : []).map((item) => ({
        ...emptyIngredientItem(),
        ...item,
        quantity: item.quantity === '' || item.quantity == null ? null : Number(item.quantity),
        optional: Boolean(item.optional)
      }))
    })),
    steps: (Array.isArray(raw.steps) ? raw.steps : []).map((step, index) => ({
      id: step.id || createId('step'),
      instruction: step.instruction || '',
      timerMinutes: Number(step.timerMinutes) || 0,
      number: index + 1
    }))
  }
}

export function validateRecipe(recipe) {
  const errors = {}
  if (!String(recipe.title || '').trim()) errors.title = 'A recipe title is required.'
  if (!(Number(recipe.servings) > 0)) errors.servings = 'Servings must be at least 1.'
  const hasIngredient = recipe.sections.some((section) =>
    section.items.some((item) => String(item.ingredientName || '').trim())
  )
  if (!hasIngredient) errors.ingredients = 'Add at least one ingredient.'
  const hasStep = recipe.steps.some((step) => String(step.instruction || '').trim())
  if (!hasStep) errors.steps = 'Add at least one method step.'
  if (String(recipe.sourceUrl || '').trim() && !/^https?:\/\/\S+/i.test(String(recipe.sourceUrl).trim())) {
    errors.sourceUrl = 'Source link must start with http:// or https://'
  }
  if (String(recipe.coverImageUrl || '').trim() && !/^https?:\/\/\S+/i.test(String(recipe.coverImageUrl).trim()) && !/^data:image\//.test(String(recipe.coverImageUrl).trim())) {
    errors.coverImageUrl = 'Cover image must be a URL.'
  }
  return errors
}

export function recipeImage(recipe) {
  const url = String(recipe?.coverImageUrl || '').trim()
  return url || PLACEHOLDER_IMAGE
}

export function allIngredients(recipe) {
  return (recipe?.sections || []).flatMap((section) => section.items || [])
}

export function scaleItem(item, scale) {
  if (!Number.isFinite(item?.quantity) || !Number.isFinite(scale)) return item?.quantity ?? null
  return Math.round(item.quantity * scale * 1000) / 1000
}

export function ingredientCount(recipe) {
  return allIngredients(recipe).filter((item) => String(item.ingredientName || '').trim()).length
}
