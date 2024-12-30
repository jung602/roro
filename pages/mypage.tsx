import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import Image from 'next/image';
import NavigationBar from '@/components/common/NavigationBar';
import { User, Settings, LogOut } from 'lucide-react';
import RouteThumbnail from '../src/components/route/RouteThumbnail';

interface Route {
  id: string;
  title: string;
  description: string;
  userId: string;
  userNickname: string;
  userProfileImage: string;
  createdAt: string;
  points: Array<{
    lat: number;
    lng: number;
    name?: string;
  }>;
}

interface UserData {
  nickname?: string;
  profileImageUrl?: string;
}

export default function MyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchMyRoutes = async () => {
      if (!user) return;

      try {
        const routesQuery = query(
          collection(db, 'routes'),
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(routesQuery);
        
        // 사용자 정보 가져오기
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userDataFromDb = userDoc.data() as UserData;
        setUserData(userDataFromDb);
        
        const routesData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            userNickname: userDataFromDb?.nickname || '사용자',
            userProfileImage: userDataFromDb?.profileImageUrl || '',
            createdAt: data.created?.toDate?.() || new Date().toISOString()
          };
        }) as Route[];

        console.log('Fetched routes data:', routesData);
        console.log('Current user data:', userDataFromDb);

        setRoutes(routesData);
      } catch (error) {
        console.error('경로 불러오기 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyRoutes();
  }, [user]);

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
                alt={userData?.nickname || '사용자'}
                width={96}
                height={96}
                className="rounded-full object-cover"
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
              {/* 필요한 경우 팔로워/팔로잉 등의 추가 정보를 여기에 추가할 수 있습니다 */}
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
      <div className='flex justify-center bg-stone-800 border-t border-stone-700 z-50 fixed left-1/2 -translate-x-1/2 bottom-0 w-full'>
        <NavigationBar />
      </div>
    </div>
  );
} 