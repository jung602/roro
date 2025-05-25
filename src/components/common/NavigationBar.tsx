import { useRouter } from 'next/router';
import { Home, Plus, User, Camera } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function NavigationBar() {
  const router = useRouter();
  const { user } = useAuth();

  const handleMyPageClick = () => {
    if (!user) {
      router.push('/auth/login');
    } else {
      router.push('/mypage');
    }
  };

  const getButtonStyles = (path: string) => {
    const isActive = router.pathname === path;
    return `cursor-pointer flex flex-col items-center justify-center flex-1 w-auto py-3 transition-all duration-200 
      ${isActive ? 'text-stone-200 scale-105' : 'text-stone-500 hover:text-stone-400'}
      hover:scale-105`;
  };

  return (
    <>
      <div className="w-dvw overflow-x-hidden mx-auto p-4 flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className={getButtonStyles('/')}
        >
          <Home
            size={24} strokeWidth={1}
            className="transition-transform duration-200"
          />
        </button>

        <button
          onClick={() => router.push('/search')}
          className={getButtonStyles('/search')}
        >
          <Plus
            size={24} strokeWidth={1}
            className="transition-transform duration-200"
          />
        </button>
        
        <button
          onClick={() => router.push('/camera')}
          className={getButtonStyles('/camera')}
        >
          <Camera
            size={24} strokeWidth={1}
            className="transition-transform duration-200"
          />
        </button>

        <button
          onClick={handleMyPageClick}
          className={getButtonStyles('/mypage')}
        >
          <User
            size={24} strokeWidth={1}
            className="transition-transform duration-200"
          />
        </button>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </>
  );
} 