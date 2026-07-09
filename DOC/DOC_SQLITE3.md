Voici toutes les requêtes SQL possibles et utiles pour cette table `Cout_ticket` :

## 1. REQUÊTES DE BASE (CRUD)

### INSERT (Ajout)
```sql
-- Ajouter un enregistrement complet
INSERT INTO Cout_ticket (id_ticket, type_cout, cout, id_item, itemtype) 
VALUES (1, 'Main d\'oeuvre', 150.50, 101, 'Service');

-- Ajouter avec date personnalisée
INSERT INTO Cout_ticket (id_ticket, type_cout, cout, id_item, itemtype, date_creation) 
VALUES (2, 'Pièce détachée', 89.99, 202, 'Produit', '2026-01-15 10:30:00');

-- Insertion multiple
INSERT INTO Cout_ticket (id_ticket, type_cout, cout, id_item, itemtype) VALUES 
(1, 'Transport', 45.00, NULL, 'Service'),
(1, 'Frais divers', 12.50, NULL, NULL),
(2, 'Main d\'oeuvre', 200.00, 103, 'Service');
```

### SELECT (Lecture)
```sql
-- Tout récupérer
SELECT * FROM Cout_ticket;

-- Récupérer par ID
SELECT * FROM Cout_ticket WHERE id = 5;

-- Récupérer par ticket
SELECT * FROM Cout_ticket WHERE id_ticket = 1;

-- Récupérer par type de coût
SELECT * FROM Cout_ticket WHERE type_cout = 'Main d\'oeuvre';

-- Avec conditions multiples
SELECT * FROM Cout_ticket 
WHERE id_ticket = 1 AND type_cout = 'Pièce détachée';

-- Avec filtre sur le montant
SELECT * FROM Cout_ticket WHERE cout > 100;
SELECT * FROM Cout_ticket WHERE cout BETWEEN 50 AND 200;

-- Avec filtre sur la date
SELECT * FROM Cout_ticket 
WHERE date_creation >= '2026-01-01';

-- Avec tri
SELECT * FROM Cout_ticket ORDER BY cout DESC;
SELECT * FROM Cout_ticket ORDER BY date_creation DESC;

-- Avec limite
SELECT * FROM Cout_ticket LIMIT 10;
SELECT * FROM Cout_ticket ORDER BY cout DESC LIMIT 5;
```

### UPDATE (Modification)
```sql
-- Modifier un coût
UPDATE Cout_ticket SET cout = 175.00 WHERE id = 3;

-- Modifier plusieurs champs
UPDATE Cout_ticket 
SET type_cout = 'Forfait', cout = 250.00 
WHERE id_ticket = 1 AND type_cout = 'Main d\'oeuvre';

-- Mise à jour avec condition
UPDATE Cout_ticket 
SET cout = cout * 1.10 
WHERE type_cout = 'Pièce détachée';

-- Mise à jour avec sous-requête
UPDATE Cout_ticket 
SET cout = (SELECT AVG(cout) FROM Cout_ticket WHERE id_ticket = 1) 
WHERE id = 10;
```

### DELETE (Suppression)
```sql
-- Supprimer par ID
DELETE FROM Cout_ticket WHERE id = 5;

-- Supprimer tous les coûts d'un ticket
DELETE FROM Cout_ticket WHERE id_ticket = 1;

-- Supprimer avec condition
DELETE FROM Cout_ticket WHERE cout = 0;

-- Supprimer les coûts d'un certain type
DELETE FROM Cout_ticket WHERE type_cout = 'Frais divers';
```

## 2. REQUÊTES D'AGRÉGATION

### Statistiques de base
```sql
-- Nombre total d'enregistrements
SELECT COUNT(*) FROM Cout_ticket;

-- Nombre par ticket
SELECT id_ticket, COUNT(*) as nb_couts 
FROM Cout_ticket 
GROUP BY id_ticket;

-- Somme des coûts par ticket
SELECT id_ticket, SUM(cout) as total 
FROM Cout_ticket 
GROUP BY id_ticket;

-- Moyenne des coûts
SELECT AVG(cout) as moyenne FROM Cout_ticket;

-- Min, Max, Moyenne par ticket
SELECT 
    id_ticket,
    MIN(cout) as min,
    MAX(cout) as max,
    AVG(cout) as moyenne,
    SUM(cout) as total
FROM Cout_ticket 
GROUP BY id_ticket;

-- Statistiques par type de coût
SELECT 
    type_cout,
    COUNT(*) as nombre,
    SUM(cout) as total,
    AVG(cout) as moyenne
FROM Cout_ticket 
GROUP BY type_cout;
```

