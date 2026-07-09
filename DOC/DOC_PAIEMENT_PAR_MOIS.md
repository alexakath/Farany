# Spécification — Page "Paiement par mois"

> **Statut : ✅ Implémenté** (2026-07-09). Le formulaire, le "Déroulé du paiement" et le "Récapitulatif trié par ancienneté" décrits ci-dessous sont en place dans `GenererPaiement.jsx`. Les 3 points de la section 8 ont été corrigés. Testé en conditions réelles (voir section 11). Un bug transverse de décalage de date à l'import CSV (impactant les montants calculés en amont par "Générer salaire par jour", donc indirectement le reliquat distribué par cette page) a aussi été découvert et corrigé — voir section 12.

## 0. Résumé (à lire en premier)

Cette page n'est **pas à créer de zéro**. Elle existe déjà, à moitié construite :

- Route : `/gen-paiement` (déclarée dans [`NewApp/src/App.jsx`](../NewApp/src/App.jsx) ligne 63)
- Fichier : [`NewApp/src/pages/frontoffice/GenererPaiement.jsx`](../NewApp/src/pages/frontoffice/GenererPaiement.jsx)
- Lien menu : "Generer paiement" dans [`NewApp/src/components/Navbar.jsx`](../NewApp/src/components/Navbar.jsx) ligne 14

Toute la **logique métier** (state `mois`/`annee`/`postePriorite`/`montant`, filtrage par mois, tri par poste prioritaire puis date d'ancienneté, calcul du "déjà payé" via l'historique des paiements, distribution du budget, appel à l'API de paiement) est déjà écrite et **correspond quasi exactement** aux règles demandées — vérifié ligne par ligne ci-dessous.

**Le problème : le composant n'a pas de `return (...)` JSX.** Il se termine juste après `if (loading) return <div>Loading...</div>;` (ligne 206-209 du fichier). Résultat : le lien de menu existe, mais mène à une page blanche. Personne ne peut utiliser cette fonctionnalité aujourd'hui.

**Le travail à faire = construire l'interface (formulaire + tableaux de résultats) autour de la logique existante**, plus quelques corrections/compléments listés en section 8 et 9. Ce document sert de cahier des charges pour cette réalisation.

---

## 1. Objectif fonctionnel

Permettre de distribuer un montant global entre plusieurs fiches de paie existantes d'un mois donné, en respectant un ordre de priorité (poste, puis ancienneté), sans jamais créer de nouvelle fiche de paie.

## 2. Modèle de données concerné (rappel — ne pas recréer, déjà en place)

L'app ne gère pas sa propre base : tout passe par l'API REST **Dolibarr** via [`NewApp/src/services/SalariesService.js`](../NewApp/src/services/SalariesService.js) et [`NewApp/src/services/UserService.js`](../NewApp/src/services/UserService.js). Champs utilisés :

**Fiche de paie ("salary")**
| Champ | Rôle |
|---|---|
| `id` / `ref` | Identifiant du salaire. **Attention** : l'app utilise `ref` (pas `id`) comme identifiant dans les appels de paiement (`/salaries/{ref}/payments`) — voir `ListeSalaire.jsx:77` et `GenererPaiement.jsx:145`. À réutiliser tel quel. |
| `fk_user` | Employé lié |
| `datesp` | Date début d'intervalle (timestamp Unix) — c'est le champ utilisé pour le filtre Mois/Année |
| `dateep` | Date fin d'intervalle (timestamp Unix) |
| `amount` | Montant du salaire dû |
| `label` | Libellé ("Période du ... au ...") |

**Paiement ("payment"), lié à un salaire**
| Champ | Rôle |
|---|---|
| `fk_salary` | Référence vers la fiche de paie (parfois objet `{rowid/id}`, parfois id brut — normaliser comme le fait déjà `getAllPaidByUserID`) |
| `amount` | Montant payé sur cette ligne |
| `datep` / `datepaye` | Date du paiement |

**Employé ("user")**
| Champ | Rôle |
|---|---|
| `job` | **C'est le champ "Poste"**. Chaîne libre, pas de table Poste dédiée. La liste déroulante "Poste prioritaire" doit être construite avec `[...new Set(users.map(u => u.job).filter(Boolean))]`, exactement comme le fait déjà `GenererPaiement.jsx:51`. |
| `lastname`, `firstname` | Identité affichée |

Il n'existe **aucun champ "statut"** stocké côté Dolibarr. Le statut (impayé / règlement commencé / payé) est **toujours recalculé côté front** en comparant `amount` du salaire à la somme des paiements liés — voir section 5.

## 3. Règles métier (vérifiées contre le code existant)

### 3.1 Aucune création de fiche de paie
✅ Déjà respecté : `GenererPaiement.jsx` ne fait jamais `SalariesService.create(...)`, seulement `SalariesService.createPaid(...)` sur des salaires déjà chargés via `getAll()`.

### 3.2 Filtre Mois / Année
Même convention que les autres pages de génération (`GenererSalAleaPopup.jsx`, `GenererSalJourPopup.jsx`) : deux `<input type="number">` liés à `mois` (1–12) et `annee` (ex. 2026). Pas de `<select>`.

⚠️ **Correction apportée** — la version initiale filtrait seulement sur le mois calendaire de `datesp` (date de début). Problème découvert en test réel : une fiche de paie `31/01/2024 → 28/02/2024` est la paie de février, mais son `datesp` tombe en janvier ⇒ elle était exclue du filtre "Février", et le reliquat de budget n'avait nulle part où aller (disparaissait silencieusement au lieu de tomber sur un employé non-prioritaire comme prévu par la règle #3). Corrigé en filtrant par **chevauchement de période** — la fiche est incluse dès que l'intervalle `[datesp, dateep]` touche le mois calendaire demandé, plutôt que d'exiger que `datesp` tombe pile dedans :
```js
const estDuMois = (datesp, dateep) => {
  if (!datesp) return false;
  const debut = new Date(Number(datesp) * 1000);
  const fin = dateep ? new Date(Number(dateep) * 1000) : debut;
  const cibleDebut = new Date(Number(paie.annee), Number(paie.mois) - 1, 1);
  const cibleFin = new Date(Number(paie.annee), Number(paie.mois), 0, 23, 59, 59);
  return debut <= cibleFin && fin >= cibleDebut;
};
```
Conséquence acceptée : une fiche à cheval sur deux mois (ex. `28/02 → 07/03`) peut apparaître dans le filtre des deux mois. Sans risque de double paiement : une fois soldée, elle apparaît simplement en `"Déjà soldé (import)"` si on la retrouve sous l'autre mois.

### 3.3 Poste prioritaire = critère, pas un filtre
✅ Déjà respecté : `postePriorite` n'exclut aucun salarié, il influence uniquement l'ordre de tri (`GenererPaiement.jsx:104-111`).

### 3.4 Ordre de priorité (poste puis date la plus ancienne)
✅ Déjà implémenté correctement :
```js
salairesDuMois.sort((a, b) => {
  if (paie.postePriorite) {
    const aPrio = jobOf(a.fk_user) === paie.postePriorite ? 0 : 1;
    const bPrio = jobOf(b.fk_user) === paie.postePriorite ? 0 : 1;
    if (aPrio !== bPrio) return aPrio - bPrio;
  }
  return Number(a.datesp) - Number(b.datesp);
});
```
Le tri par date compare des **timestamps numériques** (`Number(a.datesp)`), donc l'exemple donné dans la demande (01 → 05 → 07 → 16, et pas un tri texte qui casserait l'ordre) fonctionne correctement nativement — pas de bug de tri lexicographique à craindre.

