import sys, json, time
from playwright.sync_api import sync_playwright

BASE = "file://" + __import__("os").path.abspath(__import__("os").path.join(__import__("os").path.dirname(__file__), "..", "index.html")) + ""
OUT = __import__("os").path.abspath(__import__("os").path.join(__import__("os").path.dirname(__file__), "..", "docs", "screenshots")) + "/"
hasil = []
def cek(nama, kondisi):
    hasil.append((nama, bool(kondisi)))
    print(("PASS " if kondisi else "FAIL ") + nama)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome" if False else None)
    ctx = b.new_context(viewport={"width": 1100, "height": 720})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.clock.install()
    page.goto(BASE)

    cek("Awal: waktu 25:00", page.inner_text("#waktu-idle") == "25:00")
    time.sleep(0.5); page.screenshot(path=OUT + "01-home.png")

    # Start -> berjalan
    page.click("#btn-start")
    page.clock.run_for(5000)
    cek("Setelah 5 detik tampil 24:55", page.inner_text("#waktu-jalan") == "24:55")
    cek("Chip Pomodoro 1/4", page.inner_text("#chip-sesi") == "Pomodoro 1/4")
    page.clock.run_for(5 * 60 * 1000)
    time.sleep(0.5); page.screenshot(path=OUT + "02-berjalan.png")

    # Jeda: waktu tidak berubah
    page.click("#btn-jeda")
    t1 = page.inner_text("#waktu-jalan")
    page.clock.run_for(60000)
    cek("Saat dijeda waktu tidak berubah", page.inner_text("#waktu-jalan") == t1)
    page.click("#btn-jeda")
    page.clock.run_for(2000)
    cek("Lanjut setelah jeda berkurang", page.inner_text("#waktu-jalan") != t1)

    # Stop: tidak tercatat
    page.click("#btn-stop")
    cek("Stop kembali ke idle", page.is_visible("#panel-idle"))
    n = json.loads(page.evaluate("localStorage.getItem('pomodoro-riwayat-v1')") or "[]")
    cek("Stop tidak mencatat riwayat", len(n) == 0)

    # Selesaikan siklus lengkap: 4 pomodoro + 3 short + 1 long
    urutan = []
    for i in range(4):
        page.select_option("#pilih-mode", "pomodoro")
        page.click("#btn-start"); page.clock.run_for(25*60*1000 + 1000)
        urutan.append(page.input_value("#pilih-mode"))   # mode berikut
        if i < 3:
            page.click("#btn-start"); page.clock.run_for(5*60*1000 + 1000)
    cek("Setelah pomodoro 1-3 -> short; setelah ke-4 -> long", urutan == ["short","short","short","long"])
    page.click("#btn-start"); page.clock.run_for(15*60*1000 + 1000)
    cek("Setelah long break kembali ke pomodoro", page.input_value("#pilih-mode") == "pomodoro")

    # History
    page.click("[data-view=history]")
    cek("History: 4 pomodoro", page.inner_text("#st-pomo") == "4")
    cek("History: 3 short", page.inner_text("#st-short") == "3")
    cek("History: 1 long", page.inner_text("#st-long") == "1")
    cek("History: total fokus 1h 40m", page.inner_text("#st-total") == "1h 40m")
    cek("History: 8 baris", page.locator("#daftar-history li").count() == 8)
    time.sleep(0.5); page.screenshot(path=OUT + "04-history.png")

    # Settings
    page.click("[data-view=settings]")
    page.click(".kartu-set[data-mode=pomodoro] [data-aksi='+']")
    cek("Settings: pomodoro jadi 26", page.inner_text(".kartu-set[data-mode=pomodoro] b") == "26")
    page.click("[data-view=home]")
    cek("Home ikut berubah 26:00", page.inner_text("#waktu-idle") == "26:00")
    page.click("[data-view=settings]")
    page.click(".kartu-set[data-mode=pomodoro] [data-aksi='-']")
    # batas bawah
    for _ in range(40):
        page.click(".kartu-set[data-mode=short] [data-aksi='-']")
    cek("Batas minimum 1 menit", page.inner_text(".kartu-set[data-mode=short] b") == "1")
    for _ in range(4):
        page.click(".kartu-set[data-mode=short] [data-aksi='+']")
    time.sleep(0.5); page.screenshot(path=OUT + "05-settings.png")

    # Tema biru
    page.click(".tema[data-tema=biru]")
    cek("Tema biru diterapkan", page.get_attribute("html", "data-theme") == "biru")
    time.sleep(0.5); page.screenshot(path=OUT + "06-tema-biru.png")
    page.click(".tema[data-tema=merah]")

    # Persistensi
    page.reload()
    cek("Setelah reload tema tetap merah", page.get_attribute("html", "data-theme") == "merah")
    page.click("[data-view=history]")
    cek("Setelah reload riwayat tetap 4 pomodoro", page.inner_text("#st-pomo") == "4")

    # Data rusak tidak membuat aplikasi mati
    page.evaluate("localStorage.setItem('pomodoro-pengaturan-v1','{rusak'); localStorage.setItem('pomodoro-riwayat-v1','bukan json')")
    page.reload()
    cek("Data rusak: tetap tampil 25:00", page.inner_text("#waktu-idle") == "25:00")

    # Injeksi HTML di riwayat
    page.evaluate("""localStorage.setItem('pomodoro-riwayat-v1', JSON.stringify([{id:1,mode:'<img src=x onerror=alert(1)>',menit:5,waktu:new Date().toISOString()}]))""")
    page.reload()
    cek("Mode tidak valid disaring dari riwayat", page.locator("#daftar-history li").count() == 0)

    cek("Tidak ada error konsol", errors == [])

    # Screenshot utama dengan data: ulangi untuk home kondisi baru
    page.evaluate("localStorage.clear()")
    page.reload()
    page.clock.install()
    page.click("#btn-start")
    page.clock.run_for(6*60*1000 + 28*1000)
    time.sleep(0.5); time.sleep(0.5); page.screenshot(path=OUT + "03-timer-1832.png")

    # Mobile
    m = b.new_context(viewport={"width": 390, "height": 760}).new_page()
    m.goto(BASE); time.sleep(0.5)
    m.screenshot(path=OUT + "07-mobile.png")
    ov = m.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
    cek("Mobile: tanpa scroll horizontal", not ov)
    b.close()

gagal = [n for n, ok in hasil if not ok]
print("\nTOTAL", len(hasil), "GAGAL", len(gagal), gagal)
sys.exit(1 if gagal else 0)
