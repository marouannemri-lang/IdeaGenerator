'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { Receipt, Download, MoreVertical, CheckCircle2, XCircle, CreditCard, Pencil } from 'lucide-react';
import { generateInvoicePdf } from '@/lib/pdf-generator';
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SearchInput } from '@/components/ui/search-input';

export default function InvoicesPage() {
    const [invoices, setInvoices] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState('');
    const currentUser = { firstName: 'Moi', lastName: 'Même', businessName: 'Mon Entreprise', email: 'me@test.com' };

    const loadInvoices = React.useCallback(async (search?: string) => {
        try {
            setLoading(true);
            const params = search ? `?search=${encodeURIComponent(search)}` : '';
            const res = await apiClient.get(`/invoices${params}`);
            setInvoices(res.data);
        } catch (error) {
            console.error('Erreur chargement factures', error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            loadInvoices(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, loadInvoices]);

    const handleDownloadPdf = (e: React.MouseEvent, invoice: any) => {
        e.stopPropagation();
        generateInvoicePdf(invoice, currentUser);
    };

    const handleStatusChange = async (invoiceId: string, status: string) => {
        try {
            await apiClient.patch(`/invoices/${invoiceId}/status`, { status });
            loadInvoices(); // Recharge la liste
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la mise à jour");
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Factures</h2>
                <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Rechercher une facture..."
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historique des factures</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Chargement...</p>
                    ) : invoices.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            Aucune facture. Créez des devis et convertissez-les pour générer des factures.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {invoices.map((invoice) => (
                                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-orange-100 text-orange-600">
                                            <Receipt className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{invoice.invoiceNumber} <span className="text-muted-foreground font-normal mx-2">|</span> {invoice.title || 'Facture sans titre'}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {invoice.client ? `${invoice.client.firstName} ${invoice.client.lastName}` : 'Client inconnu'}
                                                <span className="mx-2">•</span>
                                                Echéance: {new Date(invoice.dueDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div className="font-bold text-lg mr-4">{invoice.total.toFixed(2)} €</div>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold mr-4 ${invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                            invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {invoice.status === 'PENDING' ? 'EN ATTENTE' : invoice.status === 'PAID' ? 'PAYÉE' : invoice.status}
                                        </span>

                                        <Link href={`/invoices/${invoice.id}`}>
                                            <Button variant="ghost" size="icon" title="Modifier">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </Link>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={(e) => handleDownloadPdf(e, invoice)}>
                                                    <Download className="mr-2 h-4 w-4" /> Télécharger PDF
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuLabel>Changer Statut</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'PAID')} disabled={invoice.status === 'PAID'}>
                                                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Marquer comme Payée
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'PENDING')} disabled={invoice.status === 'PENDING'}>
                                                    Remettre En Attente
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'CANCELLED')} className="text-red-600">
                                                    <XCircle className="mr-2 h-4 w-4" /> Annuler la facture
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