### 3.5 Poste prioritaire sans salarié impayé → ignoré silencieusement
✅ Déjà respecté de fait : si aucun salaire du mois n'appartient au poste prioritaire, la branche `aPrio !== bPrio` ne s'active jamais et le tri retombe intégralement sur la date d'ancienneté pour tout le monde. Aucun code spécifique n'est nécessaire pour ce cas.

### 3.6 Le montant s'arrête dès qu'il est épuisé
✅ Déjà implémenté (`GenererPaiement.jsx:168-171`) : dès que `budget <= 0`, chaque salaire restant est marqué `"Non payé (budget épuisé)"` sans appel API.

### 3.7 Déduction des paiements déjà existants (import)
✅ Déjà implémenté (`GenererPaiement.jsx:125-135`) : `montantDejaPaye(sal)` additionne **tous** les paiements liés à ce `sal.id`/`sal.ref` (peu importe leur origine — import CSV ou paiement manuel), puis `reste = montantSalaire - dejaPaye`. Comme chaque fiche de paie correspond déjà à une seule période, sommer tous ses paiements équivaut à sommer "les paiements du mois" — cohérent avec l'exemple demandé (dû 300, déjà payé 200 → reste 100).

Si `reste <= 0`, le salarié est marqué `"Déjà soldé (import)"` et ignoré (0 consommé sur le budget) — correspond exactement à la règle "on ne paie que les fiches impayées ou en règlement partiel".

