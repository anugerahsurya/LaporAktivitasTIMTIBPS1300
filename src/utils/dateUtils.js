/**
 * Utility functions untuk pengelolaan tanggal dan periode mingguan.
 *
 * Konvensi periode:
 * - Periode di-anchor ke hari Minggu.
 * - Pengisian dibuka dari Selasa s/d Senin minggu berikutnya.
 * - Contoh: Periode "14 Juni 2026" (Minggu) → isi mulai 16 Juni (Selasa) s/d 22 Juni (Senin).
 */

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

/**
 * Mendapatkan tanggal Minggu terakhir yang sudah lewat (atau hari ini jika Minggu).
 * Ini digunakan sebagai anchor periode saat ini.
 */
export function getLastSunday(from = new Date()) {
  const d = new Date(from)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0 = Minggu
  if (day === 0) return d
  d.setDate(d.getDate() - day)
  return d
}

/**
 * Mendapatkan periode saat ini (Minggu anchor).
 * Jika hari ini Selasa-Sabtu, periode = Minggu kemarin.
 * Jika hari ini Minggu atau Senin, periode = Minggu lalu (minggu sebelumnya).
 *
 * Logika: pengisian dibuka Selasa-Senin.
 * Jadi jika hari ini Senin (22 Juni), masih mengisi periode 14 Juni.
 * Jika hari ini Selasa (16 Juni), mulai mengisi periode 14 Juni.
 */
export function getCurrentPeriod(from = new Date()) {
  const d = new Date(from)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()

  // Jika Minggu (0) atau Senin (1): periode = Minggu 2 minggu lalu
  // Jika Selasa-Sabtu (2-6): periode = Minggu kemarin
  if (day === 0) {
    // Hari Minggu: periode minggu lalu
    d.setDate(d.getDate() - 7)
    return getLastSunday(d)
  } else if (day === 1) {
    // Hari Senin: masih mengisi periode minggu lalu
    d.setDate(d.getDate() - 1) // ke Minggu kemarin
    return getLastSunday(d)
  } else {
    // Selasa-Sabtu: periode = Minggu kemarin
    return getLastSunday(d)
  }
}

/**
 * Mendapatkan range pengisian untuk suatu periode.
 * Periode (Minggu) → pengisian Senin (periode + 1 hari) s/d Senin (periode + 8 hari).
 */
export function getFillingRange(periodDate) {
  const start = new Date(periodDate)
  start.setDate(start.getDate() + 1) // Senin
  const end = new Date(periodDate)
  end.setDate(end.getDate() + 8) // Senin minggu depannya

  return { start, end }
}

/**
 * Mengecek apakah pengisian masih dibuka untuk suatu periode.
 */
export function isFillingOpen(periodDate, now = new Date()) {
  const { start, end } = getFillingRange(periodDate)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)
  return today >= start && today <= end
}

/**
 * Format tanggal ke format Indonesia: "14 Juni 2026"
 */
export function formatDate(date) {
  const d = new Date(date)
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}

/**
 * Format tanggal ke format pendek: "14 Jun"
 */
export function formatDateShort(date) {
  const d = new Date(date)
  return `${d.getDate()} ${BULAN[d.getMonth()].substring(0, 3)}`
}

/**
 * Format tanggal ke ISO string: "2026-06-14"
 */
export function formatDateISO(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse ISO date string ke Date object
 */
export function parseISO(str) {
  const [year, month, day] = str.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Mendapatkan nama hari
 */
export function getDayName(date) {
  return HARI[new Date(date).getDay()]
}

/**
 * Mendapatkan label periode: "Minggu, 14 Juni 2026"
 */
export function getPeriodLabel(date) {
  const d = new Date(date)
  return `Minggu, ${formatDate(d)}`
}

/**
 * Mendapatkan range kegiatan (Senin-Minggu) dari periode anchor (Minggu).
 * Jika periode = 14 Juni (Minggu), maka kegiatan = 8 Juni (Senin) - 14 Juni (Minggu).
 */
export function getActivityRange(periodDate) {
  const end = new Date(periodDate) // Minggu
  const start = new Date(periodDate)
  start.setDate(start.getDate() - 6) // Senin sebelumnya
  return { start, end }
}

/**
 * Mendapatkan daftar periode mingguan (untuk navigasi riwayat).
 * Mengembalikan N periode terakhir.
 */
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
