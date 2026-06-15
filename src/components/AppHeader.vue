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
        <ThemeToggle />
      </div>
    </div>
  </header>
</template>

<script setup>
import { config } from '../config'
import ThemeToggle from './ThemeToggle.vue'

const teamName = `${config.team.name} — ${config.team.institution}`
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
</style>
