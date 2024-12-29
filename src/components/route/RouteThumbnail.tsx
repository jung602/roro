import React, { useEffect, useState, useCallback } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { googleMapsConfig } from '@/utils/googleMapsConfig';
import BackgroundDotGrid from '../common/BackgroundDotGrid';

interface RouteThumbnailProps {
  points: { lat: number; lng: number }[];
}

const RouteThumbnail: React.FC<RouteThumbnailProps> = React.memo(({ points }) => {
  const [pathData, setPathData] = useState<string>('');
  const { isLoaded } = useJsApiLoader(googleMapsConfig);

  const processDirectionsResult = useCallback((result: google.maps.DirectionsResult) => {
    console.log('Processing directions result:', result);
    const allPoints: google.maps.LatLng[] = [];
    const uniquePoints = new Set<string>();

    // 중복 포인트 제거하면서 경로 포인트 수집
    result.routes[0].legs.forEach(leg => {
      leg.steps.forEach(step => {
        const addUniquePoint = (point: google.maps.LatLng) => {
          const key = `${point.lat()},${point.lng()}`;
          if (!uniquePoints.has(key)) {
            uniquePoints.add(key);
            allPoints.push(point);
          }
        };

        addUniquePoint(step.start_location);
        step.path.forEach(addUniquePoint);
        addUniquePoint(step.end_location);
      });
    });

    // 경계 상자 계산
    const bounds = {
      minLat: Math.min(...allPoints.map(p => p.lat())),
      maxLat: Math.max(...allPoints.map(p => p.lat())),
      minLng: Math.min(...allPoints.map(p => p.lng())),
      maxLng: Math.max(...allPoints.map(p => p.lng()))
    };

    console.log('Calculated bounds:', bounds);

    // SVG 좌표로 변환
    const width = 1000;
    const height = 500;
    const padding = 50;

    const latRange = bounds.maxLat - bounds.minLat;
    const lngRange = bounds.maxLng - bounds.minLng;
    
    // 종횡비 유지를 위한 스케일 계산
    const aspectRatio = width / height;
    const boundsRatio = lngRange / latRange;
    
    let scale;
    let centerOffsetX = 0;
    let centerOffsetY = 0;

    if (boundsRatio > aspectRatio) {
      // 너비에 맞춤
      scale = (width - padding * 2) / lngRange;
      centerOffsetY = (height - (latRange * scale)) / 2;
    } else {
      // 높이에 맞춤
      scale = (height - padding * 2) / latRange;
      centerOffsetX = (width - (lngRange * scale)) / 2;
    }

    // SVG 경로 생성
    const pathPoints = allPoints.map(point => {
      const x = ((point.lng() - bounds.minLng) * scale) + padding + centerOffsetX;
      const y = ((point.lat() - bounds.minLat) * scale) + padding + centerOffsetY;
      return `${x},${y}`;
    });

    const svgPath = `M ${pathPoints.join(' L ')}`;
    console.log('Generated SVG path:', svgPath);
    return svgPath;
  }, []);

  useEffect(() => {
    if (isLoaded && points.length >= 2) {
      console.log('Requesting directions for points:', points);
      const directionsService = new google.maps.DirectionsService();
      
      const origin = points[0];
      const destination = points[points.length - 1];
      const waypoints = points.slice(1, -1).map(point => ({
        location: new google.maps.LatLng(point.lat, point.lng),
        stopover: true
      }));

      directionsService.route({
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        waypoints,
        travelMode: google.maps.TravelMode.WALKING,
      }, (result, status) => {
        console.log('Directions service response:', status, result);
        if (status === google.maps.DirectionsStatus.OK && result) {
          const svgPath = processDirectionsResult(result);
          setPathData(svgPath);
        } else {
          console.error('Failed to get directions:', status);
        }
      });
    }
  }, [isLoaded, points, processDirectionsResult]);

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 z-[1]">
        <BackgroundDotGrid backgroundColor="transparent" />
      </div>
      <div className="absolute inset-0 z-[2] py-2 flex items-center justify-center">
        <svg
          viewBox="0 0 1000 500"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
        >
          {pathData && (
            <path
              d={pathData}
              stroke="white"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))',
              }}
            />
          )}
        </svg>
      </div>
    </div>
  );
});

RouteThumbnail.displayName = 'RouteThumbnail';

export default RouteThumbnail; 