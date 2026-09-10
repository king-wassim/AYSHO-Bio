# Audit de production AYSHO — Bugs trouvés et corrigés

> **Date** : 8 septembre 2026  
> **Stack** : React 18 + Vite 5 · Strapi v5.51.0 · PostgreSQL 16 · Nginx · Docker (VPS OVHcloud)  
> **Résultat** : 5 bugs corrigés, application stable en production

---

## Contexte

L'application fonctionnait correctement en développement mais présentait plusieurs comportements anormaux en production, notamment un rafraîchissement automatique qui interrompait le parcours de commande.

---

## Bug 1 (P0) — Rafraîchissement automatique toutes les 30 secondes

### Symptôme
Le site se "rechargeait" toutes les 30 secondes ou dès que l'utilisateur revenait sur l'onglet. Le panier disparaissait, le formulaire de checkout était réinitialisé.

### Cause racine
Dans `frontend/src/store/CatalogContext.tsx`, la fonction `fetchData` appelait `setLoading(true)` à chaque exécution :

```typescript
// AVANT — cassé
const fetchData = async () => {
  setLoading(true)  // ← déclenchait le spinner plein-écran à chaque poll
  // ...
}

const refreshTimer = window.setInterval(() => void fetchData(), 30_000)
window.addEventListener('focus', refreshOnFocus)
```

Dans `App.tsx`, quand `loading` passait à `true`, React **démontait toute l'arborescence `HomePage`**, y compris `CartProvider`. Comme le panier était en mémoire React pure, il était intégralement vidé à chaque cycle de 30 secondes.

Ce n'était pas un vrai rechargement de page navigateur, mais l'effet était identique : spinner plein-écran, état perdu, checkout interrompu.

### Correction
`fetchData` reçoit un paramètre `isInitialLoad`. Le spinner n'est déclenché qu'au **premier chargement**. Les polls de fond (30s, focus) mettent à jour les données silencieusement, sans toucher `loading`.

Un `AbortController` annule les requêtes en vol si l'utilisateur navigue avant la fin du fetch.

```typescript
// APRÈS — corrigé
const fetchData = async (isInitialLoad: boolean) => {
  if (isInitialLoad) {
    setLoading(true)  // spinner uniquement au démarrage
  }
  // fetch avec AbortController...
  if (isInitialLoad) {
    setLoading(false)
  }
}

void fetchData(true)  // premier chargement → spinner

const refreshTimer = window.setInterval(() => {
  abortController.abort()
  abortController = new AbortController()
  void fetchData(false)  // poll de fond → silencieux
}, 30_000)
```

**Fichier modifié** : `frontend/src/store/CatalogContext.tsx`

---

## Bug 2 (P0) — Double `CatalogProvider` (double fetch au démarrage)

### Symptôme
Deux requêtes API identiques (`/api/categories` et `/api/products`) étaient émises simultanément au chargement de chaque page.

### Cause racine
`CatalogProvider` était instancié **deux fois** : une fois dans `main.tsx` et une deuxième fois dans `App.tsx`. Les deux providers créaient chacun leur propre `useEffect` avec leurs propres fetches.

```
main.tsx
└── <CatalogProvider>          ← Provider 1 (inutilisé)
    └── App.tsx
        └── <CatalogProvider>  ← Provider 2 (consommé par AppContent)
            └── AppContent
```

### Correction
Suppression du `CatalogProvider` redondant dans `App.tsx`. Seul celui de `main.tsx` est conservé.

```typescript
// AVANT
export default function App() {
  return (
    <CatalogProvider>
      <AppContent />
    </CatalogProvider>
  )
}

// APRÈS
export default function App() {
  return <AppContent />
}
```

**Fichier modifié** : `frontend/src/App.tsx`

---

## Bug 3 (P0) — Bootstrap Strapi effaçait les catégories à chaque redémarrage

### Symptôme
Après chaque redémarrage de Strapi (déploiement, OOM, restart Docker), tous les produits perdaient leur catégorie. Les filtres par catégorie ne fonctionnaient plus.

### Cause racine
À la fin du fichier `backend/src/index.ts`, un bloc de code était exécuté **à chaque démarrage** de Strapi :

```typescript
// AVANT — destructeur, exécuté à CHAQUE restart
const productsWithCategories = await strapi.db
  .query('api::product.product')
  .findMany({ where: { category: { $notNull: true } } })

for (const product of productsWithCategories) {
  await strapi.documents('api::product.product').update({
    documentId: product.documentId,
    data: { category: null },  // ← effaçait toutes les relations
  })
}
```

Ce bloc avait probablement été écrit pour un test de migration et n'aurait jamais dû rester dans le bootstrap de production.

### Correction
Suppression pure et simple du bloc. Les relations catégorie/produit définies dans l'admin Strapi sont désormais préservées entre les redémarrages.

**Fichier modifié** : `backend/src/index.ts`

---

## Bug 4 (P1) — Prix non validés côté serveur

### Symptôme
N'importe qui pouvait soumettre une commande avec `price: 0.001` et `totalPrice: 0.001` via un appel API direct. Le serveur acceptait ces valeurs sans vérification.

