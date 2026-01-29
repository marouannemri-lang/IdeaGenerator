'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, FileText, Receipt, ArrowUpRight } from "lucide-react";
import { apiClient } from '@/lib/api-client';

export default function DashboardPage() {
    const [stats, setStats] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        async function loadStats() {
            try {
                const res = await apiClient.get('/dashboard/stats');
                setStats(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        loadStats();
    }, []);

    if (loading) return <div className="p-8">Chargement...</div>;
    if (!stats) return <div className="p-8">Erreur de chargement</div>;

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Chiffre d'affaires (Mois)
                        </CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.monthlyRevenue.toFixed(2)} €</div>
                        <p className="text-xs text-muted-foreground">
                            Facturé ce mois-ci
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Devis en attente
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingQuotesCount}</div>
                        <p className="text-xs text-muted-foreground">
                            À relancer
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Appels manqués
                        </CardTitle>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.newCallsCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Nouveaux appels à traiter
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Activité récente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.recentActivity.length === 0 ? (
                            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                                Aucune activité récente à afficher
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {stats.recentActivity.map((act: any) => (
                                    <div key={act.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-medium text-sm">{act.title}</p>
                                            <p className="text-xs text-muted-foreground">{act.clientName} • {new Date(act.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="font-bold text-sm">
                                            {act.amount.toFixed(2)} €
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Appels Récents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                            Aucun appel récent
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
