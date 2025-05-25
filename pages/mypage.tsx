import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRoutes } from '@/services/routeQueryService';
import { SavedRoute } from '@/types/route';
import { auth } from '@/lib/firebase';
import { User, Settings, LogOut } from 'lucide-react';
import RouteThumbnail from '../src/components/route/RouteThumbnail';
import ProfileImage from '../src/components/common/ProfileImage';

export default function MyPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchMyRoutes = async () => {
      if (!user) {
        console.log('No user found, skipping route fetch');
        return;
      }

      try {
        console.log('Fetching routes for user:', user.uid);
        console.log('User object:', user);
        console.log('UserData object:', userData);
        
        setIsLoading(true);
        const userRoutes = await getUserRoutes(user.uid);
        console.log('Fetched user routes:', userRoutes);
        console.log('Number of routes found:', userRoutes.length);
        
        if (userRoutes.length === 0) {
          console.log('No routes found for user. Checking Firestore directly...');
          
          // 직접 Firestore 확인
          const { collection, query, where, getDocs } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase');
          
          const routesQuery = query(
            collection(db, 'routes'),
            where('userId', '==', user.uid)
          );
          
          const querySnapshot = await getDocs(routesQuery);
          console.log('Direct Firestore query results:', querySnapshot.size);
          console.log('Documents:', querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
        
        setRoutes(userRoutes);
      } catch (error) {
        console.error('데이터 불러오기 실패:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user && !loading) {
      console.log('Starting fetchMyRoutes...');
      fetchMyRoutes();
    } else {
      console.log('Conditions not met for fetchMyRoutes:', { user: !!user, loading });
    }
  }, [user, loading, userData]);

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

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="container-main">
      <div className="page-container">
        {/* 프로필 헤더 */}
        <div className="flex justify-between items-center mb-8 p-6 bg-stone-800 rounded-lg">
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 rounded-full bg-stone-700 flex items-center justify-center overflow-hidden">
              <ProfileImage 
                src={userData?.profileImageUrl || null} 
                alt={userData?.nickname || '사용자'}
                size={96}
              />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-medium text-stone-100 mb-2">
                {userData?.nickname || '사용자'}
              </h2>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-xl font-semibold text-stone-100">{routes.length}</div>
                  <div className="text-sm text-stone-400">게시물</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/profile/profile-edit')}
              className="flex items-center gap-2 px-4 py-2 bg-stone-700 rounded-lg hover:bg-stone-600 transition-colors text-stone-300"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-stone-700 rounded-lg hover:bg-stone-600 transition-colors text-stone-300"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="page-content">
          <h1 className="page-title">My Routes</h1>
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
                      {route.created.toLocaleDateString()}
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

          {routes.length === 0 && (
            <div className="text-center py-8">
              <p className="text-stone-500">저장된 경로가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 