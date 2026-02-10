/**
 * Service principal pour le Conseil des IA
 * Gestion de la state machine et orchestration du workflow
 */

import {
    ConseilIAState,
    ConseilIAInput,
    ConseilIAConfiguration,
    Contraintes,
    Meta,
    Debat,
    ValidationResult,
    AnalyseConsensus,
    SyntheseMaitre,
    IterationRecord
} from '../types/conseil-ia.types';

export class ConseilIAService {
    private readonly DEFAULT_CONFIG: ConseilIAConfiguration = {
        nombre_iterations: 10,
        iterations_min_consensus: 3,
        temperature_maitre: 0.2,
        temperature_experts: 0.8,
        timeout_par_iteration_sec: 120,
        mode_debug: false,
        activer_expert_risques: true
    };

    private readonly CONTRAINTES_PAR_DEFAUT: Omit<Contraintes, 'validation_initiale_ok' | 'raison_rejet'> = {
        regles_interdites: [
            // "Aucun sujet réglementaire (RGPD, compliance, législation, normes ISO)", // Assoupli pour MVP
            // "Aucun conseil juridique, fiscal ou comptable", // Assoupli pour MVP
            // "Aucune recommandation médicale ou pharmaceutique", // Assoupli pour MVP
            "Aucune analyse de marchés financiers régulés (banque, assurance, bourse)",
            "Aucun conseil en investissement immobilier réglementé"
        ],
        regles_obligatoires: [
            "Toute recommandation doit être actionnable sous 90 jours maximum",
            "Focus exclusif sur solutions B2B SaaS ou produits numériques",
            "Budget de démarrage maximum : 50 000€",
            "Équipe technique supposée : 1-3 personnes",
            "Priorité à la rentabilité rapide (< 12 mois)"
        ],
        domaines_exclus: [
            "crypto-monnaies et blockchain spéculatifs",
            "paris sportifs et jeux d'argent",
            "contenu adulte ou sensible",
            // "santé réglementée (dispositifs médicaux, télémédecine)", // Assoupli pour MVP
            "éducation formelle accréditée",
            "services financiers régulés"
        ]
    };

    /**
     * Initialise l'état du Conseil des IA
     */
    public initialiserEtat(input: ConseilIAInput): ConseilIAState {
        const nombreIterations = Math.max(3, Math.min(input.nombre_iterations || 10, 20));

        const configuration: ConseilIAConfiguration = {
            ...this.DEFAULT_CONFIG,
            nombre_iterations: nombreIterations,
            iterations_min_consensus: Math.ceil(nombreIterations * 0.3),
            mode_debug: input.mode_debug || false,
            activer_expert_risques: input.activer_expert_risques !== false
        };

        const contraintes: Contraintes = {
            ...this.CONTRAINTES_PAR_DEFAUT,
            regles_obligatoires: input.regles_obligatoires_override || [
                ...this.CONTRAINTES_PAR_DEFAUT.regles_obligatoires,
                ...(input.contraintes_personnalisees || [])
            ],
            regles_interdites: input.regles_interdites_override || this.CONTRAINTES_PAR_DEFAUT.regles_interdites,
            domaines_exclus: input.domaines_exclus_override || this.CONTRAINTES_PAR_DEFAUT.domaines_exclus,
            validation_initiale_ok: false,
            raison_rejet: ""
        };

        const meta: Meta = {
            iteration_actuelle: 0,
            max_iterations: nombreIterations,
            sujet_original: input.sujet_utilisateur,
            sujet_valide: "",
            timestamp_debut: new Date().toISOString(),
            timestamp_derniere_iteration: "",
            phase_actuelle: 'validation',
            duree_totale_sec: 0
        };

        const debat: Debat = {
            historique_complet: [],
            historique_resume_3_dernieres: [],
            derniere_synthese_maitre: {
                texte: "",
                questions_experts: {
                    expert_technique: "",
                    expert_business: "",
                    expert_ux: ""
                },
                validation_contraintes: false
            },
            avis_experts: this.initialiserExperts(configuration.activer_expert_risques),
            metriques_convergence: {
                score_consensus: 0,
                points_accord: [],
                points_desaccord: [],
                evolution_scores: []
            }
        };

        const state: ConseilIAState = {
            configuration,
            contraintes,
            meta,
            debat,
            consensus: {
                atteint: false,
                iteration_consensus: 0,
                score_final: 0,
                justification: "Initialisation"
            },
            rapport_final: {},
            logs: {
                erreurs: [],
                avertissements: [],
                evenements: [
                    {
                        timestamp: new Date().toISOString(),
                        type: 'init',
                        message: `Workflow initialisé avec ${nombreIterations} itérations max`
                    }
                ]
            }
        };

        return state;
    }