### 3.8 Exemples métier (pour tests de recette — voir section 10)
Les deux exemples de la demande (budget 350 avec salarié A à 300 puis B à 50 ; budget 1600 avec 2 techniciens prioritaires puis Rakotobe) sont directement rejouables avec l'algorithme actuel. Ils doivent servir de jeux de test manuels une fois l'UI branchée.

## 4. Statuts affichés (à construire — pas encore dans l'UI)

Deux niveaux de statut à distinguer, à ne pas confondre :

**a) Statut permanent de la fiche de paie** (indépendant de cette page, utile pour toute liste de salaires) :
| Condition | Libellé | Classe CSS existante à réutiliser |
|---|---|---|
| `dejaPaye === 0` | Impayé | `.status-badge.overdue` (rouge) — définie dans [`ListeSalaire.css`](../NewApp/src/assets/page/ListeSalaire.css) mais jamais consommée nulle part actuellement |
| `0 < dejaPaye < montantSalaire` | Règlement commencé | `.status-badge.pending` (ambre) |
| `dejaPaye >= montantSalaire` | Payé | `.status-badge.paid` (vert) |

**b) Statut de l'opération de paiement en cours** (propre à cette page, déjà généré par le code) : `"Déjà soldé (import)"`, `"Non payé (budget épuisé)"`, `"Soldé"`, `"Partiel"` (voir `GenererPaiement.jsx:164-190`).

Les deux affichages demandés en section 7 de la spec utilisateur ont besoin de statuts différents : le **déroulé du paiement** utilise (b), le **récapitulatif final** peut utiliser (a) recalculé sur `dejaPaye` + `montantPaye` de l'opération.

## 5. Interface à construire

