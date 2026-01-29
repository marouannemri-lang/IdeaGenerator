import { prisma } from '@talentflow/database';

export interface CreateQuoteInput {
    clientId: string;
    title?: string;
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
    }[];
    validUntil?: string; // Date string
}

export class QuoteService {
    private async generateQuoteNumber(userId: string): Promise<string> {
        const count = await prisma.quote.count({ where: { userId } });
        const year = new Date().getFullYear().toString().substr(-2);
        // Format: D-24-001
        return `D-${year}-${(count + 1).toString().padStart(3, '0')}`;
    }

    async create(userId: string, data: CreateQuoteInput) {
        const quoteNumber = await this.generateQuoteNumber(userId);

        // Calcul des totaux
        let subtotal = 0;
        const itemsWithTotal = data.items.map((item, index) => {
            const total = item.quantity * item.unitPrice;
            subtotal += total;
            return { ...item, total, order: index };
        });

        const tvaRate = 20.0;
        const tvaAmount = subtotal * (tvaRate / 100);
        const total = subtotal + tvaAmount;

        return prisma.quote.create({
            data: {
                userId,
                clientId: data.clientId,
                quoteNumber,
                title: data.title,
                status: 'DRAFT',
                subtotal,
                tvaRate,
                tvaAmount,
                total,
                validUntil: data.validUntil ? new Date(data.validUntil) : null,
                items: {
                    create: itemsWithTotal,
                },
            },
            include: {
                items: true,
                client: true,
            },
        });
    }

    async findAll(userId: string) {
        return prisma.quote.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                client: true,
            },
            take: 50,
        });
    }

    async findOne(userId: string, quoteId: string) {
        return prisma.quote.findFirst({
            where: { id: quoteId, userId },
            include: {
                client: true,
                items: { orderBy: { order: 'asc' } },
            },
        });
    }
}

export const quoteService = new QuoteService();
