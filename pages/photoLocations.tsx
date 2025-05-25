import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useJsApiLoader } from '@react-google-maps/api';
import { ArrowRight, Search, Info, X, MapPin, Check } from 'lucide-react';
import BackButton from '@/components/common/BackButton';

interface ImageData {
  id: string;
  file: File;
  previewUrl: string;
  lat?: number;
  lng?: number;
  hasLocation: boolean;
}

interface LocationData {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  imageId: string;
  customTitle?: boolean;
}

export default function PhotoLocations() {
  const [photos, setPhotos] = useState<ImageData[]>([]);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isCustomTitle, setIsCustomTitle] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [searchPosition, setSearchPosition] = useState<{ lat: number, lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  
  const router = useRouter();
  
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  // 사진 데이터 로드
  useEffect(() => {
    if (typeof window !== 'undefined' && router.query.photos) {
      try {
        const parsedPhotos = JSON.parse(router.query.photos as string) as ImageData[];
        setPhotos(parsedPhotos);
      } catch (error) {
        console.error('Failed to parse photos data:', error);
        setError('사진 데이터를 로드하는데 실패했습니다.');
      }
    }
  }, [router.query.photos]);

  // 구글 지도 및 서비스 초기화
  useEffect(() => {
    if (isLoaded && !loadError && photos.length > 0) {
      const currentPhoto = photos[currentPhotoIndex];
      
      // 지도 생성
      const mapDiv = document.getElementById('map');
      if (!mapDiv) return;
      
      let mapCenter;
      if (currentPhoto.hasLocation && currentPhoto.lat && currentPhoto.lng) {
        mapCenter = { lat: currentPhoto.lat, lng: currentPhoto.lng };
      } else {
        // 기본 중심 위치 (서울)
        mapCenter = { lat: 37.5666805, lng: 126.9784147 };
      }
      
      const map = new google.maps.Map(mapDiv, {
        center: mapCenter,
        zoom: 15,
        disableDefaultUI: true,
        zoomControl: true,
      });
      mapRef.current = map;
      
      // 지도 클릭 이벤트 연결
      map.addListener('click', handleMapClick);
      
      // Places 서비스 초기화
      placesServiceRef.current = new google.maps.places.PlacesService(map);
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      
      // 현재 사진에 위치 정보가 있으면 마커 표시
      if (currentPhoto.hasLocation && currentPhoto.lat && currentPhoto.lng) {
        setSearchPosition({ lat: currentPhoto.lat, lng: currentPhoto.lng });
        
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }
        
        markerRef.current = new google.maps.Marker({
          position: { lat: currentPhoto.lat, lng: currentPhoto.lng },
          map: map,
          title: '사진 위치',
          animation: google.maps.Animation.DROP,
        });
        
        // 해당 위치 근처 장소 검색
        searchNearbyPlaces({ lat: currentPhoto.lat, lng: currentPhoto.lng });
      }
    }
  }, [isLoaded, loadError, photos, currentPhotoIndex]);

  // 근처 장소 검색
  const searchNearbyPlaces = (position: { lat: number, lng: number }) => {
    if (!placesServiceRef.current) return;
    
    setIsLoading(true);
    
    placesServiceRef.current.nearbySearch(
      {
        location: position,
        radius: 500,
        type: 'point_of_interest'
      },
      (results, status) => {
        setIsLoading(false);
        
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          // 근처 장소 검색 결과를 predictions 형식으로 변환하여 저장
          const nearbyPredictions: google.maps.places.AutocompletePrediction[] = results.map(place => ({
            place_id: place.place_id || '',
            description: place.name || '',
            structured_formatting: {
              main_text: place.name || '',
              main_text_matched_substrings: [],
              secondary_text: place.vicinity || ''
            },
            matched_substrings: [],
            terms: [],
            types: place.types || []
          }));
          
          setPredictions(nearbyPredictions);
        } else {
          console.error('Nearby search failed:', status);
          setPredictions([]);
        }
      }
    );
  };

  // 장소 검색 처리
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (!query || !autocompleteServiceRef.current) {
      setPredictions([]);
      return;
    }
    
    // 검색 요청 - 위치정보가 없어도 검색 가능하도록 수정
    const request: google.maps.places.AutocompletionRequest = {
      input: query,
      types: ['establishment']
    };
    
    // 검색 위치가 있으면 해당 위치 중심으로, 없으면 전체 검색
    if (searchPosition) {
      request.location = new google.maps.LatLng(searchPosition.lat, searchPosition.lng);
      request.radius = 5000;
    }
    
    autocompleteServiceRef.current.getPlacePredictions(
      request,
      (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results);
        } else {
          setPredictions([]);
        }
      }
    );
  };

  // 장소 선택 처리
  const handleSelectPlace = (placeId: string) => {
    if (!placesServiceRef.current) return;
    
    placesServiceRef.current.getDetails(
      {
        placeId: placeId,
        fields: ['name', 'formatted_address', 'geometry']
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const currentPhoto = photos[currentPhotoIndex];
          
          // 위치 정보 저장
          const locationData: LocationData = {
            id: `loc-${Date.now()}`,
            name: place.name || '이름 없음',
            address: place.formatted_address || '',
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
            imageId: currentPhoto.id,
            customTitle: false
          };
          
          setLocations(prev => {
            // 이미 같은 이미지에 대한 위치가 있으면 교체
            const filtered = prev.filter(loc => loc.imageId !== currentPhoto.id);
            return [...filtered, locationData];
          });
          
          // 마커 위치 업데이트
          if (mapRef.current && place.geometry?.location) {
            if (markerRef.current) {
              markerRef.current.setMap(null);
            }
            
            markerRef.current = new google.maps.Marker({
              position: place.geometry.location,
              map: mapRef.current,
              title: place.name || '선택한 장소',
              animation: google.maps.Animation.DROP,
            });
            
            mapRef.current.panTo(place.geometry.location);
          }
          
          // 검색 결과 초기화
          setPredictions([]);
          setSearchQuery('');
        }
      }
    );
  };

  // 직접 제목 입력 처리
  const handleCustomTitleSubmit = () => {
    if (!customTitle.trim() || !searchPosition) return;
    
    const currentPhoto = photos[currentPhotoIndex];
    
    // 위치 정보 저장
    const locationData: LocationData = {
      id: `loc-${Date.now()}`,
      name: customTitle.trim(),
      address: '사용자 지정 위치',
      lat: searchPosition.lat,
      lng: searchPosition.lng,
      imageId: currentPhoto.id,
      customTitle: true
    };
    
    setLocations(prev => {
      // 이미 같은 이미지에 대한 위치가 있으면 교체
      const filtered = prev.filter(loc => loc.imageId !== currentPhoto.id);
      return [...filtered, locationData];
    });
    
    // 입력 필드 초기화
    setCustomTitle('');
    setIsCustomTitle(false);
  };

  // 지도 클릭 이벤트 처리
  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (!mapRef.current || !event.latLng) return;
    
    const clickPosition = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };
    
    setSearchPosition(clickPosition);
    
    // 마커 업데이트
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }
    
    markerRef.current = new google.maps.Marker({
      position: clickPosition,
      map: mapRef.current,
      title: '선택한 위치',
      animation: google.maps.Animation.DROP,
    });
    
    // 근처 장소 검색
    searchNearbyPlaces(clickPosition);
  };

  // 다음 사진으로 이동
  const handleNext = () => {
    // 모든 사진에 위치 정보가 있는지 확인
    const processedPhotos = photos.filter(photo => 
      locations.some(loc => loc.imageId === photo.id)
    );
    
    if (processedPhotos.length !== photos.length) {
      setError('모든 사진에 위치 정보를 추가해주세요.');
      return;
    }
    
    // 위치 정보와 이미지 정보를 routeConfirmation 페이지로 전달
    const locationsList = locations.map(loc => {
      // 해당 위치에 연결된 사진 찾기
      const connectedPhoto = photos.find(photo => photo.id === loc.imageId);
      
      return {
        name: loc.name,
        address: loc.address,
        lat: loc.lat,
        lng: loc.lng,
        customTitle: loc.customTitle,
        images: connectedPhoto ? [{
          url: connectedPhoto.previewUrl,
          path: `temp-${connectedPhoto.id}` // 임시 경로
        }] : []
      };
    });
    
    router.push({
      pathname: '/routes/routeConfirmation',
      query: { locations: JSON.stringify(locationsList) },
    });
  };

  // 다음 사진 처리
  const handleNextPhoto = () => {
    const currentPhoto = photos[currentPhotoIndex];
    
    // 현재 사진에 위치 정보가 없으면 알림
    const hasLocation = locations.some(loc => loc.imageId === currentPhoto.id);
    if (!hasLocation) {
      setError('현재 사진에 위치 정보를 추가해주세요.');
      return;
    }
    
    // 다음 사진으로 이동
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(prevIndex => prevIndex + 1);
      setSearchQuery('');
      setPredictions([]);
      setError(null);
    }
  };

  // 이전 사진 처리
  const handlePrevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prevIndex => prevIndex - 1);
      setSearchQuery('');
      setPredictions([]);
      setError(null);
    }
  };

  // 현재 사진 UI
  const renderCurrentPhoto = () => {
    if (photos.length === 0) return null;
    
    const currentPhoto = photos[currentPhotoIndex];
    const hasAssignedLocation = locations.some(loc => loc.imageId === currentPhoto.id);
    
    return (
      <div className="mb-4">
        <div className="relative rounded-lg overflow-hidden">
          <img 
            src={currentPhoto.previewUrl} 
            alt="현재 사진" 
            className="w-full h-48 object-cover"
          />
          {hasAssignedLocation && (
            <div className="absolute bottom-2 right-2 bg-green-500 text-white p-1 rounded-md flex items-center">
              <Check size={16} className="mr-1" />
              <span className="text-xs">위치 지정됨</span>
            </div>
          )}
        </div>
        <div className="flex justify-between mt-2">
          <button 
            onClick={handlePrevPhoto}
            disabled={currentPhotoIndex === 0}
            className={`px-3 py-1 rounded-md ${
              currentPhotoIndex === 0 ? 'bg-stone-400 text-stone-600' : 'bg-stone-600 text-white'
            }`}
          >
            이전
          </button>
          <span className="text-stone-900">
            {currentPhotoIndex + 1} / {photos.length}
          </span>
          <button 
            onClick={handleNextPhoto}
            disabled={currentPhotoIndex === photos.length - 1}
            className={`px-3 py-1 rounded-md ${
              currentPhotoIndex === photos.length - 1 ? 'bg-stone-400 text-stone-600' : 'bg-stone-600 text-white'
            }`}
          >
            다음
          </button>
        </div>
      </div>
    );
  };

  // 위치 선택/검색 UI
  const renderLocationSelection = () => {
    const currentPhoto = photos[currentPhotoIndex];
    const assignedLocation = locations.find(loc => loc.imageId === currentPhoto?.id);
    
    return (
      <div className="mb-4">
        {assignedLocation ? (
          <div className="bg-stone-100 p-3 rounded-lg mb-4">
            <h3 className="text-stone-900 font-semibold">선택된 장소</h3>
            <div className="flex items-start mt-2">
              <MapPin size={18} className="text-stone-700 mr-2 mt-1" />
              <div>
                <p className="text-stone-900 font-medium">{assignedLocation.name}</p>
                <p className="text-stone-600 text-sm">{assignedLocation.address}</p>
              </div>
              <button 
                onClick={() => setLocations(prev => prev.filter(loc => loc.id !== assignedLocation.id))}
                className="ml-auto bg-stone-300 text-stone-700 p-1 rounded-md"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="relative">
                <div className="flex items-center">
                  <Search size={18} className="text-stone-500 absolute left-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder={currentPhoto.hasLocation ? "장소 검색" : "장소 이름으로 검색"}
                    className="w-full bg-stone-100 text-stone-900 py-2 pl-10 pr-4 rounded-md focus:outline-none"
                  />
                </div>
                {predictions.length > 0 && searchQuery && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto">
                    {predictions.map(prediction => (
                      <div
                        key={prediction.place_id}
                        onClick={() => handleSelectPlace(prediction.place_id)}
                        className="p-2 hover:bg-stone-100 cursor-pointer"
                      >
                        <p className="text-stone-900 font-medium">{prediction.structured_formatting.main_text}</p>
                        <p className="text-stone-600 text-sm">{prediction.structured_formatting.secondary_text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* 위치정보가 있는 경우에만 주변 장소 표시 */}
            {currentPhoto.hasLocation && isLoading ? (
              <div className="text-center p-4 bg-stone-100 rounded-md mb-4">
                <p className="text-stone-600">주변 장소 검색 중...</p>
              </div>
            ) : currentPhoto.hasLocation && predictions.length > 0 && !searchQuery ? (
              <div className="mb-4">
                <h3 className="text-stone-900 font-medium mb-2">
                  <MapPin size={16} className="inline mr-1" />
                  주변 장소
                </h3>
                <div className="bg-stone-100 rounded-md overflow-hidden max-h-[280px] overflow-y-auto">
                  {predictions.map(prediction => (
                    <div
                      key={prediction.place_id}
                      onClick={() => handleSelectPlace(prediction.place_id)}
                      className="p-3 border-b border-stone-200 hover:bg-stone-200 transition-colors cursor-pointer"
                    >
                      <p className="text-stone-900 font-medium">{prediction.structured_formatting.main_text}</p>
                      <p className="text-stone-600 text-sm">{prediction.structured_formatting.secondary_text}</p>
                    </div>
                  ))}
                </div>
                {predictions.length > 5 && (
                  <p className="text-xs text-stone-500 text-center mt-2">스크롤하여 더 많은 장소 보기</p>
                )}
              </div>
            ) : !currentPhoto.hasLocation && !searchQuery && !isLoading && (
              <div className="text-center p-4 bg-stone-100 rounded-md mb-4">
                <p className="text-stone-600">위에서 장소 이름을 검색하거나 지도를 클릭하여 위치를 선택하세요.</p>
              </div>
            )}
            
            {searchPosition && (
              <div className="mb-4">
                <button
                  onClick={() => setIsCustomTitle(true)}
                  className="w-full py-2 bg-stone-300 text-stone-900 rounded-md flex items-center justify-center"
                >
                  <span>직접 제목 입력하기</span>
                </button>
              </div>
            )}
            
            {isCustomTitle && searchPosition && (
              <div className="mb-4 bg-stone-100 p-3 rounded-md">
                <h3 className="text-stone-900 font-medium mb-2">직접 제목 입력</h3>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="이 위치의 이름을 입력해주세요"
                  className="w-full bg-white text-stone-900 p-2 rounded-md mb-2 focus:outline-none"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsCustomTitle(false)}
                    className="flex-1 py-2 bg-stone-300 text-stone-700 rounded-md"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleCustomTitleSubmit}
                    disabled={!customTitle.trim()}
                    className={`flex-1 py-2 rounded-md ${
                      !customTitle.trim() ? 'bg-stone-400 text-stone-600' : 'bg-stone-700 text-white'
                    }`}
                  >
                    저장
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  if (loadError) return <div>지도를 불러오는데 실패했습니다.</div>;
  if (!isLoaded) return <div>로딩중...</div>;

  return (
    <div className="flex flex-col h-[100dvh] bg-stone-900 text-stone-100">
      <div className="flex items-center p-4 border-b border-stone-800">
        <BackButton />
        <h1 className="text-xl font-semibold ml-2">위치 선택</h1>
      </div>
      
      <div className="flex-1 bg-stone-200 p-4 overflow-auto text-stone-900">
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-lg flex items-center">
            <Info size={16} className="mr-1" />
            <span>{error}</span>
          </div>
        )}
        
        {renderCurrentPhoto()}
        
        <div id="map" className="w-full h-64 bg-stone-300 rounded-lg mb-4"></div>
        
        {renderLocationSelection()}
      </div>
      
      <div className="bg-stone-900 p-4">
        <button
          onClick={handleNext}
          disabled={locations.length !== photos.length}
          className={`w-full py-3 rounded-full flex items-center justify-center ${
            locations.length !== photos.length
              ? 'bg-stone-700 text-stone-500'
              : 'bg-stone-200 text-stone-900'
          }`}
        >
          경로 만들기
        </button>
        <p className="text-center text-stone-500 text-xs mt-2">
          {`${locations.length}/${photos.length}개 위치 선택됨`}
        </p>
      </div>
    </div>
  );
} 