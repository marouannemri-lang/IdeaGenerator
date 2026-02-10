/**
 * Routes API pour le Conseil des IA
 */

import { Router, Request, Response } from 'express';
import { ConseilIAController } from '../services/conseil-ia-orchestrator.service';
import { AzureOpenAIService } from '../services/azure-openai.service';
import { ConseilIAInput, ConseilIAResponse } from '../types/conseil-ia.types';
import fs from 'fs';
import path from 'path';

const router = Router();

// Initialisation du service Azure OpenAI avec les credentials
// Normalement on injecte ça via dependency injection, mais ici on simplifie
const azureConfig = {
    master: {
        apiKey: process.env.AZURE_API_KEY || '',
        endpoint: process.env.AZURE_ENDPOINT_MASTER || ''
    },
    gpt4: {
        apiKey: process.env.AZURE_API_KEY || '',
        endpoint: process.env.AZURE_ENDPOINT_GPT4 || ''
    },
    claude: process.env.AZURE_ENDPOINT_CLAUDE ? {
        apiKey: process.env.AZURE_API_KEY || '',
        endpoint: process.env.AZURE_ENDPOINT_CLAUDE
    } : undefined,
    llama: process.env.AZURE_ENDPOINT_LLAMA ? {
        apiKey: process.env.AZURE_API_KEY || '',
        endpoint: process.env.AZURE_ENDPOINT_LLAMA
    } : undefined
};

const aiService = new AzureOpenAIService(azureConfig);
const conseilController = new ConseilIAController(aiService);

// Stockage des exécutions en cours (en production, utiliser Redis ou DB)
const executionsEnCours = new Map<string, { status: string; progress: number }>();
const resultatsExecutions = new Map<string, any>();

/**
 * POST /api/conseil-ia/start
 * Démarre une nouvelle consultation du Conseil des IA
 */
router.post('/start', async (req: Request, res: Response) => {
    try {
        const input: ConseilIAInput = req.body;

        // Validation des inputs
        if (!input.sujet_utilisateur || input.sujet_utilisateur.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Le sujet utilisateur est requis'
            });
        }

        if (input.nombre_iterations && (input.nombre_iterations < 3 || input.nombre_iterations > 20)) {
            return res.status(400).json({
                success: false,
                error: 'Le nombre d\'itérations doit être entre 3 et 20'
            });
        }

        // Génération d'un ID d'exécution
        const executionId = `conseil-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Lancement asynchrone du workflow
        executionsEnCours.set(executionId, { status: 'running', progress: 0 });

        // Exécution en arrière-plan
        conseilController.executerWorkflow(input)
            .then(state => {
                executionsEnCours.set(executionId, { status: 'completed', progress: 100 });
                resultatsExecutions.set(executionId, state);

                // Sauvegarde optionnelle sur disque
                if (process.env.SAVE_RESULTS === 'true') {
                    const outputDir = path.join(__dirname, '../../../output/conseil-ia');
                    if (!fs.existsSync(outputDir)) {
                        fs.mkdirSync(outputDir, { recursive: true });
                    }

                    // JSON
                    const jsonPath = path.join(outputDir, `${executionId}.json`);
                    fs.writeFileSync(
                        jsonPath,
                        JSON.stringify(conseilController.exporterJSON(state), null, 2)
                    );

                    // Markdown
                    const mdPath = path.join(outputDir, `${executionId}.md`);
                    fs.writeFileSync(mdPath, conseilController.genererMarkdown(state));
                }
            })
            .catch(error => {
                executionsEnCours.set(executionId, { status: 'error', progress: 0 });
                resultatsExecutions.set(executionId, { error: error.message });
            });

        // Réponse immédiate avec l'ID
        res.status(202).json({
            success: true,
            execution_id: executionId,
            message: 'Workflow démarré. Utilisez /status/{execution_id} pour suivre la progression.'
        });

    } catch (error: any) {
        console.error('Erreur lors du démarrage:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/conseil-ia/status/:executionId
 * Récupère le statut d'une exécution
 */
router.get('/status/:executionId', (req: Request, res: Response) => {
    const { executionId } = req.params;

    const execution = executionsEnCours.get(executionId);
    if (!execution) {
        return res.status(404).json({
            success: false,
            error: 'Exécution non trouvée'
        });
    }

    res.json({
        success: true,
        execution_id: executionId,
        status: execution.status,
        progress: execution.progress
    });
});

/**
 * GET /api/conseil-ia/result/:executionId
 * Récupère le résultat complet d'une exécution
 */
router.get('/result/:executionId', (req: Request, res: Response) => {
    const { executionId } = req.params;

    const execution = executionsEnCours.get(executionId);
    if (!execution) {
        return res.status(404).json({
            success: false,
            error: 'Exécution non trouvée'
        });
    }

    if (execution.status !== 'completed') {
        return res.status(202).json({
            success: false,
            message: `Exécution en cours (statut: ${execution.status})`,
            status: execution.status
        });
    }

    const resultat = resultatsExecutions.get(executionId);
    if (!resultat) {
        return res.status(404).json({
            success: false,
            error: 'Résultat non disponible'
        });
    }

    res.json({
        success: true,
        execution_id: executionId,
        data: conseilController.exporterJSON(resultat)
    });
});

/**
 * GET /api/conseil-ia/export/:executionId/json
 * Exporte le résultat en JSON
 */
router.get('/export/:executionId/json', (req: Request, res: Response) => {
    const { executionId } = req.params;

    const resultat = resultatsExecutions.get(executionId);
    if (!resultat) {
        return res.status(404).json({
            success: false,
            error: 'Résultat non trouvé'
        });
    }

    const exported = conseilController.exporterJSON(resultat);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="conseil-ia-${executionId}.json"`);
    res.send(JSON.stringify(exported, null, 2));
});

