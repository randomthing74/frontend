// =============================================================
// 🔐 Validasi: pastikan user sudah isi form
// =============================================================
if (!localStorage.getItem("formFilled")) {
  alert("⚠️ Harap isi data pasien terlebih dahulu!");
  window.location.href = "index.html";
}

// Ambil data pasien dari localStorage
const namaPasien = localStorage.getItem("namaPasien") || "Pasien Tidak Dikenal";
const umurPasien = parseInt(localStorage.getItem("umurPasien")) || 0;
const alamatPasien = localStorage.getItem("alamatPasien") || "Alamat Tidak Diketahui";

// Tampilkan data pasien di header
document.getElementById("displayNama").textContent = namaPasien;
document.getElementById("displayUmur").textContent = umurPasien + " tahun";
document.getElementById("displayAlamat").textContent = alamatPasien;

// =============================================================
// 🌩️ URL Cloudflare Worker STAGING (KV backend)
// =============================================================
const API_URL = "https://backend-monitoring-staging.backendta.workers.dev/api/monitoring";

// =============================================================
// ⚙️ Variabel global
// =============================================================
let currentStep = 1;
let currentAngles = { sudut1: 0, sudut2: 0, sudut3: 0 };
let statusGerakan = { sudut1: "", sudut2: "", sudut3: "" };
let intervalID = null;
const targetAngle = 180;
const ACTIVE_ANGLES = 3;
let ecgActualValue = 0;
let ecgKlasifikasiPerSudut = { sudut1: "", sudut2: "", sudut3: "" };

// =============================================================
// 💡 Fungsi simulasi gerakan bertahap
// =============================================================
function mulaiGerakan(step) {
  console.log(`▶️ Mulai Gerakan ${step}`);

  for (let i = 1; i <= ACTIVE_ANGLES; i++) {
    const el = document.getElementById(`sudut${i}`);
    if (i > step && el.innerText !== "◉ COMPLETE") el.innerText = "--";
  }

  currentAngles[`sudut${step}`] = 0;
  statusGerakan[`sudut${step}`] = "Bergerak";

  intervalID = setInterval(() => {
    let key = `sudut${step}`;
    currentAngles[key] += Math.floor(Math.random() * 20 + 10);
    if (currentAngles[key] > targetAngle) currentAngles[key] = targetAngle;

    document.getElementById(key).innerText = currentAngles[key] + "°";

    ecgKlasifikasiPerSudut[key] = ecgActualValue <= 400 ? "Lemah" : ecgActualValue <= 600 ? "Sedang" : "Kuat";

    if (currentAngles[key] >= targetAngle) {
      clearInterval(intervalID);
      const successElement = document.getElementById(key);
      successElement.innerHTML = `<span style="color: #00ff00; text-shadow: 0 0 20px #00ff00, 0 0 40px #00ff00; font-size: 1.2em; animation: pulse-success 1s ease-in-out infinite;">◉</span> <span style="color: #00ffff; text-shadow: 0 0 15px #00ffff;">COMPLETE</span>`;
      console.log(`🏁 Gerakan ${step} selesai!`);
      
      statusGerakan[key] = "Berhasil";

      if (step < ACTIVE_ANGLES) {
        setTimeout(() => mulaiGerakan(step + 1), 2000);
      } else {
        console.log("🎉 Semua gerakan selesai!");
        setTimeout(() => kirimDataLengkap(), 1000);
      }
    }
  }, 1500);
}

// =============================================================
// 💓 Tampilan ECG
// =============================================================
const ecgBox = document.querySelector(".monitor-box.ecg");
const canvas = document.getElementById("ecgCanvas");
const ctx = canvas.getContext("2d");

const successStyle = document.createElement('style');
successStyle.textContent = `
  @keyframes pulse-success {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.8; }
  }
`;
document.head.appendChild(successStyle);

ecgBox.innerHTML = `<h3 style="margin: 0 0 15px 0; font-family: 'Orbitron', sans-serif; color: #00d4ff; font-size: 1.3em; text-transform: uppercase; letter-spacing: 2px; text-shadow: 0 0 10px rgba(0, 212, 255, 0.6);">⚡ SENSOR ECG</h3>`;

canvas.style.background = "linear-gradient(135deg, #0a0e1a 0%, #0f1828 100%)";
canvas.style.borderRadius = "12px";
canvas.style.boxShadow = "0 8px 25px rgba(0,0,0,0.5), inset 0 0 30px rgba(0, 255, 255, 0.1)";
canvas.style.width = "100%";
canvas.style.height = "200px";
canvas.style.border = "2px solid rgba(0, 255, 255, 0.4)";
ecgBox.appendChild(canvas);

