import * as THREE from 'three';
import { ComponentId } from './componentsData';
import {
  createCeramicDiscTexture,
  createDiodeTexture,
  createElkoSleeveTexture,
  createIcTopTexture,
  createTransistorFaceTexture,
} from './proceduralTextures';

export interface BuiltComponent3D {
  group: THREE.Group;
  dispose: () => void;
  updateTest: (active: boolean, elapsed: number) => void;
}

/** Tag a sub-part for smooth exploded-view separation */
function tagPart(
  obj: THREE.Object3D,
  explodeVec: [number, number, number],
): THREE.Object3D {
  obj.userData.basePos = obj.position.clone();
  obj.userData.explodeVec = new THREE.Vector3(...explodeVec);
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return obj;
}

/** Shared helper for bent metallic wire leads */
function createWireLead(
  points: THREE.Vector3[],
  radius: number,
  mat: THREE.Material,
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, 24, radius, 12, false);
  return new THREE.Mesh(geo, mat);
}

/** Ground any built group so its lowest point sits flush at y = 0 */
function groundGroupAtZero(group: THREE.Group) {
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  if (Number.isFinite(box.min.y)) {
    const offset = -box.min.y;
    group.children.forEach((child) => {
      child.position.y += offset;
      if (child.userData.basePos) {
        (child.userData.basePos as THREE.Vector3).y += offset;
      }
    });
  }
}

