import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ExternalProduct {
    id: string;
    name: string;
    price: number;
    description?: string;
    imageUrl?: string;
    source: 'leroy_merlin' | 'bricoman';
    url: string;
}

export class ExternalCatalogService {
    /**
     * Search Leroy Merlin catalog
     * Note: This is a basic implementation. Real scraping may need:
     * - Rate limiting
     * - User-Agent rotation
     * - Error handling for changed HTML structure
     */
    async searchLeroyMerlin(query: string): Promise<ExternalProduct[]> {
        try {
            // Leroy Merlin search URL
            const searchUrl = `https://www.leroymerlin.fr/recherche?term=${encodeURIComponent(query)}`;

            const response = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 10000
            });

            const $ = cheerio.load(response.data);
            const products: ExternalProduct[] = [];

            // Parse product listings (селекторы могут меняться!)
            $('.product-card').each((index, element) => {
                const $el = $(element);

                const name = $el.find('.product-name').text().trim();
                const priceText = $el.find('.price').text().trim();
                const price = parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
                const imageUrl = $el.find('img').attr('src') || '';
                const productUrl = $el.find('a').attr('href') || '';

                if (name && price > 0) {
                    products.push({
                        id: `lm_${index}_${Date.now()}`,
                        name,
                        price,
                        imageUrl,
                        url: productUrl.startsWith('http') ? productUrl : `https://www.leroymerlin.fr${productUrl}`,
                        source: 'leroy_merlin'
                    });
                }
            });

            return products.slice(0, 20); // Limit to 20 results
        } catch (error) {
            console.error('Leroy Merlin scraping error:', error);
            // Fallback to mock data for demo
            return this.getMockProducts(query);
        }
    }

    /**
     * Mock products for development / demo
     */
    private getMockProducts(query: string): ExternalProduct[] {
        const mockData = [
            {
                id: 'mock_1',
                name: `Serrure 3 points A2P** - ${query}`,
                price: 189.90,
                description: 'Serrure multipoints haute sécurité certifiée A2P**',
                imageUrl: 'https://via.placeholder.com/200',
                source: 'leroy_merlin' as const,
                url: 'https://www.leroymerlin.fr'
            },
            {
                id: 'mock_2',
                name: `Cylindre européen - ${query}`,
                price: 45.50,
                description: 'Cylindre de sécurité renforcé',
                imageUrl: 'https://via.placeholder.com/200',
                source: 'leroy_merlin' as const,
                url: 'https://www.leroymerlin.fr'
            },
            {
                id: 'mock_3',
                name: `Kit serrure ${query} + cylindre`,
                price: 129.00,
                description: 'Ensemble complet serrure + cylindre',
                imageUrl: 'https://via.placeholder.com/200',
                source: 'leroy_merlin' as const,
                url: 'https://www.leroymerlin.fr'
            }
        ];

        return mockData;
    }
}

export const externalCatalogService = new ExternalCatalogService();
