import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/contexts/AuthContext";
import NavigationBar from '@/components/common/NavigationBar';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // 네비게이션 바를 숨길 페이지 목록
  const hideNavigationPages = [
    '/search',
    '/routeConfirmation',
    '/map'
  ];

  // 스크롤이 있는 페이지 목록
  const scrollablePages = ['/feed', '/mypage'];
  const isScrollablePage = scrollablePages.includes(router.pathname);

  const shouldHideNavigation = hideNavigationPages.includes(router.pathname);

  return (
    <AuthProvider>
      <div className={`min-h-screen w-full overflow-x-hidden relative ${isScrollablePage ? 'h-screen' : ''}`}>
        <div className={`${isScrollablePage ? 'h-[calc(100%-60px)] overflow-y-auto' : ''}`}>
          <Component {...pageProps} />
        </div>
        {!shouldHideNavigation && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[rgb(28,25,23)] h-[60px]">
            <NavigationBar />
          </div>
        )}
      </div>
    </AuthProvider>
  );
}
