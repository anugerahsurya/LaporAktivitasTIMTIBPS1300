const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export function getLastSunday(from = new Date()) {
  const d = new Date(from)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  if (day === 0) return d
  d.setDate(d.getDate() - day)
  return d
}

export function getComingSunday(from = new Date()) {
  const d = new Date(from)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  if (day === 0) return d
  d.setDate(d.getDate() + (7 - day))
  return d
}

export function getCurrentPeriod(from = new Date()) {
  const d = new Date(from)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()

  if (day === 6) { // Sabtu
    const nextSunday = new Date(d)
    nextSunday.setDate(nextSunday.getDate() + 1)
    return nextSunday
  }

  // Minggu (0) s/d Jumat (5)
  const lastSunday = new Date(d)
  lastSunday.setDate(lastSunday.getDate() - day)
  return lastSunday
}

export function getFillingRange(periodDate) {
  const start = new Date(periodDate)
  start.setDate(start.getDate() - 1)
  start.setHours(0, 0, 0, 0)

  const end = new Date(periodDate)
  end.setDate(end.getDate() + 5)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

export function isFillingOpen(periodDate, now = new Date()) {
  const { start, end } = getFillingRange(periodDate)
  const current = new Date(now)
  return current >= start && current <= end
}

export function formatDate(date) {
  const d = new Date(date)
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}

export function formatDateShort(date) {
  const d = new Date(date)
  return `${d.getDate()} ${BULAN[d.getMonth()].substring(0, 3)}`
}

export function formatDateISO(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseISO(str) {
  const [year, month, day] = str.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function getDayName(date) {
  return HARI[new Date(date).getDay()]
}

export function getPeriodLabel(date) {
  const d = new Date(date)
  return `Minggu, ${formatDate(d)}`
}

export function getActivityRange(periodDate) {
  const start = new Date(periodDate)
  start.setDate(start.getDate() + 1)
  const end = new Date(periodDate)
  end.setDate(end.getDate() + 7)
  return { start, end }
}

export function getRecentPeriods(count = 12) {
  const current = getCurrentPeriod()
  const periods = []
  for (let i = 0; i < count; i++) {
    const d = new Date(current)
    d.setDate(d.getDate() - i * 7)
    periods.push(d)
  }
  return periods
}
