import { ref, computed } from 'vue'
import {
  getCurrentPeriod,
  getFillingRange,
  isFillingOpen,
  formatDate,
  formatDateISO,
  getPeriodLabel,
  getActivityRange,
} from '../utils/dateUtils'

export function usePeriod() {
  const currentPeriod = ref(getCurrentPeriod())
  const selectedPeriod = ref(getCurrentPeriod())

  const periodLabel = computed(() => getPeriodLabel(selectedPeriod.value))

  const periodISO = computed(() => formatDateISO(selectedPeriod.value))

  const fillingRange = computed(() => {
    const range = getFillingRange(selectedPeriod.value)
    return {
      start: formatDate(range.start),
      end: formatDate(range.end),
    }
  })

  const activityRange = computed(() => {
    const range = getActivityRange(selectedPeriod.value)
    return {
      start: formatDate(range.start),
      end: formatDate(range.end),
    }
  })

  const canFill = computed(() => isFillingOpen(selectedPeriod.value))

  const isCurrentPeriod = computed(() =>
    formatDateISO(selectedPeriod.value) === formatDateISO(currentPeriod.value)
  )

  const isFuturePeriod = computed(() =>
    selectedPeriod.value.getTime() > currentPeriod.value.getTime()
  )

  function goToPeriod(date) {
    selectedPeriod.value = new Date(date)
  }

  function goToPrevPeriod() {
    const d = new Date(selectedPeriod.value)
    d.setDate(d.getDate() - 7)
    selectedPeriod.value = d
  }

  function goToNextPeriod() {
    const d = new Date(selectedPeriod.value)
    d.setDate(d.getDate() + 7)
    selectedPeriod.value = d
  }

  function goToCurrentPeriod() {
    selectedPeriod.value = getCurrentPeriod()
  }

  return {
    currentPeriod,
    selectedPeriod,
    periodLabel,
    periodISO,
    fillingRange,
    activityRange,
    canFill,
    isCurrentPeriod,
    isFuturePeriod,
    goToPeriod,
    goToPrevPeriod,
    goToNextPeriod,
    goToCurrentPeriod,
  }
}
