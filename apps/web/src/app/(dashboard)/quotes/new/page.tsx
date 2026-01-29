'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { Trash2, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewQuotePage() {
    const router = useRouter();
    const [clients, setClients] = React.useState<any[]>([]);

    const { register, control, handleSubmit, watch, setValue } = useForm({
        defaultValues: {
            clientId: '',
            title: '',
            items: [{ description: '', quantity: 1, unitPrice: 0 }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    const items = watch('items');
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tva = subtotal * 0.20;
    const total = subtotal + tva;

    React.useEffect(() => {
        async function loadClients() {
            const res = await apiClient.get('/clients');
            setClients(res.data);
        };
        loadClients();
    }, []);

    const onSubmit = async (data: any) => {
        try {
            await apiClient.post('/quotes', data);
            router.push('/quotes');
        } catch (error) {
            console.error('Erreur création devis', error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/quotes">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h2 className="text-3xl font-bold tracking-tight">Nouveau Devis</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Informations Générales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Client</Label>
                            <select
                                {...register('clientId', { required: true })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Sélectionner un client</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName} {c.companyName ? `(${c.companyName})` : ''}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Titre du devis (Optionnel)</Label>
                            <Input {...register('title')} placeholder="Ex: Rénovation salle de bain" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Prestations & Produits</CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}>
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter une ligne
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-4 items-end bg-muted/50 p-4 rounded-lg">
                                <div className="col-span-6 space-y-2">
                                    <Label>Description</Label>
                                    <Input {...register(`items.${index}.description` as const, { required: true })} placeholder="Désignation" />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label>Qté</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                                    />
                                </div>
                                <div className="col-span-3 space-y-2">
                                    <Label>Prix Unitaire HT</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })}
                                            className="pr-8"
                                        />
                                        <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">€</span>
                                    </div>
                                </div>
                                <div className="col-span-1">
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-end pt-4 border-t">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Total HT</span>
                                    <span>{subtotal.toFixed(2)} €</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>TVA (20%)</span>
                                    <span>{tva.toFixed(2)} €</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2">
                                    <span>Total TTC</span>
                                    <span>{total.toFixed(2)} €</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Link href="/quotes">
                        <Button type="button" variant="outline">Annuler</Button>
                    </Link>
                    <Button type="submit" className="w-32">
                        Créer
                    </Button>
                </div>
            </form>
        </div>
    );
}
