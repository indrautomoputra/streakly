# FAQ Streakly

## 1. Aplikasi tidak menampilkan UI
**Solusi:**
- Tutup aplikasi dan buka kembali.
- Hapus cache di `%APPDATA%\Streakly` jika masih blank.

## 2. Error saat instalasi sqlite3
**Solusi:**
- Pastikan Visual Studio Build Tools terpasang.
- Jalankan `npm run rebuild` jika dibutuhkan.

## 3. Task tidak muncul di kalender
**Solusi:**
- Pastikan task memiliki **deadline**.
- Coba refresh aplikasi.

## 4. Data hilang setelah reset
**Penjelasan:**
Reset data akan menghapus semua task, streak, dan statistik. Gunakan **Backup Data** sebelum reset.

## 5. Bagaimana cara memindahkan data ke perangkat lain?
**Solusi:**
- Gunakan **Backup Data** atau **Export Data (JSON)**.
- Salin file ke perangkat lain lalu **Restore Data**.

## 6. Apakah data saya aman?
**Jawaban singkat:**
Data disimpan secara lokal di perangkat Anda. Gunakan backup terenkripsi di level OS untuk keamanan tambahan.
