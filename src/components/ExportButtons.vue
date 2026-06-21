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

    <!-- NIP Verification Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showNipModal" class="modal-backdrop" @click="closeNipModal">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary, #f79039)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <h3>Verifikasi Ketua Tim</h3>
            </div>

            <!-- NIP Input State -->
            <div v-if="!nipVerified" class="modal-body">
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

            <!-- Verified State — shows download button -->
            <div v-else class="modal-body modal-body--verified">
              <div class="verified-badge">
                <div class="verified-badge__icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div class="verified-badge__info">
                  <span class="verified-badge__label">Terverifikasi</span>
                  <span class="verified-badge__name">{{ verifiedName }}</span>
                </div>
              </div>
              <p class="verified-desc">
                Laporan akan berisi file <strong>Excel</strong> dan <strong>PDF</strong> untuk
                <strong>{{ teamsToExport.length }} tim</strong> dalam 1 file ZIP.
              </p>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closeNipModal">Batal</button>
              <button
                v-if="!nipVerified"
                class="btn btn-primary"
                @click="verifyNipInput"
                :disabled="!nipInput.trim() || verifyingNip"
              >
                <span v-if="verifyingNip" class="spinner-small"></span>
                {{ verifyingNip ? 'Memverifikasi...' : 'Verifikasi' }}
              </button>
              <button
                v-else
                class="btn btn-primary btn-download"
                @click="startDownloadZip"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Unduh Laporan (.zip)
              </button>
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
const nipVerified = ref(false)
const verifiedName = ref('')
const verifyingNip = ref(false)
const isExporting = ref(false)
const loadingMessage = ref('Menyiapkan laporan...')
const currentStep = ref(0)
const totalSteps = ref(0)
const progressPercent = ref(0)
const nipInputRef = ref(null)

const { generateSummary } = useApi()

const teams = config.teams || []

/**
 * Determine which teams this Ketua Tim leads.
 * Aan Subrata has team: '-' meaning he is Ketua for ALL teams.
 */
const teamsToExport = computed(() => {
  // For the verified Ketua Tim, find which teams they belong to
  const ketuaEmployee = config.employees.find(
    e => e.role === 'Ketua Tim' && e.nip === nipInput.value.trim()
  )
  if (!ketuaEmployee) return []

  // If team is 'Tim IT', the leader is Ketua for both SIS and Metods
  if (ketuaEmployee.team === 'Tim IT') {
    return teams.filter(t => t.id === 'sis' || t.id === 'metods')
  }

  // Otherwise, find the specific team
  const teamObj = teams.find(t => t.name === ketuaEmployee.team)
  return teamObj ? [teamObj] : []
})