### Cause racine
Le controller `POST /api/orders` utilisait directement les prix envoyés par le client dans le payload :

```typescript
// Frontend envoyait (et le serveur acceptait aveuglément)
items: items.map(item => ({
  productId: item.product.id,
  price: item.product.price,  // ← valeur cliente, non vérifiée
})),
totalPrice: grandTotal  // ← calculé côté client
```

### Correction
Le controller récupère maintenant les vrais prix depuis la base de données et recalcule le total côté serveur. Les valeurs prix du client sont ignorées.

```typescript
// APRÈS — prix récupérés depuis la DB
for (const item of items) {
  const rows = await strapi.db.query('api::product.product').findMany({
    where: { documentId: productId },
    select: ['documentId', 'name', 'price'],
  })
  const product = rows[0]

  if (!product) {
    ctx.status = 400
    ctx.body = { error: { message: `Produit introuvable : ${productId}` } }
    return
  }

  serverTotal += product.price * quantity
}

// totalPrice dans le payload est remplacé par la valeur serveur
setBody(ctx, {
  ...body,
  data: { ...body.data, items: validatedItems, totalPrice: serverTotal }
})
```

> **Note** : la première version de cette correction utilisait `{ $or: [...] }` dans la query Strapi v5, ce qui échouait silencieusement. Corrigé en deux requêtes séquentielles simples (d'abord par `documentId`, ensuite par `id` numérique en fallback).

**Fichier modifié** : `backend/src/api/order/controllers/order.ts`

---

## Bug 5 (P2) — Panier perdu au rechargement manuel

### Symptôme
Un rechargement manuel de la page (F5, fermeture accidentelle d'onglet) vidait intégralement le panier.

### Cause racine
Le panier était stocké uniquement en mémoire React (`useState`), sans aucune persistance :

```typescript
// AVANT
const [items, setItems] = useState<CartItem[]>([])
// Perdu à chaque unmount ou reload
```

### Correction
Le panier est maintenant initialisé depuis `localStorage` au montage et synchronisé à chaque modification. Il survit aux rechargements manuels, aux navigations, et — couplé à la correction du Bug 1 — aux polls de fond.

```typescript
const CART_STORAGE_KEY = 'aysho_cart'

function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Initialisation depuis localStorage
const [items, setItems] = useState<CartItem[]>(loadCartFromStorage)

// Sync à chaque changement
useEffect(() => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
}, [items])

// Nettoyage après commande confirmée
const clear = useCallback(() => {
  setItems([])
  localStorage.removeItem(CART_STORAGE_KEY)
}, [])
```

**Fichier modifié** : `frontend/src/store/CartContext.tsx`

---

## Récapitulatif des fichiers modifiés

| Fichier | Bug corrigé |
|---------|-------------|
| `frontend/src/store/CatalogContext.tsx` | Bug 1 — refresh automatique + AbortController |
| `frontend/src/App.tsx` | Bug 2 — double CatalogProvider |
| `backend/src/index.ts` | Bug 3 — bootstrap destructeur |
| `backend/src/api/order/controllers/order.ts` | Bug 4 — validation des prix côté serveur |
| `frontend/src/store/CartContext.tsx` | Bug 5 — persistance panier localStorage |

---

## Procédure de déploiement appliquée

```bash
# Sur le PC local
git add <fichiers>
git commit -m "fix: ..."
git push origin main

# Sur le VPS
cd /opt/aysho
git pull origin main

# Rebuild des images concernées
sudo docker compose -f docker-compose.production.yml build --no-cache strapi
sudo docker compose -f docker-compose.production.yml build --no-cache nginx
sudo docker compose -f docker-compose.production.yml up -d --no-build --pull never

# Vérification
curl -k -H 'Host: aysho.tn' https://127.0.0.1/health
curl -k -H 'Host: aysho.tn' https://127.0.0.1/api/health
curl -k -H 'Host: aysho.tn' https://127.0.0.1/api/products
```

---

## État final après corrections

| Check | Résultat |
|-------|----------|
| `/health` (Nginx) | `healthy` ✅ |
| `/api/health` (Strapi + PostgreSQL) | `connected`, latence 1ms ✅ |
| `/api/products` | 4 produits retournés ✅ |
| Refresh automatique | Supprimé ✅ |
| Panier persistant | localStorage actif ✅ |
| Catégories produits stables | Bootstrap corrigé ✅ |
| Prix validés serveur | Actif ✅ |

---

## Points restants à surveiller

- **Cloudinary** : les clés sont renseignées dans le `.env` VPS. Uploader les images produit depuis l'admin Strapi (`https://aysho.tn/admin`).
- **Resend** : les clés sont renseignées. Tester la réception d'email avec `POST /api/orders/test-email` (requiert un token admin).
- **Idempotence des commandes** : en cas de retry réseau, deux commandes identiques peuvent être créées. Recommandé : générer un `idempotencyKey` UUID côté client et le vérifier côté serveur.
- **Rate limiting** : le store est en mémoire vive, réinitialisé à chaque restart Strapi. Acceptable pour un VPS single-instance, mais un backend Redis serait plus robuste.
