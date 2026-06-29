import { employees } from './data/employees'

export const config = {
  colors: {
    light: {
      primary: '#f79039',
      primaryHover: '#e07d2d',
      primaryLight: '#fff0e0',
      primaryLighter: '#fffbf5',
      secondary: '#ffffff',
      background: '#faf8f6',
      surface: '#ffffff',
      surfaceHover: '#fffbf5',
      text: '#1e293b',
      textSecondary: '#64748b',
      textMuted: '#94a3b8',
      border: '#e2e8f0',
      borderLight: '#f1f5f9',
      success: '#16a34a',
      successLight: '#dcfce7',
      danger: '#ef4444',
      dangerLight: '#fef2f2',
      warning: '#f59e0b',
      warningLight: '#fffbeb',
      accent: '#e07d2d',
      shadow: 'rgba(0, 0, 0, 0.08)',
      shadowHeavy: 'rgba(0, 0, 0, 0.15)',
      overlay: 'rgba(0, 0, 0, 0.4)',
      gradient1: '#f79039',
      gradient2: '#e07d2d',
      gradient3: '#d06a1f',
    },
    dark: {
      primary: '#ffaa5e',
      primaryHover: '#ffbf80',
      primaryLight: '#3d2510',
      primaryLighter: '#1a1008',
      secondary: '#1e1e2e',
      background: '#0b1120',
      surface: '#141c2e',
      surfaceHover: '#1f2a3e',
      text: '#e2e8f0',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      border: '#2a3548',
      borderLight: '#172236',
      success: '#22c55e',
      successLight: '#14532d',
      danger: '#f87171',
      dangerLight: '#451a1a',
      warning: '#fbbf24',
      warningLight: '#422006',
      accent: '#ffbf80',
      shadow: 'rgba(0, 0, 0, 0.3)',
      shadowHeavy: 'rgba(0, 0, 0, 0.5)',
      overlay: 'rgba(0, 0, 0, 0.6)',
      gradient1: '#ffaa5e',
      gradient2: '#f79039',
      gradient3: '#e07d2d',
    },
    presets: {
      ekonomi: {
        light: {
          primary: '#f79039',
          primaryHover: '#e07d2d',
          primaryLight: '#fff0e0',
          primaryLighter: '#fffbf5',
          gradient1: '#f79039',
          gradient2: '#e07d2d',
          gradient3: '#d06a1f',
          background: '#faf8f6',
          surfaceHover: '#fffbf5',
        },
        dark: {
          primary: '#ea580c', // Orange-600 (gelap sedikit agar teks putih jelas)
          primaryHover: '#f97316',
          primaryLight: '#431407',
          primaryLighter: '#2a0a02',
          gradient1: '#f97316',
          gradient2: '#ea580c',
          gradient3: '#c2410c',
          background: '#0b1120',
          surface: '#141c2e',
          surfaceHover: '#1f2a3e',
        },
        pdfHeaderColor: 'f79039',
      },
      pertanian: {
        light: {
          primary: '#059669', // Emerald-600
          primaryHover: '#047857',
          primaryLight: '#d1fae5',
          primaryLighter: '#ecfdf5',
          gradient1: '#10b981',
          gradient2: '#059669',
          gradient3: '#047857',
          background: '#f6fbf9', // Background kehijauan
          surfaceHover: '#ecfdf5',
        },
        dark: {
          primary: '#059669', // Emerald-600 (gelap agar teks putih jelas)
          primaryHover: '#10b981',
          primaryLight: '#064e3b',
          primaryLighter: '#022c22',
          gradient1: '#10b981',
          gradient2: '#059669',
          gradient3: '#047857',
          background: '#060f0b', // Background dark kehijauan
          surface: '#0d1b14',
          surfaceHover: '#13281e',
        },
        pdfHeaderColor: '059669',
      },
      penduduk: {
        light: {
          primary: '#2563eb', // Blue-600
          primaryHover: '#1d4ed8',
          primaryLight: '#dbeafe',
          primaryLighter: '#eff6ff',
          gradient1: '#3b82f6',
          gradient2: '#2563eb',
          gradient3: '#1d4ed8',
          background: '#f5f7fa', // Background kebiruan
          surfaceHover: '#eff6ff',
        },
        dark: {
          primary: '#2563eb', // Blue-600 (gelap agar teks putih jelas)
          primaryHover: '#3b82f6',
          primaryLight: '#1e3a8a',
          primaryLighter: '#172554',
          gradient1: '#3b82f6',
          gradient2: '#2563eb',
          gradient3: '#1d4ed8',
          background: '#0b1121', // Background dark kebiruan
          surface: '#121c33',
          surfaceHover: '#1a2849',
        },
        pdfHeaderColor: '2563eb',
      }
    }
  },

  teams: [
    { id: 'sis', name: 'Tim Sistem Informasi Statistik' },
    { id: 'metods', name: 'Tim Metodologi Statistik dan Sains Data' },
  ],

  employees,

  team: {
    name: 'Tim Teknologi Informasi',
    institution: 'BPS Provinsi Sumatera Barat',
    code: '1300',
    leader: 'Aan Subrata',
    fullTitle: 'Laporan Aktivitas Mingguan Tim Teknologi Informasi',
    subtitle: 'BPS Provinsi Sumatera Barat',
  },

  export: {
    headerColor: 'f79039',
    fontFamily: 'Times New Roman',
    fontSize: 11,
    titleFontSize: 14,
  },

  apiUrl: import.meta.env.VITE_API_URL || '',
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
}
