Très bien, je vais t’expliquer comment utiliser ton `LangueService` pour gérer le changement de langue en fonction des statuts.  

---

## 🔎 Principe
- Tu as une table `statusname` dans ton backend Spring Boot.  
- Chaque enregistrement contient un `id_status` et un `name`.  
- Exemple :  
  - `id_status = 1, name = "nouveau"` (français)  
  - `id_status = 1, name = "vaoavao"` (malgache)  

👉 L’idée est que **plusieurs traductions** existent pour le même `id_status`.  
Donc tu peux récupérer toutes les traductions avec `getAll()`, puis choisir celle qui correspond à la langue active.

---

## 🛠️ Exemple d’utilisation côté React

### 1. Charger toutes les traductions
```javascript
import { useEffect, useState } from "react";
import LangueService from "../../services/backoffice/LangueService";

function StatusComponent() {
  const [statusNames, setStatusNames] = useState([]);
  const [lang, setLang] = useState("fr"); // langue active : fr ou mg

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await LangueService.getAll();
        setStatusNames(data);
      } catch (error) {
        console.error("Erreur:", error);
      }
    };
    fetchData();
  }, []);

  // fonction pour trouver la traduction selon id_status et langue
  const getStatusName = (id_status) => {
    const match = statusNames.find(
      (s) => s.id_status === id_status && s.lang === lang
    );
    return match ? match.name : "???";
  };

  return (
    <div>
      <h3>Ticket #1</h3>
      <p>Statut : {getStatusName(1)}</p>

      <button onClick={() => setLang("fr")}>Français</button>
      <button onClick={() => setLang("mg")}>Malagasy</button>
    </div>
  );
}

export default StatusComponent;
```

---

### 2. Structure attendue côté API
Ton API doit renvoyer quelque chose comme :
```json
[
  { "id_status": 1, "lang": "fr", "name": "nouveau" },
  { "id_status": 1, "lang": "mg", "name": "vaoavao" },
  { "id_status": 3, "lang": "fr", "name": "en cours" },
  { "id_status": 3, "lang": "mg", "name": "efa manao" }
]
```

---

### 3. Mise à jour d’une traduction
Si tu veux remplacer `"nouveau"` par `"vaoavao"` pour `id_status = 1` :
```javascript
await LangueService.update(1, {
  lang: "mg",
  name: "vaoavao"
});
```

---

✅ Résumé :  
- `getAll()` → récupère toutes les traductions.  
- `update(id, updated_fields)` → modifie une traduction existante.  
- Côté React, tu filtres par `id_status` **et** par `lang` pour afficher la bonne traduction.  

---

Veux-tu que je te prépare un **mini dictionnaire dynamique** (objet JavaScript) qui mappe directement `id_status` → traduction selon la langue choisie, pour éviter de faire un `find()` à chaque fois ?





<!--  -->
Je vais te guider étape par étape pour créer un bouton/composant de statut multilingue.

## Comprendre l'objectif

```
API LangueService.getAll() retourne quelque chose comme :
[
  { id_status: 1, langue: "fr", label: "Nouveau" },
  { id_status: 1, langue: "en", label: "New" },
  { id_status: 2, langue: "fr", label: "En cours" },
  { id_status: 2, langue: "en", label: "In Progress" },
]

KanbanColumn reçoit : columnId (qui correspond à id_status)
→ On compare columnId == id_status pour trouver le bon label
```

---

## Étape 1 — Hook personnalisé `useStatusLabel`

Crée un fichier `hooks/useStatusLabel.js` :

```javascript
import { useState, useEffect } from "react";
import LangueService from "../services/LangueService";

export function useStatusLabel(langue = "fr") {
  const [statusNames, setStatusNames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    LangueService.getAll()
      .then((data) => setStatusNames(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Fonction : donne le label pour un id_status donné
  const getLabel = (id_status) => {
    const found = statusNames.find(
      (s) => s.id_status === id_status && s.langue === langue
    );
    return found ? found.label : `Status ${id_status}`; // fallback
  };

  return { getLabel, loading };
}
```

---

## Étape 2 — Contexte de langue `LangueContext`

Pour que toute l'app partage la langue choisie, crée `context/LangueContext.jsx` :

```jsx
import { createContext, useContext, useState } from "react";

const LangueContext = createContext();

export function LangueProvider({ children }) {
  const [langue, setLangue] = useState("fr"); // langue par défaut

  return (
    <LangueContext.Provider value={{ langue, setLangue }}>
      {children}
    </LangueContext.Provider>
  );
}

export function useLangue() {
  return useContext(LangueContext);
}
```

Ensuite dans `main.jsx`, entoure ton app :

```jsx
import { LangueProvider } from "./context/LangueContext";

<LangueProvider>
  <App />
</LangueProvider>
```

---

## Étape 3 — Composant `StatusLabel`

Crée `components/StatusLabel.jsx` :

```jsx
import { useLangue } from "../context/LangueContext";
import { useStatusLabel } from "../hooks/useStatusLabel";

function StatusLabel({ id_status }) {
  const { langue } = useLangue();
  const { getLabel, loading } = useStatusLabel(langue);

  if (loading) return <span>...</span>;

  return <span className="status-label">{getLabel(id_status)}</span>;
}

export default StatusLabel;
```

---

## Étape 4 — Bouton sélecteur de langue `LangueSwitcher`

Crée `components/LangueSwitcher.jsx` :

```jsx
import { useLangue } from "../context/LangueContext";

const LANGUES = ["fr", "en", "mg"]; // adapte selon tes langues

function LangueSwitcher() {
  const { langue, setLangue } = useLangue();

  return (
    <div className="langue-switcher">
      {LANGUES.map((l) => (
        <button
          key={l}
          onClick={() => setLangue(l)}
          className={langue === l ? "active" : ""}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default LangueSwitcher;
```

