<template>
  <div class="signature-pad-container">
    <div class="signature-mode-tabs">
      <button 
        :class="['mode-btn', { active: mode === 'draw' }]" 
        @click="mode = 'draw'"
        type="button"
      >
        Gambar Tanda Tangan
      </button>
      <button 
        :class="['mode-btn', { active: mode === 'upload' }]" 
        @click="mode = 'upload'"
        type="button"
      >
        Unggah Gambar
      </button>
    </div>

    <div v-show="mode === 'draw'" class="signature-draw-area">
      <div class="signature-hint">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span>Gunakan area kotak di bawah semaksimal mungkin agar tanda tangan terlihat jelas di dokumen PDF. Area ini memiliki rasio 2:1 sesuai proporsi laporan.</span>
      </div>
      <canvas 
        ref="canvas" 
        class="signature-canvas"
        @pointerdown="startDrawing"
        @pointermove="draw"
        @pointerup="stopDrawing"
        @pointercancel="stopDrawing"
      ></canvas>
      <div class="signature-actions">
        <button type="button" class="btn btn-secondary btn-sm" @click="clearSignature">Hapus</button>
      </div>
    </div>

    <div v-show="mode === 'upload'" class="signature-upload-area">
      <label class="upload-label" :class="{ 'has-image': !!uploadedImage }">
        <input 
          type="file" 
          accept="image/png, image/jpeg" 
          class="upload-input" 
          @change="handleFileUpload"
        />
        <div v-if="!uploadedImage" class="upload-placeholder">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span>Pilih gambar tanda tangan (.png, .jpg)</span>
        </div>
        <img v-else :src="uploadedImage" class="uploaded-preview" />
      </label>
      <div class="signature-actions" v-if="uploadedImage">
        <button type="button" class="btn btn-secondary btn-sm" @click="removeUploadedImage">Hapus Gambar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'changed'])

const mode = ref('draw') // 'draw' or 'upload'
const canvas = ref(null)
const ctx = ref(null)
const isDrawing = ref(false)
const uploadedImage = ref('')
const hasDrawn = ref(false)

onMounted(() => {
  initCanvas()
})

watch(mode, () => {
  updateSignatureValue()
})

function initCanvas() {
  if (!canvas.value) return
  
  const rect = canvas.value.parentElement.getBoundingClientRect()
  // Maintain a standard aspect ratio of 2:1
  canvas.value.width = rect.width
  canvas.value.height = rect.width / 2
  
  ctx.value = canvas.value.getContext('2d')
  ctx.value.lineWidth = 2
  ctx.value.lineCap = 'round'
  ctx.value.lineJoin = 'round'
  ctx.value.strokeStyle = '#000000'
}

function getCoordinates(event) {
  const rect = canvas.value.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

function startDrawing(e) {
  e.preventDefault()
  isDrawing.value = true
  hasDrawn.value = true
  
  if (e.pointerId !== undefined && canvas.value.setPointerCapture) {
    canvas.value.setPointerCapture(e.pointerId)
  }
  
  const coords = getCoordinates(e)
  ctx.value.beginPath()
  ctx.value.moveTo(coords.x, coords.y)
}

function draw(e) {
  e.preventDefault()
  if (!isDrawing.value) return
  const coords = getCoordinates(e)
  ctx.value.lineTo(coords.x, coords.y)
  ctx.value.stroke()
}

function stopDrawing(e) {
  if (isDrawing.value) {
    isDrawing.value = false
    ctx.value.closePath()
    
    if (e && e.pointerId !== undefined && canvas.value.releasePointerCapture) {
      try {
        canvas.value.releasePointerCapture(e.pointerId)
      } catch (err) {}
    }
    
    updateSignatureValue()
  }
}

function clearSignature() {
  if (ctx.value) {
    ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
    hasDrawn.value = false
    updateSignatureValue()
  }
}

function handleFileUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (event) => {
    uploadedImage.value = event.target.result
    updateSignatureValue()
  }
  reader.readAsDataURL(file)
}

function removeUploadedImage() {
  uploadedImage.value = ''
  updateSignatureValue()
}

function updateSignatureValue() {
  let val = ''
  if (mode.value === 'draw' && hasDrawn.value) {
    // Only return dataURL if something was drawn, to avoid blank images.
    // In practice, we check hasDrawn.
    val = canvas.value.toDataURL('image/png')
  } else if (mode.value === 'upload' && uploadedImage.value) {
    val = uploadedImage.value
  }
  
  emit('update:modelValue', val)
  emit('changed', !!val)
}
</script>

<style scoped>
.signature-pad-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
}

.signature-mode-tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.mode-btn {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.mode-btn:hover {
  background: var(--color-background);
}

.mode-btn.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.signature-draw-area {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 500px;
  margin: 0 auto;
  width: 100%;
}

.signature-canvas {
  width: 100%;
  aspect-ratio: 2 / 1;
  background: var(--color-surface);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  cursor: crosshair;
  touch-action: none; /* Prevent scrolling on touch devices while drawing */
}

.signature-actions {
  display: flex;
  justify-content: flex-end;
}

.signature-hint {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3);
  background-color: var(--color-primary-lighter);
  border: 1px solid var(--color-primary-light);
  border-radius: var(--radius-sm);
  color: var(--color-primary-hover);
  font-size: 0.8rem;
  line-height: 1.4;
}
.signature-hint svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.signature-upload-area {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 500px;
  margin: 0 auto;
  width: 100%;
}

.upload-label {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 150px;
  background: var(--color-surface);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  overflow: hidden;
  position: relative;
  transition: border-color var(--transition-fast);
}

.upload-label:hover {
  border-color: var(--color-primary);
}

.upload-label.has-image {
  border-style: solid;
}

.upload-input {
  display: none;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.uploaded-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
