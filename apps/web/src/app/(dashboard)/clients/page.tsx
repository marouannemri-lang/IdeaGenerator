'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientDialog } from '@/components/clients/create-client-dialog';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import { SearchInput } from '@/components/ui/search-input';

export default function ClientsPage() {
    const [clients, setClients] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [selectedClient, setSelectedClient] = React.useState<any>(null);
    const [searchTerm, setSearchTerm] = React.useState('');

    const loadClients = React.useCallback(async (search?: string) => {
        try {
            setLoading(true);
            const params = search ? `?search=${encodeURIComponent(search)}` : '';
            const res = await apiClient.get(`/clients${params}`);
            setClients(res.data);
        } catch (error) {
            console.error('Erreur chargement clients', error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            loadClients(searchTerm);
        }, 300); // Debounce 300ms

        return () => clearTimeout(timer);
    }, [searchTerm, loadClients]);

    const handleCreate = () => {
        setSelectedClient(null);
        setDialogOpen(true);
    };

    const handleEdit = (client: any) => {
        setSelectedClient(client);
        setDialogOpen(true);
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
                <div className="flex items-center gap-4">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Rechercher un client..."
                    />
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nouveau Client
                    </Button>
                </div>
            </div>

            <ClientDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSuccess={loadClients}
                client={selectedClient}
            />

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
                                        <Link href={`/clients/${client.id}`} className="hover:underline text-primary">
                                            <h3 className="font-semibold text-lg">{client.firstName} {client.lastName}</h3>
                                        </Link>
                                        {client.companyName && <p className="text-sm font-medium">{client.companyName}</p>}
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {client.email && <span>{client.email} • </span>}
                                            {client.phoneNumber && <span>{client.phoneNumber}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                            {client.type || 'PROSPECT'}
                                        </span>
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                                            <Pencil className="h-4 w-4 text-gray-500" />
                                        </Button>
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
