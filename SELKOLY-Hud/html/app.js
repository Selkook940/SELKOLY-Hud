const healthCircle = document.getElementById("healthCircle");
const armorCircle = document.getElementById("armorCircle");
const healthText = document.getElementById("healthText");
const armorText = document.getElementById("armorText");

const vehicleBox = document.getElementById("vehicleBox");
const speedText = document.getElementById("speedText");
const gearText = document.getElementById("gearText");

const handbrakeState = document.getElementById("handbrakeState");
const engineState = document.getElementById("engineState");
const handbrakeIcon = document.getElementById("handbrakeIcon");
const engineIcon = document.getElementById("engineIcon");

const canvas = document.getElementById("rpmCanvas");
const ctx = canvas.getContext("2d");

const turboCanvas = document.getElementById("turboCanvas");
const tCtx = turboCanvas ? turboCanvas.getContext("2d") : null;

const speedDialCanvas = document.getElementById("speedDialCanvas");
const sdCtx = speedDialCanvas ? speedDialCanvas.getContext("2d") : null;

// Yeni CSS boyutlarına göre (400x400) ayarlanmış değerler
const W = 400;
const H = 400;
canvas.width = W;
canvas.height = H;
const CX = W / 2;
const CY = H / 2;

const OUTER_R = 175; 
const RING_R = 140;

let hideTimeout = null;

let targetData = {
  rpm: 0,
  speed: 0,
  gear: 0,
  maxGear: 0,
  inVehicle: false,
  engineOn: false,
  handbrake: false,
  engineHealth: 1000,
  nearShift: false,
  turbo: 0.0
};

let smoothData = {
  rpm: 0,
  speed: 0,
  gear: 0,
  maxGear: 0,
  inVehicle: false,
  engineOn: false,
  handbrake: false,
  engineHealth: 1000,
  nearShift: false,
  turbo: 0.0
};

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function gearLabel(g) {
  if (g < 0) return "R";
  if (g === 0) return "N";
  return String(g);
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16)
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return `rgb(${Math.round(lerp(a.r, b.r, t))}, ${Math.round(lerp(a.g, b.g, t))}, ${Math.round(lerp(a.b, b.b, t))})`;
}

function engineColorFromHealth(health) {
  if (health >= 700) return "#8eff5a";
  if (health >= 300) return "#ffb14a";
  return "#ff4a4a";
}

function setVehicleVisible(visible) {
  clearTimeout(hideTimeout);

  if (visible) {
    vehicleBox.classList.remove("hidden");
    requestAnimationFrame(() => {
      vehicleBox.classList.add("visible");
    });
    return;
  }

  vehicleBox.classList.remove("visible");
  vehicleBox.classList.add("hidden");

  speedText.textContent = "0";
  gearText.textContent = "N";

  const tText = document.getElementById("turboText");
  if (tText) tText.textContent = "0.0";
}

