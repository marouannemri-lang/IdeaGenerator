'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Pencil, Phone } from 'lucide-react';
import Link from 'next/link';
import { ClientDialog } from '@/components/clients/create-client-dialog';

export default function ClientDetailsPage({ params }: { params: { id: string } }) {
    const [client, setClient] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('quotes');
    const [editOpen, setEditOpen] = React.useState(false);

    const loadClient = React.useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiClient.get(`/clients/${params.id}`);
            setClient(res.data);
        } catch (error) {
            console.error('Erreur loading client', error);
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    React.useEffect(() => {
        loadClient();
    }, [loadClient]);

    if (loading) return <div className="p-8">Chargement...</div>;
    if (!client) return <div className="p-8">Client introuvable</div>;

    const quotes = client.quotes || [];
    const invoices = client.invoices || [];
    const calls = client.calls || [];

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/clients">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1 flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">
                            {client.firstName} {client.lastName}
                        </h2>
                        <p className="text-muted-foreground">{client.companyName}</p>
                    </div>
                    <Button onClick={() => setEditOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" /> Modifier
                    </Button>
                </div>
            </div>

            <ClientDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                onSuccess={loadClient}
                client={client}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader><CardTitle>Coordonnées</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div><span className="font-semibold">Email:</span> {client.email}</div>
                        <div><span className="font-semibold">Tel:</span> {client.phoneNumber}</div>
                        <div><span className="font-semibold">Adresse:</span> {client.address}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Activité</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div><span className="font-semibold">Type:</span> {client.type}</div>
                        <div><span className="font-semibold">Total CA:</span> {client.totalRevenue?.toFixed(2) || 0} €</div>
                        <div><span className="font-semibold">Devis:</span> {quotes.length}</div>
                        <div><span className="font-semibold">Factures:</span> {invoices.length}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <div className="flex border-b gap-4">
                    {['quotes', 'invoices', 'calls'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 px-4 text-sm font-medium transition-colors capitalized ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {tab === 'quotes' && 'Devis'}
                            {tab === 'invoices' && 'Factures'}
                            {tab === 'calls' && 'Interventions / Appels'}
                        </button>
                    ))}
                </div>

                {activeTab === 'quotes' && (
                    <div className="space-y-2">
                        {quotes.map((q: any) => (
                            <div key={q.id} className="border p-4 rounded flex justify-between items-center hover:bg-slate-50 transition">
                                <div>
                                    <div className="font-bold">{q.quoteNumber} - {q.title}</div>
                                    <div className="text-sm text-muted-foreground">{new Date(q.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold">{q.total.toFixed(2)} €</span>
                                    <Link href={`/quotes/${q.id}`}>
                                        <Button size="sm" variant="outline">Ouvrir</Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                        {quotes.length === 0 && <p className="text-muted-foreground py-4">Aucun devis.</p>}
                    </div>
                )}

                {activeTab === 'invoices' && (
                    <div className="space-y-2">
                        {invoices.map((inv: any) => (
                            <div key={inv.id} className="border p-4 rounded flex justify-between items-center hover:bg-slate-50 transition">
                                <div>
                                    <div className="font-bold">{inv.invoiceNumber} - {inv.title}</div>
                                    <div className="text-sm text-muted-foreground">Echéance: {new Date(inv.dueDate).toLocaleDateString()}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-2 py-1 rounded text-xs ${inv.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{inv.status}</span>
                                    <span className="font-bold">{inv.total.toFixed(2)} €</span>
                                    <Link href={`/invoices/${inv.id}`}>
                                        <Button size="sm" variant="outline">Modifier</Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                        {invoices.length === 0 && <p className="text-muted-foreground py-4">Aucune facture.</p>}
                    </div>
                )}

                {activeTab === 'calls' && (
                    <div className="space-y-2">
                        {calls.map((call: any) => (
                            <div key={call.id} className="border p-4 rounded flex justify-between items-center bg-slate-50">
                                <div>
                                    <div className="font-bold flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        {call.callerNumber}
                                    </div>
                                    <div className="text-sm mt-1">{call.summary || 'Pas de résumé'}</div>
                                    <div className="text-xs text-muted-foreground mt-1">{new Date(call.createdAt).toLocaleString()}</div>
                                </div>
                                <div>
                                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 uppercase">{call.status}</span>
                                </div>
                            </div>
                        ))}
                        {calls.length === 0 && <p className="text-muted-foreground py-4">Aucun appel/intervention.</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