function getTeamActivities(teamId) {
  return props.activities.filter(act => {
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

function getTeamPrevActivities(teamId) {
  return props.prevActivities.filter(act => {
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
  nipVerified.value = false
  verifiedName.value = ''
  randomName.value = 'nip_field_' + Math.random().toString(36).substring(7)
  showNipModal.value = true
  nextTick(() => {
    nipInputRef.value?.focus()
  })
}

function closeNipModal() {
  showNipModal.value = false
  nipInput.value = ''
  nipError.value = ''
  nipVerified.value = false
  verifiedName.value = ''
}

// ── NIP Verification ──
async function verifyNipInput() {
  const nip = nipInput.value.trim()
  if (!nip) return

  nipError.value = ''
  verifyingNip.value = true

  await delay(400) // Small UX delay for feedback

  // Check if NIP belongs to a Ketua Tim
  const ketuaEmployee = config.employees.find(
    e => String(e.nip) === nip && e.role === 'Ketua Tim'
  )

  if (ketuaEmployee) {
    nipVerified.value = true
    verifiedName.value = ketuaEmployee.name
  } else {
    // Check if NIP exists but is not Ketua Tim
    const anyEmployee = config.employees.find(e => String(e.nip) === nip)
    if (anyEmployee) {
      nipError.value = `NIP terdaftar atas nama ${anyEmployee.name}, tetapi bukan Ketua Tim.`
    } else {
      nipError.value = 'NIP tidak terdaftar. Pastikan NIP yang dimasukkan benar.'
    }
  }

  verifyingNip.value = false
}

// ── ZIP Download ──
async function startDownloadZip() {
  const prefix = getPeriodPrefix()
  const exportTeams = teamsToExport.value
  const teamsWithData = exportTeams.filter(team => 
    getTeamActivities(team.id).length > 0 || getTeamPrevActivities(team.id).length > 0
  )

  if (teamsWithData.length === 0) {
    nipError.value = 'Tim yang Anda pimpin tidak memiliki laporan kegiatan di periode ini maupun periode sebelumnya.'
    verifyingNip.value = false
    // Don't close modal, just show error
    return
  }

  closeNipModal()
  isExporting.value = true

  // Total files: Excel + PDF per team
  totalSteps.value = teamsWithData.length * 2
  currentStep.value = 0
  progressPercent.value = 0

  const zip = new JSZip()
  let completedTasks = 0
  const totalTasks = teamsWithData.length * 2

  const teamPromises = teamsWithData.map(async (team) => {
    const teamActs = getTeamActivities(team.id)
    const teamPrevActs = getTeamPrevActivities(team.id)

    // 1. Generate Excel
    const excelResult = exportToExcelBlob(teamActs, props.periodLabel, team.name, prefix, props.activities, teamPrevActs)
    zip.file(excelResult.filename, excelResult.blob)
    completedTasks++
    currentStep.value = completedTasks
    progressPercent.value = Math.round((completedTasks / totalTasks) * 80) // 80% is allocated for file gen

    // 2. Generate PDF (with AI summary)
    let summary = ''
    try {
      summary = await generateSummary(teamActs, teamPrevActs)
    } catch {
      summary = ''
    }

    const pdfResult = await exportToPdfBlob(teamActs, props.periodLabel, props.activityRange, summary, team.name, prefix, team.id, props.activities, teamPrevActs)
    zip.file(pdfResult.filename, pdfResult.blob)
    completedTasks++
    currentStep.value = completedTasks
    progressPercent.value = Math.round((completedTasks / totalTasks) * 80)
  })

  loadingMessage.value = `Menyusun berkas dan meminta ringkasan AI untuk ${teamsWithData.length} tim... (Proses AI memakan waktu 10-20 detik)`
  await Promise.all(teamPromises)

  // Generate and download ZIP
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

/* ── NIP Modal ── */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-content {
  background-color: var(--color-surface, #ffffff);
  color: var(--color-text, #333333);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 480px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--color-border);
  overflow: hidden;
  animation: modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  background-color: var(--color-surface, #ffffff);
  color: var(--color-text, #333333);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  margin: 0;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-text);
}

.modal-body {
  padding: var(--space-5);
}

.modal-body p {
  margin: 0 0 var(--space-4) 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--color-text-secondary, #555555);
}

.modal-body strong {
  color: var(--color-text, #111111);
}

.modal-body--verified {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
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
  letter-spacing: 1px;
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

.nip-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

/* ── Verified Badge ── */
.verified-badge {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--color-success-light, #dcfce7);
  border: 1px solid rgba(22, 163, 74, 0.2);
  border-radius: var(--radius-md, 8px);
  animation: verifiedPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes verifiedPop {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.verified-badge__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(22, 163, 74, 0.1);
  border-radius: 50%;
}

.verified-badge__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.verified-badge__label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-success, #16a34a);
}

.verified-badge__name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text, #1e293b);
}

.verified-desc {
  margin: 0 !important;
  font-size: 0.9rem !important;
  color: var(--color-text-secondary, #64748b) !important;
  line-height: 1.5 !important;
}

/* ── Modal Footer ── */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  background-color: var(--color-border-light, #f8fafc);
  border-top: 1px solid var(--color-border, #e2e8f0);
}

.btn-download {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  animation: verifiedPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ── Modal Transitions ── */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95) translateY(10px);
}

/* ── Shake Transition ── */
.shake-enter-active {
  animation: shakeAnim 0.4s ease;
}

.shake-leave-active {
  transition: opacity 0.2s ease;
}

.shake-leave-to {
  opacity: 0;
}

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
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
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
  transition: all 0.3s ease;
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
