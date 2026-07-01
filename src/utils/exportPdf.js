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

async function generatePdfDoc(activities, periodLabel, activityRange, summary, teamName, teamId, allActivities, prevActivities, signatureParams) {
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

  // Footer drawing logic will be applied at the end for all pages

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

  const headStylesUtama = {
    fillColor: [headerColor.r, headerColor.g, headerColor.b],
    textColor: [255, 255, 255],
    fontStyle: 'bold',
    halign: 'center',
  }
  
  const headStylesLainnya = {
    fillColor: [107, 114, 128], // gray-500
    textColor: [255, 255, 255],
    fontStyle: 'bold',
    halign: 'center',
  }

  const alternateRowStyles = {
    fillColor: [252, 252, 252]
  }

  const columnStyles2 = {
    0: { halign: 'center', cellWidth: 14 },
    1: { cellWidth: 156 },
  }

  function renderTableSection(docObj, yStart, title, activitiesList, noDataMessage, isTarget) {
    let currY = yStart;
    const utama = activitiesList.filter(a => a.tim !== 'lainnya');
    const lainnya = activitiesList.filter(a => a.tim === 'lainnya');

    if (currY > pageHeight - 40) {
      docObj.addPage();
      currY = margin;
    }

    docObj.setFont('times', 'bold')
    docObj.setFontSize(12)
    docObj.setTextColor(headerColor.r, headerColor.g, headerColor.b)
    docObj.text(title, margin, currY)
    currY += 4
    
    const utamaData = utama.length > 0 
      ? utama.map((item, idx) => [idx + 1, item.text])
      : [['-', noDataMessage]];
      
    autoTable(docObj, {
      startY: currY,
      head: [
        [{ content: 'A. Utama', colSpan: 2, styles: { fillColor: [headerColor.r, headerColor.g, headerColor.b], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left' } }],
        ['No', isTarget ? 'Target' : 'Kegiatan']
      ],
      body: utamaData,
      theme: 'grid',
      styles: tableStyles,
      headStyles: headStylesUtama,
      alternateRowStyles: alternateRowStyles,
      columnStyles: columnStyles2,
      margin: { left: margin, right: margin }
    })
    
    currY = docObj.lastAutoTable.finalY + 8

    // B. Lainnya
    if (currY > pageHeight - 30) {
      docObj.addPage();
      currY = margin;
    }
    const lainnyaData = lainnya.length > 0 
      ? lainnya.map((item, idx) => [idx + 1, item.text])
      : [['-', 'Belum ada kegiatan.']];
      
    autoTable(docObj, {
      startY: currY,
      head: [
        [{ content: 'B. Lainnya', colSpan: 2, styles: { fillColor: [107, 114, 128], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left' } }],
        ['No', isTarget ? 'Target' : 'Kegiatan']
      ],
      body: lainnyaData,
      theme: 'grid',
      styles: tableStyles,
      headStyles: headStylesLainnya,
      alternateRowStyles: alternateRowStyles,
      columnStyles: columnStyles2,
      margin: { left: margin, right: margin }
    })
    
    return docObj.lastAutoTable.finalY + 12;
  }

  // Kegiatan Minggu Lalu
  const groupedActivities = groupActivitiesForPrev(prevActivities || [])
  y = renderTableSection(doc, y, 'Kegiatan Minggu Lalu', groupedActivities, 'Belum ada kegiatan utama minggu lalu.', false);

  // Target Minggu Ini
  const groupedTargets = groupActivities(activities, 'target_minggu_depan')
  y = renderTableSection(doc, y, 'Rencana Kegiatan Minggu Ini', groupedTargets, 'Belum ada rencana kegiatan utama minggu ini.', true);

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

    const paragraphs = summary.split('\n')
    const lineHeight = 10 * 0.352778 * 1.5

    paragraphs.forEach(para => {
      if (!para.trim()) {
        y += lineHeight * 0.5
        return
      }

      const pLines = doc.splitTextToSize(para, contentWidth)

      pLines.forEach((line, index) => {
        if (y > pageHeight - 20) {
          doc.addPage()
          y = margin + 10
        }
        
        if (index === pLines.length - 1) {
          // Last line: normal left align
          doc.text(line, margin, y)
        } else {
          // Justify line manually
          const words = line.split(' ').filter(w => w.length > 0)
          if (words.length <= 1) {
            doc.text(line, margin, y)
          } else {
            // total width of words without spaces
            let wordsWidth = 0
            words.forEach(w => wordsWidth += doc.getTextWidth(w))
            
            // space needed between words
            const spaceWidth = (contentWidth - wordsWidth) / (words.length - 1)
            
            let currentX = margin
            words.forEach((word, wIdx) => {
              doc.text(word, currentX, y)
              if (wIdx < words.length - 1) {
                currentX += doc.getTextWidth(word) + spaceWidth
              }
            })
          }
        }
        y += lineHeight
      })
      
      y += lineHeight * 0.5 // jarak antar paragraf
    })
    
    y += 6 - (lineHeight * 0.5)

    doc.setTextColor(0, 0, 0)
  }

  // Signature Block
  if (signatureParams && signatureParams.image) {
    if (y > pageHeight - 65) {
      doc.addPage()
      y = margin + 10
    } else {
      y += 15
    }

    const sigWidth = 80 // width for signature area
    const sigX = pageWidth - margin - sigWidth
    
    doc.setFont('times', 'normal')
    doc.setFontSize(11)
    
    const roleLines = doc.splitTextToSize(signatureParams.role, sigWidth)
    
    let baseW = 64
    let targetW = baseW * (signatureParams.scale || 1)
    let targetH = 32 * (signatureParams.scale || 1)
    
    try {
      const imgProps = doc.getImageProperties(signatureParams.image)
      const imgRatio = imgProps.width / imgProps.height
      targetH = targetW / imgRatio
    } catch (e) {
      console.error('Failed to get signature image properties', e)
    }
    
    let sigY = y
    doc.setTextColor(0, 0, 0)
    roleLines.forEach(line => {
      doc.text(line, sigX + (sigWidth / 2), sigY, { align: 'center' })
      sigY += 5
    })
    
    sigY += 1 // reduced gap before image
    
    try {
      const finalX = sigX + (sigWidth / 2) - (targetW / 2) + ((signatureParams.offsetX || 0) * 0.5)
      doc.addImage(signatureParams.image, 'PNG', finalX, sigY, targetW, targetH)
    } catch (e) {
      // Ignore
    }
    
    sigY += targetH + 5 // minimal gap before name
    doc.setFont('times', 'bold')
    doc.text(signatureParams.name, sigX + (sigWidth / 2), sigY, { align: 'center' })
  }

  // Draw Footer for all pages
  const totalPages = doc.internal.getNumberOfPages();
  const footerColor = hexToRgb(config.colors.light.primary);
  const lightFooter = hexToRgb(config.colors.light.primaryLight);
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    doc.setFillColor(footerColor.r, footerColor.g, footerColor.b)
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F')
    
    doc.setFillColor(lightFooter.r, lightFooter.g, lightFooter.b)
    doc.rect(0, pageHeight - 15, pageWidth, 3, 'F')
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text(
      `Dicetak otomatis oleh Sistem Lapor Aktivitas TI | Halaman ${i}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    )
  }

  return { doc, displayTeamName }
}

export async function exportToPdf(activities, periodLabel, activityRange, summary = '', teamName = '', periodPrefix = '', teamId = '', allActivities = null, prevActivities = [], signatureParams = null) {
  const { doc, displayTeamName } = await generatePdfDoc(activities, periodLabel, activityRange, summary, teamName, teamId, allActivities, prevActivities, signatureParams)
  const prefix = periodPrefix || periodLabel.replace(/[,\s]+/g, '_')
  const filename = `${prefix}-Rekap Aktivitas ${displayTeamName}.pdf`
  doc.save(filename)
}

export async function exportToPdfBlob(activities, periodLabel, activityRange, summary = '', teamName = '', periodPrefix = '', teamId = '', allActivities = null, prevActivities = [], signatureParams = null) {
  const { doc, displayTeamName } = await generatePdfDoc(activities, periodLabel, activityRange, summary, teamName, teamId, allActivities, prevActivities, signatureParams)
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

