import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { config } from '../config'

/**
 * Export kegiatan ke PDF sebagai laporan resmi.
 * - Font: Cambria (fallback ke Helvetica di jsPDF)
 * - Warna font: hitam
 * - Bold pada bagian penting
 * - Tabel kegiatan dengan border
 */
export async function exportToPdf(activities, periodLabel, activityRange, summary = '') {
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

  // ─── Header Decoration ───────────────────────────────
  // Green gradient bar at top
  const headerColor = hexToRgb(config.colors.light.primary)
  doc.setFillColor(headerColor.r, headerColor.g, headerColor.b)
  doc.rect(0, 0, pageWidth, 12, 'F')

  // Lighter green accent below
  const accentColor = hexToRgb(config.colors.light.primaryLight)
  doc.setFillColor(accentColor.r, accentColor.g, accentColor.b)
  doc.rect(0, 12, pageWidth, 3, 'F')

  y = 25

  // ─── Title ────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('LAPORAN AKTIVITAS MINGGUAN', pageWidth / 2, y, { align: 'center' })
  y += 7

  doc.setFontSize(12)
  doc.text(config.team.name.toUpperCase(), pageWidth / 2, y, { align: 'center' })
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(config.team.institution, pageWidth / 2, y, { align: 'center' })
  y += 10

  // Divider line
  doc.setDrawColor(headerColor.r, headerColor.g, headerColor.b)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  // ─── Info Section ─────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)

  const infoData = [
    ['Periode', `: ${periodLabel}`],
    ['Range Kegiatan', `: ${activityRange.start} s/d ${activityRange.end}`],
    ['Ketua Tim', `: ${config.team.leader}`],
    ['Anggota Tim', `: ${config.employees.filter(e => e.role !== 'Ketua Tim').map(e => e.name).join(', ')}`],
  ]

  infoData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, margin, y)
    doc.setFont('helvetica', 'normal')
    
    // Gunakan konfigurasi maxWidth dari jsPDF yang lebih mutakhir
    doc.text(value, margin + 35, y, { maxWidth: contentWidth - 35 })
    
    // Hitung estimasi baris untuk menggeser margin Y ke bawah
    const textLines = doc.splitTextToSize(value, contentWidth - 35)
    y += (textLines.length * 6) + 1 // Tambah sedikit spasi ekstra
  })

  y += 5


  // ─── Table 1: Kegiatan Minggu Ini ───────────────────────
  const groupedActivities = groupActivities(activities, 'kegiatan')
  if (groupedActivities.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Aktivitas Seminggu Sebelumnya', margin, y)
    y += 4

    const kegiatanData = groupedActivities.map((item, idx) => [
      idx + 1,
      item.text,
      item.contributors.join(', '),
    ])

    autoTable(doc, {
      startY: y,
      head: [['No', 'Kegiatan', 'Kontributor']],
      body: kegiatanData,
      theme: 'grid',
      styles: {
        font: 'helvetica',
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

  // ─── Table 2: Target Minggu Depan ───────────────────────
  const groupedTargets = groupActivities(activities, 'target_minggu_depan')
  if (groupedTargets.length > 0) {
    // Check if we need to add a page
    if (y > pageHeight - 40) {
      doc.addPage()
      y = margin
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Target Minggu Depan', margin, y)
    y += 4

    const targetData = groupedTargets.map((item, idx) => [
      idx + 1,
      item.text,
      item.contributors.join(', '),
    ])

    autoTable(doc, {
      startY: y,
      head: [['No', 'Target', 'Kontributor']],
      body: targetData,
      theme: 'grid',
      styles: {
        font: 'helvetica',
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

  // ─── AI Summary / Narasi (Bottom) ─────────────────────
  if (summary) {
    if (y > pageHeight - 50) {
      doc.addPage()
      y = margin
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('Ringkasan Kegiatan Tim (Berdasarkan AI)', margin, y)
    y += 6

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    // Gunakan align justify
    doc.text(summary, margin, y, { maxWidth: contentWidth, align: 'justify' })
    
    // Perkirakan tinggi teks
    const summaryLines = doc.splitTextToSize(summary, contentWidth)
    y += (summaryLines.length * 5) + 6

    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('* Disclaimer: Ringkasan narasi di atas di-generate secara otomatis menggunakan teknologi AI (Google Gemini) berdasarkan daftar kegiatan yang ada.', margin, y, { maxWidth: contentWidth })
    doc.setTextColor(0, 0, 0)
  }

  function drawFooter(data) {
    // Prevent double drawing if not needed, handled by jsPDF automatically per page but just in case
    const footerColor = hexToRgb(config.colors.light.primary)
    doc.setFillColor(footerColor.r, footerColor.g, footerColor.b)
    doc.rect(0, pageHeight - 10, pageWidth, 10, 'F')

    const lightFooter = hexToRgb(config.colors.light.primaryLight)
    doc.setFillColor(lightFooter.r, lightFooter.g, lightFooter.b)
    doc.rect(0, pageHeight - 13, pageWidth, 3, 'F')

    // Page number
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

  // ─── Download ─────────────────────────────────────────
  const filename = `Laporan_Aktivitas_TIM_TI_${periodLabel.replace(/[,\s]+/g, '_')}.pdf`
  doc.save(filename)
}

/**
 * Group activities by key
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

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 0, b: 0 }
}
