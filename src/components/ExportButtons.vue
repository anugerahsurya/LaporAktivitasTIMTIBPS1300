<template>
  <div class="export-buttons">
    <button class="btn btn-secondary" @click="handleExportExcel" :disabled="disabled">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
      Export Excel
    </button>

    <button class="btn btn-primary" @click="openConfirmModal" :disabled="disabled || loadingSummary">
      <svg v-if="!loadingSummary" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <span v-if="loadingSummary" class="spinner-small"></span>
      {{ loadingSummary ? 'Generating Summary...' : 'Export PDF' }}
    </button>


    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showConfirmModal" class="modal-backdrop" @click="closeConfirmModal">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <h3>Perhatian!</h3>
            </div>
            <div class="modal-body">
              <p>
                Diharapkan <strong>selain ketua tim jangan klik tombol ini</strong>, soalnya pake summary AI gratis, jadi tokennya terbatas heheheh.
              </p>
              <p>
                Selain itu untuk ngebatasi akses juga belum bisa karena web ini ga pake autentikasi huhu.
              </p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closeConfirmModal">Batal</button>
              <button class="btn btn-primary" @click="confirmExportPdf">Lanjutkan (Saya Ketua Tim)</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { exportToExcel } from '../utils/exportExcel'
import { exportToPdf } from '../utils/exportPdf'
import { useApi } from '../composables/useApi'

const props = defineProps({
  activities: { type: Array, default: () => [] },
  periodLabel: { type: String, default: '' },
  activityRange: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false },
})

const loadingSummary = ref(false)
const showConfirmModal = ref(false)
const { generateSummary } = useApi()

function handleExportExcel() {
  if (props.activities.length === 0) return
  exportToExcel(props.activities, props.periodLabel)
}

function openConfirmModal() {
  if (props.activities.length === 0) return
  showConfirmModal.value = true
}

function closeConfirmModal() {
  showConfirmModal.value = false
}

async function confirmExportPdf() {
  closeConfirmModal()
  loadingSummary.value = true
  let summary = ''
  try {
    summary = await generateSummary(props.activities)
  } catch {
    summary = ''
  }
  loadingSummary.value = false

  await exportToPdf(props.activities, props.periodLabel, props.activityRange, summary)
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
  background-color: #ffffff;
  color: #333333;
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 450px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.modal-header {
  background-color: var(--surface);
  color: var(--text);
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
  color: var(--text);
}

.modal-body {
  padding: var(--space-5) var(--space-5) 0 var(--space-5);
  background-color: #ffffff;
}

.modal-body p {
  margin: 0 0 var(--space-3) 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #555555;
}

.modal-body strong {
  color: #111111;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5) var(--space-5) var(--space-5);
  background-color: #fafafa;
  border-top: 1px solid #eeeeee;
}

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
</style>
