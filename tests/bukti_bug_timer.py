from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(); page = b.new_page(); page.clock.install()
    page.goto("file://" + __import__("os").path.abspath(__import__("os").path.join(__import__("os").path.dirname(__file__), "..", "index.html")))
    page.click("#btn-start")
    page.clock.fast_forward(10*60*1000)   # simulasi tab ditunda 10 menit (interval tidak terpanggil tiap detik)
    page.clock.run_for(300)
    print("Versi final (berbasis jam sistem) setelah 10 menit tertunda:", page.inner_text("#waktu-jalan"), "(seharusnya ~15:00)")
    # versi naif: kurangi 1 detik tiap callback interval
    naif = page.evaluate("""() => { let sisa = 1500; const id = setInterval(()=>{sisa--;},1000); return new Promise(r=>r(()=>sisa)); }""")
    page.evaluate("window.__naif = 1500; setInterval(()=>{window.__naif--;},1000)")
    page.clock.fast_forward(10*60*1000)
    print("Versi naif (sisa--) setelah 10 menit tertunda yang sama   :", page.evaluate("Math.floor(window.__naif/60)+':'+String(window.__naif%60).padStart(2,'0')"), "(salah, hampir tidak berkurang)")
    b.close()