### Avec HAVING (filtre sur agrégation)
```sql
-- Tickets avec total > 500
SELECT id_ticket, SUM(cout) as total
FROM Cout_ticket 
GROUP BY id_ticket 
HAVING total > 500;

-- Types avec plus de 5 occurrences
SELECT type_cout, COUNT(*) as nb
FROM Cout_ticket 
GROUP BY type_cout 
HAVING nb > 5;
```

## 3. REQUÊTES DE RECHERCHE AVANCÉE

### Filtres texte
```sql
-- Recherche partielle
SELECT * FROM Cout_ticket WHERE type_cout LIKE '%pièce%';
SELECT * FROM Cout_ticket WHERE type_cout LIKE 'Main%';

-- Recherche avec IN
SELECT * FROM Cout_ticket 
WHERE type_cout IN ('Main d\'oeuvre', 'Transport');

-- Recherche avec IS NULL / IS NOT NULL
SELECT * FROM Cout_ticket WHERE id_item IS NULL;
SELECT * FROM Cout_ticket WHERE itemtype IS NOT NULL;
```

### Sous-requêtes
```sql
-- Tickets avec coût supérieur à la moyenne
SELECT * FROM Cout_ticket 
WHERE cout > (SELECT AVG(cout) FROM Cout_ticket);

-- Tickets avec coût maximum par ticket
SELECT * FROM Cout_ticket 
WHERE (id_ticket, cout) IN (
    SELECT id_ticket, MAX(cout) 
    FROM Cout_ticket 
    GROUP BY id_ticket
);
```

## 4. REQUÊTES DE JOINTURE (si autres tables existent)

```sql
-- Avec table Ticket (hypothétique)
SELECT 
    c.*,
    t.numero_ticket,
    t.client_id
FROM Cout_ticket c
JOIN Ticket t ON c.id_ticket = t.id;

-- Jointure avec table Item (hypothétique)
SELECT 
    c.*,
    i.nom_item,
    i.prix_unitaire
FROM Cout_ticket c
LEFT JOIN Item i ON c.id_item = i.id;
```

## 5. REQUÊTES D'ORDRE ET DE PAGINATION

```sql
-- Pagination (offset + limit)
SELECT * FROM Cout_ticket 
ORDER BY id 
LIMIT 10 OFFSET 0;  -- Page 1

SELECT * FROM Cout_ticket 
ORDER BY id 
LIMIT 10 OFFSET 10; -- Page 2

-- Tri multiple
SELECT * FROM Cout_ticket 
ORDER BY id_ticket ASC, cout DESC;
```

## 6. REQUÊTES DE MAINTENANCE

```sql
-- Supprimer les doublons (garder l'ID le plus bas)
DELETE FROM Cout_ticket 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM Cout_ticket 
    GROUP BY id_ticket, type_cout, cout, id_item, itemtype
);

-- Mettre à jour les NULL
UPDATE Cout_ticket 
SET itemtype = 'Inconnu' 
WHERE itemtype IS NULL;

-- Exporter les données
SELECT id_ticket, type_cout, cout, date_creation 
FROM Cout_ticket 
WHERE date_creation >= date('now', '-30 days');
```

## 7. REQUÊTES SPÉCIFIQUES AUX DATES

```sql
-- Par mois
SELECT 
    strftime('%Y-%m', date_creation) as mois,
    COUNT(*) as nb,
    SUM(cout) as total
FROM Cout_ticket 
GROUP BY mois
ORDER BY mois DESC;

-- Par jour
SELECT 
    date(date_creation) as jour,
    COUNT(*) as nb,
    SUM(cout) as total
FROM Cout_ticket 
GROUP BY jour
ORDER BY jour DESC;

-- 7 derniers jours
SELECT * FROM Cout_ticket 
WHERE date_creation >= datetime('now', '-7 days');
```

Toutes ces requêtes couvrent l'essentiel des opérations possibles sur votre table !



Voici une sélection d'autres requêtes utiles et très courantes pour la gestion et l'analyse de vos coûts de tickets, adaptées pour enrichir votre interface Spring Data JPA.

Je les ai classées par cas d'usage (Statistiques, Filtres temporels, et Opérations de nettoyage).

---

## 1. Statistiques Globales et KPI (Dashboard)

Ces méthodes sont parfaites pour alimenter des graphiques ou des indicateurs de performance clés (KPI) sur un tableau de bord.

