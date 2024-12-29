import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function GoogleLogin() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      
      // 사용자 프로필 정보 확인
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        // 프로필 정보가 없으면 프로필 설정 페이지로 이동
        router.push('/profile-setup');
      } else {
        // 프로필 정보가 있으면 메인 페이지로 이동
        router.push('/');
      }
    } catch (error) {
      console.error('Google 로그인 실패:', error);
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="flex items-center justify-center gap-2 w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <Image
        src="/googleLogo.webp"
        alt="Google Logo"
        width={20}
        height={20}
      />
      Google로 계속하기
    </button>
  );
} 