// =============================================================
// 🧱 Tambah kotak nilai ECG
// =============================================================
const mainContainer = ecgBox.parentElement;

const ecgValueCard = document.createElement("div");
ecgValueCard.classList.add("monitor-box", "ecg-value");
ecgValueCard.innerHTML = `
  <div style="font-size: 13px; color: #00d4ff; font-family: 'Orbitron', sans-serif; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; text-shadow: 0 0 8px rgba(0, 212, 255, 0.5);">Nilai ECG</div>
  <div style="font-size: 52px; font-weight: 700; font-family: 'Orbitron', sans-serif; color: #00ffff; text-shadow: 0 0 20px rgba(0, 255, 255, 0.8);">0</div>
  <div style="font-size: 20px; font-family: 'Rajdhani', sans-serif; color: #00ffff; margin-top: 8px; font-weight: 600;">(Lemah)</div>
  <div style="font-size: 13px; color: #00d4ff; margin-top: 15px; font-family: 'Orbitron', sans-serif; letter-spacing: 1px; text-shadow: 0 0 8px rgba(0, 212, 255, 0.5);">BPM: 0</div>
`;
mainContainer.appendChild(ecgValueCard);

// =============================================================
// 🎨 Draw ECG Grid
// =============================================================
function drawECGGrid() {
  const gridColor = "rgba(0, 255, 255, 0.08)";
  const majorGridColor = "rgba(0, 255, 255, 0.2)";
  const smallGrid = 5;
  const largeGrid = 25;

  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 0.5;

  for (let x = 0; x < canvas.width; x += smallGrid) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += smallGrid) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  ctx.strokeStyle = majorGridColor;
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += largeGrid) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += largeGrid) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  ctx.strokeStyle = "rgba(0, 255, 255, 0.25)";
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();

  ctx.fillStyle = "rgba(0, 212, 255, 0.6)";
  ctx.font = "11px 'Orbitron', monospace";
  ctx.fillText("AMPLITUDO", 8, 18);
  ctx.fillText("WAKTU →", canvas.width - 70, canvas.height - 8);
}

// =============================================================
// 🎵 Simulasi sinyal ECG
// =============================================================
let x = 0;
let ecgData = [];
let lastUpdateTime = 0;
let baseValue = 500;
let ecgPoints = [];

