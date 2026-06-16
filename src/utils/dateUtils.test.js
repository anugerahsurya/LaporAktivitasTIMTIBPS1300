/**
 * ═══════════════════════════════════════════════════════════
 *  TEST: dateUtils.js — Logika Periode Mingguan
 * ═══════════════════════════════════════════════════════════
 *
 *  Menguji bahwa:
 *  1. getCurrentPeriod() mengembalikan anchor Minggu yang benar
 *     berdasarkan hari dan JAM saat ini.
 *  2. Periode aktif: Senin 12:00 → Senin berikutnya 11:59.
 *  3. isFillingOpen() menggunakan waktu (jam) untuk pengecekan.
 *  4. getFillingRange() mengembalikan range yang benar.
 *  5. Format tanggal tetap benar.
 *
 *  Jalankan: npx vitest run src/utils/dateUtils.test.js
 */

import { describe, it, expect } from 'vitest'
import {
  getLastSunday,
  getCurrentPeriod,
  getFillingRange,
  isFillingOpen,
  formatDate,
  formatDateShort,
  formatDateISO,
  parseISO,
  getDayName,
  getPeriodLabel,
  getActivityRange,
  getRecentPeriods,
} from './dateUtils.js'

// ─── Helper: Buat Date dengan jam tertentu ──────────────
function makeDate(year, month, day, hour = 0, minute = 0) {
  return new Date(year, month - 1, day, hour, minute, 0, 0)
}

// ─── Referensi kalender Juni 2026 ───────────────────────
// Minggu 7 Juni 2026
// Senin 8 Juni → Sabtu 13 Juni
// Minggu 14 Juni 2026
// Senin 15 Juni → Sabtu 20 Juni
// Minggu 21 Juni 2026
// Senin 22 Juni → Sabtu 27 Juni

describe('getLastSunday', () => {
  it('mengembalikan hari itu sendiri jika Minggu', () => {
    const sunday = makeDate(2026, 6, 14) // Minggu
    const result = getLastSunday(sunday)
    expect(result.getDay()).toBe(0)
    expect(result.getDate()).toBe(14)
  })

  it('mengembalikan Minggu kemarin jika hari Senin', () => {
    const monday = makeDate(2026, 6, 15) // Senin
    const result = getLastSunday(monday)
    expect(result.getDay()).toBe(0)
    expect(result.getDate()).toBe(14)
  })

  it('mengembalikan Minggu kemarin jika hari Rabu', () => {
    const wednesday = makeDate(2026, 6, 17) // Rabu
    const result = getLastSunday(wednesday)
    expect(result.getDay()).toBe(0)
    expect(result.getDate()).toBe(14)
  })

  it('mengembalikan Minggu kemarin jika hari Sabtu', () => {
    const saturday = makeDate(2026, 6, 20) // Sabtu
    const result = getLastSunday(saturday)
    expect(result.getDay()).toBe(0)
    expect(result.getDate()).toBe(14)
  })
})

