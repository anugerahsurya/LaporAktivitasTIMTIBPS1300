<template>
  <div class="history-view">
    <div class="container">

      <router-link to="/" class="back-link animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        Kembali ke Beranda
      </router-link>


      <div class="history-header animate-fade-in-up">
        <h2 class="gradient-text">Riwayat Periode</h2>
        <p>Lihat kegiatan yang tercatat di periode-periode sebelumnya.</p>
      </div>


      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Memuat data...</p>
      </div>


      <div v-else class="period-grid stagger-children">
        <div
          v-for="period in periods"
          :key="period.dateISO"
          class="period-card card hover-lift"
          @click="viewPeriod(period.dateISO)"
        >
          <div class="period-card__date">
            <div class="period-card__day">{{ period.day }}</div>
            <div class="period-card__month">{{ period.month }}</div>
            <div class="period-card__year">{{ period.year }}</div>
          </div>

          <div class="period-card__info">
            <h4>{{ period.label }}</h4>
            <p>{{ period.activityRange }}</p>
            <div class="period-card__stats">
              <span v-if="period.activityCount > 0" class="badge badge-success">
                {{ period.activityCount }} Kegiatan
              </span>
              <span v-else class="badge badge-warning">
                Belum ada data
              </span>
            </div>
          </div>

          <div class="period-card__arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      </div>


      <div v-if="!loading && periods.length === 0" class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <h3>Belum Ada Riwayat</h3>
        <p>Belum ada data kegiatan yang tercatat di periode manapun.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '../composables/useApi'
import { parseISO, formatDate, getActivityRange } from '../utils/dateUtils'

const router = useRouter()
const { getPeriods, getActivities, loading } = useApi()

const BULAN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const periods = ref([])

onMounted(async () => {
  const registeredPeriods = await getPeriods()
  const result = []

  for (const iso of registeredPeriods) {
    const date = parseISO(iso)
    const acts = await getActivities(iso)
    const range = getActivityRange(date)
    const uniqueActivities = [...new Set(acts.map(a => a.kegiatan))]

    result.push({
      dateISO: iso,
      date,
      day: date.getDate(),
      month: BULAN_SHORT[date.getMonth()],
      year: date.getFullYear(),
      label: `Minggu, ${formatDate(date)}`,
      activityRange: `${formatDate(range.start)} — ${formatDate(range.end)}`,
      activityCount: uniqueActivities.length,
    })
  }

  periods.value = result
})

function viewPeriod(dateISO) {
  router.push({ path: '/', query: { period: dateISO } })
}
</script>

<style scoped>
.history-view {
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

.history-header {
  margin-bottom: var(--space-8);
}

.history-header h2 {
  font-size: var(--font-size-2xl);
  margin-bottom: var(--space-2);
}

.history-header p {
  color: var(--color-text-secondary);
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
}

.period-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.period-card {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-5);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.period-card:hover {
  border-color: var(--color-primary);
}

.period-card__date {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
  padding: var(--space-3);
  background: linear-gradient(135deg, var(--color-gradient-1), var(--color-gradient-2));
  border-radius: var(--radius-md);
  color: white;
}

.period-card__day {
  font-size: var(--font-size-xl);
  font-weight: 800;
  line-height: 1;
}

.period-card__month {
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.period-card__year {
  font-size: var(--font-size-xs);
  opacity: 0.8;
}

.period-card__info {
  flex: 1;
}

.period-card__info h4 {
  font-size: var(--font-size-base);
  margin-bottom: var(--space-1);
}

.period-card__info p {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

.period-card__arrow {
  color: var(--color-text-muted);
  transition: transform var(--transition-fast);
}

.period-card:hover .period-card__arrow {
  transform: translateX(4px);
  color: var(--color-primary);
}

@media (max-width: 640px) {
  .period-card {
    padding: var(--space-3);
    gap: var(--space-3);
  }
}
</style>