function drawECG(timestamp) {
  if (timestamp - lastUpdateTime < 50) {
    requestAnimationFrame(drawECG);
    return;
  }
  lastUpdateTime = timestamp;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawECGGrid();

  baseValue += Math.floor(Math.random() * 25 - 12);
  if (baseValue < 0) baseValue = 0;
  if (baseValue > 1023) baseValue = 1023;
  ecgActualValue = baseValue;

  let y;
  const centerY = canvas.height / 2;
  const amplitude = 60;
  
  if (x % 150 < 20) {
    y = centerY - amplitude * 0.3 * Math.sin((x % 150) * Math.PI / 20);
  } else if (x % 150 < 30) {
    y = centerY;
  } else if (x % 150 < 35) {
    y = centerY + amplitude * 0.2;
  } else if (x % 150 < 45) {
    y = centerY - amplitude * 1.2 * Math.sin(((x % 150) - 35) * Math.PI / 10);
  } else if (x % 150 < 50) {
    y = centerY + amplitude * 0.3;
  } else if (x % 150 < 60) {
    y = centerY;
  } else if (x % 150 < 90) {
    y = centerY - amplitude * 0.4 * Math.sin(((x % 150) - 60) * Math.PI / 30);
  } else {
    y = centerY + (Math.random() * 3 - 1.5);
  }

  ecgPoints.push({ x: x, y: y });
  if (ecgPoints.length > canvas.width) {
    ecgPoints.shift();
  }

  if (ecgPoints.length > 1) {
    ctx.shadowBlur = 15;
    ctx.shadowColor = "rgba(0, 255, 255, 0.8)";
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#00ffff");
    gradient.addColorStop(0.5, "#00d4ff");
    gradient.addColorStop(1, "#0099ff");
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    ctx.beginPath();
    ctx.moveTo(ecgPoints[0].x, ecgPoints[0].y);
    for (let i = 1; i < ecgPoints.length; i++) {
      ctx.lineTo(ecgPoints[i].x, ecgPoints[i].y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ecgData.push(ecgActualValue);
  if (ecgData.length > 150) ecgData.shift();

  let kategori = "";
  let warnaKategori = "";
  let iconStatus = "";
  
  if (ecgActualValue <= 400) {
    kategori = "Lemah"; warnaKategori = "#ff4757"; iconStatus = "⚠️";
  } else if (ecgActualValue <= 600) {
    kategori = "Sedang"; warnaKategori = "#ffa502"; iconStatus = "⚡";
  } else {
    kategori = "Kuat"; warnaKategori = "#2ed573"; iconStatus = "✅";
  }

  ecgValueCard.innerHTML = `
    <div style="font-size: 13px; color: #00d4ff; font-family: 'Orbitron', sans-serif; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; text-shadow: 0 0 8px rgba(0, 212, 255, 0.5);">Nilai ECG</div>
    <div style="font-size: 52px; font-weight: 700; font-family: 'Orbitron', sans-serif; color: ${warnaKategori}; text-shadow: 0 0 25px ${warnaKategori}, 0 0 50px ${warnaKategori}80; letter-spacing: 3px;">${ecgActualValue}</div>
    <div style="font-size: 20px; font-family: 'Rajdhani', sans-serif; color: ${warnaKategori}; margin-top: 8px; font-weight: 600; display: flex; align-items: center; gap: 10px; justify-content: center; text-shadow: 0 0 15px ${warnaKategori}80;">
      <span style="font-size: 24px;">${iconStatus}</span>
      <span style="text-transform: uppercase; letter-spacing: 1px;">${kategori}</span>
    </div>
    <div style="font-size: 13px; color: #00d4ff; margin-top: 15px; font-family: 'Orbitron', sans-serif; letter-spacing: 1px; text-shadow: 0 0 8px rgba(0, 212, 255, 0.5);">BPM: ${Math.floor(60 + Math.random() * 40)}</div>
  `;

  x++;
  if (x >= canvas.width) {
    x = 0;
    ecgPoints = [];
  }

  requestAnimationFrame(drawECG);
}

ctx.beginPath();
drawECG(performance.now());

// =============================================================
// 📤 Kirim data lengkap ke Cloudflare KV STAGING
// =============================================================
async function kirimDataLengkap() {
  console.log("📤 Mengirim data lengkap ke backend STAGING...");
  
  const data = {
    nama: namaPasien,
    umur: umurPasien,
    alamat: alamatPasien,
    sudutAktif: ACTIVE_ANGLES,
    sudut1: currentAngles.sudut1,
    sudut2: currentAngles.sudut2,
    sudut3: currentAngles.sudut3,
    ecgNilai: ecgData.length > 0 ? Math.round(ecgData.reduce((a, b) => a + b, 0) / ecgData.length) : ecgActualValue,
    ecgKlasifikasi: ecgActualValue <= 400 ? "Lemah" : ecgActualValue <= 600 ? "Sedang" : "Kuat",
    ecgKlasifikasi1: ecgKlasifikasiPerSudut.sudut1 || "Normal",
    ecgKlasifikasi2: ecgKlasifikasiPerSudut.sudut2 || "Normal",
    ecgKlasifikasi3: ecgKlasifikasiPerSudut.sudut3 || "Normal",
    statusGerakan1: statusGerakan.sudut1,
    statusGerakan2: statusGerakan.sudut2,
    statusGerakan3: statusGerakan.sudut3,
    ecg: ecgData,
    waktu: new Date().toISOString(),
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const response = await res.json();
      console.log("✅ Data lengkap tersimpan di Cloudflare KV STAGING!");
      console.log("📊 Response:", response);
      showSuccessNotification();
    } else {
      console.warn("⚠️ Gagal kirim data ke Cloudflare:", res.status);
    }
  } catch (err) {
    console.error("❌ Error koneksi:", err);
  }
}

// =============================================================
// 🎉 Notifikasi sukses
// =============================================================
function showSuccessNotification() {
  const notification = document.createElement('div');
  notification.className = 'success-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">✅</div>
      <div class="notification-text">
        <div class="notification-title">Data Berhasil Dikirim!</div>
        <div class="notification-subtitle">Semua data monitoring telah tersimpan di server STAGING</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 4000);
}

// =============================================================
// 🚀 Jalankan simulasi pertama
// =============================================================
mulaiGerakan(currentStep);