    /**
     * Initialise la configuration des experts
     */
    private initialiserExperts(activerExpertRisques: boolean) {
        const experts: any = {
            expert_technique: {
                nom_modele: "Claude-3.5-Sonnet",
                role: "Faisabilité technique, architecture, scalabilité, dette technique",
                reponse: "",
                tokens_utilises: 0,
                duree_ms: 0
            },
            expert_business: {
                nom_modele: "GPT-4",
                role: "Monétisation, marché, acquisition clients, pricing, rentabilité",
                reponse: "",
                tokens_utilises: 0,
                duree_ms: 0
            },
            expert_ux: {
                nom_modele: "Llama-3.1-70B",
                role: "Expérience utilisateur, adoption, rétention, innovation UX",
                reponse: "",
                tokens_utilises: 0,
                duree_ms: 0
            }
        };

        if (activerExpertRisques) {
            experts.expert_risques = {
                nom_modele: "GPT-4o",
                role: "Analyse des risques, conformité non-juridique, durabilité business",
                reponse: "",
                tokens_utilises: 0,
                duree_ms: 0
            };
        }

        return experts;
    }

    /**
     * Détermine la phase actuelle du débat
     */
    public determinerPhase(state: ConseilIAState): { phase: string; instructions: string } {
        const iteration = state.meta.iteration_actuelle + 1;
        const maxIter = state.configuration.nombre_iterations;

        const seuilDivergence = Math.ceil(maxIter * 0.3);
        const seuilConvergence = Math.ceil(maxIter * 0.7);

        let phase: string;
        let instructions: string;

        if (iteration <= seuilDivergence) {
            phase = "divergence";
            instructions = "PHASE DIVERGENCE : Soyez critiques et provocateurs. Identifiez les failles, les angles morts, les hypothèses non-vérifiées. Challengez les idées précédentes sans complaisance. Posez des questions difficiles.";
        } else if (iteration <= seuilConvergence) {
            phase = "approfondissement";
            instructions = "PHASE APPROFONDISSEMENT : Proposez des solutions CONCRÈTES et ACTIONNABLES aux problèmes soulevés. Apportez des données, des exemples, des méthodes éprouvées. Construisez sur les meilleures idées.";
        } else {
            phase = "convergence";
            instructions = "PHASE CONVERGENCE : INTERDICTION de critiquer sans proposer un compromis viable. Votre objectif est de fusionner les meilleures idées en une UNIQUE recommandation consensuelle. Soyez synthétique et pragmatique.";
        }

        state.meta.phase_actuelle = phase as any;
        state.meta.iteration_actuelle = iteration;
        state.meta.timestamp_derniere_iteration = new Date().toISOString();

        state.logs.evenements.push({
            timestamp: new Date().toISOString(),
            type: 'phase_change',
            message: `Passage en phase ${phase} (iteration ${iteration}/${maxIter})`
        });

        return { phase, instructions };
    }

    /**
     * Construit le prompt de validation pour le gardien
     */
    public construirePromptValidation(state: ConseilIAState): string {
        return `Tu es un GARDIEN bienveillant. Ta mission : vérifier que le sujet proposé ne porte PAS sur un domaine interdit ou exclu.

IMPORTANT : Tu dois ACCEPTER tout sujet qui demande de la génération d'idées, du brainstorming, de l'analyse business, etc. Un prompt détaillé avec des contraintes précises est un BON sujet, pas un sujet à rejeter.

Tu dois UNIQUEMENT rejeter le sujet s'il porte sur l'un de ces thèmes INTERDITS :
${state.contraintes.regles_interdites.map(r => '- ' + r).join('\n')}

Ou s'il concerne un de ces DOMAINES EXCLUS :
${state.contraintes.domaines_exclus.map(d => '- ' + d).join('\n')}

EN CAS DE DOUTE, ACCEPTE LE SUJET.

Réponds UNIQUEMENT avec ce JSON exact :
{
  "valide": true/false,
  "raison_rejet": "raison précise si false, vide si true",
  "sujet_reformule": "version synthétisée et clarifiée du sujet",
  "avertissements": ["liste d'avertissements non-bloquants si nécessaire"]
}

SUJET À VALIDER :
${state.meta.sujet_original.substring(0, 200)}`;
    }

