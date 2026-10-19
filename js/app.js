// Pomodoro Timer – logika aplikasi
// Struktur: Konfigurasi -> Penyimpanan -> Utilitas -> Timer -> Riwayat -> Pengaturan -> Navigasi

"use strict";

/* ========== 1. Konfigurasi ========== */
const KUNCI_PENGATURAN = "pomodoro-pengaturan-v1";
const KUNCI_RIWAYAT = "pomodoro-riwayat-v1";
const MIN_MENIT = 1;
const MAX_MENIT = 90;
const KELILING_CINCIN = 2 * Math.PI * 96; // r = 96 (lihat index.html)

const NAMA_MODE = { pomodoro: "Pomodoro", short: "Short Break", long: "Long Break" };

const PENGATURAN_AWAL = {
  durasi: { pomodoro: 25, short: 5, long: 15 },
  tema: "merah",
  notifikasi: false,
};

/* ========== 2. Penyimpanan (localStorage) ========== */
function bacaJSON(kunci, cadangan) {
  try {
    const mentah = localStorage.getItem(kunci);
    return mentah ? JSON.parse(mentah) : cadangan;
  } catch (e) {
    return cadangan; // data rusak atau storage diblokir -> pakai nilai awal
  }
}

function tulisJSON(kunci, nilai) {
  try {
    localStorage.setItem(kunci, JSON.stringify(nilai));
  } catch (e) {
    /* abaikan: aplikasi tetap jalan tanpa penyimpanan */
  }
}

function muatPengaturan() {
  const tersimpan = bacaJSON(KUNCI_PENGATURAN, {});
  const hasil = {
    durasi: { ...PENGATURAN_AWAL.durasi },
    tema: PENGATURAN_AWAL.tema,
    notifikasi: false,
  };
  // Validasi tiap nilai agar data yang diubah manual tidak merusak aplikasi
  if (tersimpan && typeof tersimpan === "object") {
    for (const mode of Object.keys(hasil.durasi)) {
      const n = Number(tersimpan.durasi && tersimpan.durasi[mode]);
      if (Number.isInteger(n) && n >= MIN_MENIT && n <= MAX_MENIT) hasil.durasi[mode] = n;
    }
    if (tersimpan.tema === "biru" || tersimpan.tema === "merah") hasil.tema = tersimpan.tema;
    hasil.notifikasi = tersimpan.notifikasi === true;
  }
  return hasil;
}

function muatRiwayat() {
  const data = bacaJSON(KUNCI_RIWAYAT, []);
  if (!Array.isArray(data)) return [];
  return data.filter(
    (r) => r && NAMA_MODE[r.mode] && Number.isFinite(r.menit) && typeof r.waktu === "string"
  );
}

let pengaturan = muatPengaturan();
let riwayat = muatRiwayat();

/* ========== 3. Utilitas ========== */
const $ = (id) => document.getElementById(id);

function dua(n) {
  return String(n).padStart(2, "0");
}

function formatWaktu(detik) {
  const d = Math.max(0, detik);
  return dua(Math.floor(d / 60)) + ":" + dua(d % 60);
}

// Tanggal LOKAL (YYYY-MM-DD). Jangan pakai toISOString(): itu UTC dan bisa meleset sehari.
function kunciTanggal(tanggal) {
  return tanggal.getFullYear() + "-" + dua(tanggal.getMonth() + 1) + "-" + dua(tanggal.getDate());
}

function formatJam(isoString) {
  const t = new Date(isoString);
  return dua(t.getHours()) + ":" + dua(t.getMinutes());
}

function formatDurasiTotal(menit) {
  const j = Math.floor(menit / 60);
  const m = menit % 60;
  return j > 0 ? j + "h " + dua(m) + "m" : m + "m";
}

/* ========== 4. Timer ========== */
const timer = {
  mode: "pomodoro",
  status: "idle", // idle | berjalan | jeda
  akhir: 0, // cap waktu (ms) saat timer selesai
  sisaDetik: 0, // dipakai saat jeda
  totalDetik: 0,
  urutan: 1, // pomodoro ke-berapa dalam siklus 4
  pencacah: null,
};

function durasiMode(mode) {
  return pengaturan.durasi[mode] * 60;
}

// Sisa waktu dihitung dari jam sistem, bukan dengan mengurangi angka tiap detik.
// Cara pengurangan akan melenceng bila tab di-background atau browser menunda setInterval.
function hitungSisa() {
  if (timer.status === "berjalan") {
    return Math.max(0, Math.ceil((timer.akhir - Date.now()) / 1000));
  }
  return timer.sisaDetik;
}

function mulai() {
  if (timer.status !== "idle") return;
  timer.totalDetik = durasiMode(timer.mode);
  timer.akhir = Date.now() + timer.totalDetik * 1000;
  timer.status = "berjalan";
  jalankanPencacah();
  renderHome();
}