describe('getCurrentPeriod — Aturan Senin Jam 12:00', () => {
  // ═══════════════════════════════════════════════════════
  //  KASUS UTAMA: Senin sebagai batas pergantian periode
  // ═══════════════════════════════════════════════════════

  it('Senin 15 Juni jam 11:00 → masih periode Minggu 7 Juni (periode lama)', () => {
    const senin_pagi = makeDate(2026, 6, 15, 11, 0)
    const result = getCurrentPeriod(senin_pagi)
    expect(formatDateISO(result)).toBe('2026-06-07')
  })

  it('Senin 15 Juni jam 11:59 → masih periode Minggu 7 Juni (belum jam 12)', () => {
    const senin_1159 = makeDate(2026, 6, 15, 11, 59)
    const result = getCurrentPeriod(senin_1159)
    expect(formatDateISO(result)).toBe('2026-06-07')
  })

  it('Senin 15 Juni jam 12:00 → periode baru: Minggu 14 Juni', () => {
    const senin_siang = makeDate(2026, 6, 15, 12, 0)
    const result = getCurrentPeriod(senin_siang)
    expect(formatDateISO(result)).toBe('2026-06-14')
  })

  it('Senin 15 Juni jam 13:00 → periode baru: Minggu 14 Juni', () => {
    const senin_sore = makeDate(2026, 6, 15, 13, 0)
    const result = getCurrentPeriod(senin_sore)
    expect(formatDateISO(result)).toBe('2026-06-14')
  })

  it('Senin 15 Juni jam 23:59 → periode baru: Minggu 14 Juni', () => {
    const senin_malam = makeDate(2026, 6, 15, 23, 59)
    const result = getCurrentPeriod(senin_malam)
    expect(formatDateISO(result)).toBe('2026-06-14')
  })

  it('Senin 15 Juni jam 00:00 → masih periode lama: Minggu 7 Juni', () => {
    const senin_dinihari = makeDate(2026, 6, 15, 0, 0)
    const result = getCurrentPeriod(senin_dinihari)
    expect(formatDateISO(result)).toBe('2026-06-07')
  })

  // ═══════════════════════════════════════════════════════
  //  KASUS: Hari lain dalam minggu (Selasa-Minggu)
  // ═══════════════════════════════════════════════════════

  it('Selasa 16 Juni jam 08:00 → periode Minggu 14 Juni', () => {
    const selasa = makeDate(2026, 6, 16, 8, 0)
    const result = getCurrentPeriod(selasa)
    expect(formatDateISO(result)).toBe('2026-06-14')
  })

  it('Rabu 17 Juni jam 14:00 → periode Minggu 14 Juni', () => {
    const rabu = makeDate(2026, 6, 17, 14, 0)
    const result = getCurrentPeriod(rabu)
    expect(formatDateISO(result)).toBe('2026-06-14')
  })

  it('Kamis 18 Juni jam 09:00 → periode Minggu 14 Juni', () => {
    const kamis = makeDate(2026, 6, 18, 9, 0)
    const result = getCurrentPeriod(kamis)
    expect(formatDateISO(result)).toBe('2026-06-14')
  })

  it('Jumat 19 Juni jam 16:00 → periode Minggu 14 Juni', () => {
    const jumat = makeDate(2026, 6, 19, 16, 0)
    const result = getCurrentPeriod(jumat)
    expect(formatDateISO(result)).toBe('2026-06-14')
  })

  it('Sabtu 20 Juni jam 10:00 → periode Minggu 14 Juni', () => {
    const sabtu = makeDate(2026, 6, 20, 10, 0)
    const result = getCurrentPeriod(sabtu)
    expect(formatDateISO(result)).toBe('2026-06-14')
  })

  it('Minggu 21 Juni jam 23:00 → periode Minggu 21 Juni (hari ini Minggu)', () => {
    const minggu = makeDate(2026, 6, 21, 23, 0)
    const result = getCurrentPeriod(minggu)
    expect(formatDateISO(result)).toBe('2026-06-21')
  })

  // ═══════════════════════════════════════════════════════
  //  KASUS: Minggu berikutnya (22 Juni)
  // ═══════════════════════════════════════════════════════

  it('Senin 22 Juni jam 11:00 → masih periode Minggu 14 Juni', () => {
    const senin_pagi = makeDate(2026, 6, 22, 11, 0)
    const result = getCurrentPeriod(senin_pagi)
    expect(formatDateISO(result)).toBe('2026-06-14')
  })

  it('Senin 22 Juni jam 12:00 → periode baru: Minggu 21 Juni', () => {
    const senin_siang = makeDate(2026, 6, 22, 12, 0)
    const result = getCurrentPeriod(senin_siang)
    expect(formatDateISO(result)).toBe('2026-06-21')
  })
})

