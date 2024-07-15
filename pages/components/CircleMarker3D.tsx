import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface CircleMarker3DProps {
  position: THREE.Vector3;
  number: number;
}

const CircleMarker3D: React.FC<CircleMarker3DProps> = ({ position, number }) => {
  const spriteRef = useRef<THREE.Sprite>(null);

  const spriteMaterial = useMemo(() => {
    if (typeof window === 'undefined') return null;  // 서버 사이드에서는 null 반환

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

  useFrame(({ camera }) => {
    if (spriteRef.current) {
      spriteRef.current.lookAt(camera.position);
    }
  });

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