    /**
     * Traite le résultat de la validation
     */
    public traiterValidation(state: ConseilIAState, validation: ValidationResult): void {
        state.contraintes.validation_initiale_ok = validation.valide;
        state.contraintes.raison_rejet = validation.raison_rejet || "";
        state.meta.sujet_valide = validation.sujet_reformule || state.meta.sujet_original;

        if (!validation.valide) {
            state.logs.erreurs.push({
                timestamp: new Date().toISOString(),
                code: 'VALIDATION_FAILED',
                message: validation.raison_rejet
            });
        } else {
            state.logs.evenements.push({
                timestamp: new Date().toISOString(),
                type: 'validation',
                message: 'Sujet validé avec succès'
            });

            if (validation.avertissements && validation.avertissements.length > 0) {
                validation.avertissements.forEach(a => {
                    state.logs.avertissements.push({
                        timestamp: new Date().toISOString(),
                        message: a
                    });
                });
            }
        }
    }

    /**
     * Construit le prompt pour le Maître orchestrateur
     */
    public construirePromptMaitre(state: ConseilIAState, instructionsPhase: string): string {
        const historiqueStr = state.debat.historique_resume_3_dernieres.length > 0
            ? JSON.stringify(state.debat.historique_resume_3_dernieres, null, 2)
            : 'Première itération - pas d\'historique';

        const expertsStr = JSON.stringify(state.debat.avis_experts, null, 2);

        return `Tu es le MAÎTRE du Conseil des IA, un orchestrateur expert et méthodique.

🎯 TES MISSIONS :
1. SYNTHÉTISER le débat de l'itération précédente (points d'accord, désaccords, idées émergentes)
2. IDENTIFIER 3 angles morts ou questions non explorées
3. FORMULER une question SPÉCIFIQUE et ACTIONNABLE pour chaque expert
4. VALIDER que tes questions respectent STRICTEMENT les contraintes suivantes :

❌ CONTRAINTES INTERDITES (tu dois REFUSER tout sujet qui viole ces règles) :
${state.contraintes.regles_interdites.join('\n')}

✅ CONTRAINTES OBLIGATOIRES (à intégrer dans tes questions) :
${state.contraintes.regles_obligatoires.join('\n')}

🚫 DOMAINES EXCLUS :
${state.contraintes.domaines_exclus.join('\n')}

📊 PHASE ACTUELLE : ${state.meta.phase_actuelle}
${instructionsPhase}

📋 FORMAT DE RÉPONSE ATTENDU :
{
  "synthese_iteration_precedente": "3-4 phrases résumant le débat précédent",
  "angles_morts_identifies": ["angle 1", "angle 2", "angle 3"],
  "questions_experts": {
    "expert_technique": "Ta question précise pour l'expert technique",
    "expert_business": "Ta question précise pour l'expert business",
    "expert_ux": "Ta question précise pour l'expert UX"${state.configuration.activer_expert_risques ? ',\n    "expert_risques": "Ta question précise pour l\'expert risques"' : ''}
  },
  "validation_contraintes": true,
  "avertissement_contrainte": "Si une contrainte risque d'être violée, indique-le ici"
}

🎯 SUJET DU DÉBAT :
${state.meta.sujet_valide}

📍 ITÉRATION ${state.meta.iteration_actuelle} / ${state.meta.max_iterations}

📝 HISTORIQUE DES 3 DERNIÈRES ITÉRATIONS :
${historiqueStr}

💬 DERNIERS AVIS DES EXPERTS :
${expertsStr}

🎲 Maintenant, produis ta synthèse et tes questions pour cette itération.`;
    }

