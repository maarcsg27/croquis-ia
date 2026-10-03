"use client";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  RotateCcw,
  Eye,
  Camera,
  Maximize,
  Compass,
  Layers,
  Sparkles,
  Sun,
  Maximize2,
  Minimize2,
} from "lucide-react";
import type { FixedItem, FurnitureItem, ProjectData, Pt, Shape } from "@/lib/types";
import { catalogFor, isOpening } from "@/lib/catalog";
import {
  bbox,
  chordLength,
  fixedFrame,
  segCount,
  segEnds,
  shapePolygon,
  sub,
  norm,
} from "@/lib/geometry";

type Props = {
  data: ProjectData;
  furniture?: FurnitureItem[];
  selectedId?: string | null;
  onClose?: () => void;
};

export function Plan3DViewer({ data, furniture = [], selectedId, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const [cameraMode, setCameraMode] = useState<"orbit" | "inside" | "top">("orbit");
  const [wallCut, setWallCut] = useState(false); // Vista seccionada (dollhouse con paredes bajas)

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 1. Scene, Camera, Renderer ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);
    sceneRef.current = scene;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // --- 2. OrbitControls (360° Rotation) ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // No bajar por debajo del suelo
    controls.minDistance = 0.5;
    controls.maxDistance = 25;
    controlsRef.current = controls;

    // --- 3. Luces realistas de interior ---
    const ambientLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.2);
    sunLight.position.set(5, 8, 4);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 25;
    sunLight.shadow.camera.left = -6;
    sunLight.shadow.camera.right = 6;
    sunLight.shadow.camera.top = 6;
    sunLight.shadow.camera.bottom = -6;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const softFill = new THREE.DirectionalLight(0xe0e7ff, 0.4);
    softFill.position.set(-5, 4, -4);
    scene.add(softFill);

    // --- 4. Materiales ---
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.85,
      metalness: 0.05,
    });
    const wallInnerMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
    });
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xe2d9cc, // Parquet cálido / madera clara
      roughness: 0.5,
      metalness: 0.05,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      transmission: 0.9,
      thickness: 0.02,
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x8b5a2b,
      roughness: 0.6,
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
    });

    // --- 5. Cálculo del centro y escala de la estancia ---
    const allPts = data.shapes.flatMap((s) => s.points);
    const b = bbox(allPts);
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;

    // Convertidor: punto 2D (cm) -> punto 3D centrado en metros
    const to3D = (p: Pt) => ({
      x: (p.x - cx) / 100,
      z: (p.y - cy) / 100,
    });

    const roomH = (data.wallHeight || 250) / 100; // altura en metros (ej 2.5m)
    const activeWallH = wallCut ? Math.min(roomH, 1.1) : roomH;
    const wallThick = (data.wallThickness || 15) / 100;

    // --- 6. Suelo (Plano / Polígono) ---
    const closedShapes = data.shapes.filter((s) => s.closed);
    if (closedShapes.length > 0) {
      const mainPoly = shapePolygon(closedShapes[0]);
      if (mainPoly.length >= 3) {
        const floorShape = new THREE.Shape();
        const p0 = to3D(mainPoly[0]);
        floorShape.moveTo(p0.x, -p0.z);
        for (let i = 1; i < mainPoly.length; i++) {
          const pi = to3D(mainPoly[i]);
          floorShape.lineTo(pi.x, -pi.z);
        }
        floorShape.closePath();

        const floorGeo = new THREE.ShapeGeometry(floorShape);
        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.position.y = 0;
        floorMesh.receiveShadow = true;
        scene.add(floorMesh);

        // Rodapié perimetral
        const edgePoints = mainPoly.map((p) => {
          const pt3 = to3D(p);
          return new THREE.Vector3(pt3.x, 0.04, pt3.z);
        });
        edgePoints.push(edgePoints[0]); // cerrar
        const baseboardGeo = new THREE.BufferGeometry().setFromPoints(edgePoints);
        const baseboardLine = new THREE.Line(
          baseboardGeo,
          new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 })
        );
        scene.add(baseboardLine);
      }
    }

    // Suelo infinito exterior suave
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 1 });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.01;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Cuadrícula exterior sutil
    const grid = new THREE.GridHelper(30, 30, 0xcfd4e2, 0xe2e8f0);
    grid.position.y = -0.005;
    scene.add(grid);

    // --- 7. Paredes 3D ---
    data.shapes.forEach((s) => {
      for (let i = 0; i < segCount(s); i++) {
        const [p1, p2] = segEnds(s, i);
        const a = to3D(p1);
        const b3 = to3D(p2);

        const dx = b3.x - a.x;
        const dz = b3.z - a.z;
        const len = Math.hypot(dx, dz);
        const angle = Math.atan2(dz, dx);
        const mx = (a.x + b3.x) / 2;
        const mz = (a.z + b3.z) / 2;

        // Elementos fijos sobre este tramo de pared (puertas / ventanas)
        const wallOpenings = data.fixed.filter(
          (f) => f.shapeId === s.id && f.seg === i && isOpening(f.kind)
        );

        if (wallOpenings.length === 0 || wallCut) {
          // Pared lisa completa
          const wallGeo = new THREE.BoxGeometry(len, activeWallH, wallThick);
          const wallMesh = new THREE.Mesh(wallGeo, wallMat);
          wallMesh.position.set(mx, activeWallH / 2, mz);
          wallMesh.rotation.y = -angle;
          wallMesh.castShadow = true;
          wallMesh.receiveShadow = true;
          scene.add(wallMesh);
        } else {
          // Pared con huecos para puertas y ventanas
          const open = wallOpenings[0];
          const openW = (open.w || 80) / 100;
          const openT = open.t ?? 0.5;
          const openDist = len * openT; // distancia desde el inicio de la pared

          const leftW = Math.max(0.05, openDist - openW / 2);
          const rightW = Math.max(0.05, len - (openDist + openW / 2));

          // Tramo izquierdo
          if (leftW > 0.05) {
            const leftGeo = new THREE.BoxGeometry(leftW, activeWallH, wallThick);
            const leftMesh = new THREE.Mesh(leftGeo, wallMat);
            const leftMx = a.x + Math.cos(angle) * (leftW / 2);
            const leftMz = a.z + Math.sin(angle) * (leftW / 2);
            leftMesh.position.set(leftMx, activeWallH / 2, leftMz);
            leftMesh.rotation.y = -angle;
            leftMesh.castShadow = true;
            leftMesh.receiveShadow = true;
            scene.add(leftMesh);
          }

          // Tramo derecho
          if (rightW > 0.05) {
            const rightGeo = new THREE.BoxGeometry(rightW, activeWallH, wallThick);
            const rightMesh = new THREE.Mesh(rightGeo, wallMat);
            const rightMx = b3.x - Math.cos(angle) * (rightW / 2);
            const rightMz = b3.z - Math.sin(angle) * (rightW / 2);
            rightMesh.position.set(rightMx, activeWallH / 2, rightMz);
            rightMesh.rotation.y = -angle;
            rightMesh.castShadow = true;
            rightMesh.receiveShadow = true;
            scene.add(rightMesh);
          }

          // Dintel superior (sobre puerta o ventana)
          const isDoor = open.kind === "door" || open.kind === "double_door" || open.kind === "sliding_door";
          const openingTopH = isDoor ? 2.1 : 2.1;
          const lintelH = Math.max(0.05, activeWallH - openingTopH);

          if (lintelH > 0.05) {
            const lintelGeo = new THREE.BoxGeometry(openW, lintelH, wallThick);
            const lintelMesh = new THREE.Mesh(lintelGeo, wallMat);
            const openMx = a.x + Math.cos(angle) * openDist;
            const openMz = a.z + Math.sin(angle) * openDist;
            lintelMesh.position.set(openMx, openingTopH + lintelH / 2, openMz);
            lintelMesh.rotation.y = -angle;
            lintelMesh.castShadow = true;
            scene.add(lintelMesh);
          }

          // Antepecho inferior (bajo la ventana)
          if (!isDoor) {
            const sillH = 0.9; // 90 cm de antepecho
            const sillGeo = new THREE.BoxGeometry(openW, sillH, wallThick);
            const sillMesh = new THREE.Mesh(sillGeo, wallMat);
            const openMx = a.x + Math.cos(angle) * openDist;
            const openMz = a.z + Math.sin(angle) * openDist;
            sillMesh.position.set(openMx, sillH / 2, openMz);
            sillMesh.rotation.y = -angle;
            sillMesh.castShadow = true;
            scene.add(sillMesh);

            // Cristal de la ventana
            const glassH = openingTopH - sillH;
            const windowGlass = new THREE.Mesh(
              new THREE.BoxGeometry(openW - 0.04, glassH - 0.04, 0.02),
              glassMat
            );
            windowGlass.position.set(openMx, sillH + glassH / 2, openMz);
            windowGlass.rotation.y = -angle;
            scene.add(windowGlass);
          }
        }
      }
    });

    // --- 8. Elementos Fijos 3D ---
    data.fixed.forEach((f) => {
      const fr = fixedFrame(f, data.shapes);
      const pos = to3D(fr.c);
      const rotY = -(fr.rot * Math.PI) / 180;
      const fw = (f.w || 60) / 100;
      const fd = (f.d || 40) / 100;

      const group = new THREE.Group();
      group.position.set(pos.x, 0, pos.z);
      group.rotation.y = rotY;

      switch (f.kind) {
        case "door":
        case "double_door": {
          // Hoja de puerta abierta a 75°
          const leafH = 2.05;
          const leafW = f.kind === "double_door" ? fw / 2 : fw;
          const leafGeo = new THREE.BoxGeometry(leafW, leafH, 0.04);
          const leafMesh = new THREE.Mesh(
            leafGeo,
            new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.7 })
          );
          leafMesh.position.set(leafW / 2, leafH / 2, 0);
          leafMesh.castShadow = true;

          const hingeGroup = new THREE.Group();
          hingeGroup.position.set(-fw / 2, 0, 0);
          hingeGroup.rotation.y = (f.side === -1 ? -1 : 1) * (Math.PI / 2.5);
          hingeGroup.add(leafMesh);
          group.add(hingeGroup);
          break;
        }

        case "radiator": {
          const radH = 0.6;
          const radMesh = new THREE.Mesh(
            new THREE.BoxGeometry(fw, radH, fd),
            new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.4 })
          );
          radMesh.position.set(0, radH / 2 + 0.15, (f.side === 1 ? 1 : -1) * (wallThick / 2 + fd / 2));
          radMesh.castShadow = true;
          group.add(radMesh);
          break;
        }

        case "fireplace": {
          const fireH = 1.0;
          const mantel = new THREE.Mesh(new THREE.BoxGeometry(fw, fireH, fd), woodMat);
          mantel.position.set(0, fireH / 2, 0);
          mantel.castShadow = true;
          group.add(mantel);

          // Hueco del fuego
          const chamber = new THREE.Mesh(
            new THREE.BoxGeometry(fw * 0.6, fireH * 0.6, fd * 0.7),
            new THREE.MeshBasicMaterial({ color: 0x1e1b18 })
          );
          chamber.position.set(0, fireH * 0.35, fd * 0.2);
          group.add(chamber);
          break;
        }

        case "wardrobe": {
          const wardH = Math.min(roomH - 0.1, 2.3);
          const wardMesh = new THREE.Mesh(
            new THREE.BoxGeometry(fw, wardH, fd),
            new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.6 })
          );
          wardMesh.position.set(0, wardH / 2, 0);
          wardMesh.castShadow = true;
          group.add(wardMesh);
          break;
        }

        case "column": {
          const colMesh = new THREE.Mesh(
            new THREE.BoxGeometry(fw, activeWallH, fd),
            new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 })
          );
          colMesh.position.set(0, activeWallH / 2, 0);
          colMesh.castShadow = true;
          group.add(colMesh);
          break;
        }

        case "kitchen": {
          const baseH = 0.9;
          const baseMesh = new THREE.Mesh(
            new THREE.BoxGeometry(fw, baseH, fd),
            new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 })
          );
          baseMesh.position.set(0, baseH / 2, 0);
          baseMesh.castShadow = true;
          group.add(baseMesh);

          // Encimera
          const topMesh = new THREE.Mesh(
            new THREE.BoxGeometry(fw + 0.04, 0.04, fd + 0.04),
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
          );
          topMesh.position.set(0, baseH + 0.02, 0);
          group.add(topMesh);
          break;
        }

        default:
          break;
      }

      scene.add(group);
    });

    // --- 9. Mobiliario 3D ---
    furniture.forEach((item) => {
      const pos = to3D({ x: item.x, y: item.y });
      const rotY = -(item.rot * Math.PI) / 180;
      const fw = (item.w || 80) / 100;
      const fd = (item.d || 80) / 100;

      const group = new THREE.Group();
      group.position.set(pos.x, 0, pos.z);
      group.rotation.y = rotY;

      const itemColor =
        item.color && /^#/.test(item.color) ? parseInt(item.color.slice(1), 16) : 0x64748b;
      const furnMat = new THREE.MeshStandardMaterial({
        color: itemColor,
        roughness: 0.7,
      });

      switch (item.category) {
        case "sofa":
        case "armchair": {
          const seatH = 0.45;
          const backH = 0.85;
          const seatMesh = new THREE.Mesh(new THREE.BoxGeometry(fw, seatH, fd), furnMat);
          seatMesh.position.set(0, seatH / 2, 0);
          seatMesh.castShadow = true;
          group.add(seatMesh);

          const backMesh = new THREE.Mesh(new THREE.BoxGeometry(fw, backH - seatH, fd * 0.25), furnMat);
          backMesh.position.set(0, seatH + (backH - seatH) / 2, -fd * 0.375);
          backMesh.castShadow = true;
          group.add(backMesh);
          break;
        }

        case "bed": {
          const bedH = 0.55;
          const headH = 1.0;
          const bedMesh = new THREE.Mesh(
            new THREE.BoxGeometry(fw, bedH, fd),
            new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 })
          );
          bedMesh.position.set(0, bedH / 2, 0);
          bedMesh.castShadow = true;
          group.add(bedMesh);

          const headMesh = new THREE.Mesh(new THREE.BoxGeometry(fw, headH, 0.1), furnMat);
          headMesh.position.set(0, headH / 2, -fd / 2 + 0.05);
          headMesh.castShadow = true;
          group.add(headMesh);
          break;
        }

        case "table":
        case "desk": {
          const tableH = 0.75;
          const top = new THREE.Mesh(new THREE.BoxGeometry(fw, 0.04, fd), furnMat);
          top.position.set(0, tableH, 0);
          top.castShadow = true;
          group.add(top);

          // 4 patas
          const legGeo = new THREE.CylinderGeometry(0.02, 0.02, tableH);
          const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5 });
          [
            [-fw / 2 + 0.05, -fd / 2 + 0.05],
            [fw / 2 - 0.05, -fd / 2 + 0.05],
            [-fw / 2 + 0.05, fd / 2 - 0.05],
            [fw / 2 - 0.05, fd / 2 - 0.05],
          ].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(lx, tableH / 2, lz);
            leg.castShadow = true;
            group.add(leg);
          });
          break;
        }

        case "tv": {
          const tvW = fw;
          const tvH = fw * 0.58;
          const tvMesh = new THREE.Mesh(
            new THREE.BoxGeometry(tvW, tvH, 0.04),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 })
          );
          tvMesh.position.set(0, 1.1, 0);
          group.add(tvMesh);
          break;
        }

        case "rug": {
          const rugMesh = new THREE.Mesh(
            new THREE.BoxGeometry(fw, 0.01, fd),
            new THREE.MeshStandardMaterial({ color: itemColor, roughness: 1.0 })
          );
          rugMesh.position.set(0, 0.005, 0);
          rugMesh.receiveShadow = true;
          group.add(rugMesh);
          break;
        }

        case "plant": {
          const potH = 0.4;
          const potMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.12, potH),
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
          );
          potMesh.position.set(0, potH / 2, 0);
          potMesh.castShadow = true;
          group.add(potMesh);

          const leaves = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 })
          );
          leaves.position.set(0, potH + 0.25, 0);
          leaves.castShadow = true;
          group.add(leaves);
          break;
        }

        default: {
          const defH = 0.6;
          const box = new THREE.Mesh(new THREE.BoxGeometry(fw, defH, fd), furnMat);
          box.position.set(0, defH / 2, 0);
          box.castShadow = true;
          group.add(box);
          break;
        }
      }

      scene.add(group);
    });

    // --- 10. Posición inicial de cámara (360° órbita o interior) ---
    const maxDim = Math.max((b.maxX - b.minX) / 100, (b.maxY - b.minY) / 100, 4);

    if (cameraMode === "inside") {
      camera.position.set(0, 1.6, 0.2);
      controls.target.set(0, 1.6, -1);
    } else if (cameraMode === "top") {
      camera.position.set(0, maxDim * 2.2, 0.01);
      controls.target.set(0, 0, 0);
    } else {
      // Órbita isométrica 360° (Dollhouse)
      camera.position.set(maxDim * 1.3, maxDim * 1.1, maxDim * 1.4);
      controls.target.set(0, roomH * 0.4, 0);
    }
    controls.update();

    // --- 11. Loop de animación ---
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // --- 12. Resize observer ---
    const ro = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      renderer.dispose();
    };
  }, [data, furniture, cameraMode, wallCut]);

  const takeSnapshot = () => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "vista-3d-360-roomia.png";
    a.click();
  };

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden select-none">
      {/* Contenedor WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Barra de herramientas flotante superior */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg pointer-events-auto">
          <span className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Compass className="w-4 h-4 text-indigo-400 animate-spin-slow" />
            <span>Vista 3D Interactiva 360°</span>
          </span>
          <div className="h-4 w-px bg-white/20 mx-1" />
          <span className="text-[11px] text-slate-300 hidden sm:inline">
            Arrastra para rotar en 360° · Rueda para zoom
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-lg pointer-events-auto">
          {/* Modos de cámara */}
          <button
            type="button"
            onClick={() => setCameraMode("orbit")}
            title="Vista Exterior 360° (Dollhouse)"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              cameraMode === "orbit"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">360° Exterior</span>
          </button>

          <button
            type="button"
            onClick={() => setCameraMode("inside")}
            title="Vista Interior 360° (Dentro de la habitación)"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              cameraMode === "inside"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">360° Interior</span>
          </button>

          <button
            type="button"
            onClick={() => setCameraMode("top")}
            title="Vista Cenital (Plano 3D)"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              cameraMode === "top"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cenital</span>
          </button>

          <div className="h-4 w-px bg-white/20 mx-0.5" />

          {/* Paredes seccionadas */}
          <button
            type="button"
            onClick={() => setWallCut((c) => !c)}
            title="Paredes bajas / Maqueta seccionada"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
              wallCut
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            Paredes {wallCut ? "Bajas" : "Completas"}
          </button>

          {/* Captura */}
          <button
            type="button"
            onClick={takeSnapshot}
            title="Descargar foto 3D"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Indicador de ayuda en la esquina inferior izquierda */}
      <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-white text-[11px] space-y-0.5 pointer-events-none shadow-lg hidden sm:block">
        <div className="font-semibold text-indigo-400">Controles 360°:</div>
        <div className="text-slate-300">
          • <b>Clic izquierdo + arrastrar:</b> Rotar 360° en cualquier ángulo
        </div>
        <div className="text-slate-300">
          • <b>Clic derecho + arrastrar:</b> Desplazar cámara (Pan)
        </div>
        <div className="text-slate-300">
          • <b>Rueda del ratón:</b> Acercar / Alejar zoom
        </div>
      </div>
    </div>
  );
}
