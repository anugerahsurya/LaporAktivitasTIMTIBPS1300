<template>
  <header class="app-header glass">
    <div class="container app-header__inner">
      <div class="app-header__left">
        <router-link to="/" class="app-header__brand">
          <div class="app-header__logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div class="app-header__title">
            <h1>Lapor Aktivitas</h1>
            <span class="app-header__subtitle">{{ teamName }}</span>
          </div>
        </router-link>
      </div>

      <nav class="app-header__nav">
        <router-link to="/" class="nav-link" active-class="nav-link--active">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>Beranda</span>
        </router-link>
        <router-link to="/history" class="nav-link" active-class="nav-link--active">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>Riwayat</span>
        </router-link>
      </nav>

      <div class="app-header__right">
        <div class="preset-dropdown-container">
          <button class="preset-dropdown-btn" @click="isPresetOpen = !isPresetOpen" @blur="closePresetDropdownDelayed">
            <span class="preset-color-indicator" :style="{ backgroundColor: currentPresetColor }"></span>
            <span class="preset-dropdown-label">{{ currentPresetName }}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ transform: isPresetOpen ? 'rotate(180deg)' : 'rotate(0)' }" style="transition: transform 0.2s;">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          
          <Transition name="dropdown">
            <div v-if="isPresetOpen" class="preset-dropdown-menu">
              <button 
                class="preset-dropdown-item" 
                :class="{ active: activePreset === 'ekonomi' }" 
                @click="selectPreset('ekonomi')"
              >
                <span class="preset-color-indicator" style="background-color: #f79039"></span>
                Sensus Ekonomi
              </button>
              <button 
                class="preset-dropdown-item" 
                :class="{ active: activePreset === 'pertanian' }" 
                @click="selectPreset('pertanian')"
              >
                <span class="preset-color-indicator" style="background-color: #16a34a"></span>
                Sensus Pertanian
              </button>
              <button 
                class="preset-dropdown-item" 
                :class="{ active: activePreset === 'penduduk' }" 
                @click="selectPreset('penduduk')"
              >
                <span class="preset-color-indicator" style="background-color: #0ea5e9"></span>
                Sensus Penduduk
              </button>
            </div>
          </Transition>
        </div>
        <ThemeToggle />
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { config } from '../config'
import ThemeToggle from './ThemeToggle.vue'
import { useTheme } from '../composables/useTheme'

const teamName = `${config.team.name} — ${config.team.institution}`
const { activePreset, setPreset } = useTheme()

const isPresetOpen = ref(false)

const currentPresetColor = computed(() => {
  if (activePreset.value === 'ekonomi') return '#f79039'
  if (activePreset.value === 'pertanian') return '#16a34a'
  if (activePreset.value === 'penduduk') return '#0ea5e9'
  return '#f79039'
})

const currentPresetName = computed(() => {
  if (activePreset.value === 'ekonomi') return 'Sensus Ekonomi'
  if (activePreset.value === 'pertanian') return 'Sensus Pertanian'
  if (activePreset.value === 'penduduk') return 'Sensus Penduduk'
  return 'Pilih Preset'
})

function selectPreset(preset) {
  setPreset(preset)
  isPresetOpen.value = false
}

function closePresetDropdownDelayed() {
  setTimeout(() => {
    isPresetOpen.value = false
  }, 200)
}
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid var(--color-border);
}

.app-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  gap: var(--space-4);
}

.app-header__left {
  flex-shrink: 0;
}

.app-header__brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
  color: var(--color-text);
}

.app-header__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, var(--color-gradient-1), var(--color-gradient-2));
  border-radius: var(--radius-md);
  color: white;
  flex-shrink: 0;
}

.app-header__title h1 {
  font-size: var(--font-size-lg);
  font-weight: 700;
  line-height: 1.2;
}

.app-header__subtitle {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: 1.2;
}

.app-header__nav {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.nav-link:hover {
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.nav-link--active {
  color: var(--color-primary);
  background: var(--color-primary-light);
  font-weight: 600;
}

.app-header__right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.preset-dropdown-container {
  position: relative;
}

.preset-dropdown-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s;
}

.preset-dropdown-btn:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-primary);
}

.preset-color-indicator {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(0,0,0,0.1);
}

.preset-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: var(--space-2);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  min-width: 200px;
  display: flex;
  flex-direction: column;
  padding: var(--space-1);
  z-index: 1000;
}

.preset-dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: none;
  background: transparent;
  color: var(--color-text);
  font-size: var(--font-size-sm);
  cursor: pointer;
  border-radius: var(--radius-sm);
  text-align: left;
  transition: background 0.2s;
}

.preset-dropdown-item:hover {
  background: var(--color-surface-hover);
}

.preset-dropdown-item.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 600;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .app-header__subtitle {
    display: none;
  }
  .nav-link span {
    display: none;
  }
  .app-header__title h1 {
    font-size: var(--font-size-base);
  }
}

@media (max-width: 640px) {
  .app-header__inner {
    padding: 0 var(--space-2);
    gap: var(--space-2);
  }
  
  .app-header__right {
    gap: var(--space-2);
  }
  
  .preset-dropdown-label {
    display: none;
  }
  
  .preset-dropdown-btn {
    padding: var(--space-2);
  }
}

@media (max-width: 480px) {
  .app-header__logo {
    width: 32px;
    height: 32px;
  }
  
  .app-header__logo svg {
    width: 20px;
    height: 20px;
  }
  
  .app-header__brand {
    gap: 6px;
  }
  
  .app-header__title h1 {
    font-size: var(--font-size-sm);
  }
  
  .nav-link {
    padding: var(--space-2);
  }
}
</style>
