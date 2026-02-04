# 🎉 Nouvelles fonctionnalités implémentées

## ✅ Corrections de bugs

### 1. Génération PDF Factures
- ✅ Les factures incluent maintenant les **items** dans l'API
- ✅ Le PDF se génère correctement avec tous les détails

### 2. Conversion Devis → Facture
- ✅ La liste des devis se **rafraîchit automatiquement** après conversion
- ✅ Le statut du devis passe à "ACCEPTED" 
- ✅ Prévention des doublons (si facture existe déjà, elle est retournée)

## 🆕 Nouvelles fonctionnalités

### 3. Menu Utilisateur (En haut à droite)
- 📍 Accès rapide aux **Paramètres**
- 🔔 Notifications (page à créer)
- 🚪 **Déconnexion**

### 4. Catalogue Externe - Produits
- 📦 Nouvel onglet **"Produits"** dans la sidebar
- 🔍 **Recherche en temps réel** sur Leroy Merlin (avec web scraping)
- 🖼️ Affichage des produits avec images, prix, descriptions
- ➕ Bouton "Ajouter" pour intégration future aux devis
- 🔗 Bouton "Voir" pour ouvrir le produit sur le site source

---

## 📦 Installation des dépendances manquantes

Pour activer le **scraping Leroy Merlin**, vous devez installer 2 packages :

```powershell
# Dans le dossier apps/api
cd apps/api
npm install axios cheerio
# OU si pnpm fonctionne:
pnpm add axios cheerio
```

**Note** : Si le scraping à cause de changements dans la structure HTML Leroy Merlin, le système retourne automatiquement des **données de démonstration (mock)** pour tester l'interface.

---

## 🚀 Utilisation

### Menu Utilisateur
1. Cliquez sur l'**icône utilisateur** en haut à droite
2. Accédez aux **Paramètres**, **Notifications**, ou **Déconnectez-vous**

### Catalogue Externe
1. Allez dans l'onglet **"Produits"** 📦
2. Tapez un terme de recherche (ex: "serrure 3 points")
3. Attendez 500ms (debounce) → Les résultats s'affichent
4. Cliquez sur "**Ajouter**" pour marquer un produit (TODO: intégration devis)
5. Cliquez sur "**Voir**" pour ouvrir le produit sur Leroy Merlin

### Recherche Universelle
- **Clients** : Recherche sur nom, prénom, entreprise, email, téléphone
- **Devis** : Recherche sur n° devis, titre, nom client
- **Factures** : Recherche sur n° facture, titre, nom client

---

## 🔮 Prochaines étapes suggérées

1. **Intégration Produits → Devis**
   - Context/State global pour panier temporaire
   - Import direct de produits externes dans formulaire devis

2. **API N8N pour Produits**
   - Endpoint dédié pour webhooks N8N
   - Recherche automatique basée sur conversation WhatsApp

3. **Page Notifications**
   - Système de notifications temps réel
   - Alertes factures en retard, nouveaux appels, etc.

4. **Amélioration Scraping**
   - Ajouter **Bricoman**, **Castorama**
   - Cache Redis pour performances
   - Rate limiting intelligent

---

## 📝 Notes techniques

### Backend (API)
- `/api/external-catalog/search?q=...` : Recherche produits externes
- Service `ExternalCatalogService` avec fallback mock
- Axios + Cheerio pour parsing HTML

### Frontend
- Page `/products` avec recherche debounced
- Composant `UserMenu` dans le layout
- `SearchInput` réutilisable partout

---

**Dernière mise à jour** : 2026-02-03
**Auteur** : Antigravity 🤖
