// =============================================================
// 🌐 KONFIGURASI URL
// =============================================================
const googleScriptURL =
  "https://script.google.com/macros/s/AKfycbxPvDr1xDYOY3RIlWGzgJyDypLzrJYsAe8xfMrEnrj77mA8id1XIZMaRDo9BWU7be3LJw/exec";

const cloudflareWorkerURL =
  "https://backend-monitoring-staging.backendta.workers.dev";

// =============================================================
// 🔘 SIDEBAR TOGGLE
// =============================================================
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebar-toggle");
const mainContent = document.getElementById("main-content");

const sidebarOverlay = document.createElement("div");
sidebarOverlay.className = "sidebar-overlay";
document.body.appendChild(sidebarOverlay);

sidebarToggle.addEventListener("click", () => {
  const isClosed = sidebar.classList.contains("closed");
  if (isClosed) {
    sidebar.classList.remove("closed");
    sidebarToggle.classList.add("active");
    mainContent.classList.remove("expanded");
    sidebarOverlay.classList.add("active");
  } else {
    sidebar.classList.add("closed");
    sidebarToggle.classList.remove("active");
    mainContent.classList.add("expanded");
    sidebarOverlay.classList.remove("active");
  }
});

sidebarOverlay.addEventListener("click", () => {
  sidebar.classList.add("closed");
  sidebarToggle.classList.remove("active");
  mainContent.classList.add("expanded");
  sidebarOverlay.classList.remove("active");
});

document.querySelectorAll(".sidebar-nav a").forEach(link => {
  link.addEventListener("click", () => {
    if (window.innerWidth <= 1200) {
      sidebar.classList.add("closed");
      sidebarToggle.classList.remove("active");
      mainContent.classList.add("expanded");
      sidebarOverlay.classList.remove("active");
    }
  });
});

// =============================================================
// 🧭 NAVIGASI SIDEBAR (4 Menu)
// =============================================================
const navHome = document.getElementById("nav-home");
const navHasil = document.getElementById("nav-hasil");
const navFuzzy = document.getElementById("nav-fuzzy");
const navTerapi = document.getElementById("nav-terapi");
const sectionHome = document.getElementById("section-home");
const sectionHasil = document.getElementById("section-hasil");
const sectionFuzzy = document.getElementById("section-fuzzy");
const sectionTerapi = document.getElementById("section-terapi");

navHome.addEventListener("click", (e) => { e.preventDefault(); setActiveSection("home"); });
navHasil.addEventListener("click", (e) => { e.preventDefault(); setActiveSection("hasil"); });
navFuzzy.addEventListener("click", (e) => { e.preventDefault(); setActiveSection("fuzzy"); });
navTerapi.addEventListener("click", (e) => { e.preventDefault(); setActiveSection("terapi"); });

function setActiveSection(section) {
  navHome.classList.toggle("active", section === "home");
  navHasil.classList.toggle("active", section === "hasil");
  navFuzzy.classList.toggle("active", section === "fuzzy");
  navTerapi.classList.toggle("active", section === "terapi");

  sectionHome.classList.toggle("active", section === "home");
  sectionHasil.classList.toggle("active", section === "hasil");
  sectionFuzzy.classList.toggle("active", section === "fuzzy");
  sectionTerapi.classList.toggle("active", section === "terapi");

  if (section !== "terapi" && window.ecgAnimationId) {
    cancelAnimationFrame(window.ecgAnimationId);
    window.ecgAnimationId = null;
  }
  if (section === "hasil") {
    fetchLatestData();
  }
}

// =============================================================
// 👤 ABOUT US TOGGLE
// =============================================================
document.getElementById("btn-about")?.addEventListener("click", () => {
  const aboutInfo = document.getElementById("about-info");
  if (!aboutInfo) return;
  if (aboutInfo.style.display === "none" || aboutInfo.style.display === "") {
    aboutInfo.style.display = "block";
    aboutInfo.style.animation = "none";
    aboutInfo.offsetHeight;
    aboutInfo.style.animation = "slideDown 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
  } else {
    aboutInfo.style.display = "none";
  }
});

