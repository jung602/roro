import React, { useRef, useEffect, useMemo } from 'react';
import { useThree, Canvas, useFrame } from '@react-three/fiber';
import { Sphere, OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';

interface Route3DProps {
  path3D: THREE.Vector3[];
  locations: {name: string, address: string}[];
}

const Route3DContent: React.FC<Route3DProps> = ({ path3D, locations }) => {
  const { camera, scene } = useThree();
  const lineRef = useRef<any>(null);  // 'any' 타입을 사용
  const controlsRef = useRef<any>(null);

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

      if (controlsRef.current) {
        controlsRef.current.target.copy(center);
        controlsRef.current.update();
      }
    }
  }, [path3D, camera, scene]);

  const locationPoints = useMemo(() => {
    if (path3D.length >= 2 && locations.length >= 2) {
      return [path3D[0], ...path3D.filter((_, index) => index % Math.floor(path3D.length / (locations.length - 1)) === 0), path3D[path3D.length - 1]];
    }
    return [];
  }, [path3D, locations]);

  useFrame(() => {
    if (lineRef.current && lineRef.current.computeLineDistances) {
      lineRef.current.computeLineDistances();
    }
  });

  return (
    <>
      <Line
        ref={lineRef}
        points={path3D}
        color="white"
        lineWidth={50}
        dashed={false}
      />
      {locationPoints.map((point, index) => (
        <Sphere key={index} args={[0.01, 32, 32]} position={point}>
          <meshStandardMaterial color="yellow" roughness={1} metalness={0} />
        </Sphere>
      ))}
      <Sphere args={[0.01, 32, 32]} position={path3D[0]}>
        <meshStandardMaterial color="yellow" roughness={1} metalness={0} />
      </Sphere>
      <Sphere args={[0.01, 32, 32]} position={path3D[path3D.length - 1]}>
        <meshStandardMaterial color="yellow" roughness={1} metalness={0} />
      </Sphere>
      <OrbitControls 
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        zoomSpeed={0.5}
        rotateSpeed={0.5}
        panSpeed={0.5}
      />
    </>
  );
};

const Route3D: React.FC<Route3DProps> = ({ path3D, locations }) => {
  return (
    <Canvas camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 300, 0], up: [0, 0, -1] }}>
      <ambientLight intensity={5} />
      <Route3DContent path3D={path3D} locations={locations} />
    </Canvas>
  );
};

export default Route3D;