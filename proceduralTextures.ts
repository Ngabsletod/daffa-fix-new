import * as THREE from 'three';

function finalizeColorTexture(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(maxAnisotropy, 8);
  tex.needsUpdate = true;
  return tex;
}

/** Precision ESD PCB workbench turntable texture */
export function createTurntableTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;

  // Deep solder-mask slate-emerald base
  const grad = ctx.createRadialGradient(cx, cy, 40, cx, cy, size * 0.5);
  grad.addColorStop(0, '#132133');
  grad.addColorStop(0.75, '#0E1826');
  grad.addColorStop(1, '#09101A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Subtle orthogonal PCB grid
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
  ctx.lineWidth = 1.5;
  const step = 48;
  for (let i = 0; i <= size; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // Concentric calibration rings
  const rings = [140, 260, 380, 465];
  rings.forEach((r, idx) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = idx === 3 ? 'rgba(56, 189, 248, 0.32)' : 'rgba(148, 163, 184, 0.16)';
    ctx.lineWidth = idx === 3 ? 2.5 : 1.5;
    if (idx === 1) ctx.setLineDash([8, 10]);
    else ctx.setLineDash([]);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // Degree tick marks around outer perimeter
  for (let deg = 0; deg < 360; deg += 5) {
    const rad = (deg * Math.PI) / 180;
    const isMajor = deg % 30 === 0;
    const isMid = deg % 15 === 0;
    const rInner = isMajor ? 438 : isMid ? 448 : 455;
    const rOuter = 465;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(rad) * rInner, cy + Math.sin(rad) * rInner);
    ctx.lineTo(cx + Math.cos(rad) * rOuter, cy + Math.sin(rad) * rOuter);
    ctx.strokeStyle = isMajor ? 'rgba(56, 189, 248, 0.55)' : 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = isMajor ? 2.5 : 1.2;
    ctx.stroke();
  }

  // Copper fiducial crosshairs
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 50, cy);
  ctx.lineTo(cx + 50, cy);
  ctx.moveTo(cx, cy - 50);
  ctx.lineTo(cx, cy + 50);
  ctx.stroke();

  return finalizeColorTexture(canvas, maxAnisotropy);
}

/** Soft radial contact shadow directly beneath components */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 124);
  grad.addColorStop(0, 'rgba(2, 6, 23, 0.72)');
  grad.addColorStop(0.55, 'rgba(2, 6, 23, 0.32)');
  grad.addColorStop(1, 'rgba(2, 6, 23, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Electrolytic capacitor blue/indigo PVC sleeve with negative polarity stripe & spec text */
export function createElkoSleeveTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1E3A8A';
  ctx.fillRect(0, 0, 512, 256);

  // Subtle metallic sheen gradient
  const sheen = ctx.createLinearGradient(0, 0, 512, 0);
  sheen.addColorStop(0, 'rgba(255,255,255,0.06)');
  sheen.addColorStop(0.35, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.75, 'rgba(0,0,0,0.22)');
  sheen.addColorStop(1, 'rgba(255,255,255,0.06)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, 512, 256);

  // Polarity negative white-silver stripe
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(36, 0, 56, 256);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let y = 38; y < 240; y += 60) {
    ctx.fillText('−', 64, y);
  }

  // Capacitance spec label
  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 34px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('470µF', 136, 102);
  ctx.fillStyle = '#93C5FD';
  ctx.font = 'bold 28px monospace';
  ctx.fillText('25V  105°C', 136, 152);

  return finalizeColorTexture(canvas, maxAnisotropy);
}

/** Ceramic disc capacitor stamped "104" marking */
export function createCeramicDiscTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#D97706';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle speckled ceramic glaze
  ctx.fillStyle = 'rgba(120, 53, 15, 0.14)';
  for (let i = 0; i < 160; i++) {
    const x = (i * 53) % 256;
    const y = (i * 97) % 256;
    ctx.fillRect(x, y, 3, 3);
  }

  ctx.fillStyle = '#1E1B18';
  ctx.font = 'bold 64px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('104', 128, 118);

  ctx.fillRect(72, 156, 112, 6);

  return finalizeColorTexture(canvas, maxAnisotropy);
}

/** Transistor TO-92 laser-etched flat face */
export function createTransistorFaceTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#18181B';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = 'bold 38px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BC547', 128, 105);

  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 26px monospace';
  ctx.fillText('NPN  B331', 128, 155);

  return finalizeColorTexture(canvas, maxAnisotropy);
}

/** IC DIP-8 NE555 top laser marking */
export function createIcTopTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1E2028';
  ctx.fillRect(0, 0, 512, 256);

  // Molded matte grain
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let i = 0; i < 400; i++) {
    ctx.fillRect((i * 71) % 512, (i * 39) % 256, 2, 2);
  }

  // Pin 1 dimple indicator
  ctx.beginPath();
  ctx.arc(62, 194, 18, 0, Math.PI * 2);
  ctx.fillStyle = '#334155';
  ctx.fill();
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Laser etched part number
  ctx.fillStyle = '#E2E8F0';
  ctx.font = 'bold 54px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NE555P', 274, 108);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '600 26px monospace';
  ctx.fillText('TIMER  8-DIP', 274, 166);

  return finalizeColorTexture(canvas, maxAnisotropy);
}

/** Diode 1N4007 body wrap with silver cathode ring */
export function createDiodeTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#171923';
  ctx.fillRect(0, 0, 512, 256);

  // Cathode silver band near top/left depending on UV
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(0, 26, 512, 46);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = 'bold 42px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('1N4007', 256, 155);

  return finalizeColorTexture(canvas, maxAnisotropy);
}