// =============================================================
// 📊 FETCH DATA PREVIEW (Hasil Monitoring)
// =============================================================
async function fetchLatestData() {
  const previewBox = document.getElementById("data-preview-content");
  if (!previewBox) return;
  previewBox.innerHTML = '<span class="loading-text">Mengambil data...</span>';
  try {
    const res = await fetch(`${cloudflareWorkerURL}/api/latest`);
    if (!res.ok) throw new Error("Gagal fetch");
    const text = await res.text();
    if (text === "{}" || !text) {
      previewBox.innerHTML = '<span style="color:#ffa502;">⚠️ Belum ada data monitoring.</span>';
      return;
    }
    const data = JSON.parse(text);
    previewBox.innerHTML = JSON.stringify(data, null, 2);
  } catch (err) {
    previewBox.innerHTML = `<span style="color:#ff4757;">❌ Error: ${err.message}</span>`;
  }
}
document.getElementById("btn-refresh-data")?.addEventListener("click", fetchLatestData);

// =============================================================
// 📥 DOWNLOAD EXCEL HISTORIS
// =============================================================
document.getElementById("btn-download-excel")?.addEventListener("click", () => {
  document.getElementById("datePickerModal").style.display = "flex";
});
document.getElementById("btn-cancel-download")?.addEventListener("click", () => {
  document.getElementById("datePickerModal").style.display = "none";
});
document.getElementById("btn-confirm-download")?.addEventListener("click", async () => {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  if (!startDate || !endDate) { alert("Pilih tanggal mulai dan selesai!"); return; }
  document.getElementById("datePickerModal").style.display = "none";
  try {
    const res = await fetch(`${cloudflareWorkerURL}/api/all-monitoring`);
    if (!res.ok) throw new Error("Gagal ambil data");
    const allData = await res.json();
    const filtered = allData.filter(item => {
      if (!item.waktu) return false;
      const itemDateStr = item.waktu.substring(0, 10);
      return itemDateStr >= startDate && itemDateStr <= endDate;
    });
    if (filtered.length === 0) {
      alert("Tidak ada data dalam rentang tanggal tersebut.");
      return;
    }
    const excelData = filtered.map(item => ({
      "Tanggal": new Date(item.waktu).toLocaleString('id-ID'),
      "Nama": item.nama || "",
      "Umur": item.umur || "",
      "Alamat": item.alamat || "",
      "Sudut 1 (°)": item.sudut?.sudut1?.derajat || item.sudut1 || 0,
      "Sudut 2 (°)": item.sudut?.sudut2?.derajat || item.sudut2 || 0,
      "Sudut 3 (°)": item.sudut?.sudut3?.derajat || item.sudut3 || 0,
      "ECG (mV)": item.ecgNilaiRata || item.ecgNilai || 0,
      "Klasifikasi": item.sudut?.sudut1?.ecgKlasifikasi || item.ecgKlasifikasi || "Normal",
      "Status": item.sudut?.sudut1?.statusGerakan || "Berhasil"
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, "Monitoring");
    XLSX.writeFile(wb, `data-monitoring-${startDate}_${endDate}.xlsx`);
  } catch (err) {
    console.error(err);
    alert("Gagal mendownload data.");
  }
});

// =============================================================
// 🧠 FUZZY MAMDANI LENGKAP (EXCEL)
// =============================================================
document.getElementById("btn-download-excel-fuzzy")?.addEventListener("click", async () => {
  try {
    const res = await fetch(`${cloudflareWorkerURL}/api/latest`);
    if (!res.ok) throw new Error("Gagal mengambil data");
    const text = await res.text();
    if (text === "{}" || !text) {
      alert("⚠️ Belum ada data terapi. Silakan mulai terapi terlebih dahulu.");
      return;
    }
    const data = JSON.parse(text);
    const emg = data.ecgNilaiRata || data.ecgNilai || 0;
    const sudut = data.sudut?.sudut1?.derajat || data.sudut1 || 0;

    const muLemah = emg <= 400 ? (400 - emg) / 400 : 0;
    const muSedang = (emg >= 200 && emg <= 700) ? (emg - 200) / 500 :
                     (emg > 700 && emg <= 1023) ? (1023 - emg) / 323 : 0;
    const muKuat = emg >= 700 ? (emg - 700) / 323 : 0;

    const outTinggi = 80, outSedang = 50, outRendah = 30;
    const alpha = [muLemah, muSedang, muKuat];
    const outLevels = [outTinggi, outSedang, outRendah];
    const sumAlpha = alpha.reduce((s,v)=>s+v,0);
    let crisp = 50;
    if (sumAlpha > 0) crisp = (alpha[0]*outLevels[0] + alpha[1]*outLevels[1] + alpha[2]*outLevels[2]) / sumAlpha;
    const persentase = Math.round(crisp) + "%";

    const sheetInput = [
      { "Nama Pasien": data.nama || "-", "Umur": data.umur || "-", "Alamat": data.alamat || "-" },
      { "Nilai EMG": emg, "Sudut Awal": sudut + "°" }
    ];
    const sheetFuzzifikasi = [
      { "Variabel": "EMG", "Nilai Tegas": emg },
      { "Himpunan": "Lemah", "Fungsi": "μ(x) = (400 - x)/400, 0≤x≤400", "μ": muLemah.toFixed(4) },
      { "Himpunan": "Sedang", "Fungsi": "μ(x) = (x-200)/500 utk 200≤x≤700; (1023-x)/323 utk 700≤x≤1023", "μ": muSedang.toFixed(4) },
      { "Himpunan": "Kuat", "Fungsi": "μ(x) = (x-700)/323, 700≤x≤1023", "μ": muKuat.toFixed(4) }
    ];
    const sheetAturan = [
      { "Aturan": "R1: IF EMG Lemah THEN Bantuan Tinggi", "α": muLemah.toFixed(4), "Output": "80%", "Hasil MIN": muLemah.toFixed(4) },
      { "Aturan": "R2: IF EMG Sedang THEN Bantuan Sedang", "α": muSedang.toFixed(4), "Output": "50%", "Hasil MIN": muSedang.toFixed(4) },
      { "Aturan": "R3: IF EMG Kuat THEN Bantuan Rendah", "α": muKuat.toFixed(4), "Output": "30%", "Hasil MIN": muKuat.toFixed(4) }
    ];
    const sheetAgregasi = [
      { "Metode": "MAX", "Keterangan": "Gabungan output ketiga aturan" }
    ];
    const sheetDefuzz = [
      { "Metode": "Centroid", "Rumus": "z* = Σ(α_i × z_i) / Σα_i" },
      { "Komponen": "α1 × z1", "Nilai": `${muLemah.toFixed(4)} × 80 = ${(muLemah*80).toFixed(4)}` },
      { "Komponen": "α2 × z2", "Nilai": `${muSedang.toFixed(4)} × 50 = ${(muSedang*50).toFixed(4)}` },
      { "Komponen": "α3 × z3", "Nilai": `${muKuat.toFixed(4)} × 30 = ${(muKuat*30).toFixed(4)}` },
      { "Σα_i": "", "Nilai": sumAlpha.toFixed(4) },
      { "Σ(α_i×z_i)": "", "Nilai": (muLemah*80+muSedang*50+muKuat*30).toFixed(4) },
      { "Hasil Crisp (z*)": persentase }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetInput), "1-Data Input");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetFuzzifikasi), "2-Fuzzifikasi");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetAturan), "3-Aturan & Implikasi");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetAgregasi), "4-Agregasi");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetDefuzz), "5-Defuzzifikasi");
    XLSX.writeFile(wb, `perhitungan-fuzzy-${new Date().toISOString().slice(0,10)}.xlsx`);

  } catch (err) {
    console.error(err);
    alert("❌ Gagal mengunduh perhitungan fuzzy.");
  }
});

