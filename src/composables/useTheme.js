import { ref, watch, onMounted } from 'vue'
import { config } from '../config'

const isDark = ref(false)

export function useTheme() {
  function applyTheme(dark) {
    const root = document.documentElement
    const theme = dark ? config.colors.dark : config.colors.light

    root.setAttribute('data-theme', dark ? 'dark' : 'light')

    root.style.setProperty('--color-primary', theme.primary)
    root.style.setProperty('--color-primary-hover', theme.primaryHover)
    root.style.setProperty('--color-primary-light', theme.primaryLight)
    root.style.setProperty('--color-primary-lighter', theme.primaryLighter)
    root.style.setProperty('--color-secondary', theme.secondary)
    root.style.setProperty('--color-background', theme.background)
    root.style.setProperty('--color-surface', theme.surface)
    root.style.setProperty('--color-surface-hover', theme.surfaceHover)
    root.style.setProperty('--color-text', theme.text)
    root.style.setProperty('--color-text-secondary', theme.textSecondary)
    root.style.setProperty('--color-text-muted', theme.textMuted)
    root.style.setProperty('--color-border', theme.border)
    root.style.setProperty('--color-border-light', theme.borderLight)
    root.style.setProperty('--color-success', theme.success)
    root.style.setProperty('--color-success-light', theme.successLight)
    root.style.setProperty('--color-danger', theme.danger)
    root.style.setProperty('--color-danger-light', theme.dangerLight)
    root.style.setProperty('--color-warning', theme.warning)
    root.style.setProperty('--color-warning-light', theme.warningLight)
    root.style.setProperty('--color-accent', theme.accent)
    root.style.setProperty('--color-shadow', theme.shadow)
    root.style.setProperty('--color-shadow-heavy', theme.shadowHeavy)
    root.style.setProperty('--color-overlay', theme.overlay)
    root.style.setProperty('--color-gradient-1', theme.gradient1)
    root.style.setProperty('--color-gradient-2', theme.gradient2)
    root.style.setProperty('--color-gradient-3', theme.gradient3)
  }

  function toggleTheme() {
    isDark.value = !isDark.value
    localStorage.setItem('theme-dark', isDark.value)
    applyTheme(isDark.value)
  }

  function initTheme() {
    const stored = localStorage.getItem('theme-dark')
    if (stored !== null) {
      isDark.value = stored === 'true'
    } else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    applyTheme(isDark.value)
  }

  onMounted(() => {
    initTheme()
  })

  watch(isDark, (val) => {
    applyTheme(val)
  })

  return {
    isDark,
    toggleTheme,
    initTheme,
  }
}
