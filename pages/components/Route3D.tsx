import React, { useRef, useEffect } from 'react';
import { useThree, Canvas } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface Route3DProps {
  path3D: THREE.Vector3[];
}

const Route3DContent: React.FC<Route3DProps> = ({ path3D }) => {
  const { camera } = useThree();
  const tubeRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (path3D.length > 0) {
      const box = new THREE.Box3().setFromPoints(path3D);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const maxSize = Math.max(size.x, size.z);
      const distance = maxSize * 1.5;

      camera.position.set(center.x, distance, center.z);
      camera.lookAt(center);
      camera.up.set(0, 0, -1);

      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = 2 * Math.atan((maxSize / 2) / distance) * (180 / Math.PI);
      }

      camera.updateProjectionMatrix();
    }
  }, [path3D, camera]);

  useEffect(() => {
    if (tubeRef.current && path3D.length > 1) {
      const curve = new THREE.CatmullRomCurve3(path3D);
      const geometry = new THREE.TubeGeometry(curve, 64, 0.03, 16, false);
      tubeRef.current.geometry = geometry;
    }
  }, [path3D]);

  return (
    <>
      {path3D.length > 1 && (
        <mesh ref={tubeRef}>
          <meshStandardMaterial color="white" roughness={1} metalness={0} opacity={0.5} transparent />
        </mesh>
      )}
      {path3D.map((point, index) => (
        <Sphere key={index} args={[0.01, 32, 32]} position={point}>
          <meshStandardMaterial color="yellow" roughness={1} metalness={0} />
        </Sphere>
      ))}
    </>
  );
};

const Route3D: React.FC<Route3DProps> = ({ path3D }) => {
  return (
    <Canvas camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 100, 0], up: [0, 0, -1] }}>
      <color attach="background" args={["#FFCC00"]} />
      <ambientLight intensity={10} />
      <Route3DContent path3D={path3D} />
    </Canvas>
  );
};

export default Route3D;