    /**
     * Construit le prompt pour un expert spécifique
     */
    public construirePromptExpert(
        expertKey: string,
        state: ConseilIAState,
        instructionsPhase: string
    ): string {
        const expertConfig = state.debat.avis_experts[expertKey as keyof typeof state.debat.avis_experts];
        if (!expertConfig) {
            throw new Error(`Expert ${expertKey} non trouvé`);
        }

        const question = state.debat.derniere_synthese_maitre.questions_experts[
            expertKey as keyof typeof state.debat.derniere_synthese_maitre.questions_experts
        ];

        const historiqueReponses = state.debat.historique_resume_3_dernieres
            .map((h: IterationRecord) => h.reponses?.[expertKey] || 'N/A')
            .join('\n---\n');

        let domaine = "";
        switch (expertKey) {
            case 'expert_technique':
                domaine = `🔧 TON DOMAINE D'EXPERTISE :
- Faisabilité technique et architecture logicielle
- Scalabilité et performance
- Stack technologique et choix techniques
- Dette technique et maintenabilité
- Temps de développement et complexité`;
                break;
            case 'expert_business':
                domaine = `💰 TON DOMAINE :
- Modèles de monétisation et pricing
- Analyse de marché et positionnement
- Acquisition clients et growth hacking
- Rentabilité et unit economics
- Concurrence et différenciation`;
                break;
            case 'expert_ux':
                domaine = `🎨 TON DOMAINE :
- Expérience utilisateur et design thinking
- Adoption produit et onboarding
- Rétention et engagement
- Innovation UX et tendances
- Accessibilité et simplicité`;
                break;
            case 'expert_risques':
                domaine = `⚠️ TON DOMAINE :
- Identification des risques business (non-juridiques)
- Durabilité du modèle économique
- Dépendances critiques (fournisseurs, technos)
- Obsolescence et pivots potentiels
- Conformité éthique (hors aspects légaux)`;
                break;
        }

        return `Tu es l'${expertKey.toUpperCase().replace('_', ' ')} du Conseil des IA.

${domaine}

⚠️ CONTRAINTES STRICTES À RESPECTER :
${state.contraintes.regles_obligatoires.join('\n')}

🚫 TU DOIS REFUSER DE TRAITER :
${state.contraintes.regles_interdites.join('\n')}
${state.contraintes.domaines_exclus.join('\n')}

📊 PHASE : ${state.meta.phase_actuelle}
${instructionsPhase}

📏 CONSIGNE DE FORMAT :
- Réponse en 250-400 mots MAXIMUM
- Structure : [Réponse directe] + [Argumentation] + [Risque identifié]
- Ton : professionnel, factuel, sans jargon inutile

🎯 SUJET : ${state.meta.sujet_valide}

📍 ITÉRATION ${state.meta.iteration_actuelle}/${state.meta.max_iterations}

💬 SYNTHÈSE DU MAÎTRE :
${state.debat.derniere_synthese_maitre.texte}

❓ TA QUESTION SPÉCIFIQUE :
${question}

🧠 HISTORIQUE DE TES RÉPONSES PRÉCÉDENTES :
${historiqueReponses}

Réponds maintenant de manière précise et actionnable.`;
    }

    /**
     * Traite la sortie du Maître
     */
    public traiterSortieMaitre(state: ConseilIAState, maitreResponse: SyntheseMaitre, tokensUsed: number): void {
        if (!maitreResponse.validation_contraintes) {
            state.logs.avertissements.push({
                timestamp: new Date().toISOString(),
                message: `⚠️ MAÎTRE : ${(maitreResponse as any).avertissement_contrainte || 'Contrainte potentiellement violée'}`
            });
        }

        state.debat.derniere_synthese_maitre = {
            texte: maitreResponse.texte || (maitreResponse as any).synthese_iteration_precedente || "",
            angles_morts: maitreResponse.angles_morts || (maitreResponse as any).angles_morts_identifies || [],
            questions_experts: maitreResponse.questions_experts || {
                expert_technique: "",
                expert_business: "",
                expert_ux: ""
            },
            validation_contraintes: maitreResponse.validation_contraintes
        };

        state.logs.evenements.push({
            timestamp: new Date().toISOString(),
            type: 'maitre_execution',
            message: `${tokensUsed} tokens utilisés`
        });
    }

