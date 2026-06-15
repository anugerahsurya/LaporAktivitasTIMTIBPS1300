import * as XLSX from 'xlsx'
import { config } from '../config'

/**
 * Export kegiatan ke file Excel (.xlsx) dengan format terpisah untuk Kegiatan dan Target.
 */
export function exportToExcel(activities, periodLabel) {
  // Group activities
  const groupedActivities = groupActivities(activities, 'kegiatan')
  const groupedTargets = groupActivities(activities, 'target_minggu_depan')

  // Prepare data rows for Kegiatan
  const kegiatanRows = groupedActivities.map((item, idx) => ({
    'No': idx + 1,
    'Uraian': item.text,
    'Kontributor': item.contributors.join(', '),
  }))

  // Prepare data rows for Target
  const targetRows = groupedTargets.map((item, idx) => ({
    'No': idx + 1,
    'Uraian': item.text,
    'Kontributor': item.contributors.join(', '),
  }))

  const wb = XLSX.utils.book_new()
  const wsRows = []

  // Add title rows
  wsRows.push([`REKAP AKTIVITAS MINGGUAN ${config.team.name.toUpperCase()}`])
  wsRows.push([`${config.team.institution}`])
  wsRows.push([`Periode: ${periodLabel}`])
  wsRows.push([]) // empty

  // Section 1: Kegiatan
  if (kegiatanRows.length > 0) {
    wsRows.push(['KERJAAN SEMINGGU SEBELUMNYA'])
    wsRows.push(['No', 'Kegiatan', 'Kontributor'])
    kegiatanRows.forEach(row => {
      wsRows.push([row.No, row.Uraian, row.Kontributor])
    })
    wsRows.push([])
  }

  // Section 2: Target
  if (targetRows.length > 0) {
    wsRows.push(['TARGET MINGGU DEPAN'])
    wsRows.push(['No', 'Target', 'Kontributor'])
    targetRows.forEach(row => {
      wsRows.push([row.No, row.Uraian, row.Kontributor])
    })
  }

  const ws = XLSX.utils.aoa_to_sheet(wsRows)

  // Merges
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
  ]

  // Column widths
  ws['!cols'] = [
    { wch: 5 },   // No
    { wch: 60 },  // Uraian
    { wch: 30 },  // Kontributor
  ]

  // Add styles via sheetjs style format (requires pro/styling build usually, but we set it up)
  const range = XLSX.utils.decode_range(ws['!ref'])
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = XLSX.utils.encode_cell({ r: R, c: C })
      if (!ws[cell]) continue

      ws[cell].s = {
        font: { name: config.export.fontFamily },
        alignment: { vertical: 'top', wrapText: true }
      }

      // If it's a table header (e.g. "No")
      if (ws[cell].v === 'No' || ws[cell].v === 'Kegiatan' || ws[cell].v === 'Target' || ws[cell].v === 'Kontributor') {
        ws[cell].s.font.bold = true
        ws[cell].s.fill = { fgColor: { rgb: config.export.headerColor.toUpperCase() } }
        ws[cell].s.font.color = { rgb: 'FFFFFF' }
        ws[cell].s.alignment.horizontal = 'center'
        ws[cell].s.border = getBorder()
      } 
      // If it's a section title
      else if (ws[cell].v === 'KERJAAN SEMINGGU SEBELUMNYA' || ws[cell].v === 'TARGET MINGGU DEPAN') {
        ws[cell].s.font.bold = true
        ws[cell].s.font.color = { rgb: '16A34A' }
      }
      // If it's a data cell
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

  const filename = `Laporan_Aktivitas_TIM_TI_${periodLabel.replace(/[,\s]+/g, '_')}.xlsx`
  XLSX.writeFile(wb, filename)
}

/**
 * Group activities by specific key
 */
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
      })
    }
  })
  return Array.from(map.values())
}
