import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { getRoutes } from '../src/services/routeService';
import { SavedRoute } from '../src/types/map';
import RouteThumbnail from '../src/components/route/RouteThumbnail';
import NavigationBar from '../src/components/common/NavigationBar';
import { User } from 'lucide-react';
import Image from 'next/image';

const FeedPage: React.FC = () => {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRefreshMessage, setShowRefreshMessage] = useState(false);
  const router = useRouter();
  const startY = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const fetchRoutes = useCallback(async () => {
    try {
      const fetchedRoutes = await getRoutes();
      console.log('Fetched routes:', fetchedRoutes);
      setRoutes(fetchedRoutes);
      setShowRefreshMessage(true);
      setTimeout(() => setShowRefreshMessage(false), 2000);
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (url === '/' || url === '/index') {
        fetchRoutes();
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, fetchRoutes]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (content.scrollTop === 0) {
        startY.current = e.touches[0].pageY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (content.scrollTop === 0) {
        const currentY = e.touches[0].pageY;
        const diff = currentY - startY.current;
        if (diff > 10) {
          fetchRoutes();
          startY.current = 0;
        }
      }
    };

    content.addEventListener('touchstart', handleTouchStart);
    content.addEventListener('touchmove', handleTouchMove);

    return () => {
      content.removeEventListener('touchstart', handleTouchStart);
      content.removeEventListener('touchmove', handleTouchMove);
    };
  }, [fetchRoutes]);

  const handleRouteClick = (route: SavedRoute) => {
    console.log('Route being passed:', route);
    console.log('Points with images:', route.points.map(point => ({
      name: point.name,
      images: point.images
    })));

    const locations = route.points.map(point => ({
      name: point.name || '',
      address: `${point.lat},${point.lng}`,
      lat: point.lat,
      lng: point.lng,
      images: point.images
    }));

    console.log('Formatted locations:', locations);

    router.push({
      pathname: '/map',
      query: { 
        locations: JSON.stringify(locations),
        fromFeed: 'true',
        title: route.title,
        userNickname: route.userNickname,
        userProfileImage: route.userProfileImage,
        userId: route.userId,
        routeId: route.id
      },
    });
  };

  const renderProfileImage = (route: SavedRoute) => {
    if (!route.userProfileImage) {
      return <User size={20} className="text-stone-400" />;
    }

    try {
      return (
        <Image
          src={route.userProfileImage}
          alt={route.userNickname || '사용자'}
          width={32}
          height={32}
          className="rounded-full object-cover"
        />
      );
    } catch (error) {
      console.error('프로필 이미지 렌더링 실패:', error);
      return <User size={20} className="text-stone-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-200"></div>
      </div>
    );
  }

  return (
    <div 
      ref={contentRef}
      className="bg-stone-900 min-h-screen overflow-auto relative"
    >
      <style jsx>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -20px); }
          15% { opacity: 1; transform: translate(-50%, 0); }
          85% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -20px); }
        }
        .animate-fade-in-out {
          animation: fadeInOut 2s ease-in-out;
        }
      `}</style>
      {showRefreshMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-stone-800 text-stone-100 px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out">
          새로고침 되었습니다!
        </div>
      )}
      <div className="bg-stone-900 text-center text-stone-100 p-4">
        <h1 className="text-xl font-semibold mt-12 mb-8">We Walk.</h1>
        <div className="max-w-screen-2xl mx-auto grid gap-4 md:grid-cols-2 lg:grid-cols-3 text-left">
          {routes.map((route) => {
            console.log('Route points for', route.title, ':', route.points);
            return (
              <div
                key={route.id}
                className="bg-stone-800 rounded-lg overflow-hidden cursor-pointer hover:bg-stone-700 transition-colors"
                onClick={() => handleRouteClick(route)}
              >
                <div className="relative bg-stone-900 h-40 m-1 rounded">
                  <RouteThumbnail points={route.points} />
                </div>
                <div className="px-4 py-2">
                  <div className="flex items-center mb-2">
                    <div className="relative w-8 h-8 mr-2 rounded-full bg-stone-700 flex items-center justify-center overflow-hidden">
                      {renderProfileImage(route)}
                    </div>
                    <span className="text-sm text-stone-300">{route.userNickname || '익명'}</span>
                  </div>
                  <div className="flex justify-between align-center">
                    <div className="text-base text-stone-100 font-semibold">{route.title}</div>
                    <div className="text-xs text-stone-600 font-medium">
                      {new Date(route.created).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="mt-6 mb-2 flex justify-end space-x-2">
                    {route.points.map((_, index) => (
                      <div
                        key={index}
                        className="w-4 h-4 rounded-full bg-stone-200 flex items-center justify-center"
                      >
                        <span className="text-xs text-stone-900 font-bold">{index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeedPage; 