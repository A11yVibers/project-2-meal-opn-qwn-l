export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function toIsoDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromIsoDate(iso) {
  const [year, month, day] = String(iso).split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

export function startOfWeek(date = new Date()) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const shift = (copy.getDay() + 6) % 7
  copy.setDate(copy.getDate() - shift)
  return copy
}

export function addDays(date, days) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  copy.setDate(copy.getDate() + days)
  return copy
}

export function weekDates(weekStartIso) {
  const start = fromIsoDate(weekStartIso)
  return Array.from({ length: 7 }, (_, index) => toIsoDate(addDays(start, index)))
}

export function shiftWeek(weekStartIso, weeks) {
  return toIsoDate(addDays(fromIsoDate(weekStartIso), weeks * 7))
}

export function currentWeekStartIso() {
  return toIsoDate(startOfWeek(new Date()))
}

export function formatDayLabel(iso) {
  const date = fromIsoDate(iso)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function formatLongDate(iso) {
  return fromIsoDate(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })
}

export function formatWeekRange(weekStartIso) {
  const dates = weekDates(weekStartIso)
  const start = fromIsoDate(dates[0])
  const end = fromIsoDate(dates[6])
  const sameMonth = start.getMonth() === end.getMonth()
  const startText = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  })
  const endText = end.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  return sameMonth ? `${startText} – ${endText}` : `${startText} – ${endText}`
}

export function isToday(iso) {
  return iso === toIsoDate(new Date())
}

export function formatTime(value) {
  if (!value) return ''
  const [hours, minutes] = String(value).split(':').map(Number)
  if (!Number.isFinite(hours)) return value
  const date = new Date()
  date.setHours(hours, minutes || 0, 0, 0)
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}
