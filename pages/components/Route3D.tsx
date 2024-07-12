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
  const lineRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);
  const spheresRef = useRef<THREE.Mesh[]>([]);

  const baseLineWidth = 30;
  const baseSphereRadius = 0.7;
  const baseDistance = 100;  // 기준 거리

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
    if (lineRef.current && controlsRef.current) {
      const distance = camera.position.distanceTo(controlsRef.current.target);
      const scale = distance / baseDistance;
      
      // 라인 두께 조정
      lineRef.current.lineWidth = baseLineWidth / scale;

      // 구체 크기 조정
      spheresRef.current.forEach(sphere => {
        if (sphere) {
          sphere.scale.setScalar(scale);
        }
      });
    }
  });

  return (
    <>
      <Line
        ref={lineRef}
        points={path3D}
        color="white"
        lineWidth={baseLineWidth}
        dashed={false}
      />
      {locationPoints.map((point, index) => (
        <Sphere 
          key={index} 
          args={[baseSphereRadius, 32, 32]} 
          position={point}
          ref={el => {
            if (el) spheresRef.current[index] = el;
          }}
        >
          <meshStandardMaterial color="#F8D355" roughness={1} metalness={0} />
        </Sphere>
      ))}
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
    <Canvas camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 100, 0], up: [0, 0, -1] }}>
      <ambientLight intensity={10} />
      <Route3DContent path3D={path3D} locations={locations} />
    </Canvas>
  );
};

export default Route3D;