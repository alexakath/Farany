Pour gérer plusieurs langues (pas juste FR/MG), il faut passer d'un toggle booléen `isMg` à un état `langue` (code de langue) et faire un cycle entre les langues disponibles.

## Hypothèse sur la structure `/statusname`

Probablement quelque chose comme :
```json
[
  { "id_status": 1, "name": "Nouveau", "name_mg": "Vaovao", "name_en": "New" },
  ...
]
```
Ou mieux, une structure normalisée avec une table de traductions :
```json
[
  { "id_status": 1, "lang": "fr", "name": "Nouveau" },
  { "id_status": 1, "lang": "mg", "name": "Vaovao" },
  { "id_status": 1, "lang": "en", "name": "New" }
]
```

Je vais traiter le cas générique avec une liste de langues.

## KanbanPage.jsx

```jsx
const LANGUES = ["fr", "mg", "en"]; // ← liste des langues disponibles, ajoute autant que tu veux

function KanbanPage () {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [columndata, setColumnsData] = useState([]);
    const [langues, setLangues] = useState([]);
    const [langueIndex, setLangueIndex] = useState(0); // ← remplace isMg

    useEffect(() => {
    const getData = async () => {
        try {
            setLoading(true);
            const ticketsRecus = await TicketService.getAll();
            const langueData = await LangueService.getAll();
            setLangues(langueData);

            const structureKanban = [
                { id: "new",         title: "Nouveau", id_status: 1, items: ticketsRecus.filter(t => t.status.id === 1) },
                { id: "progressing", title: "En cours", id_status: 2, items: ticketsRecus.filter(t => t.status.id === 2) },
                { id: "closed",      title: "Terminé",  id_status: 6, items: ticketsRecus.filter(t => t.status.id === 6) }
            ];
            setColumnsData(structureKanban);
        } catch (error) {
            console.error("Erreur:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };
    getData();
    }, []);

    if (loading) return <Loader />;
    if (error) return <div className="error">Erreur: {error}</div>;

    const handleDrop = async (itemId, targetColumnId) => {
        // ... inchangé
    };

    const currentLangue = LANGUES[langueIndex];

    // récupère le nom traduit selon id_status et langue courante
    const getLocalName = (idStatus) => {
        // cas 1 : une ligne par status avec colonnes name, name_mg, name_en...
        const found = langues.find(l => l.id_status === idStatus);
        if (!found) return null;
        return found[`name_${currentLangue}`] || found.name; // fallback nom par défaut

        // cas 2 : table normalisée { id_status, lang, name }
        // const found = langues.find(l => l.id_status === idStatus && l.lang === currentLangue);
        // return found ? found.name : null;
    };

    const handleToggleLangue = () => {
        setLangueIndex(prev => (prev + 1) % LANGUES.length); // ← cycle
    };

    return (
    <div>
        <h1>KANBAN</h1>
        <Button
            label={currentLangue.toUpperCase()}
            onClick={handleToggleLangue}
        />
        <Kanban
            columns={columndata}
            onDrop={handleDrop}
            currentLangue={currentLangue}
            getLocalName={getLocalName}
        />
    </div>
    );
}
export default KanbanPage;
```

## Kanban.jsx

```jsx
function Kanban({ columns, onDrop, currentLangue, getLocalName }) {
  // ... inchangé sauf props transmises

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
          currentLangue={currentLangue}
          localName={getLocalName(column.id_status)}
        />
      ))}
    </div>
  );
}
```

## KanbanColumn.jsx

```jsx
function KanbanColumn({ title, items, columnId, statusColor, onDrop, currentLangue, localName }) {
  const navigate = useNavigate();

  // si langue par défaut (ex: "fr") OU pas de traduction trouvée → titre original
  const displayTitle = currentLangue !== "fr" && localName ? localName : title;

  // ... reste inchangé
}
```

## Points clés

Le bouton affiche maintenant le code de la langue courante (`FR`, `MG`, `EN`...) et fait défiler `LANGUES` en boucle à chaque clic.

Pour ajouter une langue, il suffit d'ajouter son code dans `LANGUES` (ex: `"en"`) et de s'assurer que la réponse de `/statusname` contient bien le champ correspondant (`name_en`), ou la ligne `lang: "en"` selon la structure de ta table.

Si tu veux un sélecteur (dropdown) au lieu d'un cycle au clic, remplace le `Button` par un `<select>` :

```jsx
<select value={currentLangue} onChange={(e) => setLangueIndex(LANGUES.indexOf(e.target.value))}>
  {LANGUES.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
</select>
```

Dis-moi la structure exacte renvoyée par `/statusname` (fais un `console.log`) si tu veux que j'adapte précisément `getLocalName`.



Ta table actuelle ne gère qu'**une seule langue** (1 ligne = 1 traduction). Pour gérer plusieurs langues, il faut ajouter une colonne `lang` (ou `code_langue`) pour identifier la langue de chaque traduction.

## Structure recommandée

```sql
CREATE TABLE statusname (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_status INTEGER NOT NULL,
    lang VARCHAR(5) NOT NULL,
    name VARCHAR(255) NOT NULL,
    UNIQUE(id_status, lang)
);
```

## Données

```sql
-- Status 1 : Nouveau
INSERT INTO statusname (id_status, lang, name) VALUES (1, 'fr', 'Nouveau');
INSERT INTO statusname (id_status, lang, name) VALUES (1, 'mg', 'Vaovao');
INSERT INTO statusname (id_status, lang, name) VALUES (1, 'en', 'New');

-- Status 2 : En cours
INSERT INTO statusname (id_status, lang, name) VALUES (2, 'fr', 'En cours');
INSERT INTO statusname (id_status, lang, name) VALUES (2, 'mg', 'Efa manao');
INSERT INTO statusname (id_status, lang, name) VALUES (2, 'en', 'In progress');

-- Status 6 : Terminé
INSERT INTO statusname (id_status, lang, name) VALUES (6, 'fr', 'Terminé');
INSERT INTO statusname (id_status, lang, name) VALUES (6, 'mg', 'Vita');
INSERT INTO statusname (id_status, lang, name) VALUES (6, 'en', 'Done');
```

## Adapter `getLocalName` côté React

Avec cette structure (cas 2 mentionné précédemment) :

```jsx
const getLocalName = (idStatus) => {
    const found = langues.find(l => l.id_status === idStatus && l.lang === currentLangue);
    return found ? found.name : null;
};
```

## Pourquoi `UNIQUE(id_status, lang)` ?

Ça empêche d'avoir deux fois la traduction de la même langue pour le même status (intégrité des données).

## Côté Spring Boot

Ton entité doit avoir le champ `lang` :

```java
@Entity
@Table(name = "statusname")
public class StatusName {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer idStatus;
    private String lang;
    private String name;

    // getters/setters
}
```

Et `/statusname` renverra donc un tableau du type :

```json
[
  { "id": 1, "idStatus": 1, "lang": "fr", "name": "Nouveau" },
  { "id": 2, "idStatus": 1, "lang": "mg", "name": "Vaovao" },
  { "id": 3, "idStatus": 1, "lang": "en", "name": "New" },
  ...
]
```

⚠️ Attention : si Spring sérialise en camelCase (`idStatus` au lieu de `id_status`), adapte `getLocalName` :

```jsx
const found = langues.find(l => (l.id_status ?? l.idStatus) === idStatus && l.lang === currentLangue);
```

Avec cette structure, ajouter une nouvelle langue = juste ajouter 3 (ou N) lignes `INSERT`, sans toucher au code.