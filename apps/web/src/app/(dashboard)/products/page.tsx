'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { apiClient } from '@/lib/api-client';
import { ExternalLink, Plus } from 'lucide-react';

interface ExternalProduct {
    id: string;
    name: string;
    price: number;
    description?: string;
    imageUrl?: string;
    source: string;
    url: string;
}

export default function ProductsPage() {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [products, setProducts] = React.useState<ExternalProduct[]>([]);
    const [loading, setLoading] = React.useState(false);

    const searchProducts = React.useCallback(async (query: string) => {
        if (!query || query.length < 3) {
            setProducts([]);
            return;
        }

        try {
            setLoading(true);
            const res = await apiClient.get(`/external-catalog/search?q=${encodeURIComponent(query)}`);
            setProducts(res.data);
        } catch (error) {
            console.error('Erreur recherche produits', error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            searchProducts(searchTerm);
        }, 500); // Debounce 500ms (scraping peut être lent)

        return () => clearTimeout(timer);
    }, [searchTerm, searchProducts]);

    const handleAddToQuote = (product: ExternalProduct) => {
        // TODO: Intégrer avec le formulaire de devis via Context/State global
        alert(`Produit "${product.name}" ajouté ! (Fonctionnalité à implémenter)`);
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Catalogue Externe</h2>
                    <p className="text-muted-foreground mt-1">Recherchez des produits sur Leroy Merlin, Bricoman...</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Rechercher un produit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Ex: serrure 3 points, robinet, parquet..."
                    />

                    {loading && (
                        <div className="text-center py-8 text-muted-foreground">
                            Recherche en cours...
                        </div>
                    )}

                    {!loading && products.length === 0 && searchTerm.length >= 3 && (
                        <div className="text-center py-8 text-muted-foreground">
                            Aucun produit trouvé pour "{searchTerm}"
                        </div>
                    )}

                    {!loading && searchTerm.length > 0 && searchTerm.length < 3 && (
                        <div className="text-center py-8 text-muted-foreground">
                            Tapez au moins 3 caractères pour rechercher
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.map((product) => (
                            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                {product.imageUrl && (
                                    <div className="aspect-square bg-gray-100">
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <CardContent className="p-4 space-y-3">
                                    <div>
                                        <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                                        {product.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                                {product.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-bold text-primary">
                                            {product.price.toFixed(2)} €
                                        </span>
                                        <span className="text-xs text-muted-foreground uppercase">
                                            {product.source.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => window.open(product.url, '_blank')}
                                        >
                                            <ExternalLink className="h-4 w-4 mr-1" />
                                            Voir
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleAddToQuote(product)}
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Ajouter
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
