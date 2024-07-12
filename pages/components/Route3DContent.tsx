import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Sphere, OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';

interface Route3DContentProps {
  path3D: THREE.Vector3[];
  locations: {name: string, address: string}[];
}

const easeInOut = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }
  
  const Scene: React.FC<Route3DContentProps> = ({ path3D, locations }) => {
    const { camera, scene } = useThree();
    const lineRef = useRef<any>(null);
    const controlsRef = useRef<any>(null);
    const spheresRef = useRef<THREE.Mesh[]>([]);
  
    const [animationProgress, setAnimationProgress] = useState(0);
    const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  
    const baseLineWidth = 30;
    const baseSphereRadius = 0.7;
    const baseDistance = 100;
    const animationDuration = 1.5; // 애니메이션 지속 시간 (초)

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

  useFrame((state, delta) => {
    if (lineRef.current && controlsRef.current) {
      const distance = camera.position.distanceTo(controlsRef.current.target);
      const scale = distance / baseDistance;
      
      lineRef.current.lineWidth = baseLineWidth / scale;

      spheresRef.current.forEach(sphere => {
        if (sphere) {
          sphere.scale.setScalar(scale);
        }
      });

      // 애니메이션 진행
      if (!isAnimationComplete) {
        setAnimationProgress(prev => {
          const newProgress = prev + delta / animationDuration;
          if (newProgress >= 1) {
            setIsAnimationComplete(true);
            return 1;
          }
          return newProgress;
        });
      }
    }
  });

  const animatedPath = useMemo(() => {
    if (path3D.length === 0) return [];
    const easedProgress = easeInOut(animationProgress);
    const pointCount = Math.max(2, Math.floor(path3D.length * easedProgress));
    return path3D.slice(0, pointCount);
  }, [path3D, animationProgress]);

  return (
    <>
      {animatedPath.length >= 2 && (
        <Line
          ref={lineRef}
          points={animatedPath}
          color="white"
          lineWidth={baseLineWidth}
          dashed={false}
        />
      )}
      {locationPoints.map((point, index) => (
        <Sphere 
          key={index} 
          args={[baseSphereRadius, 32, 32]} 
          position={point}
          ref={el => {
            if (el) spheresRef.current[index] = el;
          }}
        >
          <meshStandardMaterial color="black" roughness={1} metalness={0} />
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


const Route3DContent: React.FC<Route3DContentProps> = ({ path3D, locations }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className="w-full h-full p-0">
        <Canvas
        className="w-full h-full block"
        camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 100, 0], up: [0, 0, -3] }}
        >
        <ambientLight intensity={5} />
        <Scene path3D={path3D} locations={locations} />
      </Canvas>
    </div>
  );
};

export default Route3DContent;