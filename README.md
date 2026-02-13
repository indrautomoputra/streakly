# Streakly

Desktop app berbasis Electron + SQLite untuk mengubah produktivitas harian menjadi pengalaman gamifikasi.

## Ringkasan
Streakly memadukan manajemen task, XP, streak, dan analytics 30 hari ke dalam satu aplikasi desktop offline-first. Aplikasi dirancang dengan pemisahan layer (main, preload, services, repositories/queries, renderer) dan IPC wrapper yang konsisten.

## Fitur Utama
- Manajemen task dengan detail, deadline, status selesai
- XP + streak gamification yang konsisten per hari
- Analytics 30 hari terakhir
- Tema UI yang bisa diubah via template palette atau custom theme
- Export PDF laporan produktivitas
- Backup/restore database lokal

## Arsitektur (High-Level)
- Main process: inisialisasi aplikasi, IPC handler, export PDF, backup/restore
- Preload: API bridge terkurasi dengan wrapper `{ ok, data, error }`
- Services: logika domain (XP/streak, task lifecycle, analytics, profile)
- Repositories/queries: akses SQLite terpusat + transaksi
- Renderer: UI, state, dan event handling

## Data Model (SQLite)
- `tasks`: judul, detail, deadline, side, status done, created_at
- `stats`: XP, level, streak, last_activity
- `daily_stats`: agregasi XP/task per tanggal
- `profile`: nama dan avatar
- `settings`: tema UI + aturan XP

## Alur XP & Streak
1. Task ditandai selesai.
2. `xpService.updateXP()` berjalan di dalam transaksi.
3. XP bertambah, streak dihitung ulang, daily_stats di-upsert.

## Engineering Challenges
- Menjaga konsistensi XP dan streak agar tidak ganda saat task selesai.
- Menyimpan statistik harian secara efisien tanpa query berat.
- Menyusun laporan PDF terstruktur tanpa DOM screenshot.
- Menyediakan tema UI yang fleksibel tanpa library tema eksternal.

## Design Decisions
- SQLite lokal agar aplikasi offline-first dan mudah dibackup.
- IPC wrapper `{ ok, data, error }` untuk standar error handling.
- `daily_stats` sebagai tabel agregasi agar analytics 30 hari cepat.
- Theme via CSS variables untuk fleksibilitas tanpa CSS-in-JS.

## Trade-offs
- Renderer masih monolitik; cepat untuk iterasi UI, kurang modular.
- Tidak ada framework state management; logika langsung di DOM untuk kesederhanaan.
- Chart.js via CDN mempercepat setup, tetapi menambah ketergantungan runtime.

## Future Improvements
- Pagination + virtualized list untuk task besar.
- Indexing di SQLite untuk deadline/created_at/done.
- Test coverage untuk XP/streak dan repository layer.
- CSP + asset bundling untuk mengurangi surface area keamanan.
- Modularisasi renderer (components/store).

## What This Project Demonstrates
- Arsitektur desktop app dengan Electron + SQLite
- Desain IPC aman dengan contextIsolation
- Transactional update untuk gamification logic
- Migrasi schema incremental tanpa framework eksternal
- Pembuatan laporan PDF terstruktur

## Menjalankan Proyek
```bash
npm install
npm run start
```

## Build
```bash
npm run build
```
