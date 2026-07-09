Parfait Marie ✨  
Voici le **fichier complet en Markdown (.md)** qui regroupe **toutes les catégories et leurs endpoints** de l’API REST GLPI (High-Level API). J’ai ajouté un sommaire automatique et des exemples `curl` pour chaque catégorie afin que tu puisses tester directement.

---

```markdown
# 📘 Documentation Technique – GLPI High-Level REST API

## 📑 Sommaire
- [Authentification & Session](#-authentification--session)
- [Administration](#-administration)
- [Assets](#-assets)
- [Assistance](#-assistance)
- [Components](#-components)
- [Inventory](#-inventory)
- [Knowledgebase](#-knowledgebase)
- [Notifications](#-notifications)
- [Project](#-project)
- [Rule](#-rule)
- [Setup](#-setup)
- [Status](#-status)
- [Statistics](#-statistics)
- [Tools](#-tools)
- [GraphQL](#-graphql)

---

## 🔑 Authentification & Session
| Endpoint | Description | Méthodes |
|-----------|--------------|-----------|
| `/initSession` | Crée une session API | POST |
| `/killSession` | Termine la session | POST |
| `/getMyProfiles` | Liste les profils | GET |
| `/getActiveProfile` | Profil actif | GET |
| `/changeActiveProfile` | Change le profil actif | POST |
| `/getMyEntities` | Liste des entités | GET |
| `/getActiveEntities` | Entité active | GET |
| `/changeActiveEntities` | Change l’entité active | POST |

**Exemple `curl` :**
```bash
curl -X POST https://glpi.example.com/apirest.php/initSession \
  -H 'Content-Type: application/json' \
  -d '{"login":"glpi","password":"glpi"}'
```

---

## 🏛️ Administration
| Endpoint | Description | Méthodes |
|-----------|--------------|-----------|
| `/Administration/ApprovalSubstitute` | Gestion des remplaçants d’approbation | CRUD |
| `/Administration/Entity` | Gestion des entités | CRUD |
| `/Administration/Profile` | Profils et droits | CRUD |
| `/Administration/User` | Utilisateurs | CRUD |
| `/Administration/Group` | Groupes | CRUD |

---

## 💻 Assets
| Endpoint | Description | Méthodes |
|-----------|--------------|-----------|
| `/Assets/{asset_itemtype}/{asset_id}/OSInstallation/{id}` | Installations OS | CRUD |
| `/Assets/{asset_itemtype}/{asset_id}/SoftwareInstallation/{id}` | Logiciels installés | CRUD |
| `/Assets/{asset_itemtype}/{asset_id}/NetworkPort/{id}` | Ports réseau | CRUD |
| `/Assets/{asset_itemtype}/{asset_id}/Disk/{id}` | Disques | CRUD |

---

## 🧰 Assistance
| Endpoint | Description | Méthodes |
|-----------|--------------|-----------|
| `/Assistance/Ticket` | Tickets | CRUD |
| `/Assistance/TicketFollowup` | Suivi des tickets | CRUD |
| `/Assistance/TicketTask` | Tâches liées aux tickets | CRUD |
| `/Assistance/TicketValidation` | Validation des tickets | CRUD |

**Exemple `curl` :**
```bash
curl -X POST https://glpi.example.com/apirest.php/Ticket \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -d '{"name":"Problème Wi-Fi","content":"Impossible de se connecter","requester_id":12}'
```

---

## ⚙️ Components
| Endpoint | Description | Méthodes |
|-----------|--------------|-----------|
| `/Components/Monitor` | Moniteurs | CRUD |
| `/Components/Printer` | Imprimantes | CRUD |
| `/Components/Phone` | Téléphones | CRUD |
| `/Components/Peripheral` | Périphériques | CRUD |

---

## 🧮 Inventory
| Endpoint | Description | Méthodes |
|-----------|--------------|-----------|
| `/Inventory/Computer` | Ordinateurs | CRUD |
| `/Inventory/NetworkEquipment` | Équipements réseau | CRUD |
| `/Inventory/Software` | Logiciels | CRUD |
| `/Inventory/Printer` | Imprimantes | CRUD |

---

## 📚 Knowledgebase
| Endpoint | Description | Méthodes |
|-----------|--------------|-----------|
| `/Knowledgebase/Item` | Articles | CRUD |
| `/Knowledgebase/Category` | Catégories | CRUD |

---

## 🔔 Notifications
| Endpoint | Description | Méthodes |
|-----------|--------------|-----------|
| `/Notifications/NotificationTemplate` | Modèles | CRUD |
| `/Notifications/NotificationEvent` | Événements | CRUD |

---

## 📂 Project
| Endpoint | Description | Méthodes |
|-----------|--------------|-----------|
| `/Project/Project` | Projets | CRUD |
| `/Project/Task` | Tâches projet | CRUD |
| `/Project/Milestone` | Jalons | CRUD |

---

## 🧾 Rule
| Endpoint | Description | Méthodes |
|-----------|--------------|-----------|
| `/Rule/Rule` | Règles | CRUD |
| `/Rule/Criteria` | Critères | CRUD |
| `/Rule/Action` | Actions | CRUD |

---

## ⚙️ Setup
| Endpoint | Description | Méthodes |
|-----------|--------------|-----------|
| `/Setup/Config` | Configuration GLPI | GET, PUT |
| `/Setup/Plugin` | Plugins | GET |

---

## 📊 Status
| Endpoint | Description | Méthodes |
|-----------|--------------|-----------|
| `/Status` | État du serveur GLPI | GET |

---

## 📈 Statistics
| Endpoint | Description | Méthodes |
|-----------|--------------|-----------|
| `/Statistics/Ticket` | Statistiques tickets | GET |
| `/Statistics/Asset` | Statistiques assets | GET |

---

## 🛠️ Tools
| Endpoint | Description | Méthodes |
|-----------|--------------|-----------|
| `/Tools/Dropdown` | Listes déroulantes | GET |
| `/Tools/Document` | Documents | CRUD |
| `/Tools/Reminder` | Rappels | CRUD |

---

## 🧠 GraphQL
| Endpoint | Description | Méthodes |
|-----------|--------------|-----------|
| `/GraphQL` | Requêtes GraphQL | POST |

**Exemple `curl` :**
```bash
curl -X POST https://glpi.example.com/apirest.php/GraphQL \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -d '{"query":"{ Ticket(limit:5){id name status} }"}'
```

---

# ✅ Notes
- Tous les endpoints supportent les méthodes REST standard : **GET, POST, PUT, DELETE**.  
- Headers obligatoires : `Content-Type: application/json` et `Authorization: Bearer <token>`.  
- Utiliser HTTPS pour sécuriser les échanges.  
```

---

👉 Ce fichier `.md` est prêt à être exporté et utilisé comme **documentation technique complète**.  
Veux-tu que je t’ajoute aussi une **version Word/PDF** avec tableaux formatés et icônes pour chaque catégorie afin de l’intégrer directement dans tes cours et projets ?