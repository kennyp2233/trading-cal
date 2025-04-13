// src/app/components/Layout.js
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart, LineChart, ArrowLeftRight, Settings } from 'lucide-react';

export default function Layout({ children }) {
    const pathname = usePathname();

    // Función para verificar si un enlace está activo
    const isActive = (path) => {
        return pathname === path;
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Barra de navegación superior */}
            <nav className="bg-white shadow">
                <div className="mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="text-xl font-bold text-indigo-600">TradingSystem</span>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <Link
                                    href="/dashboard"
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/dashboard')
                                            ? 'border-indigo-500 text-gray-900'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                        }`}
                                >
                                    <BarChart size={18} className="mr-1" /> Dashboard
                                </Link>
                                <Link
                                    href="/operations"
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/operations') || isActive('/operations/new')
                                            ? 'border-indigo-500 text-gray-900'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                        }`}
                                >
                                    <LineChart size={18} className="mr-1" /> Operaciones
                                </Link>
                                <Link
                                    href="/rotation"
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive('/rotation')
                                            ? 'border-indigo-500 text-gray-900'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                        }`}
                                >
                                    <ArrowLeftRight size={18} className="mr-1" /> Rotación
                                </Link>
                            </div>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:items-center">
                            <button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                <Settings size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Menú móvil */}
                <div className="sm:hidden">
                    <div className="pt-2 pb-3 space-y-1">
                        <Link
                            href="/dashboard"
                            className={`flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive('/dashboard')
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                                }`}
                        >
                            <BarChart size={18} className="mr-2" /> Dashboard
                        </Link>
                        <Link
                            href="/operations"
                            className={`flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive('/operations') || isActive('/operations/new')
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                                }`}
                        >
                            <LineChart size={18} className="mr-2" /> Operaciones
                        </Link>
                        <Link
                            href="/rotation"
                            className={`flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive('/rotation')
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                                }`}
                        >
                            <ArrowLeftRight size={18} className="mr-2" /> Rotación
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Contenido principal */}
            <main className="py-6">
                {children}
            </main>
        </div>
    );
}