function jeda() {
  if (timer.status === "berjalan") {
    timer.sisaDetik = hitungSisa();
    timer.status = "jeda";
    hentikanPencacah();
  } else if (timer.status === "jeda") {
    timer.akhir = Date.now() + timer.sisaDetik * 1000;
    timer.status = "berjalan";
    jalankanPencacah();
  }
  renderHome();
}

function berhenti() {
  hentikanPencacah();
  timer.status = "idle";
  document.title = "Pomodoro Timer";
  renderHome();
}

function jalankanPencacah() {
  hentikanPencacah();
  timer.pencacah = setInterval(detak, 250);
  detak();
}

function hentikanPencacah() {
  if (timer.pencacah) clearInterval(timer.pencacah);
  timer.pencacah = null;
}

function detak() {
  if (hitungSisa() <= 0) {
    selesai();
  } else {
    renderJalan();
  }
}

function selesai() {
  hentikanPencacah();
  const modeSelesai = timer.mode;
  catatRiwayat(modeSelesai, pengaturan.durasi[modeSelesai]);
  bunyi();
  kirimNotifikasi(NAMA_MODE[modeSelesai] + " selesai!");

  // Tentukan mode berikutnya: 4 pomodoro -> long break
  if (modeSelesai === "pomodoro") {
    timer.mode = timer.urutan >= 4 ? "long" : "short";
  } else {
    if (modeSelesai === "long") timer.urutan = 1;
    else timer.urutan += 1;
    timer.mode = "pomodoro";
  }
  timer.status = "idle";
  document.title = "Pomodoro Timer";
  renderHome();
  renderHistory();
}

/* Bunyi pendek lewat Web Audio (tanpa berkas audio) */
function bunyi() {
  try {
    const Konteks = window.AudioContext || window.webkitAudioContext;
    if (!Konteks) return;
    const ctx = new Konteks();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch (e) {
    /* audio diblokir: abaikan */
  }
}

function kirimNotifikasi(pesan) {
  if (!pengaturan.notifikasi) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification("Pomodoro Timer", { body: pesan });
  } catch (e) {
    /* abaikan */
  }
}

/* ========== 5. Render Home ========== */
function renderHome() {
  const aktif = timer.status !== "idle";
  $("panel-idle").hidden = aktif;
  $("panel-jalan").hidden = !aktif;

  $("info-pomo").textContent = pengaturan.durasi.pomodoro + " min";
  $("info-short").textContent = pengaturan.durasi.short + " min";
  $("info-long").textContent = pengaturan.durasi.long + " min";

  if (!aktif) {
    $("pilih-mode").value = timer.mode;
    $("waktu-idle").textContent = formatWaktu(durasiMode(timer.mode));
  } else {
    $("chip-sesi").textContent =
      timer.mode === "pomodoro" ? "Pomodoro " + timer.urutan + "/4" : NAMA_MODE[timer.mode];
    $("label-jalan").textContent =
      timer.status === "jeda" ? "Dijeda" : timer.mode === "pomodoro" ? "Fokus!" : "Istirahat";
    $("btn-jeda").innerHTML = timer.status === "jeda" ? "&#9658;" : "&#10074;&#10074;";
    $("btn-jeda").setAttribute("aria-label", timer.status === "jeda" ? "Lanjutkan" : "Jeda");
    renderJalan();
  }
}

function renderJalan() {
  const sisa = hitungSisa();
  $("waktu-jalan").textContent = formatWaktu(sisa);
  const bagianTerpakai = timer.totalDetik > 0 ? 1 - sisa / timer.totalDetik : 0;
  const lingkar = $("progres");
  lingkar.style.strokeDasharray = KELILING_CINCIN;
  lingkar.style.strokeDashoffset = KELILING_CINCIN * bagianTerpakai;
  document.title = formatWaktu(sisa) + " – " + NAMA_MODE[timer.mode];
}

function ubahDurasiMode(mode, selisih) {
  const baru = pengaturan.durasi[mode] + selisih;
  if (baru < MIN_MENIT || baru > MAX_MENIT) return;
  pengaturan.durasi[mode] = baru;
  simpanPengaturan();
  renderHome();
  renderSettings();
}

/* ========== 6. Riwayat ========== */
function catatRiwayat(mode, menit) {
  riwayat.push({ id: Date.now() + Math.random(), mode: mode, menit: menit, waktu: new Date().toISOString() });
  tulisJSON(KUNCI_RIWAYAT, riwayat);
}

