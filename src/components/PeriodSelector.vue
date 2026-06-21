<template>
  <div class="period-selector">
    <button class="btn btn-ghost btn-icon" @click="$emit('prev')" title="Periode Sebelumnya">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>

    <div class="period-selector__info">
      <div class="period-selector__label">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>{{ periodLabel }}</span>
      </div>
      <div class="period-selector__range">
        Kegiatan: {{ activityRange.start }} — {{ activityRange.end }}
      </div>
      <div v-if="canFill" class="period-selector__status badge badge-success">
        ✓ Pengisian Dibuka
      </div>
      <div v-else-if="isFuturePeriod" class="period-selector__status badge badge-warning">
        ○ Belum Dibuka
      </div>
      <div v-else class="period-selector__status badge badge-warning">
        ○ Pengisian Ditutup
      </div>
    </div>

    <button class="btn btn-ghost btn-icon" @click="$emit('next')" title="Periode Berikutnya">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>

    <button
      v-if="!isCurrentPeriod"
      class="btn btn-secondary btn-sm period-selector__today"
      @click="$emit('today')"
    >
      Hari Ini
    </button>
  </div>
</template>

<script setup>
defineProps({
  periodLabel: String,
  activityRange: Object,
  canFill: Boolean,
  isCurrentPeriod: Boolean,
  isFuturePeriod: Boolean,
})

defineEmits(['prev', 'next', 'today'])
</script>

<style scoped>
.period-selector {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.period-selector__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.period-selector__label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-text);
}

.period-selector__range {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.period-selector__status {
  margin-top: var(--space-1);
}

.period-selector__today {
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .period-selector {
    flex-wrap: wrap;
    justify-content: center;
    padding: var(--space-3);
  }
  .period-selector__label {
    font-size: var(--font-size-sm);
  }
}
</style>
