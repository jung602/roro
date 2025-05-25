import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useRoutes } from '../src/contexts/RouteContext';
import { SavedRoute } from '../src/types/route';
import RouteThumbnail from '../src/components/route/RouteThumbnail';
import ProfileImage from '../src/components/common/ProfileImage';

export default function Home() {
  const { routes, loading, refreshRoutes } = useRoutes();
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (url === '/' || url === '/index') {
        refreshRoutes();
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, refreshRoutes]);

  const handleRouteClick = (route: SavedRoute) => {
    const locations = route.points.map(point => ({
      name: point.name || '',
      address: `${point.lat},${point.lng}`,
      lat: point.lat,
      lng: point.lng,
      images: point.images
    }));

    router.push({
      pathname: '/routes/map',
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="container-main">
      <div className="page-container">
        <div className="page-content">
          <h1 className="page-title">We Walk.</h1>
          <div className="grid-layout">
            {routes.map((route) => (
              <div
                key={route.id}
                className="card"
                onClick={() => handleRouteClick(route)}
              >
                <div className="card-image-container">
                  <RouteThumbnail points={route.points} />
                </div>
                <div className="card-content">
                  <div className="profile-section">
                    <div className="profile-image-container">
                      <ProfileImage src={route.userProfileImage} alt={route.userNickname || '사용자'} />
                    </div>
                    <span className="profile-name">{route.userNickname || '익명'}</span>
                  </div>
                  <div className="flex justify-between align-center">
                    <div className="card-title">{route.title}</div>
                    <div className="date-text">
                      {new Date(route.created).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="point-markers">
                    {route.points.map((_, index) => (
                      <div
                        key={index}
                        className="point-marker"
                      >
                        <span className="point-marker-text">{index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}