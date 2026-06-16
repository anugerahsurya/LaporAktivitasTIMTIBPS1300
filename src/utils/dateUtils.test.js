/**
 * ═══════════════════════════════════════════════════════════
 *  TEST: dateUtils.js — Logika Periode Mingguan
 * ═══════════════════════════════════════════════════════════
 *
 *  Konvensi:
 *  - Periode di-anchor ke Minggu di AKHIR minggu kegiatan.
 *  - Contoh: Periode "21 Juni" → kegiatan Senin 15 s/d Minggu 21 Juni.
 *  - Periode aktif: Senin 12:00 → Senin berikutnya 11:59.
 *
 *  Jalankan: npx vitest run src/utils/dateUtils.test.js
 */

import { describe, it, expect } from 'vitest'
import {
  getLastSunday,
  getComingSunday,
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
// Minggu 7 Juni 2026    ← anchor periode (kegiatan 1-7 Jun)
// Senin 8 Juni → Sabtu 13 Juni
// Minggu 14 Juni 2026   ← anchor periode (kegiatan 8-14 Jun)
// Senin 15 Juni → Sabtu 20 Juni
// Minggu 21 Juni 2026   ← anchor periode (kegiatan 15-21 Jun)
// Senin 22 Juni → Sabtu 27 Juni
// Minggu 28 Juni 2026   ← anchor periode (kegiatan 22-28 Jun)

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

describe('getComingSunday', () => {
  it('mengembalikan hari itu sendiri jika Minggu', () => {
    const sunday = makeDate(2026, 6, 21)
    const result = getComingSunday(sunday)
    expect(result.getDay()).toBe(0)
    expect(result.getDate()).toBe(21)
  })

  it('mengembalikan Minggu depan jika Senin', () => {
    const monday = makeDate(2026, 6, 15)
    const result = getComingSunday(monday)
    expect(result.getDay()).toBe(0)
    expect(result.getDate()).toBe(21)
  })

  it('mengembalikan Minggu depan jika Selasa', () => {
    const tuesday = makeDate(2026, 6, 16)
    const result = getComingSunday(tuesday)
    expect(result.getDay()).toBe(0)
    expect(result.getDate()).toBe(21)
  })

  it('mengembalikan Minggu depan jika Sabtu', () => {
    const saturday = makeDate(2026, 6, 20)
    const result = getComingSunday(saturday)
    expect(result.getDay()).toBe(0)
    expect(result.getDate()).toBe(21)
  })
})

describe('getCurrentPeriod — Anchor ke Minggu akhir minggu kegiatan', () => {
  // ═══════════════════════════════════════════════════════
  //  KASUS UTAMA: Senin sebagai batas pergantian periode
  // ═══════════════════════════════════════════════════════

  it('Senin 15 Juni jam 11:00 → masih periode Minggu 14 Juni (periode lama)', () => {
    const senin_pagi = makeDate(2026, 6, 15, 11, 0)
    const result = getCurrentPeriod(senin_pagi)
    expect(formatDateISO(result)).toBe('2026-06-14')
  })

  it('Senin 15 Juni jam 11:59 → masih periode Minggu 14 Juni (belum jam 12)', () => {
    const senin_1159 = makeDate(2026, 6, 15, 11, 59)
    const result = getCurrentPeriod(senin_1159)
    expect(formatDateISO(result)).toBe('2026-06-14')
  })

  it('Senin 15 Juni jam 12:00 → periode baru: Minggu 21 Juni', () => {
    const senin_siang = makeDate(2026, 6, 15, 12, 0)
    const result = getCurrentPeriod(senin_siang)
    expect(formatDateISO(result)).toBe('2026-06-21')
  })

  it('Senin 15 Juni jam 13:00 → periode baru: Minggu 21 Juni', () => {
    const senin_sore = makeDate(2026, 6, 15, 13, 0)
    const result = getCurrentPeriod(senin_sore)
    expect(formatDateISO(result)).toBe('2026-06-21')
  })

  it('Senin 15 Juni jam 23:59 → periode baru: Minggu 21 Juni', () => {
    const senin_malam = makeDate(2026, 6, 15, 23, 59)
    const result = getCurrentPeriod(senin_malam)
    expect(formatDateISO(result)).toBe('2026-06-21')
  })

  it('Senin 15 Juni jam 00:00 → masih periode lama: Minggu 14 Juni', () => {
    const senin_dinihari = makeDate(2026, 6, 15, 0, 0)
    const result = getCurrentPeriod(senin_dinihari)
    expect(formatDateISO(result)).toBe('2026-06-14')
  })

  // ═══════════════════════════════════════════════════════
  //  KASUS: Hari lain dalam minggu (Selasa-Minggu)
  //  Semua harus menunjuk ke Minggu 21 Juni (akhir minggu)
  // ═══════════════════════════════════════════════════════

  it('Selasa 16 Juni jam 08:00 → periode Minggu 21 Juni', () => {
    const selasa = makeDate(2026, 6, 16, 8, 0)
    const result = getCurrentPeriod(selasa)
    expect(formatDateISO(result)).toBe('2026-06-21')
  })

  it('Rabu 17 Juni jam 14:00 → periode Minggu 21 Juni', () => {
    const rabu = makeDate(2026, 6, 17, 14, 0)
    const result = getCurrentPeriod(rabu)
    expect(formatDateISO(result)).toBe('2026-06-21')
  })

  it('Kamis 18 Juni jam 09:00 → periode Minggu 21 Juni', () => {
    const kamis = makeDate(2026, 6, 18, 9, 0)
    const result = getCurrentPeriod(kamis)
    expect(formatDateISO(result)).toBe('2026-06-21')
  })

  it('Jumat 19 Juni jam 16:00 → periode Minggu 21 Juni', () => {
    const jumat = makeDate(2026, 6, 19, 16, 0)
    const result = getCurrentPeriod(jumat)
    expect(formatDateISO(result)).toBe('2026-06-21')
  })

  it('Sabtu 20 Juni jam 10:00 → periode Minggu 21 Juni', () => {
    const sabtu = makeDate(2026, 6, 20, 10, 0)
    const result = getCurrentPeriod(sabtu)
    expect(formatDateISO(result)).toBe('2026-06-21')
  })

  it('Minggu 21 Juni jam 23:00 → periode Minggu 21 Juni', () => {
    const minggu = makeDate(2026, 6, 21, 23, 0)
    const result = getCurrentPeriod(minggu)
    expect(formatDateISO(result)).toBe('2026-06-21')
  })

  // ═══════════════════════════════════════════════════════
  //  KASUS: Minggu berikutnya (22-28 Juni)
  // ═══════════════════════════════════════════════════════

  it('Senin 22 Juni jam 11:00 → masih periode Minggu 21 Juni', () => {
    const senin_pagi = makeDate(2026, 6, 22, 11, 0)
    const result = getCurrentPeriod(senin_pagi)
    expect(formatDateISO(result)).toBe('2026-06-21')
  })

  it('Senin 22 Juni jam 12:00 → periode baru: Minggu 28 Juni', () => {
    const senin_siang = makeDate(2026, 6, 22, 12, 0)
    const result = getCurrentPeriod(senin_siang)
    expect(formatDateISO(result)).toBe('2026-06-28')
  })

  it('Selasa 23 Juni jam 09:00 → periode Minggu 28 Juni', () => {
    const selasa = makeDate(2026, 6, 23, 9, 0)
    const result = getCurrentPeriod(selasa)
    expect(formatDateISO(result)).toBe('2026-06-28')
  })
})

describe('getFillingRange', () => {
  it('periode 21 Juni → Senin 15 jam 12:00 sampai Senin 22 jam 11:59', () => {
    const period = makeDate(2026, 6, 21) // Minggu 21 Juni
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

  it('periode 14 Juni → Senin 8 jam 12:00 sampai Senin 15 jam 11:59', () => {
    const period = makeDate(2026, 6, 14) // Minggu 14 Juni
    const { start, end } = getFillingRange(period)

    expect(start.getDate()).toBe(8)
    expect(start.getDay()).toBe(1) // Senin
    expect(start.getHours()).toBe(12)

    expect(end.getDate()).toBe(15)
    expect(end.getDay()).toBe(1) // Senin
    expect(end.getHours()).toBe(11)
    expect(end.getMinutes()).toBe(59)
  })

  it('start selalu hari Senin (periode - 6 hari)', () => {
    const period = makeDate(2026, 6, 28) // Minggu 28 Juni
    const { start } = getFillingRange(period)
    expect(start.getDay()).toBe(1) // Senin
    expect(start.getDate()).toBe(22)
  })

  it('end selalu hari Senin (periode + 1 hari)', () => {
    const period = makeDate(2026, 6, 28) // Minggu 28 Juni
    const { end } = getFillingRange(period)
    expect(end.getDay()).toBe(1) // Senin
    expect(end.getDate()).toBe(29)
  })
})

describe('isFillingOpen — Pengecekan dengan jam', () => {
  const period = makeDate(2026, 6, 21) // Minggu 21 Juni
  // Filling: Senin 15 Juni 12:00 → Senin 22 Juni 11:59

  it('Minggu 14 Juni jam 23:59 → BELUM BUKA (sebelum periode)', () => {
    const now = makeDate(2026, 6, 14, 23, 59)
    expect(isFillingOpen(period, now)).toBe(false)
  })

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
})

describe('getCurrentPeriod cocok dengan isFillingOpen', () => {
  it('periode yang dideteksi harus filling-open pada waktu itu', () => {
    const testCases = [
      makeDate(2026, 6, 15, 12, 0),   // Senin siang → periode 21 Juni
      makeDate(2026, 6, 16, 8, 0),    // Selasa pagi → periode 21 Juni
      makeDate(2026, 6, 18, 14, 30),  // Kamis siang → periode 21 Juni
      makeDate(2026, 6, 20, 22, 0),   // Sabtu malam → periode 21 Juni
      makeDate(2026, 6, 21, 10, 0),   // Minggu pagi → periode 21 Juni
      makeDate(2026, 6, 22, 11, 0),   // Senin pagi → masih periode 21 Juni
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
    // Periode = Minggu 14 Juni, filling: Senin 8 jam 12 → Senin 15 jam 11:59
    expect(formatDateISO(period)).toBe('2026-06-14')
    expect(isFillingOpen(period, now)).toBe(true)
  })

  it('Senin jam 12 → periode baru harus filling-open', () => {
    const now = makeDate(2026, 6, 22, 12, 0)
    const period = getCurrentPeriod(now)
    expect(formatDateISO(period)).toBe('2026-06-28')
    expect(isFillingOpen(period, now)).toBe(true)
  })
})

describe('getActivityRange', () => {
  it('periode 21 Juni → kegiatan Senin 15 s/d Minggu 21 Juni', () => {
    const period = makeDate(2026, 6, 21) // Minggu 21 Juni
    const { start, end } = getActivityRange(period)

    expect(start.getDay()).toBe(1) // Senin
    expect(start.getDate()).toBe(15)
    expect(end.getDay()).toBe(0) // Minggu
    expect(end.getDate()).toBe(21)
  })

  it('periode 14 Juni → kegiatan Senin 8 s/d Minggu 14 Juni', () => {
    const period = makeDate(2026, 6, 14)
    const { start, end } = getActivityRange(period)

    expect(start.getDay()).toBe(1) // Senin
    expect(start.getDate()).toBe(8)
    expect(end.getDay()).toBe(0) // Minggu
    expect(end.getDate()).toBe(14)
  })
})

describe('Format functions', () => {
  it('formatDate: format Indonesia', () => {
    const d = makeDate(2026, 6, 21)
    expect(formatDate(d)).toBe('21 Juni 2026')
  })

  it('formatDateShort: format pendek', () => {
    const d = makeDate(2026, 6, 21)
    expect(formatDateShort(d)).toBe('21 Jun')
  })

  it('formatDateISO: format ISO', () => {
    const d = makeDate(2026, 6, 21)
    expect(formatDateISO(d)).toBe('2026-06-21')
  })

  it('formatDateISO: padding bulan dan tanggal', () => {
    const d = makeDate(2026, 1, 5)
    expect(formatDateISO(d)).toBe('2026-01-05')
  })

  it('parseISO: parse string ISO', () => {
    const d = parseISO('2026-06-21')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(5) // Juni = 5
    expect(d.getDate()).toBe(21)
  })

  it('getDayName: nama hari Indonesia', () => {
    expect(getDayName(makeDate(2026, 6, 21))).toBe('Minggu')
    expect(getDayName(makeDate(2026, 6, 15))).toBe('Senin')
    expect(getDayName(makeDate(2026, 6, 16))).toBe('Selasa')
  })

  it('getPeriodLabel: label periode', () => {
    const d = makeDate(2026, 6, 21)
    expect(getPeriodLabel(d)).toBe('Minggu, 21 Juni 2026')
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

describe('Kasus khusus: Hari ini (16 Juni 2026 jam 21:36 WIB)', () => {
  it('16 Juni 2026 (Selasa) jam 21:36 → periode Minggu 21 Juni', () => {
    const now = makeDate(2026, 6, 16, 21, 36)
    const result = getCurrentPeriod(now)
    expect(formatDateISO(result)).toBe('2026-06-21')
  })

  it('isFillingOpen untuk periode 21 Juni pada 16 Juni jam 21:36 → BUKA', () => {
    const period = makeDate(2026, 6, 21)
    const now = makeDate(2026, 6, 16, 21, 36)
    expect(isFillingOpen(period, now)).toBe(true)
  })

  it('activityRange untuk periode 21 Juni → 15 Juni s/d 21 Juni', () => {
    const period = makeDate(2026, 6, 21)
    const { start, end } = getActivityRange(period)
    expect(formatDate(start)).toBe('15 Juni 2026')
    expect(formatDate(end)).toBe('21 Juni 2026')
  })
})
