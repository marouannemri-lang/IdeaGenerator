/**
 * Types et interfaces pour le système de Conseil des IA
 */

export interface ConseilIAConfiguration {
    nombre_iterations: number;
    iterations_min_consensus: number;
    temperature_maitre: number;
    temperature_experts: number;
    timeout_par_iteration_sec: number;
    mode_debug: boolean;
    activer_expert_risques: boolean;
}

export interface Contraintes {
    regles_interdites: string[];
    regles_obligatoires: string[];
    domaines_exclus: string[];
    validation_initiale_ok: boolean;
    raison_rejet: string;
}

export interface Meta {
    iteration_actuelle: number;
    max_iterations: number;
    sujet_original: string;
    sujet_valide: string;
    timestamp_debut: string;
    timestamp_derniere_iteration: string;
    phase_actuelle: 'initialisation' | 'validation' | 'divergence' | 'approfondissement' | 'convergence';
    duree_totale_sec: number;
}

export interface ExpertConfig {
    nom_modele: string;
    role: string;
    reponse: string;
    tokens_utilises: number;
    duree_ms: number;
}

export interface AvisExperts {
    expert_technique: ExpertConfig;
    expert_business: ExpertConfig;
    expert_ux: ExpertConfig;
    expert_risques?: ExpertConfig;
}

export interface SyntheseMaitre {
    texte: string;
    angles_morts?: string[];
    questions_experts: {
        expert_technique: string;
        expert_business: string;
        expert_ux: string;
        expert_risques?: string;
    };
    validation_contraintes: boolean;
}

export interface MetriquesConvergence {
    score_consensus: number;
    points_accord: string[];
    points_desaccord: string[];
    evolution_scores: Array<{
        iteration: number;
        score: number;
    }>;
}

export interface IterationRecord {
    iteration: number;
    timestamp: string;
    phase: string;
    synthese_maitre: string;
    reponses: Record<string, string>;
}

export interface Debat {
    historique_complet: IterationRecord[];
    historique_resume_3_dernieres: IterationRecord[];
    derniere_synthese_maitre: SyntheseMaitre;
    avis_experts: AvisExperts;
    metriques_convergence: MetriquesConvergence;
}

export interface Consensus {
    atteint: boolean;
    iteration_consensus: number;
    score_final: number;
    justification: string;
}

export interface RapportFinal {
    synthese_executive: string;
    recommandation_principale?: string;
    plan_action?: string[];
    risques_identifies?: string[];
    metriques_succes?: string[];
    metadata: {
        nombre_iterations_reelles: number;
        consensus_atteint: boolean;
        score_consensus_final: number;
        tokens_totaux: number;
        cout_estime_euros: number;
        duree_totale_minutes: number;
        timestamp_fin: string;
    };
}

export interface LogEntry {
    timestamp: string;
    type?: string;
    code?: string;
    message: string;
}

export interface Logs {
    erreurs: LogEntry[];
    avertissements: LogEntry[];
    evenements: LogEntry[];
}

export interface ConseilIAState {
    configuration: ConseilIAConfiguration;
    contraintes: Contraintes;
    meta: Meta;
    debat: Debat;
    consensus: Consensus;
    rapport_final: Partial<RapportFinal>;
    logs: Logs;
}

export interface ValidationResult {
    valide: boolean;
    raison_rejet: string;
    sujet_reformule: string;
    avertissements: string[];
}

export interface AnalyseConsensus {
    score_consensus: number;
    consensus_atteint: boolean;
    points_accord: string[];
    points_desaccord: string[];
    justification: string;
    besoin_iterations_supplementaires: boolean;
}

export interface ConseilIAInput {
    sujet_utilisateur: string;
    nombre_iterations?: number;
    activer_expert_risques?: boolean;
    contraintes_personnalisees?: string[];
    mode_debug?: boolean;
    email_utilisateur?: string;
    // Configuration avancée
    regles_interdites_override?: string[];
    domaines_exclus_override?: string[];
    regles_obligatoires_override?: string[];
}

export interface ConseilIAResponse {
    success: boolean;
    data?: ConseilIAState;
    error?: string;
    execution_id?: string;
}

export interface AzureAICredentials {
    AZURE_API_KEY: string;
    AZURE_ENDPOINT_MASTER: string;
    AZURE_ENDPOINT_GPT4: string;
    AZURE_ENDPOINT_CLAUDE: string;
    AZURE_ENDPOINT_LLAMA: string;
}

export interface ExpertPromptContext {
    sujet: string;
    iteration: number;
    max_iterations: number;
    phase: string;
    instructions_phase: string;
    synthese_maitre: string;
    question_specifique: string;
    historique_reponses: string[];
    contraintes: Contraintes;
}
