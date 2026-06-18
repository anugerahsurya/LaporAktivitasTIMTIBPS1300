import { ref } from 'vue'
import { config } from '../config'
import { parseISO, formatDateISO } from '../utils/dateUtils'

function getPrevPeriodISO(periodeISO) {
  const d = parseISO(periodeISO)
  d.setDate(d.getDate() - 7)
  return formatDateISO(d)
}

function mergeActivities(periode, currentActs, prevActs) {
  // Group current acts by employee
  const currentByEmployee = {}
  currentActs.forEach(act => {
    const empId = String(act.pegawai_id)
    if (!currentByEmployee[empId]) {
      currentByEmployee[empId] = {
        empId,
        empNama: act.pegawai_nama,
        targets: [],
        originalRows: []
      }
    }
    currentByEmployee[empId].originalRows.push(act)
    if (act.target_minggu_depan) {
      currentByEmployee[empId].targets.push(act.target_minggu_depan)
    }
  })

  // Group prev acts by employee to get their targets (which are current activities)
  const prevByEmployee = {}
  prevActs.forEach(act => {
    const empId = String(act.pegawai_id)
    if (!prevByEmployee[empId]) {
      prevByEmployee[empId] = {
        targets: []
      }
    }
    if (act.target_minggu_depan) {
      prevByEmployee[empId].targets.push(act.target_minggu_depan)
    }
  })

  const merged = []
  // For each employee in currentActs (only those who have submitted in the current period)
  Object.values(currentByEmployee).forEach(emp => {
    const prevTargets = prevByEmployee[emp.empId]?.targets || []
    const currentTargets = emp.targets

    const maxLength = Math.max(prevTargets.length, currentTargets.length)

    for (let i = 0; i < maxLength; i++) {
      merged.push({
        id: emp.originalRows[i]?.id || `ACT_${emp.empId}_${Date.now()}_${i}`,
        periode: periode,
        kegiatan: prevTargets[i] || '',
        target_minggu_depan: currentTargets[i] || '',
        pegawai_id: emp.empId,
        pegawai_nama: emp.empNama,
        created_at: emp.originalRows[i]?.created_at || new Date().toISOString()
      })
    }
  })

  return merged
}

