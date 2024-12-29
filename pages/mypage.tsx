import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import Image from 'next/image';
import NavigationBar from '@/components/common/NavigationBar';
import { User, Settings, LogOut } from 'lucide-react';

interface Route {
  id: string;
  title: string;
  description: string;
  userId: string;
  userNickname: string;
  userProfileImage: string;
  createdAt: string;
}

export default function MyPage() {
  const { user, loading } = useAuth();
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
      if (!user) return;

      try {
        const routesQuery = query(
          collection(db, 'routes'),
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(routesQuery);
        const routesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Route[];

        setRoutes(routesData);
      } catch (error) {
        console.error('경로 불러오기 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyRoutes();
  }, [user]);

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
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-stone-100">My Page</h1>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/profile-edit')}
              className="flex items-center gap-2 px-4 py-2 bg-stone-800 rounded-lg hover:bg-stone-700 transition-colors text-stone-300"
            >
              <Settings size={18} />
              <span>프로필 수정</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-stone-800 rounded-lg hover:bg-stone-700 transition-colors text-stone-300"
            >
              <LogOut size={18} />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((route) => (
            <div
              key={route.id}
              className="bg-stone-800 rounded-lg overflow-hidden cursor-pointer hover:bg-stone-700 transition-colors"
              onClick={() => router.push(`/route/${route.id}`)}
            >
              {/* 썸네일 이미지 또는 맵 프리뷰 */}
              <div className="relative h-48 bg-stone-900">
                {/* 여기에 경로 썸네일 또는 맵 프리뷰 추가 */}
              </div>
              
              <div className="p-4">
                <div className="flex items-center mb-2">
                  <div className="relative w-8 h-8 mr-2 rounded-full bg-stone-700 flex items-center justify-center overflow-hidden">
                    {renderProfileImage(route)}
                  </div>
                  <span className="text-sm text-stone-300">{route.userNickname || '익명'}</span>
                </div>
                
                <h2 className="text-lg font-semibold mb-2 text-stone-100">{route.title}</h2>
                <p className="text-sm text-stone-400">{route.description}</p>
                
                <div className="mt-4 text-sm text-stone-500">
                  {new Date(route.createdAt).toLocaleDateString()}
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
      <NavigationBar />
    </div>
  );
} 