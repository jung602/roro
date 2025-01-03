"use client";

import { useEffect, useRef } from "react";
import Globe, { GlobeMethods } from "react-globe.gl";

export interface GeoPoint {
  lat: number;
  lng: number;
  size?: number;
  dotRadius?: number;
  color?: string;
  text?: string;
  id?: string;
  name?: string;
  routeId?: string;
  userId?: string;
  title?: string;
  userNickname?: string;
  userProfileImage?: string;
}

export interface ArcData {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
}

export interface GlobeProps {
  width: number;
  height: number;
  labelData: GeoPoint[];
  arcData: ArcData[];
  onLabelClick?: (point: GeoPoint) => void;
}

const _Globe = ({ width, height, labelData, arcData, onLabelClick }: GlobeProps) => {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);

  // 화면 크기에 따른 지구본 크기 계산
  const calculateGlobeSize = () => {
    const aspectRatio = width / height;
    const minSize = Math.min(width, height);
    const maxSize = Math.max(width, height);
    
    // 화면이 정사각형에 가까울 때
    if (aspectRatio > 0.8 && aspectRatio < 1.2) {
      return {
        width: minSize * 1.1,
        height: minSize * 1.1
      };
    }
    
    // 세로가 긴 화면
    if (width < height) {
      return {
        width: width * 1.1,
        height: width * 1.1
      };
    }
    
    // 가로가 긴 화면
    return {
      width: height * 1,
      height: height * 1.1
    };
  };

  const globeSize = calculateGlobeSize();

  useEffect(() => {
    const globe = globeEl.current;
    if (globe) {
      globe.pointOfView({ lat: 0, lng: 0, altitude: 2 });
      const controls = globe.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.enableZoom = false;
      }
    }
  }, []);

  const handleLabelClick = (label: object) => {
    if (onLabelClick) {
      onLabelClick(label as GeoPoint);
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-full">
      <Globe
        ref={globeEl}
        width={globeSize.width}
        height={globeSize.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        backgroundColor="rgba(0,0,0,0)"
        atmosphereColor="#ffffff"
        atmosphereAltitude={0.15}
        enablePointerInteraction={true}
        labelsData={labelData}
        labelLat="lat"
        labelLng="lng"
        labelText={() => ''}
        labelSize={(obj: object) => {
          const point = obj as GeoPoint;
          return point.size || 3.0;
        }}
        labelDotRadius={(obj: object) => {
          const point = obj as GeoPoint;
          return point.dotRadius || 3.0;
        }}
        labelColor={(obj: object) => {
          const point = obj as GeoPoint;
          return point.color || '#ffffff';
        }}
        labelResolution={2}
        labelAltitude={0.01}
        labelDotOrientation={() => 'right'}
        onLabelClick={handleLabelClick}
        arcsData={arcData}
        arcColor="color"
        arcAltitude={0}
        arcStroke={0}
        arcCurveResolution={64}
      />
    </div>
  );
};

export default _Globe; 