function renderHistory() {
  const input = $("tgl-history");
  if (!input.value) input.value = kunciTanggal(new Date());
  const pilih = input.value;

  const harian = riwayat
    .filter((r) => kunciTanggal(new Date(r.waktu)) === pilih)
    .sort((a, b) => new Date(a.waktu) - new Date(b.waktu));

  const hitung = (m) => harian.filter((r) => r.mode === m).length;
  const totalFokus = harian.filter((r) => r.mode === "pomodoro").reduce((jml, r) => jml + r.menit, 0);

  $("st-pomo").textContent = hitung("pomodoro");
  $("st-short").textContent = hitung("short");
  $("st-long").textContent = hitung("long");
  $("st-total").textContent = formatDurasiTotal(totalFokus);

  const daftar = $("daftar-history");
  daftar.innerHTML = "";
  harian.forEach((r) => {
    const li = document.createElement("li");
    const ikon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    ikon.setAttribute("class", r.mode === "pomodoro" ? "ikon-tomat mini" : "ikon-cangkir");
    const pakai = document.createElementNS("http://www.w3.org/2000/svg", "use");
    pakai.setAttribute("href", r.mode === "pomodoro" ? "#tomat" : "#cangkir");
    ikon.appendChild(pakai);

    const nama = document.createElement("span");
    nama.textContent = NAMA_MODE[r.mode]; // textContent: aman dari injeksi HTML
    const menit = document.createElement("span");
    menit.className = "menit";
    menit.textContent = r.menit + " min";
    const jam = document.createElement("span");
    jam.className = "jam";
    jam.textContent = formatJam(r.waktu);

    li.append(ikon, nama, menit, jam);
    daftar.appendChild(li);
  });
  $("kosong-history").hidden = harian.length > 0;
}

/* ========== 7. Pengaturan ========== */
function simpanPengaturan() {
  tulisJSON(KUNCI_PENGATURAN, pengaturan);
}

function terapkanTema() {
  document.documentElement.setAttribute("data-theme", pengaturan.tema);
  document.querySelectorAll(".tema").forEach((b) => b.classList.toggle("aktif", b.dataset.tema === pengaturan.tema));
}

function renderSettings() {
  document.querySelectorAll(".kartu-set").forEach((kartu) => {
    kartu.querySelector("b").textContent = pengaturan.durasi[kartu.dataset.mode];
  });
  $("chk-notif").checked = pengaturan.notifikasi;
  terapkanTema();
}

async function ubahNotifikasi(nyala) {
  const info = $("info-notif");
  info.textContent = "";
  if (!nyala) {
    pengaturan.notifikasi = false;
  } else if (!("Notification" in window)) {
    pengaturan.notifikasi = false;
    info.textContent = "Browser ini tidak mendukung notifikasi.";
  } else {
    const izin = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    pengaturan.notifikasi = izin === "granted";
    if (izin !== "granted") info.textContent = "Izin notifikasi ditolak di browser.";
  }
  simpanPengaturan();
  renderSettings();
}

/* ========== 8. Navigasi dan event ========== */
function tampilkan(nama) {
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("aktif", v.id === "view-" + nama));
  document.querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("aktif", b.dataset.view === nama));
  if (nama === "history") renderHistory();
  if (nama === "settings") renderSettings();
}

document.querySelectorAll(".nav-item").forEach((b) => b.addEventListener("click", () => tampilkan(b.dataset.view)));

$("btn-start").addEventListener("click", mulai);
$("btn-jeda").addEventListener("click", jeda);
$("btn-stop").addEventListener("click", berhenti);
$("pilih-mode").addEventListener("change", (e) => {
  timer.mode = e.target.value;
  renderHome();
});
$("btn-kurang").addEventListener("click", () => ubahDurasiMode(timer.mode, -1));
$("btn-tambah").addEventListener("click", () => ubahDurasiMode(timer.mode, +1));

document.querySelectorAll(".kartu-set").forEach((kartu) => {
  kartu.querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => ubahDurasiMode(kartu.dataset.mode, b.dataset.aksi === "+" ? 1 : -1))
  );
});

document.querySelectorAll(".tema").forEach((b) =>
  b.addEventListener("click", () => {
    pengaturan.tema = b.dataset.tema;
    simpanPengaturan();
    terapkanTema();
  })
);

$("btn-tema").addEventListener("click", () => {
  pengaturan.tema = pengaturan.tema === "merah" ? "biru" : "merah";
  simpanPengaturan();
  terapkanTema();
});

$("chk-notif").addEventListener("change", (e) => ubahNotifikasi(e.target.checked));
$("tgl-history").addEventListener("change", renderHistory);
$("btn-hapus-history").addEventListener("click", () => {
  if (confirm("Hapus semua riwayat sesi?")) {
    riwayat = [];
    tulisJSON(KUNCI_RIWAYAT, riwayat);
    renderHistory();
  }
});

// Inisialisasi
terapkanTema();
renderHome();
renderSettings();
renderHistory();
