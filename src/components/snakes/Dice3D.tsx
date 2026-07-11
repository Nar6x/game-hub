"use client";

import { useRef, useEffect, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const DOT_COLOR = "#10b981";
const FACE_COLOR = "#374151";
const FACE_SIZE = 256;
const DOT_RADIUS = 28;
const CORNER_RADIUS = 24;

const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-0.32, -0.32], [0.32, 0.32]],
  3: [[-0.32, -0.32], [0, 0], [0.32, 0.32]],
  4: [[-0.32, -0.32], [0.32, -0.32], [-0.32, 0.32], [0.32, 0.32]],
  5: [[-0.32, -0.32], [0.32, -0.32], [0, 0], [-0.32, 0.32], [0.32, 0.32]],
  6: [[-0.32, -0.32], [0.32, -0.32], [-0.32, 0], [0.32, 0], [-0.32, 0.32], [0.32, 0.32]],
};

function createFaceTexture(value: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = FACE_SIZE;
  canvas.height = FACE_SIZE;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = FACE_COLOR;
  ctx.beginPath();
  ctx.roundRect(0, 0, FACE_SIZE, FACE_SIZE, CORNER_RADIUS);
  ctx.fill();

  const dots = DOT_POSITIONS[value] || DOT_POSITIONS[1];
  const centerX = FACE_SIZE / 2;
  const centerY = FACE_SIZE / 2;

  for (const [dx, dy] of dots) {
    ctx.beginPath();
    ctx.arc(centerX + dx * FACE_SIZE, centerY + dy * FACE_SIZE, DOT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = DOT_COLOR;
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Standard die: 1 front(+z), 6 back(-z), 2 right(+x), 5 left(-x), 3 top(+y), 4 bottom(-y)
// BoxGeometry face order: +x, -x, +y, -y, +z, -z
const FACE_ORDER = [2, 5, 3, 4, 1, 6];

const FACE_ROTATIONS: Record<number, THREE.Euler> = {
  1: new THREE.Euler(0, 0, 0),
  2: new THREE.Euler(0, -Math.PI / 2, 0),
  3: new THREE.Euler(-Math.PI / 2, 0, 0),
  4: new THREE.Euler(Math.PI / 2, 0, 0),
  5: new THREE.Euler(0, Math.PI / 2, 0),
  6: new THREE.Euler(0, Math.PI, 0),
};

const ROLL_DURATION = 2000;
const SETTLE_DURATION = 1200;

interface DiceMeshProps {
  value: number;
  rolling: boolean;
  onSettled?: () => void;
}

function DiceMesh({ value, rolling, onSettled }: DiceMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef<"idle" | "rolling" | "settling" | "landed">("idle");
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
  const targetQuatRef = useRef(new THREE.Quaternion());
  const settleStartRef = useRef(0);
  const startQuatRef = useRef(new THREE.Quaternion());
  const rollStartRef = useRef(0);
  const pendingValueRef = useRef<number | null>(null);
  const valueRef = useRef(value);
  const onSettledRef = useRef(onSettled);

  useEffect(() => {
    onSettledRef.current = onSettled;
  }, [onSettled]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const materials = useMemo(() => {
    return FACE_ORDER.map((faceVal) => {
      const texture = createFaceTexture(faceVal);
      return new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.3,
        metalness: 0.1,
      });
    });
  }, []);

  useEffect(() => {
    return () => {
      materials.forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
    };
  }, [materials]);

  const beginRolling = useCallback(() => {
    if (!meshRef.current) return;
    phaseRef.current = "rolling";
    rollStartRef.current = performance.now();
    velocityRef.current.set(
      (Math.random() + 0.8) * (Math.random() > 0.5 ? 1 : -1),
      (Math.random() + 0.8) * (Math.random() > 0.5 ? 1 : -1),
      (Math.random() + 0.8) * (Math.random() > 0.5 ? 1 : -1)
    );
  }, []);

  const beginSettling = useCallback((targetValue: number) => {
    if (!meshRef.current) return;
    phaseRef.current = "settling";
    settleStartRef.current = performance.now();
    startQuatRef.current = meshRef.current.quaternion.clone();

    const targetQuat = new THREE.Quaternion();
    const euler = FACE_ROTATIONS[targetValue] || FACE_ROTATIONS[1];
    targetQuat.setFromEuler(euler);

    const dot = startQuatRef.current.dot(targetQuat);
    if (dot < 0) {
      targetQuat.set(-targetQuat.x, -targetQuat.y, -targetQuat.z, -targetQuat.w);
    }
    targetQuatRef.current = targetQuat;
  }, []);

  useEffect(() => {
    if (rolling && (phaseRef.current === "idle" || phaseRef.current === "landed")) {
      pendingValueRef.current = valueRef.current;
      beginRolling();
    }
  }, [rolling, beginRolling]);

  useFrame(() => {
    if (!meshRef.current) return;

    if (phaseRef.current === "rolling") {
      const rot = meshRef.current.rotation;
      rot.x += velocityRef.current.x * 0.016;
      rot.y += velocityRef.current.y * 0.016;
      rot.z += velocityRef.current.z * 0.016;

      const elapsed = performance.now() - rollStartRef.current;
      if (elapsed >= ROLL_DURATION && pendingValueRef.current !== null) {
        beginSettling(pendingValueRef.current);
      }
    } else if (phaseRef.current === "settling") {
      const elapsed = performance.now() - settleStartRef.current;
      const t = Math.min(elapsed / SETTLE_DURATION, 1);
      const ease = 1 - Math.pow(1 - t, 3);

      meshRef.current.quaternion.slerpQuaternions(
        startQuatRef.current,
        targetQuatRef.current,
        ease
      );

      if (t >= 1) {
        phaseRef.current = "landed";
        meshRef.current.quaternion.copy(targetQuatRef.current);
        onSettledRef.current?.();
      }
    }
  });

  return (
    <mesh ref={meshRef} material={materials} castShadow receiveShadow>
      <boxGeometry args={[1.8, 1.8, 1.8]} />
    </mesh>
  );
}

function Scene({ value, rolling, onSettled }: DiceMeshProps) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-3, 4, -2]} intensity={0.4} />
      <DiceMesh value={value} rolling={rolling} onSettled={onSettled} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0.3} />
      </mesh>
    </>
  );
}

interface Dice3DProps {
  value: number | null;
  rolling: boolean;
}

export function Dice3D({ value, rolling }: Dice3DProps) {
  const diceValue = value ?? 1;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-gray-600 shadow-lg bg-gradient-to-br from-gray-800 to-gray-900">
        <Canvas
          camera={{ position: [3, 2.5, 4], fov: 35 }}
          shadows
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <Scene value={diceValue} rolling={rolling} onSettled={() => {}} />
        </Canvas>
      </div>
    </div>
  );
}
