import { useEffect } from 'react';
import { useRouter } from 'next/router';
import GoogleLogin from '@/components/auth/GoogleLogin';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/'); // 이미 로그인된 사용자는 메인 페이지로 리다이렉트
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-900 m-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-stone-800 rounded">
        <div className="text-center">
          <h1 className="text-xl font-light text-stone-100">Start your road</h1>
        </div>
        
        <div className="mt-8 space-y-6">
          <GoogleLogin />
        </div>
      </div>
    </div>
  );
} 