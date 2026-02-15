# Streakly

![Build](https://img.shields.io/badge/build-unknown-lightgrey)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-UNLICENSED-lightgrey)

Streakly adalah aplikasi desktop produktivitas berbasis Electron + SQLite yang mengubah manajemen task harian menjadi pengalaman gamifikasi terukur. Fokus utamanya adalah menjaga ritme eksekusi melalui XP, streak, dan analytics 30 hari dalam mode offline-first.

## Tujuan Utama
- Mengelola task harian dengan detail, deadline, dan status selesai
- Memotivasi konsistensi melalui XP, level, dan streak
- Menyediakan insight produktivitas berbasis data 30 hari terakhir

## Teknologi
- Electron 28 (desktop app)
- Node.js + IPC (main/preload/renderer)
- SQLite3 (penyimpanan lokal)
- Chart.js (visualisasi tren)

## Fitur Utama
- Task management lengkap (judul, detail, deadline, side, status)
- XP + streak gamification yang konsisten per hari
- Analytics 30 hari terakhir
- Tema UI yang dapat dikustomisasi
- Export PDF laporan produktivitas
- Backup/restore database lokal

## Instalasi
```bash
npm install
```

## Menjalankan Aplikasi
```bash
npm run start
```

## Build
```bash
npm run build
```

## Testing
```bash
npm test
```

## Contoh Penggunaan API Renderer
```javascript
const payload = {
  title: 'Rancang roadmap Q2',
  deadline: '2026-03-01',
  side: 'Strategy',
  detail: 'Prioritaskan inisiatif high-impact',
  status: 'open',
  category: 'Planning'
};

window.api.addTask(payload).then((result) => {
  if (!result.ok) {
    console.error(result.error?.message);
  }
});
```

## Dokumentasi Tambahan
- [Dokumentasi Arsitektur & Workflow](docs/README.md)
- [Halaman Repository](https://github.com/indrautomoputra/streakly-v1)

## Kontribusi
Kami menyambut kontribusi yang terstruktur dan terukur.
- Fork repository dan buat branch fitur: `feature/nama-fitur`
- Pastikan `npm test` lulus sebelum mengirim PR
- Sertakan ringkasan perubahan dan alasan pada PR description
- Laporkan bug atau ide melalui Issues: https://github.com/indrautomoputra/streakly-v1/issues
