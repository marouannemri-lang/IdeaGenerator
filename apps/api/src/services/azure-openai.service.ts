/**
 * Service pour interagir avec Azure OpenAI
 * Gère les appels API vers GPT-4, Claude, Llama, etc.
 */

import axios, { AxiosInstance } from 'axios';

export interface AzureOpenAIConfig {
    apiKey: string;
    endpoint: string;
    deployment?: string;
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ChatCompletionRequest {
    messages: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
    response_format?: { type: 'json_object' | 'text' };
}

export interface ChatCompletionResponse {
    choices: Array<{
        message: {
            content: string;
            role: string;
        };
        finish_reason: string;
        index: number;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export class AzureOpenAIService {
    private clients: Map<string, AxiosInstance> = new Map();

    constructor(private config: {
        master: AzureOpenAIConfig;
        gpt4: AzureOpenAIConfig;
        claude?: AzureOpenAIConfig;
        llama?: AzureOpenAIConfig;
    }) {
        this.initializeClients();
    }

    private initializeClients(): void {
        // Client pour le Maître (GPT-4o)
        this.clients.set('master', axios.create({
            baseURL: this.config.master.endpoint,
            headers: {
                'Content-Type': 'application/json',
                'api-key': this.config.master.apiKey
            },
            timeout: 120000 // 2 minutes
        }));

        // Client pour GPT-4
        this.clients.set('gpt4', axios.create({
            baseURL: this.config.gpt4.endpoint,
            headers: {
                'Content-Type': 'application/json',
                'api-key': this.config.gpt4.apiKey
            },
            timeout: 120000
        }));

        // Client pour Claude (si disponible)
        if (this.config.claude) {
            this.clients.set('claude', axios.create({
                baseURL: this.config.claude.endpoint,
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.config.claude.apiKey
                },
                timeout: 120000
            }));
        }

        // Client pour Llama (si disponible)
        if (this.config.llama) {
            this.clients.set('llama', axios.create({
                baseURL: this.config.llama.endpoint,
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.config.llama.apiKey
                },
                timeout: 120000
            }));
        }
    }

    /**
     * Appel générique à Azure OpenAI
     */
    private async callAzureOpenAI(
        clientKey: string,
        request: ChatCompletionRequest
    ): Promise<ChatCompletionResponse> {
        const client = this.clients.get(clientKey);
        if (!client) {
            throw new Error(`Client ${clientKey} non configuré`);
        }

        try {
            const messages = [...request.messages];

            // Si on demande du JSON, on DOIT avoir le mot JSON dans les messages.
            // On ajoute un system prompt explicite si ce n'est pas déjà le cas.
            if (request.response_format?.type === 'json_object') {
                const hasSystemJson = messages.some(m => m.role === 'system' && m.content.toLowerCase().includes('json'));
                if (!hasSystemJson) {
                    messages.unshift({
                        role: 'system',
                        content: 'You are a helpful assistant designed to output JSON.'
                    });
                }
            }

            const response = await client.post('/chat/completions?api-version=2024-02-15-preview', {
                messages: messages,
                temperature: request.temperature ?? 0.7,
                max_tokens: request.max_tokens ?? 1000,
                ...(request.response_format && { response_format: request.response_format })
            });

            return response.data;
        } catch (error: any) {
            console.error(`❌ Erreur détaillée ${clientKey} (${this.clients.get(clientKey)?.defaults.baseURL}):`, {
                status: error.response?.status,
                data: JSON.stringify(error.response?.data, null, 2),
                headers: error.response?.headers,
                message: error.message
            });
            throw new Error(`Échec de l'appel à ${clientKey}: ${error.message}`);
        }
    }

    /**
     * Validation du sujet par le Gardien
     */
    async validerSujet(prompt: string): Promise<ChatCompletionResponse> {
        return this.callAzureOpenAI('gpt4', {
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature: 0.1,
            max_tokens: 500,
            response_format: { type: 'json_object' }
        });
    }

    /**
     * Appel au Maître orchestrateur
     */
    async appelMaitre(prompt: string, temperature: number = 0.2): Promise<ChatCompletionResponse> {
        return this.callAzureOpenAI('master', {
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature,
            max_tokens: 2000,
            response_format: { type: 'json_object' }
        });
    }

    /**
     * Appel à l'Expert Technique (Claude)
     */
    async appelExpertTechnique(prompt: string, temperature: number = 0.8): Promise<ChatCompletionResponse> {
        const clientKey = this.clients.has('claude') ? 'claude' : 'gpt4'; // Fallback sur GPT-4
        return this.callAzureOpenAI(clientKey, {
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature,
            max_tokens: 600
        });
    }

    /**
     * Appel à l'Expert Business (GPT-4)
     */
    async appelExpertBusiness(prompt: string, temperature: number = 0.8): Promise<ChatCompletionResponse> {
        return this.callAzureOpenAI('gpt4', {
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature,
            max_tokens: 600
        });
    }

    /**
     * Appel à l'Expert UX (Llama ou GPT-4)
     */
    async appelExpertUX(prompt: string, temperature: number = 0.8): Promise<ChatCompletionResponse> {
        const clientKey = this.clients.has('llama') ? 'llama' : 'gpt4'; // Fallback sur GPT-4
        return this.callAzureOpenAI(clientKey, {
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature,
            max_tokens: 600
        });
    }

    /**
     * Appel à l'Expert Risques (GPT-4o/Master)
     */
    async appelExpertRisques(prompt: string, temperature: number = 0.8): Promise<ChatCompletionResponse> {
        return this.callAzureOpenAI('master', {
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature,
            max_tokens: 600
        });
    }

    /**
     * Analyse de consensus
     */
    async analyserConsensus(prompt: string): Promise<ChatCompletionResponse> {
        return this.callAzureOpenAI('master', {
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature: 0.1,
            max_tokens: 800,
            response_format: { type: 'json_object' }
        });
    }

    /**
     * Génération du rapport final
     */
    async genererRapportFinal(prompt: string): Promise<ChatCompletionResponse> {
        return this.callAzureOpenAI('master', {
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 3000
        });
    }

    /**
     * Appel générique avec retry
     */
    async appelAvecRetry(
        method: () => Promise<ChatCompletionResponse>,
        maxRetries: number = 3,
        delayMs: number = 2000
    ): Promise<ChatCompletionResponse> {
        let lastError: Error | null = null;

        for (let i = 0; i < maxRetries; i++) {
            try {
                return await method();
            } catch (error: any) {
                lastError = error;

                // Si rate limit (429), attendre plus longtemps
                if (error.response?.status === 429) {
                    const waitTime = delayMs * Math.pow(2, i); // Exponential backoff
                    console.log(`Rate limit atteint, attente de ${waitTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }

                // Si erreur serveur (5xx), retry
                if (error.response?.status >= 500) {
                    console.log(`Erreur serveur, retry ${i + 1}/${maxRetries}...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    continue;
                }

                // Autres erreurs : throw immédiatement
                throw error;
            }
        }

        throw lastError || new Error('Échec après plusieurs tentatives');
    }
}
