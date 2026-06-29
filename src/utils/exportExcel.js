import * as XLSX from 'xlsx'
import { config } from '../config'

export function exportToExcel(activities, periodLabel, teamName = '', periodPrefix = '', allActivities = null, prevActivities = []) {
  const groupedActivities = groupActivitiesForPrev(prevActivities || [])
  const groupedTargets = groupActivities(activities, 'target_minggu_depan')

  const kegiatanRows = groupedActivities.length > 0 
    ? groupedActivities.map((item, idx) => ({
        'No': idx + 1,
        'Uraian': item.text,
        'Nama Pegawai': item.contributors.join(', '),
        'Keterangan Tim': item.tim === 'lainnya' ? 'Tim Lainnya' : 'Tim Utama'
      }))
    : [{ 'No': '-', 'Uraian': 'Belum ada kegiatan yang dilaporkan.', 'Nama Pegawai': '-', 'Keterangan Tim': '-' }]

  const targetRows = groupedTargets.length > 0
    ? groupedTargets.map((item, idx) => ({
        'No': idx + 1,
        'Uraian': item.text,
        'Nama Pegawai': item.contributors.join(', '),
        'Keterangan Tim': item.tim === 'lainnya' ? 'Tim Lainnya' : 'Tim Utama'
      }))
    : [{ 'No': '-', 'Uraian': 'Belum ada rencana kegiatan minggu ini yang dilaporkan.', 'Nama Pegawai': '-', 'Keterangan Tim': '-' }]

  // Use allActivities for global attendance summary across all employees
  const attendanceSrc = allActivities || activities
  const attendanceMap = {}
  const filledIds = new Set()
  attendanceSrc.forEach(act => {
    const empId = String(act.pegawai_id)
    filledIds.add(empId)
    if (act.kehadiran) {
      attendanceMap[empId] = act.kehadiran
    }
  })

  let countHadir = 0
  let countCuti = 0
  let countIzin = 0
  let countBelumIsi = 0

  config.employees.forEach(emp => {
    const empId = String(emp.id)
    const filled = filledIds.has(empId)
    if (!filled) {
      countBelumIsi++
    } else {
      const kehadiran = attendanceMap[empId] || 'Hadir'
      if (kehadiran === 'Hadir') {
        countHadir++
      } else if (kehadiran === 'Cuti') {
        countCuti++
      } else if (kehadiran === 'Izin') {
        countIzin++
      }
    }
  })

  const displayHadir = countHadir > 0 ? countHadir : '-'
  const displayCuti = countCuti > 0 ? countCuti : '-'
  const displayIzin = countIzin > 0 ? countIzin : '-'
  const displayBelumIsi = countBelumIsi > 0 ? countBelumIsi : '-'

  const displayTeamName = teamName || config.team.name

  const wb = XLSX.utils.book_new()
  const wsRows = []

  wsRows.push([`REKAP AKTIVITAS MINGGUAN ${displayTeamName.toUpperCase()}`])
  wsRows.push([`${config.team.institution}`])
  wsRows.push([`Periode: ${periodLabel}`])
  wsRows.push([`Kehadiran Senin Tim IT: Hadir: ${displayHadir} | Cuti: ${displayCuti} | Izin: ${displayIzin} | Tanpa Keterangan: ${displayBelumIsi}`])
  wsRows.push([])

  if (kegiatanRows.length > 0) {
    wsRows.push(['Kegiatan Minggu Lalu'])
    wsRows.push(['No', 'Kegiatan', 'Nama Pegawai', 'Keterangan Tim'])
    kegiatanRows.forEach(row => {
      wsRows.push([row.No, row.Uraian, row['Nama Pegawai'], row['Keterangan Tim']])
    })
    wsRows.push([])
  }

  if (targetRows.length > 0) {
    wsRows.push(['Rencana Kegiatan Minggu Ini'])
    wsRows.push(['No', 'Target', 'Nama Pegawai', 'Keterangan Tim'])
    targetRows.forEach(row => {
      wsRows.push([row.No, row.Uraian, row['Nama Pegawai'], row['Keterangan Tim']])
    })
  }

  const ws = XLSX.utils.aoa_to_sheet(wsRows)

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } },
  ]

  ws['!cols'] = [
    { wch: 5 },
    { wch: 50 },
    { wch: 30 },
    { wch: 18 },
  ]

  const range = XLSX.utils.decode_range(ws['!ref'])
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = XLSX.utils.encode_cell({ r: R, c: C })
      if (!ws[cell]) continue

      ws[cell].s = {
        font: { name: config.export.fontFamily },
        alignment: { vertical: 'top', wrapText: true }
      }

      if (ws[cell].v === 'No' || ws[cell].v === 'Kegiatan' || ws[cell].v === 'Target' || ws[cell].v === 'Nama Pegawai' || ws[cell].v === 'Keterangan Tim') {
        ws[cell].s.font.bold = true
        ws[cell].s.fill = { fgColor: { rgb: config.export.headerColor.toUpperCase() } }
        ws[cell].s.font.color = { rgb: 'FFFFFF' }
        ws[cell].s.alignment.horizontal = 'center'
        ws[cell].s.border = getBorder()
      }
      else if (ws[cell].v === 'Kegiatan Minggu Lalu' || ws[cell].v === 'Rencana Kegiatan Minggu Ini') {
        ws[cell].s.font.bold = true
        ws[cell].s.font.color = { rgb: '16A34A' }
      }
      else if (typeof ws[cell].v === 'number' || (ws[cell].v && R > 4 && ws[cell].v !== 'REKAP AKTIVITAS MINGGUAN' && !ws[cell].v.toString().startsWith('Periode'))) {
        ws[cell].s.border = getBorder()
      }
    }
  }

  function getBorder() {
    return {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Aktivitas')

  // Filename: DDMMYYYY-Rekap Aktivitas [Team Name].xlsx
  const prefix = periodPrefix || periodLabel.replace(/[,\s]+/g, '_')
  const filename = `${prefix}-Rekap Aktivitas ${displayTeamName}.xlsx`
  XLSX.writeFile(wb, filename)
}

/**
 * Same as exportToExcel but returns { filename, blob } for ZIP bundling
 */
export function exportToExcelBlob(activities, periodLabel, teamName = '', periodPrefix = '', allActivities = null, prevActivities = []) {
  const groupedActivities = groupActivitiesForPrev(prevActivities || [])
  const groupedTargets = groupActivities(activities, 'target_minggu_depan')

  const kegiatanRows = groupedActivities.length > 0
    ? groupedActivities.map((item, idx) => ({
        'No': idx + 1,
        'Uraian': item.text,
        'Nama Pegawai': item.contributors.join(', '),
        'Keterangan Tim': item.tim === 'lainnya' ? 'Tim Lainnya' : 'Tim Utama'
      }))
    : [{ 'No': '-', 'Uraian': 'Belum ada kegiatan minggu lalu yang dilaporkan.', 'Nama Pegawai': '-', 'Keterangan Tim': '-' }]

  const targetRows = groupedTargets.length > 0
    ? groupedTargets.map((item, idx) => ({
        'No': idx + 1,
        'Uraian': item.text,
        'Nama Pegawai': item.contributors.join(', '),
        'Keterangan Tim': item.tim === 'lainnya' ? 'Tim Lainnya' : 'Tim Utama'
      }))
    : [{ 'No': '-', 'Uraian': 'Belum ada rencana kegiatan minggu ini yang dilaporkan.', 'Nama Pegawai': '-', 'Keterangan Tim': '-' }]

  const attendanceSrc = allActivities || activities
  const attendanceMap = {}
  const filledIds = new Set()
  attendanceSrc.forEach(act => {
    const empId = String(act.pegawai_id)
    filledIds.add(empId)
    if (act.kehadiran) {
      attendanceMap[empId] = act.kehadiran
    }
  })

  let countHadir = 0
  let countCuti = 0
  let countIzin = 0
  let countBelumIsi = 0

  config.employees.forEach(emp => {
    const empId = String(emp.id)
    const filled = filledIds.has(empId)
    if (!filled) {
      countBelumIsi++
    } else {
      const kehadiran = attendanceMap[empId] || 'Hadir'
      if (kehadiran === 'Hadir') countHadir++
      else if (kehadiran === 'Cuti') countCuti++
      else if (kehadiran === 'Izin') countIzin++
    }
  })

  const displayHadir = countHadir > 0 ? countHadir : '-'
  const displayCuti = countCuti > 0 ? countCuti : '-'
  const displayIzin = countIzin > 0 ? countIzin : '-'
  const displayBelumIsi = countBelumIsi > 0 ? countBelumIsi : '-'

  const displayTeamName = teamName || config.team.name

  const wb = XLSX.utils.book_new()
  const wsRows = []

  wsRows.push([`REKAP AKTIVITAS MINGGUAN ${displayTeamName.toUpperCase()}`])
  wsRows.push([`${config.team.institution}`])
  wsRows.push([`Periode: ${periodLabel}`])
  wsRows.push([`Kehadiran Senin Tim IT: Hadir: ${displayHadir} | Cuti: ${displayCuti} | Izin: ${displayIzin} | Tanpa Keterangan: ${displayBelumIsi}`])
  wsRows.push([])

  if (kegiatanRows.length > 0) {
    wsRows.push(['Kegiatan Minggu Lalu'])
    wsRows.push(['No', 'Kegiatan', 'Nama Pegawai', 'Keterangan Tim'])
    kegiatanRows.forEach(row => {
      wsRows.push([row.No, row.Uraian, row['Nama Pegawai'], row['Keterangan Tim']])
    })
    wsRows.push([])
  }

  if (targetRows.length > 0) {
    wsRows.push(['Rencana Kegiatan Minggu Ini'])
    wsRows.push(['No', 'Target', 'Nama Pegawai', 'Keterangan Tim'])
    targetRows.forEach(row => {
      wsRows.push([row.No, row.Uraian, row['Nama Pegawai'], row['Keterangan Tim']])
    })
  }

  const ws = XLSX.utils.aoa_to_sheet(wsRows)

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } },
  ]

  ws['!cols'] = [
    { wch: 5 },
    { wch: 50 },
    { wch: 30 },
    { wch: 18 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Aktivitas')

  const prefix = periodPrefix || periodLabel.replace(/[,\s]+/g, '_')
  const filename = `${prefix}-Rekap Aktivitas ${displayTeamName}.xlsx`
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return { filename, blob: new Uint8Array(wbout) }
}

function groupActivities(activities, keyField) {
  const map = new Map()
  activities.forEach(act => {
    if (!act[keyField]) return

    const key = act[keyField]
    if (map.has(key)) {
      const existing = map.get(key)
      if (!existing.contributors.includes(act.pegawai_nama)) {
        existing.contributors.push(act.pegawai_nama)
      }
    } else {
      map.set(key, {
        text: key,
        contributors: [act.pegawai_nama],
        tim: act.tim
      })
    }
  })
  return Array.from(map.values())
}

function groupActivitiesForPrev(activities) {
  const map = new Map()
  activities.forEach(act => {
    const key = (act.kegiatan || act.target_minggu_depan || '').trim()
    if (!key) return

    if (map.has(key)) {
      const existing = map.get(key)
      if (!existing.contributors.includes(act.pegawai_nama)) {
        existing.contributors.push(act.pegawai_nama)
      }
    } else {
      map.set(key, {
        text: key,
        contributors: [act.pegawai_nama],
        tim: act.tim
      })
    }
  })
  return Array.from(map.values())
}
