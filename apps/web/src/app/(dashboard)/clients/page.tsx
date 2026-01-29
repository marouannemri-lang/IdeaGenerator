'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateClientDialog } from '@/components/clients/create-client-dialog';
import { apiClient } from '@/lib/api-client';

export default function ClientsPage() {
    const [clients, setClients] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    const loadClients = React.useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/clients');
            setClients(res.data);
        } catch (error) {
            console.error('Erreur chargement clients', error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadClients();
    }, [loadClients]);

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
                <CreateClientDialog onSuccess={loadClients} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Liste des clients</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-sm text-gray-500">Chargement...</p>
                    ) : clients.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            Aucun client pour le moment.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {clients.map((client) => (
                                <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                                    <div>
                                        <h3 className="font-semibold">{client.firstName} {client.lastName}</h3>
                                        {client.companyName && <p className="text-sm font-medium">{client.companyName}</p>}
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {client.email && <span>{client.email} • </span>}
                                            {client.phoneNumber && <span>{client.phoneNumber}</span>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                            {client.type || 'PROSPECT'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
