# Log Prompt dan Evaluasi

> Ganti isi bagian "Prompt" dengan prompt yang benar-benar kamu kirim ke AI dan simpan tangkapan layarnya
> di `docs/screenshots/`. Bagian evaluasi harus berisi pengamatanmu sendiri.

## Iterasi 1 – Perancangan
- **Prompt:** Saya mahasiswa membuat aplikasi Pomodoro Timer dengan HTML, CSS, JavaScript murni tanpa framework. Halaman: Home, History, Settings. Rancang struktur berkas dan alur timer.
- **Tangkapan layar:** `screenshots/ai-iterasi-1.png` (tambahkan)
- **Evaluasi:** (tulis sendiri)
- **Keputusan:** (tulis sendiri)

## Iterasi 2 – Pembuatan kode
- **Prompt:** Tuliskan index.html, style.css, app.js sesuai gambar UI terlampir. Pisahkan fungsi timer, riwayat, pengaturan. Beri komentar bahasa Indonesia.
- **Tangkapan layar:** `screenshots/ai-iterasi-2.png` (tambahkan)
- **Evaluasi:** (tulis sendiri)

## Iterasi 3 – Pengujian dan perbaikan
Temuan yang sudah terbukti (lihat `tests/`):
1. Timer `sisa--` melenceng saat interval tertunda -> pakai cap waktu `Date.now()`.
2. `toISOString()` memberi tanggal UTC (salah sehari di WIB dini hari) -> pakai tanggal lokal.
3. `innerHTML` rawan XSS -> pakai `textContent` dan validasi data `localStorage`.

Tambahkan temuanmu sendiri di bawah ini:
- (isi)

## Refleksi
(tulis sendiri)
