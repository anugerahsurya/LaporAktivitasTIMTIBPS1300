/**
 * Local rules-based Indonesian spelling & grammar checker for activity reporting.
 * Provides immediate feedback without consuming API tokens.
 */

export function checkIndonesianGrammar(text) {
  if (!text || text.trim().length === 0) {
    return { isValid: true, warning: '', suggestions: [] }
  }

  const trimmed = text.trim()
  const words = trimmed.split(/\s+/)
  const warnings = []
  const suggestions = []

  // 1. Check character and word length
  if (words.length < 2 || trimmed.length < 8) {
    warnings.push("Deskripsi terlalu singkat. Jelaskan aktivitas dengan lebih detail.")
  }

  // 2. Check capitalization at start
  if (trimmed[0] !== trimmed[0].toUpperCase()) {
    warnings.push("Kalimat sebaiknya diawali dengan huruf kapital.")
    suggestions.push(trimmed[0].toUpperCase() + trimmed.slice(1))
  }

  // 3. Check first word (should be standard Indonesian verb prefixes: me-, ber-, di-)
  const firstWordClean = words[0].toLowerCase().replace(/[^a-zA-Z]/g, '')
  const startsWithVerbPrefix = 
    firstWordClean.startsWith('me') || 
    firstWordClean.startsWith('di') || 
    firstWordClean.startsWith('ber') || 
    firstWordClean.startsWith('ter') || 
    firstWordClean.startsWith('pe') || 
    firstWordClean.startsWith('se')

  // Common technical or domain nouns/verbs that are allowed as first words
  const allowedFirstWords = [
    'input', 'update', 'backup', 'deploy', 'install', 'setup', 
    'monitoring', 'maintenance', 'rapat', 'koordinasi', 'evaluasi', 
    'diskusi', 'asistensi', 'entri', 'cleaning', 'finalisasi', 
    'uji', 'ujicoba', 'qc', 'quality', 'sharing', 'troubleshooting',
    'migrasi', 'konfigurasi'
  ]
  
  if (!startsWithVerbPrefix && !allowedFirstWords.includes(firstWordClean) && firstWordClean.length > 0) {
    warnings.push("Kalimat sebaiknya diawali dengan kata kerja (misal: Melakukan, Membuat, Mengikuti, Menginput).")
  }

  // 4. Dictionary of common typos, shorthand, and slang words
  const slangDictionary = {
    'bikin': 'membuat / melakukan',
    'nyari': 'mencari',
    'dapet': 'mendapatkan',
    'ga': 'tidak',
    'gak': 'tidak',
    'kalo': 'kalau',
    'yg': 'yang',
    'dgn': 'dengan',
    'utk': 'untuk',
    'sdh': 'sudah',
    'blm': 'belum',
    'adlh': 'adalah',
    'tgl': 'tanggal',
    'maintence': 'maintenance',
    'maintenis': 'maintenance',
    'databas': 'database',
    'analisa': 'analisis',
    'merubah': 'mengubah',
    'apli': 'aplikasi',
    'skenario': 'skenario',
    'dokumen': 'dokumen'
  }

  const detectedSlangs = []
  words.forEach(word => {
    const wordClean = word.toLowerCase().replace(/[^a-zA-Z]/g, '')
    if (slangDictionary[wordClean]) {
      detectedSlangs.push(`"${wordClean}" sebaiknya ditulis "${slangDictionary[wordClean]}"`)
    }
  })

  // 5. Check spacing in common passive verbs (e.g. "di lakukan" -> "dilakukan")
  const spaceDiVerbRegex = /\bdi\s+(lakukan|buat|input|kirim|proses|selesaikan|bantu|prioritaskan|tulis|baca|perbaiki|pelihara|tata|gunakan|susun)\b/gi
  if (spaceDiVerbRegex.test(trimmed)) {
    warnings.push("Awalan 'di-' untuk kata kerja pasif sebaiknya digabung (tidak memakai spasi).")
  }

  if (detectedSlangs.length > 0) {
    warnings.push(`Gunakan bahasa formal/baku: ${detectedSlangs.join(', ')}.`)
  }

  return {
    isValid: warnings.length === 0,
    warning: warnings.join(' '),
    suggestions: suggestions
  }
}
