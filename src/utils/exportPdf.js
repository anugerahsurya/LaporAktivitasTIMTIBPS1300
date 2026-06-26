import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { config } from '../config'
import logoBpsUrl from '../../logo/badan-pusat-statistik-_-bps-logo.svg?url'
import logoSeUrl from '../../logo/Logo SE2026 - utama_Horizontal Color.png?url'

const loadLogo = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 1000 / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve({ data: canvas.toDataURL('image/png'), width: img.width, height: img.height });
    };
    img.onerror = () => {
      console.error('Failed to load image:', url);
      resolve(null);
    };
    img.src = url;
  });
};

async function generatePdfDoc(activities, periodLabel, activityRange, summary, teamName, teamId, allActivities, prevActivities) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = margin

  // Load logos
  const [logoBps, logoSe] = await Promise.all([
    loadLogo(logoBpsUrl),
    loadLogo(logoSeUrl)
  ]);

  const headerColor = hexToRgb(config.colors.light.primary)
  const displayTeamName = teamName || config.team.name

  let headerCenterY = y + 10;

  // BPS Logo on Left
  if (logoBps) {
    const ratio = Math.min(32 / logoBps.width, 18 / logoBps.height);
    const w = logoBps.width * ratio;
    const h = logoBps.height * ratio;
    doc.addImage(logoBps.data, 'PNG', margin, headerCenterY - (h / 2), w, h);
  }

  // SE Logo on Right
  if (logoSe) {
    const ratio = Math.min(32 / logoSe.width, 18 / logoSe.height);
    const w = logoSe.width * ratio;
    const h = logoSe.height * ratio;
    doc.addImage(logoSe.data, 'PNG', pageWidth - margin - w, headerCenterY - (h / 2), w, h);
  }

  // Title in the center
  doc.setFont('times', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  
  let textY = y + 5
  doc.text('LAPORAN AKTIVITAS MINGGUAN', pageWidth / 2, textY, { align: 'center' })
  textY += 6

  doc.setFontSize(12)
  doc.text(displayTeamName.toUpperCase(), pageWidth / 2, textY, { align: 'center' })
  textY += 6

  doc.setFont('times', 'normal')
  doc.setFontSize(11)
  doc.text(config.team.institution, pageWidth / 2, textY, { align: 'center' })

  y += 24

  // Elegant Separator
  doc.setDrawColor(headerColor.r, headerColor.g, headerColor.b)
  doc.setLineWidth(1.0)
  doc.line(margin, y, pageWidth - margin, y)
  
  doc.setLineWidth(0.3)
  doc.line(margin, y + 1.5, pageWidth - margin, y + 1.5)

  y += 8

  // Info section
  doc.setFont('times', 'normal')
  doc.setFontSize(10)

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

  // Info Box
  doc.setFillColor(252, 252, 252)
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.3)
  
  let infoHeight = 4
  infoData.forEach(([label, value]) => {
    const textLines = doc.splitTextToSize(value, contentWidth - 45)
    infoHeight += (textLines.length * (10 * 0.352778 * 1.5)) + 2.5
  })
  
  doc.roundedRect(margin, y, contentWidth, infoHeight, 2, 2, 'FD')
  
  let infoY = y + 6
  infoData.forEach(([label, value]) => {
    doc.setFont('times', 'bold')
    doc.text(label, margin + 4, infoY)
    doc.setFont('times', 'normal')

    const textLines = doc.splitTextToSize(value, contentWidth - 45 - 4)
    doc.text(textLines, margin + 45, infoY)
    const lineHeight = 10 * 0.352778 * 1.5
    infoY += (textLines.length * lineHeight) + 2.5
  })

  y += infoHeight + 8

  const drawFooter = (data) => {
    const footerColor = hexToRgb(config.colors.light.primary)
    doc.setFillColor(footerColor.r, footerColor.g, footerColor.b)
    
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F')
    
    const lightFooter = hexToRgb(config.colors.light.primaryLight)
    doc.setFillColor(lightFooter.r, lightFooter.g, lightFooter.b)
    doc.rect(0, pageHeight - 15, pageWidth, 3, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text(
      `Dicetak otomatis oleh Sistem Lapor Aktivitas TI | Halaman ${data.pageNumber}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    )
  }

  // Kegiatan Minggu Lalu
  const groupedActivities = groupActivitiesForPrev(prevActivities || [])
  
  doc.setFont('times', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(headerColor.r, headerColor.g, headerColor.b)
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

  const tableStyles = {
    font: 'times',
    fontSize: 9,
    cellPadding: 4,
    textColor: [40, 40, 40],
    lineColor: [0, 0, 0],
    lineWidth: 0.3,
    valign: 'top',
    overflow: 'linebreak',
  }

  const headStyles = {
    fillColor: [headerColor.r, headerColor.g, headerColor.b],
    textColor: [255, 255, 255],
    fontStyle: 'bold',
    halign: 'center',
  }

  const alternateRowStyles = {
    fillColor: [252, 252, 252]
  }

  autoTable(doc, {
    startY: y,
    head: [['No', 'Kegiatan', 'Nama Pegawai', 'Keterangan Tim']],
    body: kegiatanData,
    theme: 'grid',
    styles: tableStyles,
    headStyles: headStyles,
    alternateRowStyles: alternateRowStyles,
    columnStyles: {
      0: { halign: 'center', cellWidth: 14 },
      1: { cellWidth: 81 },
      2: { cellWidth: 45 },
      3: { cellWidth: 30 },
    },
    margin: { left: margin, right: margin },
    didDrawPage: drawFooter,
  })

  y = doc.lastAutoTable.finalY + 12

  // Target Minggu Ini
  const groupedTargets = groupActivities(activities, 'target_minggu_depan')
  
  if (y > pageHeight - 40) {
    doc.addPage()
    y = margin
  }

  doc.setFont('times', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(headerColor.r, headerColor.g, headerColor.b)
  doc.text('Rencana Kegiatan Minggu Ini', margin, y)
  y += 4

  const targetData = groupedTargets.length > 0
    ? groupedTargets.map((item, idx) => [
        idx + 1,
        item.text,
        item.contributors.join(', '),
        item.tim === 'lainnya' ? 'Tim Lainnya' : 'Tim Utama'
      ])
    : [['-', 'Belum ada rencana kegiatan minggu ini.', '-', '-']]

  autoTable(doc, {
    startY: y,
    head: [['No', 'Target', 'Nama Pegawai', 'Keterangan Tim']],
    body: targetData,
    theme: 'grid',
    styles: tableStyles,
    headStyles: headStyles,
    alternateRowStyles: alternateRowStyles,
    columnStyles: {
      0: { halign: 'center', cellWidth: 14 },
      1: { cellWidth: 81 },
      2: { cellWidth: 45 },
      3: { cellWidth: 30 },
    },
    margin: { left: margin, right: margin },
    didDrawPage: drawFooter,
  })
  y = doc.lastAutoTable.finalY + 12

  // Summary
  if (summary) {
    if (y > pageHeight - 50) {
      doc.addPage()
      y = margin
    }

    doc.setFillColor(headerColor.r, headerColor.g, headerColor.b)
    doc.roundedRect(margin, y - 5, contentWidth, 8, 1, 1, 'F')
    
    doc.setFont('times', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(255, 255, 255)
    doc.text(`Ringkasan Kegiatan ${displayTeamName}`, margin + 3, y)
    
    y += 8

    doc.setFont('times', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)

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
    doc.setTextColor(120, 120, 120)
    
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

  return { doc, displayTeamName }
}

export async function exportToPdf(activities, periodLabel, activityRange, summary = '', teamName = '', periodPrefix = '', teamId = '', allActivities = null, prevActivities = []) {
  const { doc, displayTeamName } = await generatePdfDoc(activities, periodLabel, activityRange, summary, teamName, teamId, allActivities, prevActivities)
  const prefix = periodPrefix || periodLabel.replace(/[,\s]+/g, '_')
  const filename = `${prefix}-Rekap Aktivitas ${displayTeamName}.pdf`
  doc.save(filename)
}

export async function exportToPdfBlob(activities, periodLabel, activityRange, summary = '', teamName = '', periodPrefix = '', teamId = '', allActivities = null, prevActivities = []) {
  const { doc, displayTeamName } = await generatePdfDoc(activities, periodLabel, activityRange, summary, teamName, teamId, allActivities, prevActivities)
  const prefix = periodPrefix || periodLabel.replace(/[,\s]+/g, '_')
  const filename = `${prefix}-Rekap Aktivitas ${displayTeamName}.pdf`
  const arrayBuffer = doc.output('arraybuffer')
  return { filename, blob: new Uint8Array(arrayBuffer) }
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

