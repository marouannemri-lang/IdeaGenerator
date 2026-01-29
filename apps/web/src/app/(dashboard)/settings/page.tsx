'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import PricingSection from '@/components/settings/pricing-section';

export default function SettingsPage() {
    const { register, handleSubmit, setValue } = useForm();
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        async function loadSettings() {
            try {
                const res = await apiClient.get('/settings');
                if (res.data) {
                    setValue('businessName', res.data.businessName);
                    setValue('contactEmail', res.data.contactEmail);
                    setValue('smsTemplate', res.data.smsTemplate);
                }
            } catch (error) {
                console.error('Erreur chargement paramètres', error);
            } finally {
                setLoading(false);
            }
        }
        loadSettings();
    }, [setValue]);

    const onSubmit = async (data: any) => {
        setSaving(true);
        try {
            await apiClient.patch('/settings', data);
            alert('Paramètres sauvegardés avec succès !');
        } catch (error) {
            console.error(error);
            alert('Erreur lors de la sauvegarde.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Chargement des paramètres...</div>;

    return (
        <div className="p-8 space-y-8 max-w-3xl">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Paramètres</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Identité de l'entreprise</CardTitle>
                        <CardDescription>Ces informations apparaîtront sur vos devis et factures.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Nom commercial</Label>
                            <Input {...register('businessName')} placeholder="Ma Super Entreprise" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Email de contact (Public)</Label>
                            <Input {...register('contactEmail')} placeholder="contact@entreprise.com" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Assistant IA & SMS</CardTitle>
                        <CardDescription>Configurez comment l'IA interagit avec vos clients.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Message SMS Auto-réponse</Label>
                            <textarea
                                {...register('smsTemplate')}
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="Bonjour, je suis actuellement en intervention..."
                            />
                            <p className="text-xs text-muted-foreground">Envoyé automatiquement après un appel manqué.</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
                    </Button>
                </div>
            </form>

            <div className="border-t pt-8">
                <PricingSection />
            </div>
        </div>
    );
}
