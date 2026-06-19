<template>
  <div class="employee-status">
    <div class="employee-status__header">
      <div class="employee-status__header-left">
        <h4 class="employee-status__title">Kehadiran Senin Depan</h4>
        <div class="status-legend">
          <span class="legend-item">
            <span class="legend-dot legend-dot--present"></span>
            Hadir
          </span>
          <span class="legend-item">
            <span class="legend-dot legend-dot--leave"></span>
            Cuti
          </span>
          <span class="legend-item">
            <span class="legend-dot legend-dot--unmarked"></span>
            Belum Isi
          </span>
        </div>
      </div>
      <div v-if="unfilledCount > 0" class="badge badge-warning">
        {{ unfilledCount }} Pegawai Belum Mengisi
      </div>
      <div v-else class="badge badge-success">
        Semua Pegawai Sudah Mengisi
      </div>
    </div>
    <div class="employee-status__grid">
      <div
        v-for="emp in statusList"
        :key="emp.id"
        class="employee-chip"
        :class="{
          'employee-chip--present': emp.kehadiran === 'Hadir',
          'employee-chip--leave': emp.kehadiran === 'Cuti',
          'employee-chip--unmarked': emp.kehadiran === ''
        }"
        :title="emp.kehadiran === 'Hadir' ? `${emp.name} (Hadir)` : (emp.kehadiran === 'Cuti' ? `${emp.name} (Cuti)` : `${emp.name} (Belum mengisi)`)"
      >
        <span class="employee-chip__indicator"></span>
        <span class="employee-chip__name">{{ emp.name }}</span>
        
        <svg v-if="emp.kehadiran === 'Hadir'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <svg v-else-if="emp.kehadiran === 'Cuti'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { config } from '../config'

const props = defineProps({
  activities: { type: Array, default: () => [] },
})

const statusList = computed(() => {
  const attendanceMap = {}
  const filledIds = new Set()

  props.activities.forEach(act => {
    const empId = String(act.pegawai_id)
    filledIds.add(empId)
    if (act.kehadiran) {
      attendanceMap[empId] = act.kehadiran
    }
  })

  return config.employees.map(emp => {
    const empId = String(emp.id)
    const filled = filledIds.has(empId)
    // Default to 'Hadir' if filled but no kehadiran value is recorded
    const kehadiran = filled ? (attendanceMap[empId] || 'Hadir') : ''
    
    return {
      id: emp.id,
      name: emp.name,
      role: emp.role,
      filled,
      kehadiran,
    }
  })
})

const unfilledCount = computed(() => {
  return statusList.value.filter(emp => !emp.filled).length
})
</script>

<style scoped>
.employee-status {
  padding: var(--space-4) var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.employee-status__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
  gap: var(--space-2);
}

.employee-status__header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.employee-status__title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.status-legend {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.legend-dot--present {
  background: var(--color-success);
}

.legend-dot--leave {
  background: var(--color-warning);
}

.legend-dot--unmarked {
  background: var(--color-text-muted);
}

.employee-status__grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.employee-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  transition: all var(--transition-fast);
  cursor: default;
}

.employee-chip--present {
  background: var(--color-success-light);
  color: var(--color-success);
  border: 1.5px solid var(--color-success);
}

.employee-chip--leave {
  background: var(--color-warning-light);
  color: var(--color-warning);
  border: 1.5px solid var(--color-warning);
}

.employee-chip--unmarked {
  background: var(--color-border-light);
  color: var(--color-text-secondary);
  border: 1.5px solid var(--color-border);
}

.employee-chip:hover {
  transform: scale(1.05);
}

.employee-chip__indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.employee-chip--present .employee-chip__indicator {
  background: var(--color-success);
  box-shadow: 0 0 6px var(--color-success);
}

.employee-chip--leave .employee-chip__indicator {
  background: var(--color-warning);
  box-shadow: 0 0 6px var(--color-warning);
}

.employee-chip--unmarked .employee-chip__indicator {
  background: var(--color-text-muted);
}
</style>
