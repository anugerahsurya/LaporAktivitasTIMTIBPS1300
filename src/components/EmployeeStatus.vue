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
            <span class="legend-dot legend-dot--permission"></span>
            Izin
          </span>
          <span class="legend-item">
            <span class="legend-dot legend-dot--unmarked"></span>
            Tanpa Keterangan
          </span>
        </div>
      </div>
      <div v-if="unfilledCount > 0" class="badge badge-warning">
        {{ unfilledCount }} Pegawai Tanpa Keterangan
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
          'employee-chip--permission': emp.kehadiran === 'Izin',
          'employee-chip--unmarked': emp.kehadiran === ''
        }"
        :title="emp.kehadiran === 'Hadir' ? `${emp.name} (Hadir)` : (emp.kehadiran === 'Cuti' ? `${emp.name} (Cuti)` : (emp.kehadiran === 'Izin' ? `${emp.name} (Izin${userRole === 'Ketua Tim' && emp.keterangan ? ': ' + emp.keterangan : ''})` : `${emp.name} (Tanpa Keterangan)`))"
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
        <svg v-else-if="emp.kehadiran === 'Izin'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </div>
    </div>
    
    <!-- Detail Keterangan Izin (Hanya untuk Ketua Tim) -->
    <div v-if="userRole === 'Ketua Tim' && permissionDetails.length > 0" class="permission-details-section">
      <div class="permission-details-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <h5>Detail Keterangan Izin Pegawai</h5>
      </div>
      <div class="permission-details-list">
        <div v-for="emp in permissionDetails" :key="emp.id" class="permission-detail-item">
          <span class="permission-detail-name">{{ emp.name }}</span>
          <span class="permission-detail-divider">:</span>
          <span class="permission-detail-desc">{{ emp.keterangan }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { config } from '../config'

const props = defineProps({
  activities: { type: Array, default: () => [] },
  userRole: { type: String, default: '' },
})

const statusList = computed(() => {
  const attendanceMap = {}
  const keteranganMap = {}
  const filledIds = new Set()

  props.activities.forEach(act => {
    const empId = String(act.pegawai_id)
    filledIds.add(empId)
    if (act.kehadiran) {
      attendanceMap[empId] = act.kehadiran
    }
    if (act.keterangan_kehadiran) {
      keteranganMap[empId] = act.keterangan_kehadiran
    }
  })

  return config.employees.map(emp => {
    const empId = String(emp.id)
    const filled = filledIds.has(empId)
    // Default to 'Hadir' if filled but no kehadiran value is recorded
    const kehadiran = filled ? (attendanceMap[empId] || 'Hadir') : ''
    const keterangan = filled ? (keteranganMap[empId] || '') : ''
    
    return {
      id: emp.id,
      name: emp.name,
      role: emp.role,
      filled,
      kehadiran,
      keterangan,
    }
  })
})

const permissionDetails = computed(() => {
  return statusList.value.filter(emp => emp.kehadiran === 'Izin' && emp.keterangan)
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
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-3);
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

.legend-dot--permission {
  background: #3b82f6;
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

.employee-chip--permission {
  background: rgba(59, 130, 246, 0.08);
  color: #1d4ed8;
  border: 1.5px solid #3b82f6;
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

.employee-chip--permission .employee-chip__indicator {
  background: #3b82f6;
  box-shadow: 0 0 6px #3b82f6;
}

.employee-chip--unmarked .employee-chip__indicator {
  background: var(--color-text-muted);
}

/* Permission details styling for Ketua Tim */
.permission-details-section {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px dashed var(--color-border);
}

.permission-details-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  color: #1d4ed8;
}

.permission-details-header h5 {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.permission-details-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.permission-detail-item {
  display: flex;
  font-size: var(--font-size-sm);
  line-height: 1.4;
}

.permission-detail-name {
  font-weight: 600;
  color: var(--color-text);
  min-width: 140px;
  max-width: 180px;
}

.permission-detail-divider {
  margin: 0 var(--space-2);
  color: var(--color-text-muted);
}

.permission-detail-desc {
  color: var(--color-text-secondary);
  font-style: italic;
}
</style>
