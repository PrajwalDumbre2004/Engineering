import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural gear: toothed outline extruded, with a centre hole
function makeGear(teeth, inner, outer, depth) {
  const step = (Math.PI * 2) / teeth;
  const shape = new THREE.Shape();
  const pt = (r, a) => [Math.cos(a) * r, Math.sin(a) * r];
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts = [pt(inner, a), pt(outer, a + step * 0.2), pt(outer, a + step * 0.5), pt(inner, a + step * 0.7)];
    pts.forEach(([x, y], j) => (i === 0 && j === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
  }
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, inner * 0.35, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

function Gear({ teeth, inner, outer, position, color, speed, phase = 0 }) {
  const ref = useRef();
  const geometry = useMemo(() => makeGear(teeth, inner, outer, 0.5), [teeth, inner, outer]);
  useFrame((_, dt) => {
    ref.current.rotation.z += dt * speed;
  });
  return (
    <mesh ref={ref} geometry={geometry} position={position} rotation={[0, 0, phase]}>
      <meshStandardMaterial color={color} metalness={0.75} roughness={0.35} />
    </mesh>
  );
}

function Rig() {
  const group = useRef();
  // Gentle parallax toward the pointer
  useFrame(({ pointer }) => {
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, pointer.x * 0.45, 0.05);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -pointer.y * 0.3, 0.05);
  });
  return (
    <group ref={group}>
      {/* speeds are inversely proportional to tooth count so the gears mesh */}
      <Gear teeth={16} inner={1.25} outer={1.5} position={[-1.1, 0.2, 0]} color="#5d6b7a" speed={0.35} />
      <Gear teeth={10} inner={0.75} outer={1} position={[1.15, 0.2, 0]} color="#ff6a00" speed={-0.56} phase={Math.PI / 10} />
      <Gear teeth={12} inner={0.6} outer={0.82} position={[0.9, -1.7, -0.3]} color="#3b4652" speed={0.46} />
    </group>
  );
}

export default function GearScene() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 1.5]}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 5, 6]} intensity={2.2} />
      <pointLight position={[-4, -3, 3]} intensity={30} color="#ff6a00" />
      <Rig />
    </Canvas>
  );
}