// Orijinal detaylı ana kadran çizimi
function drawDial(rpm, engineOn, nearShift) {
  ctx.clearRect(0, 0, W, H);

  const start = Math.PI * 0.78;
  const end = Math.PI * 2.22;
  const total = end - start;

  const baseAlpha = engineOn ? 1 : 0.24;
  const softColor = engineOn ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.24)";

  const bgGlow = ctx.createRadialGradient(CX, CY, 16, CX, CY, OUTER_R);
  bgGlow.addColorStop(0, engineOn ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)");
  bgGlow.addColorStop(0.7, "rgba(255,255,255,0.02)");
  bgGlow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.beginPath();
  ctx.arc(CX, CY, OUTER_R, 0, Math.PI * 2);
  ctx.fillStyle = bgGlow;
  ctx.fill();

  ctx.globalAlpha = baseAlpha;

  ctx.beginPath();
  ctx.arc(CX, CY, RING_R, start, end);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 22;
  ctx.lineCap = "round";
  ctx.stroke();

  for (let rpmMark = 0; rpmMark <= 8000; rpmMark += 250) {
    const t = rpmMark / 8000;
    const ang = start + t * total;
    const major = rpmMark % 1000 === 0;
    const redZone = rpmMark >= 6500;

    const inner = RING_R - (major ? 28 : 18);
    const outer = RING_R + 7;

    const x1 = CX + Math.cos(ang) * inner;
    const y1 = CY + Math.sin(ang) * inner;
    const x2 = CX + Math.cos(ang) * outer;
    const y2 = CY + Math.sin(ang) * outer;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = major ? 3.2 : 1.15;
    ctx.lineCap = "round";
    ctx.strokeStyle = redZone
      ? (engineOn ? "rgba(255, 74, 74, 0.95)" : "rgba(255, 74, 74, 0.28)")
      : (engineOn ? "rgba(240, 245, 250, 0.72)" : "rgba(240, 245, 250, 0.22)");
    ctx.stroke();

    if (major) {
      const tx = CX + Math.cos(ang) * (RING_R - 48);
      const ty = CY + Math.sin(ang) * (RING_R - 48);

      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(ang + Math.PI / 2);
      ctx.fillStyle = redZone
        ? (engineOn ? "rgba(255, 110, 110, 0.92)" : "rgba(255, 110, 110, 0.24)")
        : softColor;
      ctx.font = "700 12px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(Math.floor(rpmMark / 1000)), 0, 0);
      ctx.restore();
    }
  }

  const fill = engineOn ? clamp(rpm, 0, 1) : 0.02;
  const colorT = clamp((fill - 0.58) / 0.42, 0, 1);
  const dynamicColor = engineOn ? lerpColor("#63efff", "#ff4141", colorT) : "rgba(138,143,152,0.75)";
  const activeEnd = start + fill * total;

  ctx.beginPath();
  ctx.arc(CX, CY, RING_R, start, activeEnd);
  ctx.strokeStyle = dynamicColor;
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.shadowColor = dynamicColor;
  ctx.shadowBlur = engineOn ? 16 : 0;
  ctx.stroke();
  ctx.shadowBlur = 0;

  const capX = CX + Math.cos(activeEnd) * RING_R;
  const capY = CY + Math.sin(activeEnd) * RING_R;
  ctx.beginPath();
  ctx.arc(capX, capY, 3.8, 0, Math.PI * 2);
  ctx.fillStyle = dynamicColor;
  ctx.fill();

  if (engineOn) {
    const needleAng = start + fill * total;
    const needleX = CX + Math.cos(needleAng) * (RING_R - 14);
    const needleY = CY + Math.sin(needleAng) * (RING_R - 14);

    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(needleX, needleY);
    ctx.strokeStyle = dynamicColor;
    ctx.lineWidth = 2.4;
    ctx.shadowColor = dynamicColor;
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  const innerGlow = ctx.createRadialGradient(CX, CY, 28, CX, CY, 106);
  innerGlow.addColorStop(0, engineOn ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.015)");
  innerGlow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.beginPath();
  ctx.arc(CX, CY, 102, 0, Math.PI * 2);
  ctx.fillStyle = innerGlow;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(CX, CY, 11, 0, Math.PI * 2);
  ctx.fillStyle = engineOn ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)";
  ctx.shadowColor = dynamicColor;
  ctx.shadowBlur = engineOn ? 18 : 0;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.globalAlpha = 1;
}

// Mini Kadran (Turbo ve Hız) Çizimi
function drawMiniDial(miniCtx, val, max, color) {
  if (!miniCtx) return;
  miniCtx.clearRect(0, 0, 120, 120);
  const cx = 60, cy = 60, r = 45;
  const start = Math.PI * 0.8;
  const end = Math.PI * 2.2;

  // Arka Plan Çizgisi
  miniCtx.beginPath();
  miniCtx.arc(cx, cy, r, start, end);
  miniCtx.strokeStyle = "rgba(255,255,255,0.1)";
  miniCtx.lineWidth = 5;
  miniCtx.stroke();

  // Doluluk Çizgisi
  const fill = clamp(val / max, 0, 1);
  miniCtx.beginPath();
  miniCtx.arc(cx, cy, r, start, start + (fill * (end - start)));
  miniCtx.strokeStyle = color;
  miniCtx.lineWidth = 5;
  miniCtx.lineCap = "round";
  miniCtx.shadowBlur = 8;
  miniCtx.shadowColor = color;
  miniCtx.stroke();
  miniCtx.shadowBlur = 0;
}

