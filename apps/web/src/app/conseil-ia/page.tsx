"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { Loader2, CheckCircle2, AlertCircle, FileText, BrainCircuit, RefreshCw } from "lucide-react";

// --- Types ---

const formSchema = z.object({
    sujet_utilisateur: z.string().min(10, "Le sujet doit être détaillé (min 10 car.)"),
    nombre_iterations: z.number().min(3).max(20).default(5),
    activer_expert_risques: z.boolean().default(true),
    mode_laxiste: z.boolean().default(false),
    mode_business_laxiste: z.boolean().default(false),
    contraintes_personnalisees: z.string().optional(), // Sera transformé en array
});

type FormData = z.infer<typeof formSchema>;

interface ExecutionStatus {
    execution_id: string;
    status: 'running' | 'completed' | 'error';
    progress: number;
}

interface ConseilIAResult {
    configuration: any;
    sujet: {
        original: string;
        valide: string;
        contraintes: {
            validation_initiale_ok: boolean;
            raison_rejet: string;
        };
    };
    resultats: {
        rapport: {
            synthese_executive: string; // Markdown
            metadata: {
                nombre_iterations_reelles: number;
                cout_estime_euros: number;
                duree_totale_minutes: number;
                tokens_totaux: number;
            };
        };
        consensus: {
            atteint: boolean;
            score_final: number;
        };
        metriques: any;
    };
    logs: {
        evenements: Array<{ timestamp: string; message: string }>;
    };
    metadata: {
        duree_totale: string;
    };
}

// --- Page Component ---

