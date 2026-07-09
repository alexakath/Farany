Parfait, Marie ! Je vais te guider **étape par étape** pour mettre en place ton système Kanban en React, avec une partie **FrontOffice** (affichage et interaction des tickets) et une partie **BackOffice** (stockage et personnalisation via SQLite).  

---

## 🟦 Étape 1 : Préparer le projet
1. Crée un projet React avec Vite ou Create React App :  
   ```bash
   npm create vite@latest kanban-app
   cd kanban-app
   npm install
   ```
2. Installe les dépendances utiles :  
   - `react-router-dom` (navigation)  
   - `react-beautiful-dnd` (drag & drop Kanban)  
   - `better-sqlite3` ou `sqlite3` (pour le backoffice côté serveur Node.js)  

---
Très bien, Marie ! Voici les commandes exactes pour installer **react-beautiful-dnd** côté FrontOffice et **sqlite3 / better-sqlite3** côté BackOffice (Node.js).  

---

## 🟦 1. Installer `react-beautiful-dnd` (FrontOffice React)
Dans ton projet React (par exemple créé avec Vite ou Create React App), exécute :

```bash
npm install react-beautiful-dnd
```

👉 Cela ajoute la librairie pour gérer le **drag & drop** dans ton Kanban.  
Ensuite tu pourras l’importer dans tes composants React :

```jsx
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
```

---

## 🟦 2. Installer SQLite côté BackOffice (Node.js)
Tu as deux options :

### Option A : `sqlite3` (classique)
```bash
npm install sqlite3
```

### Option B : `better-sqlite3` (plus rapide et synchrone)
```bash
npm install better-sqlite3
```

👉 Les deux font la même chose, mais **better-sqlite3** est souvent préféré car il est plus performant et simple à utiliser.

---

## 🟦 3. Exemple d’utilisation

### Avec `sqlite3` :
```js
import sqlite3 from "sqlite3";
const db = new sqlite3.Database("./kanban.db");

db.run("CREATE TABLE IF NOT EXISTS config (id INTEGER PRIMARY KEY, status TEXT, color TEXT, translation TEXT)");
```

### Avec `better-sqlite3` :
```js
import Database from "better-sqlite3";
const db = new Database("./kanban.db");

db.prepare("CREATE TABLE IF NOT EXISTS config (id INTEGER PRIMARY KEY, status TEXT, color TEXT, translation TEXT)").run();
```

---

## 🟦 4. Résumé
- **FrontOffice (React)** → `npm install react-beautiful-dnd`  
- **BackOffice (Node.js)** → `npm install sqlite3` **ou** `npm install better-sqlite3`  

---

👉 Veux-tu que je prépare un **mini script Node.js complet** (API Express + SQLite) que tu pourras lancer directement pour gérer tes couleurs et traductions ?

## 🟦 Étape 2 : Définir les statuts
On utilise **3 statuts fixes** :
- `Nouveau` → en malgache : **Vaovao**  
- `En cours` → en malgache : **Efa manao**  
- `Terminé` → en malgache : **Vita**

👉 Ces statuts seront affichés en colonnes dans le Kanban.

---

## 🟦 Étape 3 : FrontOffice – Page Kanban
1. Crée un composant `KanbanBoard.jsx` :
   - 3 colonnes (Nouveau, En cours, Terminé).  
   - Chaque colonne affiche ses tickets.  
   - Affiche le **nombre total de tickets par colonne**.  
   - Bouton “Ajouter 1 ticket” → ouvre un formulaire pour créer un ticket.  
   - Drag & Drop avec `react-beautiful-dnd` pour changer de statut.  

Exemple simplifié :
```jsx
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useState } from "react";

const initialTickets = [
  { id: "1", title: "Ticket A", status: "Nouveau" },
  { id: "2", title: "Ticket B", status: "En cours" },
];

const statuses = ["Nouveau", "En cours", "Terminé"];

function KanbanBoard() {
  const [tickets, setTickets] = useState(initialTickets);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const updated = tickets.map(t =>
      t.id === result.draggableId ? { ...t, status: result.destination.droppableId } : t
    );
    setTickets(updated);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: "flex", gap: "20px" }}>
        {statuses.map(status => (
          <Droppable droppableId={status} key={status}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}
                   style={{ border: "1px solid gray", width: "250px", minHeight: "300px" }}>
                <h3>{status} ({tickets.filter(t => t.status === status).length})</h3>
                {tickets.filter(t => t.status === status).map((t, index) => (
                  <Draggable key={t.id} draggableId={t.id} index={index}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                           style={{ padding: "10px", margin: "5px", background: "lightblue" }}>
                        {t.title}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}

export default KanbanBoard;
```

