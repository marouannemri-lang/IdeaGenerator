'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { Trash2, Plus, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function EditQuotePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [clients, setClients] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [quoteNumber, setQuoteNumber] = React.useState('');
    const [services, setServices] = React.useState<any[]>([]);

    const { register, control, handleSubmit, watch, reset, setValue } = useForm({
        defaultValues: {
            clientId: '',
            title: '',
            items: [{ description: '', quantity: 1, unitPrice: 0 }],
            validUntil: ''
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    const items = watch('items');
    const safeItems = Array.isArray(items) ? items : [];
    const subtotal = safeItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
    const tva = subtotal * 0.20;
    const total = subtotal + tva;

    React.useEffect(() => {
        async function loadData() {
            try {
                const [clientsRes, quoteRes, servicesRes] = await Promise.all([
                    apiClient.get('/clients'),
                    apiClient.get(`/quotes/${params.id}`),
                    apiClient.get('/settings/services')
                ]);

                setClients(clientsRes.data);
                setServices(servicesRes.data);

                const quote = quoteRes.data;
                setQuoteNumber(quote.quoteNumber);

                reset({
                    clientId: quote.clientId,
                    title: quote.title || '',
                    items: quote.items.map((i: any) => ({
                        description: i.description,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice
                    })),
                    validUntil: quote.validUntil ? new Date(quote.validUntil).toISOString().split('T')[0] : ''
                });
            } catch (error) {
                console.error('Erreur chargement', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [params.id, reset]);

    const onSubmit = async (data: any) => {
        try {
            await apiClient.patch(`/quotes/${params.id}`, data);
            router.push('/quotes');
        } catch (error) {
            console.error('Erreur modification devis', error);
            alert("Erreur lors de la sauvegarde.");
        }
    };

    if (loading) return <div className="p-8 text-center">Chargement du devis...</div>;

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/quotes">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h2 className="text-3xl font-bold tracking-tight">Modifier Devis {quoteNumber}</h2>
                </div>
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
                            <Label>Titre du devis</Label>
                            <Input {...register('title')} placeholder="Ex: Rénovation salle de bain" />
                        </div>

                        <div className="grid gap-2">
                            <Label>Validité</Label>
                            <Input {...register('validUntil')} type="date" />
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
                                    <div className="flex justify-between items-center">
                                        <Label>Description</Label>
                                        {services.length > 0 && (
                                            <select
                                                className="text-xs h-6 max-w-[150px] rounded border border-input bg-background px-2 overflow-hidden text-ellipsis whitespace-nowrap"
                                                onChange={(e) => {
                                                    const s = services.find(x => x.id === e.target.value);
                                                    if (s) {
                                                        setValue(`items.${index}.description`, s.name);
                                                        setValue(`items.${index}.unitPrice`, Number(s.basePrice));
                                                    }
                                                    e.target.value = "";
                                                }}
                                            >
                                                <option value="">Importer Modèle...</option>
                                                {services.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} ({s.basePrice}€)</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
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
                        <Save className="mr-2 h-4 w-4" /> Enregistrer
                    </Button>
                </div>
            </form>
        </div>
    );
}
