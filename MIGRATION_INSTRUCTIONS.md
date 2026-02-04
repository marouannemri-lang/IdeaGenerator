# 🔧 Actions à effectuer

## ⚠️ Migration Prisma requise

J'ai ajouté les modèles `QuoteComment` et `QuoteAttachment` au schema pour supporter :
- 💬 **Commentaires** sur les devis (depuis WhatsApp/N8N/Web)
- 📎 **Pièces jointes** (images, documents, audio)

### Exécutez cette commande dans CMD (pas PowerShell) :

```bash
cd packages\database
npx prisma migrate dev --name add_quote_comments_attachments
```

**OU** si vous utilisez VS Code :
1. Terminal → Command Prompt
2. Tapez la commande ci-dessus

---

## 📋 Modifications effectuées

### Schema Prisma
- ✅ Ajout `Quote.comments` (relation)
- ✅ Ajout `Quote.attachments` (relation)
- ✅ Nouveau modèle `QuoteComment`
  - `content` : Texte du commentaire
  - `author` : "client" ou "admin" 
  - `source` : "whatsapp", "web", "n8n"
- ✅ Nouveau modèle `QuoteAttachment`
  - `fileName`, `fileUrl`, `fileType` 
  - `fileSize`, `source`

### Page Devis
- ✅ Filtrage des devis convertis (statut ACCEPTED masqué ou grisé)
- ✅ Rafraîchissement automatique après conversion

---

## 🚀 Prochaines étapes

Après la migration, je vais créer :
1. **Interface Commentaires** dans le détail du devis
2. **Upload de fichiers** dans le formulaire devis
3. **API endpoints** pour N8N :
   - `POST /quotes/:id/comments`
   - `POST /quotes/:id/attachments`
   - `GET /quotes/:id/full` (avec comments + attachments)

---

**Exécutez la migration maintenant** puis faites-moi signe ! 😊
