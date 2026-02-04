'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { Plus, FileText, Download, FileCheck, Pencil } from 'lucide-react';
import { generateQuotePdf } from '@/lib/pdf-generator';
import { SearchInput } from '@/components/ui/search-input';

export default function QuotesPage() {
    const [quotes, setQuotes] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [currentUser, setCurrentUser] = React.useState<any>(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [showConverted, setShowConverted] = React.useState(false);

    const loadData = React.useCallback(async (search?: string) => {
        try {
            setLoading(true);
            const params = search ? `?search=${encodeURIComponent(search)}` : '';
            const [quotesRes, userRes] = await Promise.all([
                apiClient.get(`/quotes${params}`),
                Promise.resolve({ data: { firstName: 'Moi', lastName: 'Même', businessName: 'Mon Entreprise', email: 'me@test.com' } })
            ]);
            setQuotes(quotesRes.data);
            setCurrentUser(userRes.data);
        } catch (error) {
            console.error('Erreur chargement', error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            loadData(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, loadData]);

    const handleDownloadPdf = (e: React.MouseEvent, quote: any) => {
        e.stopPropagation();
        generateQuotePdf(quote, currentUser);
    };

    const handleConvertToInvoice = async (e: React.MouseEvent, quoteId: string) => {
        e.stopPropagation();
        if (!confirm('Voulez-vous transformer ce devis en facture ?')) return;

        try {
            await apiClient.post(`/invoices/from-quote/${quoteId}`, {});
            alert('Facture créée avec succès !');
            loadData(searchTerm); // Refresh to show updated status
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la création de la facture');
        }
    };

    const filteredQuotes = showConverted
        ? quotes
        : quotes.filter(q => q.status !== 'ACCEPTED' && !q.invoice);

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Devis</h2>
                <div className="flex items-center gap-4">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Rechercher un devis..."
                    />
                    <Link href="/quotes/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Créer un Devis
                        </Button>
                    </Link>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Historique des devis</CardTitle>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showConverted}
                            onChange={(e) => setShowConverted(e.target.checked)}
                            className="rounded"
                        />
                        Afficher les devis convertis
                    </label>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Chargement...</p>
                    ) : filteredQuotes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                            <FileText className="h-12 w-12 mb-4 opacity-50" />
                            <h3 className="text-lg font-medium text-foreground">Aucun devis</h3>
                            <p className="mb-4">Créez votre premier devis pour commencer.</p>
                            <Link href="/quotes/new">
                                <Button variant="outline">Créer maintenant</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredQuotes.map((quote) => (
                                <div key={quote.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{quote.quoteNumber} <span className="text-muted-foreground font-normal mx-2">|</span> {quote.title || 'Devis sans titre'}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {quote.client ? `${quote.client.firstName} ${quote.client.lastName}` : 'Client inconnu'}
                                                <span className="mx-2">•</span>
                                                {new Date(quote.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div className="font-bold text-lg mr-4">{quote.total.toFixed(2)} €</div>

                                        <Link href={`/quotes/${quote.id}`}>
                                            <Button variant="ghost" size="icon" title="Modifier">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </Link>

                                        <Button variant="ghost" size="icon" onClick={(e) => handleDownloadPdf(e, quote)} title="Télécharger PDF">
                                            <Download className="h-4 w-4" />
                                        </Button>

                                        <Button variant="ghost" size="icon" onClick={(e) => handleConvertToInvoice(e, quote.id)} title="Convertir en facture">
                                            <FileCheck className="h-4 w-4" />
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
