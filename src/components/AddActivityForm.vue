<template>
  <div class="add-form">
    <div class="add-form__card card">
      <div class="add-form__header">
        <h2>Tambah Laporan</h2>
        <p>Isikan target aktivitas untuk minggu depan.</p>
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

        <!-- Monday Attendance Selection -->
        <div class="form-group mb-8">
          <label class="form-label" style="display: flex; align-items: center; gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-primary);">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
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
          </div>
        </div>

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
                    @blur="onTargetBlur(idx)"
                    placeholder="Ketik target untuk minggu depan..."
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
import { parseISO, formatDate } from '../utils/dateUtils'
import { checkIndonesianGrammar } from '../utils/grammarChecker'

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

const employees = config.employees
const selectedEmployee = ref('')
const attendance = ref('Hadir')
const submitting = ref(false)
const showErrors = ref(false)
const toastVisible = ref(false)
const toastMessage = ref('')
let toastTimer = null

const futureTargets = reactive([{ text: '', warning: '', suggestions: [] }])
const showTargetSuggestions = reactive({})
const debouncers = {}

const selectedEmployeeData = computed(() =>
  employees.find(e => String(e.id) === String(selectedEmployee.value))
)

const nextMondayDate = computed(() => {
  if (!props.periode) return ''
  const d = parseISO(props.periode)
  d.setDate(d.getDate() + 1) // Sunday -> Monday
  return formatDate(d)
})

const hasTarget = computed(() => futureTargets.some(t => t.text.trim().length > 0))

const isValid = computed(() => {
  if (!selectedEmployee.value) return false
  return hasTarget.value
})

function showToast(message) {
  toastMessage.value = message
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, 4000)
}

function addFutureTarget() { 
  futureTargets.push({ text: '', warning: '', suggestions: [] }) 
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
  const list = props.suggestions.target || []
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
    showToast('Silakan pilih nama pegawai terlebih dahulu.')
    return
  }

  if (!hasTarget.value) {
    showToast('Minimal 1 target minggu depan harus diisi.')
    return
  }

  if (submitting.value) return

  submitting.value = true
  
  const validTargets = futureTargets.map(t => sanitizeInput(t.text)).filter(Boolean)
  const finalActivities = validTargets.map(target => ({
    kegiatan: '',
    target: target
  }))

  const data = {
    periode: props.periode,
    pegawai_id: selectedEmployee.value,
    pegawai_nama: selectedEmployeeData.value?.name || '',
    activities: finalActivities,
    kehadiran: attendance.value,
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