👉 Quand on clique sur un ticket, tu peux ouvrir une **modal** (`react-modal`) pour afficher les détails.

---

## 🟦 Étape 4 : BackOffice – Personnalisation
1. Crée une page `Backoffice.jsx` :
   - Formulaire pour choisir les **3 couleurs de fond** des colonnes.  
   - Formulaire pour définir la **traduction malgache** des statuts.  
   - Stocke ces valeurs dans une base SQLite (via un petit serveur Node.js/Express).  

Exemple côté serveur Node.js :
```js
import express from "express";
import sqlite3 from "sqlite3";

const app = express();
const db = new sqlite3.Database("./kanban.db");

app.use(express.json());

// Créer table config
db.run("CREATE TABLE IF NOT EXISTS config (id INTEGER PRIMARY KEY, status TEXT, color TEXT, translation TEXT)");

// Sauvegarder config
app.post("/config", (req, res) => {
  const { status, color, translation } = req.body;
  db.run("INSERT INTO config (status, color, translation) VALUES (?, ?, ?)", [status, color, translation]);
  res.send("Config saved");
});

// Récupérer config
app.get("/config", (req, res) => {
  db.all("SELECT * FROM config", [], (err, rows) => {
    res.json(rows);
  });
});

app.listen(4000, () => console.log("Backoffice API running"));
```

👉 Ensuite, ton **FrontOffice** peut appeler cette API pour appliquer les couleurs et traductions.

---

## 🟦 Étape 5 : Interaction entre FrontOffice et BackOffice
- **FrontOffice** → affiche tickets avec couleurs et traductions récupérées depuis SQLite.  
- **BackOffice** → permet de modifier ces paramètres.  
- Les tickets eux-mêmes peuvent aussi être stockés en SQLite si tu veux persister les données.  

---

## 🟦 Étape 6 : Bonus
- Ajoute une **boîte de dialogue** quand un changement de statut nécessite des infos supplémentaires (ex. commentaire obligatoire).  
- Utilise `react-hook-form` pour gérer les formulaires.  
- Mets en place une **API REST** pour gérer tickets (CRUD).  

---

👉 Voilà le plan clair et progressif.  
Veux-tu que je te prépare directement un **schéma visuel** (diagramme Kanban + Backoffice) pour que tu voies l’architecture avant de coder ?


Voici l'approche : ajouter un état de sélection multiple dans `KanbanPage`, le propager jusqu'aux cartes, et adapter `handleDrop` pour traiter un tableau d'ids.

## 1. KanbanPage.jsx

```javascriptreact
const [selectedIds, setSelectedIds] = useState([]);

const toggleSelect = (itemId) => {
    setSelectedIds((prev) =>
        prev.includes(itemId)
            ? prev.filter((id) => id !== itemId)
            : [...prev, itemId]
    );
};

const handleDrop = async (draggedId, targetColumnId) => {
    // si l'élément déplacé fait partie de la sélection, on déplace toute la sélection
    const idsToMove = selectedIds.includes(draggedId)
        ? selectedIds
        : [draggedId];

    const previousColumnsData = JSON.parse(JSON.stringify(columndata));

    setColumnsData((prev) => {
        let movedItems = [];
        const updated = prev.map((col) => {
            const found = col.items.filter((i) => idsToMove.includes(String(i.id)));
            movedItems = [...movedItems, ...found];
            return { ...col, items: col.items.filter((i) => !idsToMove.includes(String(i.id))) };
        });
        if (movedItems.length === 0) return prev;

        const updatedItems = movedItems.map((item) => ({
            ...item,
            status: { ...item.status, id: targetColumnId }
        }));

        return updated.map((col) =>
            col.id_status === targetColumnId
                ? { ...col, items: [...col.items, ...updatedItems] }
                : col
        );
    });

    try {
        await Promise.all(
            idsToMove.map((id) => TicketService.updateStatus(id, targetColumnId))
        );
        setSelectedIds([]); // reset sélection après succès
    } catch (error) {
        console.error("Erreur:", error);
        alert("Erreur de déplacement.");
        setColumnsData(previousColumnsData);
    }
};
```

