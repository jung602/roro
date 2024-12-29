import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import NavigationBar from '@/components/common/NavigationBar';

const FeedPage = dynamic(() => import('./feed'), {
  ssr: false,
});

export default function Home() {
  const router = useRouter();

  return (
    <div className="relative h-dvh w-dvw">
      <div className="pb-20">
        <FeedPage />
      </div>
    </div>
  );
}