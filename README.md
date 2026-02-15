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
- Form pendaftaran dinamis (drag-and-drop, template, multi-bahasa)
- Export data pendaftaran ke PDF/Excel
- Backup/restore database lokal

## Prasyarat
- Node.js 18+ (disarankan LTS)
- npm 9+
- Git
- Windows 10/11
- Visual Studio Build Tools (opsional, dibutuhkan bila sqlite3 perlu rebuild)

## Instalasi
```bash
git clone https://github.com/indrautomoputra/streakly.git
cd streakly
npm install
```

## Menjalankan Aplikasi di Lokal
```bash
npm run start
```

## Testing
```bash
npm test
```

## Development Setup
- Jalankan aplikasi: `npm run start`
- Build paket Windows: `npm run build`
- Distribusi installer: `npm run dist`
- Rebuild native deps (jika perlu): `npm run rebuild`

## Troubleshooting
- Instalasi gagal pada sqlite3:
  - Jalankan `npm run rebuild`
  - Pastikan Visual Studio Build Tools dan Python terpasang
- Aplikasi tidak menampilkan UI:
  - Tutup aplikasi lalu jalankan ulang
  - Hapus cache Electron pada `%APPDATA%/Streakly` jika masih blank

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

## API Form Pendaftaran (IPC)
Struktur data schema:
```json
[
  { "id": "fullName", "labelKey": "fullName", "type": "text", "required": true },
  { "id": "email", "labelKey": "email", "type": "email", "required": true },
  { "id": "phone", "labelKey": "phone", "type": "phone", "required": false }
]
```

Struktur data submissions:
```json
[
  {
    "submitted_at": "2026-02-15T10:20:30.000Z",
    "values": {
      "fullName": "Raka Pratama",
      "email": "raka@example.com",
      "phone": "081234567890"
    }
  }
]
```

Ekspor PDF:
```javascript
window.api.exportRegistrationPdf({
  schema,
  submissions,
  language: 'id'
});
```

Ekspor Excel:
```javascript
window.api.exportRegistrationExcel({
  schema,
  submissions,
  language: 'id'
});
```

## Penggunaan Form Pendaftaran
- Role developer: mengelola field, tipe input, opsi, dan template.
- Role end-user: hanya mengisi form yang telah disediakan.
- Template pekerjaan bawaan: pegawai negeri (NIP), pekerja swasta (sertifikasi), pekerja kreatif (portofolio).
- Multi-bahasa: Indonesia dan English (label & pesan validasi).

## Dokumentasi Tambahan
- [Dokumentasi Arsitektur & Workflow](docs/README.md)
- [Halaman Repository](https://github.com/indrautomoputra/streakly)

## Kontribusi
Kami menyambut kontribusi yang terstruktur dan terukur.
- Fork repository dan buat branch fitur: `feature/nama-fitur`
- Pastikan `npm test` lulus sebelum mengirim PR
- Sertakan ringkasan perubahan dan alasan pada PR description
- Laporkan bug atau ide melalui Issues: https://github.com/indrautomoputra/streakly.git
