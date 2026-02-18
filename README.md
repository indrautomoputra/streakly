# Streakly

![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-UNLICENSED-lightgrey)

Streakly adalah aplikasi desktop produktivitas berbasis Electron + SQLite yang mengubah manajemen task harian menjadi pengalaman gamifikasi terukur. Fokus utamanya adalah menjaga ritme eksekusi melalui XP, streak, dan analytics 30 hari dalam mode offline-first.

## 📋 Prasyarat Sistem

Sebelum memulai instalasi, pastikan sistem Anda telah memenuhi kebutuhan berikut:

1.  **Sistem Operasi**: Windows 10 atau Windows 11 (64-bit).
2.  **Node.js**: Versi 18.x atau lebih baru (LTS disarankan).
    - Cek versi dengan perintah: `node -v`
    - Unduh di: [nodejs.org](https://nodejs.org/)
3.  **Git**: Untuk mengunduh repository.
    - Cek versi dengan perintah: `git --version`
    - Unduh di: [git-scm.com](https://git-scm.com/)
4.  **Visual Studio Build Tools** (Opsional): Diperlukan jika modul `sqlite3` perlu dikompilasi ulang secara manual.

---

## 🚀 Panduan Instalasi (Langkah-demi-Langkah)

Ikuti langkah-langkah berikut secara berurutan untuk menjalankan aplikasi di komputer lokal Anda.

### 1. Kloning Repository

Buka terminal (Command Prompt atau PowerShell) dan jalankan perintah berikut untuk mengunduh kode sumber proyek:

```bash
git clone https://github.com/indrautomoputra/streakly.git
```

*Penjelasan: Perintah ini akan menyalin seluruh folder proyek `streakly` dari GitHub ke komputer Anda.*

### 2. Navigasi ke Direktori Proyek

Masuk ke dalam folder proyek yang baru saja diunduh:

```bash
cd streakly
```

*Penjelasan: Perintah `cd` (change directory) memindahkan posisi aktif terminal Anda ke dalam folder proyek agar bisa menjalankan perintah selanjutnya.*

### 3. Instalasi Dependensi

Jalankan perintah berikut untuk mengunduh dan memasang semua pustaka (library) yang dibutuhkan aplikasi:

```bash
npm install
```

*Output yang diharapkan:*
Proses ini akan memakan waktu beberapa menit. Anda akan melihat progress bar instalasi paket. Jika berhasil, akan muncul pesan seperti `added X packages in Xs`.

### 4. Konfigurasi Environment Variables (Opsional)

Aplikasi ini dirancang untuk berjalan tanpa konfigurasi rumit. Namun, jika Anda ingin menjalankan dalam mode pengembangan (development) untuk melihat alat debug, Anda dapat mengatur variabel lingkungan sebelum menjalankan aplikasi.

Pada PowerShell:
```powershell
$env:NODE_ENV="development"
```

Pada Command Prompt (CMD):
```cmd
set NODE_ENV=development
```

*Catatan: Langkah ini bisa dilewati untuk penggunaan normal.*

### 5. Menjalankan Aplikasi

Sekarang Anda siap menjalankan aplikasi Streakly:

```bash
npm run start
```

*Output yang diharapkan:*
Jendela aplikasi Streakly akan terbuka di layar desktop Anda. Di terminal, Anda mungkin melihat log:
```
> streakly@1.0.0 start
> electron .
```

---

## 🛠️ Troubleshooting (Masalah Umum)

Jika Anda mengalami kendala saat instalasi, coba solusi berikut:

### Masalah 1: Error saat instalasi `sqlite3` atau `node-gyp`
**Gejala**: Muncul pesan error panjang berwarna merah saat `npm install` yang menyebutkan `python` atau `visual studio`.
**Solusi**:
1. Pastikan Anda sudah menginstall **Visual Studio Build Tools** dengan opsi "Desktop development with C++".
2. Jalankan perintah rebuild khusus:
   ```bash
   npm run rebuild
   ```

### Masalah 2: Aplikasi terbuka tapi layar putih (Blank Screen)
**Gejala**: Jendela aplikasi muncul tetapi isinya kosong.
**Solusi**:
1. Tutup aplikasi sepenuhnya.
2. Hapus folder cache aplikasi di: `%APPDATA%\Streakly` (Ketik path ini di File Explorer).
3. Jalankan ulang aplikasi dengan `npm run start`.

### Masalah 3: `electron` command not found
**Gejala**: Error saat menjalankan `npm run start`.
**Solusi**:
Coba install ulang dependensi dengan menghapus folder `node_modules` terlebih dahulu:
```bash
rm -rf node_modules
npm install
```

---

## 📚 Fitur Utama

- **Task Management**: Kelola tugas harian dengan deadline dan prioritas.
- **Gamifikasi**: Dapatkan XP dan naikkan level setiap menyelesaikan tugas.
- **Analytics**: Pantau produktivitas Anda dalam 30 hari terakhir.
- **Offline-First**: Data tersimpan lokal di komputer Anda menggunakan SQLite.

## 🤝 Kontribusi

Jika Anda ingin berkontribusi:
1. Fork repository ini.
2. Buat branch fitur baru (`git checkout -b fitur-baru`).
3. Commit perubahan Anda (`git commit -m 'Menambahkan fitur baru'`).
4. Push ke branch (`git push origin fitur-baru`).
5. Buat Pull Request di GitHub.
