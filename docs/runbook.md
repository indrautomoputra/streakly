# Runbook: Gagal Memuat Aplikasi (Startup Error)

## Tujuan
Memastikan pengumpulan data yang lengkap dan langkah mitigasi konsisten saat aplikasi gagal memuat.

## Pengumpulan Data
1. Buka overlay error dan tekan “Salin detail”.
2. Simpan payload tersebut ke ticket insiden.
3. Ambil data runtime tambahan:
   - `npm -v`
   - `node -v`
4. Catat mode aplikasi: dev/staging/prod (NODE_ENV).

## Log dan Jejak Error
- Lihat `localStorage` key `streakly_startup_errors`.
- Catat timestamp, stack trace, dan `user_agent` dari payload.

## Diagnosis Bertahap
1. Pastikan preload aktif dan IPC tersedia:
   - Verifikasi `window.api` ter-ekspos.
2. Verifikasi utilitas kalender:
   - Pastikan `CalendarUtils` ter-load sebelum render kalender.
3. Periksa aset statik:
   - Pastikan `ui/index.html`, `ui/styles.css`, `renderer/renderer.js` termuat tanpa error.
4. Periksa database lokal:
   - Pastikan file SQLite dapat diakses dan tidak corrupt.

## Mitigasi Cepat
- Reload aplikasi dari tombol “Coba muat ulang”.
- Hapus cache Electron di `%APPDATA%/Streakly` jika blank screen berulang.

## Validasi Pasca Perbaikan
- Aplikasi dapat memuat dashboard tanpa overlay error.
- `npm test` lulus.
- `npm run build` lulus di environment lokal non-sandbox.

## Catatan
Komponen reverse-proxy, layanan eksternal, dan cache terdistribusi tidak berlaku untuk distribusi desktop ini.