export function buildComponent3D(
  id: ComponentId,
  maxAnisotropy: number,
  isSoftwareGl: boolean,
): BuiltComponent3D {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  // Shared calibrated PBR metals
  const tinnedCopperMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xd8dee9,
      metalness: 0.92,
      roughness: 0.2,
    }),
  );

  const brushedSteelMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xcbd5e1,
      metalness: 0.92,
      roughness: 0.26,
      anisotropy: 0.75,
    }),
  );

  const copperEnamelMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xd97706,
      metalness: 0.88,
      roughness: 0.22,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
    }),
  );

  let updateTest: (active: boolean, elapsed: number) => void = () => {};

  switch (id) {
    case 'resistor': {
      // 1. Peanut-shaped carbon resistor ceramic body via LatheGeometry
      const lathePts: THREE.Vector2[] = [];
      const steps = 28;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const y = (t - 0.5) * 2.1;
        // Bulge at ends, slight waist in middle
        const waist = 1 - 0.16 * Math.sin(t * Math.PI);
        const capFade = Math.sin(Math.min(Math.max(t, 0.001), 0.999) * Math.PI);
        const r = Math.min(0.42, 0.42 * waist * Math.pow(capFade, 0.18));
        lathePts.push(new THREE.Vector2(r, y));
      }
      const bodyGeo = track(new THREE.LatheGeometry(lathePts, 36));
      bodyGeo.rotateZ(Math.PI / 2);
      const ceramicMat = track(
        new THREE.MeshStandardMaterial({
          color: 0xe3c391,
          roughness: 0.65,
          metalness: 0.04,
        }),
      );
      const bodyMesh = new THREE.Mesh(bodyGeo, ceramicMat);
      bodyMesh.position.y = 1.15;
      group.add(tagPart(bodyMesh, [0, 0.35, 0]));

      // 2. End metal caps
      const capGeo = track(new THREE.CylinderGeometry(0.41, 0.41, 0.22, 32));
      capGeo.rotateZ(Math.PI / 2);
      [-0.95, 0.95].forEach((x) => {
        const cap = new THREE.Mesh(capGeo, brushedSteelMat);
        cap.position.set(x, 1.15, 0);
        group.add(tagPart(cap, [x * 0.55, 0.35, 0]));
      });

      // 3. Four precision color bands (270 Ohm ±5%: Red, Violet, Brown, Gold)
      const bandSpecs: Array<{ x: number; color: number; metalness?: number; roughness?: number }> = [
        { x: -0.58, color: 0xdc2626 }, // Red (2)
        { x: -0.26, color: 0x7c3aed }, // Violet (7)
        { x: 0.06, color: 0x78350f }, // Brown (x10)
        { x: 0.54, color: 0xfbbf24, metalness: 0.85, roughness: 0.22 }, // Gold (±5%)
      ];
      const bandGeo = track(new THREE.CylinderGeometry(0.372, 0.372, 0.14, 32, 1, true));
      bandGeo.rotateZ(Math.PI / 2);
      bandSpecs.forEach((b) => {
        const bMat = track(
          new THREE.MeshStandardMaterial({
            color: b.color,
            roughness: b.roughness ?? 0.32,
            metalness: b.metalness ?? 0.08,
            side: THREE.DoubleSide,
          }),
        );
        const band = new THREE.Mesh(bandGeo, bMat);
        band.position.set(b.x, 1.15, 0);
        group.add(tagPart(band, [b.x * 0.2, 0.72, 0]));
      });

      // 4. Bent axial leads
      const leftLead = createWireLead(
        [
          new THREE.Vector3(-1.02, 1.15, 0),
          new THREE.Vector3(-1.55, 1.15, 0),
          new THREE.Vector3(-1.68, 1.0, 0),
          new THREE.Vector3(-1.68, 0.035, 0),
        ],
        0.055,
        tinnedCopperMat,
      );
      track(leftLead.geometry);
      group.add(tagPart(leftLead, [-0.55, -0.1, 0]));

      const rightLead = createWireLead(
        [
          new THREE.Vector3(1.02, 1.15, 0),
          new THREE.Vector3(1.55, 1.15, 0),
          new THREE.Vector3(1.68, 1.0, 0),
          new THREE.Vector3(1.68, 0.035, 0),
        ],
        0.055,
        tinnedCopperMat,
      );
      track(rightLead.geometry);
      group.add(tagPart(rightLead, [0.55, -0.1, 0]));

      // 5. Subtle glowing current indicator ring for active test
      const flowGeo = track(new THREE.TorusGeometry(0.47, 0.025, 12, 36));
      flowGeo.rotateY(Math.PI / 2);
      const flowMat = track(
        new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0,
        }),
      );
      const flowRing = new THREE.Mesh(flowGeo, flowMat);
      flowRing.position.set(-0.8, 1.15, 0);
      group.add(flowRing);

      updateTest = (active, elapsed) => {
        if (active) {
          flowMat.opacity = 0.85;
          flowRing.position.x = -0.75 + ((elapsed * 1.4) % 1) * 1.5;
        } else {
          flowMat.opacity = 0;
        }
      };
      break;
    }

    case 'led': {
      // 1. Glass/Epoxy dome + cylinder via LatheGeometry
      const domePts: THREE.Vector2[] = [
        new THREE.Vector2(0, 2.38),
        new THREE.Vector2(0.18, 2.35),
        new THREE.Vector2(0.36, 2.25),
        new THREE.Vector2(0.49, 2.08),
        new THREE.Vector2(0.55, 1.85),
        new THREE.Vector2(0.55, 1.12),
        new THREE.Vector2(0.64, 1.12),
        new THREE.Vector2(0.64, 0.96),
        new THREE.Vector2(0.54, 0.96),
      ];
      const domeGeo = track(new THREE.LatheGeometry(domePts, 40));
      const ledGlassMat = track(
        new THREE.MeshPhysicalMaterial({
          color: 0xef4444,
          emissive: 0x991b1b,
          emissiveIntensity: 0.12,
          roughness: 0.12,
          metalness: 0.0,
          clearcoat: 1.0,
          clearcoatRoughness: 0.08,
          transmission: isSoftwareGl ? 0 : 0.72,
          transparent: true,
          opacity: isSoftwareGl ? 0.62 : 0.96,
          ior: 1.52,
          thickness: 0.9,
          depthWrite: false,
        }),
      );
      const domeMesh = new THREE.Mesh(domeGeo, ledGlassMat);
      domeMesh.renderOrder = 3;
      group.add(tagPart(domeMesh, [0, 0.65, 0]));

      // 2. Internal reflector cup (Cathode anvil) & Anode post
      const cupGeo = track(new THREE.CylinderGeometry(0.14, 0.09, 0.52, 16));
      const cupMesh = new THREE.Mesh(cupGeo, brushedSteelMat);
      cupMesh.position.set(-0.14, 1.38, 0);
      group.add(tagPart(cupMesh, [-0.15, 0.15, 0]));

      const postGeo = track(new THREE.BoxGeometry(0.08, 0.48, 0.08));
      const postMesh = new THREE.Mesh(postGeo, brushedSteelMat);
      postMesh.position.set(0.14, 1.35, 0);
      group.add(tagPart(postMesh, [0.15, 0.15, 0]));

      // 3. Glowing semiconductor die inside reflector cup
      const dieGeo = track(new THREE.SphereGeometry(0.085, 16, 16));
      const dieMat = track(
        new THREE.MeshStandardMaterial({
          color: 0xff4444,
          emissive: 0xff2222,
          emissiveIntensity: 0.4,
          roughness: 0.2,
        }),
      );
      const dieMesh = new THREE.Mesh(dieGeo, dieMat);
      dieMesh.position.set(-0.14, 1.66, 0);
      group.add(tagPart(dieMesh, [0, 0.2, 0]));

      // 4. Asymmetric metallic leads (Anode + longer, Cathode - shorter)
      const anodeGeo = track(new THREE.CylinderGeometry(0.045, 0.045, 1.18, 12));
      const anode = new THREE.Mesh(anodeGeo, tinnedCopperMat);
      anode.position.set(0.15, 0.59, 0);
      group.add(tagPart(anode, [0.22, -0.35, 0]));

      const cathodeGeo = track(new THREE.CylinderGeometry(0.045, 0.045, 0.94, 12));
      const cathode = new THREE.Mesh(cathodeGeo, tinnedCopperMat);
      cathode.position.set(-0.15, 0.71, 0);
      group.add(tagPart(cathode, [-0.22, -0.35, 0]));

      // 5. Real point light for interactive test
      const ledLight = new THREE.PointLight(0xff2a2a, 0, 5.5, 2);
      ledLight.position.set(0, 1.8, 0);
      group.add(ledLight);

      updateTest = (active, elapsed) => {
        if (active) {
          const pulse = 0.85 + Math.sin(elapsed * 5.0) * 0.15;
          ledGlassMat.emissiveIntensity = 1.25 * pulse;
          dieMat.emissiveIntensity = 3.2 * pulse;
          ledLight.intensity = 3.2 * pulse;
        } else {
          ledGlassMat.emissiveIntensity = 0.12;
          dieMat.emissiveIntensity = 0.4;
          ledLight.intensity = 0;
        }
      };
      break;
    }

    case 'electrolytic_cap': {
      const sleeveTex = track(createElkoSleeveTexture(maxAnisotropy));
      // 1. Cylindrical PVC sleeve body
      const bodyGeo = track(new THREE.CylinderGeometry(0.68, 0.68, 1.55, 40, 1, true));
      const sleeveMat = track(
        new THREE.MeshStandardMaterial({
          map: sleeveTex,
          roughness: 0.36,
          metalness: 0.15,
        }),
      );
      const bodyMesh = new THREE.Mesh(bodyGeo, sleeveMat);
      bodyMesh.position.y = 1.62;
      bodyMesh.rotation.y = -Math.PI / 3;
      group.add(tagPart(bodyMesh, [0, 0.25, 0]));

      // 2. Brushed aluminum top plate with safety vent cross grooves
      const topCapGeo = track(new THREE.CylinderGeometry(0.64, 0.67, 0.08, 36));
      const topCap = new THREE.Mesh(topCapGeo, brushedSteelMat);
      topCap.position.y = 2.4;
      group.add(tagPart(topCap, [0, 0.72, 0]));

      const grooveMat = track(
        new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6, metalness: 0.7 }),
      );
      const grooveGeo = track(new THREE.BoxGeometry(0.95, 0.02, 0.04));
      [0, Math.PI / 2].forEach((rot) => {
        const g = new THREE.Mesh(grooveGeo, grooveMat);
        g.position.y = 2.445;
        g.rotation.y = rot;
        group.add(tagPart(g, [0, 0.75, 0]));
      });

      // 3. Bottom rubber bung
      const bungGeo = track(new THREE.CylinderGeometry(0.65, 0.65, 0.14, 36));
      const bungMat = track(
        new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.88, metalness: 0.0 }),
      );
      const bung = new THREE.Mesh(bungGeo, bungMat);
      bung.position.y = 0.82;
      group.add(tagPart(bung, [0, -0.1, 0]));

      // 4. Asymmetric leads (+ long, - short)
      const posLeadGeo = track(new THREE.CylinderGeometry(0.048, 0.048, 0.92, 12));
      const posLead = new THREE.Mesh(posLeadGeo, tinnedCopperMat);
      posLead.position.set(0.24, 0.46, 0);
      group.add(tagPart(posLead, [0.22, -0.38, 0]));

      const negLeadGeo = track(new THREE.CylinderGeometry(0.048, 0.048, 0.72, 12));
      const negLead = new THREE.Mesh(negLeadGeo, tinnedCopperMat);
      negLead.position.set(-0.24, 0.56, 0);
      group.add(tagPart(negLead, [-0.22, -0.38, 0]));

      // 5. Charge ring indicator
      const chargeGeo = track(new THREE.TorusGeometry(0.75, 0.03, 12, 40));
      chargeGeo.rotateX(Math.PI / 2);
      const chargeMat = track(
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0 }),
      );
      const chargeRing = new THREE.Mesh(chargeGeo, chargeMat);
      chargeRing.position.y = 1.62;
      group.add(chargeRing);

      updateTest = (active, elapsed) => {
        if (active) {
          const cycle = (elapsed * 0.75) % 1;
          chargeRing.position.y = 0.9 + cycle * 1.45;
          chargeMat.opacity = Math.sin(cycle * Math.PI) * 0.85;
        } else {
          chargeMat.opacity = 0;
        }
      };
      break;
    }

    case 'ceramic_cap': {
      const discTex = track(createCeramicDiscTexture(maxAnisotropy));
      const discMat = track(
        new THREE.MeshStandardMaterial({
          map: discTex,
          roughness: 0.42,
          metalness: 0.05,
        }),
      );
      const glazeMat = track(
        new THREE.MeshStandardMaterial({
          color: 0xd97706,
          roughness: 0.42,
          metalness: 0.05,
        }),
      );

      // 1. Flattened ceramic disc body
      const discGeo = track(new THREE.CylinderGeometry(0.68, 0.68, 0.28, 36));
      discGeo.rotateX(Math.PI / 2);
      const disc = new THREE.Mesh(discGeo, [glazeMat, discMat, discMat]);
      disc.position.y = 1.48;
      group.add(tagPart(disc, [0, 0.35, 0]));

      // 2. Dipped resin shoulders over leads
      const shoulderGeo = track(new THREE.CapsuleGeometry(0.11, 0.24, 8, 12));
      [-0.26, 0.26].forEach((x) => {
        const sh = new THREE.Mesh(shoulderGeo, glazeMat);
        sh.position.set(x, 0.92, 0);
        group.add(tagPart(sh, [x * 0.4, 0.1, 0]));
      });

      // 3. Radial leads
      [-0.26, 0.26].forEach((x) => {
        const lead = createWireLead(
          [
            new THREE.Vector3(x, 0.92, 0),
            new THREE.Vector3(x, 0.42, 0),
            new THREE.Vector3(x * 1.15, 0.035, 0),
          ],
          0.042,
          tinnedCopperMat,
        );
        track(lead.geometry);
        group.add(tagPart(lead, [x * 0.6, -0.3, 0]));
      });

      // 4. Filter ripple wave ring
      const waveGeo = track(new THREE.TorusGeometry(0.8, 0.025, 12, 36));
      const waveMat = track(
        new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0 }),
      );
      const waveRing = new THREE.Mesh(waveGeo, waveMat);
      waveRing.position.y = 1.48;
      group.add(waveRing);

      updateTest = (active, elapsed) => {
        if (active) {
          const s = 0.85 + Math.sin(elapsed * 8) * 0.15;
          waveRing.scale.set(s, s, 1);
          waveMat.opacity = 0.75;
        } else {
          waveMat.opacity = 0;
        }
      };
      break;
    }

    case 'diode': {
      const diodeTex = track(createDiodeTexture(maxAnisotropy));
      const bodyGeo = track(new THREE.CylinderGeometry(0.36, 0.36, 1.55, 32));
      bodyGeo.rotateZ(Math.PI / 2);
      const bodyMat = track(
        new THREE.MeshStandardMaterial({
          map: diodeTex,
          roughness: 0.55,
          metalness: 0.08,
        }),
      );
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.y = 1.15;
      group.add(tagPart(bodyMesh, [0, 0.35, 0]));

      // Bevel end collars
      const collarGeo = track(new THREE.CylinderGeometry(0.34, 0.36, 0.08, 32));
      collarGeo.rotateZ(Math.PI / 2);
      const darkEpoxy = track(
        new THREE.MeshStandardMaterial({ color: 0x171923, roughness: 0.6, metalness: 0.05 }),
      );
      [-0.8, 0.8].forEach((x, idx) => {
        const c = new THREE.Mesh(collarGeo, darkEpoxy);
        c.position.set(x, 1.15, 0);
        if (idx === 0) c.rotation.y = Math.PI;
        group.add(tagPart(c, [x * 0.35, 0.35, 0]));
      });

      // Axial leads
      [-1, 1].forEach((dir) => {
        const lead = createWireLead(
          [
            new THREE.Vector3(dir * 0.8, 1.15, 0),
            new THREE.Vector3(dir * 1.45, 1.15, 0),
            new THREE.Vector3(dir * 1.58, 1.0, 0),
            new THREE.Vector3(dir * 1.58, 0.035, 0),
          ],
          0.06,
          tinnedCopperMat,
        );
        track(lead.geometry);
        group.add(tagPart(lead, [dir * 0.45, -0.1, 0]));
      });

      // Directional current arrow pulse
      const arrowGeo = track(new THREE.ConeGeometry(0.16, 0.32, 16));
      arrowGeo.rotateZ(Math.PI / 2);
      const arrowMat = track(
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0 }),
      );
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      arrow.position.set(0.6, 1.75, 0);
      group.add(arrow);

      updateTest = (active, elapsed) => {
        if (active) {
          arrowMat.opacity = 0.9;
          arrow.position.x = 0.7 - ((elapsed * 1.3) % 1) * 1.4;
        } else {
          arrowMat.opacity = 0;
        }
      };
      break;
    }

    case 'transistor': {
      // TO-92 D-shaped extruded body
      const dShape = new THREE.Shape();
      dShape.moveTo(-0.46, -0.15);
      dShape.lineTo(0.46, -0.15);
      dShape.absarc(0, -0.15, 0.46, 0, Math.PI, false);
      dShape.closePath();

      const extrudeGeo = track(
        new THREE.ExtrudeGeometry(dShape, {
          depth: 0.96,
          bevelEnabled: true,
          bevelThickness: 0.05,
          bevelSize: 0.04,
          bevelSegments: 4,
          curveSegments: 28,
        }),
      );
      extrudeGeo.rotateX(-Math.PI / 2);

      const epoxyMat = track(
        new THREE.MeshStandardMaterial({
          color: 0x18181b,
          roughness: 0.62,
          metalness: 0.06,
        }),
      );
      const bodyMesh = new THREE.Mesh(extrudeGeo, epoxyMat);
      bodyMesh.position.set(0, 1.05, 0);
      group.add(tagPart(bodyMesh, [0, 0.45, 0]));

      // Front laser-etched faceplate
      const faceTex = track(createTransistorFaceTexture(maxAnisotropy));
      const faceGeo = track(new THREE.PlaneGeometry(0.76, 0.78));
      const faceMat = track(
        new THREE.MeshStandardMaterial({
          map: faceTex,
          roughness: 0.58,
          metalness: 0.08,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        }),
      );
      const facePlane = new THREE.Mesh(faceGeo, faceMat);
      facePlane.position.set(0, 1.54, 0.195);
      group.add(tagPart(facePlane, [0, 0.45, 0.35]));

      // 3 Fanned legs (Collector, Base, Emitter)
      const xs = [-0.36, 0, 0.36];
      xs.forEach((x, idx) => {
        const topX = (idx - 1) * 0.22;
        const lead = createWireLead(
          [
            new THREE.Vector3(topX, 1.05, 0),
            new THREE.Vector3(topX, 0.75, 0),
            new THREE.Vector3(x, 0.42, 0),
            new THREE.Vector3(x, 0.03, 0),
          ],
          0.04,
          tinnedCopperMat,
        );
        track(lead.geometry);
        group.add(tagPart(lead, [(idx - 1) * 0.28, -0.3, 0]));
      });

      const gateRingGeo = track(new THREE.TorusGeometry(0.58, 0.028, 12, 32));
      gateRingGeo.rotateX(Math.PI / 2);
      const gateMat = track(
        new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0 }),
      );
      const gateRing = new THREE.Mesh(gateRingGeo, gateMat);
      gateRing.position.y = 1.5;
      group.add(gateRing);

      updateTest = (active, elapsed) => {
        if (active) {
          gateMat.opacity = 0.55 + Math.sin(elapsed * 6) * 0.35;
        } else {
          gateMat.opacity = 0;
        }
      };
      break;
    }

    case 'ic_555': {
      // 1. Beveled DIP-8 epoxy body
      const icShape = new THREE.Shape();
      const w = 1.65;
      const d = 1.05;
      const r = 0.06;
      icShape.moveTo(-w / 2 + r, -d / 2);
      icShape.lineTo(w / 2 - r, -d / 2);
      icShape.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
      icShape.lineTo(w / 2, d / 2 - r);
      icShape.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
      icShape.lineTo(-w / 2 + r, d / 2);
      icShape.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
      icShape.lineTo(-w / 2, -d / 2 + r);
      icShape.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);

      const icBodyGeo = track(
        new THREE.ExtrudeGeometry(icShape, {
          depth: 0.42,
          bevelEnabled: true,
          bevelThickness: 0.05,
          bevelSize: 0.04,
          bevelSegments: 3,
        }),
      );
      icBodyGeo.rotateX(-Math.PI / 2);

      const icEpoxyMat = track(
        new THREE.MeshStandardMaterial({
          color: 0x1e2028,
          roughness: 0.68,
          metalness: 0.08,
        }),
      );
      const icMesh = new THREE.Mesh(icBodyGeo, icEpoxyMat);
      icMesh.position.y = 0.52;
      group.add(tagPart(icMesh, [0, 0.55, 0]));

      // 2. Top laser marking plate
      const topTex = track(createIcTopTexture(maxAnisotropy));
      const topGeo = track(new THREE.PlaneGeometry(1.54, 0.96));
      topGeo.rotateX(-Math.PI / 2);
      const topMat = track(
        new THREE.MeshStandardMaterial({
          map: topTex,
          roughness: 0.6,
          metalness: 0.08,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        }),
      );
      const topPlate = new THREE.Mesh(topGeo, topMat);
      topPlate.position.y = 0.995;
      group.add(tagPart(topPlate, [0, 0.72, 0]));

      // 3. Pin-1 Orientation Notch
      const notchGeo = track(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 20, 1, false, 0, Math.PI));
      const notchMat = track(
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 }),
      );
      const notch = new THREE.Mesh(notchGeo, notchMat);
      notch.position.set(-0.82, 0.94, 0);
      notch.rotation.y = Math.PI / 2;
      group.add(tagPart(notch, [-0.15, 0.6, 0]));

      // 4. 8 Metallic DIP Legs (4 per side)
      const legGeo = track(new THREE.BoxGeometry(0.11, 0.54, 0.05));
      const shoulderGeo = track(new THREE.BoxGeometry(0.17, 0.16, 0.12));
      const xPositions = [-0.6, -0.2, 0.2, 0.6];
      xPositions.forEach((x) => {
        [-1, 1].forEach((side) => {
          const pinGroup = new THREE.Group();
          const sh = new THREE.Mesh(shoulderGeo, brushedSteelMat);
          sh.position.set(x, 0.64, side * 0.57);
          const leg = new THREE.Mesh(legGeo, brushedSteelMat);
          leg.position.set(x, 0.34, side * 0.63);
          pinGroup.add(sh, leg);
          group.add(tagPart(pinGroup, [0, -0.25, side * 0.38]));
        });
      });

      // 5. Pin-3 Output Pulse LED glow dot
      const pulseGeo = track(new THREE.SphereGeometry(0.06, 12, 12));
      const pulseMat = track(
        new THREE.MeshBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0 }),
      );
      const pulseDot = new THREE.Mesh(pulseGeo, pulseMat);
      pulseDot.position.set(0.2, 1.05, 0.63);
      group.add(pulseDot);

      updateTest = (active, elapsed) => {
        if (active) {
          const squareWave = Math.sin(elapsed * 8) > 0 ? 1 : 0.15;
          pulseMat.opacity = squareWave;
        } else {
          pulseMat.opacity = 0;
        }
      };
      break;
    }

    case 'inductor': {
      // 1. Toroidal ferrite core
      const coreGeo = track(new THREE.TorusGeometry(0.74, 0.26, 24, 48));
      const ferriteMat = track(
        new THREE.MeshStandardMaterial({
          color: 0x27272a,
          roughness: 0.72,
          metalness: 0.25,
        }),
      );
      const coreMesh = new THREE.Mesh(coreGeo, ferriteMat);
      coreMesh.position.y = 1.24;
      group.add(tagPart(coreMesh, [0, 0.45, 0]));

      // 2. Procedural helical copper winding around the torus!
      const turns = 26;
      const totalPts = turns * 14;
      const helixPts: THREE.Vector3[] = [];
      const R = 0.74;
      const r = 0.3;
      const startAngle = -Math.PI * 0.32;
      const sweepAngle = Math.PI * 1.64;

      for (let i = 0; i <= totalPts; i++) {
        const u = i / totalPts;
        const theta = startAngle + u * sweepAngle;
        const phi = u * turns * Math.PI * 2;
        const ringR = R + r * Math.cos(phi);
        const x = ringR * Math.cos(theta);
        const y = 1.24 + ringR * Math.sin(theta);
        const z = r * Math.sin(phi);
        helixPts.push(new THREE.Vector3(x, y, z));
      }

      const coilCurve = new THREE.CatmullRomCurve3(helixPts);
      const coilGeo = track(new THREE.TubeGeometry(coilCurve, 420, 0.048, 8, false));
      const coilMesh = new THREE.Mesh(coilGeo, copperEnamelMat);
      group.add(tagPart(coilMesh, [0, 0.45, 0.45]));

      // 3. Terminal leads descending from coil ends
      const startPt = helixPts[0];
      const endPt = helixPts[helixPts.length - 1];
      [startPt, endPt].forEach((pt, idx) => {
        const lead = createWireLead(
          [
            pt.clone(),
            new THREE.Vector3(pt.x, 0.4, pt.z),
            new THREE.Vector3(idx === 0 ? -0.45 : 0.45, 0.03, 0),
          ],
          0.045,
          tinnedCopperMat,
        );
        track(lead.geometry);
        group.add(tagPart(lead, [idx === 0 ? -0.3 : 0.3, -0.35, 0]));
      });

      // 4. Magnetic flux ring inside toroid
      const fluxGeo = track(new THREE.TorusGeometry(0.74, 0.035, 12, 48));
      const fluxMat = track(
        new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0 }),
      );
      const fluxRing = new THREE.Mesh(fluxGeo, fluxMat);
      fluxRing.position.y = 1.24;
      group.add(fluxRing);

      updateTest = (active, elapsed) => {
        if (active) {
          fluxMat.opacity = 0.45 + Math.sin(elapsed * 5) * 0.35;
        } else {
          fluxMat.opacity = 0;
        }
      };
      break;
    }

    case 'potentiometer': {
      // 1. Phenolic green/brown wafer base
      const waferGeo = track(new THREE.CylinderGeometry(0.84, 0.84, 0.14, 36));
      const waferMat = track(
        new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.72, metalness: 0.05 }),
      );
      const wafer = new THREE.Mesh(waferGeo, waferMat);
      wafer.position.y = 0.62;
      group.add(tagPart(wafer, [0, -0.1, 0]));

      // 2. Metal dust-cover housing
      const housingGeo = track(new THREE.CylinderGeometry(0.76, 0.8, 0.46, 36));
      const housing = new THREE.Mesh(housingGeo, brushedSteelMat);
      housing.position.y = 0.92;
      group.add(tagPart(housing, [0, 0.22, 0]));

      // 3. Threaded mounting collar & hexagonal nut
      const bushingGeo = track(new THREE.CylinderGeometry(0.28, 0.28, 0.34, 24));
      const brassMat = track(
        new THREE.MeshStandardMaterial({ color: 0xd4a359, metalness: 0.88, roughness: 0.28 }),
      );
      const bushing = new THREE.Mesh(bushingGeo, brassMat);
      bushing.position.y = 1.32;
      group.add(tagPart(bushing, [0, 0.55, 0]));

      const nutGeo = track(new THREE.CylinderGeometry(0.4, 0.4, 0.11, 6));
      const nut = new THREE.Mesh(nutGeo, brushedSteelMat);
      nut.position.y = 1.28;
      group.add(tagPart(nut, [0, 0.68, 0]));

      // 4. Rotating knurled shaft with indicator slot
      const shaftGroup = new THREE.Group();
      shaftGroup.position.set(0, 1.82, 0);
      const shaftGeo = track(new THREE.CylinderGeometry(0.18, 0.18, 0.82, 24));
      const shaft = new THREE.Mesh(shaftGeo, brushedSteelMat);
      const slotGeo = track(new THREE.BoxGeometry(0.37, 0.18, 0.045));
      const slotMat = track(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 }));
      const slot = new THREE.Mesh(slotGeo, slotMat);
      slot.position.y = 0.35;
      shaftGroup.add(shaft, slot);
      group.add(tagPart(shaftGroup, [0, 1.02, 0]));

      // 5. 3 Front solder lug pins
      const lugGeo = track(new THREE.BoxGeometry(0.12, 0.56, 0.05));
      [-0.42, 0, 0.42].forEach((x, idx) => {
        const lug = new THREE.Mesh(lugGeo, tinnedCopperMat);
        lug.position.set(x, 0.32, 0.72);
        group.add(tagPart(lug, [(idx - 1) * 0.25, -0.35, 0.3]));
      });

      updateTest = (active, elapsed) => {
        if (active) {
          shaftGroup.rotation.y = Math.sin(elapsed * 2.2) * 2.1;
        } else {
          shaftGroup.rotation.y = THREE.MathUtils.lerp(shaftGroup.rotation.y, 0, 0.1);
        }
      };
      break;
    }

    case 'tactile_switch': {
      // 1. Molded square switch body
      const baseGeo = track(new THREE.BoxGeometry(1.45, 0.62, 1.45));
      const baseMat = track(
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.68, metalness: 0.08 }),
      );
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.y = 0.62;
      group.add(tagPart(baseMesh, [0, 0.1, 0]));

      // 2. Brushed metal crimped top retainer plate
      const plateGeo = track(new THREE.BoxGeometry(1.5, 0.09, 1.5));
      const plate = new THREE.Mesh(plateGeo, brushedSteelMat);
      plate.position.y = 0.96;
      group.add(tagPart(plate, [0, 0.42, 0]));

      // 4 Corner rivet dots on plate
      const rivetGeo = track(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16));
      [
        [-0.54, -0.54],
        [0.54, -0.54],
        [-0.54, 0.54],
        [0.54, 0.54],
      ].forEach(([rx, rz]) => {
        const riv = new THREE.Mesh(rivetGeo, baseMat);
        riv.position.set(rx, 1.0, rz);
        group.add(tagPart(riv, [rx * 0.3, 0.45, rz * 0.3]));
      });

      // 3. Cylindrical tactile plunger cap (animated press!)
      const plungerGeo = track(new THREE.CylinderGeometry(0.38, 0.4, 0.52, 28));
      const plungerMat = track(
        new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.35, metalness: 0.05 }),
      );
      const plunger = new THREE.Mesh(plungerGeo, plungerMat);
      plunger.position.y = 1.24;
      group.add(tagPart(plunger, [0, 0.9, 0]));

      // 4. 4 Bent gull-wing PCB pins
      const pinOffsets: Array<[number, number]> = [
        [-0.52, -0.82],
        [0.52, -0.82],
        [-0.52, 0.82],
        [0.52, 0.82],
      ];
      pinOffsets.forEach(([px, pz]) => {
        const sideZ = Math.sign(pz);
        const lead = createWireLead(
          [
            new THREE.Vector3(px, 0.56, sideZ * 0.68),
            new THREE.Vector3(px, 0.52, sideZ * 0.95),
            new THREE.Vector3(px, 0.16, sideZ * 0.95),
            new THREE.Vector3(px, 0.03, sideZ * 0.82),
          ],
          0.055,
          tinnedCopperMat,
        );
        track(lead.geometry);
        group.add(tagPart(lead, [px * 0.35, -0.25, sideZ * 0.35]));
      });

      updateTest = (active, elapsed) => {
        const baseY = plunger.userData.basePos ? (plunger.userData.basePos as THREE.Vector3).y : 1.24;
        if (active) {
          const pressDepth = Math.max(0, Math.sin(elapsed * 6.5)) * 0.18;
          plunger.position.y = baseY - pressDepth;
        } else {
          plunger.position.y = THREE.MathUtils.lerp(plunger.position.y, baseY, 0.2);
        }
      };
      break;
    }
  }

  groundGroupAtZero(group);

  return {
    group,
    updateTest,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
