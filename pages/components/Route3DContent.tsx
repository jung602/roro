import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import CircleMarker3D from './CircleMarker3D';

interface Route3DContentProps {
  path3D: THREE.Vector3[];
  locations: {
    name: string;
    address: string;
    lat?: number;  // lat를 선택적으로 만듭니다
    lng?: number;  // lng를 선택적으로 만듭니다
  }[];
}

const Scene: React.FC<Route3DContentProps> = ({ path3D, locations }) => {
  const { camera, scene, size } = useThree();
  const lineRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);

  const [animationProgress, setAnimationProgress] = useState(0);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  const animationDuration = 2; // seconds

  const adjustCamera = () => {
    if (path3D.length > 0) {
      const box = new THREE.Box3().setFromPoints(path3D);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      let cameraZ = maxDim;

      if (camera instanceof THREE.PerspectiveCamera) {
        const fov = camera.fov * (Math.PI / 180);
        cameraZ = Math.abs(maxDim / Math.tan(fov / 2));
      }

      cameraZ *= 1.5; // Zoom out a bit

      camera.position.set(center.x, center.y + cameraZ, center.z);
      camera.lookAt(center);
      
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.updateProjectionMatrix();
      }

      if (controlsRef.current) {
        controlsRef.current.target.copy(center);
        controlsRef.current.update();
      }
    }
  };

  useEffect(() => {
    adjustCamera();
  }, [path3D, camera, scene, size]);

  useFrame((state, delta) => {
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
  });

  const animatedPath = useMemo(() => {
    if (path3D.length === 0) return [];
    const pointCount = Math.max(2, Math.floor(path3D.length * animationProgress));
    return path3D.slice(0, pointCount);
  }, [path3D, animationProgress]);

  const locationPoints = useMemo(() => {
    if (path3D.length === 0 || locations.length === 0) return [];
  
    if (locations.length === 1) {
      return [path3D[path3D.length - 1]];  // 장소가 하나만 있으면 경로의 끝점을 반환
    }
  
    const result = [];
    result.push(path3D[0]);  // 첫 번째 장소는 항상 경로의 시작점
  
    // 중간 지점들 계산
    for (let i = 1; i < locations.length - 1; i++) {
      const index = Math.floor((i / (locations.length - 1)) * (path3D.length - 1));
      result.push(path3D[index]);
    }
  
    result.push(path3D[path3D.length - 1]);  // 마지막 장소는 항상 경로의 끝점
  
    return result;
  }, [locations, path3D]);
  
  useEffect(() => {
    console.log("path3D length:", path3D.length);
    console.log("locations length:", locations.length);
    console.log("locationPoints:", locationPoints);
  }, [path3D, locations, locationPoints]);
  
  return (
    <>
      {animatedPath.length >= 2 && (
        <Line
          ref={lineRef}
          points={animatedPath}
          color="white"
          lineWidth={15}
        />
      )}
      {locationPoints.map((point, index) => (
        <CircleMarker3D
          key={index}
          position={point}
          number={index + 1}
        />
      ))}
      <OrbitControls 
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        zoomSpeed={0.5}
        rotateSpeed={0.5}
        panSpeed={0.5}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
};

const Route3DContent: React.FC<Route3DContentProps> = ({ path3D, locations }) => {
  return (
    <div className="w-full h-full p-0 overflow-hidden">
      <Canvas
        className="w-full h-full block !p-0 !m-0 border-none outline-none"
        style={{ display: 'block' }}
        camera={{ fov: 60, near: 0.1, far: 10000, position: [0, 1000, 0] }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Scene path3D={path3D} locations={locations} />
      </Canvas>
    </div>
  );
};

export default Route3DContent;