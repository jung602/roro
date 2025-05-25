import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import { uploadImage } from '@/services/imageService';

export default function ProfileSetup() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
    if (user) {
      setNickname(user.displayName || '');
      setPreviewUrl(user.photoURL || '');
    }
  }, [user, loading, router]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setProfileImage(file);
        setPreviewUrl(URL.createObjectURL(file));
      } catch (error) {
        console.error('이미지 처리 실패:', error);
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
          const timestamp = Date.now();
          const fileExtension = profileImage.type.split('/')[1] || 'jpg';
          const fileName = `${user.uid}_${timestamp}.${fileExtension}`;
          
          profileImageUrl = await uploadImage(
            profileImage,
            'profile-images',
            fileName
          );
        } catch (uploadError) {
          console.error('이미지 업로드 실패:', uploadError);
          throw uploadError;
        }
      }

      await setDoc(doc(db, 'users', user.uid), {
        nickname: nickname || user.displayName || '익명',
        profileImageUrl: profileImageUrl || user.photoURL,
        email: user.email,
        createdAt: new Date().toISOString(),
      });

      router.push('/');
    } catch (error) {
      console.error('프로필 설정 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-900 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded">
        <h1 className="text-xl font-medium text-center mb-8">Set your profile</h1>
        
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
                <div className="w-full h-full rounded-full bg-stone-200 flex items-center justify-center">
                  <span className="text-stone-400">No Image</span>
                </div>
              )}
            </div>
            
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="profile-image"
            />
            <label
              htmlFor="profile-image"
              className="cursor-pointer py-2 px-4 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors"
            >
              Upload Image
            </label>
          </div>

          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-stone-700 mb-1">
              Name
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={user?.displayName || '닉네임을 입력하세요'}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-stone-900 text-white rounded-lg hover:bg-stone-600 disabled:bg-stone-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? '저장 중...' : '저장'}
          </button>
        </form>
      </div>
    </div>
  );
} 