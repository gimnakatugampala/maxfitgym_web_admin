'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseApi } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();

  // useEffect(() => {
  //   if (supabaseApi.isAuthenticated()) {
  //     router.push('/dashboard');
  //   } else {
  //     router.push('/login');
  //   }
  // }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}