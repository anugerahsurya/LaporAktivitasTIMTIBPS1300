<template>
  <div class="add-form">
    <div class="add-form__card card">
      <div class="add-form__header">
        <h2>{{ isEditMode ? 'Edit Laporan' : 'Tambah Laporan' }}</h2>
        <p>{{ isEditMode ? 'Perbarui rencana kegiatan Anda untuk minggu ini.' : 'Isikan rencana kegiatan untuk minggu ini.' }}</p>
      </div>

      <!-- Himbauan Pengisian -->
      <div class="himbauan-card">
        <div class="himbauan-card__icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        </div>
        <div class="himbauan-card__content">
          <strong>Himbauan Pengisian:</strong> Isilah target aktivitas dengan kalimat formal bahasa Indonesia yang baik dan benar (diawali kata kerja berimbuhan, misal: <em>Melakukan...</em>, <em>Membuat...</em>, <em>Mengikuti...</em>). Sistem akan melakukan pengecekan ejaan secara otomatis.
        </div>
      </div>

      <!-- Form Input NIP (Verifikasi Identitas) -->
      <div v-if="!isVerified" class="verification-section">
        <div class="form-group mb-6">
          <label class="form-label" for="nip-input">Masukkan NIP Anda</label>
          <div class="input-with-action">
            <input
              id="nip-input"
              class="form-input"
              type="text"
              inputmode="numeric"
              v-model="nipInput"
              placeholder="Masukkan 18 digit NIP Anda..."
              @keyup.enter="verifyNip"
              maxlength="30"
            />
            <button class="btn btn-primary" @click="verifyNip" type="button">
              Verifikasi
            </button>
          </div>
          <p class="form-help-text">Masukkan NIP untuk mulai mengisi target kegiatan Anda.</p>
        </div>
      </div>

      <div v-else class="animate-fade-in-up">
        <div v-if="loadingExisting" class="loading-existing">
          <div class="spinner-small"></div>
          <p>Memuat data laporan Anda...</p>
        </div>
        <div v-else>
          <!-- Card Profil Pegawai -->
          <div class="user-profile-card">
            <div class="user-profile-card__avatar">
              {{ verifiedEmployeeData?.name?.charAt(0) }}
            </div>
            <div class="user-profile-card__info">
              <span class="user-profile-card__label">Mengisi Laporan Sebagai</span>
              <h3 class="user-profile-card__name">{{ verifiedEmployeeData?.name }}</h3>
              <p class="user-profile-card__role">{{ verifiedEmployeeData?.role }} — NIP: {{ verifiedEmployeeData?.nip || '-' }}</p>
              <div style="margin-top: 6px;">
                <span class="user-profile-card__team-badge">
                  {{ verifiedEmployeeData?.team === '-' ? 'Ketua TIM' : verifiedEmployeeData?.team }}
                </span>
              </div>
            </div>
            <button class="btn btn-ghost btn-sm user-profile-card__logout" @click="handleLogout" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Ganti Akun
            </button>
          </div>

          <!-- Monday Attendance Selection -->
          <div class="form-group mb-8">
            <label class="form-label" style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
              <div class="section-icon-box">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              Kehadiran Hari Senin ({{ nextMondayDate }})
            </label>
            <div class="attendance-options">
              <label class="attendance-option option-hadir" :class="{ active: attendance === 'Hadir' }">
                <input type="radio" v-model="attendance" value="Hadir" />
                <span class="option-dot"></span>
                Hadir
              </label>
              <label class="attendance-option option-cuti" :class="{ active: attendance === 'Cuti' }">
                <input type="radio" v-model="attendance" value="Cuti" />
                <span class="option-dot"></span>
                Cuti
              </label>
              <label class="attendance-option option-izin" :class="{ active: attendance === 'Izin' }">
                <input type="radio" v-model="attendance" value="Izin" />
                <span class="option-dot"></span>
                Izin
              </label>
            </div>
          </div>

          <!-- Input Keterangan Izin -->
          <Transition name="fade-height">
            <div v-if="attendance === 'Izin'" class="form-group mb-8 permission-reason-group">
              <label class="form-label" for="permission-reason">Keterangan Izin</label>
              <input
                id="permission-reason"
                class="form-input"
                type="text"
                v-model="permissionReason"
                placeholder="Misal: Sakit, Dinas Luar, Mengikuti Diklat, dll..."
                maxlength="200"
              />
              <p class="form-help-text">Masukkan keterangan atau alasan izin Anda secara singkat. <strong>Catatan: Keterangan ini hanya dapat dilihat oleh Ketua Tim.</strong></p>
            </div>
          </Transition>

          <div class="section-container">
            <h3 class="section-title section-title--target">
              <div class="section-icon-box section-icon-box--target">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="6"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
              </div>
              Rencana Kegiatan Minggu Ini
            </h3>
            <div class="add-form__activities">
              <div
                v-for="(target, idx) in futureTargets"
                :key="'target-'+idx"
                class="activity-entry card"
              >
                <div class="activity-entry__header">
                  <span class="activity-entry__number activity-entry__number--target">Target {{ idx + 1 }}</span>
                  <button
                    class="btn btn-ghost btn-sm"
                    @click="removeFutureTarget(idx)"
                    title="Hapus target"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>

                <div class="form-group">
                  <div class="autocomplete-wrapper">
                    <input
                      class="form-input"
                      type="text"
                      v-model="target.text"
                      @input="onTargetInput(idx)"
                      @focus="showTargetSuggestions[idx] = true"
                      @blur="onTargetBlur(idx)"
                      placeholder="Ketik rencana kegiatan untuk minggu ini..."
                      autocomplete="off"
                      maxlength="500"
                    />
                    <div
                      v-if="showTargetSuggestions[idx] && filteredTargetSuggestions(idx).length > 0"
                      class="autocomplete-dropdown"
                    >
                      <div
                        v-for="suggestion in filteredTargetSuggestions(idx)"
                        :key="suggestion"
                        class="autocomplete-item"
                        @mousedown.prevent="selectTargetSuggestion(idx, suggestion)"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="11" cy="11" r="8"/>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        {{ suggestion }}
                      </div>
                    </div>
                  </div>

                  <!-- Grammar / Typo Warning -->
                  <div v-if="target.warning" class="grammar-warning">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <span>{{ target.warning }}</span>
                  </div>

                  <!-- Per-target Team Selector -->
                  <div class="target-team-selector" style="margin-top: 12px;">
                    <label class="form-label" style="font-size: 13px; color: var(--color-text-secondary); margin-bottom: 6px; display: block;">Identifikasi Tim untuk kegiatan ini:</label>
                    <div class="team-toggle">
                      <template v-if="verifiedEmployeeData?.team === '-'">
                        <label class="team-toggle-option" :class="{ active: target.tim === 'sis' }">
                          <input type="radio" v-model="target.tim" value="sis" />
                          Tim SIS
                        </label>
                        <label class="team-toggle-option" :class="{ active: target.tim === 'metods' }">
                          <input type="radio" v-model="target.tim" value="metods" />
                          Tim Metodologi
                        </label>
                        <label class="team-toggle-option" :class="{ active: target.tim === 'lainnya' }">
                          <input type="radio" v-model="target.tim" value="lainnya" />
                          Tim Lainnya
                        </label>
                      </template>
                      <template v-else>
                        <label class="team-toggle-option" :class="{ active: target.tim === (userTeamId || 'utama') }">
                          <input type="radio" v-model="target.tim" :value="userTeamId || 'utama'" />
                          Tim Utama
                        </label>
                        <label class="team-toggle-option" :class="{ active: target.tim === 'lainnya' }">
                          <input type="radio" v-model="target.tim" value="lainnya" />
                          Tim Lainnya
                        </label>
                      </template>
                    </div>
                  </div>
                </div>
              </div>

              <button class="btn btn-secondary add-form__add-more" @click="addFutureTarget">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Tambah Target Lain
              </button>
            </div>
            <p v-if="showErrors && !hasTarget" class="validation-error">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Minimal 1 rencana kegiatan minggu ini harus diisi.
            </p>
          </div>

          <div class="add-form__actions">
            <button class="btn btn-ghost" @click="$emit('cancel')">Batal</button>
            <button
              class="btn btn-primary btn-lg"
              @click="handleSubmit"
              :disabled="submitting"
            >
              <span v-if="submitting" class="spinner-small"></span>
              {{ submitting ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Submit Laporan') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <Transition name="toast">
      <div v-if="toastVisible" class="toast toast--error">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { config } from '../config'
import { parseISO, formatDate } from '../utils/dateUtils'
import { checkIndonesianGrammar } from '../utils/grammarChecker'
import { useApi } from '../composables/useApi'

const props = defineProps({
  suggestions: { type: Object, default: () => ({ kegiatan: [], target: [] }) },
  periode: { type: String, required: true },
})

function sanitizeInput(text) {
  if (!text) return ''
  let clean = text.substring(0, 500)
  clean = clean.replace(/<[^>]*>/g, '')
  if (clean.startsWith('=') || clean.startsWith('+') || clean.startsWith('-') || clean.startsWith('@')) {
    clean = "'" + clean
  }
  return clean.trim()
}

const emit = defineEmits(['submit', 'cancel'])

const { verifyNip: verifyNipApi, getActivities, deleteActivity } = useApi()

const userTeamId = computed(() => {
  if (!verifiedEmployeeData.value?.team) return ''
  const t = config.teams.find(t => t.name === verifiedEmployeeData.value.team)
  return t ? t.id : ''
})

const defaultTeamId = computed(() => {
  if (verifiedEmployeeData.value?.team === '-') return 'sis'
  return userTeamId.value || 'utama'
})

const selectedEmployee = ref('')
const nipInput = ref('')
const isVerified = ref(false)
const verifiedEmployeeData = ref(null)
const loadingExisting = ref(false)
const existingIds = ref([])
const attendance = ref('Hadir')
const permissionReason = ref('')
const teams = config.teams || []
const submitting = ref(false)
const showErrors = ref(false)
const toastVisible = ref(false)
const toastMessage = ref('')
let toastTimer = null

const futureTargets = reactive([{ text: '', warning: '', suggestions: [], tim: '' }])
const showTargetSuggestions = reactive({})
const debouncers = {}

async function loadExistingActivities() {
  if (!selectedEmployee.value) return
  loadingExisting.value = true
  try {
    const currentActs = await getActivities(props.periode, false)
    const myActs = currentActs.filter(act => String(act.pegawai_id) === String(selectedEmployee.value))
    
    if (myActs.length > 0) {
      existingIds.value = myActs.map(act => act.id)
      
      // Load Kehadiran
      if (myActs[0].kehadiran) {
        attendance.value = myActs[0].kehadiran
      }
      if (myActs[0].keterangan_kehadiran) {
        permissionReason.value = myActs[0].keterangan_kehadiran
      } else {
        permissionReason.value = ''
      }
      // Load Targets
      futureTargets.length = 0
      myActs.forEach(act => {
        if (act.target_minggu_depan) {
          futureTargets.push({
            text: act.target_minggu_depan,
            warning: '',
            suggestions: [],
            tim: act.tim || defaultTeamId.value
          })
        }
      })
      
      if (futureTargets.length === 0) {
        futureTargets.push({ text: '', warning: '', suggestions: [], tim: defaultTeamId.value })
      }
    } else {
      existingIds.value = []
      if (futureTargets.length === 1 && !futureTargets[0].text) {
        futureTargets[0].tim = defaultTeamId.value
      }
    }
  } catch (e) {
    console.error('Gagal mengambil data kegiatan yang ada:', e)
    showToast('Gagal memuat data kegiatan sebelumnya. Anda tetap bisa mengisi baru.')
  } finally {
    loadingExisting.value = false
  }
}

onMounted(async () => {
  const savedNip = localStorage.getItem('user_nip')
  if (savedNip) {
    submitting.value = true
    try {
      const result = await verifyNipApi(savedNip)
      if (result.success) {
        verifiedEmployeeData.value = result.employee
        selectedEmployee.value = result.employee.id
        isVerified.value = true
        await loadExistingActivities()
      } else {
        localStorage.removeItem('user_nip')
      }
    } catch (e) {
      console.error(e)
    } finally {
      submitting.value = false
    }
  }
})

async function verifyNip() {
  const input = nipInput.value.trim()
  if (!input) {
    showToast('Silakan masukkan NIP Anda terlebih dahulu.')
    return
  }
  submitting.value = true
  try {
    const result = await verifyNipApi(input)
    if (result.success) {
      localStorage.setItem('user_nip', result.employee.nip)
      verifiedEmployeeData.value = result.employee
      selectedEmployee.value = result.employee.id
      isVerified.value = true
      showErrors.value = false
      await loadExistingActivities()
    } else {
      showToast(result.error || 'NIP tidak terdaftar. Hubungi admin atau periksa kembali NIP Anda.')
    }
  } catch (e) {
    showToast('Gagal menghubungi server verifikasi.')
  } finally {
    submitting.value = false
  }
}

function handleLogout() {
  localStorage.removeItem('user_nip')
  selectedEmployee.value = ''
  nipInput.value = ''
  isVerified.value = false
  verifiedEmployeeData.value = null
  existingIds.value = []
  
  attendance.value = 'Hadir'
  permissionReason.value = ''
  futureTargets.length = 0
  futureTargets.push({ text: '', warning: '', suggestions: [], tim: '' })
}

const isEditMode = computed(() => existingIds.value.length > 0)

const nextMondayDate = computed(() => {
  if (!props.periode) return ''
  const d = parseISO(props.periode)
  d.setDate(d.getDate() + 1) // Sunday -> Monday
  return formatDate(d)
})

const hasTarget = computed(() => futureTargets.some(t => t.text.trim().length > 0))

const isValid = computed(() => {
  if (!selectedEmployee.value) return false
  const validTargets = futureTargets.filter(t => t.text.trim().length > 0)
  if (validTargets.length === 0) return false
  if (validTargets.some(t => !t.tim)) return false
  return true
})

function showToast(message) {
  toastMessage.value = message
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, 4000)
}

function addFutureTarget() { 
  futureTargets.push({ text: '', warning: '', suggestions: [], tim: defaultTeamId.value }) 
}

function removeFutureTarget(idx) { 
  futureTargets.splice(idx, 1) 
  if (debouncers[idx]) {
    clearTimeout(debouncers[idx])
    delete debouncers[idx]
  }
}

function checkTargetGrammar(idx) {
  const target = futureTargets[idx]
  if (!target) return
  const result = checkIndonesianGrammar(target.text)
  target.warning = result.warning
  target.suggestions = result.suggestions
}

function onTargetInput(idx) { 
  showTargetSuggestions[idx] = true 
  
  if (futureTargets[idx].text.trim().length === 0) {
    futureTargets[idx].warning = ''
    futureTargets[idx].suggestions = []
    return
  }

  if (debouncers[idx]) clearTimeout(debouncers[idx])
  debouncers[idx] = setTimeout(() => {
    checkTargetGrammar(idx)
  }, 800)
}

function onTargetBlur(idx) {
  setTimeout(() => { 
    showTargetSuggestions[idx] = false 
  }, 200)
  checkTargetGrammar(idx)
}

function filteredTargetSuggestions(idx) {
  const query = futureTargets[idx].text.toLowerCase().trim()
  
  const targetList = props.suggestions.target || []
  const kegiatanList = props.suggestions.kegiatan || []
  const list = Array.from(new Set([...targetList, ...kegiatanList]))
  
  if (!query) return list
  return list.filter(s => s.toLowerCase().includes(query))
}

function selectTargetSuggestion(idx, suggestion) {
  futureTargets[idx].text = suggestion
  showTargetSuggestions[idx] = false
  checkTargetGrammar(idx)
}

async function handleSubmit() {
  showErrors.value = true

  if (!selectedEmployee.value) {
    showToast('Silakan verifikasi NIP Anda terlebih dahulu.')
    return
  }

  if (!hasTarget.value) {
    showToast('Minimal 1 rencana kegiatan minggu ini harus diisi.')
    return
  }

  if (submitting.value) return

  submitting.value = true
  
  try {
    if (isEditMode.value) {
      for (const id of existingIds.value) {
        await deleteActivity(id)
      }
    }

    const validTargets = futureTargets.filter(t => t.text.trim().length > 0)
    const finalActivities = validTargets.map(t => ({
      kegiatan: '',
      target: sanitizeInput(t.text),
      tim: t.tim || defaultTeamId.value
    }))

    const data = {
      periode: props.periode,
      pegawai_id: selectedEmployee.value,
      pegawai_nama: verifiedEmployeeData.value?.name || '',
      activities: finalActivities,
      kehadiran: attendance.value,
      keterangan_kehadiran: attendance.value === 'Izin' ? permissionReason.value.trim() : '',
    }

    emit('submit', data, isEditMode.value, (success) => {
      if (!success) {
        submitting.value = false
      }
    })
  } catch (e) {
    console.error(e)
    showToast('Terjadi kesalahan saat memproses laporan.')
    submitting.value = false
  }
}
</script>

<style scoped>
.add-form {
  max-width: 720px;
  margin: 0 auto;
}

.add-form__card {
  padding: var(--space-8);
}

.add-form__header {
  margin-bottom: var(--space-4);
}

.add-form__header h2 {
  font-size: var(--font-size-2xl);
  margin-bottom: var(--space-2);
  background: linear-gradient(135deg, var(--color-gradient-1), var(--color-gradient-2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.add-form__header p {
  color: var(--color-text-secondary);
}

/* Himbauan Card */
.himbauan-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: var(--color-primary-lighter);
  border: 1px solid var(--color-primary-light);
  color: var(--color-text);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-6);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.himbauan-card__icon {
  color: var(--color-primary);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 2px;
}

.user-profile-card__team-badge {
  display: inline-block;
  background: var(--color-primary-light, rgba(247, 144, 57, 0.15));
  color: var(--color-primary, #f79039);
  border: 1px solid var(--color-primary, #f79039);
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs, 11px);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Attendance Selector */
.attendance-options {
  display: flex;
  gap: var(--space-4);
  margin-top: var(--space-2);
}

.attendance-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
  background: var(--color-surface);
}

.attendance-option input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.option-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-text-muted);
  transition: all var(--transition-fast);
}

.option-hadir:hover {
  border-color: var(--color-success);
  background: var(--color-primary-lighter);
  color: var(--color-success);
}
.option-hadir.active {
  border-color: var(--color-success);
  background: var(--color-primary-lighter);
  color: var(--color-success);
}
.option-hadir.active .option-dot {
  background: var(--color-success);
  box-shadow: 0 0 6px var(--color-success);
}

.option-cuti:hover {
  border-color: var(--color-warning);
  background: var(--color-warning-light);
  color: var(--color-warning);
}
.option-cuti.active {
  border-color: var(--color-warning);
  background: var(--color-warning-light);
  color: var(--color-warning);
}
.option-cuti.active .option-dot {
  background: var(--color-warning);
  box-shadow: 0 0 6px var(--color-warning);
}

/* Team Selector Dropdown */
.select-wrapper {
  position: relative;
}

.custom-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: var(--space-10);
  cursor: pointer;
  background-color: var(--color-surface);
}

.custom-select.placeholder-active {
  color: var(--color-text-muted);
}

.select-arrow {
  position: absolute;
  top: 50%;
  right: var(--space-4);
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-select:focus + .select-arrow {
  color: var(--color-primary);
}

/* Team Toggle Switch */
.team-toggle {
  display: flex;
  background: var(--color-border-light);
  border-radius: var(--radius-md);
  padding: 4px;
  gap: 4px;
}

.team-toggle-option {
  flex: 1;
  text-align: center;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  border-radius: calc(var(--radius-md) - 2px);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
}

.team-toggle-option input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.team-toggle-option.active {
  background: linear-gradient(135deg, var(--color-gradient-1), var(--color-gradient-2));
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(247, 144, 57, 0.3);
}

/* Boxed Icons for Sections */
.section-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--color-gradient-1), var(--color-gradient-2));
  color: white;
  border-radius: var(--radius-md);
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(247, 144, 57, 0.3);
}

