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

export default function EditInvoicePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [loading, setLoading] = React.useState(true);
    const [invoiceNumber, setInvoiceNumber] = React.useState('');

    const { register, control, handleSubmit, watch, reset } = useForm({
        defaultValues: {
            title: '',
            status: '',
            dueDate: '',
            items: [{ description: '', quantity: 1, unitPrice: 0 }],
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
                const res = await apiClient.get(`/invoices/${params.id}`);
                const inv = res.data;

                if (inv) {
                    setInvoiceNumber(inv.invoiceNumber);
                    reset({
                        title: inv.title || '',
                        status: inv.status,
                        dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
                        items: inv.items ? inv.items.map((i: any) => ({
                            description: i.description,
                            quantity: i.quantity,
                            unitPrice: i.unitPrice
                        })) : []
                    });
                }
            } catch (error) {
                console.error('Erreur loading invoice', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [params.id, reset]);

    const onSubmit = async (data: any) => {
        try {
            await apiClient.patch(`/invoices/${params.id}`, data);
            router.push('/invoices');
        } catch (error) {
            console.error(error);
            alert("Erreur sauvegarde");
        }
    };

    if (loading) return <div>Chargement...</div>;

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/invoices">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h2 className="text-3xl font-bold tracking-tight">Modifier Facture {invoiceNumber}</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Titre</Label>
                            <Input {...register('title')} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Echéance</Label>
                            <Input type="date" {...register('dueDate')} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Statut</Label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2" {...register('status')}>
                                <option value="PENDING">En attente</option>
                                <option value="PAID">Payée</option>
                                <option value="OVERDUE">En retard</option>
                                <option value="CANCELLED">Annulée</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex justify-between flex-row">
                        <CardTitle>Lignes</CardTitle>
                        <Button type="button" size="sm" onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}>
                            <Plus className="mr-2 h-4 w-4" /> Ajouter
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-4 items-end bg-muted/50 p-4 rounded-lg">
                                <div className="col-span-6"><Label>Description</Label><Input {...register(`items.${index}.description` as const)} /></div>
                                <div className="col-span-2"><Label>Qté</Label><Input type="number" step="0.1" {...register(`items.${index}.quantity` as const, { valueAsNumber: true })} /></div>
                                <div className="col-span-3"><Label>Prix</Label><Input type="number" step="0.01" {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })} /></div>
                                <div className="col-span-1"><Button type="button" variant="ghost" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div>
                            </div>
                        ))}
                        <div className="flex justify-end pt-4 border-t">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between font-bold text-lg border-t pt-2">
                                    <span>Total TTC (approx)</span>
                                    <span>{total.toFixed(2)} €</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="submit"><Save className="mr-2 h-4 w-4" /> Enregistrer</Button>
                </div>
            </form>
        </div>
    )
}
