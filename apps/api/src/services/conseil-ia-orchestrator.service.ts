/**
 * Contrôleur principal pour orchestrer le workflow du Conseil des IA
 * Exécute toutes les étapes du débat de manière séquentielle
 */

import { ConseilIAService } from './conseil-ia.service';
import { AzureOpenAIService } from './azure-openai.service';
import {
    ConseilIAInput,
    ConseilIAState,
    ValidationResult,
    SyntheseMaitre,
    AnalyseConsensus
} from '../types/conseil-ia.types';

export class ConseilIAController {
    private conseilService: ConseilIAService;
    private aiService: AzureOpenAIService;

    constructor(aiService: AzureOpenAIService) {
        this.conseilService = new ConseilIAService();
        this.aiService = aiService;
    }

    /**
     * Exécute le workflow complet du Conseil des IA
     */
    async executerWorkflow(input: ConseilIAInput): Promise<ConseilIAState> {
        // BLOC A : INITIALISATION & VALIDATION
        console.log('📐 Initialisation du workflow...');
        let state = this.conseilService.initialiserEtat(input);

        // A3 : Validation du sujet (sautée en mode laxiste)
        const modeLaxiste = !!(input.regles_interdites_override || input.regles_obligatoires_override);
        if (modeLaxiste) {
            console.log('⚡ Mode laxiste activé — validation du Gardien sautée');
            state.contraintes.validation_initiale_ok = true;
            state.meta.sujet_valide = state.meta.sujet_original;
        } else {
            console.log('🔍 Validation du sujet...');
            const validationOk = await this.validerSujet(state);
            if (!validationOk) {
                console.error('❌ Sujet rejeté:', state.contraintes.raison_rejet);
                return state;
            }
        }

        console.log('✅ Sujet validé:', state.meta.sujet_valide);

        // BLOC B : BOUCLE DE DÉBAT
        while (this.conseilService.doitContinuer(state)) {
            console.log(`\n🔄 ITÉRATION ${state.meta.iteration_actuelle + 1}/${state.meta.max_iterations}`);

            // B1 : Détermination de la phase
            const { phase, instructions } = this.conseilService.determinerPhase(state);
            console.log(`📊 Phase: ${phase}`);

            // B2 : Appel au Maître
            console.log('🎯 Consultation du Maître...');
            await this.consulterMaitre(state, instructions);

            // B4-B9 : Consultation des experts en parallèle
            console.log('👥 Consultation des experts...');
            await this.consulterExperts(state, instructions);

            // B10-B11 : Analyse de convergence
            console.log('📈 Analyse du consensus...');
            await this.analyserConsensus(state);

            console.log(`   Score consensus: ${state.debat.metriques_convergence.score_consensus}%`);

            if (state.consensus.atteint) {
                console.log(`✅ Consensus atteint à l'itération ${state.consensus.iteration_consensus}!`);
                break;
            }
        }

        // BLOC C : GÉNÉRATION DU RAPPORT FINAL
        console.log('\n📝 Génération du rapport final...');
        await this.genererRapportFinal(state);

        console.log('\n✅ Workflow terminé!');
        console.log(`   Durée: ${state.rapport_final.metadata?.duree_totale_minutes} min`);
        console.log(`   Coût estimé: ${state.rapport_final.metadata?.cout_estime_euros}€`);
        console.log(`   Tokens: ${state.rapport_final.metadata?.tokens_totaux}`);

        return state;
    }

    /**
     * BLOC A3-A4 : Validation du sujet par le Gardien
     */
    private async validerSujet(state: ConseilIAState): Promise<boolean> {
        try {
            const prompt = this.conseilService.construirePromptValidation(state);

            const response = await this.aiService.appelAvecRetry(() =>
                this.aiService.validerSujet(prompt)
            );

            const validation: ValidationResult = JSON.parse(
                response.choices[0].message.content
            );

            this.conseilService.traiterValidation(state, validation);

            return state.contraintes.validation_initiale_ok;
        } catch (error: any) {
            state.logs.erreurs.push({
                timestamp: new Date().toISOString(),
                code: 'VALIDATION_ERROR',
                message: error.message
            });
            return false;
        }
    }

