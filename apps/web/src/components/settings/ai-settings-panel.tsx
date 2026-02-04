"use client";

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AISettingsPanel() {
    const [settings, setSettings] = useState({
        ai_tone: 'professional',
        ai_name: 'Assistant',
        welcome_message: '',
        custom_system_prompt: '',
        specialties: [] as string[],
        max_auto_quote_amount: 500
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await apiClient.get('/settings');
            if (response.data && response.data.ai_settings) {
                setSettings(prev => ({
                    ...prev,
                    ...response.data.ai_settings
                }));
            }
        } catch (e) {
            console.error("Erreur chargement settings IA:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiClient.put('/settings/ai', settings);
            // Using window.alert for simplicity as in original code
            alert('Configuration IA sauvegardée !');
        } catch (e) {
            console.error(e);
            alert('Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4">Chargement de la configuration IA...</div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Identité de l'Assistant</CardTitle>
                    <CardDescription>Personnalisez l'apparence et le comportement de votre IA.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Nom de l'assistant</Label>
                        <Input
                            value={settings.ai_name}
                            onChange={(e) => setSettings({ ...settings, ai_name: e.target.value })}
                            placeholder="Ex: Sophie"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Ton de la conversation</Label>
                        <select
                            value={settings.ai_tone}
                            onChange={(e) => setSettings({ ...settings, ai_tone: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="professional">Professionnel</option>
                            <option value="friendly">Amical</option>
                            <option value="formal">Formel</option>
                        </select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Message d'accueil</Label>
                        <textarea
                            value={settings.welcome_message || ''}
                            onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            placeholder="Bonjour ! Comment puis-je vous aider ?"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Expertise & Services</CardTitle>
                    <CardDescription>Aidez l'IA à mieux vendre vos services.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Spécialités (Appuyez sur Entrée pour ajouter)</Label>
                        <Input
                            placeholder="Ex: Plomberie, Chauffage"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault(); // Prevent form submission if inside form
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
                        <div className="flex flex-wrap gap-2 mt-2">
                            {(settings.specialties || []).map((spec, i) => (
                                <span key={i} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                    {spec}
                                    <button
                                        type="button"
                                        onClick={() => setSettings({
                                            ...settings,
                                            specialties: settings.specialties.filter((_, idx) => idx !== i)
                                        })}
                                        className="hover:text-destructive font-bold"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Montant Max Devis Auto (€)</Label>
                        <Input
                            type="number"
                            value={settings.max_auto_quote_amount}
                            onChange={(e) => setSettings({ ...settings, max_auto_quote_amount: Number(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground">Au-delà, l'IA demandera une validation humaine.</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Configuration Avancée</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Prompt Système Personnalisé</Label>
                        <textarea
                            value={settings.custom_system_prompt || ''}
                            onChange={(e) => setSettings({ ...settings, custom_system_prompt: e.target.value })}
                            className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            placeholder="Remplace entièrement la logique de l'IA (Expert uniquement)..."
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Sauvegarde...' : 'Sauvegarder Configuration IA'}
                </Button>
            </div>
        </div>
    );
}
