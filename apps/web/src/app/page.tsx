export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <h1 className="text-4xl font-bold">Bienvenue sur TalentFlow</h1>
            <p className="mt-4 text-xl">L'assistant IA pour les artisans</p>

            <div className="mt-8">
                <a href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Se connecter
                </a>
            </div>
        </div>
    );
}