    /**
     * Fusionne les réponses des experts
     */
    public fusionnerReponsesExperts(
        state: ConseilIAState,
        reponses: Record<string, { content: string; tokens: number }>
    ): void {
        const startTime = new Date(state.meta.timestamp_derniere_iteration).getTime();

        Object.keys(reponses).forEach(expertKey => {
            const expert = state.debat.avis_experts[expertKey as keyof typeof state.debat.avis_experts];
            if (expert) {
                expert.reponse = reponses[expertKey].content;
                expert.tokens_utilises = reponses[expertKey].tokens;
                expert.duree_ms = new Date().getTime() - startTime;
            }
        });

        // Archivage dans l'historique
        const iterationRecord: IterationRecord = {
            iteration: state.meta.iteration_actuelle,
            timestamp: new Date().toISOString(),
            phase: state.meta.phase_actuelle,
            synthese_maitre: state.debat.derniere_synthese_maitre.texte,
            reponses: {}
        };

        Object.keys(state.debat.avis_experts).forEach(expertKey => {
            const expert = state.debat.avis_experts[expertKey as keyof typeof state.debat.avis_experts];
            if (expert) {
                iterationRecord.reponses[expertKey] = expert.reponse;
            }
        });

        state.debat.historique_complet.push(iterationRecord);
        state.debat.historique_resume_3_dernieres = state.debat.historique_complet.slice(-3);

        const tokensTotaux = Object.values(state.debat.avis_experts)
            .reduce((sum, e) => sum + (e?.tokens_utilises || 0), 0);

        state.logs.evenements.push({
            timestamp: new Date().toISOString(),
            type: 'iteration_complete',
            message: `Itération ${state.meta.iteration_actuelle} terminée - ${tokensTotaux} tokens`
        });
    }

    /**
     * Construit le prompt d'analyse de consensus
     */
    public construirePromptConsensus(state: ConseilIAState): string {
        return `Tu es un ANALYSEUR DE CONSENSUS. Ta mission : évaluer objectivement si les experts ont atteint un consensus.

CRITÈRES DE CONSENSUS :
✅ Les 3-4 experts convergent vers une MÊME recommandation principale
✅ Les désaccords restants sont MINEURS (détails d'implémentation, timing)
✅ Aucune opposition fondamentale sur l'approche globale
✅ Les experts se citent et construisent sur les idées des autres

Réponds UNIQUEMENT avec ce JSON :
{
  "score_consensus": 0-100,
  "consensus_atteint": true/false,
  "points_accord": ["point 1", "point 2", ...],
  "points_desaccord": ["désaccord 1", ...],
  "justification": "Explication courte",
  "besoin_iterations_supplementaires": true/false
}

📊 ITÉRATION ${state.meta.iteration_actuelle}/${state.meta.max_iterations}

💬 AVIS DES EXPERTS :
${JSON.stringify(state.debat.avis_experts, null, 2)}

📈 HISTORIQUE DES SCORES :
${JSON.stringify(state.debat.metriques_convergence.evolution_scores, null, 2)}

Analyse maintenant le niveau de consensus.`;
    }

    /**
     * Met à jour les métriques de consensus
     */
    public mettreAJourConsensus(state: ConseilIAState, analysis: AnalyseConsensus): void {
        state.debat.metriques_convergence.score_consensus = analysis.score_consensus;
        state.debat.metriques_convergence.points_accord = analysis.points_accord;
        state.debat.metriques_convergence.points_desaccord = analysis.points_desaccord;
        state.debat.metriques_convergence.evolution_scores.push({
            iteration: state.meta.iteration_actuelle,
            score: analysis.score_consensus
        });

        const iterationMin = state.configuration.iterations_min_consensus;
        const scoreMin = 75;

        if (
            state.meta.iteration_actuelle >= iterationMin &&
            analysis.score_consensus >= scoreMin &&
            analysis.consensus_atteint === true
        ) {
            state.consensus.atteint = true;
            state.consensus.iteration_consensus = state.meta.iteration_actuelle;
            state.consensus.score_final = analysis.score_consensus;
            state.consensus.justification = analysis.justification;

            state.logs.evenements.push({
                timestamp: new Date().toISOString(),
                type: 'consensus_atteint',
                message: `Consensus atteint à l'itération ${state.meta.iteration_actuelle} (score: ${analysis.score_consensus}%)`
            });
        }
    }

