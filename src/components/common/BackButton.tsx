import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';

const BackButton: React.FC = () => {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className=
      "absolute z-50 bg-stone-100 rounded-full flex items-center justify-center hover:bg-opacity-50 transition-all"
    >
      <ArrowLeft size={24} color="#1c1917" />
    </button>
  );
};

export default BackButton; 