describe('getFillingRange', () => {
  it('mengembalikan Senin jam 12:00 sampai Senin berikutnya jam 11:59', () => {
    const period = makeDate(2026, 6, 14) // Minggu 14 Juni
    const { start, end } = getFillingRange(period)

    // Start: Senin 15 Juni jam 12:00
    expect(start.getDate()).toBe(15)
    expect(start.getDay()).toBe(1) // Senin
    expect(start.getHours()).toBe(12)
    expect(start.getMinutes()).toBe(0)

    // End: Senin 22 Juni jam 11:59
    expect(end.getDate()).toBe(22)
    expect(end.getDay()).toBe(1) // Senin
    expect(end.getHours()).toBe(11)
    expect(end.getMinutes()).toBe(59)
  })

  it('tanggal start selalu hari Senin', () => {
    const period = makeDate(2026, 6, 7) // Minggu 7 Juni
    const { start } = getFillingRange(period)
    expect(start.getDay()).toBe(1)
    expect(start.getDate()).toBe(8)
  })

  it('tanggal end selalu hari Senin (minggu depan)', () => {
    const period = makeDate(2026, 6, 7) // Minggu 7 Juni
    const { end } = getFillingRange(period)
    expect(end.getDay()).toBe(1)
    expect(end.getDate()).toBe(15)
  })
})

describe('isFillingOpen — Pengecekan dengan jam', () => {
  const period = makeDate(2026, 6, 14) // Minggu 14 Juni
  // Filling: Senin 15 Juni 12:00 → Senin 22 Juni 11:59

  it('Senin 15 Juni jam 11:59 → BELUM BUKA (sebelum jam 12)', () => {
    const now = makeDate(2026, 6, 15, 11, 59)
    expect(isFillingOpen(period, now)).toBe(false)
  })

  it('Senin 15 Juni jam 12:00 → SUDAH BUKA', () => {
    const now = makeDate(2026, 6, 15, 12, 0)
    expect(isFillingOpen(period, now)).toBe(true)
  })

  it('Selasa 16 Juni jam 08:00 → BUKA', () => {
    const now = makeDate(2026, 6, 16, 8, 0)
    expect(isFillingOpen(period, now)).toBe(true)
  })

  it('Rabu 17 Juni jam 14:00 → BUKA', () => {
    const now = makeDate(2026, 6, 17, 14, 0)
    expect(isFillingOpen(period, now)).toBe(true)
  })

  it('Minggu 21 Juni jam 23:59 → BUKA', () => {
    const now = makeDate(2026, 6, 21, 23, 59)
    expect(isFillingOpen(period, now)).toBe(true)
  })

  it('Senin 22 Juni jam 11:59 → MASIH BUKA (batas akhir)', () => {
    const now = makeDate(2026, 6, 22, 11, 59)
    expect(isFillingOpen(period, now)).toBe(true)
  })

  it('Senin 22 Juni jam 12:00 → SUDAH TUTUP', () => {
    const now = makeDate(2026, 6, 22, 12, 0)
    expect(isFillingOpen(period, now)).toBe(false)
  })

  it('Senin 22 Juni jam 13:00 → TUTUP', () => {
    const now = makeDate(2026, 6, 22, 13, 0)
    expect(isFillingOpen(period, now)).toBe(false)
  })

  it('Sabtu 13 Juni jam 23:00 → BELUM BUKA (sebelum periode dimulai)', () => {
    const now = makeDate(2026, 6, 13, 23, 0)
    expect(isFillingOpen(period, now)).toBe(false)
  })
})

describe('getCurrentPeriod cocok dengan isFillingOpen', () => {
  it('periode yang dideteksi harus filling-open pada waktu itu', () => {
    // Ambil beberapa waktu sample dan pastikan konsisten
    const testCases = [
      makeDate(2026, 6, 15, 12, 0),   // Senin siang → periode baru
      makeDate(2026, 6, 16, 8, 0),    // Selasa pagi
      makeDate(2026, 6, 18, 14, 30),  // Kamis siang
      makeDate(2026, 6, 20, 22, 0),   // Sabtu malam
      makeDate(2026, 6, 22, 11, 0),   // Senin pagi (masih periode lama)
    ]

    for (const now of testCases) {
      const period = getCurrentPeriod(now)
      const open = isFillingOpen(period, now)
      expect(open, `Pada ${now.toLocaleString()}, periode ${formatDateISO(period)} harus buka`).toBe(true)
    }
  })

  it('Senin sebelum jam 12 → periode sebelumnya harus filling-open', () => {
    const now = makeDate(2026, 6, 15, 11, 0)
    const period = getCurrentPeriod(now)
    // Periode = Minggu 7 Juni, filling: Senin 8 jam 12 → Senin 15 jam 11:59
    expect(formatDateISO(period)).toBe('2026-06-07')
    expect(isFillingOpen(period, now)).toBe(true)
  })
})