// =============================================================
// 📊 DOWNLOAD GRAFIK FUZZY (CANVAS MURNI - MATLAB STYLE)
// =============================================================
document.getElementById("btn-download-grafik-fuzzy")?.addEventListener("click", async () => {
  try {
    const res = await fetch(`${cloudflareWorkerURL}/api/latest`);
    if (!res.ok) throw new Error("Gagal ambil data");
    const text = await res.text();
    if (text === "{}" || !text) {
      alert("⚠️ Belum ada data terapi.");
      return;
    }
    const data = JSON.parse(text);
    const emg = data.ecgNilaiRata || data.ecgNilai || 0;

    const muLemah = emg <= 400 ? (400 - emg) / 400 : 0;
    const muSedang = (emg >= 200 && emg <= 700) ? (emg - 200) / 500 :
                     (emg > 700 && emg <= 1023) ? (1023 - emg) / 323 : 0;
    const muKuat = emg >= 700 ? (emg - 700) / 323 : 0;
    const alpha = [muLemah, muSedang, muKuat];
    const outLevels = [80, 50, 30];
    const sumAlpha = alpha.reduce((s,v)=>s+v,0);
    let crisp = 50;
    if (sumAlpha > 0) crisp = (muLemah*80 + muSedang*50 + muKuat*30) / sumAlpha;

    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 700;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("Sistem Inferensi Fuzzy Mamdani - Terapi Rehabilitasi Lengan", 50, 30);

    const inputX = 60, inputY = 60, inputW = 400, inputH = 250;
    ctx.strokeStyle = "#ddd"; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      let x = inputX + (i/10)*inputW;
      ctx.beginPath(); ctx.moveTo(x, inputY); ctx.lineTo(x, inputY+inputH); ctx.stroke();
      ctx.fillStyle = "#888"; ctx.font = "9px sans-serif";
      ctx.fillText(Math.round(i*102.3), x-10, inputY+inputH+12);
    }
    for (let i = 0; i <= 4; i++) {
      let y = inputY + (i/4)*inputH;
      ctx.beginPath(); ctx.moveTo(inputX, y); ctx.lineTo(inputX+inputW, y); ctx.stroke();
      ctx.fillText((1 - i/4).toFixed(1), inputX-25, y+3);
    }
    ctx.strokeStyle = "#000"; ctx.lineWidth = 1.5;
    ctx.strokeRect(inputX, inputY, inputW, inputH);
    ctx.fillText("Input: Nilai EMG", inputX+5, inputY-5);
    ctx.fillText("Derajat Keanggotaan", inputX-50, inputY-20);

    const drawCurveInput = (points, color) => {
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath();
      let first = true;
      for (const [xVal, yVal] of points) {
        const px = inputX + (xVal/1023)*inputW;
        const py = inputY + (1-yVal)*inputH;
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    };
    drawCurveInput([[0,1],[400,0],[1023,0]], "#e74c3c");
    drawCurveInput([[0,0],[200,0],[700,1],[1023,0]], "#f39c12");
    drawCurveInput([[0,0],[700,0],[1023,1]], "#27ae60");
    ctx.fillStyle = "#e74c3c"; ctx.fillText("Lemah", inputX+100, inputY+20);
    ctx.fillStyle = "#f39c12"; ctx.fillText("Sedang", inputX+180, inputY+70);
    ctx.fillStyle = "#27ae60"; ctx.fillText("Kuat", inputX+300, inputY+20);

    const emgX = inputX + (emg/1023)*inputW;
    ctx.strokeStyle = "#2980b9"; ctx.lineWidth = 1.5;
    ctx.setLineDash([5,3]);
    ctx.beginPath(); ctx.moveTo(emgX, inputY); ctx.lineTo(emgX, inputY+inputH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#2980b9"; ctx.font = "bold 10px sans-serif";
    ctx.fillText(`EMG = ${emg}`, emgX+5, inputY+15);
    const muMax = Math.max(muLemah, muSedang, muKuat);
    ctx.fillStyle = "#2980b9";
    ctx.beginPath(); ctx.arc(emgX, inputY + (1-muMax)*inputH, 5, 0, 2*Math.PI); ctx.fill();

    const outputX = 520, outputY = 60, outputW = 400, outputH = 250;
    ctx.strokeStyle = "#ddd"; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      let y = outputY + (i/4)*outputH;
      ctx.beginPath(); ctx.moveTo(outputX, y); ctx.lineTo(outputX+outputW, y); ctx.stroke();
      ctx.fillText((1 - i/4).toFixed(1), outputX-25, y+3);
    }
    ctx.strokeStyle = "#000"; ctx.lineWidth = 1.5;
    ctx.strokeRect(outputX, outputY, outputW, outputH);
    ctx.fillText("Output: Bantuan Motor (%)", outputX+5, outputY-5);

    const drawSingleton = (xPercent, color, label) => {
      const px = outputX + (xPercent/100)*outputW;
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px, outputY); ctx.lineTo(px, outputY+outputH); ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillText(label, px-10, outputY-5);
    };
    drawSingleton(30, "#27ae60", "Rendah");
    drawSingleton(50, "#f39c12", "Sedang");
    drawSingleton(80, "#e74c3c", "Tinggi");

    const ruleY = 350, ruleH = 300, ruleW = 900, ruleX = 60;
    ctx.strokeStyle = "#000"; ctx.lineWidth = 1;
    ctx.strokeRect(ruleX, ruleY, ruleW, ruleH);
    const rowH = ruleH / 5;

    const plotRuleRow = (rowIdx, alphaVal, outPercent, color, ruleName) => {
      const y0 = ruleY + rowIdx * rowH;
      const yMid = y0 + rowH/2;
      ctx.strokeStyle = "#ccc"; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(ruleX, y0); ctx.lineTo(ruleX+ruleW, y0); ctx.stroke();
      ctx.fillStyle = "#000"; ctx.font = "bold 10px sans-serif";
      ctx.fillText(ruleName, ruleX+5, y0+15);
      const miniW = ruleW * 0.3;
      ctx.strokeStyle = color; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(ruleX+40, yMid); ctx.lineTo(ruleX+40+miniW, yMid); ctx.stroke();
      ctx.fillText(`α = ${alphaVal.toFixed(2)}`, ruleX+45, yMid-3);
      const outX = ruleX + ruleW*0.6;
      const outPx = outX + (outPercent/100)*(ruleW*0.35);
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(outPx, y0+5); ctx.lineTo(outPx, y0+rowH-5); ctx.stroke();
      ctx.fillText(`${outPercent}%`, outPx-10, y0+rowH-10);
    };

    plotRuleRow(0, muLemah, 80, "#e74c3c", "R1: IF Lemah THEN Tinggi");
    plotRuleRow(1, muSedang, 50, "#f39c12", "R2: IF Sedang THEN Sedang");
    plotRuleRow(2, muKuat, 30, "#27ae60", "R3: IF Kuat THEN Rendah");

    const aggY = ruleY + 3*rowH;
    ctx.strokeStyle = "#ccc"; ctx.beginPath(); ctx.moveTo(ruleX, aggY); ctx.lineTo(ruleX+ruleW, aggY); ctx.stroke();
    ctx.fillStyle = "#000"; ctx.fillText("AGREGASI (MAX)", ruleX+5, aggY+15);
    const aggBaseX = ruleX + ruleW*0.6;
    const aggW = ruleW*0.35;
    [
      {x: 30, h: muLemah, c: "#e74c3c"},
      {x: 50, h: muSedang, c: "#f39c12"},
      {x: 80, h: muKuat, c: "#27ae60"}
    ].forEach(s => {
      const px = aggBaseX + (s.x/100)*aggW;
      const top = aggY + rowH - (s.h*rowH);
      ctx.fillStyle = s.c + "60";
      ctx.fillRect(px-10, top, 20, aggY+rowH - top);
      ctx.strokeStyle = s.c;
      ctx.lineWidth = 1;
      ctx.strokeRect(px-10, top, 20, aggY+rowH - top);
    });

    const cenY = ruleY + 4*rowH;
    ctx.fillText(`DEFUZZIFIKASI (Centroid): z* = ${crisp.toFixed(2)}%`, ruleX+5, cenY+15);
    const centroidX = aggBaseX + (crisp/100)*aggW;
    ctx.strokeStyle = "blue"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(centroidX, cenY+5); ctx.lineTo(centroidX, cenY+rowH-5); ctx.stroke();
    ctx.fillStyle = "blue";
    ctx.fillText(`${crisp.toFixed(2)}%`, centroidX-15, cenY+rowH-5);

    setTimeout(() => {
      const link = document.createElement('a');
      link.download = `grafik-fuzzy-${new Date().toISOString().slice(0,10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }, 500);

  } catch (err) {
    console.error(err);
    alert("❌ Gagal mengunduh grafik fuzzy.");
  }
});

// =============================================================
// 📝 FORM PASIEN
// =============================================================
document.getElementById("formPasien").addEventListener("submit", async (e) => {
  e.preventDefault();
  const pasien = {
    nama: document.getElementById("nama").value.trim(),
    umur: document.getElementById("umur").value.trim(),
    alamat: document.getElementById("alamat").value.trim(),
    waktu: new Date().toISOString()
  };
  try {
    await fetch(googleScriptURL, { method: "POST", mode: "no-cors", body: JSON.stringify(pasien) });
    const backupResponse = await fetch(`${cloudflareWorkerURL}/api/backup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pasien)
    });
    if (backupResponse.ok) {
      console.log("✅ Data pasien tersimpan");
      localStorage.setItem("formFilled", "true");
      localStorage.setItem("namaPasien", pasien.nama);
      localStorage.setItem("umurPasien", pasien.umur);
      localStorage.setItem("alamatPasien", pasien.alamat);
      fetch(`${cloudflareWorkerURL}/api/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: "start" })
      }).catch(() => {});
      showTransitionAnimation();
      setTimeout(() => switchToMonitoring(), 2000);
    }
  } catch (err) {
    console.error("❌ Error:", err);
    document.getElementById("status").innerText = "❌ Terjadi kesalahan jaringan!";
  }
});

// =============================================================
// 🔄 SWITCH SUB-SECTION: Form → Monitoring
// =============================================================
let realtimePollingInterval = null;

function switchToMonitoring() {
  document.getElementById("sub-form").classList.remove("active");
  document.getElementById("sub-monitoring").classList.add("active");
  document.getElementById("displayNama").textContent = localStorage.getItem("namaPasien") || "-";
  document.getElementById("displayUmur").textContent = (localStorage.getItem("umurPasien") || "-") + " tahun";
  document.getElementById("displayAlamat").textContent = localStorage.getItem("alamatPasien") || "-";
  initECGGraph();
  startRealtimePolling();
}

function startRealtimePolling() {
  if (realtimePollingInterval) clearInterval(realtimePollingInterval);
  realtimePollingInterval = setInterval(async () => {
    try {
      const res = await fetch(`${cloudflareWorkerURL}/api/latest`);
      if (!res.ok) return;
      const text = await res.text();
      if (!text || text === "{}") return;
      const data = JSON.parse(text);
      if (data.sudut) {
        for (let i = 1; i <= 3; i++) {
          const el = document.getElementById(`sudut${i}`);
          if (!el) continue;
          const sudutData = data.sudut[`sudut${i}`];
          if (sudutData?.derajat !== undefined) el.textContent = sudutData.derajat + "°";
          else if (data[`sudut${i}`] !== undefined) el.textContent = data[`sudut${i}`] + "°";
        }
      }
      if (data.ecgNilaiRata !== undefined || data.ecgNilai !== undefined) {
        window.ecgActualValue = data.ecgNilaiRata || data.ecgNilai || window.ecgActualValue;
      }
    } catch (err) { console.warn("Polling error:", err.message); }
  }, 300);
}

document.getElementById("btn-kembali")?.addEventListener("click", () => {
  document.getElementById("sub-monitoring").classList.remove("active");
  document.getElementById("sub-form").classList.add("active");
  if (realtimePollingInterval) { clearInterval(realtimePollingInterval); realtimePollingInterval = null; }
  if (window.intervalID) { clearInterval(window.intervalID); window.intervalID = null; }
  if (window.ecgAnimationId) { cancelAnimationFrame(window.ecgAnimationId); window.ecgAnimationId = null; }
  fetch(`${cloudflareWorkerURL}/api/command`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command: "stop" }) }).catch(() => {});
});

// =============================================================
// 🎬 ANIMASI TRANSISI
// =============================================================
function showTransitionAnimation() {
  const overlay = document.createElement('div');
  overlay.id = 'transition-overlay';
  overlay.innerHTML = `
    <div class="transition-content">
      <div class="scanner-line"></div>
      <div class="loading-circle"></div>
      <div class="transition-text">
        <div class="main-text">INITIALIZING MONITORING SYSTEM</div>
        <div class="sub-text">Connecting to patient sensors...</div>
        <div class="progress-bar"><div class="progress-fill"></div></div>
        <div class="loading-dots"><span>●</span><span>●</span><span>●</span></div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('active'), 10);
  setTimeout(() => { overlay.classList.remove('active'); setTimeout(() => overlay.remove(), 500); }, 2000);
}

// =============================================================
// 📊 ECG GRAPH (60 fps)
// =============================================================
window.ecgActualValue = 500;
let ecgCanvas, ecgCtx, ecgPoints = [], ecgX = 0, ecgLastUpdate = 0;
window.ecgAnimationId = null;

function initECGGraph() {
  ecgCanvas = document.getElementById("ecgCanvas");
  if (!ecgCanvas) return;
  ecgCtx = ecgCanvas.getContext("2d");
  ecgPoints = []; ecgX = 0;
  if (window.ecgAnimationId) cancelAnimationFrame(window.ecgAnimationId);
  drawECGLoop();
}

function drawECGGrid() {
  if (!ecgCtx || !ecgCanvas) return;
  const w = ecgCanvas.width, h = ecgCanvas.height;
  ecgCtx.strokeStyle = "rgba(0,255,255,0.06)"; ecgCtx.lineWidth = 0.5;
  for (let x = 0; x < w; x += 5) { ecgCtx.beginPath(); ecgCtx.moveTo(x,0); ecgCtx.lineTo(x,h); ecgCtx.stroke(); }
  for (let y = 0; y < h; y += 5) { ecgCtx.beginPath(); ecgCtx.moveTo(0,y); ecgCtx.lineTo(w,y); ecgCtx.stroke(); }
  ecgCtx.strokeStyle = "rgba(0,255,255,0.18)"; ecgCtx.lineWidth = 1;
  for (let x = 0; x < w; x += 25) { ecgCtx.beginPath(); ecgCtx.moveTo(x,0); ecgCtx.lineTo(x,h); ecgCtx.stroke(); }
  for (let y = 0; y < h; y += 25) { ecgCtx.beginPath(); ecgCtx.moveTo(0,y); ecgCtx.lineTo(w,y); ecgCtx.stroke(); }
  ecgCtx.strokeStyle = "rgba(0,255,255,0.25)"; ecgCtx.lineWidth = 1.5;
  ecgCtx.beginPath(); ecgCtx.moveTo(0, h/2); ecgCtx.lineTo(w, h/2); ecgCtx.stroke();
  ecgCtx.fillStyle = "rgba(0,212,255,0.6)"; ecgCtx.font = "11px 'Orbitron', monospace";
  ecgCtx.fillText("AMPLITUDO", 8, 18); ecgCtx.fillText("WAKTU →", w-70, h-8);
}

function drawECGLoop(timestamp) {
  if (!ecgCtx || !ecgCanvas) { window.ecgAnimationId = requestAnimationFrame(drawECGLoop); return; }
  if (timestamp && timestamp - ecgLastUpdate < 16) { window.ecgAnimationId = requestAnimationFrame(drawECGLoop); return; }
  if (timestamp) ecgLastUpdate = timestamp;
  const w = ecgCanvas.width, h = ecgCanvas.height, centerY = h/2;
  ecgCtx.clearRect(0,0,w,h);
  drawECGGrid();
  const currentECG = window.ecgActualValue || 500;
  const y = centerY - ((currentECG - 512) / 512) * (h/2 - 30);
  ecgPoints.push({x: ecgX, y});
  if (ecgPoints.length > w) ecgPoints.shift();
  if (ecgPoints.length > 1) {
    ecgCtx.shadowBlur = 18; ecgCtx.shadowColor = "rgba(0,255,136,0.9)";
    const gradient = ecgCtx.createLinearGradient(0,0,0,h);
    gradient.addColorStop(0,"#00ffcc"); gradient.addColorStop(0.5,"#00ff88"); gradient.addColorStop(1,"#00cc66");
    ecgCtx.strokeStyle = gradient; ecgCtx.lineWidth = 2.5; ecgCtx.lineCap = "round"; ecgCtx.lineJoin = "round";
    ecgCtx.beginPath();
    const offsetX = ecgX >= w ? ecgX - w : 0;
    for (let i=0; i<ecgPoints.length; i++) {
      const px = ecgPoints[i].x - offsetX;
      if (i===0) ecgCtx.moveTo(px, ecgPoints[i].y); else ecgCtx.lineTo(px, ecgPoints[i].y);
    }
    ecgCtx.stroke(); ecgCtx.shadowBlur = 0;
    ecgCtx.fillStyle = "rgba(0,20,10,0.05)"; ecgCtx.fillRect(0,0,w,h);
  }
  ecgX++; if (ecgX > w*2) ecgX = w;
  window.ecgAnimationId = requestAnimationFrame(drawECGLoop);
}

// =============================================================
// 🎉 NOTIFIKASI SUKSES
// =============================================================
function showSuccessNotification() {
  const notification = document.createElement('div');
  notification.className = 'success-notification';
  notification.innerHTML = `<div class="notification-content"><div class="notification-icon">✅</div><div class="notification-text"><div class="notification-title">Data Berhasil Dikirim!</div><div class="notification-subtitle">Semua data monitoring telah tersimpan di server</div></div></div>`;
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add('show'), 100);
  setTimeout(() => { notification.classList.remove('show'); setTimeout(() => notification.remove(), 500); }, 4000);
}