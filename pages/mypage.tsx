import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, getDoc, doc, orderBy, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import Image from 'next/image';
import NavigationBar from '@/components/common/NavigationBar';
import { User, Settings, LogOut } from 'lucide-react';
import RouteThumbnail from '../src/components/route/RouteThumbnail';

interface Route {
  id: string;
  title: string;
  points: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    images?: { url: string; path: string; }[];
  }>;
  userId: string;
  userNickname: string;
  userProfileImage: string;
  createdAt: string;
  duration: number;
  distance: number;
  path3D?: Array<{ x: number; y: number; z: number; }>;
}

interface UserData {
  nickname?: string;
  profileImageUrl?: string;
}

export default function MyPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchMyRoutes = async () => {
      if (!user || !userData) return;

      try {
        console.log('Fetching routes for user:', user.uid);
        
        const routesQuery = query(
          collection(db, 'routes'),
          where('userId', '==', user.uid)
        );
        
        const queryWithOrder = query(
          collection(db, 'routes'),
          where('userId', '==', user.uid),
          orderBy('created', 'desc')
        );
        
        let querySnapshot;
        try {
          querySnapshot = await getDocs(routesQuery);
        } catch (error) {
          querySnapshot = await getDocs(queryWithOrder);
        }

        console.log('Query snapshot size:', querySnapshot.size);
        console.log('Raw query snapshot:', querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const routesData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Processing route document:', { id: doc.id, ...data });
          
          const createdAt = data.created instanceof Timestamp 
            ? data.created.toDate().toISOString()
            : new Date().toISOString();

          return {
            id: doc.id,
            title: data.title || '',
            points: data.points || [],
            userId: data.userId,
            userNickname: userData.nickname || '사용자',
            userProfileImage: userData.profileImageUrl || '',
            createdAt,
            duration: data.duration || 0,
            distance: data.distance || 0,
            path3D: data.path3D || []
          };
        }) as Route[];

        console.log('Final processed routes:', routesData);
        setRoutes(routesData);
      } catch (error) {
        console.error('데이터 불러오기 실패:', error);
        if (error instanceof Error && error.message.includes('index')) {
          console.log('인덱스를 생성해주세요:', error.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (user && !loading) {
      fetchMyRoutes();
    }
  }, [user, loading, userData]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '날짜 없음';
      }
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('날짜 변환 실패:', error);
      return '날짜 없음';
    }
  };

  const renderProfileImage = (route: Route) => {
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900 pb-20">
      <div className="max-w-screen-2xl mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-stone-100">My Page</h1>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/profile-edit')}
              className="flex items-center gap-2 px-4 py-2 bg-stone-800 rounded-lg hover:bg-stone-700 transition-colors text-stone-300"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-stone-800 rounded-lg hover:bg-stone-700 transition-colors text-stone-300"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6 mb-8 p-6 bg-stone-800 rounded-lg">
          <div className="relative w-24 h-24 rounded-full bg-stone-700 flex items-center justify-center overflow-hidden">
            {userData?.profileImageUrl ? (
              <Image
                src={userData.profileImageUrl}
                alt={userData.nickname || '사용자'}
                width={96}
                height={96}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                className="rounded-full"
              />
            ) : (
              <User size={40} className="text-stone-400" />
            )}
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

        <div className="h-px bg-stone-700 mb-8"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((route) => (
            <div
              key={route.id}
              className="bg-stone-800 rounded-lg overflow-hidden cursor-pointer hover:bg-stone-700 transition-colors"
              onClick={() => router.push(`/map?locations=${encodeURIComponent(JSON.stringify(route.points.map(point => ({
                name: point.name || '',
                address: `${point.lat},${point.lng}`,
                lat: point.lat,
                lng: point.lng,
              }))))}&fromFeed=true&title=${encodeURIComponent(route.title)}&userNickname=${encodeURIComponent(route.userNickname)}&userProfileImage=${encodeURIComponent(route.userProfileImage)}`)}
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
                    {formatDate(route.createdAt)}
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
          ))}
        </div>

        {routes.length === 0 && (
          <div className="text-center py-8">
            <p className="text-stone-500">저장된 경로가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
} 