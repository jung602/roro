import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/contexts/AuthContext";
import NavigationBar from '@/components/common/NavigationBar';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const hideNavigationPaths = ['/map', '/search'];
  const shouldShowNavigation = !hideNavigationPaths.includes(router.pathname);

  return (
    <AuthProvider>
      <div className="relative min-h-dvh w-dvw">
        <div className={shouldShowNavigation ? "pb-20" : ""}>
          <Component {...pageProps} />
        </div>
        {shouldShowNavigation && (
          <div className='flex justify-center bg-stone-800 border-t border-stone-700 z-50 fixed left-1/2 -translate-x-1/2 bottom-0 w-full'>
            <NavigationBar />
          </div>
        )}
      </div>
    </AuthProvider>
  );
}
