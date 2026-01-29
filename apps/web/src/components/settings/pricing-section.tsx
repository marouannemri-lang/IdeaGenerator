'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

const pricingPlans = [
    {
        name: 'Découverte',
        price: '0 €',
        period: '/mois',
        description: 'Idéal pour tester la plateforme sans engagement.',
        features: [
            'Génération illimitée de Devis & Factures',
            'Gestion de 5 Clients max',
            'Dashboard simplifié',
            'Support par email'
        ],
        cta: 'Actuel',
        current: true
    },
    {
        name: 'Pro',
        price: '29 €',
        period: '/mois',
        description: 'Tout pour automatiser votre activité d\'artisan.',
        features: [
            'Clients illimités',
            'Assistant IA & Téléphonie (Appels manqués)',
            'Relances automatiques par SMS',
            'Personnalisation complète (Logo)',
            'Support prioritaire'
        ],
        cta: 'Passer en Pro',
        popular: true
    },
    {
        name: 'Entreprise',
        price: '99 €',
        period: '/mois',
        description: 'Pour les PME avec plusieurs employés.',
        features: [
            'Tous les avantages Pro',
            'Multi-utilisateurs (5 comptes)',
            'API & Intégrations CRM',
            'Account Manager dédié'
        ],
        cta: 'Nous contacter'
    }
];

export default function PricingSection() {
    return (
        <div className="py-8">
            <div className="mb-8">
                <h3 className="text-2xl font-bold tracking-tight mb-2">Abonnement</h3>
                <p className="text-muted-foreground">Gérez votre formule et votre facturation.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {pricingPlans.map((plan) => (
                    <Card key={plan.name} className={plan.popular ? 'border-primary shadow-lg scale-105' : ''}>
                        <CardHeader>
                            {plan.popular && (
                                <Badge className="w-fit mb-2 bg-primary text-primary-foreground">Populaire</Badge>
                            )}
                            <CardTitle>{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-baseline">
                                <span className="text-3xl font-bold">{plan.price}</span>
                                <span className="text-muted-foreground">{plan.period}</span>
                            </div>
                            <ul className="space-y-2 text-sm">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center">
                                        <Check className="h-4 w-4 mr-2 text-green-500" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" variant={plan.current ? "outline" : "default"} disabled={plan.current}>
                                {plan.cta}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