.section-icon-box--target {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

/* Grammar Warning */
.grammar-warning {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--color-warning);
  background: var(--color-warning-light);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: var(--radius-sm);
  line-height: 1.4;
}

.grammar-warning svg {
  flex-shrink: 0;
  margin-top: 1px;
}

.mb-8 {
  margin-bottom: var(--space-8);
}

.section-container {
  margin-bottom: var(--space-6);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  margin-bottom: var(--space-4);
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.section-title--target {
  /* target title specific adjustments if any */
}

.add-form__activities {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.activity-entry {
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  border: 1px solid var(--color-border);
  background: var(--color-surface-hover);
}

.activity-entry__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.activity-entry__number {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-primary);
}

.activity-entry__number--target {
  color: var(--color-warning);
}

.autocomplete-wrapper {
  position: relative;
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: none;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  max-height: 200px;
  overflow-y: auto;
  z-index: 50;
  box-shadow: var(--shadow-lg);
}

.autocomplete-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.autocomplete-item:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.autocomplete-item svg {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.add-form__add-more {
  align-self: flex-start;
}

.add-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-8);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-border);
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Validation error message */
.validation-error {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-3);
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-danger, #ef4444);
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-md, 8px);
  animation: shake 0.4s ease-in-out;
}

.validation-error svg {
  flex-shrink: 0;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(2px); }
}

