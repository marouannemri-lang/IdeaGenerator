'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';

export function GeneralSettingsPanel() {
    const { register, handleSubmit, setValue } = useForm();
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        async function loadSettings() {
            try {
                const res = await apiClient.get('/settings');
                if (res.data) {
                    setValue('businessName', res.data.businessName);
                    // Note: User model has `email`, checking if it maps to `contactEmail` or if `contactEmail` was field.
                    // Schema: `email` is unique (login). `contactEmail` not in schema explicitly, maybe assumed same?
                    // Previous code mapped `contactEmail` to `email`? 
                    // Let's assume legacy code used `contactEmail` as a form field.
                    // My backend updateGeneralInfo expects `contactEmail` to update `email`.
                    setValue('contactEmail', res.data.email);

                    if (res.data.settings?.autoResponseSms) {
                        setValue('smsTemplate', res.data.settings.autoResponseSms);
                    }
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
            alert('Paramètres généraux sauvegardés !');
        } catch (error) {
            console.error(error);
            alert('Erreur lors de la sauvegarde.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4">Chargement...</div>;

    return (
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
                        <Label>Email de compte (Login)</Label>
                        <Input {...register('contactEmail')} placeholder="contact@entreprise.com" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>SMS Auto-réponse</CardTitle>
                    <CardDescription>Envoyé automatiquement après un appel manqué.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Message</Label>
                        <textarea
                            {...register('smsTemplate')}
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            placeholder="Bonjour, je suis actuellement en intervention..."
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                    {saving ? 'Sauvegarde...' : 'Enregistrer Modifications'}
                </Button>
            </div>
        </form>
    );
}
