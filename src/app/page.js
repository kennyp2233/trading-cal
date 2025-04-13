// src/app/page.js
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente al dashboard
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-indigo-600">Cargando...</h1>
        <p className="mt-2 text-gray-600">Redireccionando al dashboard</p>
      </div>
    </div>
  );
}