import { prisma } from '@talentflow/database';

async function deepDiagnosis() {
    console.log('🔬 DIAGNOSTIC COMPLET DE LA BASE DE DONNÉES\n');
    console.log('='.repeat(60));

    try {
        // 1. COMPTAGE GLOBAL
        console.log('\n📊 1. COMPTAGE GLOBAL DES TABLES:');
        const counts = {
            users: await prisma.user.count(),
            clients: await prisma.client.count(),
            quotes: await prisma.quote.count(),
            invoices: await prisma.invoice.count(),
            messages: await prisma.message.count(),
            interventions: await prisma.intervention.count(),
            quoteItems: await prisma.quoteItem.count(),
            invoiceItems: await prisma.invoiceItem.count(),
        };
        console.table(counts);

        // 2. VÉRIFICATION DES USERS
        console.log('\n👤 2. USERS EXISTANTS:');
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                createdAt: true
            }
        });

        if (users.length === 0) {
            console.error('❌ AUCUN USER dans la base !');
        } else {
            console.table(users);
        }

        // 3. VÉRIFICATION DES CLIENTS ET LEURS FK
        console.log('\n👥 3. CLIENTS ET VÉRIFICATION userId:');
        const clients = await prisma.client.findMany({
            select: {
                id: true,
                userId: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                user: {
                    select: { email: true }
                }
            }
        });

        if (clients.length === 0) {
            console.error('❌ AUCUN CLIENT dans la base !');
        } else {
            console.log(`✅ ${clients.length} clients trouvés:`);
            clients.forEach(c => {
                const userExists = c.user ? '✅' : '❌ ORPHELIN';
                console.log(`   ${userExists} ${c.firstName} ${c.lastName} (userId: ${c.userId.substring(0, 8)}...)`);
            });
        }

        // 4. VÉRIFICATION DES QUOTES ET LEURS FK
        console.log('\n📝 4. QUOTES ET VÉRIFICATION DES FK:');
        const quotes = await prisma.quote.findMany({
            select: {
                id: true,
                userId: true,
                clientId: true,
                quoteNumber: true,
                user: { select: { email: true } },
                client: { select: { firstName: true, lastName: true } }
            }
        });

        if (quotes.length === 0) {
            console.error('❌ AUCUN QUOTE dans la base !');
        } else {
            console.log(`✅ ${quotes.length} quotes trouvés:`);
            quotes.forEach(q => {
                const userOk = q.user ? '✅' : '❌';
                const clientOk = q.client ? '✅' : '❌';
                console.log(`   ${q.quoteNumber}: User ${userOk} | Client ${clientOk}`);
            });
        }

        // 5. VÉRIFICATION DES ORPHELINS (FK cassées)
        console.log('\n🔍 5. DÉTECTION DES ORPHELINS:');

        // Clients orphelins (userId invalide)
        const allClients = await prisma.$queryRaw`
            SELECT c.id, c.user_id, c.first_name, c.last_name
            FROM clients c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE u.id IS NULL
        ` as any[];

        if (allClients.length > 0) {
            console.error(`❌ ${allClients.length} CLIENTS ORPHELINS (userId invalide):`);
            console.table(allClients);
        } else {
            console.log('✅ Aucun client orphelin');
        }

        // Quotes orphelins
        const orphanQuotes = await prisma.$queryRaw`
            SELECT q.id, q.quote_number, q.user_id, q.client_id
            FROM quotes q
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN clients c ON q.client_id = c.id
            WHERE u.id IS NULL OR c.id IS NULL
        ` as any[];

        if (orphanQuotes.length > 0) {
            console.error(`❌ ${orphanQuotes.length} QUOTES ORPHELINS:`);
            console.table(orphanQuotes);
        } else {
            console.log('✅ Aucun quote orphelin');
        }

        // 6. VÉRIFICATION DES CONTRAINTES DE SCHÉMA
        console.log('\n🔧 6. VÉRIFICATION DES COLONNES OBLIGATOIRES:');

        const schemaCheck = await prisma.$queryRaw`
            SELECT 
                table_name, 
                column_name, 
                is_nullable,
                data_type
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'clients', 'quotes', 'invoices')
            AND column_name LIKE '%_id'
            ORDER BY table_name, column_name
        ` as any[];

        console.table(schemaCheck);

        // 7. DERNIÈRES MODIFICATIONS
        console.log('\n⏰ 7. DERNIÈRES MODIFICATIONS (top 5):');

        const recentUsers = await prisma.user.findMany({
            select: { email: true, createdAt: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
            take: 5
        });
        console.log('Users récents:');
        console.table(recentUsers);

        const recentClients = await prisma.client.findMany({
            select: { firstName: true, lastName: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        console.log('\nClients récents:');
        console.table(recentClients);

        // 8. MIGRATIONS APPLIQUÉES
        console.log('\n📜 8. MIGRATIONS APPLIQUÉES:');
        const migrations = await prisma.$queryRaw`
            SELECT migration_name, finished_at
            FROM _prisma_migrations
            ORDER BY finished_at DESC
            LIMIT 10
        ` as any[];
        console.table(migrations);

        console.log('\n' + '='.repeat(60));
        console.log('🎯 RÉSUMÉ DU DIAGNOSTIC:');
        console.log('='.repeat(60));

        if (counts.users === 0) {
            console.error('🔴 PROBLÈME CRITIQUE: Aucun utilisateur dans la base !');
            console.log('   → Solution: Exécuter le seed pour créer un user et ses données');
        } else if (counts.clients === 0) {
            console.error('🔴 PROBLÈME: Des users existent mais aucun client !');
            console.log('   → Solution: Exécuter le seed pour créer des clients');
        } else if (allClients.length > 0) {
            console.error('🔴 PROBLÈME: Des clients existent mais sont ORPHELINS !');
            console.log('   → Solution: Leurs userId pointent vers des users supprimés');
            console.log('   → Action: Supprimer les orphelins ou recréer les users manquants');
        } else {
            console.log('✅ Structure de la base correcte !');
            console.log('   → Vérifiez que vous êtes connecté avec le bon userId dans l\'app');
        }

    } catch (error) {
        console.error('\n❌ ERREUR DURANT LE DIAGNOSTIC:', error);
    } finally {
        await prisma.$disconnect();
    }
}

deepDiagnosis();
