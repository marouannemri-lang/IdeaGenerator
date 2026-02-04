import { prisma } from '@talentflow/database';

async function diagnose() {
    console.log('🔍 DIAGNOSTIC MULTI-TENANT\n');

    // 1. Vérifier l'utilisateur
    const user = await prisma.user.findFirst({
        where: { email: 'marouanprojet@gmail.com' }
    });

    if (!user) {
        console.error('❌ User marouanprojet@gmail.com NOT FOUND!');
        console.log('Available users:');
        const allUsers = await prisma.user.findMany({ select: { email: true, id: true } });
        console.table(allUsers);
        process.exit(1);
    }

    console.log('✅ User found:');
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}\n`);

    // 2. Vérifier les clients de cet utilisateur
    const clients = await prisma.client.findMany({
        where: { userId: user.id },
        select: { id: true, firstName: true, lastName: true, phoneNumber: true }
    });

    console.log(`📊 Clients for user ${user.email}:`);
    if (clients.length === 0) {
        console.error('❌ NO CLIENTS FOUND for this user!');

        // Vérifier s'il y a des clients mais avec un autre userId
        const allClients = await prisma.client.findMany({
            select: { userId: true, firstName: true }
        });
        console.log(`\n⚠️ Total clients in DB: ${allClients.length}`);
        if (allClients.length > 0) {
            console.log('First client userId:', allClients[0].userId);
            console.log('Expected userId:', user.id);
            console.log('\n🔴 PROBLEM: Clients exist but with DIFFERENT userId!');
        }
    } else {
        console.log(`✅ Found ${clients.length} clients:`);
        console.table(clients);
    }

    // 3. Vérifier les devis
    const quotes = await prisma.quote.findMany({
        where: { userId: user.id },
        select: { quoteNumber: true, title: true, status: true, total: true }
    });
    console.log(`\n📝 Quotes: ${quotes.length}`);
    if (quotes.length > 0) console.table(quotes);

    // 4. Vérifier les factures
    const invoices = await prisma.invoice.findMany({
        where: { userId: user.id },
        select: { invoiceNumber: true, title: true, status: true, total: true }
    });
    console.log(`\n💰 Invoices: ${invoices.length}`);
    if (invoices.length > 0) console.table(invoices);

    // 5. Vérifier les messages
    const messages = await prisma.message.count();
    console.log(`\n💬 Total messages in DB: ${messages}`);

    await prisma.$disconnect();
}

diagnose().catch(console.error);
