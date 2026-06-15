<template>
  <div class="add-view">
    <div class="container">
      <!-- Back Button -->
      <router-link to="/" class="back-link animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        Kembali ke Beranda
      </router-link>

      <!-- Period Info -->
      <div class="period-info card animate-fade-in-up" style="animation-delay: 50ms;">
        <div class="period-info__icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div>
          <h3>{{ periodLabel }}</h3>
          <p>Pengisian dibuka: {{ fillingRange.start }} — {{ fillingRange.end }}</p>
        </div>
      </div>

      <!-- Not Open Warning -->
      <div v-if="!canFill" class="warning-card card animate-fade-in-up" style="animation-delay: 100ms;">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div>
          <h4>Pengisian Belum/Sudah Ditutup</h4>
          <p>Pengisian untuk periode ini hanya dibuka pada {{ fillingRange.start }} — {{ fillingRange.end }}.</p>
        </div>
      </div>

      <!-- Form -->
      <AddActivityForm
        v-if="canFill"
        :suggestions="suggestions"
        :periode="periodISO"
        @submit="handleSubmit"
        @cancel="router.push('/')"
        class="animate-fade-in-up"
        style="animation-delay: 150ms;"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePeriod } from '../composables/usePeriod'
import { useApi } from '../composables/useApi'
import AddActivityForm from '../components/AddActivityForm.vue'

const router = useRouter()
const { periodLabel, periodISO, fillingRange, canFill } = usePeriod()
const { addActivity, getSuggestions } = useApi()

const suggestions = ref({ kegiatan: [], target: [] })

onMounted(async () => {
  suggestions.value = await getSuggestions(periodISO.value)
})

async function handleSubmit(data) {
  const result = await addActivity(data)
  if (result.success !== false) {
    router.push({ path: '/', query: { added: 'true' } })
  }
}
</script>

<style scoped>
.add-view {
  padding: var(--space-6) 0 var(--space-16);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  text-decoration: none;
  margin-bottom: var(--space-6);
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: var(--color-primary);
}

.period-info {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  margin-bottom: var(--space-6);
}

.period-info__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.period-info h3 {
  font-size: var(--font-size-md);
  margin-bottom: var(--space-1);
}

.period-info p {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.warning-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--color-warning-light);
  border-color: var(--color-warning);
  color: var(--color-warning);
  margin-bottom: var(--space-6);
}

.warning-card h4 {
  color: var(--color-warning);
  margin-bottom: var(--space-1);
}

.warning-card p {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>
