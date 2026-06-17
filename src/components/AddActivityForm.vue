<template>
  <div class="add-form">
    <div class="add-form__card card">
      <div class="add-form__header">
        <h2>Tambah Laporan</h2>
        <p>Isikan kegiatan yang telah dilakukan minggu sebelumnya dan target minggu depan.</p>
      </div>


      <div class="form-group mb-8">
        <label class="form-label" for="employee-select">Nama Pegawai</label>
        <select
          id="employee-select"
          class="form-select"
          v-model="selectedEmployee"
        >
          <option value="" disabled>— Pilih Pegawai —</option>
          <option
            v-for="emp in employees"
            :key="emp.id"
            :value="emp.id"
          >
            {{ emp.name }} ({{ emp.role }})
          </option>
        </select>
      </div>

      <div v-if="selectedEmployee" class="animate-fade-in-up">

        <div class="section-container">
          <h3 class="section-title">Aktivitas Seminggu Sebelumnya</h3>
          <div class="add-form__activities">
            <div
              v-for="(activity, idx) in pastActivities"
              :key="'kegiatan-'+idx"
              class="activity-entry card"
            >
              <div class="activity-entry__header">
                <span class="activity-entry__number">Kegiatan {{ idx + 1 }}</span>
                <button
                  class="btn btn-ghost btn-sm"
                  @click="removePastActivity(idx)"
                  title="Hapus kegiatan"
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
                    v-model="activity.text"
                    @input="onKegiatanInput(idx)"
                    @focus="showSuggestions[idx] = true"
                    @blur="hideSuggestions(idx)"
                    placeholder="Ketik kegiatan yang sudah diselesaikan..."
                    autocomplete="off"
                  />
                  <div
                    v-if="showSuggestions[idx] && filteredSuggestions(idx).length > 0"
                    class="autocomplete-dropdown"
                  >
                    <div
                      v-for="suggestion in filteredSuggestions(idx)"
                      :key="suggestion"
                      class="autocomplete-item"
                      @mousedown.prevent="selectSuggestion(idx, suggestion)"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      {{ suggestion }}
                    </div>
                  </div>
                </div>
              </div>
            </div>


            <button class="btn btn-secondary add-form__add-more" @click="addPastActivity">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Tambah Kegiatan Lain
            </button>
          </div>
          <p v-if="showErrors && !hasActivity" class="validation-error">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Minimal 1 kegiatan minggu ini harus diisi.
          </p>
        </div>

        <hr class="section-divider" />


        <div class="section-container">
          <h3 class="section-title section-title--target">Target Minggu Depan</h3>
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
                    @blur="hideTargetSuggestions(idx)"
                    placeholder="Ketik target untuk minggu depan..."
                    autocomplete="off"
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
            Minimal 1 target minggu depan harus diisi.
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
            {{ submitting ? 'Menyimpan...' : 'Submit Laporan' }}
          </button>
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
import { ref, reactive, computed } from 'vue'
import { config } from '../config'

const props = defineProps({
  suggestions: { type: Object, default: () => ({ kegiatan: [], target: [] }) },
  periode: { type: String, required: true },
})

const emit = defineEmits(['submit', 'cancel'])

const employees = config.employees
const selectedEmployee = ref('')
const submitting = ref(false)
const showErrors = ref(false)
const toastVisible = ref(false)
const toastMessage = ref('')
let toastTimer = null

const pastActivities = reactive([{ text: '' }])
const futureTargets = reactive([{ text: '' }])

const showSuggestions = reactive({})
const showTargetSuggestions = reactive({})

const selectedEmployeeData = computed(() =>
  employees.find(e => String(e.id) === String(selectedEmployee.value))
)

const hasActivity = computed(() => pastActivities.some(a => a.text.trim().length > 0))
const hasTarget = computed(() => futureTargets.some(t => t.text.trim().length > 0))

const isValid = computed(() => {
  if (!selectedEmployee.value) return false
  return hasActivity.value && hasTarget.value
})

function showToast(message) {
  toastMessage.value = message
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, 4000)
}

function addPastActivity() { pastActivities.push({ text: '' }) }
function removePastActivity(idx) { pastActivities.splice(idx, 1) }

function addFutureTarget() { futureTargets.push({ text: '' }) }
function removeFutureTarget(idx) { futureTargets.splice(idx, 1) }

function onKegiatanInput(idx) { showSuggestions[idx] = true }

function hideSuggestions(idx) {
  setTimeout(() => { showSuggestions[idx] = false }, 200)
}

function filteredSuggestions(idx) {
  const query = pastActivities[idx].text.toLowerCase().trim()
  const list = props.suggestions.kegiatan || []
  if (!query) return list
  return list.filter(s => s.toLowerCase().includes(query))
}

function selectSuggestion(idx, suggestion) {
  pastActivities[idx].text = suggestion
  showSuggestions[idx] = false
}

function onTargetInput(idx) { showTargetSuggestions[idx] = true }

function hideTargetSuggestions(idx) {
  setTimeout(() => { showTargetSuggestions[idx] = false }, 200)
}

function filteredTargetSuggestions(idx) {
  const query = futureTargets[idx].text.toLowerCase().trim()
  const list = props.suggestions.target || []
  if (!query) return list
  return list.filter(s => s.toLowerCase().includes(query))
}

function selectTargetSuggestion(idx, suggestion) {
  futureTargets[idx].text = suggestion
  showTargetSuggestions[idx] = false
}

async function handleSubmit() {
  showErrors.value = true

  if (!selectedEmployee.value) {
    showToast('Silakan pilih nama pegawai terlebih dahulu.')
    return
  }

  if (!hasActivity.value && !hasTarget.value) {
    showToast('Kegiatan minggu ini dan target minggu depan wajib diisi minimal masing-masing 1.')
    return
  }
  if (!hasActivity.value) {
    showToast('Minimal 1 kegiatan minggu ini harus diisi.')
    return
  }
  if (!hasTarget.value) {
    showToast('Minimal 1 target minggu depan harus diisi.')
    return
  }

  if (submitting.value) return

  submitting.value = true
  
  const validActivities = pastActivities.map(a => a.text.trim()).filter(Boolean)
  const validTargets = futureTargets.map(t => t.text.trim()).filter(Boolean)

  const maxLength = Math.max(validActivities.length, validTargets.length)
  const finalActivities = []

  for (let i = 0; i < maxLength; i++) {
    finalActivities.push({
      kegiatan: validActivities[i] || '',
      target: validTargets[i] || ''
    })
  }

  const data = {
    periode: props.periode,
    pegawai_id: selectedEmployee.value,
    pegawai_nama: selectedEmployeeData.value?.name || '',
    activities: finalActivities,
  }

  emit('submit', data)
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
  margin-bottom: var(--space-6);
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

.mb-8 {
  margin-bottom: var(--space-8);
}

.section-container {
  margin-bottom: var(--space-6);
}

.section-divider {
  border: none;
  border-top: 1px dashed var(--color-border);
  margin: var(--space-8) 0;
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  margin-bottom: var(--space-4);
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.section-title::before {
  content: '';
  display: block;
  width: 4px;
  height: 20px;
  background: var(--color-primary);
  border-radius: 2px;
}

.section-title--target::before {
  background: var(--color-warning);
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
</style>
