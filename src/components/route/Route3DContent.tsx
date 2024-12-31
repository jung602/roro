import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Stats } from '@react-three/drei';
import * as THREE from 'three';
import dynamic from 'next/dynamic';
import BackgroundDotGrid from '../common/BackgroundDotGrid';

const DynamicCircleMarker3D = dynamic(() => import('./DynamicCircleMarker3D'), { ssr: false });

interface Route3DContentProps {
  path3D: THREE.Vector3[];
  locations: {
    name: string;
    address: string;
    lat?: number;
    lng?: number;
  }[];
}

const Scene: React.FC<Route3DContentProps> = ({ path3D, locations }) => {
  const { camera, scene, size } = useThree();
  const lineRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);
  const centerRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const boxRef = useRef<THREE.Box3>(new THREE.Box3());
  const prevSizeRef = useRef({ width: size.width, height: size.height });

  const [animationProgress, setAnimationProgress] = useState(0);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  const animationDuration = 1.5; // seconds

  const adjustCamera = useCallback(() => {
    if (path3D.length > 0) {
      boxRef.current.setFromPoints(path3D);
      boxRef.current.getCenter(centerRef.current);
      const boxSize = boxRef.current.getSize(new THREE.Vector3());

      // 화면 크기에 따른 조정 계수 계산
      const aspectRatio = size.width / size.height;
      const maxDimWidth = boxSize.x / aspectRatio;
      const maxDimHeight = boxSize.z;
      const maxDim = Math.max(maxDimWidth, maxDimHeight) * 1.2;
      
      if (camera instanceof THREE.PerspectiveCamera) {
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ;
        
        if (size.height < size.width) {
          cameraZ = Math.abs(maxDim / Math.tan(fov / 2)) * 1.2;
        } else {
          cameraZ = Math.abs((maxDim * (size.height / size.width)) / Math.tan(fov / 2)) * 1.2;
        }

        // 기본 거리 저장
        const defaultDistance = cameraZ;
        
        camera.position.set(centerRef.current.x, centerRef.current.y + cameraZ, centerRef.current.z);
        camera.lookAt(centerRef.current);
        camera.updateProjectionMatrix();

        // OrbitControls에 대한 참조가 있을 경우 거리 제한 설정
        if (controlsRef.current) {
          controlsRef.current.minDistance = defaultDistance * 0.5;  // 80%
          controlsRef.current.maxDistance = defaultDistance * 2;  // 120%
        }
      }

      if (controlsRef.current) {
        controlsRef.current.target.copy(centerRef.current);
        controlsRef.current.update();
      }
    }
  }, [camera, size, path3D]);

  useEffect(() => {
    adjustCamera();
  }, [path3D, adjustCamera]);

  // 크기 변경 감지 및 카메라 조정
  useFrame(() => {
    if (
      size.width !== prevSizeRef.current.width ||
      size.height !== prevSizeRef.current.height
    ) {
      prevSizeRef.current = { width: size.width, height: size.height };
      adjustCamera();
    }
  });

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
      return [path3D[path3D.length - 1]];
    }
  
    const result = [];
    result.push(path3D[0]);
  
    for (let i = 1; i < locations.length - 1; i++) {
      const index = Math.floor((i / (locations.length - 1)) * (path3D.length - 1));
      result.push(path3D[index]);
    }
  
    result.push(path3D[path3D.length - 1]);
    return result;
  }, [locations, path3D]);

  return (
    <>
      {animatedPath.length >= 2 && (
        <Line
          ref={lineRef}
          points={animatedPath}
          color="#f5f5f4"
          lineWidth={15}
          frustumCulled={true}
        />
      )}
      {locationPoints.map((point, index) => (
        <DynamicCircleMarker3D
          key={`marker-${index}`}
          position={point}
          number={index + 1}
        />
      ))}
      <OrbitControls 
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        rotateSpeed={0.3}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
        enableDamping={true}
        dampingFactor={1}
        zoomSpeed={0.5}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE
        }}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN
        }}
      />
    </>
  );
};

const Route3DContent: React.FC<Route3DContentProps> = ({ path3D, locations }) => {
  return (
    <div className="relative w-full h-full p-0 overflow-hidden bg-stone-900">
      <BackgroundDotGrid 
        dotSize={1}
        spacing={20}
        dotColor="rgba(245, 245, 244, 0.2)"
        backgroundColor="#1c1917"
      />
      <Canvas
        className="w-full h-full block !p-0 !m-0 border-none outline-none"
        style={{ background: 'transparent' }}
        camera={{ fov: 60, near: 0.1, far: 10000, position: [0, 1000, 0] }}
        performance={{ min: 0.5 }}
      >
        {process.env.NODE_ENV === 'development' && <Stats />}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Scene path3D={path3D} locations={locations} />
      </Canvas>
    </div>
  );
};

export default Route3DContent; 