/* Toast Notification */
.toast {
  position: fixed;
  bottom: var(--space-6, 24px);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
  padding: var(--space-4, 16px) var(--space-6, 24px);
  border-radius: var(--radius-lg, 12px);
  font-size: var(--font-size-sm, 14px);
  font-weight: 500;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  max-width: 90vw;
}

.toast--error {
  background: linear-gradient(135deg, #dc2626, #ef4444);
  color: white;
}

.toast--error svg {
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.85);
}

/* Toast transition */
.toast-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-leave-active {
  transition: all 0.25s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px) scale(0.98);
}

@media (max-width: 640px) {
  .add-form__card {
    padding: var(--space-5);
  }

  .toast {
    bottom: var(--space-4, 16px);
    padding: var(--space-3, 12px) var(--space-5, 20px);
    font-size: var(--font-size-xs, 12px);
  }
}

/* User Profile Card styling */
.user-profile-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-8);
  transition: all var(--transition-fast);
  flex-wrap: wrap;
}

.user-profile-card__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--color-gradient-1), var(--color-gradient-2));
  color: white;
  font-size: var(--font-size-lg);
  font-weight: 700;
  border-radius: var(--radius-full);
  box-shadow: 0 4px 10px rgba(247, 144, 57, 0.2);
}

.user-profile-card__info {
  flex-grow: 1;
}

