'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    BarChart3,
    Phone,
    FileText,
    Receipt,
    Users,
    Settings,
    LogOut,
    Package
} from 'lucide-react';

const routes = [
    {
        label: 'Tableau de bord',
        icon: BarChart3,
        href: '/dashboard',
        color: 'text-sky-500',
    },
    {
        label: 'Appels',
        icon: Phone,
        href: '/calls',
        color: 'text-violet-500',
    },
    {
        label: 'Devis',
        icon: FileText,
        href: '/quotes',
        color: 'text-pink-700',
    },
    {
        label: 'Factures',
        icon: Receipt,
        href: '/invoices',
        color: 'text-orange-700',
    },
    {
        label: 'Clients',
        icon: Users,
        href: '/clients',
        color: 'text-emerald-500',
    },
    {
        label: 'Produits',
        icon: Package,
        href: '/products',
        color: 'text-blue-500',
    },
    {
        label: 'Paramètres',
        icon: Settings,
        href: '/settings',
        color: 'text-gray-500',
    },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white">
            <div className="px-3 py-2 flex-1">
                <Link href="/dashboard" className="flex items-center pl-3 mb-14">
                    <h1 className="text-2xl font-bold">TalentFlow</h1>
                </Link>
                <div className="space-y-1">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                                pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                {route.label}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <div className="px-3 py-2">
                <Link
                    href="/login"
                    className="text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition text-zinc-400"
                    onClick={() => {
                        if (typeof window !== 'undefined') {
                            localStorage.removeItem('accessToken');
                            localStorage.removeItem('refreshToken');
                        }
                    }}
                >
                    <div className="flex items-center flex-1">
                        <LogOut className="h-5 w-5 mr-3 text-red-500" />
                        Déconnexion
                    </div>
                </Link>
            </div>
        </div>
    );
}
