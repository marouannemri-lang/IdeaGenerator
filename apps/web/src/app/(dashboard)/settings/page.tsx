'use client';

import * as React from 'react';
import PricingSection from '@/components/settings/pricing-section';
import { GeneralSettingsPanel } from '@/components/settings/general-settings-panel';
import { AISettingsPanel } from '@/components/settings/ai-settings-panel';
import { ServicesSettingsPanel } from '@/components/settings/services-settings-panel';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = React.useState("general");

    return (
        <div className="p-8 space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Paramètres</h2>
            </div>

            <div className="flex border-b border-gray-200 gap-4">
                <button
                    onClick={() => setActiveTab("general")}
                    className={`pb-3 px-1 text-sm font-medium transition-colors ${activeTab === "general"
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                >
                    Général
                </button>
                <button
                    onClick={() => setActiveTab("ai")}
                    className={`pb-3 px-1 text-sm font-medium transition-colors ${activeTab === "ai"
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                >
                    🤖 Assistant IA
                </button>
                <button
                    onClick={() => setActiveTab("services")}
                    className={`pb-3 px-1 text-sm font-medium transition-colors ${activeTab === "services"
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                >
                    📦 Catalogue Services
                </button>
            </div>

            <div className="mt-6">
                {activeTab === "general" && (
                    <div className="animate-in fade-in duration-300">
                        <GeneralSettingsPanel />
                    </div>
                )}
                {activeTab === "ai" && (
                    <div className="animate-in fade-in duration-300">
                        <AISettingsPanel />
                    </div>
                )}
                {activeTab === "services" && (
                    <div className="animate-in fade-in duration-300">
                        <ServicesSettingsPanel />
                    </div>
                )}
            </div>

            <div className="border-t pt-8 mt-12">
                <PricingSection />
            </div>
        </div>
    );
}