---

## Étape 5 — Intégrer dans `KanbanColumn`

```jsx
import StatusLabel from "./StatusLabel"; // ← nouveau

function KanbanColumn({ title, items, columnId, statusColor, onDrop }) {

  // ...handlers inchangés...

  return (
    <div className="kanban-column" onDragOver={handleDragOver} onDrop={handleDrop}
      style={{ backgroundColor: `${statusColor}35` }}>
      
      <div className="kanban-header">
        {/* Remplace {title} par StatusLabel */}
        <h3>
          <StatusLabel id_status={columnId} /> {/* ← compare columnId == id_status */}
        </h3>
        <span className="kanban-count">{items.length}</span>
      </div>

      {/* ...reste inchangé */}
    </div>
  );
}
```

---

## Résumé du flux

```
LangueSwitcher (FR/EN/MG)
        ↓ setLangue()
  LangueContext (langue = "en")
        ↓ useLangue()
  useStatusLabel("en")
        ↓ LangueService.getAll() → filtre par langue + id_status
  StatusLabel → affiche "New" / "Nouveau" / "Vaovao"
        ↑
  KanbanColumn passe columnId → id_status à comparer
```

---

**Point clé :** le `useStatusLabel` fait **un seul appel API** et retourne `getLabel(id_status)` — tu peux l'appeler autant de fois que tu as de colonnes sans multiplier les requêtes.

Tu veux qu'on attaque l'une des étapes en détail ?



Le problème vient du `handleDrop` dans `KanbanPage.jsx` — il compare `targetColumnId` avec `"new"`, `"progressing"`, `"closed"` (les anciens `column.id`), mais maintenant `columnId` envoie `1`, `3`, `6` (les `id_status`).

## Ce qu'il faut changer dans `KanbanPage.jsx`

### 1 — Le `handleDrop` : remplacer le switch

```jsx
// AVANT
const handleDrop = async (itemId, targetColumnId) => {
    let apiStatusValue;
    switch (targetColumnId) {
        case "new":         apiStatusValue = 1; break;
        case "progressing": apiStatusValue = 3; break;
        case "closed":      apiStatusValue = 6; break;
        default:            apiStatusValue = targetColumnId;
    }
```

```jsx
// APRÈS — targetColumnId EST déjà l'id_status (1, 3, 6)
const handleDrop = async (itemId, targetColumnId) => {
    const apiStatusValue = targetColumnId; // ← direct, plus besoin du switch
```

---

### 2 — Le `setColumnsData` dans handleDrop : comparer avec `id_status`

```jsx
// AVANT
return updated.map((col) =>
    col.id === targetColumnId          // ← comparait "new", "progressing"...
        ? { ...col, items: [...col.items, updatedItem] }
        : col
);
```

```jsx
// APRÈS
return updated.map((col) =>
    col.id_status === targetColumnId   // ← compare 1, 3, 6
        ? { ...col, items: [...col.items, updatedItem] }
        : col
);
```

---

### 3 — Les filtres `items` : cohérence avec `id_status`

```jsx
// AVANT — filtrait par t.status.id === 2 (mauvaise valeur pour "progressing")
{ id: "progressing", title: "En cours", id_status: 3,
  items: ticketsRecus.filter(t => t.status.name === "progressing" || t.status.id === 2) }
```

```jsx
// APRÈS — utiliser uniquement id_status comme référence
{
    id: "new",         title: "Nouveau",   id_status: 1,
    items: ticketsRecus.filter(t => t.status.id === 1)
},
{
    id: "progressing", title: "En cours",  id_status: 3,
    items: ticketsRecus.filter(t => t.status.id === 3)
},
{
    id: "closed",      title: "Terminé",   id_status: 6,
    items: ticketsRecus.filter(t => t.status.id === 6)
}
```

---

### Résultat final `KanbanPage.jsx`

```jsx
const structureKanban = [
    { id: "new",         title: "Nouveau", id_status: 1, items: ticketsRecus.filter(t => t.status.id === 1) },
    { id: "progressing", title: "En cours", id_status: 3, items: ticketsRecus.filter(t => t.status.id === 3) },
    { id: "closed",      title: "Terminé",  id_status: 6, items: ticketsRecus.filter(t => t.status.id === 6) }
];

const handleDrop = async (itemId, targetColumnId) => {
    const apiStatusValue = targetColumnId; // déjà l'id_status

    const previousColumnsData = [...columndata];

    setColumnsData((prev) => {
        let movedItem = null;
        const updated = prev.map((col) => {
            const found = col.items.find((i) => String(i.id) === String(itemId));
            if (found) movedItem = found;
            return { ...col, items: col.items.filter((i) => String(i.id) !== String(itemId)) };
        });
        if (!movedItem) return prev;

        const updatedItem = {
            ...movedItem,
            status: { ...movedItem.status, id: apiStatusValue }
        };

        return updated.map((col) =>
            col.id_status === targetColumnId  // ← id_status ici
                ? { ...col, items: [...col.items, updatedItem] }
                : col
        );
    });

    try {
        await TicketService.updateStatus(itemId, apiStatusValue);
    } catch (error) {
        console.error("Erreur:", error);
        alert("Erreur de déplacement.");
        setColumnsData(previousColumnsData);
    }
};
```

---

## Résumé des 3 corrections

| Où | Avant | Après |
|---|---|---|
| `structureKanban` filtres | `t.status.id === 2` (faux) | `t.status.id === 3` |
| `handleDrop` switch | `case "new": apiStatusValue = 1` | `const apiStatusValue = targetColumnId` |
| `setColumnsData` comparaison | `col.id === targetColumnId` | `col.id_status === targetColumnId` |
