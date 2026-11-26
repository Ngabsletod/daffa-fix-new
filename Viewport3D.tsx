import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { ChevronDown, ChevronUp, Layers, Play, RotateCcw, RotateCw, Square } from 'lucide-react';
import { COMPONENT_MAP, ComponentId } from './componentsData';
import { buildComponent3D, BuiltComponent3D } from './componentModels';
import { createContactShadowTexture, createTurntableTexture } from './proceduralTextures';
import { soundEngine } from './soundEngine';
import { SchematicSymbol } from './SchematicSymbol';

export type FeedbackPulse = {
  type: 'success' | 'error';
  seq: number;
} | null;

interface Viewport3DProps {
  componentId: ComponentId;
  hideLabel?: boolean;
  customBadge?: string;
  feedbackPulse?: FeedbackPulse;
  externalTestActive?: boolean;
  onToggleTest?: (next: boolean) => void;
  className?: string;
}

// Reusable scratch math objects (zero GC inside animation loop)
const _vec3 = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  componentId,
  hideLabel = false,
  customBadge,
  feedbackPulse = null,
  externalTestActive,
  onToggleTest,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [explodedAmount, setExplodedAmount] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [internalTestActive, setInternalTestActive] = useState(false);
  const [hudCollapsed, setHudCollapsed] = useState(false);
  const [webglError, setWebglError] = useState(false);

  const testActive = externalTestActive ?? internalTestActive;

  // Mutable refs read inside single-init WebGL loop so React updates never tear down the canvas
  const explodedTargetRef = useRef(0);
  const explodedCurrentRef = useRef(0);
  const autoRotateRef = useRef(true);
  const testActiveRef = useRef(false);
  const resetCamTriggerRef = useRef(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const pedestalAnchorRef = useRef<THREE.Group | null>(null);
  const builtRef = useRef<BuiltComponent3D | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const isSoftwareGlRef = useRef<boolean>(false);

  // Celebratory / error animation state
  const animStateRef = useRef({
    entryScale: 0.25,
    spinBoost: 0,
    shakeTime: 0,
    burstLife: 0,
  });

  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);

  useEffect(() => {
    explodedTargetRef.current = explodedAmount;
  }, [explodedAmount]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    testActiveRef.current = testActive;
  }, [testActive]);

  // Trigger success / error animation in 3D when feedbackPulse updates
  useEffect(() => {
    if (!feedbackPulse) return;
    if (feedbackPulse.type === 'success') {
      animStateRef.current.spinBoost = 1.0;
      animStateRef.current.burstLife = 1.0;
    } else {
      animStateRef.current.shakeTime = 0.55;
    }
  }, [feedbackPulse]);

  // Keyboard shortcut 'H' to collapse/expand bottom dock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.key === 'h' || e.key === 'H') &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        setHudCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Initialize Three.js once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    const isSoftwareGl = detectSoftwareWebGL();
    isSoftwareGlRef.current = isSoftwareGl;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError(true);
      return;
    }

    rendererRef.current = renderer;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 320);
    renderer.setSize(width, height);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    const onContextRestored = () => {
      setWebglError(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1120);
    scene.fog = new THREE.FogExp2(0x0b1120, 0.042);
    sceneRef.current = scene;

    // Procedural Studio Reflection Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 80);
    camera.position.set(3.8, 3.0, 4.4);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.05, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.6;
    controls.maxDistance = 9.5;
    controls.minPolarAngle = 0.15;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.enablePan = false;

    // 3-Point Warm/Cool Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 0.65);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1d6, 2.2);
    keyLight.position.set(4.5, 7.5, 4.2);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.camera.left = -3.2;
    keyLight.shadow.camera.right = 3.2;
    keyLight.shadow.camera.top = 3.2;
    keyLight.shadow.camera.bottom = -3.2;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    rimLight.position.set(-4.2, 3.8, -4.5);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softbox = new THREE.RectAreaLight(0xe0f2fe, 2.4, 4.5, 2.2);
      softbox.position.set(-3.8, 3.6, 2.8);
      softbox.lookAt(0, 1.0, 0);
      scene.add(softbox);
    }

    // Workbench Floor Plane
    const floorGeo = new THREE.CircleGeometry(18, 64);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0d1526,
      roughness: 0.88,
      metalness: 0.12,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -0.34;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Precision ESD PCB Inspection Turntable Pedestal (bottom at y=-0.34, top surface at y=0)
    const turntableGroup = new THREE.Group();
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const turntableTex = createTurntableTexture(maxAniso);

    const plinthBaseGeo = new THREE.CylinderGeometry(2.38, 2.52, 0.24, 64);
    const plinthBaseMat = new THREE.MeshStandardMaterial({
      color: 0x162032,
      roughness: 0.45,
      metalness: 0.65,
    });
    const plinthBase = new THREE.Mesh(plinthBaseGeo, plinthBaseMat);
    plinthBase.position.y = -0.22;
    plinthBase.receiveShadow = true;
    turntableGroup.add(plinthBase);

    const brassTrimGeo = new THREE.TorusGeometry(2.36, 0.025, 16, 72);
    brassTrimGeo.rotateX(Math.PI / 2);
    const brassTrimMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.25,
      roughness: 0.28,
      metalness: 0.8,
    });
    const brassTrim = new THREE.Mesh(brassTrimGeo, brassTrimMat);
    brassTrim.position.y = -0.095;
    turntableGroup.add(brassTrim);

    const platterGeo = new THREE.CylinderGeometry(2.28, 2.34, 0.1, 64);
    const platterMat = new THREE.MeshStandardMaterial({
      map: turntableTex,
      roughness: 0.42,
      metalness: 0.15,
    });
    const platter = new THREE.Mesh(platterGeo, [plinthBaseMat, platterMat, plinthBaseMat]);
    platter.position.y = -0.05;
    platter.receiveShadow = true;
    turntableGroup.add(platter);

    // Soft radial contact shadow plane right at y = 0.004
    const shadowTex = createContactShadowTexture();
    const shadowPlaneGeo = new THREE.PlaneGeometry(3.4, 3.4);
    shadowPlaneGeo.rotateX(-Math.PI / 2);
    const shadowPlaneMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.52,
    });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.position.y = 0.004;
    turntableGroup.add(shadowPlane);

    scene.add(turntableGroup);

    // Anchor group where active 3D component is mounted
    const anchor = new THREE.Group();
    scene.add(anchor);
    pedestalAnchorRef.current = anchor;

    // 3D Celebration Spark Particles (pooled InstancedMesh, zero allocations in loop)
    const particleCount = 24;
    const sparkGeo = new THREE.OctahedronGeometry(0.055, 0);
    const sparkMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0,
    });
    const sparkMesh = new THREE.InstancedMesh(sparkGeo, sparkMat, particleCount);
    sparkMesh.frustumCulled = false;
    const sparkVelocities = Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 1.6 + (i % 3) * 0.7;
      return new THREE.Vector3(
        Math.cos(angle) * speed,
        1.8 + (i % 4) * 0.6,
        Math.sin(angle) * speed,
      );
    });
    const dummy = new THREE.Object3D();
    scene.add(sparkMesh);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // ResizeObserver for responsive split/full containers
    const handleResize = () => {
      if (!container) return;
      const w = Math.max(container.clientWidth, 100);
      const h = Math.max(container.clientHeight, 100);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Animation loop with Software WebGL afterDraw pacing
    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || !gl.fenceSync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.08);
      const elapsed = clock.elapsedTime;
      const anim = animStateRef.current;

      // Reset camera smoothly if triggered
      if (resetCamTriggerRef.current) {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, 3.8, 7, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, 3.0, 7, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, 4.4, 7, delta);
        controls.target.set(0, 1.05, 0);
        if (camera.position.distanceTo(_vec3.set(3.8, 3.0, 4.4)) < 0.05) {
          resetCamTriggerRef.current = false;
        }
      }

      // Smooth component pop-in scale
      anim.entryScale = THREE.MathUtils.damp(anim.entryScale, 1.0, 9, delta);
      anchor.scale.setScalar(anim.entryScale);

      // Gentle turntable rotation + celebratory spin boost
      if (anim.spinBoost > 0.01) {
        anchor.rotation.y += delta * (4.5 * anim.spinBoost);
        anim.spinBoost = THREE.MathUtils.damp(anim.spinBoost, 0, 3.5, delta);
      } else if (autoRotateRef.current) {
        anchor.rotation.y += delta * 0.42;
      }

      // Error damped horizontal shake
      if (anim.shakeTime > 0) {
        anim.shakeTime = Math.max(0, anim.shakeTime - delta);
        anchor.position.x = Math.sin(elapsed * 45) * 0.14 * (anim.shakeTime / 0.55);
        rimLight.color.setHex(0xef4444);
        rimLight.intensity = 2.6;
      } else {
        anchor.position.x = THREE.MathUtils.damp(anchor.position.x, 0, 12, delta);
        if (anim.burstLife > 0.05) {
          rimLight.color.setHex(0x10b981);
          rimLight.intensity = 2.4;
        } else {
          rimLight.color.setHex(0x38bdf8);
          rimLight.intensity = 1.4;
        }
      }

      // Smooth Exploded View interpolation
      explodedCurrentRef.current = THREE.MathUtils.damp(
        explodedCurrentRef.current,
        explodedTargetRef.current,
        8,
        delta,
      );

      if (builtRef.current) {
        const exp = explodedCurrentRef.current;
        builtRef.current.group.children.forEach((child) => {
          const base = child.userData.basePos as THREE.Vector3 | undefined;
          const vec = child.userData.explodeVec as THREE.Vector3 | undefined;
          if (base && vec) {
            child.position.set(
              base.x + vec.x * exp,
              base.y + vec.y * exp,
              base.z + vec.z * exp,
            );
          }
        });
        builtRef.current.updateTest(testActiveRef.current, elapsed);
      }

      // Celebratory 3D sparks
      if (anim.burstLife > 0.005) {
        const age = 1 - anim.burstLife;
        sparkMat.opacity = anim.burstLife;
        for (let i = 0; i < particleCount; i++) {
          const v = sparkVelocities[i];
          dummy.position.set(
            v.x * age,
            0.8 + v.y * age - 2.4 * age * age,
            v.z * age,
          );
          dummy.rotation.set(elapsed * 4 + i, elapsed * 3, 0);
          dummy.scale.setScalar(anim.burstLife);
          dummy.updateMatrix();
          sparkMesh.setMatrixAt(i, dummy.matrix);
        }
        sparkMesh.instanceMatrix.needsUpdate = true;
        anim.burstLife = Math.max(0, anim.burstLife - delta * 1.15);
      } else {
        sparkMat.opacity = 0;
        sparkMesh.visible = false;
      }
      if (anim.burstLife > 0.005) sparkMesh.visible = true;

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    if (isSoftwareGl) {
      renderer.render(scene, camera);
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      if (builtRef.current) {
        anchor.remove(builtRef.current.group);
        builtRef.current.dispose();
        builtRef.current = null;
      }

      floorGeo.dispose();
      floorMat.dispose();
      plinthBaseGeo.dispose();
      plinthBaseMat.dispose();
      brassTrimGeo.dispose();
      brassTrimMat.dispose();
      platterGeo.dispose();
      platterMat.dispose();
      turntableTex.dispose();
      shadowPlaneGeo.dispose();
      shadowPlaneMat.dispose();
      shadowTex.dispose();
      sparkGeo.dispose();
      sparkMat.dispose();
      envTex.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Swap 3D component whenever componentId changes without rebuilding WebGL context
  useEffect(() => {
    const anchor = pedestalAnchorRef.current;
    const renderer = rendererRef.current;
    if (!anchor || !renderer) return;

    if (builtRef.current) {
      anchor.remove(builtRef.current.group);
      builtRef.current.dispose();
      builtRef.current = null;
    }

    const built = buildComponent3D(
      componentId,
      renderer.capabilities.getMaxAnisotropy(),
      isSoftwareGlRef.current,
    );
    builtRef.current = built;
    anchor.add(built.group);
    animStateRef.current.entryScale = 0.45;
  }, [componentId]);

  const info = COMPONENT_MAP[componentId];

  const handleToggleTest = () => {
    const next = !testActive;
    soundEngine.playPowerTest(next);
    if (onToggleTest) {
      onToggleTest(next);
    } else {
      setInternalTestActive(next);
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[380px] overflow-hidden rounded-xl border border-slate-800 bg-[#0B1120] ${className}`}>
      {/* Dedicated Isolated WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* WebGL Fallback Card if hardware/driver unavailable */}
      {webglError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0B1120] p-6 text-center">
          <div className="mb-3 rounded-lg border border-slate-800 bg-slate-900 p-4 text-sky-400">
            <SchematicSymbol id={componentId} className="h-16 w-24" />
          </div>
          <p className="text-sm font-semibold text-slate-200">
            {hideLabel ? 'Pratinjau Komponen' : info.name}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Mode pratinjau skematik aktif karena konteks WebGL sedang tidak tersedia.
          </p>
        </div>
      )}

      {/* Minimal Top-Left Specification Overlay (No pill boxes, unboxed typography) */}
      <div className="pointer-events-none absolute top-4 left-4 right-4 z-10 flex items-start justify-between gap-4">
        <div className="rounded-lg border border-slate-800/90 bg-slate-950/90 px-3.5 py-2.5">
          {hideLabel ? (
            <div>
              <p className="text-sm font-semibold text-slate-100">
                {customBadge || 'Objek Misteri 3D'}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Putar 360° dan perbesar untuk mengamati kaki, pita warna, atau bentuk fisik
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{info.category}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tech text-sky-400">{info.symbolCode}</span>
              </div>
              <h3 className="mt-0.5 text-base font-semibold text-slate-100">{info.name}</h3>
              <p className="font-mono-tech mt-0.5 text-xs text-slate-400">{info.typicalSpec}</p>
            </div>
          )}
        </div>

        <div className="hidden sm:block rounded-lg border border-slate-800/90 bg-slate-950/90 px-3 py-2 text-right">
          <p className="text-xs text-slate-400">Seret untuk memutar · Gulir untuk zoom</p>
        </div>
      </div>

      {/* Collapsible Unified Bottom Control Dock */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 flex w-[94%] max-w-[680px] -translate-x-1/2 flex-col items-center">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            setHudCollapsed((c) => !c);
          }}
          className="pointer-events-auto mb-1.5 inline-flex items-center gap-1.5 rounded-t-lg border border-b-0 border-slate-700/90 bg-slate-900/95 px-3 py-1 text-xs font-medium text-slate-300 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400 whitespace-nowrap shrink-0"
          title="Tekan H untuk menyembunyikan/menampilkan kontrol"
        >
          {hudCollapsed ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              <span>Tampilkan Kontrol 3D</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              <span>Sembunyikan Kontrol</span>
            </>
          )}
        </button>

        {!hudCollapsed && (
          <div className="pointer-events-auto flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700/90 bg-slate-900/95 px-3.5 py-2.5 shadow-xl">
            {/* Exploded View Slider */}
            <label className="flex min-w-[175px] flex-1 items-center gap-2.5">
              <Layers className="h-4 w-4 shrink-0 text-sky-400" />
              <span className="text-xs font-medium text-slate-300 whitespace-nowrap shrink-0">
                Urai Bagian
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={explodedAmount}
                onChange={(e) => setExplodedAmount(parseFloat(e.target.value))}
                className="lab-slider w-full max-w-[130px]"
                aria-label="Urai Bagian 3D"
              />
              <span className="font-mono-tech w-9 text-right text-xs text-slate-400">
                {Math.round(explodedAmount * 100)}%
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-2">
              {/* Interactive Component Power/Action Test */}
              <button
                type="button"
                onClick={handleToggleTest}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-sky-400 ${
                  testActive
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {testActive ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span>{testActive ? 'Hentikan Uji' : 'Uji Aksi 3D'}</span>
              </button>

              {/* Auto-Rotate Toggle */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setAutoRotate((r) => !r);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-sky-400 ${
                  autoRotate
                    ? 'border border-sky-500/40 bg-sky-500/15 text-sky-300'
                    : 'border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Putar</span>
              </button>

              {/* Reset Camera */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  resetCamTriggerRef.current = true;
                  setExplodedAmount(0);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-sky-400"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