    /**
     * BLOC B2-B3 : Consultation du Maître orchestrateur
     */
    private async consulterMaitre(state: ConseilIAState, instructions: string): Promise<void> {
        try {
            const prompt = this.conseilService.construirePromptMaitre(state, instructions);

            const response = await this.aiService.appelAvecRetry(() =>
                this.aiService.appelMaitre(prompt, state.configuration.temperature_maitre)
            );

            const maitreResponse: SyntheseMaitre = JSON.parse(
                response.choices[0].message.content
            );

            this.conseilService.traiterSortieMaitre(
                state,
                maitreResponse,
                response.usage.total_tokens
            );
        } catch (error: any) {
            state.logs.erreurs.push({
                timestamp: new Date().toISOString(),
                code: 'MAITRE_ERROR',
                message: error.message
            });
            throw error;
        }
    }

    /**
     * BLOC B5-B9 : Consultation de tous les experts en parallèle
     */
    private async consulterExperts(state: ConseilIAState, instructions: string): Promise<void> {
        const experts = ['expert_technique', 'expert_business', 'expert_ux'];
        if (state.configuration.activer_expert_risques) {
            experts.push('expert_risques');
        }

        try {
            // Exécution en parallèle
            const promises = experts.map(expertKey =>
                this.consulterExpert(expertKey, state, instructions)
            );

            const results = await Promise.all(promises);

            // Fusion des réponses
            const reponses: Record<string, { content: string; tokens: number }> = {};
            results.forEach((result, index) => {
                reponses[experts[index]] = result;
            });

            this.conseilService.fusionnerReponsesExperts(state, reponses);
        } catch (error: any) {
            state.logs.erreurs.push({
                timestamp: new Date().toISOString(),
                code: 'EXPERTS_ERROR',
                message: error.message
            });
            throw error;
        }
    }

    /**
     * Consulte un expert spécifique
     */
    private async consulterExpert(
        expertKey: string,
        state: ConseilIAState,
        instructions: string
    ): Promise<{ content: string; tokens: number }> {
        const prompt = this.conseilService.construirePromptExpert(expertKey, state, instructions);

        let response;
        switch (expertKey) {
            case 'expert_technique':
                response = await this.aiService.appelAvecRetry(() =>
                    this.aiService.appelExpertTechnique(prompt, state.configuration.temperature_experts)
                );
                break;
            case 'expert_business':
                response = await this.aiService.appelAvecRetry(() =>
                    this.aiService.appelExpertBusiness(prompt, state.configuration.temperature_experts)
                );
                break;
            case 'expert_ux':
                response = await this.aiService.appelAvecRetry(() =>
                    this.aiService.appelExpertUX(prompt, state.configuration.temperature_experts)
                );
                break;
            case 'expert_risques':
                response = await this.aiService.appelAvecRetry(() =>
                    this.aiService.appelExpertRisques(prompt, state.configuration.temperature_experts)
                );
                break;
            default:
                throw new Error(`Expert inconnu: ${expertKey}`);
        }

        return {
            content: response.choices[0].message.content,
            tokens: response.usage.total_tokens
        };
    }

    /**
     * BLOC B10-B11 : Analyse du consensus
     */
    private async analyserConsensus(state: ConseilIAState): Promise<void> {
        try {
            const prompt = this.conseilService.construirePromptConsensus(state);

            const response = await this.aiService.appelAvecRetry(() =>
                this.aiService.analyserConsensus(prompt)
            );

            const analysis: AnalyseConsensus = JSON.parse(
                response.choices[0].message.content
            );

            this.conseilService.mettreAJourConsensus(state, analysis);
        } catch (error: any) {
            state.logs.erreurs.push({
                timestamp: new Date().toISOString(),
                code: 'CONSENSUS_ERROR',
                message: error.message
            });
            // Non-bloquant : on continue même si l'analyse échoue
        }
    }

