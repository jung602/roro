import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { GoogleMap, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import * as THREE from 'three';
import { saveRoute, updateRoute } from '../src/services/routeService';
import { uploadPlaceImages, deletePlaceImage } from '../src/services/imageService';
import BackButton from '../src/components/common/BackButton';
import { googleMapsConfig } from '@/utils/googleMapsConfig';
import { useAuth } from '@/contexts/AuthContext';
import LocationGallery from '@/components/route/LocationGallery';
import EditableLocationGallery from '@/components/route/EditableLocationGallery';
import RouteInfo from '@/components/route/RouteInfo';
import { Location, RouteData } from '@/types/route';
import { showErrorMessage } from '@/utils/errorHandler';
import { X } from 'lucide-react';

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
  const [locationList, setLocationList] = useState<Location[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [routeTitle, setRouteTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLocations, setEditedLocations] = useState<Location[]>([]);

  const router = useRouter();
  const { locations, fromFeed } = router.query;
  const { user } = useAuth();

  const { isLoaded, loadError } = useJsApiLoader(googleMapsConfig);

  const getLocation = useCallback((location: Location): google.maps.LatLng | string => {
    if (location.lat && location.lng) {
      return new google.maps.LatLng(location.lat, location.lng);
    }
    return location.address;
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && locations) {
      try {
        const parsedLocations = JSON.parse(locations as string) as Location[];
        console.log('Received locations string:', locations);
        console.log('Parsed locations:', parsedLocations);
        console.log('Locations with images:', parsedLocations.filter(loc => loc.images && loc.images.length > 0));
        setLocationList(parsedLocations);
        setEditedLocations(parsedLocations);
      } catch (error) {
        console.error("Failed to parse locations:", error);
        setLocationList([]);
        setEditedLocations([]);
      }
    }
  }, [locations]);

  useEffect(() => {
    if (isLoaded && locationList.length >= 2 && !loadError) {
      console.log('경로 계산을 위한 위치 목록:', locationList);
      const directionsService = new google.maps.DirectionsService();

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
  }, [isLoaded, locationList, loadError, getLocation]);

  const handleSaveRoute = useCallback(async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      if (!directions || !routeTitle || !user) {
        throw new Error('validation/필수 정보가 누락되었습니다.');
      }

      console.log('저장할 경로 데이터:', { locationList, directions });

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

        return {
          id: `point-${index}`,
          name: location.name,
          lat,
          lng,
          images: location.images
        };
      });

      const totalDuration = directions.routes[0].legs.reduce((total, leg) => total + leg.duration!.value, 0);
      const totalDistance = directions.routes[0].legs.reduce((total, leg) => total + leg.distance!.value, 0);

      const route = {
        id: `route-${Date.now()}`,
        title: routeTitle,
        points,
        userId: user.uid,
        created: new Date(),
        updated: new Date(),
        duration: Math.floor(totalDuration / 60),
        distance: totalDistance / 1000,
        path3D: path3D.map(vector => ({ x: vector.x, y: vector.y, z: vector.z }))
      };

      await saveRoute(route, user.uid);
      router.push('/mypage');
    } catch (error) {
      showErrorMessage(error);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, locationList, routeTitle, user, directions, router, path3D]);

  const handleAddImages = useCallback(async (locationIndex: number, files: FileList) => {
    try {
      const location = editedLocations[locationIndex];
      const currentImages = location.images || [];
      if (currentImages.length + files.length > 5) {
        throw new Error('validation/이미지는 최대 5개까지만 업로드할 수 있습니다.');
      }

      const uploadedImages = await uploadPlaceImages(`place-${location.name}-${locationIndex}`, Array.from(files));
      const newLocations = [...editedLocations];
      newLocations[locationIndex] = {
        ...location,
        images: [...currentImages, ...uploadedImages]
      };
      setEditedLocations(newLocations);
    } catch (error) {
      showErrorMessage(error);
    }
  }, [editedLocations]);

  const handleDeleteImage = useCallback(async (locationIndex: number, imageIndex: number) => {
    try {
      const location = editedLocations[locationIndex];
      if (!location.images) return;

      await deletePlaceImage(location.images[imageIndex].path);

      const newLocations = [...editedLocations];
      newLocations[locationIndex] = {
        ...location,
        images: location.images.filter((_, i) => i !== imageIndex)
      };
      setEditedLocations(newLocations);
    } catch (error) {
      showErrorMessage(error);
    }
  }, [editedLocations]);

  const handleSaveChanges = useCallback(async () => {
    try {
      if (!user) return;
      
      const route = {
        id: router.query.routeId as string,
        title: router.query.title as string,
        points: editedLocations.map((location, index) => ({
          id: `point-${index}`,
          name: location.name,
          lat: location.lat!,
          lng: location.lng!,
          images: location.images
        })),
        created: new Date(),
        updated: new Date(),
        duration: directions ? Math.floor(directions.routes[0].legs.reduce((total, leg) => total + leg.duration!.value, 0) / 60) : 0,
        distance: directions ? directions.routes[0].legs.reduce((total, leg) => total + leg.distance!.value, 0) / 1000 : 0,
      };

      await updateRoute(route, user.uid);
      setIsEditing(false);
      setLocationList(editedLocations);
      alert('변경사항이 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save changes:', error);
      alert('변경사항 저장에 실패했습니다.');
    }
  }, [editedLocations, fromFeed, router]);

  const toggleEditMode = useCallback(() => {
    setIsEditing(prev => !prev);
    setEditedLocations(locationList);
  }, [locationList]);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading...</div>;

  const canEdit: boolean = fromFeed === 'true' && !!user && user.uid === router.query.userId;
  const totalDuration = directions?.routes[0].legs.reduce((total, leg) => total + leg.duration!.value, 0) || 0;
  const totalDistance = directions?.routes[0].legs.reduce((total, leg) => total + leg.distance!.value, 0) || 0;

  return (
    <div className="flex flex-col">
      <div className="h-[100dvh] flex flex-col bg-stone-100 text-stone-100">
        <div className='fixed z-[1000] m-4'><BackButton /></div>
        <div className="flex-1 relative min-h-0">
          <div className="absolute inset-0 dot-grid"></div>
          <div className="absolute inset-0">
            <DynamicRoute3D path3D={path3D} locations={locationList} />
          </div>
        </div>
        
        {fromFeed ? (
          <RouteInfo
            title={router.query.title as string}
            userNickname={router.query.userNickname as string}
            userProfileImage={router.query.userProfileImage as string}
            placesCount={locationList.length}
            duration={Math.floor(totalDuration / 60)}
            distance={totalDistance / 1000}
            isEditing={isEditing}
            canEdit={canEdit}
            onEditClick={toggleEditMode}
            onSaveClick={handleSaveChanges}
            onCancelEdit={() => setIsEditing(false)}
          />
        ) : (
          <div className="bg-stone-100 text-stone-900 p-4 rounded">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-stone-500">Places</p>
                <p className="text-lg font-semibold">{locationList.length}</p>
              </div>
              <div>
                <p className="text-sm text-stone-500">By Walk</p>
                <p className="text-lg font-semibold">
                  {directions && Math.floor(totalDuration / 60)}:
                  {directions && String(totalDuration % 60).padStart(2, '0')}
                </p>
              </div>
              <div>
                <p className="text-sm text-stone-500">Long</p>
                <p className="text-lg font-semibold">
                  {directions && (totalDistance / 1000).toFixed(1)} km
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div className="flex space-x-2">
                {locationList.map((_, index) => (
                  <div key={index} className="w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center">
                    <span className="text-xs text-stone-900">{index + 1}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-stone-200 text-stone-900 px-4 py-2 rounded-full hover:bg-stone-300 transition-colors"
              >
                Save Route
              </button>
            </div>
          </div>
        )}
      </div>
      <div className='bg-stone-100'>
        {isEditing ? (
          <EditableLocationGallery
            locations={editedLocations}
            onAddImages={handleAddImages}
            onDeleteImage={handleDeleteImage}
          />
        ) : (
          <LocationGallery locations={locationList} />
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-stone-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-stone-100">경로 저장</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-300 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <input
              type="text"
              value={routeTitle}
              onChange={(e) => setRouteTitle(e.target.value)}
              placeholder="경로 제목을 입력하세요"
              className="w-full px-4 py-2 rounded bg-stone-700 text-stone-100 placeholder-stone-400 border border-stone-600 focus:outline-none focus:border-stone-500"
            />
            <div className="flex justify-end mt-6 gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded bg-stone-700 text-stone-300 hover:bg-stone-600 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveRoute}
                disabled={!routeTitle.trim() || isSaving}
                className="px-4 py-2 rounded bg-stone-200 text-stone-900 hover:bg-stone-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}