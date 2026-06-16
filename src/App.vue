<template>
  <div id="app-root">
    <AppHeader />
    <main class="main-content container">
      <router-view v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </main>
    <footer class="app-footer">
      <div class="container">
        <p>© {{ currentYear }} {{ teamName }}. Sistem Pelaporan Aktivitas Internal.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTheme } from './composables/useTheme'
import { config } from './config'
import AppHeader from './components/AppHeader.vue'

useTheme()

const currentYear = computed(() => new Date().getFullYear())
const teamName = `${config.team.name} — ${config.team.institution}`
</script>

<style scoped>
.main-content {
  flex: 1;
  min-height: calc(100vh - var(--header-height) - 60px);
}

.app-footer {
  padding: var(--space-5) 0;
  border-top: 1px solid var(--color-border);
  text-align: center;
}

.app-footer p {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
