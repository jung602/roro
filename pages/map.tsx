import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GoogleMap, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import * as THREE from 'three';
import { saveRoute } from '../src/services/routeService';
import BackButton from '../src/components/common/BackButton';
import { googleMapsConfig } from '@/utils/googleMapsConfig';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { User } from 'lucide-react';

const DynamicRoute3D = dynamic(() => import('../src/components/route/Route3D'), {
  ssr: false,
});

const center = { lat: 37.7749, lng: -122.4194 };

const convertToLocalCoord = (lat: number, lng: number, centerLat: number, centerLng: number) => {
  const R = 6371;
  const dLat = (lat - centerLat) * Math.PI / 180;
  const dLon = (lng - centerLng) * Math.PI / 180;
  const x = R * dLon * Math.cos(centerLat * Math.PI / 180);
  const z = -R * dLat;
  return new THREE.Vector3(x, 0, z);
};

export default function Map() {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [path3D, setPath3D] = useState<THREE.Vector3[]>([]);
  const [locationList, setLocationList] = useState<{name: string, address: string, lat?: number, lng?: number}[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [routeTitle, setRouteTitle] = useState('');
  const router = useRouter();
  const { locations, fromFeed } = router.query;
  const { user } = useAuth();

  const { isLoaded, loadError } = useJsApiLoader(googleMapsConfig);

  useEffect(() => {
    if (typeof window !== 'undefined' && locations) {
      try {
        const parsedLocations = JSON.parse(locations as string) as {name: string, address: string, lat?: number, lng?: number}[];
        console.log('파싱된 위치 데이터:', parsedLocations);
        setLocationList(parsedLocations);
      } catch (error) {
        console.error("Failed to parse locations:", error);
        setLocationList([]);
      }
    }
  }, [locations]);

  useEffect(() => {
    if (isLoaded && locationList.length >= 2 && !loadError) {
      console.log('경로 계산을 위한 위치 목록:', locationList);
      const directionsService = new google.maps.DirectionsService();

      const getLocation = (location: {address: string, lat?: number, lng?: number}) => {
        if (location.lat && location.lng) {
          return new google.maps.LatLng(location.lat, location.lng);
        }
        const [lat, lng] = location.address.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          return new google.maps.LatLng(lat, lng);
        }
        return location.address;
      };

      const origin = getLocation(locationList[0]);
      const destination = getLocation(locationList[locationList.length - 1]);
      const waypoints = locationList.slice(1, -1).map(location => ({
        location: getLocation(location),
        stopover: true
      }));

      console.log('경로 계산 요청:', { origin, destination, waypoints });

      directionsService.route(
        {
          origin,
          destination,
          waypoints,
          travelMode: google.maps.TravelMode.WALKING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
            if (result.routes[0].overview_path) {
              const path = result.routes[0].overview_path.map(point =>
                convertToLocalCoord(point.lat(), point.lng(), center.lat, center.lng)
              );
              setPath3D(path);
            }
          } else {
            console.error("Directions request failed. Status:", status);
          }
        }
      );
    }
  }, [isLoaded, locationList, loadError]);

  const handleSaveRoute = async () => {
    if (!directions || !routeTitle) {
      console.log('directions 또는 routeTitle이 없음:', { directions, routeTitle });
      return;
    }

    if (!user) {
      alert('로그인이 필요한 기능입니다.');
      router.push('/login');
      return;
    }

    console.log('저장할 경로 데이터:', { locationList, directions });

    try {
      const points = locationList.map((location, index) => {
        console.log(`위치 ${index} 처리 중:`, location);
        
        let lat, lng;
        
        if (index === 0) {
          lat = directions.routes[0].legs[0].start_location.lat();
          lng = directions.routes[0].legs[0].start_location.lng();
        } else if (index === locationList.length - 1) {
          const lastLeg = directions.routes[0].legs[directions.routes[0].legs.length - 1];
          lat = lastLeg.end_location.lat();
          lng = lastLeg.end_location.lng();
        } else {
          lat = directions.routes[0].legs[index].start_location.lat();
          lng = directions.routes[0].legs[index].start_location.lng();
        }

        console.log(`변환된 좌표:`, { lat, lng });

        if (isNaN(lat) || isNaN(lng)) {
          console.error('유효하지 않은 좌표:', { location, lat, lng });
          alert('경로 좌표 변환에 실패했습니다. 다시 시도해주세요.');
          return null;
        }

        return {
          id: `point-${index}`,
          name: location.name,
          lat,
          lng,
        };
      });

      if (points.some(point => point === null)) {
        return;
      }

      const route = {
        id: '',
        title: routeTitle,
        points: points as {
          id: string;
          name: string;
          lat: number;
          lng: number;
        }[],
        created: new Date(),
        updated: new Date(),
        duration: Math.floor(directions.routes[0].legs.reduce((total, leg) => total + leg.duration!.value, 0) / 60),
        distance: directions.routes[0].legs.reduce((total, leg) => total + leg.distance!.value, 0) / 1000,
      };

      console.log('생성된 route 객체:', route);

      const savedId = await saveRoute(route, user.uid);
      console.log('저장 성공! ID:', savedId);
      setIsModalOpen(false);
      setRouteTitle('');
      alert('경로가 성공적으로 저장되었습니다!');
      router.push('/feed');
    } catch (error) {
      console.error('Failed to save route:', error);
      alert('경로 저장에 실패했습니다.');
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-stone-900 text-stone-100">
      <div className='fixed m-1'><BackButton /></div>
      <div className="flex-1 relative min-h-0">
        <div className="absolute inset-0 dot-grid"></div>
        <div className="absolute inset-0">
          <DynamicRoute3D path3D={path3D} locations={locationList} />
        </div>
      </div>
      <div className="bg-stone-100 text-stone-900 p-4 rounded">
        {fromFeed ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">{router.query.title || ''}</h3>
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center overflow-hidden">
                  {router.query.userProfileImage ? (
                    <Image
                      src={router.query.userProfileImage as string}
                      alt={router.query.userNickname as string || '사용자'}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-stone-400" />
                  )}
                </div>
                <span className="text-sm text-stone-600">{router.query.userNickname || '사용자'}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-stone-500">Places</p>
                <p className="text-lg font-semibold">{locationList.length}</p>
              </div>
              <div>
                <p className="text-sm text-stone-500">By Walk</p>
                <p className="text-lg font-semibold">
                  {directions && Math.floor(directions.routes[0].legs.reduce((total, leg) => total + leg.duration!.value, 0) / 60)}:
                  {directions && String(directions.routes[0].legs.reduce((total, leg) => total + leg.duration!.value, 0) % 60).padStart(2, '0')}
                </p>
              </div>
              <div>
                <p className="text-sm text-stone-500">Long</p>
                <p className="text-lg font-semibold">
                  {directions && (directions.routes[0].legs.reduce((total, leg) => total + leg.distance!.value, 0) / 1000).toFixed(1)} km
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-stone-500">Places</p>
                <p className="text-lg font-semibold">{locationList.length}</p>
              </div>
              <div>
                <p className="text-sm text-stone-500">By Walk</p>
                <p className="text-lg font-semibold">
                  {directions && Math.floor(directions.routes[0].legs.reduce((total, leg) => total + leg.duration!.value, 0) / 60)}:
                  {directions && String(directions.routes[0].legs.reduce((total, leg) => total + leg.duration!.value, 0) % 60).padStart(2, '0')}
                </p>
              </div>
              <div>
                <p className="text-sm text-stone-500">Long</p>
                <p className="text-lg font-semibold">
                  {directions && (directions.routes[0].legs.reduce((total, leg) => total + leg.distance!.value, 0) / 1000).toFixed(1)} km
                </p>
              </div>
            </div>
          </>
        )}
        <div className="mt-4 flex justify-between items-center">
          <div className="flex space-x-2">
            {locationList.map((_, index) => (
              <div key={index} className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center">
                <span className="text-xs text-stone-900">{index + 1}</span>
              </div>
            ))}
          </div>
          {!fromFeed && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-stone-200 text-stone-900 px-4 py-2 rounded-full hover:bg-stone-300 transition-colors"
            >
              Save Route
            </button>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-stone-100 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-stone-900">Save Your Route</h3>
            <input
              type="text"
              value={routeTitle}
              onChange={(e) => setRouteTitle(e.target.value)}
              placeholder="Enter route title"
              className="w-full px-4 py-2 border rounded mb-4 text-stone-900 bg-stone-50"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-stone-600 hover:text-stone-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRoute}
                className="px-4 py-2 bg-stone-200 text-stone-900 rounded hover:bg-stone-300 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}