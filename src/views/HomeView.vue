<template>
  <div class="home-view">

    <section class="hero">
      <div class="hero__content animate-fade-in-up">
        <h2 class="hero__title">
          <span class="gradient-text">Rekap Aktivitas</span>
          <br />Seminggu Kedepan Tim TI
        </h2>
        <p class="hero__subtitle">
          Pantau dan catat target aktivitas tim secara terstruktur setiap minggunya.
        </p>
      </div>
    </section>


    <PeriodSelector
      :period-label="periodLabel"
      :activity-range="activityRange"
      :can-fill="canFill"
      :is-current-period="isCurrentPeriod"
      @prev="goToPrevPeriod"
      @next="goToNextPeriod"
      @today="goToCurrentPeriod"
    />


    <div class="action-bar animate-fade-in" style="animation-delay: 100ms;">
      <router-link
        v-if="canFill"
        to="/add"
        class="btn btn-primary btn-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Isi Kegiatan
      </router-link>
      <div v-else class="action-bar__info">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>Pengisian untuk periode ini sudah ditutup.</span>
      </div>
    </div>


    <EmployeeStatus :activities="activities" />


    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Memuat data kegiatan...</p>
    </div>


    <ActivityTable v-else :activities="activities" />


    <div v-if="activities.length > 0" class="export-section animate-fade-in">
      <h3 class="export-section__title">Export Laporan</h3>
      <p class="export-section__desc">Download rekap kegiatan dalam format Excel atau PDF.</p>
      <ExportButtons
        :activities="activities"
        :period-label="periodLabel"
        :activity-range="activityRange"
        :disabled="activities.length === 0"
      />
    </div>


    <Transition name="toast">
      <div v-if="toast.show" :class="['toast', `toast-${toast.type}`]">
        <strong>{{ toast.type === 'success' ? '✓' : '✕' }}</strong>
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePeriod } from '../composables/usePeriod'
import { useApi } from '../composables/useApi'
import { parseISO } from '../utils/dateUtils'
import PeriodSelector from '../components/PeriodSelector.vue'
import EmployeeStatus from '../components/EmployeeStatus.vue'
import ActivityTable from '../components/ActivityTable.vue'
import ExportButtons from '../components/ExportButtons.vue'

const route = useRoute()
const {
  periodLabel,
  periodISO,
  activityRange,
  canFill,
  isCurrentPeriod,
  goToPeriod,
  goToPrevPeriod,
  goToNextPeriod,
  goToCurrentPeriod,
} = usePeriod()

const { getActivities, loading } = useApi()

const activities = ref([])
const toast = ref({ show: false, message: '', type: 'success' })

async function loadActivities() {
  activities.value = await getActivities(periodISO.value)
}


onMounted(() => {
  if (route.query.period) {
    goToPeriod(parseISO(route.query.period))
  }
  if (route.query.added === 'true') {
    showToast('Kegiatan berhasil ditambahkan!', 'success')
  }
  loadActivities()
})

watch(periodISO, () => {
  loadActivities()
})

function showToast(message, type = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}
</script>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-6) 0 var(--space-16);
}

.hero {
  text-align: center;
  padding: var(--space-8) 0 var(--space-4);
}

.hero__title {
  font-size: var(--font-size-3xl);
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: var(--space-3);
}

.hero__subtitle {
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  max-width: 500px;
  margin: 0 auto;
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.action-bar__info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  background: var(--color-warning-light);
  color: var(--color-warning);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-12);
}

.loading-container p {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.export-section {
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.export-section__title {
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-1);
}

.export-section__desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-4);
}

.toast-enter-active {
  animation: slideInRight var(--transition-spring);
}
.toast-leave-active {
  transition: all var(--transition-normal);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(80px);
}

@media (max-width: 640px) {
  .hero__title {
    font-size: var(--font-size-2xl);
  }
}
</style>
