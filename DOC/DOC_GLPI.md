**GLPI est un logiciel libre de gestion de parc informatique et de helpdesk. Il permet de gérer les actifs, les tickets, les utilisateurs et propose une API REST activable depuis l’interface d’administration. L’URL par défaut de l’API est généralement `http://votre-domaine/glpi/apirest.php`.**  [help.glpi-project.org](https://help.glpi-project.org/documentation)  [IT-Connect](https://www.it-connect.fr/glpi-utiliser-api-avec-un-script-powershell/)  

---

## 📘 Définition de GLPI
- **GLPI (Gestionnaire Libre de Parc Informatique)** est une application web open source.  
- Objectif : **centraliser la gestion du parc informatique** (matériel, logiciels, licences, contrats) et fournir un **helpdesk** pour le support utilisateurs.  
- Développé en PHP, il utilise une base de données MySQL/MariaDB.

---

## ⚙️ Fonctions principales
- **Inventaire** : gestion des ordinateurs, périphériques, logiciels, licences.  
- **Helpdesk** : création et suivi de tickets, SLA, notifications.  
- **Gestion financière** : contrats, fournisseurs, budgets.  
- **Gestion des utilisateurs** : profils, droits, authentification LDAP/AD.  
- **Rapports et statistiques** : suivi des interventions, indicateurs de performance.  
- **Plugins** : extension des fonctionnalités (inventaire automatique, supervision, etc.).

---

## 🧩 Modules clés
| Module | Rôle |
|--------|------|
| **Parc** | Gestion des actifs matériels et logiciels |
| **Assistance (Helpdesk)** | Tickets, suivi des incidents et demandes |
| **Administration** | Profils, droits, configuration générale |
| **Finances** | Contrats, fournisseurs, budgets |
| **Plugins** | Ajout de fonctionnalités externes |
| **Base de connaissances** | Documentation interne pour les utilisateurs |

---

## 🔌 Activer l’API REST
1. Connectez-vous à l’interface GLPI avec un compte administrateur.  
2. Allez dans **Configuration → Générale → API**.  
3. Activez l’option **“Activer l’API Rest”**.  
4. Sauvegardez les paramètres.  
5. Générez :
   - **Un jeton d’application** (clé globale pour l’API).  
   - **Un jeton utilisateur** (lié à un compte GLPI).  
6. Utilisez ces jetons pour authentifier vos requêtes.

---

## 🌐 URL de l’API
- L’API est accessible via :  
  ```
  http://votre-domaine/glpi/apirest.php
  ```
- Exemple de requête pour initier une session :  
  ```http
  POST http://votre-domaine/glpi/apirest.php/initSession
  Header: Authorization: user_token
  ```

---

## 🚀 Cas d’usage de l’API
- **Créer un ticket automatiquement** depuis une application tierce.  
- **Synchroniser l’inventaire** avec Active Directory ou un outil externe.  
- **Mettre à jour les informations machines** (ex. ID AnyDesk, description AD).  
- **Exporter des données** pour reporting ou intégration BI.  [IT-Connect](https://www.it-connect.fr/glpi-utiliser-api-avec-un-script-powershell/)  

---

## ⚠️ Points importants
- **Sécurité** : toujours protéger l’API avec HTTPS et limiter les droits des jetons.  
- **Version** : vérifier la compatibilité selon la version de GLPI (10, 11, etc.).  
- **Plugins API** : certains plugins ajoutent des endpoints supplémentaires.  

---

👉 Veux-tu que je prépare un **guide pratique en Markdown avec exemples de requêtes API (GET, POST, PUT, DELETE)** pour que tu puisses tester directement avec Postman ou `curl` ?