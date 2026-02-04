import { prisma } from '@talentflow/database';

async function checkIds() {
    console.log('🔍 VÉRIFICATION DES IDs\n');

    // 1. Users
    const users = await prisma.user.findMany({
        select: { id: true, email: true, firstName: true, lastName: true }
    });
    console.log('👤 USERS:');
    console.table(users);

    // 2. Clients (avec leur userId)
    const clients = await prisma.client.findMany({
        select: { id: true, userId: true, firstName: true, lastName: true, phoneNumber: true },
        take: 10
    });
    console.log('\n👥 CLIENTS (top 10):');
    console.table(clients);

    // 3. Quotes
    const quotes = await prisma.quote.findMany({
        select: { id: true, userId: true, clientId: true, quoteNumber: true, status: true },
        take: 10
    });
    console.log('\n📝 QUOTES (top 10):');
    console.table(quotes);

    // 4. Invoices
    const invoices = await prisma.invoice.findMany({
        select: { id: true, userId: true, clientId: true, invoiceNumber: true, status: true },
        take: 10
    });
    console.log('\n💰 INVOICES (top 10):');
    console.table(invoices);

    // 5. Messages
    const messages = await prisma.message.findMany({
        select: { id: true, clientId: true, role: true, phoneNumber: true, createdAt: true },
        take: 10,
        orderBy: { createdAt: 'desc' }
    });
    console.log('\n💬 MESSAGES (derniers 10):');
    console.table(messages);

    // Statistiques
    console.log('\n📊 STATISTIQUES GLOBALES:');
    const stats = {
        users: await prisma.user.count(),
        clients: await prisma.client.count(),
        quotes: await prisma.quote.count(),
        invoices: await prisma.invoice.count(),
        messages: await prisma.message.count(),
        interventions: await prisma.intervention.count(),
    };
    console.table(stats);

    await prisma.$disconnect();
}

checkIds().catch(console.error);
