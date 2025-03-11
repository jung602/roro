import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function GoogleLogin() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      
      // 사용자 인증 확인
      if (!result.user) {
        console.error('인증 실패: 사용자 정보가 없습니다.');
        return;
      }
      
      try {
        // 사용자 프로필 정보 확인
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        
        if (!userDoc.exists()) {
          // 프로필 정보가 없으면 기본 사용자 정보 생성
          await setDoc(doc(db, 'users', result.user.uid), {
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            createdAt: new Date()
          });
          
          // 프로필 설정 페이지로 이동
          router.push('/profile-setup');
        } else {
          // 프로필 정보가 있으면 메인 페이지로 이동
          router.push('/');
        }
      } catch (error) {
        console.error('사용자 정보 조회/저장 실패:', error);
        alert('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('Google 로그인 실패:', error);
      alert('Google 로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="bg-stone-50 rounded transition-all">
    <button
      onClick={handleGoogleLogin}
      className="flex items-center justify-center gap-2 w-full px-4 py-2"
    >
      <Image
        src={`${process.env.NODE_ENV === 'production' ? '/roro' : ''}/googleLogo.webp`}
        alt="Google Logo"
        width={20}
        height={20}
      />
      Sign in with Google
    </button>
    </div>
  );
} 