export default function ConseilIAPage() {
    const [executionId, setExecutionId] = useState<string | null>(null);
    const [status, setStatus] = useState<ExecutionStatus | null>(null);
    const [result, setResult] = useState<ConseilIAResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nombre_iterations: 5,
            activer_expert_risques: true,
            contraintes_personnalisees: "",
        },
    });

    // Polling pour le statut
    useEffect(() => {
        if (!executionId || status?.status === 'completed' || status?.status === 'error') return;

        const interval = setInterval(async () => {
            try {
                const res = await axios.get(`http://localhost:3001/api/conseil-ia/status/${executionId}`);
                setStatus(res.data);

                // Si terminé, récupérer le résultat
                if (res.data.status === 'completed') {
                    const resultRes = await axios.get(`http://localhost:3001/api/conseil-ia/result/${executionId}`);
                    console.log('✅ Résultat complet reçu:', resultRes.data.data);
                    setResult(resultRes.data.data);
                    setLogs(resultRes.data.data.logs.evenements.map((e: any) => `[${new Date(e.timestamp).toLocaleTimeString()}] ${e.message}`));
                }
            } catch (err) {
                console.error("Erreur polling", err);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [executionId, status?.status]);

    const onSubmit = async (data: FormData) => {
        setError(null);
        setResult(null);
        setLogs([]);
        setStatus(null);

        try {
            // Transformation des contraintes (string -> array)
            const contraintes = data.contraintes_personnalisees
                ? data.contraintes_personnalisees.split('\n').filter(line => line.trim() !== "")
                : [];

            const payload: any = {
                ...data,
                contraintes_personnalisees: contraintes,
            };

            // Configuration du Gardien selon le mode
            if (data.mode_laxiste) {
                payload.regles_interdites_override = ["Aucun contenu illégal ou incitant à la haine"];
                payload.domaines_exclus_override = ["contenu illégal"];
            }

            if (data.mode_business_laxiste) {
                payload.regles_obligatoires_override = ["Projet innovant et réalisable à long terme"];
            }

            const res = await axios.post("http://localhost:3001/api/conseil-ia/start", payload);
            setExecutionId(res.data.execution_id);
            setStatus({ execution_id: res.data.execution_id, status: 'running', progress: 0 });
            setLogs(["Démarrage du Conseil des IA..."]);
        } catch (err: any) {
            setError(err.response?.data?.error || "Erreur lors du démarrage");
        }
    };

    const handleReset = () => {
        setExecutionId(null);
        setStatus(null);
        setResult(null);
        form.reset();
    };

    return (
        <div className="container mx-auto py-10 px-4 max-w-5xl">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
                    <BrainCircuit className="w-10 h-10 text-indigo-600" />
                    Conseil des IA
                </h1>
                <p className="text-gray-600">
                    Générez des idées validées par un panel d&apos;experts IA (Technique, Business, UX, Risques).
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Colonne Gauche : Configuration */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5" /> Configuration
                        </h2>

                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Sujet de l&apos;idée</label>
                                <textarea
                                    {...form.register("sujet_utilisateur")}
                                    className="w-full p-2 border rounded-md min-h-[100px] text-sm"
                                    placeholder="Ex: SaaS B2B pour la gestion de chantiers..."
                                />
                                {form.formState.errors.sujet_utilisateur && (
                                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.sujet_utilisateur.message}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Itérations</label>
                                    <input
                                        type="number"
                                        {...form.register("nombre_iterations", { valueAsNumber: true })}
                                        className="w-full p-2 border rounded-md text-sm"
                                    />
                                </div>
                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            {...form.register("activer_expert_risques")}
                                            className="rounded border-gray-300"
                                        />
                                        Expert Risques
                                    </label>
                                </div>
                            </div>

                            <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                                <label className="flex items-center gap-2 text-sm font-medium text-orange-900 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        {...form.register("mode_laxiste")}
                                        className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                                    />
                                    Mode Test (Permissif)
                                </label>
                                <p className="text-xs text-orange-700 mt-1 ml-5">
                                    Désactive les blocages stricts (santé, juridique...) pour le test.
                                </p>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                <label className="flex items-center gap-2 text-sm font-medium text-blue-900 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        {...form.register("mode_business_laxiste")}
                                        className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    Mode Gros Budget (Licorne)
                                </label>
                                <p className="text-xs text-blue-700 mt-1 ml-5">
                                    Autorise budgets &gt; 50k€ et rentabilité &gt; 12 mois.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Contraintes (1 par ligne)</label>
                                <textarea
                                    {...form.register("contraintes_personnalisees")}
                                    className="w-full p-2 border rounded-md min-h-[80px] text-sm"
                                    placeholder="Marché FR uniquement..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status?.status === 'running'}
                                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-all"
                            >
                                {status?.status === 'running' ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Analyse en cours...
                                    </>
                                ) : (
                                    "Lancer le Conseil"
                                )}
                            </button>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    {error}
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Logs */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 h-[300px] overflow-y-auto text-xs font-mono">
                        <h3 className="font-semibold mb-2 text-gray-500 uppercase text-[10px]">Journal d&apos;exécution</h3>
                        {logs.length === 0 ? (
                            <span className="text-gray-400 italic">En attente de démarrage...</span>
                        ) : (
                            <ul className="space-y-1">
                                {logs.map((log, i) => (
                                    <li key={i} className="text-gray-600 border-l-2 border-indigo-100 pl-2 py-0.5 animate-in fade-in slide-in-from-left-1 duration-300">
                                        {log}
                                    </li>
                                ))}
                                {status?.status === 'running' && (
                                    <li className="flex items-center gap-2 text-indigo-500 mt-2 animate-pulse">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Traitement en cours...
                                    </li>
                                )}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Colonne Droite : Résultats */}
                <div className="md:col-span-2">
                    {result && result.sujet && result.sujet.contraintes && result.sujet.contraintes.validation_initiale_ok === false ? (
                        <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                            <h2 className="text-xl font-bold text-red-700 mb-2 flex items-center gap-2">
                                <AlertCircle className="w-6 h-6" /> Sujet Rejeté par le Gardien
                            </h2>
                            <p className="text-red-900 font-medium mb-4">
                                {result.sujet.contraintes.raison_rejet || "Le sujet ne respecte pas les critères de validation."}
                            </p>

                            <div className="bg-white p-4 rounded-lg border border-red-100 text-sm text-gray-700">
                                <p className="font-semibold mb-2">Conseil :</p>
                                <p>{result.sujet.valide || "Reformulez votre demande en évitant les sujets exclus (santé, juridique, etc.)"}</p>
                            </div>

                            <button
                                onClick={handleReset}
                                className="mt-6 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition w-full md:w-auto"
                            >
                                Modifier et Réessayer
                            </button>
                        </div>
                    ) : result && result.resultats ? (
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                            <div className="bg-indigo-50 p-6 border-b border-indigo-100 flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-indigo-900 mb-1">Rapport Final</h2>
                                    <div className="flex gap-4 text-sm text-indigo-700">
                                        <span className="flex items-center gap-1">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Consensus: {result.resultats.consensus?.atteint ? "OUI" : "NON"} ({result.resultats.consensus?.score_final || 0}%)
                                        </span>
                                        <span>• {result.resultats.rapport?.metadata?.duree_totale_minutes || 0} min</span>
                                        <span>• {result.resultats.rapport?.metadata?.cout_estime_euros || 0}€ est.</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="text-indigo-600 hover:bg-indigo-100 p-2 rounded-full transition-colors"
                                    title="Nouvelle analyse"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-8 prose prose-indigo max-w-none">
                                {/* Rendu Markdown basique (split par lignes pour afficher proprement) */}
                                <div className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                                    {result.resultats.rapport?.synthese_executive || "Aucun rapport généré."}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200 text-gray-400">
                            {status?.status === 'running' ? (
                                <div className="text-center space-y-4">
                                    <div className="relative w-24 h-24 mx-auto">
                                        <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                                        <BrainCircuit className="absolute inset-0 m-auto w-10 h-10 text-indigo-500 animate-pulse" />
                                    </div>
                                    <h3 className="text-xl font-medium text-gray-700">Conseil des IA en session...</h3>
                                    <p className="max-w-md mx-auto text-sm">
                                        Les experts analysent votre sujet. Cela peut prendre quelques minutes selon le nombre d&apos;itérations.
                                    </p>
                                </div>
                            ) : status?.status === 'error' ? (
                                <div className="text-center text-red-500 space-y-4">
                                    <AlertCircle className="w-16 h-16 mx-auto mb-4" />
                                    <h3 className="text-xl font-medium">Une erreur est survenue</h3>
                                    <p>Consultez les logs ci-contre pour plus de détails.</p>
                                    <button onClick={handleReset} className="text-sm underline hover:text-red-700 font-medium">Réessayer</button>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200 text-gray-400">
                                    <BrainCircuit className="w-16 h-16 mb-4 opacity-20" />
                                    <p className="text-lg">Configurez et lancez une analyse pour voir les résultats ici.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div >
    );
}
