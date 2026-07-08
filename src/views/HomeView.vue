<template>
  <div class="home-view">

    <section class="hero">
      <div class="hero__content animate-fade-in-up">
        <h2 class="hero__title">
          <span class="gradient-text">Rekap Aktivitas</span>
          <br />Seminggu Kedepan
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
      :is-future-period="isFuturePeriod"
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
        Isi/Edit Kegiatan
      </router-link>
      <div v-else class="action-bar__info">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ isFuturePeriod ? 'Pengisian untuk periode ini belum dibuka.' : 'Pengisian untuk periode ini sudah ditutup.' }}</span>
      </div>
    </div>


    <EmployeeStatus :activities="activities" :user-role="userRole" />


    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Memuat data kegiatan...</p>
    </div>


    <template v-else>
      <div
        v-for="team in teams"
        :key="team.id"
        class="team-table-section animate-fade-in-up"
      >
        <ActivityTable
          :activities="getTeamActivities(team.id)"
          :team-name="team.name"
        />
      </div>
    </template>


    <div v-if="activities.length > 0" class="export-section animate-fade-in">
      <h3 class="export-section__title">Export Laporan</h3>
      <p class="export-section__desc">Unduh rekap kegiatan dalam satu file ZIP berisi Excel dan PDF per tim.</p>
      <ExportButtons
        :activities="activities"
        :prev-activities="prevActivities"
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePeriod } from '../composables/usePeriod'
import { useApi } from '../composables/useApi'
import { parseISO, formatDateISO } from '../utils/dateUtils'

function getPrevPeriodISO(periodeISO) {
  const d = parseISO(periodeISO)
  d.setDate(d.getDate() - 7)
  return formatDateISO(d)
}
import { config } from '../config'
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
  isFuturePeriod,
  goToPeriod,
  goToPrevPeriod,
  goToNextPeriod,
  goToCurrentPeriod,
} = usePeriod()

const { getActivities, loading, verifyNip } = useApi()

const activities = ref([])
const prevActivities = ref([])
const toast = ref({ show: false, message: '', type: 'success' })
const userRole = ref('')

const teams = config.teams || []

function getTeamActivities(teamId) {
  return activities.value.filter(act => {
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
  return prevActivities.value.filter(act => {
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

async function loadActivities() {
  const [curr, prev] = await Promise.all([
    getActivities(periodISO.value),
    getActivities(getPrevPeriodISO(periodISO.value))
  ])
  activities.value = curr
  prevActivities.value = prev
}


onMounted(() => {
  if (route.query.period) {
    goToPeriod(parseISO(route.query.period))
  }
  if (route.query.added === 'true') {
    showToast('Kegiatan berhasil ditambahkan!', 'success')
  } else if (route.query.updated === 'true') {
    showToast('Kegiatan berhasil diperbarui!', 'success')
  }
  loadActivities()

  // Verify NIP if saved to identify if the logged-in user is Ketua Tim
  const savedNip = localStorage.getItem('user_nip')
  if (savedNip) {
    verifyNip(savedNip).then(res => {
      if (res.success) {
        userRole.value = res.employee.role
      }
    }).catch(e => console.error(e))
  }
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

.team-table-section {
  margin-top: var(--space-2);
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
