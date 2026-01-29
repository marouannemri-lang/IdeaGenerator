'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-background">
            <div className="mb-6 rounded-full bg-muted p-6">
                <FileQuestion className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-3">Page introuvable</h2>
            <p className="text-muted-foreground mb-8 text-lg max-w-md">
                Désolé, l'adresse que vous cherchez n'existe pas.
                <br />
                <span className="text-sm mt-2 block italic text-muted-foreground/80">
                    (Vérifiez l'URL, par exemple <strong>dashbaord</strong> au lieu de <strong>dashboard</strong> 😉)
                </span>
            </p>
            <Link href="/dashboard">
                <Button size="lg">Retour au Tableau de Bord</Button>
            </Link>
        </div>
    );
}
