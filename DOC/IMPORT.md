Voici un fichier de documentation complet au format Markdown (`.md`). Il détaille l'architecture de ton script, le fonctionnement de l'importateur modulaire, la structure attendue pour les fichiers CSV/ZIP, ainsi que les spécifications des endpoints de l'API GLPI.

Tu peux copier-coller ce contenu directement dans un fichier nommé `README.md` ou `IMPORT_DOCUMENTATION.md` à la racine de ton projet.

```markdown
# 🚀 Documentation Technique : Importateur Modulaire GLPI (React)

Cette documentation détaille le fonctionnement, l'architecture et les prérequis techniques de l'interface d'importation de données développée en React pour **GLPI**.

L'application permet d'injecter de manière indépendante ou globale des matériels (ordinateurs, écrans), des images d'illustration (via un `.zip`), des tickets d'assistance ainsi que leurs coûts associés en respectant les dépendances de clés étrangères de l'API REST de GLPI.

---

## 🏗️ Architecture Globale de l'Import

L'importation suit un ordre séquentiel strict pour garantir l'intégrité des données dans GLPI (les éléments enfants ont besoin des identifiants des éléments parents).


```

[ Archive ZIP ] ─────────► Extraction en Mémoire (Blobs)
│
[ Feuille 1 : CSV ] ─────► Création Référentiels ──► Création Assets ──► Association Image
│
[ Feuille 2 : CSV ] ─────────────────────────────────────────┼──► Création Tickets ──► Liaison Asset/Ticket
│                │
[ Feuille 3 : CSV ] ─────────────────────────────────────────┘                └──► Ajout des Coûts

```

---

## 📊 1. Spécifications des Fichiers Source

### Feuille 1 : Matériels & Référentiels (`.csv`)
Ce fichier définit le parc informatique à importer. 
* **Colonnes obligatoires** : `Name`, `Item_Type`
* **Types supportés (`Item_Type`)** : `Computer` ou `Monitor`

*Exemple de structure :*
```csv
Name,Status,Location,Manufacturer,Item_Type,Model,Inventory_Number,User
PC-ADM-001,En production,Administration,Dell,Computer,OptiPlex 7010,ITU-2026-0001,Rakoto Jean
MN-FORM-002,En production,Formation,HP,Monitor,ProDisplay P223,ITU-2026-0012,Salle 1

```

### Archive d'Images (`.zip`) - *Optionnel*

Contient les photos ou illustrations des matériels.

* **Règle de nommage** : Le nom du fichier image (sans l'extension) doit correspondre **exactement** à la valeur de la colonne `Name` de la Feuille 1.
* *Exemple* : Pour une ligne du CSV ayant `Name` = `PC-ADM-001`, l'archive doit contenir `PC-ADM-001.jpg` ou `PC-ADM-001.png`.

### Feuille 2 : Tickets d'assistance (`.csv`) - *Optionnel*

Permet d'ouvrir des tickets de maintenance et de les lier à un ou plusieurs matériels existants.

* **Format de Date attendu** : `DD/MM/YYYY`
* **Format de la colonne `Items**` : Tableau JSON de chaînes de caractères (ex: `["PC-ADM-001", "MN-FORM-002"]`).

*Exemple de structure :*

```csv
Ref_Ticket,Date,Heure,Type,Titre,Description,Status,Priority,Items
1,03/06/2026,13:45,Incident,Écran noir,Pas d'affichage au démarrage,New,Medium,"[""PC-ADM-001""]"

```

### Feuille 3 : Frais & Coûts opérationnels (`.csv`) - *Optionnel*

Associe des frais financiers et des durées d'intervention aux tickets créés lors de la phase précédente.

* **Liaison** : Se fait via la colonne `Num_Ticket` qui doit correspondre à la `Ref_Ticket` de la Feuille 2.

*Exemple de structure :*

```csv
Num_Ticket,Duration_second,Time_Cost,Fixed_Cost
1,1800,"15,50",45.00

```

---

## 🔌 2. Endpoints API GLPI Utilisés

L'application communique directement avec l'API REST de GLPI (via le protocole d'authentification Bearer Token). Voici les endpoints sollicités :

| Étape / Entité | Endpoint GLPI | Méthode | Rôle / Description |
| --- | --- | --- | --- |
| **Référentiel** | `/Dropdowns/Manufacturer` | `POST` | Enregistre la marque/fabricant si elle n'existe pas. |
| **Référentiel** | `/Dropdowns/Location` | `POST` | Enregistre l'emplacement/bureau si absent. |
| **Référentiel** | `/Dropdowns/State` | `POST` | Gère les statuts machine (ex: En production, Stock). |
| **Matériel** | `/Assets/Computer` | `POST` | Crée la fiche de l'ordinateur. |
| **Matériel** | `/Assets/Monitor` | `POST` | Crée la fiche de l'écran de visualisation. |
| **Média / ZIP** | `/Document` | `POST` | Pousse le fichier image binaire (Multipart) avec son manifeste. |
| **Ticket** | `/Assistance/Ticket` | `POST` | Ouvre un ticket de support technique. |
| **Liaison** | `/Ticket_Item` | `POST` | Relie l'asset (`Computer` / `Monitor`) au ticket créé. |
| **Finances** | `/Assistance/TicketCost` | `POST` | Injecte le temps passé, les coûts fixes et horaires. |

---

## 🛠️ 3. Fonctionnement Logique du Code (React)

Le composant est conçu pour être résilient et modulaire grâce à l'implémentation de plusieurs fonctionnalités clés :

### Traitement Asynchrone & Mode non-bloquant

Chaque ligne de chaque fichier CSV est traitée individuellement dans une boucle `for...of`. Si une ligne est corrompue (ex: JSON invalide dans les items, problème serveur GLPI sur un élément), le script capture l'anomalie à l'aide d'un bloc `try...catch`. **L'importation ne s'arrête pas**, la ligne problématique est sautée, et un log d'erreur rouge explicite est affiché à l'utilisateur.

### Décompression Directe dans le Navigateur

Grâce à la bibliothèque `JSZip`, le fichier `.zip` chargé par l'utilisateur est ouvert en mémoire vive. Les images valides sont stockées temporairement sous forme de `Blob` (Binary Large Object) indexés par leur nom de fichier nettoyé. Cela évite d'avoir à stocker ou uploader des fichiers temporaires sur un serveur intermédiaire.

### Payload Direct (API REST Natif)

Les requêtes HTTP envoyées via la fonction `glpiPost` transmettent les payloads d'attributs directement à la racine du corps de la requête au format JSON (`JSON.stringify(data)`), s'alignant sur les spécifications CRUD de l'API GLPI.

---

## 🚨 4. Gestion des Erreurs Fréquentes & CORS

### Erreur de Politique CORS (`Cross-Origin Resource Sharing`)

Si la console du navigateur affiche un blocage CORS lors d'une tentative de requête vers `http://localhost:83`, cela signifie que le serveur hébergeant GLPI refuse les requêtes provenant de l'application React (`http://localhost:5173`).

**Solution (Configuration PHP dans GLPI) :**
Ajouter ces en-têtes HTTP au tout début du fichier `api.php` de GLPI :

```php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

```

### Erreur Interne 500

Une erreur 500 retournée par un endpoint `/Dropdowns` ou `/Assets` indique généralement qu'une valeur obligatoire est manquante dans le CSV ou que le type d'élément (`Item_Type`) envoyé ne correspond pas aux structures internes de votre base GLPI. Référez-vous au panneau de journalisation intégré au bas de l'importateur pour cibler le numéro exact de la ligne en faute.

```

```