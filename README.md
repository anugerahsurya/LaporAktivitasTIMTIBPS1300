# Lapor Aktivitas TIM TI BPS Provinsi Sumatera Barat

Website pelaporan aktivitas mingguan Tim TI BPS Provinsi Sumatera Barat. Aplikasi ini dibangun dengan Vue 3 (Vite) untuk mempermudah pegawai mencatat dan memantau target mingguan, serta terintegrasi langsung dengan Google Sheets sebagai basis datanya.

---

## 🌟 Fitur Utama

1. **Input Target Saja**
   - Pegawai hanya perlu memasukkan **Target Minggu Depan**.
   - Input **Aktivitas Seminggu Sebelumnya** dihilangkan agar pelaporan lebih efisien dan terhindar dari redundansi data.
2. **Dynamic Activity Carry-Over (Penggabungan Otomatis)**
   - Aktivitas seminggu sebelumnya secara otomatis ditarik dari target minggu depan yang telah diisi oleh pegawai pada minggu sebelumnya.
   - Hasil penggabungan ini tampil secara real-time di tabel dashboard dan muncul secara otomatis saat diekspor.
3. **Status Pengisian Pegawai**
   - Panel visual yang menunjukkan pegawai mana saja yang sudah/belum mengisi laporan di periode aktif.
4. **AI-Powered Executive Summary (PDF)**
   - Menggunakan Google Gemini API (lewat Google Apps Script) untuk menghasilkan ringkasan narasi eksekutif profesional dua paragraf secara otomatis.
5. **Ekspor Laporan Profesional**
   - **Excel (XLSX)**: Format tabel rapi dengan warna header kustom, border penuh, auto-width kolom, dan kolom kontributor yang ter-group.
   - **PDF**: Format dokumen A4 resmi menggunakan font Cambria (sesuai standar laporan instansi), lengkap dengan header/footer dan narasi AI.
6. **Dark & Light Mode**
   - Antarmuka premium dengan transisi warna halus menggunakan custom CSS variables.

---

## 🛠️ Tech Stack

- **Frontend**: Vue 3 (Composition API), Vue Router, Vite
- **Styling**: Vanilla CSS (CSS Variables) dengan desain premium dan modern
- **Ekspor Data**: 
  - **Excel**: `xlsx` (SheetJS)
  - **PDF**: `jspdf` & `jspdf-autotable`
- **AI Summary**: Google Gemini API via Fetch API
- **Backend / Database**: Google Sheets & Google Apps Script API

---

## 📁 Struktur Direktori Proyek

```text
d:\BPS\2. IPDS\11. Lapor Aktivitas Tim TI\
├── index.html                   # Entry HTML file
├── package.json                 # Project dependencies & scripts
├── vite.config.js               # Vite configuration
├── .env                         # Environment variables (Gemini API Key, dll)
├── src/
│   ├── main.js                  # Entry point Vue
│   ├── App.vue                  # Root App component
│   ├── config.js                # Konfigurasi pegawai, warna, dan Apps Script URL
│   ├── router/
│   │   └── index.js             # Vue Router setup
│   ├── assets/                  # CSS styles, variables, & fonts
│   ├── components/              # Vue components
│   │   ├── AddActivityForm.vue  # Form tambah laporan target
│   │   ├── ActivityTable.vue    # Tabel rekapitulasi aktivitas & target
│   │   ├── ExportButtons.vue    # Tombol ekspor (Excel & PDF)
│   │   ├── EmployeeStatus.vue   # Panel status pengisian pegawai
│   │   └── PeriodSelector.vue   # Kontrol navigasi minggu/periode
│   ├── composables/             # State logic / Custom hooks
│   │   ├── useApi.js            # Fetch data & dynamic merging logic
│   │   └── usePeriod.js         # Logika perhitungan tanggal & batas pengisian
│   ├── utils/                   # Utility functions
│   │   ├── exportExcel.js       # Format ekspor spreadsheet Excel
│   │   ├── exportPdf.js         # Pembuat & layout dokumen PDF
│   │   └── dateUtils.js         # Kalkulator tanggal periode
│   └── views/                   # Pages (Home, Add, History)
└── apps-script/                 # Backend scripts untuk Google Sheets
    ├── Code.gs                  # Apps Script endpoint API
    └── README.md                # Panduan deploy Apps Script
```

---

## ⚙️ Konfigurasi & Pengaturan

### 1. File `.env` (Lokal)
Buat file `.env` di root folder dengan isi:
```env
VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```
*Catatan: API key ini diperlukan untuk generator ringkasan AI pada ekspor PDF.*

### 2. File `src/config.js`
Gunakan file ini untuk menyesuaikan warna tema, daftar nama pegawai, peran, ketua tim, dan URL Apps Script Web App:
```javascript
export const config = {
  // Pengaturan warna tema, daftar nama pegawai, ketua tim, dll.
  apiUrl: 'URL_WEB_APP_APPS_SCRIPT_ANDA',
};
```

---

## 🚀 Cara Menjalankan Secara Lokal

### Prasyarat
Pastikan Anda sudah menginstal [Node.js](https://nodejs.org/).

### Langkah-langkah
1. Install dependensi proyek:
   ```bash
   npm install
   ```
2. Jalankan development server:
   ```bash
   npm run dev
   ```
3. Buka browser di alamat yang tertera (biasanya `http://localhost:5173`).

### Build Produksi
Untuk melakukan build dan optimasi aset sebelum dideploy ke production hosting:
```bash
npm run build
```

---

## 📊 Integrasi Google Sheets (Backend & DB)

Aplikasi ini menggunakan **Google Sheets** sebagai database. Integrasi dilakukan menggunakan **Google Apps Script** yang dideploy sebagai Web App.

### Langkah Setup Database & Apps Script:
1. Buat Google Sheets baru.
2. Buka spreadsheet tersebut, pilih menu **Extensions** > **Apps Script**.
3. Copy-paste kode dari `apps-script/Code.gs` ke file script.
4. Klik tombol **Deploy** > **New Deployment**.
5. Pilih type: **Web App**.
6. Set **Execute as**: *Me (email Anda)*, dan **Who has access**: *Anyone*.
7. Klik **Deploy** dan copy URL Web App yang dihasilkan.
8. Buka file `src/config.js` di proyek lokal Anda, ganti nilai `apiUrl` dengan URL Web App tersebut.
9. Jalankan fungsi `setupSheet` pertama kali di Apps Script untuk membuat header tabel secara otomatis.