export function useApi() {
  const loading = ref(false)
  const error = ref(null)

  const isConnected = !!config.apiUrl

  function getLocalData(key) {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }

  function setLocalData(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
  }

  async function getActivities(periode, fetchPrev = true) {
    loading.value = true
    error.value = null
    try {
      if (isConnected) {
        const prevPeriode = fetchPrev ? getPrevPeriodISO(periode) : null
        
        const currentPromise = fetch(`${config.apiUrl}?action=getActivities&periode=${periode}`).then(r => r.json())
        const prevPromise = prevPeriode 
          ? fetch(`${config.apiUrl}?action=getActivities&periode=${prevPeriode}`).then(r => r.json())
          : Promise.resolve({ activities: [] })
          
        const [currentRes, prevRes] = await Promise.all([currentPromise, prevPromise])
        const currentActs = currentRes.activities || []
        const prevActs = prevRes.activities || []
        
        loading.value = false
        if (!fetchPrev) return currentActs
        
        return mergeActivities(periode, currentActs, prevActs)
      } else {
        const all = getLocalData('activities') || []
        const currentActs = all.filter(a => a.periode === periode)
        if (!fetchPrev) {
          loading.value = false
          return currentActs
        }
        const prevPeriode = getPrevPeriodISO(periode)
        const prevActs = all.filter(a => a.periode === prevPeriode)
        loading.value = false
        return mergeActivities(periode, currentActs, prevActs)
      }
    } catch (e) {
      error.value = e.message
      loading.value = false
      return []
    }
  }

  async function addActivity(activityData) {
    loading.value = true
    error.value = null
    try {
      if (isConnected) {
        const res = await fetch(config.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'addActivity',
            ...activityData,
          }),
        })
        const data = await res.json()
        loading.value = false
        return data
      } else {
        const all = getLocalData('activities') || []
        const newActivities = activityData.activities.map((act, idx) => ({
          id: `ACT${Date.now()}${idx}`,
          periode: activityData.periode,
          kegiatan: act.kegiatan,
          target_minggu_depan: act.target || '',
          pegawai_id: activityData.pegawai_id,
          pegawai_nama: activityData.pegawai_nama,
          created_at: new Date().toISOString(),
        }))
        all.push(...newActivities)
        setLocalData('activities', all)
        loading.value = false
        return { success: true }
      }
    } catch (e) {
      error.value = e.message
      loading.value = false
      return { success: false, error: e.message }
    }
  }

  async function getSuggestions(periode) {
    const activities = await getActivities(periode)
    const uniqueActivities = [...new Set(activities.map(a => a.kegiatan).filter(Boolean))]
    const uniqueTargets = [...new Set(activities.map(a => a.target_minggu_depan).filter(Boolean))]
    return {
      kegiatan: uniqueActivities,
      target: uniqueTargets
    }
  }

  async function getPeriods() {
    loading.value = true
    error.value = null
    try {
      if (isConnected) {
        const res = await fetch(`${config.apiUrl}?action=getPeriods`)
        const data = await res.json()
        loading.value = false
        return data.periods || []
      } else {
        const all = getLocalData('activities') || []
        const periods = [...new Set(all.map(a => a.periode))].sort().reverse()
        loading.value = false
        return periods
      }
    } catch (e) {
      error.value = e.message
      loading.value = false
      return []
    }
  }

  async function deleteActivity(id) {
    loading.value = true
    error.value = null
    try {
      if (isConnected) {
        const res = await fetch(config.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'deleteActivity', id }),
        })
        const data = await res.json()
        loading.value = false
        return data
      } else {
        let all = getLocalData('activities') || []
        all = all.filter(a => a.id !== id)
        setLocalData('activities', all)
        loading.value = false
        return { success: true }
      }
    } catch (e) {
      error.value = e.message
      loading.value = false
      return { success: false, error: e.message }
    }
  }

  async function generateSummary(activities) {
    loading.value = true
    error.value = null
    try {
      const activityList = activities.map(a => a.kegiatan).filter(Boolean).join(', ')
      const targetList = activities.map(a => a.target_minggu_depan).filter(Boolean)
      const uniqueTargets = [...new Set(targetList)].join(', ')

      const prompt = `Buatkan ringkasan narasi eksekutif (tepat 2 paragraf padat) untuk laporan aktivitas mingguan Tim Teknologi Informasi BPS Provinsi Sumatera Barat. 

Daftar kegiatan yang diselesaikan minggu ini: ${activityList}.
${uniqueTargets ? `Rencana/target kegiatan minggu depan: ${uniqueTargets}.` : ''}

Instruksi spesifik:
1. Paragraf pertama: Bahas intisari kegiatan yang telah diselesaikan minggu ini secara profesional.
2. Paragraf kedua: ${uniqueTargets ? 'Bahas rencana dan target kegiatan tim untuk minggu depan berdasarkan data di atas.' : 'Bahas harapan dan rencana umum untuk minggu depan berdasarkan konteks kegiatan minggu ini.'}
3. JANGAN menyebutkan nama anggota tim atau kontributor sama sekali.
4. Fokus pada pencapaian dan pekerjaan tim secara kolektif.
5. JANGAN membuat/menebak kepanjangan dari singkatan apa pun yang ada di daftar kegiatan (misal: SBR, SAKERNAS, dll), biarkan singkatan tersebut apa adanya.`

      if (!config.geminiApiKey) {
        throw new Error('API Key Gemini tidak ditemukan di .env (VITE_GEMINI_API_KEY).')
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${config.geminiApiKey}`
      const payload = {
        contents: [{ parts: [{ text: prompt }] }]
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      
      if (data.error) throw new Error(data.error.message)
      
      const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      
      loading.value = false
      return summary
    } catch (e) {
      error.value = e.message
      loading.value = false
      
      return 'Catatan: Ringkasan narasi belum dapat di-generate karena Server AI Google sedang sibuk atau mengalami gangguan (Error 503). Silakan coba lagi beberapa saat kemudian.'
    }
  }

  return {
    loading,
    error,
    isConnected,
    getActivities,
    addActivity,
    getSuggestions,
    getPeriods,
    deleteActivity,
    generateSummary,
  }
}
