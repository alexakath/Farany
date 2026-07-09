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