function updateEngineIndicator(engineHealth) {
  const color = engineColorFromHealth(engineHealth);
  engineIcon.style.color = color;
  engineIcon.style.filter = `drop-shadow(0 0 8px ${color}66)`;
}

function render() {
  // Yumuşak geçişler
  smoothData.speed = lerp(smoothData.speed, targetData.speed, 0.12);
  smoothData.rpm = lerp(smoothData.rpm, targetData.engineOn ? targetData.rpm : 0, 0.12);
  smoothData.turbo = lerp(smoothData.turbo, targetData.engineOn ? targetData.turbo : 0, 0.12);
  smoothData.gear = targetData.gear;
  smoothData.maxGear = targetData.maxGear;
  smoothData.inVehicle = targetData.inVehicle;
  smoothData.engineOn = targetData.engineOn;
  smoothData.handbrake = targetData.handbrake;
  smoothData.engineHealth = targetData.engineHealth;
  smoothData.nearShift = targetData.nearShift;

  // Ana kadranı çiz
  drawDial(smoothData.rpm, smoothData.engineOn, smoothData.nearShift);

  // Mini kadranları çiz
drawMiniDial(tCtx, smoothData.turbo, 1.4, "#ffb14a");
  drawMiniDial(sdCtx, smoothData.speed, 500, "#63efff"); // Hız (Max 300 kmh)

  if (smoothData.inVehicle) {
    const displaySpeed = smoothData.engineOn ? smoothData.speed : 0;
    speedText.textContent = String(Math.max(0, Math.round(displaySpeed)));
    gearText.textContent = gearLabel(smoothData.gear);
    
    const tText = document.getElementById("turboText");
    if(tText) {
        tText.textContent = smoothData.turbo.toFixed(1);
    }

    const activeColor = smoothData.engineOn
      ? (smoothData.nearShift ? "rgb(255, 74, 74)" : "rgb(99, 239, 255)")
      : "rgba(180, 186, 195, 0.65)";

    gearText.style.color = activeColor;
    gearText.style.textShadow = smoothData.engineOn
      ? `0 0 12px ${activeColor.replace("rgb(", "rgba(").replace(")", ", 0.45)")}`
      : "none";

    // El freni durumu
    handbrakeState.classList.toggle("active", !!smoothData.handbrake);
    handbrakeIcon.style.color = smoothData.handbrake ? "#ff4a4a" : "rgba(255,255,255,0.28)";
    handbrakeIcon.style.filter = smoothData.handbrake ? "drop-shadow(0 0 8px #ff4a4a)" : "none";

    // Motor sağlığı
    engineState.classList.add("active");
    updateEngineIndicator(smoothData.engineHealth);
  }

  requestAnimationFrame(render);
}

requestAnimationFrame(render);

window.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.action !== "hud") return;

  const hp = clamp(Number(data.health) || 0, 0, 100);
  const ar = clamp(Number(data.armor) || 0, 0, 100);

  const hpOffset = 125.6 - (125.6 * (hp / 100));
  const arOffset = 125.6 - (125.6 * (ar / 100));

  healthCircle.style.strokeDashoffset = hpOffset;
  armorCircle.style.strokeDashoffset = arOffset;

  healthText.textContent = `${Math.round(hp)}`;
  armorText.textContent = `${Math.round(ar)}`;

  targetData = {
    rpm: Number(data.rpm) || 0,
    speed: Number(data.speed) || 0,
    gear: Number(data.gear) || 0,
    maxGear: Number(data.maxGear) || 0,
    inVehicle: !!data.inVehicle,
    engineOn: !!data.engineOn,
    handbrake: !!data.handbrake,
    engineHealth: Number(data.engineHealth) || 1000,
    nearShift: !!data.nearShift,
    turbo: Number(data.turbo) || 0.0
  };

  if (targetData.inVehicle) {
    setVehicleVisible(true);
  } else {
    setVehicleVisible(false);
  }
});