### 5.1 Barre de filtres/formulaire (haut de page)
Reprendre le style des autres pages (fond `#272c68`, `border-radius: 8px`, `display:flex; gap:15px`, voir n'importe quelle page de génération) :

| Champ | Type | Lié à |
|---|---|---|
| Mois | `<input type="number" min="1" max="12">` | `paie.mois` |
| Année | `<input type="number">` | `paie.annee` |
| Poste prioritaire | `<select>` rempli avec `uniqueJobs` (déjà calculé ligne 51), option vide = "Aucun" | `paie.postePriorite` |
| Montant à payer | `<input type="number" step="0.01">` | `paie.montant` |
| Bouton | `<button onClick={handlePayer} disabled={paying}>Payer</button>` | appelle `handlePayer` (déjà écrit) |

Les filtres existants (`filters.searchName/gender/job/minHours/maxHours`) sont déjà présents dans le state mais ne servent qu'à restreindre la liste d'employés éligibles — optionnel de les exposer dans l'UI ; ce ne sont pas les filtres Mois/Année demandés par le cahier des charges (qui eux vivent dans `paie`, pas `filters`). Ne pas les confondre.

### 5.2 Tableau "Déroulé du paiement" (ordre de traitement)
Alimenté directement par `resultats` (état déjà présent), **dans l'ordre où le tableau a été rempli** (= ordre de paiement réel, poste prioritaire puis ancienneté) :

| # | Salarié | Poste | Période | Montant salaire | Déjà payé (avant) | Montant payé (cette opération) | Reste après | Statut |
|---|---|---|---|---|---|---|---|---|

Colonnes disponibles directement dans chaque élément de `resultats` : `employe`, `poste`, `periode`, `montantSalaire`, `dejaPaye`, `montantPaye`, `resteApres`, `statut`.

### 5.3 Tableau "Récapitulatif trié par ancienneté" + total
Requis par la demande (section 7) : les mêmes salariés, **re-triés uniquement par date** (indépendamment du poste prioritaire), avec pour chacun Montant du salaire / Montant payé / Reste à payer, et une ligne de total des montants de salaire.

⚠️ Ce tri nécessite un timestamp brut, qui n'est **pas encore présent** dans l'objet `ligne` (seul `periode`, une chaîne déjà formatée, existe). **À ajouter** dans `ligne` (voir section 8, point 2) : `datesp: Number(sal.datesp)`.

```js
const parAnciennete = [...resultats].sort((a, b) => a.datesp - b.datesp);
const totalSalaires = parAnciennete.reduce((s, r) => s + r.montantSalaire, 0);
```

### 5.4 Style
Réutiliser tel quel :
- `.status-badge` / `.paid` / `.pending` / `.overdue` de [`ListeSalaire.css`](../NewApp/src/assets/page/ListeSalaire.css)
- `.payment-summary` / `.summary-row` / `.summary-row.total` de [`PaidSalaire.css`](../NewApp/src/assets/page/PaidSalaire.css) pour la ligne de total
- Créer `NewApp/src/assets/page/GenererPaiement.css` pour la mise en page propre à cette page (filtre bar + tableaux), en s'inspirant de `ListeSalaire.css` pour `.table-wrapper`.

## 6. Plan d'implémentation

1. **`GenererPaiement.jsx`** — compléter le `return` JSX manquant (formulaire section 5.1 + deux tableaux 5.2/5.3), importer et appliquer le nouveau CSS, brancher `error`/`paying` à l'affichage (spinner/disabled déjà gérés dans le state).
2. **`GenererPaiement.jsx`, dans la construction de `ligne` (ligne ~150-160)** — ajouter `datesp: Number(sal.datesp)` pour permettre le tri par ancienneté du récapitulatif (section 5.3).
3. **`GenererPaiement.css`** (nouveau fichier) — mise en page filtre + tableaux.
4. **`Navbar.jsx` ligne 14** — renommer le libellé `"Generer paiement"` en `"Paiement par mois"` pour correspondre au nom demandé (la route `/gen-paiement` peut rester inchangée, ou être renommée en `/paiement-par-mois` si préféré — impact minime, à trancher en implémentation).
5. **Voir section 9** — corriger/vérifier le bug `total` vs `amount` avant de considérer la page prête pour la production.

Aucune modification n'est nécessaire côté `SalariesService.js` pour la logique de distribution elle-même : `getAll`, `getAllPaid`, `createPaid` couvrent déjà le besoin.

## 7. Exemples de recette (à rejouer manuellement une fois l'UI en place)

**Exemple simple** — Budget 350, salarié A doit 300 (le plus ancien), salarié B suit :
- A reçoit 300 (statut "Soldé", reste après = 0)
- B reçoit 50 (statut "Partiel")
- Les suivants reçoivent 0 (statut "Non payé (budget épuisé)")

**Exemple avec poste prioritaire** — Poste prioritaire = Technicien, budget 1600, Rasoabe et Ranjenja (Techniciens), Rakotobe (Comptable) :
- Entre Rasoabe et Ranjenja, celui avec la date de début la plus ancienne est traité en premier.
- Une fois les deux Techniciens traités, le reliquat va à Rakotobe.
- Le tableau "Déroulé du paiement" doit montrer cet ordre (Technicien le plus ancien → Technicien suivant → Rakotobe), tandis que le "Récapitulatif trié par ancienneté" peut afficher un ordre différent si Rakotobe a en réalité une date plus ancienne que l'un des deux Techniciens — c'est voulu, ce sont deux vues différentes (traitement vs ancienneté pure).

## 8. Points d'attention / écarts corrigés dans le code existant

1. ✅ **Corrigé** — Tolérance aux erreurs partielles pendant la boucle de paiement. Chaque appel `createPaid` est maintenant dans un `try/catch` par itération ; en cas d'échec, la ligne est poussée avec le statut `"Erreur"` (badge rouge, message d'erreur dans le `title` du badge) au lieu de faire perdre la trace des paiements déjà passés. `setResultats` est appelé à chaque itération, pas seulement à la fin.
2. ✅ **Corrigé** — `datesp: Number(sal.datesp)` ajouté dans l'objet `ligne`, utilisé pour construire `parAnciennete` (tri du récapitulatif).
3. ✅ **Corrigé** — Validation `Number(paie.montant) <= 0` ajoutée à côté de la vérification de champ vide.

## 9. Bug pré-existant à connaître (hors périmètre strict, mais impacte cette page)

Dans [`SalariesService.js:103-105`](../NewApp/src/services/SalariesService.js) :
```js
createPaid: async (salaryId, paymentData) => {
  const amountToPay = Number(paymentData.total); // ⚠️ lit `paymentData.total`
```
Or **aucun appelant** ne fournit de champ `total` — `GenererPaiement.jsx`, `PaidSalaire.jsx` et `Import.js` envoient tous un champ `amount`. Résultat : `amountToPay` vaut toujours `NaN`, et la vérification de garde-fou anti-dépassement dans `CheckPaid` (`amountToPay > remainingAmount`) ne se déclenche donc **jamais** (`NaN > x` est toujours `false`) — c'est un garde-fou mort sur tout le module paiement, pas seulement sur cette nouvelle page.

