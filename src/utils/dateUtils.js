/**
 * Utility functions untuk pengelolaan tanggal dan periode mingguan.
 *
 * Konvensi periode:
 * - Periode di-anchor ke hari Minggu.
 * - Periode aktif dimulai Senin jam 12:00 s/d Senin jam 11:59 minggu berikutnya.
 * - Contoh: Periode "14 Juni 2026" (Minggu) → aktif mulai 15 Juni (Senin) jam 12:00
 *   s/d 22 Juni (Senin) jam 11:59.
 * - getCurrentPeriod() menggunakan waktu sekarang (termasuk jam) untuk menentukan
 *   periode mana yang sedang aktif.
 */

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

/**
 * Mendapatkan tanggal Minggu terakhir yang sudah lewat (atau hari ini jika Minggu).
 * Ini digunakan sebagai anchor periode.
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
 * Mendapatkan periode saat ini (Minggu anchor) berdasarkan waktu sekarang.
 *
 * Logika baru:
 * - Periode aktif dimulai Senin jam 12:00 dan berakhir Senin berikutnya jam 11:59.
 * - Jika sekarang hari Senin dan jam < 12:00, masih di periode sebelumnya.
 * - Jika sekarang hari Senin dan jam >= 12:00, sudah masuk periode baru.
 * - Selasa-Minggu: selalu di periode Minggu kemarin (Minggu yang baru lewat).
 *
 * Contoh:
 * - Senin 15 Juni jam 11:00 → periode = Minggu 7 Juni (periode lama)
 * - Senin 15 Juni jam 12:00 → periode = Minggu 14 Juni (periode baru)
 * - Selasa 16 Juni jam 08:00 → periode = Minggu 14 Juni
 * - Minggu 21 Juni jam 23:00 → periode = Minggu 14 Juni
 */
export function getCurrentPeriod(from = new Date()) {
  const d = new Date(from)
  const day = d.getDay()  // 0=Minggu, 1=Senin, ...
  const hour = d.getHours()

  // Jika Senin sebelum jam 12:00 → masih periode sebelumnya
  if (day === 1 && hour < 12) {
    // Mundur ke Minggu kemarin → lalu mundur 7 hari lagi untuk dapat periode sebelumnya
    const prev = new Date(d)
    prev.setDate(prev.getDate() - 8) // Senin - 8 hari = Minggu sebelumnya
    return getLastSunday(prev)
  }

  // Jika Senin jam >= 12:00 → periode baru (Minggu kemarin)
  if (day === 1 && hour >= 12) {
    const prev = new Date(d)
    prev.setDate(prev.getDate() - 1) // Ke Minggu kemarin
    return getLastSunday(prev)
  }

  // Minggu (0): periode = Minggu ini (hari ini sendiri)
  if (day === 0) {
    return getLastSunday(d)
  }

  // Selasa-Sabtu (2-6): periode = Minggu kemarin
  return getLastSunday(d)
}

/**
 * Mendapatkan range pengisian (kapan periode aktif) untuk suatu periode.
 * Periode (Minggu) → aktif mulai Senin (periode + 1 hari) jam 12:00
 *                    sampai Senin berikutnya (periode + 8 hari) jam 11:59.
 *
 * Untuk tampilan, kita tetap tampilkan tanggal saja (tanpa jam).
 * start = Senin (periode + 1)
 * end   = Senin minggu depan (periode + 8)
 */
export function getFillingRange(periodDate) {
  const start = new Date(periodDate)
  start.setDate(start.getDate() + 1) // Senin
  start.setHours(12, 0, 0, 0)        // Mulai jam 12:00

  const end = new Date(periodDate)
  end.setDate(end.getDate() + 8)      // Senin minggu depannya
  end.setHours(11, 59, 59, 999)       // Berakhir jam 11:59

  return { start, end }
}

/**
 * Mengecek apakah pengisian masih dibuka untuk suatu periode.
 * Menggunakan waktu sekarang (termasuk jam) untuk pengecekan akurat.
 */
export function isFillingOpen(periodDate, now = new Date()) {
  const { start, end } = getFillingRange(periodDate)
  const current = new Date(now)
  return current >= start && current <= end
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
