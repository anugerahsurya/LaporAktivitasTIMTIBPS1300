import { ref } from 'vue'
import { config } from '../config'
import { parseISO, formatDateISO } from '../utils/dateUtils'

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

  async function getActivities(periode) {
    loading.value = true
    error.value = null
    try {
      if (isConnected) {
        const res = await fetch(`${config.apiUrl}?action=getActivities&periode=${periode}`)
        const data = await res.json()
        loading.value = false
        return data.activities || []
      } else {
        const all = getLocalData('activities') || []
        const currentActs = all.filter(a => a.periode === periode)
        loading.value = false
        return currentActs
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
          kehadiran: activityData.kehadiran || '',
          tim: act.tim || '',
          keterangan_kehadiran: activityData.keterangan_kehadiran || ''
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
    loading.value = true
    error.value = null
    try {
      if (isConnected) {
        const res = await fetch(`${config.apiUrl}?action=getSuggestions&periode=${periode}`)
        const data = await res.json()
        loading.value = false
        return {
          kegiatan: data.kegiatan || data.suggestions || [],
          target: data.target || data.suggestions || []
        }
      } else {
        const all = getLocalData('activities') || []
        const uniqueActivities = [...new Set(all.map(a => a.kegiatan).filter(Boolean))]
        const uniqueTargets = [...new Set(all.map(a => a.target_minggu_depan).filter(Boolean))]
        loading.value = false
        return {
          kegiatan: uniqueActivities,
          target: uniqueTargets
        }
      }
    } catch (e) {
      error.value = e.message
      loading.value = false
      return { kegiatan: [], target: [] }
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

  async function generateSummary(activities, prevActivities = []) {
    loading.value = true
    error.value = null
    try {
      const pastList = prevActivities.map(a => a.kegiatan || a.target_minggu_depan).filter(Boolean)
      const activityList = [...new Set(pastList)].join(', ')
      const targetList = activities.map(a => a.target_minggu_depan).filter(Boolean)
      const uniqueTargets = [...new Set(targetList)].join(', ')

      const prompt = `Buatkan ringkasan narasi eksekutif (tepat 2 paragraf padat) untuk laporan aktivitas mingguan Tim Teknologi Informasi BPS Provinsi Sumatera Barat. 

Daftar kegiatan yang diselesaikan minggu ini: ${activityList ? activityList : 'Kosong'}.
Rencana/target kegiatan minggu depan: ${uniqueTargets ? uniqueTargets : 'Kosong'}.

Instruksi spesifik:
1. Paragraf pertama: Bahas intisari kegiatan yang telah diselesaikan minggu ini secara profesional. Jika daftar kegiatan Kosong, maka isi paragraf pertama HANYA dengan teks "Data belum tersedia." tanpa tambahan kalimat apa pun.
2. Paragraf kedua: Bahas rencana dan target kegiatan tim untuk minggu depan berdasarkan data di atas. JANGAN melakukan improvisasi di luar konteks, HANYA jabarkan sesuai poin target yang tersedia. Jika rencana/target minggu depan Kosong, maka isi paragraf kedua HANYA dengan teks "Data belum tersedia." tanpa tambahan kalimat apa pun.
3. JANGAN menyebutkan nama anggota tim atau kontributor sama sekali.
4. Fokus pada pencapaian dan pekerjaan tim secara kolektif.
5. JANGAN membuat/menebak kepanjangan dari singkatan apa pun yang ada di daftar kegiatan (misal: SBR, SAKERNAS, dll), biarkan singkatan tersebut apa adanya.`

      if (!config.geminiApiKey) {
        throw new Error('API Key Gemini tidak ditemukan di .env (VITE_GEMINI_API_KEY).')
      }

      const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest', 'gemini-3.5-flash']
      let lastError = null
      let summary = ''

      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.geminiApiKey}`
          const payload = {
            contents: [{ parts: [{ text: prompt }] }]
          }

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}))
            throw new Error(errData?.error?.message || `HTTP error! status: ${res.status}`)
          }

          const data = await res.json()
          if (data.error) throw new Error(data.error.message)

          summary = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
          if (summary) {
            break
          }
        } catch (e) {
          console.warn(`Gagal menggunakan model ${model}: ${e.message}`)
          lastError = e.message
        }
      }

      if (!summary) {
        throw new Error(lastError || 'Gagal menghubungi server Gemini.')
      }

      loading.value = false
      return summary
    } catch (e) {
      error.value = e.message
      loading.value = false
      
      if (e.message.includes('API Key Gemini tidak ditemukan')) {
        return `Catatan: Ringkasan narasi belum dapat di-generate. ${e.message} Pastikan API Key di file .env sudah benar, lalu restart server (matikan npm run dev lalu jalankan kembali).`
      }
      return `Catatan: Ringkasan narasi belum dapat di-generate. Detail: ${e.message}`
    }
  }

  async function verifyNip(nip) {
    loading.value = true
    error.value = null
    try {
      if (isConnected) {
        const res = await fetch(`${config.apiUrl}?action=verifyNip&nip=${nip}`)
        const data = await res.json()
        loading.value = false
        return data
      } else {
        const { employees } = await import('../data/employees')
        const matched = employees.find(e => String(e.id) === String(nip) || (e.nip && String(e.nip) === String(nip)))
        loading.value = false
        if (matched) {
          return {
            success: true,
            employee: {
              id: matched.id,
              name: matched.name,
              role: matched.role,
              nip: matched.nip || String(matched.id),
              team: matched.team
            }
          }
        }
        return { success: false, error: 'NIP tidak terdaftar.' }
      }
    } catch (e) {
      error.value = e.message
      loading.value = false
      return { success: false, error: e.message }
    }
  }

  async function updateActivityTexts(updates) {
    loading.value = true
    error.value = null
    try {
      if (isConnected) {
        const res = await fetch(config.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'updateActivityTexts',
            updates,
          }),
        })
        const data = await res.json()
        loading.value = false
        return data
      } else {
        const all = getLocalData('activities') || []
        updates.forEach(upd => {
          const matched = all.find(a => String(a.id) === String(upd.id))
          if (matched) {
            if (upd.field === 'kegiatan') {
              matched.kegiatan = upd.text
            } else {
              matched.target_minggu_depan = upd.text
            }
          }
        })
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
    verifyNip,
    updateActivityTexts,
  }
}

