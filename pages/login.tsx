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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">로그인</h1>
          <p className="mt-2 text-gray-600">
            RORO에 오신 것을 환영합니다
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <GoogleLogin />
        </div>
      </div>
    </div>
  );
} 