/**
 * GET /api/conseil-ia/export/:executionId/markdown
 * Exporte le résultat en Markdown
 */
router.get('/export/:executionId/markdown', (req: Request, res: Response) => {
    const { executionId } = req.params;

    const resultat = resultatsExecutions.get(executionId);
    if (!resultat) {
        return res.status(404).json({
            success: false,
            error: 'Résultat non trouvé'
        });
    }

    const markdown = conseilController.genererMarkdown(resultat);
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="conseil-ia-${executionId}.md"`);
    res.send(markdown);
});

/**
 * POST /api/conseil-ia/execute-sync
 * Exécution synchrone (pour tests ou petites consultations)
 */
router.post('/execute-sync', async (req: Request, res: Response) => {
    try {
        const input: ConseilIAInput = req.body;

        if (!input.sujet_utilisateur) {
            return res.status(400).json({
                success: false,
                error: 'Le sujet utilisateur est requis'
            });
        }

        // Limite à 5 itérations max pour l'exécution synchrone
        if (!input.nombre_iterations || input.nombre_iterations > 5) {
            input.nombre_iterations = 5;
        }

        const state = await conseilController.executerWorkflow(input);

        const response: ConseilIAResponse = {
            success: true,
            data: state,
            execution_id: `sync-${Date.now()}`
        };

        res.json(response);

    } catch (error: any) {
        console.error('Erreur lors de l\'exécution synchrone:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/conseil-ia/:executionId
 * Supprime une exécution et ses résultats
 */
router.delete('/:executionId', (req: Request, res: Response) => {
    const { executionId } = req.params;

    const deleted = executionsEnCours.delete(executionId) || resultatsExecutions.delete(executionId);

    if (!deleted) {
        return res.status(404).json({
            success: false,
            error: 'Exécution non trouvée'
        });
    }

    res.json({
        success: true,
        message: 'Exécution supprimée'
    });
});

/**
 * GET /api/conseil-ia/health
 * Vérifie la santé du service
 */
router.get('/health', (req: Request, res: Response) => {
    const healthCheck = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        azure_configured: {
            master: !!process.env.AZURE_ENDPOINT_MASTER,
            gpt4: !!process.env.AZURE_ENDPOINT_GPT4,
            claude: !!process.env.AZURE_ENDPOINT_CLAUDE,
            llama: !!process.env.AZURE_ENDPOINT_LLAMA
        },
        executions_en_cours: executionsEnCours.size,
        resultats_stockes: resultatsExecutions.size
    };

    res.json(healthCheck);
});

export default router;
