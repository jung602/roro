import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { uploadImage } from '@/services/imageService';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

export default function ProfileEdit() {
  const { user, loading, refreshUserData } = useAuth();
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setNickname(userData.nickname || '');
          setPreviewUrl(userData.profileImageUrl || '');
        }
      } catch (error) {
        console.error('프로필 정보 불러오기 실패:', error);
      }
    };

    fetchUserProfile();
  }, [user, loading, router]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setProfileImage(file);
        setPreviewUrl(URL.createObjectURL(file));
      } catch (error) {
        console.error('이미지 처리 실패:', error);
        alert('이미지 처리에 실패했습니다.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let profileImageUrl = previewUrl;

      if (profileImage) {
        try {
          // 이전 프로필 이미지 URL에서 파일 경로 추출
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          const previousImageUrl = userData?.profileImageUrl;

          if (previousImageUrl) {
            try {
              // Firebase Storage URL에서 파일 경로 추출
              const previousImageRef = ref(storage, previousImageUrl);
              // 이전 이미지 삭제
              await deleteObject(previousImageRef);
            } catch (deleteError) {
              console.error('이전 프로필 이미지 삭제 실패:', deleteError);
              // 삭제 실패해도 새 이미지 업로드는 계속 진행
            }
          }

          const timestamp = Date.now();
          const fileExtension = profileImage.type.split('/')[1] || 'jpg';
          const fileName = `${user.uid}_${timestamp}.${fileExtension}`;
          profileImageUrl = await uploadImage(profileImage, 'profile-images', fileName);
        } catch (error) {
          console.error('이미지 업로드 실패:', error);
          throw new Error('이미지 업로드에 실패했습니다.');
        }
      }

      await updateDoc(doc(db, 'users', user.uid), {
        nickname: nickname || user.displayName || '익명',
        profileImageUrl,
        updatedAt: new Date().toISOString(),
      });

      await refreshUserData();
      alert('프로필이 성공적으로 수정되었습니다.');
      router.push('/mypage');
    } catch (error) {
      console.error('프로필 수정 실패:', error);
      alert('프로필 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-stone-200"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 p-4">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center text-stone-300 hover:text-stone-100"
        >
          <ArrowLeft size={20} className="mr-1" />
          뒤로 가기
        </button>

        <h1 className="text-2xl font-bold text-center mb-8">프로필 수정</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-32 h-32">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Profile preview"
                  fill
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-stone-800 flex items-center justify-center">
                  <span className="text-stone-400">No Image</span>
                </div>
              )}
            </div>
            
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={handleImageChange}
              className="hidden"
              id="profile-image"
            />
            <label
              htmlFor="profile-image"
              className="cursor-pointer py-2 px-4 bg-stone-800 rounded-lg hover:bg-stone-700 transition-colors"
            >
              프로필 이미지 변경
            </label>
            <p className="text-xs text-stone-400">
              지원 형식: JPG, PNG, GIF
            </p>
          </div>

          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-stone-300 mb-1">
              닉네임
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 text-stone-100"
              placeholder="닉네임을 입력하세요"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-stone-700 text-stone-100 rounded-lg hover:bg-stone-600 disabled:bg-stone-800 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? '저장 중...' : '저장'}
          </button>
        </form>
      </div>
    </div>
  );
} 