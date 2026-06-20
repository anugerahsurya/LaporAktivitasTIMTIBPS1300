<template>
  <div class="activity-table">

    <div v-if="activities.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
      <h3>Belum Ada Laporan</h3>
      <p>Belum ada kegiatan atau target yang tercatat untuk periode ini. Klik tombol "Isi Kegiatan" untuk menambahkan.</p>
    </div>

    <div v-else class="activity-sections">

      <div v-if="groupedTargets.length > 0" class="table-section">
        <h3 class="section-title section-title--target">Target Minggu Depan</h3>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">No</th>
                <th>Target</th>
                <th style="width: 30%;">Nama Pegawai</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, idx) in groupedTargets"
                :key="item.text"
                class="animate-fade-in-up"
                :style="{ animationDelay: `${idx * 50}ms` }"
              >
                <td class="cell-no">{{ idx + 1 }}</td>
                <td class="cell-target">
                  <div class="target-text">{{ item.text }}</div>
                </td>
                <td class="cell-kontributor">
                  <div class="kontributor-chips">
                    <span
                      v-for="name in item.contributors"
                      :key="name"
                      class="kontributor-chip"
                    >
                      {{ name }}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  activities: { type: Array, default: () => [] },
})

const groupedActivities = computed(() => {
  const map = new Map()
  props.activities.forEach(act => {
    if (!act.kegiatan) return

    const key = act.kegiatan
    if (map.has(key)) {
      const existing = map.get(key)
      if (!existing.contributors.includes(act.pegawai_nama)) {
        existing.contributors.push(act.pegawai_nama)
      }
    } else {
      map.set(key, {
        text: act.kegiatan,
        contributors: [act.pegawai_nama],
      })
    }
  })
  return Array.from(map.values())
})

const groupedTargets = computed(() => {
  const map = new Map()
  props.activities.forEach(act => {
    if (!act.target_minggu_depan) return

    const key = act.target_minggu_depan
    if (map.has(key)) {
      const existing = map.get(key)
      if (!existing.contributors.includes(act.pegawai_nama)) {
        existing.contributors.push(act.pegawai_nama)
      }
    } else {
      map.set(key, {
        text: act.target_minggu_depan,
        contributors: [act.pegawai_nama],
      })
    }
  })
  return Array.from(map.values())
})
</script>

<style scoped>
.activity-table {
  margin-top: var(--space-4);
}

.activity-sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.table-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

table {
  width: 100%;
  min-width: 600px;
  border-collapse: collapse;
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.section-title::before {
  content: '';
  display: block;
  width: 4px;
  height: 20px;
  background: var(--color-primary);
  border-radius: 2px;
}

.section-title--target::before {
  background: var(--color-warning);
}

.cell-no {
  text-align: center;
  font-weight: 600;
  color: var(--color-text-muted);
}

.kegiatan-text {
  font-weight: 500;
  color: var(--color-text);
  line-height: 1.5;
}

.target-text {
  font-weight: 500;
  color: var(--color-text);
  line-height: 1.5;
}

.kontributor-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.kontributor-chip {
  display: inline-block;
  padding: 2px 10px;
  font-size: var(--font-size-xs);
  font-weight: 500;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.empty-state svg {
  opacity: 0.4;
}
</style>