describe('getActivityRange', () => {
  it('mengembalikan Senin s/d Minggu untuk periode anchor Minggu', () => {
    const period = makeDate(2026, 6, 14) // Minggu 14 Juni
    const { start, end } = getActivityRange(period)

    expect(start.getDay()).toBe(1) // Senin
    expect(start.getDate()).toBe(8)
    expect(end.getDay()).toBe(0) // Minggu
    expect(end.getDate()).toBe(14)
  })
})

describe('Format functions', () => {
  it('formatDate: format Indonesia', () => {
    const d = makeDate(2026, 6, 14)
    expect(formatDate(d)).toBe('14 Juni 2026')
  })

  it('formatDateShort: format pendek', () => {
    const d = makeDate(2026, 6, 14)
    expect(formatDateShort(d)).toBe('14 Jun')
  })

  it('formatDateISO: format ISO', () => {
    const d = makeDate(2026, 6, 14)
    expect(formatDateISO(d)).toBe('2026-06-14')
  })

  it('formatDateISO: padding bulan dan tanggal', () => {
    const d = makeDate(2026, 1, 5)
    expect(formatDateISO(d)).toBe('2026-01-05')
  })

  it('parseISO: parse string ISO', () => {
    const d = parseISO('2026-06-14')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(5) // Juni = 5
    expect(d.getDate()).toBe(14)
  })

  it('getDayName: nama hari Indonesia', () => {
    expect(getDayName(makeDate(2026, 6, 14))).toBe('Minggu')
    expect(getDayName(makeDate(2026, 6, 15))).toBe('Senin')
    expect(getDayName(makeDate(2026, 6, 16))).toBe('Selasa')
  })

  it('getPeriodLabel: label periode', () => {
    const d = makeDate(2026, 6, 14)
    expect(getPeriodLabel(d)).toBe('Minggu, 14 Juni 2026')
  })
})

describe('getRecentPeriods', () => {
  it('mengembalikan jumlah periode yang diminta', () => {
    const periods = getRecentPeriods(5)
    expect(periods.length).toBe(5)
  })

  it('semua tanggal adalah hari Minggu', () => {
    const periods = getRecentPeriods(8)
    for (const p of periods) {
      expect(p.getDay()).toBe(0)
    }
  })

  it('periode berurutan mundur 7 hari', () => {
    const periods = getRecentPeriods(4)
    for (let i = 1; i < periods.length; i++) {
      const diff = periods[i - 1].getTime() - periods[i].getTime()
      expect(diff).toBe(7 * 24 * 60 * 60 * 1000)
    }
  })
})

describe('Kasus khusus: Hari ini (16 Juni 2026 jam 21:28 WIB)', () => {
  it('16 Juni 2026 (Selasa) jam 21:28 → periode Minggu 14 Juni', () => {
    // Ini sesuai waktu saat user bertanya
    const now = makeDate(2026, 6, 16, 21, 28)
    const result = getCurrentPeriod(now)
    expect(formatDateISO(result)).toBe('2026-06-14')
  })

  it('isFillingOpen untuk periode 14 Juni pada 16 Juni jam 21:28 → BUKA', () => {
    const period = makeDate(2026, 6, 14)
    const now = makeDate(2026, 6, 16, 21, 28)
    expect(isFillingOpen(period, now)).toBe(true)
  })
})
