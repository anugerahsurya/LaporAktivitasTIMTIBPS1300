import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { config } from '../config'

export async function exportToPdf(activities, periodLabel, activityRange, summary = '', teamName = '', periodPrefix = '') {
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

  const attendanceMap = {}
  const filledIds = new Set()
  activities.forEach(act => {
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

  const infoData = [
    ['Periode', `: ${periodLabel}`],
    ['Range Kegiatan', `: ${activityRange.start} s/d ${activityRange.end}`],
    ['Tim', `: ${displayTeamName}`],
    ['Ketua Tim', `: ${config.team.leader}`],
    ['Anggota Tim', `: ${config.employees.filter(e => e.role !== 'Ketua Tim').map(e => e.name).join(', ')}`],
    ['Kehadiran Senin', `: Hadir: ${displayHadir} | Cuti: ${displayCuti} | Izin: ${displayIzin} | Tanpa Keterangan: ${displayBelumIsi}`],
  ]

  infoData.forEach(([label, value]) => {
    doc.setFont('times', 'bold')
    doc.text(label, margin, y)
    doc.setFont('times', 'normal')

    doc.text(value, margin + 40, y, { maxWidth: contentWidth - 40, lineHeightFactor: 1.5 })

    const textLines = doc.splitTextToSize(value, contentWidth - 40)
    const lineHeight = 11 * 0.352778 * 1.5 // ~5.82 mm for font size 11
    y += (textLines.length * lineHeight) + 2.5 // Add 2.5mm spacing to prevent any overlap
  })

  y += 5

  const groupedActivities = groupActivities(activities, 'kegiatan')
  if (groupedActivities.length > 0) {
    doc.setFont('times', 'bold')
    doc.setFontSize(11)
    doc.text('Aktivitas Seminggu Sebelumnya', margin, y)
    y += 4

    const kegiatanData = groupedActivities.map((item, idx) => [
      idx + 1,
      item.text,
      item.contributors.join(', '),
      (item.tim && item.tim !== 'lainnya') ? 'Tim Utama' : 'Tim Lainnya'
    ])

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
      },
      margin: { left: margin, right: margin },
      didDrawPage: drawFooter,
    })

    y = doc.lastAutoTable.finalY + 10
  }

  const groupedTargets = groupActivities(activities, 'target_minggu_depan')
  if (groupedTargets.length > 0) {
    if (y > pageHeight - 40) {
      doc.addPage()
      y = margin
    }

    doc.setFont('times', 'bold')
    doc.setFontSize(11)
    doc.text('Target Minggu Depan', margin, y)
    y += 4

    const targetData = groupedTargets.map((item, idx) => [
      idx + 1,
      item.text,
      item.contributors.join(', '),
      (item.tim && item.tim !== 'lainnya') ? 'Tim Utama' : 'Tim Lainnya'
    ])

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
      },
      margin: { left: margin, right: margin },
      didDrawPage: drawFooter,
    })
    y = doc.lastAutoTable.finalY + 10
  }

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

    doc.text(summary, margin, y, { maxWidth: contentWidth, align: 'left', lineHeightFactor: 1.5 })

    const summaryLines = doc.splitTextToSize(summary, contentWidth)
    const lineHeight = 10 * 0.352778 * 1.5 // ~5.29 mm for font size 10
    y += (summaryLines.length * lineHeight) + 6

    doc.setFont('times', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('* Disclaimer: Ringkasan narasi di atas di-generate secara otomatis menggunakan teknologi AI (Google Gemini) berdasarkan daftar kegiatan yang ada.', margin, y, { maxWidth: contentWidth, lineHeightFactor: 1.3 })
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

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 0, b: 0 }
}
