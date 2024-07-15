import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface CircleMarker3DProps {
  position: THREE.Vector3;
  number: number;
}

const CircleMarker3D: React.FC<CircleMarker3DProps> = ({ position, number }) => {
  const spriteRef = useRef<THREE.Sprite>(null);

  const spriteMaterial = useMemo(() => {
    if (typeof window === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      context.beginPath();
      context.arc(64, 64, 60, 0, 2 * Math.PI);
      context.fillStyle = 'black';
      context.fill();
      context.strokeStyle = 'white';
      context.lineWidth = 4;
      context.stroke();
      context.font = 'bold 80px Arial';
      context.fillStyle = 'white';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(number.toString(), 64, 64);
    }
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return new THREE.SpriteMaterial({ 
      map: texture,
      depthTest: false,
      depthWrite: false,
    });
  }, [number]);

  useEffect(() => {
    if (spriteRef.current) {
      spriteRef.current.lookAt(new THREE.Vector3(0, 0, 1));
    }
  }, []);

  // useFrame 훅을 조건부로 사용
  if (typeof window !== 'undefined') {
    useFrame(({ camera }) => {
      if (spriteRef.current) {
        spriteRef.current.lookAt(camera.position);
      }
    });
  }

  if (!spriteMaterial) return null;

  return (
    <sprite
      ref={spriteRef}
      position={position}
      scale={[.05, .05, 1]}
      material={spriteMaterial}
      renderOrder={1000}
    />
  );
};

export default CircleMarker3D;