Et passer `selectedIds` / `toggleSelect` au composant `Kanban` :

```javascriptreact
<Kanban
    columns={columndata}
    onDrop={handleDrop}
    isMg={isMg}
    getLocalName={getLocalName}
    selectedIds={selectedIds}
    toggleSelect={toggleSelect}
/>
```

## 2. Kanban.jsx

Propager les deux nouvelles props vers `KanbanColumn` :

```javascriptreact
function Kanban({ columns, onDrop, isMg, getLocalName, selectedIds, toggleSelect }) {
  // ... inchangé
  return (
    <div className="kanban-container">
      {columns.map((column) => (
        <KanbanColumn
          key={column.id}
          columnId={column.id_status}
          title={column.title}
          items={column.items}
          statusColor={getColorStatus(column.id_status)}
          onDrop={onDrop}
          isMg={isMg}
          localName={getLocalName(column.id_status)}
          selectedIds={selectedIds}
          toggleSelect={toggleSelect}
        />
      ))}
    </div>
  );
}
```

## 3. KanbanColumn.jsx

Propager à `KanbanCard`, et **gérer le drag** : si la carte glissée est sélectionnée, on transmet toute la liste des ids sélectionnés via `dataTransfer` (sinon on transmet juste son propre id).

```javascriptreact
const handleDrop = (e) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("itemId");
    if (itemId) onDrop(itemId, columnId);
};
```

Pas besoin de changer `handleDrop` ici, mais il faut que `KanbanCard` transmette correctement les infos. Dans le map :

```javascriptreact
{items.map((item) => (
    <KanbanCard
        key={item.id}
        itemId={String(item.id)}
        title={`Ticket #${item.id}`}
        description={item.description}
        isSelected={selectedIds.includes(String(item.id))}
        toggleSelect={toggleSelect}
    />
))}
```

⚠️ Comme `KanbanCard` est actuellement enveloppé dans un `<Link>` (navigation au clic), il faut **retirer ou adapter le `Link`**, sinon cliquer pour sélectionner déclenchera la navigation. Solution : déplacer la navigation sur un bouton/icône séparé, ou navigué seulement sur double-clic.

```javascriptreact
<div key={item.id}>
    <KanbanCard
        itemId={String(item.id)}
        title={`Ticket #${item.id}`}
        description={item.description}
        isSelected={selectedIds.includes(String(item.id))}
        toggleSelect={toggleSelect}
        navigate={() => navigate(`/detail-ticket/${item.id}`)}
    />
</div>
```

## 4. KanbanCard.jsx

Ajouter une checkbox (ou clic avec Ctrl/Cmd) pour sélectionner, mise en surbrillance visuelle, et gérer le drag pour multi-sélection :

```javascriptreact
function KanbanCard({ title, description, itemId, isSelected, toggleSelect, navigate }) {

    const handleDragStart = (e) => {
        e.dataTransfer.setData("itemId", itemId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleCheckboxClick = (e) => {
        e.stopPropagation();
        toggleSelect(itemId);
    };

    return (
        <div
            className={`card ${isSelected ? "card-selected" : ""}`}
            draggable
            onDragStart={handleDragStart}
            onClick={navigate}
            style={{ cursor: "grab" }}
        >
            <input
                type="checkbox"
                checked={isSelected}
                onChange={handleCheckboxClick}
                onClick={(e) => e.stopPropagation()}
            />
            <h2>{title}</h2>
            <p>{description}</p>
        </div>
    );
}
export default KanbanCard;
```

## 5. CSS

Ajouter dans `Kanban.css` :

```css
.card-selected {
    outline: 2px solid #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}
```

## Résumé du fonctionnement

1. L'utilisateur clique sur les checkboxes pour sélectionner plusieurs tickets (`selectedIds` rempli).
2. Il fait un drag depuis **n'importe quelle carte sélectionnée**.
3. Au drop, `handleDrop` détecte que la carte glissée est dans `selectedIds` et déplace **tout le groupe**.
4. Si on glisse une carte non sélectionnée, seul ce ticket est déplacé (comportement normal).
5. Après succès, la sélection est réinitialisée.

Une amélioration possible : afficher un badge "X tickets sélectionnés" et un bouton "Annuler la sélection" en haut de page.