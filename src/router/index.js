import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: 'Beranda' },
  },
  {
    path: '/add',
    name: 'AddActivity',
    component: () => import('../views/AddActivityView.vue'),
    meta: { title: 'Tambah Kegiatan' },
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../views/HistoryView.vue'),
    meta: { title: 'Riwayat Periode' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' }
  },
})

router.beforeEach((to) => {
  document.title = `${to.meta.title || 'Beranda'} — Lapor Aktivitas TIM TI`
})

export default router
