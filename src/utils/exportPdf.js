import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { config } from '../config'

export async function exportToPdf(activities, periodLabel, activityRange, summary = '', teamName = '', periodPrefix = '', teamId = '', allActivities = null, prevActivities = []) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 25
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const headerColor = hexToRgb(config.colors.light.primary)
  doc.setFillColor(headerColor.r, headerColor.g, headerColor.b)
  doc.rect(0, 0, pageWidth, 12, 'F')

  const accentColor = hexToRgb(config.colors.light.primaryLight)
  doc.setFillColor(accentColor.r, accentColor.g, accentColor.b)
  doc.rect(0, 12, pageWidth, 3, 'F')

  y = 25

  const displayTeamName = teamName || config.team.name

  doc.setFont('times', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('LAPORAN AKTIVITAS MINGGUAN', pageWidth / 2, y, { align: 'center' })
  y += 7

  doc.setFontSize(12)
  doc.text(displayTeamName.toUpperCase(), pageWidth / 2, y, { align: 'center' })
  y += 7

  doc.setFont('times', 'normal')
  doc.setFontSize(11)
  doc.text(config.team.institution, pageWidth / 2, y, { align: 'center' })
  y += 10

  doc.setDrawColor(headerColor.r, headerColor.g, headerColor.b)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  doc.setFont('times', 'normal')
  doc.setFontSize(11)

  // Use allActivities for global attendance summary (same across all team reports)
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

  // teamEmployees is used only for "Anggota Tim" listing in PDF
  const teamEmployees = teamId
    ? config.employees.filter(emp => {
        const teamObj = config.teams.find(t => t.name === emp.team)
        return (teamObj && teamObj.id === teamId) || emp.role === 'Ketua Tim'
      })
    : config.employees

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

  const infoData = [
    ['Periode', `: ${periodLabel}`],
    ['Range Kegiatan', `: ${activityRange.start} s/d ${activityRange.end}`],
    ['Tim', `: ${displayTeamName}`],
    ['Ketua Tim', `: ${config.team.leader}`],
    ['Anggota Tim', `: ${teamEmployees.filter(e => e.role !== 'Ketua Tim').map(e => e.name).join(', ')}`],
    ['Kehadiran Senin Tim IT', `: Hadir: ${displayHadir} | Cuti: ${displayCuti} | Izin: ${displayIzin} | Tanpa Keterangan: ${displayBelumIsi}`],
  ]

  infoData.forEach(([label, value]) => {
    doc.setFont('times', 'bold')
    doc.text(label, margin, y)
    doc.setFont('times', 'normal')

    doc.text(value, margin + 45, y, { maxWidth: contentWidth - 45, lineHeightFactor: 1.5 })

    const textLines = doc.splitTextToSize(value, contentWidth - 45)
    const lineHeight = 11 * 0.352778 * 1.5 // ~5.82 mm for font size 11
    y += (textLines.length * lineHeight) + 2.5 // Add 2.5mm spacing to prevent any overlap
  })

  y += 5

  const groupedActivities = groupActivitiesForPrev(prevActivities || [])
  
  doc.setFont('times', 'bold')
  doc.setFontSize(11)
  doc.text('Kegiatan Minggu Lalu', margin, y)
  y += 4

  const kegiatanData = groupedActivities.length > 0 
    ? groupedActivities.map((item, idx) => [
        idx + 1,
        item.text,
        item.contributors.join(', '),
        item.tim === 'lainnya' ? 'Tim Lainnya' : 'Tim Utama'
      ])
    : [['-', 'Belum ada kegiatan minggu lalu yang dilaporkan.', '-', '-']]

  autoTable(doc, {
    startY: y,
    head: [['No', 'Kegiatan', 'Nama Pegawai', 'Keterangan Tim']],
    body: kegiatanData,
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 9,
      cellPadding: 3,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      valign: 'top',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [headerColor.r, headerColor.g, headerColor.b],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 85 },
      2: { cellWidth: 40 },
      3: { cellWidth: 25 },
    },
    margin: { left: margin, right: margin },
    didDrawPage: drawFooter,
  })

  y = doc.lastAutoTable.finalY + 10

  const groupedTargets = groupActivities(activities, 'target_minggu_depan')
  
  if (y > pageHeight - 40) {
    doc.addPage()
    y = margin
  }

  doc.setFont('times', 'bold')
  doc.setFontSize(11)
  doc.text('Rencana Kegiatan Minggu Ini', margin, y)
  y += 4

  const targetData = groupedTargets.length > 0
    ? groupedTargets.map((item, idx) => [
        idx + 1,
        item.text,
        item.contributors.join(', '),
        item.tim === 'lainnya' ? 'Tim Lainnya' : 'Tim Utama'
      ])
    : [['-', 'Belum ada target kegiatan minggu ini.', '-', '-']]

  autoTable(doc, {
    startY: y,
    head: [['No', 'Target', 'Nama Pegawai', 'Keterangan Tim']],
    body: targetData,
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 9,
      cellPadding: 3,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      valign: 'top',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [headerColor.r, headerColor.g, headerColor.b],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 85 },
      2: { cellWidth: 40 },
      3: { cellWidth: 25 },
    },
    margin: { left: margin, right: margin },
    didDrawPage: drawFooter,
  })
  y = doc.lastAutoTable.finalY + 10

  if (summary) {
    if (y > pageHeight - 50) {
      doc.addPage()
      y = margin
    }

    doc.setFont('times', 'bold')
    doc.setFontSize(11)
    doc.text(`Ringkasan Kegiatan ${displayTeamName}`, margin, y)
    y += 6

    doc.setFont('times', 'normal')
    doc.setFontSize(10)

    const summaryLines = doc.splitTextToSize(summary, contentWidth)
    const lineHeight = 10 * 0.352778 * 1.5 // ~5.29 mm for font size 10

    summaryLines.forEach(line => {
      if (y > pageHeight - 20) {
        doc.addPage()
        y = margin + 10
      }
      doc.text(line, margin, y)
      y += lineHeight
    })
    y += 6

    doc.setFont('times', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    
    const disclaimer = '* Disclaimer: Ringkasan narasi di atas di-generate secara otomatis menggunakan teknologi AI (Google Gemini) berdasarkan daftar kegiatan yang ada.'
    const discLines = doc.splitTextToSize(disclaimer, contentWidth)
    const discLineHeight = 8 * 0.352778 * 1.3
    
    discLines.forEach(line => {
      if (y > pageHeight - 20) {
        doc.addPage()
        y = margin + 10
      }
      doc.text(line, margin, y)
      y += discLineHeight
    })
    doc.setTextColor(0, 0, 0)
  }

  function drawFooter(data) {
    const footerColor = hexToRgb(config.colors.light.primary)
    doc.setFillColor(footerColor.r, footerColor.g, footerColor.b)
    doc.rect(0, pageHeight - 10, pageWidth, 10, 'F')

    const lightFooter = hexToRgb(config.colors.light.primaryLight)
    doc.setFillColor(lightFooter.r, lightFooter.g, lightFooter.b)
    doc.rect(0, pageHeight - 13, pageWidth, 3, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text(
      `Halaman ${data.pageNumber}`,
      pageWidth / 2,
      pageHeight - 4,
      { align: 'center' }
    )
  }

  // Filename: DDMMYYYY-Rekap Aktivitas [Team Name].pdf
  const prefix = periodPrefix || periodLabel.replace(/[,\s]+/g, '_')
  const filename = `${prefix}-Rekap Aktivitas ${displayTeamName}.pdf`
  doc.save(filename)
}

function groupActivities(activities, keyField) {
  const map = new Map()
  activities.forEach(act => {
    let key = act[keyField] ? act[keyField].trim() : ''
    if (!key) {
      key = '- (Belum mengisi)'
    }

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
    let key = (act.kegiatan || act.target_minggu_depan || '').trim()
    if (!key) {
      key = '- (Belum mengisi)'
    }

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

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 0, b: 0 }
}

/**
 * Same as exportToPdf but returns { filename, blob } for ZIP bundling
 */
export async function exportToPdfBlob(activities, periodLabel, activityRange, summary = '', teamName = '', periodPrefix = '', teamId = '', allActivities = null, prevActivities = []) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 25
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const headerColor = hexToRgb(config.colors.light.primary)
  doc.setFillColor(headerColor.r, headerColor.g, headerColor.b)
  doc.rect(0, 0, pageWidth, 12, 'F')

  const accentColor = hexToRgb(config.colors.light.primaryLight)
  doc.setFillColor(accentColor.r, accentColor.g, accentColor.b)
  doc.rect(0, 12, pageWidth, 3, 'F')

  y = 25

  const displayTeamName = teamName || config.team.name

  doc.setFont('times', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('LAPORAN AKTIVITAS MINGGUAN', pageWidth / 2, y, { align: 'center' })
  y += 7

  doc.setFontSize(12)
  doc.text(displayTeamName.toUpperCase(), pageWidth / 2, y, { align: 'center' })
  y += 7

  doc.setFont('times', 'normal')
  doc.setFontSize(11)
  doc.text(config.team.institution, pageWidth / 2, y, { align: 'center' })
  y += 10

  doc.setDrawColor(headerColor.r, headerColor.g, headerColor.b)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  doc.setFont('times', 'normal')
  doc.setFontSize(11)

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

  const teamEmployees = teamId
    ? config.employees.filter(emp => {
        const teamObj = config.teams.find(t => t.name === emp.team)
        return (teamObj && teamObj.id === teamId) || emp.role === 'Ketua Tim'
      })
    : config.employees

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

  const infoData = [
    ['Periode', `: ${periodLabel}`],
    ['Range Kegiatan', `: ${activityRange.start} s/d ${activityRange.end}`],
    ['Tim', `: ${displayTeamName}`],
    ['Ketua Tim', `: ${config.team.leader}`],
    ['Anggota Tim', `: ${teamEmployees.filter(e => e.role !== 'Ketua Tim').map(e => e.name).join(', ')}`],
    ['Kehadiran Senin Tim IT', `: Hadir: ${displayHadir} | Cuti: ${displayCuti} | Izin: ${displayIzin} | Tanpa Keterangan: ${displayBelumIsi}`],
  ]

  infoData.forEach(([label, value]) => {
    doc.setFont('times', 'bold')
    doc.text(label, margin, y)
    doc.setFont('times', 'normal')

    doc.text(value, margin + 45, y, { maxWidth: contentWidth - 45, lineHeightFactor: 1.5 })

    const textLines = doc.splitTextToSize(value, contentWidth - 45)
    const lineHeight = 11 * 0.352778 * 1.5
    y += (textLines.length * lineHeight) + 2.5
  })

  y += 5

  const groupedActivitiesData = groupActivitiesForPrev(prevActivities || [])
  
  doc.setFont('times', 'bold')
  doc.setFontSize(11)
  doc.text('Kegiatan Minggu Lalu', margin, y)
  y += 4

  const kegiatanDataBlob = groupedActivitiesData.length > 0
    ? groupedActivitiesData.map((item, idx) => [
        idx + 1,
        item.text,
        item.contributors.join(', '),
        item.tim === 'lainnya' ? 'Tim Lainnya' : 'Tim Utama'
      ])
    : [['-', 'Belum ada kegiatan minggu lalu yang dilaporkan.', '-', '-']]

  autoTable(doc, {
    startY: y,
    head: [['No', 'Kegiatan', 'Nama Pegawai', 'Keterangan Tim']],
    body: kegiatanDataBlob,
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 9,
      cellPadding: 3,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      valign: 'top',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [headerColor.r, headerColor.g, headerColor.b],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 85 },
      2: { cellWidth: 40 },
      3: { cellWidth: 25 },
    },
    margin: { left: margin, right: margin },
    didDrawPage: drawFooterBlob,
  })

  y = doc.lastAutoTable.finalY + 10

  const groupedTargetsDataBlob = groupActivities(activities, 'target_minggu_depan')
  
  if (y > pageHeight - 40) {
    doc.addPage()
    y = margin
  }

  doc.setFont('times', 'bold')
  doc.setFontSize(11)
  doc.text('Rencana Kegiatan Minggu Ini', margin, y)
  y += 4

  const targetDataBlob = groupedTargetsDataBlob.length > 0
    ? groupedTargetsDataBlob.map((item, idx) => [
        idx + 1,
        item.text,
        item.contributors.join(', '),
        item.tim === 'lainnya' ? 'Tim Lainnya' : 'Tim Utama'
      ])
    : [['-', 'Belum ada rencana kegiatan minggu ini yang dilaporkan.', '-', '-']]

  autoTable(doc, {
    startY: y,
    head: [['No', 'Target', 'Nama Pegawai', 'Keterangan Tim']],
    body: targetDataBlob,
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 9,
      cellPadding: 3,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      valign: 'top',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [headerColor.r, headerColor.g, headerColor.b],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 85 },
      2: { cellWidth: 40 },
      3: { cellWidth: 25 },
    },
    margin: { left: margin, right: margin },
    didDrawPage: drawFooterBlob,
  })
  
  y = doc.lastAutoTable.finalY + 10

  if (summary) {
    if (y > pageHeight - 50) {
      doc.addPage()
      y = margin
    }

    doc.setFont('times', 'bold')
    doc.setFontSize(11)
    doc.text(`Ringkasan Kegiatan ${displayTeamName}`, margin, y)
    y += 6

    doc.setFont('times', 'normal')
    doc.setFontSize(10)

    const summaryLines = doc.splitTextToSize(summary, contentWidth)
    const lineHeight = 10 * 0.352778 * 1.5

    summaryLines.forEach(line => {
      if (y > pageHeight - 20) {
        doc.addPage()
        y = margin + 10
      }
      doc.text(line, margin, y)
      y += lineHeight
    })
    y += 6

    doc.setFont('times', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    
    const disclaimer = '* Disclaimer: Ringkasan narasi di atas di-generate secara otomatis menggunakan teknologi AI (Google Gemini) berdasarkan daftar kegiatan yang ada.'
    const discLines = doc.splitTextToSize(disclaimer, contentWidth)
    const discLineHeight = 8 * 0.352778 * 1.3
    
    discLines.forEach(line => {
      if (y > pageHeight - 20) {
        doc.addPage()
        y = margin + 10
      }
      doc.text(line, margin, y)
      y += discLineHeight
    })
    doc.setTextColor(0, 0, 0)
  }

  function drawFooterBlob(data) {
    const footerColor = hexToRgb(config.colors.light.primary)
    doc.setFillColor(footerColor.r, footerColor.g, footerColor.b)
    doc.rect(0, pageHeight - 10, pageWidth, 10, 'F')

    const lightFooter = hexToRgb(config.colors.light.primaryLight)
    doc.setFillColor(lightFooter.r, lightFooter.g, lightFooter.b)
    doc.rect(0, pageHeight - 13, pageWidth, 3, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text(
      `Halaman ${data.pageNumber}`,
      pageWidth / 2,
      pageHeight - 4,
      { align: 'center' }
    )
  }

  const prefix = periodPrefix || periodLabel.replace(/[,\s]+/g, '_')
  const filename = `${prefix}-Rekap Aktivitas ${displayTeamName}.pdf`
  const arrayBuffer = doc.output('arraybuffer')
  return { filename, blob: new Uint8Array(arrayBuffer) }
}

