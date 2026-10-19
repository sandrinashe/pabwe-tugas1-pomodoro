# Pomodoro Timer

Tugas I – 11S3133 Pengembangan Aplikasi Berbasis Web.
Aplikasi web Pomodoro Timer (HTML, CSS, JavaScript murni) yang dikembangkan dengan bantuan AI generatif sebagai asisten pemrograman.

**Nama:** (isi nama kamu)
**NIM:** (isi NIM kamu)

## Fitur
- Timer Pomodoro (25 menit), Short Break (5 menit), Long Break (15 menit)
- Timer berjalan dengan cincin progres, tombol jeda/lanjut dan berhenti
- Siklus otomatis: 4 pomodoro lalu Long Break
- Halaman History: jumlah sesi dan total waktu fokus per tanggal
- Halaman Settings: durasi bisa diubah, tema (Red & Yellow / Blue & White), notifikasi
- Bunyi saat sesi selesai, judul tab menampilkan sisa waktu
- Data tersimpan di `localStorage`
- Tampilan responsif (desktop dan ponsel)

## Cara Menjalankan
Buka `index.html` di browser. Tidak perlu instalasi atau server.

## Struktur
| Berkas | Fungsi |
|---|---|
| `index.html` | Struktur halaman |
| `css/style.css` | Tampilan dan tema |
| `js/app.js` | Logika timer, riwayat, pengaturan |
| `tests/uji.py` | Pengujian otomatis (Playwright, 24 skenario) |
| `tests/bukti_bug_timer.py` | Bukti bug timer berbasis `sisa--` |
| `docs/log-prompt.md` | Catatan prompt, evaluasi, dan perbaikan |
| `docs/screenshots/` | Tangkapan layar aplikasi dan percakapan AI |

## Menjalankan Pengujian (opsional)
```
pip install playwright
playwright install chromium
python tests/uji.py
```

## Penggunaan AI
Proses interaksi dengan AI (prompt, evaluasi, kesalahan, perbaikan) ada di `docs/log-prompt.md` dan dokumen proposal.

## Akses
Repositori dibagikan kepada dosen dan asisten pengampu mata kuliah.