    /**
     * BLOC C1-C2 : Génération du rapport final
     */
    private async genererRapportFinal(state: ConseilIAState): Promise<void> {
        try {
            const prompt = this.conseilService.construirePromptRapportFinal(state);

            const response = await this.aiService.appelAvecRetry(() =>
                this.aiService.genererRapportFinal(prompt)
            );

            const rapportMarkdown = response.choices[0].message.content;

            this.conseilService.compilerRapportFinal(state, rapportMarkdown);
        } catch (error: any) {
            state.logs.erreurs.push({
                timestamp: new Date().toISOString(),
                code: 'RAPPORT_ERROR',
                message: error.message
            });

            // Rapport de secours
            state.rapport_final.synthese_executive = `# Erreur lors de la génération du rapport\n\n${error.message}`;
        }
    }

    /**
     * Exporte l'état complet en JSON
     */
    exporterJSON(state: ConseilIAState): any {
        return {
            configuration: state.configuration,
            sujet: {
                original: state.meta.sujet_original,
                valide: state.meta.sujet_valide,
                contraintes: state.contraintes
            },
            resultats: {
                consensus: state.consensus,
                rapport: state.rapport_final,
                metriques: state.debat.metriques_convergence
            },
            historique: state.debat.historique_complet,
            logs: state.logs,
            metadata: {
                workflow_version: '2.0.0',
                date_execution: state.meta.timestamp_debut,
                duree_totale: state.rapport_final.metadata?.duree_totale_minutes + ' min'
            }
        };
    }

    /**
     * Génère un rapport Markdown
     */
    genererMarkdown(state: ConseilIAState): string {
        const data = this.exporterJSON(state);

        return `# 🤖 Rapport du Conseil des IA

**Date** : ${data.metadata.date_execution}  
**Durée** : ${data.metadata.duree_totale}  
**Coût estimé** : ${data.resultats.rapport.metadata?.cout_estime_euros}€

---

## 📋 Sujet Analysé

**Sujet original** : ${data.sujet.original}

**Sujet validé** : ${data.sujet.valide}

---

${data.resultats.rapport.synthese_executive}

---

## 📊 Métriques du Débat

- **Itérations réalisées** : ${data.resultats.rapport.metadata?.nombre_iterations_reelles}
- **Consensus atteint** : ${data.resultats.consensus.atteint ? '✅ OUI' : '❌ NON'}
- **Score final** : ${data.resultats.metriques.score_consensus}%
- **Tokens consommés** : ${data.resultats.rapport.metadata?.tokens_totaux?.toLocaleString()}

---

## 📈 Évolution de la Convergence

${data.resultats.metriques.evolution_scores.map((s: any) =>
            `- Itération ${s.iteration} : ${s.score}%`
        ).join('\n')}

---

## 🗂️ Historique Complet

${data.historique.map((iter: any) => `
### Itération ${iter.iteration} - ${iter.phase.toUpperCase()}

**Synthèse du Maître** :  
${iter.synthese_maitre}

**Réponses des Experts** :
${Object.entries(iter.reponses).map(([expert, reponse]) =>
            `\n**${expert}** :\n${reponse}\n`
        ).join('\n---\n')}
`).join('\n\n---\n\n')}

---

## ⚠️ Logs & Événements

${data.logs.evenements.map((e: any) => `- [${e.timestamp}] ${e.message}`).join('\n')}

${data.logs.erreurs.length > 0 ? `\n### Erreurs\n${data.logs.erreurs.map((e: any) => `- ❌ ${e.message}`).join('\n')}` : ''}

${data.logs.avertissements.length > 0 ? `\n### Avertissements\n${data.logs.avertissements.map((a: any) => `- ⚠️ ${a.message}`).join('\n')}` : ''}

---

_Généré par le Conseil des IA - Version ${data.metadata.workflow_version}_
`;
    }
}
