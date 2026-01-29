import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="px-4 lg:px-6 h-14 flex items-center border-b">
                <Link className="flex items-center justify-center font-bold text-xl" href="#">
                    TalentFlow
                </Link>
                <nav className="ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-sm font-medium hover:underline underline-offset-4 flex items-center" href="/login">
                        Se connecter
                    </Link>
                    <Link href="/register">
                        <Button>Commencer</Button>
                    </Link>
                </nav>
            </header>
            <main className="flex-1">
                <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                                    L'Assistant IA pour les Artisans
                                </h1>
                                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                                    Automatisez vos devis, factures et appels manqués. Gagnez 3h/semaine pour vous concentrer sur votre métier.
                                </p>
                            </div>
                            <div className="space-x-4">
                                <Link href="/register">
                                    <Button className="h-11 px-8">Essayer Gratuitement</Button>
                                </Link>
                                <Link href="/login">
                                    <Button variant="outline" className="h-11 px-8">Se connecter</Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
                <p className="text-xs text-gray-500 dark:text-gray-400">© 2026 TalentFlow. Tous droits réservés.</p>
                <nav className="sm:ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-xs hover:underline underline-offset-4" href="#">
                        Mentions Légales
                    </Link>
                    <Link className="text-xs hover:underline underline-offset-4" href="#">
                        Confidentialité
                    </Link>
                </nav>
            </footer>
        </div>
    );
}
