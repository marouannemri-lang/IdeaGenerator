import { prisma } from '@talentflow/database';

export class DashboardService {
    async getStats(userId: string) {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // 1. Chiffre d'affaires (Factures payées ce mois-ci)
        // Note: Dans ce MVP, on considère "PENDING" ou "PAID" comme base pour l'instant car pas de sélecteur "Marquer payé"
        // Idéalement on filtrerait sur 'PAID'.
        const invoices = await prisma.invoice.findMany({
            where: {
                userId,
                createdAt: { gte: firstDayOfMonth }
            }
        });
        const monthlyRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);

        // 2. Devis en attente (Status SENT ou DRAFT)
        const pendingQuotesCount = await prisma.quote.count({
            where: {
                userId,
                status: { in: ['SENT', 'DRAFT'] }
            }
        });

        // 3. Appels manqués (Status NEW)
        const newCallsCount = await prisma.missedCall.count({
            where: {
                userId,
                status: 'NEW'
            }
        });

        // Activité récente (Mélange Devis et Factures)
        const recentQuotes = await prisma.quote.findMany({
            where: { userId },
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: { client: true }
        });

        return {
            monthlyRevenue,
            pendingQuotesCount,
            newCallsCount,
            recentActivity: recentQuotes.map(q => ({
                type: 'QUOTE',
                id: q.id,
                title: `Devis ${q.quoteNumber}`,
                date: q.createdAt,
                amount: q.total,
                clientName: q.client ? `${q.client.firstName} ${q.client.lastName}` : 'Inconnu'
            }))
        };
    }
}

export const dashboardService = new DashboardService();
