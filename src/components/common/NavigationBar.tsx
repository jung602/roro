import { useRouter } from 'next/router';
import { Home, Plus, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function NavigationBar() {
  const router = useRouter();
  const { user } = useAuth();

  const handleMyPageClick = () => {
    if (!user) {
      router.push('/login');
    } else {
      router.push('/mypage');
    }
  };

  return (
    <>
      <div className="px-4 h-[4.5rem] flex gap-4 items-center justify-around">
        <button
          onClick={() => router.push('/')}
          className="flex flex-col items-center space-y-1 w-16 py-2"
        >
          <Home
            size={24}
            className={router.pathname === '/' ? 'text-stone-200' : 'text-stone-500'}
          />
          <span className={`text-xs ${router.pathname === '/' ? 'text-stone-200' : 'text-stone-500'}`}>
            홈
          </span>
        </button>

        <button
          onClick={() => router.push('/search')}
          className="flex flex-col items-center space-y-1 w-16 py-2"
        >
          <Plus
            size={24}
            className={router.pathname === '/search' ? 'text-stone-200' : 'text-stone-500'}
          />
          <span className={`text-xs ${router.pathname === '/search' ? 'text-stone-200' : 'text-stone-500'}`}>
            만들기
          </span>
        </button>

        <button
          onClick={handleMyPageClick}
          className="flex flex-col items-center space-y-1 w-16 py-2"
        >
          <User
            size={24}
            className={router.pathname === '/mypage' ? 'text-stone-200' : 'text-stone-500'}
          />
          <span className={`text-xs ${router.pathname === '/mypage' ? 'text-stone-200' : 'text-stone-500'}`}>
            마이
          </span>
        </button>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </>
  );
} 