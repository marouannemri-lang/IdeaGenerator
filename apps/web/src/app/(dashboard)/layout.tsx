'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { UserMenu } from '@/components/layout/user-menu';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-full relative">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
                <Sidebar />
            </div>
            <main className="md:pl-72 bg-gray-50 min-h-screen">
                {/* Top Navigation Bar */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-4">
                    <div className="flex items-center justify-end">
                        <UserMenu />
                    </div>
                </div>
                {children}
            </main>
        </div>
    );
}
