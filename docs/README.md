# Dokumentasi Streakly

Dokumen ini merangkum arsitektur, alur kerja, dan struktur proyek untuk membantu onboarding kontributor.

## Ringkasan Arsitektur
- Main process: bootstrap aplikasi, IPC handler, export PDF, backup/restore database
- Preload: jembatan API yang aman untuk renderer
- Renderer: UI, state, dan event handling berbasis DOM
- Database: SQLite dengan schema terstruktur untuk task, stats, daily_stats, profile, dan settings

## Struktur Direktori
- `main.js`: entry point Electron main process
- `preload.js`: API bridge yang diekspos ke renderer
- `renderer/`: logika UI dan utilitas tampilan
- `services/`: logika domain (task, XP, analytics, profile)
- `database/`: schema dan query SQLite
- `ui/`: HTML dan stylesheet
- `tests/`: pengujian unit/flow

## Alur Kerja Task
1. Task dibuat melalui `add-task` IPC.
2. Task disimpan ke SQLite.
3. Saat selesai, XP dan streak diperbarui dalam transaksi.
4. Analytics 30 hari memanfaatkan tabel agregasi `daily_stats`.

## Form Task Management
- Required: judul (min 5, max 200), deadline (>= hari ini), prioritas, status, assignee.
- Optional: deskripsi rich text, proyek, tipe task, tanggal mulai, estimasi, recurring, dependencies, relasi, notifikasi, attachment, custom fields.
- Draft otomatis disimpan setiap 30 detik ke localStorage.

## IPC Tambahan
- `get-projects`, `get-clients`, `get-users`, `get-workspaces` untuk opsi dropdown.
- Payload `add-task` dan `update-task` mendukung field tambahan seperti `priority`, `assignees`, `description_rich`, `task_type`, `dependencies`, `checklist`, `attachments`, `smtp_config`.
- Field array disimpan sebagai JSON string di database.

## Skrip NPM
```bash
npm run start
npm run build
npm test
```

## Panduan Kontribusi
- Buat branch fitur dengan pola `feature/nama-fitur`
- Jalankan `npm test` sebelum mengirim PR
- Sertakan ringkasan perubahan dan dampak pada PR
