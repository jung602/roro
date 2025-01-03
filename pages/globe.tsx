import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { getRoutes } from '@/services/routeService';
import { SavedRoute } from '@/types/map';
import { GeoPoint, ArcData, GlobeProps } from '../src/components/map/Globe';
import {  RotateCw } from 'lucide-react';

const Globe = dynamic<GlobeProps>(() => import('../src/components/map/Globe'), {
  ssr: false,
  loading: () => <div className="w-full h-screen bg-black animate-pulse"></div>
});

const GlobePage: NextPage = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const globeEl = useRef<any>();

  const getCurrentLocation = useCallback(async () => {
    try {
      setIsLoading(true);
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });
      
      setCurrentLocation([position.coords.latitude, position.coords.longitude]);
      setLocationError('');
    } catch (error: any) {
      console.error('위치 정보 오류:', error);
      setLocationError(error.message);
      setCurrentLocation(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    if (navigator.geolocation) {
      getCurrentLocation().catch(console.error);
    } else {
      setLocationError('이 브라우저는 위치 정보를 지원하지 않습니다.');
      setIsLoading(false);
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [getCurrentLocation]);

  // 라든 경로 데이터 가져오기
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const allRoutes = await getRoutes();
        setRoutes(allRoutes);
      } catch (error) {
        console.error('경로 데이터 로딩 실패:', error);
      }
    };

    fetchRoutes();
  }, []);

  // 경로 데이터를 arcs 형식으로 변환
  const arcData = useMemo<ArcData[]>(() => {
    return routes.flatMap(route => {
      if (!route.points || route.points.length < 2) {
        return [];
      }

      const arcs: ArcData[] = [];
      for (let i = 0; i < route.points.length - 1; i++) {
        const startPoint = route.points[i];
        const endPoint = route.points[i + 1];
        
        if (startPoint?.lat && startPoint?.lng && endPoint?.lat && endPoint?.lng) {
          arcs.push({
            startLat: startPoint.lat,
            startLng: startPoint.lng,
            endLat: endPoint.lat,
            endLng: endPoint.lng,
            color: `rgba(255,255,255,${0.3 + (Math.random() * 0.4)})`,
          });
        }
      }
      
      return arcs;
    });
  }, [routes]);

  // 모든 위치 포인트에 대한 라벨 데이터
  const labelData = useMemo<GeoPoint[]>(() => {
    const routeLabels = routes.flatMap(route => 
      route.points.map(point => {
        if (point?.lat && point?.lng) {
          return {
            lat: point.lat,
            lng: point.lng,
            size: 0.3,
            dotRadius: 0.3,
            color: '#ffffff',
            text: point.name || '',
          } as GeoPoint;
        }
        return null;
      }).filter((label): label is GeoPoint => label !== null)
    );

    if (currentLocation && !locationError && !isLoading) {
      const currentLocationLabel: GeoPoint = {
        lat: currentLocation[0],
        lng: currentLocation[1],
        size: 1.5,
        dotRadius: 1,
        color: '#ff0000',
        text: '',
      };
      return [currentLocationLabel, ...routeLabels];
    }

    return routeLabels;
  }, [currentLocation, locationError, isLoading, routes]);

  // Globe controls 설정을 위한 useEffect 수정
  useEffect(() => {
    if (globeEl.current) {
      if (currentLocation) {
        globeEl.current.pointOfView({
          lat: currentLocation[0],
          lng: currentLocation[1],
          altitude: 120
        }, 2000);
        globeEl.current.controls().autoRotate = false;
      } else {
        globeEl.current.pointOfView({
          lat: 20,
          lng: -16.6,
          altitude: 120
        }, 4000);
        globeEl.current.controls().autoRotate = true;
      }
      globeEl.current.controls().enabled = true;
      globeEl.current.controls().enableZoom = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
    }
  }, [currentLocation]);

  return (
    <>
      <Head>
        <title>지구본 | RORO</title>
        <meta name="description" content="3D 지구본으로 전 세계 여행 경로를 확인해보세요" />
      </Head>
      <div className="fixed inset-0 bg-black">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="text-white flex gap-16">
            <div className="text-center">
              <p className="text-6xl font-bold">
                {routes.reduce((total, route) => total + (route.points?.length || 0), 0)}
              </p>
              <p className="text-sm opacity-50 mt-1">MAPPED PLACES</p>
            </div>
            <div className="text-center">
              <p className="text-6xl font-bold">
                {routes.reduce((total, route) => total + (route.points?.length > 1 ? route.points.length - 1 : 0), 0)}
              </p>
              <p className="text-sm opacity-50 mt-1">MAPPED PATHS</p>
            </div>
          </div>
        </div>

        <div className="text-xs absolute text-center bottom-20 right-1/2 translate-x-1/2 z-10 bg-white/10 backdrop-blur-md rounded p-2 text-white min-w-[200px]">
          <h2 className="font-semibold mb-2">현재 위치</h2>
          {isLoading ? (
            <div className="flex justify-center items-center space-x-2">
              <button 
                className="animate-spin mt-2 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                < RotateCw size={16} />
              </button>
            </div>
          ) : locationError ? (
            <div className="text-red-400">
              <p>위치 정보를 가져올 수 없습니다</p>
              <button 
                onClick={getCurrentLocation}
                className="mt-2 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                < RotateCw size={16} />
              </button>
            </div>
          ) : currentLocation ? (
            <div className="space-y-1">
              <p>위도: {currentLocation[0].toFixed(6)}°</p>
              <p>경도: {currentLocation[1].toFixed(6)}°</p>
              <button 
                onClick={getCurrentLocation}
                className={`mt-2 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors ${isLoading ? 'animate-spin' : ''}`}
              >
                < RotateCw size={16} />
              </button>
            </div>
          ) : null}
        </div>

        <main className="w-full h-full">
          {isMounted && dimensions.width > 0 && dimensions.height > 0 && (
            <Globe
              width={dimensions.width}
              height={dimensions.height}
              labelData={labelData}
              arcData={arcData}
            />
          )}
        </main>
      </div>
    </>
  );
};

export default GlobePage; 