.user-profile-card__label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  margin-bottom: 2px;
}

.user-profile-card__name {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.user-profile-card__role {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.user-profile-card__logout {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.user-profile-card__logout:hover {
  color: var(--color-danger);
  background: var(--color-danger-light);
  border-color: var(--color-danger);
}

@media (max-width: 640px) {
  .user-profile-card__logout {
    margin-left: auto;
  }
}

.input-with-action {
  display: flex;
  gap: var(--space-3);
}

.input-with-action .form-input {
  flex-grow: 1;
}

.form-help-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-top: var(--space-2);
}

/* Attendance Option: Izin */
.option-izin:hover {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.08);
  color: #3b82f6;
}
.option-izin.active {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.08);
  color: #3b82f6;
}
.option-izin.active .option-dot {
  background: #3b82f6;
  box-shadow: 0 0 6px rgba(59, 130, 246, 0.6);
}

.loading-existing {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12) 0;
  color: var(--color-text-secondary);
  gap: var(--space-3);
}

.loading-existing .spinner-small {
  border-color: rgba(247, 144, 57, 0.2);
  border-top-color: var(--color-primary);
  width: 24px;
  height: 24px;
}

/* fade-height transition for leave reason */
.fade-height-enter-active,
.fade-height-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 120px;
  overflow: hidden;
}

.fade-height-enter-from,
.fade-height-leave-to {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0 !important;
  transform: translateY(-10px);
}
</style>
