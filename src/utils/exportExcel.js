import * as XLSX from 'xlsx'
import { config } from '../config'

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

function buildExcelRows(activities, periodLabel, teamName, allActivities, prevActivities) {
  const groupedActivities = groupActivitiesForPrev(prevActivities || [])
  const groupedTargets = groupActivities(activities, 'target_minggu_depan')

  const kegiatanUtama = groupedActivities.filter(a => a.tim !== 'lainnya')
  const kegiatanLainnya = groupedActivities.filter(a => a.tim === 'lainnya')
  
  const targetUtama = groupedTargets.filter(a => a.tim !== 'lainnya')
  const targetLainnya = groupedTargets.filter(a => a.tim === 'lainnya')

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

  const wsRows = []
  
  wsRows.push([`REKAP AKTIVITAS MINGGUAN ${displayTeamName.toUpperCase()}`])
  wsRows.push([`${config.team.institution}`])
  wsRows.push([`Periode: ${periodLabel}`])
  wsRows.push([`Kehadiran Senin Tim IT: Hadir: ${displayHadir} | Cuti: ${displayCuti} | Izin: ${displayIzin} | Tanpa Keterangan: ${displayBelumIsi}`])
  wsRows.push([])

  // Helper to add sections
  function addSection(title, utamaList, lainnyaList, colTitle) {
    wsRows.push([title])
    wsRows.push(['A. Utama', ''])
    wsRows.push(['No', colTitle])
    if (utamaList.length > 0) {
      utamaList.forEach((item, idx) => {
        wsRows.push([idx + 1, item.text])
      })
    } else {
      wsRows.push(['-', 'Belum ada data.'])
    }
    
    wsRows.push([]) // empty row
    wsRows.push(['B. Lainnya', ''])
    wsRows.push(['No', colTitle])
    if (lainnyaList.length > 0) {
      lainnyaList.forEach((item, idx) => {
        wsRows.push([idx + 1, item.text])
      })
    } else {
      wsRows.push(['-', 'Belum ada data.'])
    }
    wsRows.push([])
  }

  addSection('Kegiatan Minggu Lalu', kegiatanUtama, kegiatanLainnya, 'Kegiatan')
  addSection('Rencana Kegiatan Minggu Ini', targetUtama, targetLainnya, 'Target')

  return wsRows
}

function applyStyles(ws) {
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } },
  ]

  ws['!cols'] = [
    { wch: 10 },
    { wch: 120 },
  ]

  const range = XLSX.utils.decode_range(ws['!ref'])
  let currentGroup = ''
  
  for (let R = range.s.r; R <= range.e.r; R++) {
    const rowTitleCell = ws[XLSX.utils.encode_cell({ r: R, c: 0 })]
    if (rowTitleCell && rowTitleCell.v === 'A. Utama') {
      currentGroup = 'Utama'
      ws['!merges'].push({ s: { r: R, c: 0 }, e: { r: R, c: 1 } })
    }
    if (rowTitleCell && rowTitleCell.v === 'B. Lainnya') {
      currentGroup = 'Lainnya'
      ws['!merges'].push({ s: { r: R, c: 0 }, e: { r: R, c: 1 } })
    }

    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = XLSX.utils.encode_cell({ r: R, c: C })
      if (!ws[cell]) continue

      ws[cell].s = {
        font: { name: config.export.fontFamily },
        alignment: { vertical: 'top', wrapText: true }
      }

      if (ws[cell].v === 'No' || ws[cell].v === 'Kegiatan' || ws[cell].v === 'Target') {
        ws[cell].s.font.bold = true
        if (currentGroup === 'Lainnya') {
          ws[cell].s.fill = { fgColor: { rgb: '6B7280' } } // gray-500
        } else {
          ws[cell].s.fill = { fgColor: { rgb: config.export.headerColor.replace('#', '').toUpperCase() } }
        }
        ws[cell].s.font.color = { rgb: 'FFFFFF' }
        ws[cell].s.alignment.horizontal = 'center'
        ws[cell].s.border = getBorder()
      }
      else if (rowTitleCell && (rowTitleCell.v === 'A. Utama' || rowTitleCell.v === 'B. Lainnya')) {
        ws[cell].s.font.bold = true
        ws[cell].s.fill = { fgColor: { rgb: currentGroup === 'Lainnya' ? '6B7280' : config.export.headerColor.replace('#', '').toUpperCase() } }
        ws[cell].s.font.color = { rgb: 'FFFFFF' }
        ws[cell].s.alignment.horizontal = 'left'
        ws[cell].s.border = getBorder()
      }
      else if (ws[cell].v === 'Kegiatan Minggu Lalu' || ws[cell].v === 'Rencana Kegiatan Minggu Ini') {
        ws[cell].s.font.bold = true
        ws[cell].s.font.color = { rgb: '16A34A' }
      }
      else if (ws[cell].v === 'A. Utama' || ws[cell].v === 'B. Lainnya') {
        ws[cell].s.font.bold = true
        ws[cell].s.font.color = { rgb: currentGroup === 'Lainnya' ? '6B7280' : config.export.headerColor.replace('#', '').toUpperCase() }
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
}

export function exportToExcel(activities, periodLabel, teamName = '', periodPrefix = '', allActivities = null, prevActivities = []) {
  const wsRows = buildExcelRows(activities, periodLabel, teamName, allActivities, prevActivities)
  const ws = XLSX.utils.aoa_to_sheet(wsRows)
  applyStyles(ws)

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Aktivitas')

  const displayTeamName = teamName || config.team.name
  const prefix = periodPrefix || periodLabel.replace(/[,\s]+/g, '_')
  const filename = `${prefix}-Rekap Aktivitas ${displayTeamName}.xlsx`
  XLSX.writeFile(wb, filename)
}

/**
 * Same as exportToExcel but returns { filename, blob } for ZIP bundling
 */
export function exportToExcelBlob(activities, periodLabel, teamName = '', periodPrefix = '', allActivities = null, prevActivities = []) {
  const wsRows = buildExcelRows(activities, periodLabel, teamName, allActivities, prevActivities)
  const ws = XLSX.utils.aoa_to_sheet(wsRows)
  applyStyles(ws)

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Aktivitas')

  const displayTeamName = teamName || config.team.name
  const prefix = periodPrefix || periodLabel.replace(/[,\s]+/g, '_')
  const filename = `${prefix}-Rekap Aktivitas ${displayTeamName}.xlsx`
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return { filename, blob: new Uint8Array(wbout) }
}
