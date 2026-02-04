"use client";

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export default function AIConfigurationPage() {
    const [settings, setSettings] = useState({
        ai_tone: 'professional',
        ai_name: 'Assistant',
        welcome_message: '',
        custom_system_prompt: '',
        specialties: [] as string[],
        max_auto_quote_amount: 500
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await apiClient.get('/settings');
            if (response.data && response.data.ai_settings) {
                // Merge defaults with received data
                setSettings(prev => ({
                    ...prev,
                    ...response.data.ai_settings
                }));
            }
        } catch (e) {
            console.error("Erreur chargement settings:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await apiClient.put('/settings/ai', settings);
            alert('Configuration sauvegardée !');
        } catch (e) {
            console.error(e);
            alert('Erreur lors de la sauvegarde');
        }
    };

    if (loading) return <div className="p-8">Chargement de la configuration...</div>;

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white shadow rounded-lg">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Configuration de l'Assistant IA</h1>

            {/* Ton de l'IA */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                    Ton de l'assistant IA
                </label>
                <select
                    value={settings.ai_tone}
                    onChange={(e) => setSettings({ ...settings, ai_tone: e.target.value })}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                    <option value="professional">Professionnel</option>
                    <option value="friendly">Amical</option>
                    <option value="formal">Formel</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                    Comment l'IA doit s'exprimer avec vos clients
                </p>
            </div>

            {/* Nom de l'IA */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                    Nom de l'assistant
                </label>
                <input
                    type="text"
                    value={settings.ai_name}
                    onChange={(e) => setSettings({ ...settings, ai_name: e.target.value })}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Sophie, Assistant Pro, etc."
                />
            </div>

            {/* Message d'accueil */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                    Message d'accueil personnalisé
                </label>
                <textarea
                    value={settings.welcome_message || ''}
                    onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Bonjour ! Comment puis-je vous aider aujourd'hui ?"
                />
            </div>

            {/* Spécialités */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                    Vos spécialités (Taper Entrée pour ajouter)
                </label>
                <input
                    type="text"
                    placeholder="Ex: Plomberie d'urgence, Chauffage, Climatisation"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            const value = e.currentTarget.value;
                            if (value) {
                                setSettings({
                                    ...settings,
                                    specialties: [...(settings.specialties || []), value]
                                });
                                e.currentTarget.value = '';
                            }
                        }
                    }}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                    {(settings.specialties || []).map((spec, i) => (
                        <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                            {spec}
                            <button
                                onClick={() => setSettings({
                                    ...settings,
                                    specialties: settings.specialties.filter((_, idx) => idx !== i)
                                })}
                                className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            </div>

            {/* Montant max devis auto */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                    Montant maximum pour devis automatique (€)
                </label>
                <input
                    type="number"
                    value={settings.max_auto_quote_amount}
                    onChange={(e) => setSettings({ ...settings, max_auto_quote_amount: Number(e.target.value) })}
                    className="w-full p-2 border rounded"
                />
                <p className="text-sm text-gray-500 mt-1">
                    Au-delà de ce montant, vous devrez valider le devis manuellement
                </p>
            </div>

            {/* Prompt personnalisé (avancé) */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                    Prompt système personnalisé (Avancé)
                </label>
                <textarea
                    value={settings.custom_system_prompt || ''}
                    onChange={(e) => setSettings({ ...settings, custom_system_prompt: e.target.value })}
                    className="w-full p-2 border rounded font-mono text-sm bg-gray-50"
                    rows={10}
                    placeholder="Laissez vide pour utiliser le prompt par défaut..."
                />
                <p className="text-sm text-gray-500 mt-1">
                    ⚠️ Si rempli, remplace entièrement la logique par défaut de l'IA.
                </p>
            </div>

            {/* Bouton sauvegarder */}
            <button
                onClick={handleSave}
                className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
                💾 Sauvegarder la configuration
            </button>
        </div>
    );
}