### Évolution des coûts par mois

Pour afficher un historique financier de l'année.

```java
@Query(value = """
    SELECT strftime('%Y-%m', date_creation) as mois, SUM(cout) as total 
    FROM cout_ticket 
    GROUP BY mois 
    ORDER BY mois DESC
""", nativeQuery = true)
List<Object[]> getMonthlyCostsEvolution();

```

### Top 5 des tickets les plus coûteux

Pour identifier rapidement les anomalies ou les tickets "gouffres financiers".

```java
@Query("""
    SELECT c.idTicket, SUM(c.cout) as totalCout 
    FROM CoutTicket c 
    GROUP BY c.idTicket 
    ORDER BY totalCout DESC
""")
List<Object[]> findTop5MostExpensiveTickets(org.springframework.data.domain.Pageable pageable);
// Note: Passez PageRequest.of(0, 5) en paramètre pour limiter à 5

```

### Répartition des coûts par Type de coût (`type_cout`)

Utile pour savoir où part l'argent (ex: 'glpi', 'closed', 'cout_saisi').

```java
@Query("""
    SELECT c.typeCout, SUM(c.cout), AVG(c.cout) 
    FROM CoutTicket c 
    GROUP BY c.typeCout
""")
List<Object[]> getCostDistributionByType();

```

---

## 2. Filtres Temporels (Reporting)

Dans la gestion de parc informatique (GLPI), on veut souvent analyser ce qu'il s'est passé sur une période précise.

### Coût total pour une période donnée (Entre deux dates)

```java
@Query("""
    SELECT SUM(c.cout) 
    FROM CoutTicket c 
    WHERE c.dateCreation BETWEEN :startDate AND :endDate
""")
Double getTotalCostBetweenDates(
    @Param("startDate") java.time.LocalDateTime startDate, 
    @Param("endDate") java.time.LocalDateTime endDate
);

```

### Obtenir les tickets qui ont eu des coûts aujourd'hui

Idéal pour un rapport quotidien automatisé.

```java
@Query(value = """
    SELECT * FROM cout_ticket 
    WHERE date(date_creation) = date('now')
""", nativeQuery = true)
List<CoutTicket> findTodayTicketsCosts();

```

---

## 3. Analyse par Équipement (`itemtype` et `id_item`)

Votre table lie des coûts à des types d'équipements (Ordinateurs, Imprimantes, etc.). Voici comment approfondir l'analyse.

### Coût total d'un matériel spécifique

Pour connaître le coût total de maintenance d'un ordinateur spécifique au cours de sa vie.

```java
@Query("""
    SELECT SUM(c.cout) 
    FROM CoutTicket c 
    WHERE c.itemtype = :itemtype AND c.idItem = :idItem
""")
Double getTotalCostBySpecificItem(
    @Param("itemtype") String itemtype, 
    @Param("idItem") Integer idItem
);

```

### Liste des équipements les plus coûteux

```java
@Query("""
    SELECT c.itemtype, c.idItem, SUM(c.cout) as total 
    FROM CoutTicket c 
    GROUP BY c.itemtype, c.idItem 
    ORDER BY total DESC
""")
List<Object[]> getMostExpensiveItems();

```

---

## 4. Requêtes de Maintenance (Nettoyage des données)

⚠️ **Attention :** Pour toutes ces requêtes de modification, n'oubliez pas d'ajouter les annotations `@Modifying` et `@Transactional`.

### Supprimer les lignes avec un coût nul ou négatif (Nettoyage d'erreurs)

```java
@Modifying
@Transactional
@Query("DELETE FROM CoutTicket c WHERE c.cout <= 0 OR c.cout IS NULL")
void deleteInvalidCosts();

```

### Supprimer l'historique des coûts d'un ticket spécifique

Si un ticket est supprimé dans GLPI, vous voulez sans doute nettoyer les coûts associés.

```java
@Modifying
@Transactional
@Query("DELETE FROM CoutTicket c WHERE c.idTicket = :idTicket")
void deleteAllCostsByTicketId(@Param("idTicket") Integer idTicket);

```

---

### 💡 Astuce de dev (Optionnel)

Pour récupérer les résultats des requêtes contenant des `SUM` ou des `GROUP BY` complexes (qui renvoient des `List<Object[]>`), vous pouvez créer des **Projections Spring Data JPA** (des interfaces Java avec des getters) pour mapper automatiquement vos résultats de manière plus propre que de manipuler des tableaux d'objets.