Cela n'empêche pas la page "Paiement par mois" de fonctionner correctement, car elle plafonne déjà elle-même `aPayer` à `Math.min(budget, reste)` avant l'appel API (donc pas de dépassement possible par construction). Mais si une correction du module paiement est faite un jour (remplacer `paymentData.total` par `paymentData.amount` ligne 105), il faut la faire de façon transverse — testée aussi sur `PaidSalaire.jsx` et `Import.js` — pas seulement pour cette page.

## 10. Checklist de tests avant mise en production

- [ ] Aucun salaire pour le mois/année choisis → message d'erreur clair, pas de crash
- [ ] Poste prioritaire sélectionné mais aucun salarié de ce poste n'a de reste à payer ce mois → distribution normale par ancienneté sur les autres
- [ ] Budget supérieur à la somme totale due → tous les salaires soldés, budget restant simplement non utilisé (pas d'erreur)
- [ ] Budget = 0 ou vide → validation bloque avant tout appel API
- [ ] Un salarié déjà entièrement payé (import) apparaît avec le statut "Déjà soldé (import)" et ne consomme aucun budget
- [ ] Deux salariés avec exactement la même `datesp` → ordre stable (pas de crash, ordre déterministe même s'il n'est pas spécifié par la demande)
- [ ] Le total affiché dans le récapitulatif correspond bien à la somme des `montantSalaire` des lignes listées, pas à la somme des montants payés
- [ ] Rechargement de la page après paiement : les nouveaux paiements sont bien visibles depuis `ListeSalaire.jsx` / `PaidSalaire.jsx` (cohérence inter-pages)

## 11. Vérification effectuée (2026-07-09)

- `npx eslint` sur `GenererPaiement.jsx` et `Navbar.jsx` : aucune erreur.
- `npm run build` : build de production OK, aucune erreur de compilation.
- Test en conditions réelles contre l'instance Dolibarr locale du poste de dev (données existantes) :
  - **Mois=3/2026, aucun poste prioritaire, montant=1000** → 1 seul salaire du mois (Rakotobe, déjà réglé par import) → correctement affiché `"Déjà soldé (import)"`, aucun paiement inutile créé.
  - **Mois=2/2026, poste prioritaire=Technicien, montant=300** → reproduit l'exemple de la section 7 : Rasoabe (Technicien, impayé, 677.56 €) traité en premier malgré une date identique à Rakotobe (Comptable, déjà soldé), reçoit 300 € (statut "Partiel", reste 377.56 €) ; Rakotobe (non prioritaire, déjà soldé) apparaît avec 0 € payé. Le récapitulatif affiche le total correct (1567.56 € de salaires, 1190.00 € payés, 377.56 € restants pour 2 salariés). Aucune erreur console.
  - **Mois=2/2024, poste prioritaire=Technicien, montant=1600** (après correction du filtre Mois/Année) → les 7 fiches Techniciens de février (déjà soldées par un test précédent de l'utilisateur) apparaissent en `"Déjà soldé (import)"`, et le reliquat de budget descend correctement jusqu'à Rakotobe (Comptable, fiche `31/01/2024 → 28/02/2024`, reste dû 300 €) qui est maintenant bien inclus dans le filtre "Février" grâce au chevauchement de période, et reçoit les 300 € restants (statut "Soldé"). C'est ce test qui a révélé puis validé la correction du filtre Mois/Année (section 3.2).
  - Chaque paiement de test créé pendant ces vérifications (300 € sur Rasoabe, puis 300 € sur Rakotobe) a été supprimé après coup via `DELETE /salaries/{id}/payments` pour ne pas laisser de données de test dans la base.
- Capture d'écran de référence : voir historique de session (page sombre cohérente avec le reste de l'app, badges de statut colorés, tableau "Déroulé du paiement" + "Récapitulatif trié par ancienneté" avec ligne de total).

## 12. Bug transverse découvert et corrigé : décalage de -1 jour à l'import CSV

Ce bug n'est **pas dans `GenererPaiement.jsx`**, mais dans l'import (`Import.js`). Il est documenté ici parce que c'est un test de la page "Paiement par mois" (section 11, cas Février 2024) qui l'a révélé : un reliquat attendu à 50 € s'affichait à 70 €.

### 12.1 Symptôme
Scénario recette complet fourni par l'utilisateur (réinitialisation → import de 2 CSV → insertion jours fériés 14/02 et 22/02/2024 → "Générer salaire collectif" Technicien 38-45h → "Générer salaire par jour" Février 2024 à 20€/jour, majoration 100% → "Générer paiement" Février 2024, poste Technicien, 1600€). Résultat attendu par l'utilisateur : total Techniciens = 1550€, reliquat Rakotobe = 50€. Résultat observé : total Techniciens = 1530€, reliquat = 70€. Écart constant de 20€.

### 12.2 Cause racine
Chaque ligne importée depuis le CSV "Feuille 2" se retrouvait stockée dans Dolibarr avec `datesp`/`dateep` décalés de **-1 jour** par rapport aux dates du CSV (ex. CSV `10/02/2024 → 20/02/2024` stocké comme `09/02/2024 → 19/02/2024`). Vérifié en comparant systématiquement les 8 lignes du CSV aux dates réellement renvoyées par l'API Dolibarr — décalage présent sur les 8 lignes, mais absent sur les fiches créées par les formulaires de génération manuelle (`salaire collectif`, `salaire par jour`), qui ne passent pas par ce chemin de code.

Origine, dans [`Import.js:140-152`](../NewApp/src/services/ImportReset/Import.js) (avant correction) :
```js
const [d, m, y] = clean.split("/");
return Math.floor(new Date(`${y}-${m}-${d}T00:00:00`).getTime() / 1000);
```
Le suffixe `T00:00:00` force une interprétation en **heure locale du navigateur**. Poste de dev réglé sur `East Africa Standard Time` (UTC+3, vérifié via `Get-TimeZone`). Dolibarr tronque les timestamps reçus en date calendaire côté **UTC** : minuit local (UTC+3) = 21h la veille en UTC → Dolibarr enregistre la veille.

### 12.3 Propagation jusqu'au "reste" affiché par cette page
"Générer salaire par jour" (`calculerSalaireAlea`/`getJourPasSalaire` dans `SalariesService.js`) calcule les jours du mois non couverts par les fiches déjà existantes, à partir de leurs `datesp`/`dateep` **tels que stockés**. Avec la fiche de Rajenja décalée (`09/02` au lieu de `10/02`), le jour du 9 février était compté à tort comme "déjà couvert", ce qui a fait perdre 1 jour normal (20€) dans le calcul de son salaire du mois : 360€ généré au lieu de 380€ attendus. C'est ce 20€ manquant, répercuté sur le total des Techniciens (1530 au lieu de 1550), qui a mécaniquement réduit de 20€ le reliquat versé à Rakotobe par "Paiement par mois" (70 au lieu de 50). **La logique de distribution de cette page elle-même n'a pas de défaut** — elle a correctement réparti un total (déjà faux en amont) sur le budget donné.

### 12.4 Correctif appliqué
[`Import.js:140-155`](../NewApp/src/services/ImportReset/Import.js) — remplacement du parsing en heure locale par `Date.UTC(...)`, qui donne directement la date calendaire voulue indépendamment du fuseau horaire du navigateur :
```js
const toUnixTimestamp = (dateStr) => {
  if (!dateStr) return null;
  const clean = dateStr.trim();
  if (/^\d{2}\/\d{2}\/\d{2}$/.test(clean)) {
    const [d, m, y] = clean.split("/");
    return Math.floor(Date.UTC(2000 + Number(y), Number(m) - 1, Number(d)) / 1000);
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    const [d, m, y] = clean.split("/");
    return Math.floor(Date.UTC(Number(y), Number(m) - 1, Number(d)) / 1000);
  }
  return null;
};
```

### 12.5 Vérification
Fiche de salaire jetable créée directement via l'API avec la nouvelle valeur (`Date.UTC(2024,1,10)`), relue, puis affichée avec `new Date(datesp*1000).toLocaleDateString("fr-FR")` (code identique à celui utilisé par l'app) → résultat `10/02/2024`, conforme au CSV. Fiche de test supprimée après vérification, aucune donnée laissée en base.

### 12.6 Ce qui reste à faire (hors périmètre de cette session)
Les données déjà importées **avant** ce correctif (celles du scénario de recette de l'utilisateur) gardent leurs dates décalées et leurs montants dérivés (360€ au lieu de 380€ pour la fiche "salaire par jour" de Rajenja) tant qu'elles ne sont pas régénérées. La page `/reset` purge des données de façon **irréversible** — elle n'a pas été déclenchée dans le cadre de cette vérification. Pour obtenir des données actuelles cohérentes avec le correctif, l'utilisateur doit rejouer manuellement : réinitialisation → import → jours fériés → salaire collectif → salaire par jour → paiement.
