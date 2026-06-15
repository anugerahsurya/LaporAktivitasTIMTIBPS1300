<template>
  <div class="employee-status">
    <div class="employee-status__header">
      <h4 class="employee-status__title">Status Pengisian</h4>
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
        :class="emp.filled ? 'employee-chip--filled' : 'employee-chip--empty'"
        :title="emp.filled ? `${emp.name} sudah mengisi` : `${emp.name} belum mengisi`"
      >
        <span class="employee-chip__indicator"></span>
        <span class="employee-chip__name">{{ emp.name }}</span>
        <svg v-if="emp.filled" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
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
  const filledIds = new Set(props.activities.map(a => String(a.pegawai_id)))
  return config.employees.map(emp => ({
    id: emp.id,
    name: emp.name,
    role: emp.role,
    filled: filledIds.has(String(emp.id)),
  }))
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

.employee-status__title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
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

.employee-chip--filled {
  background: var(--color-success-light);
  color: var(--color-success);
  border: 1.5px solid var(--color-success);
}

.employee-chip--empty {
  background: var(--color-danger-light);
  color: var(--color-danger);
  border: 1.5px solid var(--color-danger);
}

.employee-chip:hover {
  transform: scale(1.05);
}

.employee-chip__indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.employee-chip--filled .employee-chip__indicator {
  background: var(--color-success);
  box-shadow: 0 0 6px var(--color-success);
}

.employee-chip--empty .employee-chip__indicator {
  background: var(--color-danger);
  box-shadow: 0 0 6px var(--color-danger);
}
</style>