    /**
     * Vérifie si on doit continuer les itérations
     */
    public doitContinuer(state: ConseilIAState): boolean {
        return state.meta.iteration_actuelle < state.meta.max_iterations && !state.consensus.atteint;
    }

    /**
     * Construit le prompt pour le rapport final
     */
    public construirePromptRapportFinal(state: ConseilIAState): string {
        return `Tu es un CONSULTANT SENIOR spécialisé en synthèse stratégique.

📋 TA MISSION :
Produire un rapport exécutif professionnel synthétisant ${state.meta.iteration_actuelle} itérations de débat entre experts IA.

📐 FORMAT MARKDOWN STRICT :
# Synthèse Exécutive
[3-4 phrases percutantes résumant la conclusion]

## Recommandation Principale
[LA recommandation consensuelle en 1 paragraphe]

## Plan d'Action (90 jours)
1. **Semaine 1-4** : [Action concrète]
2. **Semaine 5-8** : [Action concrète]
3. **Semaine 9-12** : [Action concrète]

## Risques Identifiés
- **Risque technique** : [Description + mitigation]
- **Risque marché** : [Description + mitigation]
- **Risque opérationnel** : [Description + mitigation]

## Métriques de Succès (90 jours)
- [Métrique 1] : Objectif chiffré
- [Métrique 2] : Objectif chiffré
- [Métrique 3] : Objectif chiffré

## Évolution du Débat
[2-3 phrases sur comment le consensus s'est formé]

✅ EXIGENCES :
- Langage clair et actionnable
- Aucun jargon technique superflu
- Focus sur la RENTABILITÉ rapide
- Respect STRICT des contraintes : ${state.contraintes.regles_obligatoires.join(', ')}

🎯 SUJET INITIAL :
${state.meta.sujet_valide}

📊 DONNÉES DU DÉBAT :
- Nombre d'itérations : ${state.meta.iteration_actuelle}
- Consensus atteint : ${state.consensus.atteint ? 'OUI (itération ' + state.consensus.iteration_consensus + ')' : 'NON'}
- Score consensus final : ${state.debat.metriques_convergence.score_consensus}%

📈 ÉVOLUTION DES SCORES :
${JSON.stringify(state.debat.metriques_convergence.evolution_scores, null, 2)}

💬 HISTORIQUE COMPLET DES ÉCHANGES :
${JSON.stringify(state.debat.historique_complet, null, 2)}

🎯 POINTS DE CONVERGENCE :
${state.debat.metriques_convergence.points_accord.join('\n')}

⚠️ POINTS DE DIVERGENCE RESTANTS :
${state.debat.metriques_convergence.points_desaccord.join('\n')}

Produis maintenant le rapport final.`;
    }

    /**
     * Compile les métadonnées du rapport final
     */
    public compilerRapportFinal(state: ConseilIAState, rapportMarkdown: string): void {
        const dureeSecondes = Math.floor(
            (new Date().getTime() - new Date(state.meta.timestamp_debut).getTime()) / 1000
        );

        const tokensTotaux = state.debat.historique_complet.reduce((sum, iter) => {
            return sum + Object.keys(iter.reponses).length * 500; // Estimation
        }, 0);

        const coutEstime = (tokensTotaux / 1000) * 0.03;

        state.rapport_final = {
            synthese_executive: rapportMarkdown,
            metadata: {
                nombre_iterations_reelles: state.meta.iteration_actuelle,
                consensus_atteint: state.consensus.atteint,
                score_consensus_final: state.debat.metriques_convergence.score_consensus,
                tokens_totaux: tokensTotaux,
                cout_estime_euros: parseFloat(coutEstime.toFixed(2)),
                duree_totale_minutes: parseFloat((dureeSecondes / 60).toFixed(1)),
                timestamp_fin: new Date().toISOString()
            }
        };
    }
}
