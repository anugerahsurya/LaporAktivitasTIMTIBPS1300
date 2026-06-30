<template>
  <div class="export-buttons">
    <button class="btn btn-primary btn-lg" @click="openNipModal" :disabled="disabled || isExporting">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      {{ isExporting ? 'Memproses...' : 'Unduh Laporan' }}
    </button>

    <!-- Wizard Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showNipModal" class="modal-backdrop">
          <div class="modal-content" :class="{'modal-large': wizardStep > 0}">
            <div class="modal-header">
              <svg v-if="wizardStep === 0" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <svg v-else-if="wizardStep === 1" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 11 12 14 22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              <svg v-else-if="wizardStep === 2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <svg v-else-if="wizardStep === 3" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              
              <h3>{{ getModalTitle() }}</h3>
            </div>

            <div class="modal-body-scrollable">
              <!-- Step 0: NIP Input State -->
              <div v-if="wizardStep === 0" class="modal-body">
                <p>
                  Masukkan <strong>NIP Ketua Tim</strong> untuk mengunduh laporan. Hanya ketua tim yang dapat mengunduh.
                </p>
                <div class="nip-input-group">
                  <label for="nip-input" class="nip-label">NIP Ketua Tim</label>
                  <div class="nip-field-wrapper">
                    <input
                      id="nip-input"
                      ref="nipInputRef"
                      v-model="nipInput"
                      type="text"
                      :name="randomName"
                      autocomplete="off"
                      class="nip-input"
                      :class="{ 'nip-input--error': nipError }"
                      placeholder="Masukkan NIP..."
                      @keyup.enter="verifyNipInput"
                      :disabled="verifyingNip"
                    />
                    <Transition name="shake">
                      <p v-if="nipError" class="nip-error">{{ nipError }}</p>
                    </Transition>
                  </div>
                </div>
              </div>

        <!-- Step 1: Pilih Kegiatan -->
        <div v-else-if="wizardStep === 1" class="modal-body">
          <p class="step-desc">Pilih kegiatan yang ingin ditampilkan dalam laporan. Beberapa kegiatan rutin dapat dihilangkan jika tidak perlu dilaporkan.</p>
          
          <div v-for="team in teamsWithData" :key="team.id" class="team-section">
            <h4>Tim: {{ team.name }}</h4>
            
            <div v-if="team.prevActivities.length > 0" class="mb-4">
              <h5>Kegiatan Minggu Lalu</h5>
              <div class="table-responsive">
                <table class="compact-table">
                  <thead>
                    <tr>
                      <th style="width: 60px; text-align: center;">Status</th>
                      <th style="width: 150px;">Nama Pegawai</th>
                      <th>Kegiatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="act in team.prevActivities" :key="act._ui_id" @click="selectedActivities[act._ui_id] = !selectedActivities[act._ui_id]">
                      <td style="text-align: center;">
                        <label class="toggle-switch" @click.stop>
                          <input type="checkbox" v-model="selectedActivities[act._ui_id]" />
                          <span class="slider round"></span>
                        </label>
                      </td>
                      <td><span class="act-person">{{ act.contributors.join(', ') }}</span></td>
                      <td><span class="act-name">{{ act.text }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div v-if="team.activities.length > 0" class="mb-4">
              <h5>Rencana Minggu Ini</h5>
              <div class="table-responsive">
                <table class="compact-table">
                  <thead>
                    <tr>
                      <th style="width: 60px; text-align: center;">Status</th>
                      <th style="width: 150px;">Nama Pegawai</th>
                      <th>Rencana / Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="act in team.activities" :key="act._ui_id" @click="selectedActivities[act._ui_id] = !selectedActivities[act._ui_id]">
                      <td style="text-align: center;">
                        <label class="toggle-switch" @click.stop>
                          <input type="checkbox" v-model="selectedActivities[act._ui_id]" />
                          <span class="slider round"></span>
                        </label>
                      </td>
                      <td><span class="act-person">{{ act.contributors.join(', ') }}</span></td>
                      <td><span class="act-name">{{ act.text }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>
        </div>

              <!-- Step 2: Edit Narasi -->
              <div v-else-if="wizardStep === 2" class="modal-body">
                <div v-if="isGeneratingSummary" class="loading-state">
                  <div class="spinner-large"></div>
                  <p>AI sedang menyusun ringkasan berdasarkan kegiatan yang dipilih...</p>
                </div>
                <div v-else>
                  <p class="step-desc">Berikut adalah narasi laporan yang di-generate AI. Silakan sesuaikan jika ada kalimat yang kurang pas.</p>
                  
                  <div v-for="team in teamsWithData" :key="team.id" class="team-section">
                    <h4>Ringkasan: {{ team.name }}</h4>
                    <textarea 
                      v-model="teamSummaries[team.id]" 
                      class="summary-textarea" 
                      rows="6"
                      placeholder="Ketikan ringkasan laporan..."
                    ></textarea>
                  </div>
                </div>
              </div>

              <!-- Step 3: Tanda Tangan -->
              <div v-else-if="wizardStep === 3" class="modal-body">
                <p class="step-desc">Tambahkan tanda tangan elektronik untuk dilampirkan pada laporan PDF.</p>
                
                <div class="signature-form">
                  <div class="form-group">
                    <label class="nip-label">Nama Ketua Tim</label>
                    <input type="text" v-model="signatureName" class="nip-input" />
                  </div>
                  <div class="form-group">
                    <label class="nip-label">Jabatan (Untuk Tanda Tangan)</label>
                    <input type="text" v-model="signatureRole" class="nip-input" />
                    <small class="help-text">Contoh: Ketua Tim Sistem Informasi Statistik dan Metodologi & Sains Data</small>
                  </div>
                  <div class="form-group">
                    <label class="nip-label">Tanda Tangan</label>
                    <SignaturePad v-model="signatureData" />
                  </div>
                  
                  <div class="signature-preview" v-if="signatureName || signatureRole || signatureData">
                    <div class="preview-header">
                      <label class="nip-label">Preview Tanda Tangan</label>
                      <div class="signature-controls" v-if="signatureData">
                        <div class="control-item">
                          <label>Ukuran: {{ Math.round(signatureScale * 100) }}%</label>
                          <input type="range" v-model.number="signatureScale" min="0.5" max="2" step="0.1" />
                        </div>
                        <div class="control-item">
                          <label>Geser (Kiri/Kanan):</label>
                          <input type="range" v-model.number="signatureOffsetX" min="-50" max="50" step="1" />
                        </div>
                      </div>
                    </div>
                    <div class="preview-box">
                      <div class="preview-role">{{ signatureRole }}</div>
                      <div class="preview-image" v-if="signatureData">
                        <img :src="signatureData" alt="Tanda Tangan" :style="{ transform: `scale(${signatureScale}) translateX(${signatureOffsetX}px)` }" />
                      </div>
                      <div class="preview-image-placeholder" v-else></div>
                      <div class="preview-name">{{ signatureName }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closeNipModal">Batal</button>
              
              <button
                v-if="wizardStep === 0"
                class="btn btn-primary"
                @click="verifyNipInput"
                :disabled="!nipInput.trim() || verifyingNip"
              >
                <span v-if="verifyingNip" class="spinner-small"></span>
                {{ verifyingNip ? 'Memverifikasi...' : 'Verifikasi' }}
              </button>

              <template v-else-if="wizardStep > 0">
                <button v-show="!isGeneratingSummary" class="btn btn-secondary" @click="prevStep">Kembali</button>
                <button 
                  v-if="wizardStep < 3" 
                  v-show="!isGeneratingSummary"
                  class="btn btn-primary" 
                  @click="nextStep"
                >
                  Lanjut
                </button>
                <button
                  v-else
                  class="btn btn-primary btn-download"
                  @click="startDownloadZip"
                  :disabled="!signatureData"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Generate & Unduh Laporan
                </button>
              </template>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Full-screen Loading Overlay for ZIP Generation -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="isExporting" class="loading-overlay">
          <div class="loading-overlay__card">
            <div class="loading-overlay__spinner-ring">
              <div class="loading-overlay__spinner"></div>
            </div>
            <h3 class="loading-overlay__title">Sedang Memproses</h3>
            <p class="loading-overlay__message">{{ loadingMessage }}</p>
            <div class="loading-overlay__progress">
              <div class="loading-overlay__progress-bar" :style="{ width: progressPercent + '%' }"></div>
            </div>
            <p class="loading-overlay__step">{{ currentStep }} / {{ totalSteps }} file</p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import JSZip from 'jszip'
import { exportToExcelBlob } from '../utils/exportExcel'
import { exportToPdfBlob } from '../utils/exportPdf'
import { useApi } from '../composables/useApi'
import { config } from '../config'
import SignaturePad from './SignaturePad.vue'

const props = defineProps({
  activities: { type: Array, default: () => [] },
  prevActivities: { type: Array, default: () => [] },
  periodLabel: { type: String, default: '' },
  activityRange: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false },
})

const showNipModal = ref(false)
const nipInput = ref('')
const randomName = ref('nip_field_' + Math.random().toString(36).substring(7))
const nipError = ref('')
const verifyingNip = ref(false)
const isExporting = ref(false)
const loadingMessage = ref('Menyiapkan laporan...')
const currentStep = ref(0)
const totalSteps = ref(0)
const progressPercent = ref(0)
const nipInputRef = ref(null)

const { generateSummary, verifyNip } = useApi()
const verifiedEmployee = ref(null)
const verifiedName = ref('')

// Wizard state
const wizardStep = ref(0)
const teamsWithData = ref([])
const selectedActivities = ref({})
const teamSummaries = ref({})
const isGeneratingSummary = ref(false)
const signatureName = ref('')
const signatureRole = ref('')
const signatureData = ref('')
const signatureScale = ref(1)
const signatureOffsetX = ref(0)

const teams = config.teams || []

function getModalTitle() {
  if (wizardStep.value === 0) return 'Verifikasi Ketua Tim'
  if (wizardStep.value === 1) return 'Pilih Kegiatan'
  if (wizardStep.value === 2) return 'Edit Narasi Laporan'
  if (wizardStep.value === 3) return 'Tanda Tangan'
  return ''
}

const teamsToExport = computed(() => {
  if (!verifiedEmployee.value) return []
  if (verifiedEmployee.value.team === 'Tim IT') {
    return teams.filter(t => t.id === 'sis' || t.id === 'metods')
  }
  const teamObj = teams.find(t => t.name === verifiedEmployee.value.team)
  return teamObj ? [teamObj] : []
})

function getTeamActivities(teamId, sourceList) {
  return sourceList.filter(act => {
    if (act.tim === teamId) return true
    if (act.tim === 'lainnya') {
      const empConfig = config.employees.find(e => String(e.id) === String(act.pegawai_id))
      if (empConfig) {
        if (empConfig.team === 'Tim IT') {
          return teamId === 'sis'
        }
        const teamObj = config.teams.find(t => t.name === empConfig.team)
        if (teamObj && teamObj.id === teamId) {
          return true
        }
      }
    }
    return false
  })
}

function getPeriodPrefix() {
  const match = props.periodLabel.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
  if (match) {
    const day = match[1].padStart(2, '0')
    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
    const monthIdx = monthNames.findIndex(m => m.toLowerCase() === match[2].toLowerCase())
    const month = monthIdx >= 0 ? String(monthIdx + 1).padStart(2, '0') : '00'
    const year = match[3]
    return `${day}${month}${year}`
  }
  const now = new Date()
  return `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}`
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Modal handling ──
function openNipModal() {
  if (props.activities.length === 0) return
  nipInput.value = ''
  nipError.value = ''
  verifiedName.value = ''
  verifiedEmployee.value = null
  wizardStep.value = 0
  randomName.value = 'nip_field_' + Math.random().toString(36).substring(7)
  showNipModal.value = true
  nextTick(() => {
    nipInputRef.value?.focus()
  })
}

function closeNipModal() {
  showNipModal.value = false
  wizardStep.value = 0
}

// ── Wizard Steps ──
async function verifyNipInput() {
  const nip = nipInput.value.trim()
  if (!nip) return

  nipError.value = ''
  verifyingNip.value = true

  try {
    const res = await verifyNip(nip)
    if (res.success && res.employee.role === 'Ketua Tim') {
      verifiedName.value = res.employee.name
      verifiedEmployee.value = res.employee
      
      // Prepare data for Step 1
      const exportTeams = teamsToExport.value
      
      // Clone activities and attach UI IDs
      const allActs = JSON.parse(JSON.stringify(props.activities))
      const allPrevActs = JSON.parse(JSON.stringify(props.prevActivities))
      
      allActs.forEach(a => a._ui_id = 'act_' + Math.random().toString(36).substr(2,9))
      allPrevActs.forEach(a => a._ui_id = 'prev_' + Math.random().toString(36).substr(2,9))

      function groupForUI(acts, keyField) {
        const map = new Map()
        acts.forEach(act => {
          let key = act[keyField] ? act[keyField].trim() : ''
          if (!key) key = '- (Belum mengisi)'
          if (!map.has(key)) {
            map.set(key, { _ui_id: 'grp_' + Math.random().toString(36).substr(2,9), text: key, contributors: [act.pegawai_nama] })
          } else if (!map.get(key).contributors.includes(act.pegawai_nama)) {
            map.get(key).contributors.push(act.pegawai_nama)
          }
        })
        return Array.from(map.values())
      }
      
      function groupPrevForUI(acts) {
        const map = new Map()
        acts.forEach(act => {
          let key = act.kegiatan ? act.kegiatan.trim() : (act.target_minggu_depan ? act.target_minggu_depan.trim() : '- (Belum mengisi)')
          if (!map.has(key)) {
            map.set(key, { _ui_id: 'grp_' + Math.random().toString(36).substr(2,9), text: key, contributors: [act.pegawai_nama] })
          } else if (!map.get(key).contributors.includes(act.pegawai_nama)) {
            map.get(key).contributors.push(act.pegawai_nama)
          }
        })
        return Array.from(map.values())
      }

      let hasAnyData = false
      teamsWithData.value = exportTeams.map(team => {
        const tActsRaw = getTeamActivities(team.id, allActs)
        const tPrevActsRaw = getTeamActivities(team.id, allPrevActs)
        
        const tActs = groupForUI(tActsRaw, 'target_minggu_depan')
        const tPrevActs = groupPrevForUI(tPrevActsRaw)
        
        tActs.forEach(a => selectedActivities.value[a._ui_id] = true)
        tPrevActs.forEach(a => selectedActivities.value[a._ui_id] = true)
        
        if (tActsRaw.length > 0 || tPrevActsRaw.length > 0) hasAnyData = true
        
        return {
          ...team,
          activities: tActs,
          prevActivities: tPrevActs,
          rawActs: tActsRaw,
          rawPrevActs: tPrevActsRaw
        }
      }).filter(t => t.rawActs.length > 0 || t.rawPrevActs.length > 0)

      if (!hasAnyData) {
        nipError.value = 'Tim yang Anda pimpin tidak memiliki laporan kegiatan di periode ini maupun periode sebelumnya.'
        return
      }

      wizardStep.value = 1 // Go to Select Activities
    } else {
      nipError.value = res.success ? `NIP terdaftar atas nama ${res.employee.name}, tetapi bukan Ketua Tim.` : (res.error || 'NIP tidak terdaftar.')
    }
  } catch (e) {
    nipError.value = 'Gagal memverifikasi NIP.'
  } finally {
    verifyingNip.value = false
  }
}

async function nextStep() {
  if (wizardStep.value === 1) {
    wizardStep.value = 2
    await generateAIForTeams()
  } else if (wizardStep.value === 2) {
    // Prep default signature values
    signatureName.value = verifiedName.value
    signatureRole.value = `Ketua Tim ${verifiedEmployee.value.team === 'Tim IT' ? 'Sistem Informasi Statistik dan Metodologi & Sains Data' : verifiedEmployee.value.team}`
    signatureData.value = ''
    wizardStep.value = 3
  }
}

function prevStep() {
  if (wizardStep.value > 1) {
    wizardStep.value--
  } else {
    wizardStep.value = 0 // back to nip (though might not be needed, but safe)
  }
}

async function generateAIForTeams() {
  isGeneratingSummary.value = true
  for (const team of teamsWithData.value) {
    const selectedActTexts = team.activities.filter(a => selectedActivities.value[a._ui_id]).map(a => a.text)
    const selectedPrevTexts = team.prevActivities.filter(a => selectedActivities.value[a._ui_id]).map(a => a.text)
    
    const filteredActs = team.rawActs.filter(act => {
      let key = act.target_minggu_depan ? act.target_minggu_depan.trim() : '- (Belum mengisi)'
      return selectedActTexts.includes(key)
    })
    
    const filteredPrevActs = team.rawPrevActs.filter(act => {
      let key = act.kegiatan ? act.kegiatan.trim() : (act.target_minggu_depan ? act.target_minggu_depan.trim() : '- (Belum mengisi)')
      return selectedPrevTexts.includes(key)
    })
    
    try {
      const summary = await generateSummary(filteredActs, filteredPrevActs)
      teamSummaries.value[team.id] = summary || ''
    } catch {
      teamSummaries.value[team.id] = ''
    }
  }
  isGeneratingSummary.value = false
}

// ── ZIP Download ──
async function startDownloadZip() {
  closeNipModal()
  isExporting.value = true

  const prefix = getPeriodPrefix()
  
  totalSteps.value = teamsWithData.value.length * 2
  currentStep.value = 0
  progressPercent.value = 0

  const zip = new JSZip()
  let completedTasks = 0
  const totalTasks = totalSteps.value

  const signatureParams = {
    image: signatureData.value,
    name: signatureName.value,
    role: signatureRole.value,
    scale: signatureScale.value,
    offsetX: signatureOffsetX.value
  }

  const teamPromises = teamsWithData.value.map(async (team) => {
    const selectedActTexts = team.activities.filter(a => selectedActivities.value[a._ui_id]).map(a => a.text)
    const selectedPrevTexts = team.prevActivities.filter(a => selectedActivities.value[a._ui_id]).map(a => a.text)
    
    const filteredActs = team.rawActs.filter(act => {
      let key = act.target_minggu_depan ? act.target_minggu_depan.trim() : '- (Belum mengisi)'
      return selectedActTexts.includes(key)
    })
    
    const filteredPrevActs = team.rawPrevActs.filter(act => {
      let key = act.kegiatan ? act.kegiatan.trim() : (act.target_minggu_depan ? act.target_minggu_depan.trim() : '- (Belum mengisi)')
      return selectedPrevTexts.includes(key)
    })

    // 1. Generate Excel
    const excelResult = exportToExcelBlob(filteredActs, props.periodLabel, team.name, prefix, props.activities, filteredPrevActs)
    zip.file(excelResult.filename, excelResult.blob)
    completedTasks++
    currentStep.value = completedTasks
    progressPercent.value = Math.round((completedTasks / totalTasks) * 80)

    // 2. Generate PDF
    const summary = teamSummaries.value[team.id] || ''
    const pdfResult = await exportToPdfBlob(
      filteredActs, 
      props.periodLabel, 
      props.activityRange, 
      summary, 
      team.name, 
      prefix, 
      team.id, 
      props.activities, 
      filteredPrevActs,
      signatureParams
    )
    zip.file(pdfResult.filename, pdfResult.blob)
    completedTasks++
    currentStep.value = completedTasks
    progressPercent.value = Math.round((completedTasks / totalTasks) * 80)
  })

  loadingMessage.value = `Menyusun berkas untuk ${teamsWithData.value.length} tim...`
  await Promise.all(teamPromises)

  loadingMessage.value = 'Mengompres file ZIP...'
  progressPercent.value = 90

  const zipBlob = await zip.generateAsync({ type: 'blob' })

  const zipFilename = `${prefix}-Laporan Aktivitas Tim TI.zip`
  const link = document.createElement('a')
  link.href = URL.createObjectURL(zipBlob)
  link.download = zipFilename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)

  progressPercent.value = 100
  loadingMessage.value = 'Selesai!'
  await delay(600)

  isExporting.value = false
}
</script>

<style scoped>
.export-buttons {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-large {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(247, 144, 57, 0.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto var(--space-3) auto;
}

/* ── Modal ── */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--color-background);
  display: flex;
  justify-content: center;
  align-items: center; /* Setengah halaman / center vertically */
  padding: var(--space-6) var(--space-4);
  overflow-y: auto;
  z-index: 9999;
}

.modal-content {
  background-color: var(--color-surface);
  color: var(--color-text);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 500px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  margin: auto 0; /* Ensures it pushes down naturally if content is huge, but stays centered */
  animation: modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-content.modal-large {
  max-width: 900px;
}

@keyframes modalSlideIn {
  from { opacity: 0; transform: scale(0.98) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-text);
}

.modal-body-scrollable {
  padding: var(--space-5);
  flex-grow: 1;
}

.modal-body p.step-desc {
  margin: 0 0 var(--space-4) 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

/* ── NIP Input ── */
.nip-input-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.nip-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text, #333);
}

.nip-field-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.nip-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  font-size: 1rem;
  font-family: 'Roboto Mono', 'Consolas', monospace;
  color: var(--color-text, #333);
  background: var(--color-background, #faf8f6);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}

.nip-input:focus {
  outline: none;
  border-color: var(--color-primary, #f79039);
  box-shadow: 0 0 0 3px rgba(247, 144, 57, 0.15);
}

.nip-input--error {
  border-color: var(--color-danger, #ef4444);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.nip-error {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-danger, #ef4444);
  line-height: 1.4;
  animation: shakeAnim 0.4s ease;
}

@keyframes shakeAnim {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}

/* ── Wizard Elements ── */
.team-section {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
}
.team-section h4 {
  margin: 0 0 var(--space-3) 0;
  color: var(--color-primary);
  font-size: 1.15rem;
  font-weight: 700;
  border-bottom: 1px dashed var(--color-border);
  padding-bottom: var(--space-2);
}
.mb-4 {
  margin-bottom: var(--space-6);
}
.mb-4 h5 {
  margin-top: 0;
  margin-bottom: var(--space-3);
  font-size: 1rem;
  color: var(--color-text-secondary);
}
.activity-group {
  margin-bottom: var(--space-4);
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}
.compact-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.compact-table th, .compact-table td {
  border: 1px solid var(--color-border);
  padding: var(--space-2) var(--space-3);
  vertical-align: top;
}
.compact-table th {
  background: var(--color-background);
  font-weight: 600;
  color: var(--color-text-secondary);
}
.compact-table tbody tr {
  cursor: pointer;
  transition: background var(--transition-fast);
}
.compact-table tbody tr:hover {
  background: rgba(0,0,0,0.02);
}
.text-center { text-align: center; }
.text-muted { color: var(--color-text-muted); }

.act-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text);
  display: block;
  line-height: 1.4;
}
.act-person {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.summary-textarea {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  line-height: 1.5;
  resize: vertical;
  color: var(--color-text);
  background: var(--color-surface);
}

/* ── Toggle Switch ── */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
  margin: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch .slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: .3s;
}

.toggle-switch .slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .3s;
}

.toggle-switch input:checked + .slider {
  background-color: #10b981; /* green */
}

.toggle-switch input:checked + .slider:before {
  transform: translateX(16px);
}

.toggle-switch .slider.round {
  border-radius: 20px;
}

.toggle-switch .slider.round:before {
  border-radius: 50%;
}
.summary-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(247, 144, 57, 0.15);
}

.loading-state {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--color-text-secondary);
}

.signature-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.help-text {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.signature-preview {
  margin-top: var(--space-4);
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--color-background);
  padding: var(--space-4);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  width: 100%;
}
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  gap: var(--space-4);
}
.signature-controls {
  display: flex;
  gap: var(--space-4);
  background: white;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}
.control-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.control-item label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}
.control-item input[type="range"] {
  width: 100px;
}

