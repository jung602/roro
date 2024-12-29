import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface CircleMarker3DProps {
  position: THREE.Vector3;
  number: number;
}

const CircleMarker3D: React.FC<CircleMarker3DProps> = ({ position, number }) => {
  const spriteRef = useRef<THREE.Sprite>(null);
  const baseScale = 0.3;
  const scaleVector = useRef(new THREE.Vector3());

  const spriteMaterial = useMemo(() => {
    if (typeof window === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      // 캔버스 클리어
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // 원 그리기
      context.beginPath();
      context.arc(64, 64, 60, 0, 2 * Math.PI);
      context.fillStyle = '#000000';
      context.fill();
      context.strokeStyle = '#f5f5f4';
      context.lineWidth = 4;
      context.stroke();

      // 텍스트 그리기
      context.font = 'bold 80px Arial';
      context.fillStyle = '#f5f5f4';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(number.toString(), 64, 64);
    }

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({ 
      map: texture,
      depthTest: false,
      depthWrite: false,
      sizeAttenuation: true
    });

    return material;
  }, [number]);

  useEffect(() => {
    if (spriteRef.current) {
      spriteRef.current.lookAt(new THREE.Vector3(0, 0, 1));
    }

    // 클린업 함수
    return () => {
      if (spriteMaterial) {
        spriteMaterial.dispose();
        spriteMaterial.map?.dispose();
      }
    };
  }, [spriteMaterial]);

  useFrame(({ camera }) => {
    if (spriteRef.current) {
      spriteRef.current.lookAt(camera.position);
      
      const distance = camera.position.distanceTo(spriteRef.current.position);
      const scale = baseScale * (distance / 10);
      
      // Vector3 재사용
      scaleVector.current.set(scale, scale, 1);
      spriteRef.current.scale.copy(scaleVector.current);
    }
  });

  if (!spriteMaterial) return null;

  return (
    <sprite
      ref={spriteRef}
      position={position}
      scale={scaleVector.current}
      material={spriteMaterial}
      renderOrder={1000}
    />
  );
};

export default React.memo(CircleMarker3D); 