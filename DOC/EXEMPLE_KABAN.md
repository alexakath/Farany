Oui. Pour React, tu peux créer un composant Kanban générique qui accepte simplement les colonnes et les cartes en props.

### Structure

```txt
components/
 ├── Kanban/
 │    ├── Kanban.jsx
 │    ├── KanbanColumn.jsx
 │    ├── KanbanCard.jsx
 │    └── Kanban.css
```

---

## KanbanCard.jsx

```jsx
function KanbanCard({ item, renderCard }) {
    return (
        <div className="kanban-card">
            {renderCard ? renderCard(item) : (
                <>
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                </>
            )}
        </div>
    );
}

export default KanbanCard;
```

---

## KanbanColumn.jsx

```jsx
import KanbanCard from "./KanbanCard";

function KanbanColumn({
    title,
    items,
    renderCard
}) {
    return (
        <div className="kanban-column">
            <div className="kanban-header">
                <h3>{title}</h3>
                <span>{items.length}</span>
            </div>

            <div className="kanban-body">
                {items.map((item) => (
                    <KanbanCard
                        key={item.id}
                        item={item}
                        renderCard={renderCard}
                    />
                ))}
            </div>
        </div>
    );
}

export default KanbanColumn;
```

---

## Kanban.jsx

```jsx
import KanbanColumn from "./KanbanColumn";
import "./Kanban.css";

function Kanban({
    columns,
    renderCard
}) {
    return (
        <div className="kanban-container">
            {columns.map((column) => (
                <KanbanColumn
                    key={column.id}
                    title={column.title}
                    items={column.items}
                    renderCard={renderCard}
                />
            ))}
        </div>
    );
}

export default Kanban;
```

---

## Kanban.css

```css
.kanban-container {
    display: flex;
    gap: 20px;
    overflow-x: auto;
    padding: 20px;
}

.kanban-column {
    min-width: 320px;
    background: #f5f5f5;
    border-radius: 10px;
    padding: 15px;
}

.kanban-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.kanban-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.kanban-card {
    background: white;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}
```

---

## Utilisation

```jsx
import Kanban from "../components/Kanban/Kanban";

function TicketPage() {

    const columns = [
        {
            id: "new",
            title: "Nouveaux",
            items: [
                {
                    id: 1,
                    title: "Ticket #1",
                    description: "Problème imprimante"
                }
            ]
        },
        {
            id: "progress",
            title: "En cours",
            items: [
                {
                    id: 2,
                    title: "Ticket #2",
                    description: "Ordinateur lent"
                }
            ]
        },
        {
            id: "closed",
            title: "Terminés",
            items: [
                {
                    id: 3,
                    title: "Ticket #3",
                    description: "Résolu"
                }
            ]
        }
    ];

    return (
        <Kanban columns={columns} />
    );
}

export default TicketPage;
```

---

## Version personnalisée (très utile pour GLPI)

```jsx
<Kanban
    columns={columns}
    renderCard={(ticket) => (
        <>
            <h4>{ticket.name}</h4>
            <p>Demandeur : {ticket.user}</p>
            <p>Priorité : {ticket.priority}</p>
            <p>Statut : {ticket.status}</p>
        </>
    )}
/>
```

Ainsi le composant reste totalement réutilisable pour :

* Tickets GLPI
* Tâches
* Projets
* Demandes d'intervention
* Utilisateurs
* Ordinateurs
* N'importe quelle entité possédant des colonnes.