.preview-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: var(--space-3);
  font-family: 'Times New Roman', Times, serif;
  color: #000;
  background: white;
  padding: 1rem 2rem;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
}
.preview-role {
  font-size: 1.1rem;
  text-align: center;
  margin-bottom: 4px;
}
.preview-image {
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.preview-image img {
  max-height: 100%;
  object-fit: contain;
}
.preview-image-placeholder {
  height: 60px;
}
.preview-name {
  font-size: 1.1rem;
  font-weight: bold;
  text-align: center;
  margin-top: 4px;
}

/* ── Modal Footer ── */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  background-color: var(--color-border-light, #f8fafc);
  border-top: 1px solid var(--color-border, #e2e8f0);
  flex-shrink: 0;
}

.btn-download {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* ── Modal Transitions ── */
.modal-enter-active,
.modal-leave-active { transition: opacity 0.3s ease; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
.modal-enter-active .modal-content,
.modal-leave-active .modal-content { transition: transform 0.3s ease; }
.modal-enter-from .modal-content,
.modal-leave-to .modal-content { transform: scale(0.95) translateY(10px); }

.shake-enter-active { animation: shakeAnim 0.4s ease; }
.shake-leave-active { transition: opacity 0.2s ease; }
.shake-leave-to { opacity: 0; }

/* ── Full-screen Loading Overlay ── */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}
.loading-overlay__card {
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-xl, 20px);
  padding: 2.5rem 3rem;
  text-align: center;
  max-width: 420px;
  width: 90%;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
  animation: loadingCardIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes loadingCardIn {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.loading-overlay__spinner-ring {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1.5rem;
}
.loading-overlay__spinner {
  width: 56px;
  height: 56px;
  border: 4px solid var(--color-border, #e2e8f0);
  border-top-color: var(--color-primary, #f79039);
  border-right-color: var(--color-primary, #f79039);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading-overlay__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text, #1e293b);
  margin: 0 0 0.5rem 0;
}
.loading-overlay__message {
  font-size: 0.875rem;
  color: var(--color-text-secondary, #64748b);
  margin: 0 0 1.25rem 0;
  min-height: 1.5em;
}
.loading-overlay__progress {
  width: 100%;
  height: 6px;
  background: var(--color-border-light, #f1f5f9);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}
.loading-overlay__progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-gradient-1, #f79039), var(--color-gradient-2, #e07d2d));
  border-radius: 3px;
  transition: width 0.5s ease;
}
.loading-overlay__step {
  font-size: 0.75rem;
  color: var(--color-text-muted, #94a3b8);
  margin: 0;
  font-weight: 500;
}
</style>
