import dynamic from 'next/dynamic';

const SearchPage = dynamic(() => import('./components/SearchPage'), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="h-[100dvh]">
      <SearchPage />
    </div>
  );
}